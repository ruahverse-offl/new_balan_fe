import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, Plus, Pencil, Trash2, Search, RefreshCw, Users, X } from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import { getRoles, createRole, updateRole, deleteRole } from '../../services/rolesApi';
import './AdminCatalogTabs.css';
import './AccessControlTab.css';

const PAGE = 100;

async function fetchAllRoles() {
  let offset = 0;
  const all = [];
  for (;;) {
    const res = await getRoles({ limit: PAGE, offset, sort_by: 'name', sort_order: 'asc' });
    const batch = res.items || [];
    all.push(...batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

const PROTECTED_ROLE_NAMES = new Set([
  'PUBLIC',
  'CUSTOMER',
  'ADMIN',
  'DEV_ADMIN',
  'MANAGER',
  'DELIVERY',
  'DELIVERY_AGENT',
  'DEV',
]);

/**
 * Role definitions only. Module access is edited under **Role × module access** (new RBAC matrix).
 */
const AccessControlTab = ({ showNotify, onRolesInvalidate }) => {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [roles, setRoles] = useState([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [refreshBusy, setRefreshBusy] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState('add');
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  const loadAll = useCallback(
    async (opts = {}) => {
      const silent = opts.silent === true;
      const spinRefresh = opts.spinRefresh === true;
      if (!silent) setLoading(true);
      if (spinRefresh) setRefreshBusy(true);
      setForbidden(false);
      try {
        const r = await fetchAllRoles();
        setRoles(r.filter((x) => x && !x.is_deleted));
      } catch (e) {
        if (e?.status === 403) {
          setForbidden(true);
        } else {
          showNotify?.(e?.message || 'Failed to load roles', 'error');
        }
      } finally {
        if (!silent) setLoading(false);
        if (spinRefresh) setRefreshBusy(false);
      }
    },
    [showNotify],
  );

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredRoles = useMemo(() => {
    const q = (roleSearch || '').trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q),
    );
  }, [roles, roleSearch]);

  const hasRoleSearchFilter = Boolean((roleSearch || '').trim());

  const openAddRole = () => {
    setRoleModalMode('add');
    setEditingRole(null);
    setRoleForm({ name: '', description: '' });
    setShowRoleModal(true);
  };

  const openEditRole = (role) => {
    setRoleModalMode('edit');
    setEditingRole(role);
    setRoleForm({ name: role.name || '', description: role.description || '' });
    setShowRoleModal(true);
  };

  const submitRole = async (e) => {
    e.preventDefault();
    const name = String(roleForm.name || '').trim();
    if (!name) {
      showNotify?.('Role name is required', 'error');
      return;
    }
    try {
      if (roleModalMode === 'add') {
        const created = await createRole({ name, description: roleForm.description?.trim() || null });
        setRoles((prev) => [...prev, created].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        showNotify?.('Role created', 'success');
      } else if (editingRole) {
        const updated = await updateRole(editingRole.id, {
          name,
          description: roleForm.description?.trim() || null,
        });
        setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        showNotify?.('Role updated', 'success');
      }
      setShowRoleModal(false);
      onRolesInvalidate?.();
    } catch (err) {
      showNotify?.(err?.message || 'Role save failed', 'error');
    }
  };

  const removeRole = async (role) => {
    const uname = (role.name || '').toUpperCase();
    if (PROTECTED_ROLE_NAMES.has(uname)) {
      showNotify?.('This system role cannot be deleted.', 'error');
      return;
    }
    if (!window.confirm(`Delete role "${role.name}"? Users still assigned to it may lose access until reassigned.`)) return;
    try {
      await deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      showNotify?.('Role deleted', 'success');
      onRolesInvalidate?.();
    } catch (err) {
      showNotify?.(err?.message || 'Delete failed', 'error');
    }
  };

  if (forbidden) {
    return (
      <div className="access-control-tab-stack animate-slide-up">
        <div className="admin-table-card catalog-tab-card">
          <div className="catalog-empty access-control-forbidden-catalog">
            <div className="access-control-forbidden-icon" aria-hidden>
              <Shield size={40} strokeWidth={1.5} />
            </div>
            <p className="catalog-empty-title">Access restricted</p>
            <p>You don&apos;t have permission to manage roles.</p>
            <p className="access-control-forbidden-hint">Typical code: ROLE_VIEW.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="access-control-tab-stack animate-slide-up">
        <div className="admin-table-card catalog-tab-card access-control-loading-card">
          <div className="catalog-loading">
            <InlineSpinner size={32} />
            <div>
              <p className="access-control-loading-title">Loading roles</p>
              <p className="access-control-loading-sub">Fetching role list…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="access-control-tab-stack access-control-tab animate-slide-up">
      <div className="admin-table-card catalog-tab-card access-control-intro-card">
        <div className="catalog-tab-header access-control-hero-header">
          <div className="access-control-hero-row">
            <div className="access-control-hero-icon-wrap" aria-hidden>
              <Shield size={28} strokeWidth={2} />
            </div>
            <div className="access-control-hero-copy">
              <h2 className="catalog-tab-title">Roles</h2>
              <p className="catalog-tab-subtitle">
                Create and edit role names. Use <strong>Role × module access</strong> to grant API and sidebar access per role.
              </p>
            </div>
          </div>
          <div className="access-kpi-strip" aria-label="Overview">
            <div className="access-kpi-card">
              <Users className="access-kpi-icon" size={20} aria-hidden />
              <div className="access-kpi-text">
                <span className="access-kpi-value">{roles.length}</span>
                <span className="access-kpi-label">Roles</span>
              </div>
            </div>
          </div>
        </div>
        <div className="catalog-tab-toolbar">
          <span className="catalog-tab-meta">Reload if you changed data in another session.</span>
          <button
            type="button"
            className="btn-secondary access-control-refresh-top"
            onClick={() => loadAll({ silent: true, spinRefresh: true })}
            disabled={refreshBusy}
            title="Reload"
          >
            <RefreshCw size={18} className={refreshBusy ? 'animate-spin' : ''} aria-hidden />
            {refreshBusy ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <section
        className="admin-table-card catalog-tab-card access-control-panel access-control-panel--roles"
        aria-labelledby="ac-roles-title"
      >
        <div className="catalog-tab-header access-control-section-header">
          <div className="access-control-section-title-row">
            <span className="access-control-step" aria-hidden>
              1
            </span>
            <div>
              <h2 id="ac-roles-title" className="catalog-tab-title">
                Roles
              </h2>
              <p className="catalog-tab-subtitle">System roles cannot be deleted. Assign users under Manage Staff.</p>
            </div>
          </div>
        </div>

        <div className="catalog-tab-toolbar">
          <div className="table-search">
            <Search size={18} aria-hidden />
            <input
              type="search"
              placeholder="Search roles by name or description…"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setRoleSearch('');
                }
              }}
              aria-label="Filter roles"
            />
          </div>
          <button type="button" className="btn-add" onClick={openAddRole}>
            <Plus size={18} /> New role
          </button>
          {filteredRoles.length > 0 && (
            <span className="catalog-tab-meta">
              {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
              {hasRoleSearchFilter ? ' (filtered)' : ''}
            </span>
          )}
        </div>

        <div className="access-control-roles-wrap">
          {filteredRoles.length === 0 ? (
            <div className="catalog-empty access-control-roles-empty">
              <Shield className="access-control-empty-icon" size={40} aria-hidden />
              <p className="catalog-empty-title">No roles to show</p>
              <p>
                {roles.length === 0 && !hasRoleSearchFilter
                  ? 'No roles returned from the server.'
                  : 'Try another search term.'}
              </p>
            </div>
          ) : (
            <div className="access-control-roles-scroll">
              <table className="admin-table catalog-table access-control-role-table">
                <thead>
                  <tr>
                    <th scope="col" className="access-role-col-role">
                      Role
                    </th>
                    <th scope="col" className="access-role-col-note">
                      Description
                    </th>
                    <th scope="col" className="access-role-col-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((r) => {
                    const isSys = PROTECTED_ROLE_NAMES.has((r.name || '').toUpperCase());
                    return (
                      <tr key={r.id}>
                        <td data-label="Role">
                          <strong>{r.name}</strong>
                        </td>
                        <td data-label="Description" className="access-role-desc-cell">
                          {r.description || '—'}
                        </td>
                        <td data-label="Actions" className="actions">
                          <button type="button" className="action-btn" title="Edit" onClick={() => openEditRole(r)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn delete"
                            title={isSys ? 'Cannot delete system role' : 'Delete role'}
                            disabled={isSys}
                            onClick={() => removeRole(r)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showRoleModal && (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="access-role-modal-title">
          <div className="admin-modal compact-modal access-control-modal">
            <div className="modal-header">
              <h3 id="access-role-modal-title">{roleModalMode === 'add' ? 'New role' : 'Edit role'}</h3>
              <button type="button" onClick={() => setShowRoleModal(false)} className="modal-close" aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={submitRole} className="modal-form">
              <div className="form-group">
                <label htmlFor="ac-role-name">Name</label>
                <input
                  id="ac-role-name"
                  required
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="PHARMACIST"
                  className="access-input-mono"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ac-role-desc">Description</label>
                <textarea
                  id="ac-role-desc"
                  rows={3}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="What this role is for (optional)"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowRoleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-add">
                  Save role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControlTab;
