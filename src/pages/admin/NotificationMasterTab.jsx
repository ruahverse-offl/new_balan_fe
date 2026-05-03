import React, { useMemo, useState } from 'react';
import {
  Bell,
  Braces,
  Copy,
  Eye,
  Layers,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import ActionOverlay from '../../components/admin/ActionOverlay';
import { useActionLock } from '../../hooks/useActionLock';
import {
  Btn,
  IconBtn,
  StatusBadge,
  EmptyState,
  TableFooter,
  ConfirmModal,
  FormModal,
  FormField,
  Input,
  Textarea,
} from '../../components/admin/AdminUI';

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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { locked, message: lockMsg, run: lockRun } = useActionLock();

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
    await lockRun(async () => {
      let ok = false;
      if (mode === 'add') ok = Boolean(await onCreate?.(payload));
      else if (editing?.id) ok = Boolean(await onUpdate?.(editing.id, payload));
      if (ok) setModalOpen(false);
    }, mode === 'add' ? 'Creating template…' : 'Saving template…');
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm?.id) return;
    const row = deleteConfirm;
    setDeleteConfirm(null);
    await lockRun(async () => {
      await onDelete?.(row);
    }, 'Deleting template…');
  };

  return (
    <div className="admin-table-card catalog-tab-card animate-slide-up ntf-page" style={{ position: 'relative' }}>
      <ActionOverlay show={locked} message={lockMsg} />

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
        <Btn variant="ghost" size="sm" onClick={() => lockRun(async () => { await onRefresh?.(); }, 'Refreshing…')}>
          Refresh
        </Btn>
        <Btn variant="primary" size="md" onClick={openAdd} style={{ marginLeft: 'auto' }}>
          <Plus size={15} /> New template
        </Btn>
        <span className="ntf-toolbar-meta">
          Showing {filtered.length}
          {searchTerm?.trim() ? ` of ${(rows || []).length}` : ''}
        </span>
      </div>

      <div className="scrollable-section-wrapper">
        <div className="table-wrapper ntf-table-wrap">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No templates match"
              description={
                (rows || []).length === 0
                  ? 'Create a template so outbound jobs can resolve title, body, and variables per event.'
                  : 'Try clearing search or widening your filter.'
              }
              action={
                (rows || []).length === 0 ? (
                  <Btn variant="primary" size="sm" onClick={openAdd}>
                    <Plus size={14} /> New template
                  </Btn>
                ) : null
              }
            />
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
                        <StatusBadge status={row.is_active !== false ? 'active' : 'inactive'} />
                      </td>
                      <td data-label="Actions" className="actions">
                        <IconBtn title="View" onClick={() => openView(row)}>
                          <Eye size={14} />
                        </IconBtn>
                        <IconBtn title="Edit" onClick={() => openEdit(row)}>
                          <Pencil size={14} />
                        </IconBtn>
                        <IconBtn variant="danger" title="Delete" onClick={() => setDeleteConfirm(row)}>
                          <Trash2 size={14} />
                        </IconBtn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {filtered.length > 0 && (
        <TableFooter
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          rowsPerPage={rowsPerPage}
          onRowsChange={(n) => { setRowsPerPage(n); setPage(1); }}
          onPage={setPage}
          label="templates"
          rowsOptions={[10, 20, 50]}
        />
      )}

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
                      <StatusBadge status={viewRow.is_active !== false ? 'active' : 'inactive'} />
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
              <Btn variant="ghost" size="sm" onClick={() => copyText(JSON.stringify(viewRow.channel_templates || {}, null, 2))}>
                <Copy size={15} /> Copy JSON
              </Btn>
              <Btn
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewRow(null);
                  openEdit(viewRow);
                }}
              >
                <Pencil size={15} /> Edit
              </Btn>
              <Btn variant="primary" size="sm" onClick={() => setViewRow(null)}>
                Close
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      <FormModal
        show={modalOpen}
        title={mode === 'add' ? 'New template' : 'Edit template'}
        icon={Bell}
        iconColor="purple"
        size="lg"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={submit} disabled={!!jsonError}>
              {mode === 'add' ? 'Create' : 'Save'}
            </Btn>
          </>
        }
      >
        <form id="ntf-master-form" onSubmit={submit}>
          <FormField label="Event code" htmlFor="ntf-ev-code" required hint={mode === 'edit' ? 'Cannot change after create.' : undefined}>
            <Input
              id="ntf-ev-code"
              value={form.event_code}
              onChange={(e) => setForm((p) => ({ ...p, event_code: e.target.value }))}
              placeholder="ORDER_PLACED"
              required
              disabled={mode === 'edit'}
            />
          </FormField>
          <FormField label="Event name" htmlFor="ntf-ev-name" required>
            <Input
              id="ntf-ev-name"
              value={form.event_name}
              onChange={(e) => setForm((p) => ({ ...p, event_name: e.target.value }))}
              placeholder="Human-readable label"
              required
            />
          </FormField>
          <FormField label="Description" htmlFor="ntf-desc">
            <Textarea
              id="ntf-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Optional context for admins"
              rows={2}
            />
          </FormField>

          <div className="ntf-form-section">
            <div className="ntf-form-actions-row">
              <p className="ntf-form-section-label" style={{ margin: 0, flex: 1 }}>
                Channel templates (JSON)
              </p>
              <Btn variant="ghost" size="sm" onClick={formatJson}>
                <Braces size={14} /> Format
              </Btn>
            </div>
            <FormField label="" htmlFor="ntf-json">
              <Textarea
                id="ntf-json"
                className={`ntf-json${jsonError ? ' input-error' : ''}`}
                value={form.channel_templates_text}
                onChange={(e) => handleJsonChange(e.target.value)}
                required
                spellCheck={false}
                aria-invalid={!!jsonError}
                rows={12}
              />
              {jsonError ? (
                <p style={{ color: '#991b1b', fontSize: '0.78rem', marginTop: '0.35rem' }}>{jsonError}</p>
              ) : (
                <p className="ntf-json-hint" style={{ marginTop: '0.35rem' }}>
                  Use <code>{'{{variable}}'}</code> in strings. Top-level keys are channel ids (e.g. <code>push</code>).
                </p>
              )}
            </FormField>
          </div>

          <FormField label="" htmlFor="ntf-active">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                id="ntf-active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Template is active
            </label>
          </FormField>
        </form>
      </FormModal>

      <ConfirmModal
        show={!!deleteConfirm}
        title="Delete template?"
        message={`Remove notification template "${deleteConfirm?.event_code || deleteConfirm?.id}"? This cannot be undone if downstream jobs expect it.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
