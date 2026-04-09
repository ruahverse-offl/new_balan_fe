import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  X,
  Search,
  RefreshCw,
  Lock,
  Check,
  Circle,
  ChevronDown,
  ChevronRight,
  Users,
  KeyRound,
  Link2,
  Copy,
} from 'lucide-react';
import { getRoles, createRole, updateRole, deleteRole } from '../../services/rolesApi';
import { getPermissions, createPermission, deletePermission } from '../../services/permissionsApi';
import { getRolePermissions, createRolePermission, deleteRolePermission } from '../../services/rolePermissionsApi';
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

async function fetchAllPermissions() {
  let offset = 0;
  const all = [];
  for (;;) {
    const res = await getPermissions({ limit: PAGE, offset, sort_by: 'code', sort_order: 'asc' });
    const batch = res.items || [];
    all.push(...batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

async function fetchAllRolePermissionLinks() {
  let offset = 0;
  const all = [];
  for (;;) {
    const res = await getRolePermissions({ limit: PAGE, offset, sort_by: 'created_at', sort_order: 'desc' });
    const batch = res.items || [];
    all.push(...batch);
    if (batch.length < PAGE) break;
    offset += PAGE;
  }
  return all;
}

function groupPrefix(code) {
  if (!code || typeof code !== 'string') return 'OTHER';
  const i = code.indexOf('_');
  return i === -1 ? 'OTHER' : code.slice(0, i);
}

function buildGroupedPermissions(permList) {
  const groups = new Map();
  for (const perm of permList) {
    const g = groupPrefix(perm.code);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(perm);
  }
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([g, perms]) => [g, [...perms].sort((a, b) => (a.code || '').localeCompare(b.code || ''))]);
}

const PROTECTED_ROLE_NAMES = new Set(['CUSTOMER', 'ADMIN', 'MANAGER', 'DELIVERY', 'DELIVERY_AGENT']);

/**
 * Roles, permission catalog, and role↔permission assignment (admin API).
 */
const AccessControlTab = ({ showNotify, onRolesInvalidate }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [links, setLinks] = useState([]);
  const [forbidden, setForbidden] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [draftPermIds, setDraftPermIds] = useState(() => new Set());
  const [baselinePermIds, setBaselinePermIds] = useState(() => new Set());

  const [roleSearch, setRoleSearch] = useState('');
  const [permSearch, setPermSearch] = useState('');
  const [permissionCatalogSearch, setPermissionCatalogSearch] = useState('');

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState('add');
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  const [showPermForm, setShowPermForm] = useState(false);
  const [permForm, setPermForm] = useState({ code: '', description: '' });
  const [catalogDeletingId, setCatalogDeletingId] = useState('');
  const [refreshBusy, setRefreshBusy] = useState(false);

  /** Expanded permission-type groups (assign matrix) */
  const [matrixExpandedGroups, setMatrixExpandedGroups] = useState(() => new Set());
  /** Expanded groups in read-only catalog */
  const [catalogExpandedGroups, setCatalogExpandedGroups] = useState(() => new Set());

  /** Matrix row filter when a role is selected */
  const [matrixGrantFilter, setMatrixGrantFilter] = useState('all');

  /**
   * @param {{ silent?: boolean, spinRefresh?: boolean }} [opts]
   * silent: refetch without full-page skeleton (after save/delete/manual refresh).
   * spinRefresh: show spinner on the Refresh toolbar button (only with silent).
   */
  const loadAll = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    const spinRefresh = opts.spinRefresh === true;
    if (!silent) {
      setLoading(true);
    }
    if (spinRefresh) {
      setRefreshBusy(true);
    }
    setForbidden(false);
    try {
      const [r, p, l] = await Promise.all([
        fetchAllRoles(),
        fetchAllPermissions(),
        fetchAllRolePermissionLinks(),
      ]);
      setRoles(r.filter((x) => x && !x.is_deleted));
      setPermissions(p.filter((x) => x && !x.is_deleted && x.is_active !== false));
      setLinks(l.filter((x) => x && !x.is_deleted && x.is_active !== false));
    } catch (e) {
      if (e?.status === 403) {
        setForbidden(true);
      } else {
        showNotify?.(e?.message || 'Failed to load access control data', 'error');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
      if (spinRefresh) {
        setRefreshBusy(false);
      }
    }
  }, [showNotify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const linkIndex = useMemo(() => {
    const byRole = new Map();
    for (const row of links) {
      const rid = String(row.role_id);
      const pid = String(row.permission_id);
      if (!byRole.has(rid)) byRole.set(rid, new Map());
      byRole.get(rid).set(pid, row.id);
    }
    return byRole;
  }, [links]);

  useEffect(() => {
    if (!selectedRoleId) {
      setDraftPermIds(new Set());
      setBaselinePermIds(new Set());
      return;
    }
    const m = linkIndex.get(String(selectedRoleId));
    const next = new Set();
    if (m) {
      for (const pid of m.keys()) {
        next.add(pid);
      }
    }
    setDraftPermIds(next);
    setBaselinePermIds(new Set(next));
  }, [selectedRoleId, linkIndex]);

  const groupedPermissions = useMemo(() => buildGroupedPermissions(permissions), [permissions]);

  const filteredGroupedPermissions = useMemo(() => {
    const q = (permSearch || '').trim().toLowerCase();
    if (!q) return groupedPermissions;
    return groupedPermissions
      .map(([group, perms]) => {
        const filtered = perms.filter(
          (p) =>
            (p.code || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            group.toLowerCase().includes(q),
        );
        return [group, filtered];
      })
      .filter(([, perms]) => perms.length > 0);
  }, [groupedPermissions, permSearch]);

  const matrixDisplayGroups = useMemo(() => {
    if (!selectedRoleId || matrixGrantFilter === 'all') {
      return filteredGroupedPermissions;
    }
    return filteredGroupedPermissions
      .map(([group, perms]) => {
        const next = perms.filter((p) => {
          const on = draftPermIds.has(String(p.id));
          if (matrixGrantFilter === 'granted') return on;
          if (matrixGrantFilter === 'ungranted') return !on;
          return true;
        });
        return [group, next];
      })
      .filter(([, perms]) => perms.length > 0);
  }, [filteredGroupedPermissions, selectedRoleId, matrixGrantFilter, draftPermIds]);

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

  const filteredCatalogGrouped = useMemo(() => {
    const q = (permissionCatalogSearch || '').trim().toLowerCase();
    if (!q) return groupedPermissions;
    return groupedPermissions
      .map(([group, perms]) => {
        const filtered = perms.filter(
          (p) =>
            (p.code || '').toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            group.toLowerCase().includes(q),
        );
        return [group, filtered];
      })
      .filter(([, perms]) => perms.length > 0);
  }, [groupedPermissions, permissionCatalogSearch]);

  const catalogTotalFlat = useMemo(
    () => filteredCatalogGrouped.reduce((n, [, perms]) => n + perms.length, 0),
    [filteredCatalogGrouped],
  );
  const hasCatalogSearchFilter = Boolean((permissionCatalogSearch || '').trim());
  const permissionsListLen = permissions.length;

  const draftPermIdsRef = useRef(draftPermIds);
  draftPermIdsRef.current = draftPermIds;

  useEffect(() => {
    if (matrixGrantFilter === 'all') {
      setMatrixExpandedGroups(new Set(filteredGroupedPermissions.map(([g]) => g)));
      return;
    }
    const d = draftPermIdsRef.current;
    setMatrixExpandedGroups(
      new Set(
        filteredGroupedPermissions
          .filter(([, perms]) =>
            perms.some((p) => {
              const on = d.has(String(p.id));
              return matrixGrantFilter === 'granted' ? on : !on;
            }),
          )
          .map(([g]) => g),
      ),
    );
  }, [filteredGroupedPermissions, selectedRoleId, matrixGrantFilter]);

  useEffect(() => {
    setCatalogExpandedGroups(new Set(filteredCatalogGrouped.map(([g]) => g)));
  }, [filteredCatalogGrouped]);

  useEffect(() => {
    if (!selectedRoleId) setMatrixGrantFilter('all');
  }, [selectedRoleId]);

  const toggleMatrixGroup = (g) => {
    setMatrixExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const expandAllMatrixGroups = () => {
    setMatrixExpandedGroups(new Set(matrixDisplayGroups.map(([x]) => x)));
  };

  const collapseAllMatrixGroups = () => {
    setMatrixExpandedGroups(new Set());
  };

  const toggleCatalogGroup = (g) => {
    setCatalogExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const expandAllCatalogGroups = () => {
    setCatalogExpandedGroups(new Set(filteredCatalogGrouped.map(([x]) => x)));
  };

  const collapseAllCatalogGroups = () => {
    setCatalogExpandedGroups(new Set());
  };

  const isDirty = useMemo(() => {
    if (!selectedRoleId) return false;
    if (baselinePermIds.size !== draftPermIds.size) return true;
    for (const id of draftPermIds) {
      if (!baselinePermIds.has(id)) return true;
    }
    return false;
  }, [selectedRoleId, baselinePermIds, draftPermIds]);

  const selectedCount = draftPermIds.size;
  const totalPermCount = permissions.length;

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
      if (String(selectedRoleId) === String(role.id)) {
        setSelectedRoleId('');
      }
      setLinks((prev) => prev.filter((l) => String(l.role_id) !== String(role.id)));
      showNotify?.('Role deleted', 'success');
      onRolesInvalidate?.();
    } catch (err) {
      showNotify?.(err?.message || 'Delete failed', 'error');
    }
  };

  const submitNewPermission = async (e) => {
    e.preventDefault();
    const code = String(permForm.code || '').trim().toUpperCase().replace(/\s+/g, '_');
    if (!code) {
      showNotify?.('Permission code is required', 'error');
      return;
    }
    try {
      const created = await createPermission({
        code,
        description: permForm.description?.trim() || null,
      });
      setPermissions((prev) => [...prev, created].sort((a, b) => (a.code || '').localeCompare(b.code || '')));
      setPermForm({ code: '', description: '' });
      setShowPermForm(false);
      showNotify?.('Permission added', 'success');
    } catch (err) {
      showNotify?.(err?.message || 'Failed to create permission', 'error');
    }
  };

  const removeCatalogPermission = async (perm) => {
    const code = perm?.code || 'this permission';
    const msg =
      `Remove "${code}" from the catalog? This soft-deletes the code and removes it from every role’s API permission links. ` +
      'Sidebar menu access is managed separately under menu task grants.';
    if (!window.confirm(msg)) return;
    setCatalogDeletingId(String(perm.id));
    try {
      await deletePermission(perm.id);
      await loadAll({ silent: true });
      showNotify?.('Permission removed from catalog and roles', 'success');
    } catch (err) {
      showNotify?.(err?.message || 'Delete failed', 'error');
    } finally {
      setCatalogDeletingId('');
    }
  };

  const toggleDraftPerm = (permId) => {
    setDraftPermIds((prev) => {
      const next = new Set(prev);
      const k = String(permId);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const setGroupAll = (groupPerms, checked) => {
    setDraftPermIds((prev) => {
      const next = new Set(prev);
      for (const p of groupPerms) {
        const k = String(p.id);
        if (checked) next.add(k);
        else next.delete(k);
      }
      return next;
    });
  };

  const groupSelectionStats = (groupPerms) => {
    let c = 0;
    for (const p of groupPerms) {
      if (draftPermIds.has(String(p.id))) c += 1;
    }
    return { selected: c, total: groupPerms.length };
  };

  const saveAssignments = async () => {
    if (!selectedRoleId) {
      showNotify?.('Select a role first', 'error');
      return;
    }
    const rid = String(selectedRoleId);
    const existingMap = linkIndex.get(rid) || new Map();
    const desired = new Set([...draftPermIds].map(String));

    const existingIds = new Set(existingMap.keys());
    const toAdd = [...desired].filter((pid) => !existingIds.has(pid));
    const toRemove = [...existingIds].filter((pid) => !desired.has(pid));

    if (toAdd.length === 0 && toRemove.length === 0) {
      showNotify?.('No changes to save', 'success');
      return;
    }

    setSaving(true);
    try {
      for (const pid of toAdd) {
        await createRolePermission({
          role_id: selectedRoleId,
          permission_id: pid,
        });
      }
      for (const pid of toRemove) {
        const linkId = existingMap.get(pid);
        if (linkId) await deleteRolePermission(linkId);
      }
      showNotify?.('Permissions updated for role', 'success');
      await loadAll({ silent: true });
    } catch (err) {
      showNotify?.(err?.message || 'Failed to save permissions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => String(r.id) === String(selectedRoleId));

  const copyText = useCallback(
    async (text, label) => {
      const t = String(text || '').trim();
      if (!t) return;
      try {
        await navigator.clipboard.writeText(t);
        showNotify?.(`${label} copied to clipboard`, 'success');
      } catch {
        showNotify?.('Could not copy — check browser permissions', 'error');
      }
    },
    [showNotify],
  );

  const copyGroupCodes = useCallback(
    async (perms) => {
      const lines = (perms || []).map((p) => p.code).filter(Boolean);
      if (!lines.length) return;
      await copyText(lines.join('\n'), `${lines.length} codes`);
    },
    [copyText],
  );

  const rolesSorted = useMemo(
    () => [...roles].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [roles],
  );

  if (forbidden) {
    return (
      <div className="access-control-tab-stack animate-slide-up">
        <div className="admin-table-card catalog-tab-card">
          <div className="catalog-empty access-control-forbidden-catalog">
            <div className="access-control-forbidden-icon" aria-hidden>
              <Shield size={40} strokeWidth={1.5} />
            </div>
            <p className="catalog-empty-title">Access restricted</p>
            <p>You don&apos;t have permission to manage roles and API access.</p>
            <p className="access-control-forbidden-hint">
              Typical codes: ROLE_VIEW, PERMISSION_VIEW, ROLE_PERMISSION_VIEW.
            </p>
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
            <Loader2 size={32} aria-hidden />
            <div>
              <p className="access-control-loading-title">Loading access data</p>
              <p className="access-control-loading-sub">Roles, permission codes, and assignments…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const grantPct = totalPermCount ? Math.round((selectedCount / totalPermCount) * 100) : 0;

  return (
    <div className="access-control-tab-stack access-control-tab animate-slide-up">
      <div className="admin-table-card catalog-tab-card access-control-intro-card">
        <div className="catalog-tab-header access-control-hero-header">
          <div className="access-control-hero-row">
            <div className="access-control-hero-icon-wrap" aria-hidden>
              <Shield size={28} strokeWidth={2} />
            </div>
            <div className="access-control-hero-copy">
              <h2 className="catalog-tab-title">Roles &amp; access</h2>
              <p className="catalog-tab-subtitle">
                API access is a role plus permission <em>codes</em> (checked in the matrix). Pick a role, tick the codes it
                should have, then <strong>Save changes</strong> to create or remove links. Use <strong>Granted only</strong>{' '}
                to audit assignments. Staff accounts still need the right role in <strong>Manage Staff</strong>. Sidebar
                items use menu task grants, not this matrix alone.
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
            <div className="access-kpi-card">
              <KeyRound className="access-kpi-icon" size={20} aria-hidden />
              <div className="access-kpi-text">
                <span className="access-kpi-value">{permissionsListLen}</span>
                <span className="access-kpi-label">Permission codes</span>
              </div>
            </div>
            <div className="access-kpi-card">
              <Link2 className="access-kpi-icon" size={20} aria-hidden />
              <div className="access-kpi-text">
                <span className="access-kpi-value">{links.length}</span>
                <span className="access-kpi-label">Role↔code links</span>
              </div>
            </div>
            {selectedRoleId ? (
              <div className="access-kpi-card access-kpi-card--accent">
                <div className="access-kpi-text">
                  <span className="access-kpi-value">{grantPct}%</span>
                  <span className="access-kpi-label">
                    <span className="access-kpi-role">{selectedRole?.name || '—'}</span> coverage
                  </span>
                </div>
                <div className="access-kpi-mini-bar" title={`${selectedCount} of ${totalPermCount} permissions`}>
                  <div className="access-kpi-mini-bar-fill" style={{ width: `${grantPct}%` }} />
                </div>
              </div>
            ) : null}
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

      {/* Roles — full width, scrollable list (no side-by-side squeeze) */}
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
              <p className="catalog-tab-subtitle">
                Choose which role you are editing. System roles cannot be deleted.
              </p>
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
                      Note
                    </th>
                    <th scope="col" className="access-role-col-status">
                      Status
                    </th>
                    <th scope="col" className="access-col-actions access-role-col-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((r) => {
                    const isSel = String(selectedRoleId) === String(r.id);
                    const isSys = PROTECTED_ROLE_NAMES.has((r.name || '').toUpperCase());
                    return (
                      <tr key={r.id} className={isSel ? 'access-row-selected' : ''}>
                        <td data-label="Role">
                          <div className="access-role-cell">
                            <span className="access-role-name">{r.name}</span>
                            {isSys && (
                              <span className="access-badge access-badge--system">
                                <Lock size={11} aria-hidden />
                                System
                              </span>
                            )}
                          </div>
                          {r.description ? <p className="access-role-desc">{r.description}</p> : null}
                        </td>
                        <td data-label="Note">
                          <span className="access-role-hint">
                            {isSys ? 'Required for app behaviour' : 'Custom role'}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`access-status ${r.is_active !== false ? 'on' : 'off'}`}>
                            {r.is_active !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td data-label="Actions" className="actions access-role-actions">
                          <button
                            type="button"
                            className={`access-pick-btn ${isSel ? 'active' : ''}`}
                            onClick={() => setSelectedRoleId(r.id)}
                            aria-pressed={isSel}
                          >
                            {isSel ? <Check size={16} /> : <Circle size={16} />}
                            {isSel ? 'Editing' : 'Select'}
                          </button>
                          <button type="button" className="action-btn" onClick={() => openEditRole(r)} title="Edit role">
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

      {/* Permission matrix — full width, all groups visible in one scroll */}
      <section
        className="admin-table-card catalog-tab-card access-control-panel access-control-panel--perms"
        aria-labelledby="ac-perms-title"
      >
        <div className="catalog-tab-header access-control-section-header">
          <div className="access-control-section-title-row">
            <span className="access-control-step" aria-hidden>
              2
            </span>
            <div>
              <h2 id="ac-perms-title" className="catalog-tab-title">
                Assign permissions
              </h2>
              <p className="catalog-tab-subtitle">
                Each checkbox is one permission code for the <strong>selected role</strong>. Checked = the role is linked to
                that code (API checks use these links). <strong>Save changes</strong> writes only the diff: new checks create
                links; cleared checks remove links. Expand groups, search, or use <strong>Expand all</strong> to browse.
              </p>
            </div>
          </div>
        </div>

        {!selectedRoleId ? (
          <>
            <div className="catalog-tab-toolbar">
              <span className="catalog-tab-meta access-control-perms-no-role-meta">
                Select a role above to enable checkboxes and save.
              </span>
            </div>
            <div className="access-control-matrix-outer">
              <div className="access-control-placeholder access-control-placeholder--flat">
                <div className="access-control-placeholder-inner">
                  <Shield size={36} strokeWidth={1.25} className="access-control-placeholder-icon" />
                  <p className="access-control-placeholder-title">No role selected</p>
                  <p className="access-control-placeholder-text">
                    Choose a role in the Roles section to edit which API permissions it has.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="catalog-tab-toolbar access-control-perms-toolbar access-control-perms-toolbar--rich">
              <div className="table-search">
                <Search size={18} aria-hidden />
                <input
                  type="search"
                  placeholder="Filter by code, description, or group prefix…"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setPermSearch('');
                    }
                  }}
                  aria-label="Filter permissions"
                />
              </div>
              <label className="access-quick-role">
                <span className="access-quick-role-label">Jump to role</span>
                <select
                  className="access-quick-role-select"
                  value={selectedRoleId || ''}
                  onChange={(e) => setSelectedRoleId(e.target.value || '')}
                  aria-label="Quick switch role"
                >
                  <option value="">— Select role —</option>
                  {rolesSorted.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="access-grant-filter" role="group" aria-label="Filter by assignment">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'granted', label: 'Granted' },
                  { id: 'ungranted', label: 'Not granted' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`access-grant-filter-btn ${matrixGrantFilter === id ? 'active' : ''}`}
                    onClick={() => setMatrixGrantFilter(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="access-control-expand-actions">
                <button type="button" className="btn-text" onClick={expandAllMatrixGroups}>
                  Expand all types
                </button>
                <button type="button" className="btn-text" onClick={collapseAllMatrixGroups}>
                  Collapse all types
                </button>
              </div>
              <button
                type="button"
                className={`btn-add access-control-save ${isDirty ? 'access-control-save--dirty' : ''}`}
                disabled={saving || !isDirty}
                onClick={saveAssignments}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isDirty ? 'Save changes' : 'Saved'}
              </button>
              <span className="catalog-tab-meta access-control-perms-summary">
                <strong className="access-control-meta-role">{selectedRole?.name || '—'}</strong>
                {' · '}
                {selectedCount} / {totalPermCount} permissions
                {isDirty ? ' · Unsaved' : ''}
              </span>
            </div>

            <div className="access-control-matrix-outer">
              {filteredGroupedPermissions.length === 0 ? (
                <p className="access-control-empty-groups">No permissions match this search.</p>
              ) : matrixDisplayGroups.length === 0 ? (
                <p className="access-control-empty-groups">No permissions match this filter. Try &quot;All&quot; or adjust search.</p>
              ) : (
                <div className="access-control-matrix-scroll">
                  <table className="admin-table catalog-table access-matrix-table">
                    <thead>
                      <tr>
                        <th scope="col" className="access-matrix-col-check">
                          <span className="sr-only">Granted</span>
                        </th>
                        <th scope="col">Code</th>
                        <th scope="col">Description</th>
                      </tr>
                    </thead>
                    {matrixDisplayGroups.map(([group, perms]) => {
                      const fullGroupPerms =
                        filteredGroupedPermissions.find(([g0]) => g0 === group)?.[1] ?? perms;
                      const { selected, total } = groupSelectionStats(fullGroupPerms);
                      const matrixOpen = matrixExpandedGroups.has(group);
                      const matrixSectionId = `access-mx-${String(group).replace(/[^a-zA-Z0-9]+/g, '-')}`;
                      const pct = total ? Math.round((selected / total) * 100) : 0;
                      return (
                        <tbody key={group} id={matrixSectionId}>
                          <tr className="access-matrix-group-row">
                            <th scope="colgroup" colSpan={3} className="access-matrix-group-cell">
                              <div className="access-matrix-group-bar">
                                <button
                                  type="button"
                                  className="access-matrix-group-toggle"
                                  onClick={() => toggleMatrixGroup(group)}
                                  aria-expanded={matrixOpen}
                                  aria-controls={matrixSectionId}
                                >
                                  {matrixOpen ? <ChevronDown size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
                                  <span className="access-matrix-group-name">{group}</span>
                                </button>
                                <span className="access-matrix-group-count">
                                  {selected}/{total} in role · {fullGroupPerms.length} codes
                                </span>
                                <span className="access-matrix-group-actions">
                                  <button
                                    type="button"
                                    className="btn-text btn-text--sm"
                                    title="Copy all codes in this group (current search)"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyGroupCodes(fullGroupPerms);
                                    }}
                                  >
                                    Copy codes
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-text btn-text--sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGroupAll(fullGroupPerms, true);
                                    }}
                                  >
                                    All in group
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-text btn-text--sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGroupAll(fullGroupPerms, false);
                                    }}
                                  >
                                    None in group
                                  </button>
                                </span>
                              </div>
                              <div
                                className="access-matrix-group-progress"
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${selected} of ${total} permissions in this group`}
                              >
                                <div className="access-matrix-group-progress-fill" style={{ width: `${pct}%` }} />
                              </div>
                            </th>
                          </tr>
                          {matrixOpen
                            ? perms.map((p) => {
                                const checked = draftPermIds.has(String(p.id));
                                return (
                                  <tr key={p.id} className={checked ? 'access-matrix-row-on' : ''}>
                                    <td className="access-matrix-col-check" data-label="Granted">
                                      <input
                                        type="checkbox"
                                        className="access-perm-checkbox"
                                        checked={checked}
                                        onChange={() => toggleDraftPerm(p.id)}
                                        aria-label={`Grant ${p.code}`}
                                      />
                                    </td>
                                    <td data-label="Code">
                                      <div className="access-code-with-copy">
                                        <span className="access-perm-code">{p.code}</span>
                                        <button
                                          type="button"
                                          className="access-copy-code-btn"
                                          title="Copy code"
                                          aria-label={`Copy ${p.code}`}
                                          onClick={() => copyText(p.code, 'Code')}
                                        >
                                          <Copy size={14} aria-hidden />
                                        </button>
                                      </div>
                                    </td>
                                    <td data-label="Description">
                                      <span className="access-matrix-desc">{p.description || '—'}</span>
                                    </td>
                                  </tr>
                                );
                              })
                            : null}
                        </tbody>
                      );
                    })}
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* Permission catalog — full list, grouped, single scroll (no pagination) */}
      <section
        className="admin-table-card catalog-tab-card access-control-panel access-control-panel--catalog"
        aria-labelledby="ac-catalog-title"
      >
        <div className="catalog-tab-header access-control-section-header">
          <div className="access-control-section-title-row">
            <span className="access-control-step access-control-step--muted" aria-hidden>
              3
            </span>
            <div>
              <h2 id="ac-catalog-title" className="catalog-tab-title">
                Permission catalog
              </h2>
              <p className="catalog-tab-subtitle">
                Master list of codes the app can assign to roles. Deleting a code here removes it from the catalog and from
                every role’s permission links (after refresh). Search narrows groups; Expand all opens every type at once.
              </p>
            </div>
          </div>
        </div>

        <div className="catalog-tab-toolbar">
          <div className="table-search">
            <Search size={18} aria-hidden />
            <input
              type="search"
              placeholder="Search catalog by code, description, or group…"
              value={permissionCatalogSearch}
              onChange={(e) => setPermissionCatalogSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setPermissionCatalogSearch('');
                }
              }}
              aria-label="Search permission catalog"
            />
          </div>
          <div className="access-control-expand-actions">
            <button type="button" className="btn-text" onClick={expandAllCatalogGroups}>
              Expand all types
            </button>
            <button type="button" className="btn-text" onClick={collapseAllCatalogGroups}>
              Collapse all types
            </button>
          </div>
          <button type="button" className="btn-secondary" onClick={() => setShowPermForm((v) => !v)}>
            {showPermForm ? 'Close form' : 'Add permission code'}
          </button>
          {catalogTotalFlat > 0 && (
            <span className="catalog-tab-meta">
              {catalogTotalFlat} code{catalogTotalFlat !== 1 ? 's' : ''} visible
              {hasCatalogSearchFilter ? ' (filtered)' : ''}
            </span>
          )}
        </div>

        <div className="access-control-catalog-body">
          {showPermForm && (
            <form className="access-perm-add-form" onSubmit={submitNewPermission}>
              <div className="access-perm-add-grid">
                <div className="form-group">
                  <label htmlFor="ac-new-perm-code">Code</label>
                  <input
                    id="ac-new-perm-code"
                    value={permForm.code}
                    onChange={(e) => setPermForm({ ...permForm, code: e.target.value })}
                    placeholder="ORDER_EXPORT"
                    autoComplete="off"
                    className="access-input-mono"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="ac-new-perm-desc">Description</label>
                  <input
                    id="ac-new-perm-desc"
                    value={permForm.description}
                    onChange={(e) => setPermForm({ ...permForm, description: e.target.value })}
                    placeholder="Human-readable label"
                  />
                </div>
              </div>
              <button type="submit" className="btn-add">
                Create permission
              </button>
            </form>
          )}

          {catalogTotalFlat === 0 ? (
            <div className="catalog-empty access-control-catalog-empty">
              <Shield className="access-control-empty-icon" size={40} aria-hidden />
              <p className="catalog-empty-title">No permission codes</p>
              <p>
                {permissionsListLen === 0 && !hasCatalogSearchFilter
                  ? 'Add a code when you introduce a new API capability.'
                  : 'Try another search term.'}
              </p>
            </div>
          ) : (
            <div className="access-control-catalog-scroll">
              <table className="admin-table catalog-table access-catalog-readonly-table">
                <thead>
                  <tr>
                    <th scope="col" className="access-catalog-prefix-col">
                      Group
                    </th>
                    <th scope="col">Code</th>
                    <th scope="col">Description</th>
                    <th scope="col" className="access-catalog-copy-col">
                      <span className="sr-only">Copy</span>
                    </th>
                    <th scope="col" className="access-catalog-actions-col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                {filteredCatalogGrouped.map(([group, perms]) => {
                  const catalogOpen = catalogExpandedGroups.has(group);
                  const catalogSectionId = `access-cat-${String(group).replace(/[^a-zA-Z0-9]+/g, '-')}`;
                  return (
                    <tbody key={group} id={catalogSectionId}>
                      <tr className="access-matrix-group-row access-catalog-group-row">
                        <th scope="colgroup" colSpan={5} className="access-matrix-group-cell">
                          <div className="access-matrix-group-bar access-catalog-group-bar">
                            <button
                              type="button"
                              className="access-matrix-group-toggle"
                              onClick={() => toggleCatalogGroup(group)}
                              aria-expanded={catalogOpen}
                              aria-controls={catalogSectionId}
                            >
                              {catalogOpen ? <ChevronDown size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
                              <span className="access-matrix-group-name">{group}</span>
                            </button>
                            <span className="access-matrix-group-count">{perms.length} codes</span>
                            <span className="access-matrix-group-actions access-catalog-group-copy-all">
                              <button
                                type="button"
                                className="btn-text btn-text--sm"
                                title="Copy all codes in this group"
                                onClick={() => copyGroupCodes(perms)}
                              >
                                Copy group
                              </button>
                            </span>
                          </div>
                        </th>
                      </tr>
                      {catalogOpen
                        ? perms.map((p) => (
                            <tr key={p.id}>
                              <td className="access-catalog-prefix-col" data-label="Group">
                                <span className="access-catalog-prefix-pill">{group}</span>
                              </td>
                              <td data-label="Code">
                                <span className="access-control-perm-code-cell">{p.code || '—'}</span>
                              </td>
                              <td data-label="Description">
                                <span className="access-catalog-full-desc">{p.description || '—'}</span>
                              </td>
                              <td className="access-catalog-copy-col" data-label="Copy">
                                <button
                                  type="button"
                                  className="access-copy-code-btn"
                                  title="Copy code"
                                  aria-label={`Copy ${p.code || 'code'}`}
                                  onClick={() => copyText(p.code, 'Code')}
                                >
                                  <Copy size={14} aria-hidden />
                                </button>
                              </td>
                              <td className="access-catalog-actions-col" data-label="Actions">
                                <button
                                  type="button"
                                  className="action-btn delete"
                                  title="Remove from catalog"
                                  aria-label={`Remove ${p.code || 'permission'} from catalog`}
                                  disabled={Boolean(catalogDeletingId)}
                                  onClick={() => removeCatalogPermission(p)}
                                >
                                  {catalogDeletingId === String(p.id) ? (
                                    <Loader2 size={16} className="animate-spin" aria-hidden />
                                  ) : (
                                    <Trash2 size={16} aria-hidden />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        : null}
                    </tbody>
                  );
                })}
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
