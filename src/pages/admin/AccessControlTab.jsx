import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shield, Plus, Pencil, Trash2, Search, RefreshCw, X, Lock, Tag } from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import ActionOverlay from '../../components/admin/ActionOverlay';
import { useActionLock } from '../../hooks/useActionLock';
import { getRoles, createRole, updateRole, deleteRole } from '../../services/rolesApi';
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
  'PUBLIC', 'CUSTOMER', 'ADMIN', 'DEV_ADMIN',
  'MANAGER', 'DELIVERY', 'DELIVERY_AGENT', 'DEV',
]);

const ROLE_COLOR_MAP = {
  ADMIN: 'role-pill--red',
  DEV_ADMIN: 'role-pill--red',
  DEV: 'role-pill--purple',
  MANAGER: 'role-pill--orange',
  DELIVERY: 'role-pill--teal',
  DELIVERY_AGENT: 'role-pill--teal',
  CUSTOMER: 'role-pill--blue',
  PUBLIC: 'role-pill--gray',
};

function getRoleColor(name) {
  return ROLE_COLOR_MAP[(name || '').toUpperCase()] || 'role-pill--indigo';
}

const AccessControlTab = ({ showNotify, onRolesInvalidate }) => {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [roles, setRoles] = useState([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [refreshBusy, setRefreshBusy] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const { locked, message: lockMsg, run: lockRun } = useActionLock();

  const loadAll = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    const spinRefresh = opts.spinRefresh === true;
    if (!silent) setLoading(true);
    if (spinRefresh) setRefreshBusy(true);
    setForbidden(false);
    try {
      const r = await fetchAllRoles();
      setRoles(r.filter((x) => x && !x.is_deleted));
    } catch (e) {
      if (e?.status === 403) setForbidden(true);
      else showNotify?.(e?.message || 'Failed to load roles', 'error');
    } finally {
      if (!silent) setLoading(false);
      if (spinRefresh) setRefreshBusy(false);
    }
  }, [showNotify]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const filtered = useMemo(() => {
    const q = (roleSearch || '').trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) => (r.name || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q),
    );
  }, [roles, roleSearch]);

  const openAdd = () => {
    setModalMode('add');
    setEditingRole(null);
    setRoleForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (role) => {
    setModalMode('edit');
    setEditingRole(role);
    setRoleForm({ name: role.name || '', description: role.description || '' });
    setShowModal(true);
  };

  const submitRole = async (e) => {
    e.preventDefault();
    const name = String(roleForm.name || '').trim();
    if (!name) { showNotify?.('Role name is required', 'error'); return; }
    setSaving(true);
    await lockRun(async () => {
      try {
        if (modalMode === 'add') {
          const created = await createRole({ name, description: roleForm.description?.trim() || null });
          setRoles((prev) => [...prev, created].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
          showNotify?.('Role created', 'success');
        } else if (editingRole) {
          const updated = await updateRole(editingRole.id, { name, description: roleForm.description?.trim() || null });
          setRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          showNotify?.('Role updated', 'success');
        }
        setShowModal(false);
        onRolesInvalidate?.();
      } catch (err) {
        showNotify?.(err?.message || 'Save failed', 'error');
      } finally {
        setSaving(false);
      }
    }, modalMode === 'add' ? 'Creating role…' : 'Saving role…');
  };

  const removeRole = async (role) => {
    const uname = (role.name || '').toUpperCase();
    if (PROTECTED_ROLE_NAMES.has(uname)) {
      showNotify?.('System roles cannot be deleted.', 'error');
      return;
    }
    if (!globalThis.confirm(`Delete role "${role.name}"?\n\nUsers assigned this role may lose access until reassigned.`)) return;
    await lockRun(async () => {
      try {
        await deleteRole(role.id);
        setRoles((prev) => prev.filter((r) => r.id !== role.id));
        showNotify?.('Role deleted', 'success');
        onRolesInvalidate?.();
      } catch (err) {
        showNotify?.(err?.message || 'Delete failed', 'error');
      }
    }, 'Deleting role…');
  };

  if (forbidden) {
    return (
      <div className="rbac-page animate-slide-up">
        <div className="rbac-card rbac-forbidden">
          <div className="rbac-forbidden-icon"><Shield size={36} strokeWidth={1.5} /></div>
          <h3>Access restricted</h3>
          <p>You don't have permission to manage roles.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rbac-page animate-slide-up">
        <div className="rbac-card rbac-loading-card">
          <InlineSpinner size={28} />
          <p>Loading roles…</p>
        </div>
      </div>
    );
  }

  const sysCount = roles.filter((r) => PROTECTED_ROLE_NAMES.has((r.name || '').toUpperCase())).length;
  const customCount = roles.length - sysCount;

  return (
    <div className="rbac-page animate-slide-up" style={{ position: 'relative' }}>
      <ActionOverlay show={locked} message={lockMsg} />
      <div className="rbac-card">
        {/* Header */}
        <div className="rbac-card-header">
          <div className="rbac-header-left">
            <div className="rbac-header-icon">
              <Shield size={22} strokeWidth={2} />
            </div>
            <div>
              <p className="rbac-subtitle rbac-subtitle--solo">
                Create and manage roles. Assign module access under <strong>Role × module access</strong>.
              </p>
            </div>
          </div>
          <div className="rbac-header-stats">
            <div className="rbac-stat">
              <span className="rbac-stat-value">{roles.length}</span>
              <span className="rbac-stat-label">Total</span>
            </div>
            <div className="rbac-stat-divider" />
            <div className="rbac-stat">
              <span className="rbac-stat-value">{sysCount}</span>
              <span className="rbac-stat-label">System</span>
            </div>
            <div className="rbac-stat-divider" />
            <div className="rbac-stat">
              <span className="rbac-stat-value">{customCount}</span>
              <span className="rbac-stat-label">Custom</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="rbac-toolbar">
          <div className="rbac-search">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search roles…"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setRoleSearch('')}
            />
          </div>
          <div className="rbac-toolbar-actions">
            <button
              type="button"
              className="rbac-btn rbac-btn--ghost"
              onClick={() => loadAll({ silent: true, spinRefresh: true })}
              disabled={refreshBusy}
              title="Refresh"
            >
              <RefreshCw size={15} className={refreshBusy ? 'spinning' : ''} />
              {refreshBusy ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" className="rbac-btn rbac-btn--primary" onClick={openAdd}>
              <Plus size={15} /> New role
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rbac-table-wrap">
          {filtered.length === 0 ? (
            <div className="rbac-empty">
              <Shield size={36} strokeWidth={1.2} />
              <p className="rbac-empty-title">No roles found</p>
              <p className="rbac-empty-sub">
                {roles.length === 0 ? 'No roles returned from the server.' : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <table className="rbac-table">
              <thead>
                <tr>
                  <th>Role name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="rbac-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isSys = PROTECTED_ROLE_NAMES.has((r.name || '').toUpperCase());
                  return (
                    <tr key={r.id} className={isSys ? 'rbac-row--system' : ''}>
                      <td>
                        <div className="rbac-role-name-cell">
                          <span className={`role-pill ${getRoleColor(r.name)}`}>
                            <Tag size={11} />
                            {r.name}
                          </span>
                        </div>
                      </td>
                      <td className="rbac-desc-cell">
                        {r.description || <span className="rbac-muted">—</span>}
                      </td>
                      <td>
                        {isSys ? (
                          <span className="rbac-badge rbac-badge--system">
                            <Lock size={10} /> System
                          </span>
                        ) : (
                          <span className="rbac-badge rbac-badge--custom">Custom</span>
                        )}
                      </td>
                      <td className="rbac-col-actions">
                        <div className="rbac-action-group">
                          <button
                            type="button"
                            className="rbac-icon-btn"
                            title="Edit"
                            onClick={() => openEdit(r)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="rbac-icon-btn rbac-icon-btn--danger"
                            title={isSys ? 'Cannot delete system role' : 'Delete role'}
                            disabled={isSys}
                            onClick={() => removeRole(r)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="rbac-table-footer">
            <span className="rbac-muted">
              {filtered.length} role{filtered.length !== 1 ? 's' : ''}
              {(roleSearch || '').trim() ? ' (filtered)' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="rbac-modal-overlay" role="dialog" aria-modal="true">
          <div className="rbac-modal">
            <div className="rbac-modal-header">
              <div className="rbac-modal-title-row">
                <div className="rbac-modal-icon"><Shield size={16} /></div>
                <h3>{modalMode === 'add' ? 'New role' : 'Edit role'}</h3>
              </div>
              <button type="button" className="rbac-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submitRole} className="rbac-modal-form">
              <div className="rbac-field">
                <label htmlFor="role-name">Role name</label>
                <input
                  id="role-name"
                  required
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  placeholder="e.g. PHARMACIST"
                  className="rbac-input rbac-input--mono"
                  autoFocus
                />
                <span className="rbac-field-hint">Use UPPER_SNAKE_CASE (e.g. PHARMACIST, LAB_TECH)</span>
              </div>
              <div className="rbac-field">
                <label htmlFor="role-desc">Description <span className="rbac-optional">(optional)</span></label>
                <textarea
                  id="role-desc"
                  rows={3}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="What this role is for…"
                  className="rbac-input"
                />
              </div>
              <div className="rbac-modal-footer">
                <button type="button" className="rbac-btn rbac-btn--ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="rbac-btn rbac-btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : modalMode === 'add' ? 'Create role' : 'Save changes'}
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
