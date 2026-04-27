import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutGrid, RefreshCw, Save } from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import { getRoles } from '../../services/rolesApi';
import { getModules } from '../../services/modulesApi';
import { getRoleMatrix, putRoleMatrix } from '../../services/rbacMatrixApi';
import './AdminCatalogTabs.css';

const FLAGS = [
  { key: 'can_create', label: 'C' },
  { key: 'can_read', label: 'R' },
  { key: 'can_update', label: 'U' },
  { key: 'can_delete', label: 'D' },
];

/**
 * Role × module CRUD matrix (``M_module_role_permissions``).
 */
const RoleModuleMatrixTab = ({ showNotify }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [roleId, setRoleId] = useState('');
  /** module_id -> flags */
  const [draft, setDraft] = useState(() => new Map());

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, mods] = await Promise.all([getRoles({ limit: 100, sort_by: 'name', sort_order: 'asc' }), getModules()]);
      setRoles((rRes.items || []).filter((x) => x && !x.is_deleted));
      setModules(Array.isArray(mods) ? mods : []);
    } catch (e) {
      if (e?.status === 403) {
        showNotify?.('You need role-access permissions.', 'error');
      } else {
        showNotify?.(e?.message || 'Failed to load matrix data', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showNotify]);

  useEffect(() => {
    loadBase();
  }, [loadBase]);

  const loadMatrix = useCallback(
    async (rid) => {
      if (!rid) {
        setDraft(new Map());
        return;
      }
      try {
        const res = await getRoleMatrix(rid);
        const next = new Map();
        (res.rows || []).forEach((row) => {
          next.set(String(row.module_id), {
            can_create: !!row.can_create,
            can_read: !!row.can_read,
            can_update: !!row.can_update,
            can_delete: !!row.can_delete,
          });
        });
        setDraft(next);
      } catch (e) {
        showNotify?.(e?.message || 'Failed to load matrix', 'error');
      }
    },
    [showNotify],
  );

  useEffect(() => {
    if (roleId) loadMatrix(roleId);
  }, [roleId, loadMatrix]);

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
  };

  const onSave = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      const rows = sortedMods.map((m) => {
        const f = draft.get(String(m.id)) || {};
        return {
          module_id: m.id,
          can_create: !!f.can_create,
          can_read: !!f.can_read,
          can_update: !!f.can_update,
          can_delete: !!f.can_delete,
        };
      });
      await putRoleMatrix({ role_id: roleId, rows });
      showNotify?.('Access matrix saved', 'success');
      await loadMatrix(roleId);
    } catch (e) {
      showNotify?.(e?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-table-card catalog-tab-card animate-slide-up">
        <div className="catalog-loading">
          <InlineSpinner size={32} />
          <p>Loading roles and modules…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="access-control-tab-stack animate-slide-up">
      <div className="admin-table-card catalog-tab-card">
        <div className="catalog-tab-header">
          <div className="access-control-hero-row">
            <div className="access-control-hero-icon-wrap" aria-hidden>
              <LayoutGrid size={28} strokeWidth={2} />
            </div>
            <div>
              <h2 className="catalog-tab-title">Role × module access</h2>
              <p className="catalog-tab-subtitle">
                Grant create / read / update / delete per module. API routes still check legacy codes mapped to these flags.
              </p>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={() => loadBase()} disabled={saving}>
            <RefreshCw size={18} aria-hidden /> Reload
          </button>
        </div>

        <div className="catalog-tab-toolbar" style={{ marginTop: '1rem', flexWrap: 'wrap', gap: 12 }}>
          <label className="catalog-tab-meta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Role
            <select className="admin-select-like" value={roleId} onChange={(e) => setRoleId(e.target.value)} style={{ minWidth: 220 }}>
              <option value="">— Select —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn-add" onClick={onSave} disabled={!roleId || saving}>
            <Save size={18} aria-hidden /> {saving ? 'Saving…' : 'Save matrix'}
          </button>
        </div>

        {!roleId ? (
          <p className="catalog-tab-meta" style={{ marginTop: '1rem' }}>
            Select a role to edit grants.
          </p>
        ) : (
          <div className="table-wrapper" style={{ marginTop: '1rem', overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Module</th>
                  {FLAGS.map((f) => (
                    <th key={f.key} title={f.key.replace('can_', '')}>
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedMods.map((m) => {
                  const f = draft.get(String(m.id)) || {};
                  return (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.display_name}</strong>
                        <div className="catalog-tab-meta">
                          <code>{m.name}</code>
                        </div>
                      </td>
                      {FLAGS.map((col) => (
                        <td key={col.key} data-label={col.label}>
                          <input type="checkbox" checked={!!f[col.key]} onChange={() => toggle(m.id, col.key)} />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleModuleMatrixTab;
