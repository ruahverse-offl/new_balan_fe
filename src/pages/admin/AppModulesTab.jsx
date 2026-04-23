import React, { useCallback, useEffect, useState } from 'react';
import { Layers, Plus, Pencil, RefreshCw, Search } from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import { getModules, createModule, updateModule } from '../../services/modulesApi';
import './AdminCatalogTabs.css';

/**
 * CRUD for ``M_modules`` (admin “App modules” / access-modules).
 */
const AppModulesTab = ({ showNotify }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', display_name: '', is_menu_item: true, display_order: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getModules();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      if (e?.status === 403) {
        showNotify?.('You need access-modules read permission.', 'error');
      } else {
        showNotify?.(e?.message || 'Failed to load modules', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [showNotify]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const s = (q || '').trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (m) =>
        String(m.name || '')
          .toLowerCase()
          .includes(s) ||
        String(m.display_name || '')
          .toLowerCase()
          .includes(s),
    );
  }, [rows, q]);

  const onCreate = async (e) => {
    e.preventDefault();
    const name = (form.name || '').trim();
    const display_name = (form.display_name || '').trim();
    if (!name || !display_name) {
      showNotify?.('Name and display name are required', 'error');
      return;
    }
    setBusy(true);
    try {
      await createModule({
        name,
        display_name,
        is_menu_item: !!form.is_menu_item,
        display_order: Number(form.display_order) || 0,
      });
      showNotify?.('Module created', 'success');
      setForm({ name: '', display_name: '', is_menu_item: true, display_order: 0 });
      await load();
    } catch (err) {
      showNotify?.(err?.message || 'Create failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (m) => {
    setBusy(true);
    try {
      await updateModule(m.id, { is_active: !m.is_active });
      showNotify?.('Module updated', 'success');
      await load();
    } catch (err) {
      showNotify?.(err?.message || 'Update failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-table-card catalog-tab-card animate-slide-up">
        <div className="catalog-loading">
          <InlineSpinner size={32} />
          <p>Loading modules…</p>
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
              <Layers size={28} strokeWidth={2} />
            </div>
            <div>
              <h2 className="catalog-tab-title">App modules</h2>
              <p className="catalog-tab-subtitle">
                Define sidebar entries and stable keys used by RBAC. Changing names does not change API permission mapping.
              </p>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={() => load()} disabled={busy}>
            <RefreshCw size={18} aria-hidden /> Refresh
          </button>
        </div>

        <form className="access-perm-add-form" onSubmit={onCreate} style={{ marginTop: '1rem' }}>
          <input
            placeholder="Internal name (e.g. orders)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            placeholder="Display name"
            value={form.display_name}
            onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
          />
          <label className="catalog-tab-meta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={form.is_menu_item}
              onChange={(e) => setForm((f) => ({ ...f, is_menu_item: e.target.checked }))}
            />
            Menu item
          </label>
          <input
            type="number"
            placeholder="Order"
            value={form.display_order}
            onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
            style={{ maxWidth: 100 }}
          />
          <button type="submit" className="btn-add" disabled={busy}>
            <Plus size={18} /> Add module
          </button>
        </form>

        <div className="catalog-tab-toolbar" style={{ marginTop: '1rem' }}>
          <div className="table-search">
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="table-wrapper" style={{ marginTop: '0.75rem' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Display</th>
                <th>Menu</th>
                <th>Order</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <code>{m.name}</code>
                  </td>
                  <td>{m.display_name}</td>
                  <td>{m.is_menu_item ? 'Yes' : 'No'}</td>
                  <td>{m.display_order ?? 0}</td>
                  <td>{m.is_active !== false ? 'Yes' : 'No'}</td>
                  <td>
                    <button type="button" className="action-btn" title="Toggle active" onClick={() => toggleActive(m)} disabled={busy}>
                      <Pencil size={16} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AppModulesTab;
