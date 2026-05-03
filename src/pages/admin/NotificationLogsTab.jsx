import React, { useMemo, useState } from 'react';
import { BellRing, Copy, Layers, RefreshCw, Search, X } from 'lucide-react';

import { PageLoading } from '../../components/common/PageLoading';
import ActionOverlay from '../../components/admin/ActionOverlay';
import { useActionLock } from '../../hooks/useActionLock';
import { Btn, EmptyState, TableFooter } from '../../components/admin/AdminUI';

import './AdminCatalogTabs.css';
import './NotificationTabs.css';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'retrying', label: 'Retrying' },
  { value: 'dropped', label: 'Dropped' },
];

const CHANNEL_OPTIONS = [
  { value: '', label: 'All channels' },
  { value: 'push', label: 'Push' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(value);
  }
}

function shortId(id) {
  if (!id) return '—';
  const s = String(id);
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

function normalizeStatus(s) {
  return String(s || '').toLowerCase() || 'unknown';
}

function parseMaybeJson(val) {
  if (val == null) return null;
  if (typeof val === 'object') return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

async function copyText(text) {
  const t = String(text ?? '');
  if (!t) return;
  try { await navigator.clipboard.writeText(t); } catch { /* ignore */ }
}

export default function NotificationLogsTab({
  rows = [],
  total = 0,
  loading = false,
  searchTerm = '',
  setSearchTerm,
  statusFilter = '',
  setStatusFilter,
  channelFilter = '',
  setChannelFilter,
  page = 1,
  setPage,
  rowsPerPage = 20,
  setRowsPerPage,
  onRefresh,
}) {
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('summary');
  const { locked, message: lockMsg, run: lockRun } = useActionLock();

  // Search is client-side only (backend logs endpoint has no search param)
  const visible = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return rows;
    return (rows || []).filter((r) =>
      [r.user_id, r.user_name, r.notification_master_id, r.event_code,
        r.notification_setting_id, r.send_status, r.channel, r.error_message, r.expo_push_token]
        .some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [rows, searchTerm]);

  const totalPages = Math.ceil(total / rowsPerPage) || 1;

  const openDetail = (row) => {
    setDetailTab('summary');
    setDetail(row);
  };

  const providerPretty = detail ? parseMaybeJson(detail.provider_response) : null;

  return (
    <div className="admin-table-card catalog-tab-card animate-slide-up ntf-page" style={{ position: 'relative' }}>
      <ActionOverlay show={locked} message={lockMsg} />

      <section className="ntf-kpis" aria-label="Status breakdown">
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{total.toLocaleString('en-IN')}</span>
          <span className="ntf-kpi-label">Total</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#92400e' }}>
            {(rows || []).filter((r) => normalizeStatus(r.send_status) === 'queued').length}
          </span>
          <span className="ntf-kpi-label">Queued (page)</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#166534' }}>
            {(rows || []).filter((r) => normalizeStatus(r.send_status) === 'sent').length}
          </span>
          <span className="ntf-kpi-label">Sent (page)</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#991b1b' }}>
            {(rows || []).filter((r) => normalizeStatus(r.send_status) === 'failed').length}
          </span>
          <span className="ntf-kpi-label">Failed (page)</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#5b21b6' }}>
            {(rows || []).filter((r) => normalizeStatus(r.send_status) === 'retrying').length}
          </span>
          <span className="ntf-kpi-label">Retrying (page)</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#475569' }}>
            {(rows || []).filter((r) => normalizeStatus(r.send_status) === 'dropped').length}
          </span>
          <span className="ntf-kpi-label">Dropped (page)</span>
        </div>
      </section>

      <div className="catalog-tab-toolbar ntf-toolbar">
        <div className="table-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search user, template id, token, error…"
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm?.(e.target.value)}
            aria-label="Search logs"
          />
        </div>
        <label className="catalog-rows-label">
          Status
          <select
            className="catalog-rows-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter?.(e.target.value); setPage?.(1); }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="catalog-rows-label">
          Channel
          <select
            className="catalog-rows-select"
            value={channelFilter}
            onChange={(e) => { setChannelFilter?.(e.target.value); setPage?.(1); }}
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value || 'all-ch'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <Btn
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={() => lockRun(async () => { await onRefresh?.(); }, 'Refreshing logs…')}
        >
          <RefreshCw size={16} className={loading ? 'aui-spin' : ''} /> Refresh
        </Btn>
        <span className="ntf-toolbar-meta">{visible.length} rows{searchTerm?.trim() ? ` (filtered)` : ''}</span>
      </div>

      <div className="scrollable-section-wrapper">
        <div className="table-wrapper ntf-table-wrap">
          {loading ? (
            <PageLoading variant="compact" className="catalog-loading" message="Loading notification logs…" />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={BellRing}
              title="No log entries"
              description={
                total === 0
                  ? 'When the backend enqueues or sends notifications, attempts will show up here.'
                  : 'No rows match your search. Try clearing the search term.'
              }
            />
          ) : (
            <table className="admin-table catalog-table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>User</th>
                  <th>Template</th>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Retries</th>
                  <th>Timeline</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const st = normalizeStatus(row.send_status);
                  const maxR = Number(row.max_retry_attempts || 0);
                  const cur = Number(row.retry_count || 0);
                  const pct = maxR > 0 ? Math.min(100, (cur / maxR) * 100) : 0;
                  const over = maxR > 0 && cur >= maxR && st !== 'sent';
                  return (
                    <tr key={row.id} className="ntf-row-clickable" onClick={() => openDetail(row)}>
                      <td data-label="Created">{formatDate(row.created_at)}</td>
                      <td data-label="User">
                        <div className="ntf-token-cell" onClick={(e) => e.stopPropagation()}>
                          <span title={String(row.user_id)}>
                            {row.user_name || shortId(row.user_id)}
                          </span>
                          <button type="button" className="ntf-icon-btn" title="Copy user id"
                            onClick={() => copyText(row.user_id)}>
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td data-label="Template">
                        <span title={String(row.notification_master_id)}>
                          {row.event_code || shortId(row.notification_master_id)}
                        </span>
                      </td>
                      <td data-label="Channel">
                        <span className="ntf-chip" style={{ textTransform: 'none' }}>
                          {row.channel || 'push'}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`status-tag ntf-log-status ${st}`}>{row.send_status || '—'}</span>
                      </td>
                      <td data-label="Retries">
                        <div className={`ntf-retry-meter ${over ? 'over' : ''}`}>
                          <div className="ntf-retry-bar">
                            <span style={{ width: `${pct}%` }} />
                          </div>
                          <span className="ntf-retry-label">{cur}/{maxR || '—'}</span>
                        </div>
                      </td>
                      <td data-label="Timeline">
                        <div className="ntf-mono-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span title="Sent at">{row.sent_at ? `Sent ${formatDate(row.sent_at)}` : 'Not sent'}</span>
                          <span title="Next retry" style={{ color: '#94a3b8' }}>
                            {row.next_retry_at ? `Next ${formatDate(row.next_retry_at)}` : ''}
                          </span>
                        </div>
                      </td>
                      <td data-label="Error">
                        <div className="ntf-error-line" title={row.error_message || ''}>
                          {row.error_message || '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {!loading && total > 0 && (
        <TableFooter
          page={page}
          totalPages={totalPages}
          total={total}
          rowsPerPage={rowsPerPage}
          onRowsChange={(n) => { setRowsPerPage?.(n); setPage?.(1); }}
          onPage={(p) => setPage?.(p)}
          label="log entries"
          rowsOptions={[10, 20, 50]}
        />
      )}

      {detail ? (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal ntf-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} />
                Log detail
              </h3>
              <button type="button" onClick={() => setDetail(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="ntf-modal-tabs" role="tablist">
              {['summary', 'payload', 'provider'].map((tab) => (
                <button key={tab} type="button" role="tab"
                  className={`ntf-modal-tab ${detailTab === tab ? 'is-active' : ''}`}
                  onClick={() => setDetailTab(tab)}>
                  {tab === 'summary' ? 'Summary' : tab === 'payload' ? 'Payload' : 'Provider'}
                </button>
              ))}
            </div>
            <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
              {detailTab === 'summary' ? (
                <div className="ntf-detail-grid">
                  <div className="ntf-dl">
                    <dt>Status</dt>
                    <dd>
                      <span className={`status-tag ntf-log-status ${normalizeStatus(detail.send_status)}`}>
                        {detail.send_status}
                      </span>
                    </dd>
                  </div>
                  <div className="ntf-dl">
                    <dt>Channel</dt>
                    <dd>{detail.channel || 'push'}</dd>
                  </div>
                  <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                    <dt>User</dt>
                    <dd>
                      {detail.user_name ? <strong>{detail.user_name}</strong> : null}
                      <span className="ntf-mono" style={{ fontSize: '0.78rem', display: 'block' }}>{detail.user_id}</span>
                    </dd>
                  </div>
                  <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                    <dt>Template</dt>
                    <dd>
                      {detail.event_code ? <strong>{detail.event_code}</strong> : null}
                      <span className="ntf-mono" style={{ fontSize: '0.78rem', display: 'block' }}>{detail.notification_master_id}</span>
                    </dd>
                  </div>
                  {detail.notification_setting_id ? (
                    <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                      <dt>Settings row</dt>
                      <dd className="ntf-mono" style={{ fontSize: '0.78rem' }}>{detail.notification_setting_id}</dd>
                    </div>
                  ) : null}
                  <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                    <dt>Expo token</dt>
                    <dd className="ntf-mono" style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>
                      {detail.expo_push_token || '—'}
                    </dd>
                  </div>
                  <div className="ntf-dl">
                    <dt>Retries</dt>
                    <dd>{detail.retry_count} / {detail.max_retry_attempts}</dd>
                  </div>
                  <div className="ntf-dl">
                    <dt>Created</dt>
                    <dd>{formatDate(detail.created_at)}</dd>
                  </div>
                  <div className="ntf-dl">
                    <dt>Sent at</dt>
                    <dd>{formatDate(detail.sent_at)}</dd>
                  </div>
                  <div className="ntf-dl">
                    <dt>Next retry</dt>
                    <dd>{formatDate(detail.next_retry_at)}</dd>
                  </div>
                  {detail.error_message ? (
                    <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                      <dt>Error</dt>
                      <dd style={{ color: '#991b1b', fontWeight: 600 }}>{detail.error_message}</dd>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {detailTab === 'payload' ? (
                <pre className="ntf-view-pre">
                  {JSON.stringify(
                    detail.payload_snapshot && typeof detail.payload_snapshot === 'object'
                      ? detail.payload_snapshot
                      : parseMaybeJson(detail.payload_snapshot) || {},
                    null, 2,
                  )}
                </pre>
              ) : null}
              {detailTab === 'provider' ? (
                <pre className="ntf-view-pre">
                  {typeof providerPretty === 'string'
                    ? providerPretty
                    : JSON.stringify(providerPretty ?? {}, null, 2)}
                </pre>
              ) : null}
            </div>
            <div className="modal-actions"
              style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)', padding: '1rem 1.5rem', gap: '0.5rem' }}>
              <Btn variant="ghost" size="sm" onClick={() => {
                const blob = detailTab === 'payload'
                  ? JSON.stringify(detail.payload_snapshot || {}, null, 2)
                  : detailTab === 'provider'
                    ? (typeof providerPretty === 'string' ? providerPretty : JSON.stringify(providerPretty ?? {}, null, 2))
                    : JSON.stringify(detail, null, 2);
                copyText(blob);
              }}>
                <Copy size={15} /> Copy visible JSON
              </Btn>
              <Btn variant="primary" size="sm" onClick={() => setDetail(null)}>Close</Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
