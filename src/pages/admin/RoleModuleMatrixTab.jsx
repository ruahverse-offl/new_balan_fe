import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, RefreshCw, Save, ChevronDown, FilePlus, Eye, Pencil, Trash2, CheckSquare, Square } from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import ActionOverlay from '../../components/admin/ActionOverlay';
import { useActionLock } from '../../hooks/useActionLock';
import { getRoles } from '../../services/rolesApi';
import { getModules } from '../../services/modulesApi';
import { getRoleMatrix, putRoleMatrix } from '../../services/rbacMatrixApi';
import './RoleModuleMatrixTab.css';

const PERMS = [
  { key: 'can_create', label: 'Create', short: 'C', Icon: FilePlus,    color: 'perm--create' },
  { key: 'can_read',   label: 'Read',   short: 'R', Icon: Eye,         color: 'perm--read'   },
  { key: 'can_update', label: 'Update', short: 'U', Icon: Pencil,      color: 'perm--update' },
  { key: 'can_delete', label: 'Delete', short: 'D', Icon: Trash2,      color: 'perm--delete' },
];

const RoleModuleMatrixTab = ({ showNotify }) => {
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const { locked, message: lockMsg, run: lockRun } = useActionLock();
  const [roles,   setRoles]     = useState([]);
  const [modules, setModules]   = useState([]);
  const [roleId,  setRoleId]    = useState('');
  const [draft,   setDraft]     = useState(() => new Map());
  const [dirty,   setDirty]     = useState(false);

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, mods] = await Promise.all([
        getRoles({ limit: 100, sort_by: 'name', sort_order: 'asc' }),
        getModules(),
      ]);
      setRoles((rRes.items || []).filter((x) => x && !x.is_deleted));
      setModules(Array.isArray(mods) ? mods : []);
    } catch (e) {
      showNotify?.(e?.status === 403 ? 'You need role-access permissions.' : e?.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotify]);

  useEffect(() => { loadBase(); }, [loadBase]);

  const loadMatrix = useCallback(async (rid) => {
    if (!rid) { setDraft(new Map()); setDirty(false); return; }
    try {
      const res = await getRoleMatrix(rid);
      const next = new Map();
      (res.rows || []).forEach((row) => {
        next.set(String(row.module_id), {
          can_create: !!row.can_create,
          can_read:   !!row.can_read,
          can_update: !!row.can_update,
          can_delete: !!row.can_delete,
        });
      });
      setDraft(next);
      setDirty(false);
    } catch (e) {
      showNotify?.(e?.message || 'Failed to load matrix', 'error');
    }
  }, [showNotify]);

  useEffect(() => { if (roleId) loadMatrix(roleId); }, [roleId, loadMatrix]);

  const sortedMods = useMemo(
    () => [...modules].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || String(a.name).localeCompare(String(b.name))),
    [modules],
  );

  const toggle = (mid, key) => {
    setDraft((prev) => {
      const next = new Map(prev);
      const cur = next.get(String(mid)) || { can_create: false, can_read: false, can_update: false, can_delete: false };
      next.set(String(mid), { ...cur, [key]: !cur[key] });
      return next;
    });
    setDirty(true);
  };

  const toggleRow = (mid) => {
    const cur = draft.get(String(mid)) || {};
    const allOn = PERMS.every((p) => !!cur[p.key]);
    setDraft((prev) => {
      const next = new Map(prev);
      next.set(String(mid), { can_create: !allOn, can_read: !allOn, can_update: !allOn, can_delete: !allOn });
      return next;
    });
    setDirty(true);
  };

  const grantAll = () => {
    const next = new Map();
    sortedMods.forEach((m) => next.set(String(m.id), { can_create: true, can_read: true, can_update: true, can_delete: true }));
    setDraft(next);
    setDirty(true);
  };

  const revokeAll = () => {
    const next = new Map();
    sortedMods.forEach((m) => next.set(String(m.id), { can_create: false, can_read: false, can_update: false, can_delete: false }));
    setDraft(next);
    setDirty(true);
  };

  const onSave = async () => {
    if (!roleId) return;
    setSaving(true);
    await lockRun(async () => {
      try {
        const rows = sortedMods.map((m) => {
          const f = draft.get(String(m.id)) || {};
          return { module_id: m.id, can_create: !!f.can_create, can_read: !!f.can_read, can_update: !!f.can_update, can_delete: !!f.can_delete };
        });
        await putRoleMatrix({ role_id: roleId, rows });
        showNotify?.('Access matrix saved', 'success');
        await loadMatrix(roleId);
      } catch (e) {
        showNotify?.(e?.message || 'Save failed', 'error');
      } finally {
        setSaving(false);
      }
    }, 'Saving permissions…');
  };

  const selectedRole = roles.find((r) => String(r.id) === String(roleId));

  const grantedCount = useMemo(() => {
    let n = 0;
    draft.forEach((flags) => { PERMS.forEach((p) => { if (flags[p.key]) n++; }); });
    return n;
  }, [draft]);

  const totalSlots = sortedMods.length * PERMS.length;

  if (loading) {
    return (
      <div className="matrix-page animate-slide-up">
        <div className="matrix-card matrix-loading-card">
          <InlineSpinner size={28} />
          <p>Loading roles and modules…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matrix-page animate-slide-up" style={{ position: 'relative' }}>
      <ActionOverlay show={locked} message={lockMsg} />
      <div className="matrix-card">
        {/* Header */}
        <div className="matrix-card-header">
          <div className="matrix-header-left">
            <div className="matrix-header-icon">
              <LayoutGrid size={22} strokeWidth={2} />
            </div>
            <div>
              <p className="matrix-subtitle matrix-subtitle--solo">
                Grant Create / Read / Update / Delete permissions per module for each role.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="matrix-btn matrix-btn--ghost"
            onClick={loadBase}
            disabled={saving}
            title="Reload roles and modules"
          >
            <RefreshCw size={15} /> Reload
          </button>
        </div>

        {/* Role selector */}
        <div className="matrix-role-bar">
          <div className="matrix-role-selector-wrap">
            <label className="matrix-role-label" htmlFor="matrix-role-select">
              Select role
            </label>
            <div className="matrix-role-select-box">
              <select
                id="matrix-role-select"
                className="matrix-role-select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value="">— Choose a role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="matrix-select-chevron" />
            </div>
          </div>

          {roleId && (
            <div className="matrix-role-bar-right">
              {dirty && (
                <span className="matrix-unsaved-badge">Unsaved changes</span>
              )}
              {totalSlots > 0 && (
                <span className="matrix-progress-text">
                  {grantedCount} / {totalSlots} granted
                </span>
              )}
              <button type="button" className="matrix-btn matrix-btn--ghost matrix-btn--sm" onClick={revokeAll} disabled={saving}>
                Revoke all
              </button>
              <button type="button" className="matrix-btn matrix-btn--ghost matrix-btn--sm" onClick={grantAll} disabled={saving}>
                Grant all
              </button>
              <button
                type="button"
                className="matrix-btn matrix-btn--save"
                onClick={onSave}
                disabled={!roleId || saving}
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Matrix */}
        {!roleId ? (
          <div className="matrix-empty-prompt">
            <LayoutGrid size={40} strokeWidth={1} />
            <p className="matrix-empty-prompt-title">No role selected</p>
            <p className="matrix-empty-prompt-sub">Choose a role above to view and edit its module permissions.</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            {totalSlots > 0 && (
              <div className="matrix-progress-bar-wrap">
                <div
                  className="matrix-progress-bar-fill"
                  style={{ width: `${(grantedCount / totalSlots) * 100}%` }}
                />
              </div>
            )}

            <div className="matrix-table-wrap">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th className="matrix-th-module">
                      Module
                      <span className="matrix-th-count">{sortedMods.length}</span>
                    </th>
                    {PERMS.map((p) => (
                      <th key={p.key} className={`matrix-th-perm ${p.color}`}>
                        <p.Icon size={13} />
                        <span className="matrix-th-label-full">{p.label}</span>
                        <span className="matrix-th-label-short">{p.short}</span>
                      </th>
                    ))}
                    <th className="matrix-th-row-toggle" title="Toggle all permissions for row">All</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMods.map((m) => {
                    const flags = draft.get(String(m.id)) || {};
                    const anyOn = PERMS.some((p) => !!flags[p.key]);
                    const allOn = PERMS.every((p) => !!flags[p.key]);
                    return (
                      <tr key={m.id} className={anyOn ? 'matrix-row--active' : ''}>
                        <td className="matrix-td-module">
                          <span className="matrix-mod-display">{m.display_name}</span>
                          <code className="matrix-mod-key">{m.name}</code>
                        </td>
                        {PERMS.map((p) => {
                          const on = !!flags[p.key];
                          return (
                            <td key={p.key} className="matrix-td-perm">
                              <button
                                type="button"
                                className={`matrix-perm-btn ${p.color} ${on ? 'matrix-perm-btn--on' : 'matrix-perm-btn--off'}`}
                                onClick={() => toggle(m.id, p.key)}
                                title={`${on ? 'Revoke' : 'Grant'} ${p.label}`}
                                aria-pressed={on}
                              >
                                <p.Icon size={13} />
                                <span className="matrix-perm-btn-label">{p.short}</span>
                              </button>
                            </td>
                          );
                        })}
                        <td className="matrix-td-row-toggle">
                          <button
                            type="button"
                            className={`matrix-row-toggle-btn ${allOn ? 'matrix-row-toggle-btn--all' : anyOn ? 'matrix-row-toggle-btn--some' : ''}`}
                            onClick={() => toggleRow(m.id)}
                            title={allOn ? 'Revoke all' : 'Grant all'}
                          >
                            {allOn ? <CheckSquare size={14} /> : <Square size={14} />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Sticky save footer */}
            <div className="matrix-save-footer">
              <span className="matrix-muted">
                Role: <strong>{selectedRole?.name}</strong>
                {dirty && <em className="matrix-dirty-hint"> — you have unsaved changes</em>}
              </span>
              <button
                type="button"
                className="matrix-btn matrix-btn--save"
                onClick={onSave}
                disabled={!roleId || saving}
              >
                <Save size={15} />
                {saving ? 'Saving…' : 'Save matrix'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoleModuleMatrixTab;
