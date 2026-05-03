import React, { useCallback, useEffect, useState } from 'react';
import { Layers, Plus, Pencil, RefreshCw, Search, X, ToggleLeft, ToggleRight, Menu } from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import ActionOverlay from '../../components/admin/ActionOverlay';
import { useActionLock } from '../../hooks/useActionLock';
import { getModules, createModule, updateModule } from '../../services/modulesApi';
import './AppModulesTab.css';

const EMPTY_FORM = { name: '', display_name: '', is_menu_item: true, display_order: 0 };

const AppModulesTab = ({ showNotify }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const { locked, message: lockMsg, run: lockRun } = useActionLock();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingModule, setEditingModule] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getModules();
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      showNotify?.(e?.status === 403 ? 'You need access-modules read permission.' : e?.message || 'Failed to load modules', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotify]);

  useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    const s = (q || '').trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (m) => String(m.name || '').toLowerCase().includes(s) || String(m.display_name || '').toLowerCase().includes(s),
    );
  }, [rows, q]);

  const openAdd = () => {
    setModalMode('add');
    setEditingModule(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (m) => {
    setModalMode('edit');
    setEditingModule(m);
    setForm({
      name: m.name || '',
      display_name: m.display_name || '',
      is_menu_item: m.is_menu_item !== false,
      display_order: m.display_order ?? 0,
    });
    setShowModal(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const name = (form.name || '').trim();
    const display_name = (form.display_name || '').trim();
    if (!name || !display_name) { showNotify?.('Name and display name are required', 'error'); return; }
    setBusy(true);
    const label = modalMode === 'add' ? 'Creating module…' : 'Saving module…';
    await lockRun(async () => {
      try {
        if (modalMode === 'add') {
          await createModule({ name, display_name, is_menu_item: !!form.is_menu_item, display_order: Number(form.display_order) || 0 });
          showNotify?.('Module created', 'success');
        } else if (editingModule) {
          await updateModule(editingModule.id, { name, display_name, is_menu_item: !!form.is_menu_item, display_order: Number(form.display_order) || 0 });
          showNotify?.('Module updated', 'success');
        }
        setShowModal(false);
        await load();
      } catch (err) {
        showNotify?.(err?.message || (modalMode === 'add' ? 'Create failed' : 'Update failed'), 'error');
      } finally {
        setBusy(false);
      }
    }, label);
  };

  const toggleActive = async (m) => {
    setBusy(true);
    const label = m.is_active !== false ? 'Deactivating…' : 'Activating…';
    await lockRun(async () => {
      try {
        await updateModule(m.id, { is_active: !m.is_active });
        showNotify?.(`Module ${m.is_active !== false ? 'deactivated' : 'activated'}`, 'success');
        await load();
      } catch (err) {
        showNotify?.(err?.message || 'Update failed', 'error');
      } finally {
        setBusy(false);
      }
    }, label);
  };

  const activeCount = rows.filter((m) => m.is_active !== false).length;
  const menuCount = rows.filter((m) => m.is_menu_item !== false).length;

  if (loading) {
    return (
      <div className="mod-page animate-slide-up">
        <div className="mod-card mod-loading-card">
          <InlineSpinner size={28} />
          <p>Loading modules…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mod-page animate-slide-up" style={{ position: 'relative' }}>
      <ActionOverlay show={locked} message={lockMsg} />
      <div className="mod-card">
        {/* Header */}
        <div className="mod-card-header">
          <div className="mod-header-left">
            <div className="mod-header-icon">
              <Layers size={22} strokeWidth={2} />
            </div>
            <div>
              <p className="mod-subtitle mod-subtitle--solo">
                Define sidebar entries and keys used by RBAC. The internal <em>name</em> maps to API permission checks.
              </p>
            </div>
          </div>
          <div className="mod-header-stats">
            <div className="mod-stat">
              <span className="mod-stat-value">{rows.length}</span>
              <span className="mod-stat-label">Total</span>
            </div>
            <div className="mod-stat-divider" />
            <div className="mod-stat">
              <span className="mod-stat-value">{activeCount}</span>
              <span className="mod-stat-label">Active</span>
            </div>
            <div className="mod-stat-divider" />
            <div className="mod-stat">
              <span className="mod-stat-value">{menuCount}</span>
              <span className="mod-stat-label">Menu</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mod-toolbar">
          <div className="mod-search">
            <Search size={15} />
            <input
              type="search"
              placeholder="Search modules…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setQ('')}
            />
          </div>
          <div className="mod-toolbar-actions">
            <button type="button" className="mod-btn mod-btn--ghost" onClick={load} disabled={busy || loading}>
              <RefreshCw size={15} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            <button type="button" className="mod-btn mod-btn--primary" onClick={openAdd}>
              <Plus size={15} /> New module
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mod-table-wrap">
          {filtered.length === 0 ? (
            <div className="mod-empty">
              <Layers size={36} strokeWidth={1.2} />
              <p className="mod-empty-title">No modules found</p>
              <p className="mod-empty-sub">
                {rows.length === 0 ? 'No modules returned from the server.' : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Internal name</th>
                  <th>Display name</th>
                  <th>Menu item</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th className="mod-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const isActive = m.is_active !== false;
                  const isMenu = m.is_menu_item !== false;
                  return (
                    <tr key={m.id} className={isActive ? '' : 'mod-row--inactive'}>
                      <td>
                        <code className="mod-code-pill">{m.name}</code>
                      </td>
                      <td className="mod-display-cell">
                        <span className="mod-display-name">{m.display_name}</span>
                      </td>
                      <td>
                        {isMenu ? (
                          <span className="mod-badge mod-badge--menu">
                            <Menu size={10} /> Menu
                          </span>
                        ) : (
                          <span className="mod-badge mod-badge--internal">Internal</span>
                        )}
                      </td>
                      <td>
                        <span className="mod-order-badge">{m.display_order ?? 0}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`mod-toggle-btn ${isActive ? 'mod-toggle-btn--on' : 'mod-toggle-btn--off'}`}
                          onClick={() => toggleActive(m)}
                          disabled={busy}
                          title={isActive ? 'Deactivate module' : 'Activate module'}
                        >
                          {isActive
                            ? <><ToggleRight size={14} /> Active</>
                            : <><ToggleLeft size={14} /> Inactive</>
                          }
                        </button>
                      </td>
                      <td className="mod-col-actions">
                        <button
                          type="button"
                          className="mod-icon-btn"
                          title="Edit module"
                          onClick={() => openEdit(m)}
                        >
                          <Pencil size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="mod-table-footer">
            <span className="mod-muted">
              {filtered.length} module{filtered.length !== 1 ? 's' : ''}
              {(q || '').trim() ? ' (filtered)' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="mod-modal-overlay" role="dialog" aria-modal="true">
          <div className="mod-modal">
            <div className="mod-modal-header">
              <div className="mod-modal-title-row">
                <div className="mod-modal-icon"><Layers size={16} /></div>
                <h3>{modalMode === 'add' ? 'New module' : 'Edit module'}</h3>
              </div>
              <button type="button" className="mod-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitForm} className="mod-modal-form">
              <div className="mod-field">
                <label htmlFor="mod-name">Internal name</label>
                <input
                  id="mod-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. orders"
                  className="mod-input mod-input--mono"
                  autoFocus
                  disabled={modalMode === 'edit'}
                />
                <span className="mod-field-hint">
                  {modalMode === 'edit'
                    ? 'Internal name cannot be changed — it is used in API permission checks.'
                    : 'Lowercase snake_case key, e.g. lab_results. Cannot be changed after creation.'}
                </span>
              </div>

              <div className="mod-field">
                <label htmlFor="mod-display">Display name</label>
                <input
                  id="mod-display"
                  required
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Orders"
                  className="mod-input"
                />
              </div>

              <div className="mod-field-row">
                <div className="mod-field mod-field--grow">
                  <label htmlFor="mod-order">Display order</label>
                  <input
                    id="mod-order"
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                    className="mod-input"
                    placeholder="0"
                  />
                </div>
                <div className="mod-field mod-field--check">
                  <label>Menu item</label>
                  <button
                    type="button"
                    className={`mod-check-toggle ${form.is_menu_item ? 'mod-check-toggle--on' : ''}`}
                    onClick={() => setForm((f) => ({ ...f, is_menu_item: !f.is_menu_item }))}
                  >
                    {form.is_menu_item
                      ? <><ToggleRight size={16} /> Show in menu</>
                      : <><ToggleLeft size={16} /> Hidden</>
                    }
                  </button>
                </div>
              </div>

              <div className="mod-modal-footer">
                <button type="button" className="mod-btn mod-btn--ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="mod-btn mod-btn--primary" disabled={busy}>
                  {busy ? 'Saving…' : modalMode === 'add' ? 'Create module' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppModulesTab;
