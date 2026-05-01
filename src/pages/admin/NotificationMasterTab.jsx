import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Braces,
  ChevronRight,
  Copy,
  Eye,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

import './AdminCatalogTabs.css';
import './NotificationTabs.css';

const EMPTY_CHANNELS = JSON.stringify(
  {
    push: {
      title_template: 'Order {{order_reference}} update',
      body_template: 'Hi {{customer_name}}, your order is now {{order_status}}.',
      message_variables: ['order_reference', 'customer_name', 'order_status'],
      is_enabled: true,
    },
  },
  null,
  2,
);

function parseChannelsJson(raw) {
  try {
    const parsed = JSON.parse(raw || '{}');
    if (parsed && typeof parsed === 'object') return { ok: true, value: parsed };
  } catch {
    // ignore
  }
  return { ok: false, value: {} };
}

async function copyText(text) {
  const t = String(text ?? '');
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    // ignore
  }
}

export default function NotificationMasterTab({
  rows = [],
  searchTerm = '',
  setSearchTerm,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('add');
  const [editing, setEditing] = useState(null);
  const [viewRow, setViewRow] = useState(null);
  const [viewTab, setViewTab] = useState('overview');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [form, setForm] = useState({
    event_code: '',
    event_name: '',
    description: '',
    is_active: true,
    channel_templates_text: EMPTY_CHANNELS,
  });
  const [jsonError, setJsonError] = useState('');

  const filtered = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return rows || [];
    return (rows || []).filter((r) =>
      [r.event_code, r.event_name, r.description].some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [rows, searchTerm]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const kpis = useMemo(() => {
    const list = rows || [];
    const active = list.filter((r) => r.is_active !== false).length;
    const inactive = list.length - active;
    const channelSet = new Set();
    list.forEach((r) => {
      Object.keys(r.channel_templates || {}).forEach((k) => channelSet.add(k));
    });
    return {
      total: list.length,
      active,
      inactive,
      channelKinds: channelSet.size,
    };
  }, [rows]);

  const openAdd = () => {
    setMode('add');
    setEditing(null);
    setJsonError('');
    setForm({
      event_code: '',
      event_name: '',
      description: '',
      is_active: true,
      channel_templates_text: EMPTY_CHANNELS,
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setMode('edit');
    setEditing(row);
    setJsonError('');
    setForm({
      event_code: row.event_code || '',
      event_name: row.event_name || '',
      description: row.description || '',
      is_active: row.is_active !== false,
      channel_templates_text: JSON.stringify(row.channel_templates || {}, null, 2),
    });
    setModalOpen(true);
  };

  const openView = (row) => {
    setViewTab('overview');
    setViewRow(row);
  };

  const handleJsonChange = (val) => {
    setForm((p) => ({ ...p, channel_templates_text: val }));
    const { ok } = parseChannelsJson(val);
    setJsonError(ok ? '' : 'Invalid JSON — check syntax.');
  };

  const formatJson = () => {
    const parsed = parseChannelsJson(form.channel_templates_text);
    if (!parsed.ok) {
      setJsonError('Cannot format — JSON is invalid.');
      return;
    }
    setForm((p) => ({ ...p, channel_templates_text: JSON.stringify(parsed.value, null, 2) }));
    setJsonError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const parsed = parseChannelsJson(form.channel_templates_text);
    if (!parsed.ok) {
      setJsonError('Invalid JSON — fix before saving.');
      return;
    }
    const payload = {
      event_code: form.event_code.trim().toUpperCase(),
      event_name: form.event_name.trim(),
      description: form.description.trim() || null,
      is_active: Boolean(form.is_active),
      channel_templates: parsed.value,
    };
    if (!payload.event_code || !payload.event_name) return;
    if (mode === 'add') await onCreate?.(payload);
    else if (editing?.id) await onUpdate?.(editing.id, payload);
    setModalOpen(false);
  };

  return (
    <div className="admin-table-card catalog-tab-card animate-slide-up ntf-page">
      <header className="ntf-hero">
        <div className="ntf-hero-inner">
          <div className="ntf-hero-text">
            <div className="ntf-eyebrow">
              <Sparkles size={12} strokeWidth={2.5} aria-hidden />
              Master templates
            </div>
            <h2 className="ntf-title">Notification templates</h2>
            <p className="ntf-lead">
              One row per business event. Channel blocks define push (and future channels) copy, merge fields, and
              on/off flags. Codes are immutable after create.
            </p>
          </div>
        </div>
      </header>

      <section className="ntf-kpis" aria-label="Summary">
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{kpis.total}</span>
          <span className="ntf-kpi-label">Templates</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#166534' }}>
            {kpis.active}
          </span>
          <span className="ntf-kpi-label">Active</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#64748b' }}>
            {kpis.inactive}
          </span>
          <span className="ntf-kpi-label">Inactive</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{kpis.channelKinds}</span>
          <span className="ntf-kpi-label">Channel types</span>
          <span className="ntf-kpi-sub">Across all rows</span>
        </div>
      </section>

      <div className="catalog-tab-toolbar ntf-toolbar">
        <div className="table-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Filter by code, name, or description…"
            value={searchTerm || ''}
            onChange={(e) => { setSearchTerm?.(e.target.value); setPage(1); }}
            aria-label="Search templates"
          />
        </div>
        <button type="button" className="btn-secondary" onClick={onRefresh}>
          Refresh
        </button>
        <button type="button" className="btn-add" onClick={openAdd}>
          <Plus size={18} /> New template
        </button>
        <span className="ntf-toolbar-meta">
          Showing {filtered.length}
          {searchTerm?.trim() ? ` of ${(rows || []).length}` : ''}
        </span>
      </div>

      <div className="scrollable-section-wrapper">
        <div className="table-wrapper ntf-table-wrap">
          {filtered.length === 0 ? (
            <div className="ntf-empty">
              <div className="ntf-empty-icon">
                <Bell size={28} strokeWidth={1.75} />
              </div>
              <p className="ntf-empty-title">No templates match</p>
              <p>
                {(rows || []).length === 0
                  ? 'Create a template so outbound jobs can resolve title, body, and variables per event.'
                  : 'Try clearing search or widening your filter.'}
              </p>
            </div>
          ) : (
            <table className="admin-table catalog-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Channels</th>
                  <th>Status</th>
                  <th style={{ width: '9.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const ch = row.channel_templates || {};
                  const keys = Object.keys(ch);
                  return (
                    <tr key={row.id}>
                      <td data-label="Event">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className="ntf-code">{row.event_code}</span>
                          <button
                            type="button"
                            className="ntf-icon-btn"
                            title="Copy event code"
                            onClick={() => copyText(row.event_code)}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div style={{ marginTop: '0.45rem' }}>
                          <strong style={{ fontSize: '0.92rem' }}>{row.event_name || '—'}</strong>
                          {row.description ? <div className="ntf-sub">{row.description}</div> : null}
                        </div>
                      </td>
                      <td data-label="Channels">
                        <div className="ntf-chips">
                          {keys.length > 0 ? (
                            keys.map((c) => (
                              <span key={c} className="ntf-chip">
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="ntf-mono-sm">No channels</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`status-tag ${row.is_active !== false ? 'active' : 'inactive'}`}>
                          {row.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td data-label="Actions" className="actions">
                        <button type="button" className="action-btn" title="View" onClick={() => openView(row)}>
                          <Eye size={16} />
                        </button>
                        <button type="button" className="action-btn" title="Edit" onClick={() => openEdit(row)}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="action-btn delete" title="Delete" onClick={() => onDelete?.(row)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="catalog-tab-footer">
        <label className="catalog-rows-label">
          Rows
          <select className="catalog-rows-select" value={rowsPerPage}
            onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
        {totalPages > 1 && (
          <div className="pagination-bar">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1} className="page-nav-btn">
              <ArrowLeft size={18} /> Prev
            </button>
            <div className="page-numbers">Page <span>{page}</span> of {totalPages}</div>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages} className="page-nav-btn">
              Next <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {viewRow ? (
        <div className="admin-modal-overlay" onClick={() => setViewRow(null)}>
          <div className="admin-modal ntf-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} />
                {viewRow.event_code}
              </h3>
              <button type="button" onClick={() => setViewRow(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="ntf-modal-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={`ntf-modal-tab ${viewTab === 'overview' ? 'is-active' : ''}`}
                onClick={() => setViewTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                role="tab"
                className={`ntf-modal-tab ${viewTab === 'json' ? 'is-active' : ''}`}
                onClick={() => setViewTab('json')}
              >
                Channel JSON
              </button>
            </div>
            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              {viewTab === 'overview' ? (
                <div className="ntf-detail-grid">
                  <div className="ntf-dl">
                    <dt>Event name</dt>
                    <dd>{viewRow.event_name || '—'}</dd>
                  </div>
                  <div className="ntf-dl">
                    <dt>Status</dt>
                    <dd>
                      <span className={`status-tag ${viewRow.is_active !== false ? 'active' : 'inactive'}`}>
                        {viewRow.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  {viewRow.description ? (
                    <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                      <dt>Description</dt>
                      <dd style={{ fontWeight: 500 }}>{viewRow.description}</dd>
                    </div>
                  ) : null}
                  <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                    <dt>Channels</dt>
                    <dd>
                      <div className="ntf-chips">
                        {Object.keys(viewRow.channel_templates || {}).map((c) => (
                          <span key={c} className="ntf-chip">
                            {c}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                </div>
              ) : (
                <pre className="ntf-view-pre">{JSON.stringify(viewRow.channel_templates || {}, null, 2)}</pre>
              )}
            </div>
            <div
              className="modal-actions"
              style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)', padding: '1rem 1.5rem', gap: '0.5rem' }}
            >
              <button type="button" className="btn-secondary" onClick={() => copyText(JSON.stringify(viewRow.channel_templates || {}, null, 2))}>
                <Copy size={15} /> Copy JSON
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setViewRow(null);
                  openEdit(viewRow);
                }}
              >
                <Pencil size={15} /> Edit
              </button>
              <button type="button" className="btn-add" onClick={() => setViewRow(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '640px', width: '96vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{mode === 'add' ? 'New template' : 'Edit template'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form className="modal-form" onSubmit={submit}>
              <div className="form-group">
                <label>Event code *</label>
                <input
                  type="text"
                  value={form.event_code}
                  onChange={(e) => setForm((p) => ({ ...p, event_code: e.target.value }))}
                  placeholder="ORDER_PLACED"
                  required
                  disabled={mode === 'edit'}
                />
                {mode === 'edit' ? (
                  <p className="ntf-json-hint" style={{ marginTop: '0.35rem' }}>
                    Event code cannot change after create (downstream references rely on it).
                  </p>
                ) : null}
              </div>
              <div className="form-group">
                <label>Event name *</label>
                <input
                  type="text"
                  value={form.event_name}
                  onChange={(e) => setForm((p) => ({ ...p, event_name: e.target.value }))}
                  placeholder="Human-readable label"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Optional context for admins"
                  rows={2}
                />
              </div>

              <div className="ntf-form-section">
                <div className="ntf-form-actions-row">
                  <p className="ntf-form-section-label" style={{ margin: 0, flex: 1 }}>
                    Channel templates (JSON)
                  </p>
                  <button type="button" className="btn-secondary mini" onClick={formatJson}>
                    <Braces size={14} /> Format
                  </button>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <textarea
                    className={`ntf-json${jsonError ? ' input-error' : ''}`}
                    value={form.channel_templates_text}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    required
                    spellCheck={false}
                    aria-invalid={!!jsonError}
                  />
                  {jsonError ? (
                    <p style={{ color: '#991b1b', fontSize: '0.78rem', marginTop: '0.35rem' }}>{jsonError}</p>
                  ) : (
                    <p className="ntf-json-hint">
                      Use <code>{'{{variable}}'}</code> in strings. Top-level keys are channel ids (e.g. <code>push</code>
                      ).
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  Template is active
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-add" disabled={!!jsonError}>
                  {mode === 'add' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
