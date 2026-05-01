import React, { useMemo, useState } from 'react';
import {
  Activity,
  BellRing,
  Copy,
  Layers,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

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
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
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

export default function NotificationLogsTab({ rows = [], searchTerm = '', setSearchTerm, onRefresh }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('summary');

  const filtered = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return (rows || []).filter((r) => {
      const st = normalizeStatus(r.send_status);
      if (statusFilter && st !== statusFilter) return false;
      const ch = String(r.channel || 'push').toLowerCase();
      if (channelFilter && ch !== channelFilter) return false;
      if (!q) return true;
      return [
        r.user_id,
        r.notification_master_id,
        r.notification_setting_id,
        r.send_status,
        r.channel,
        r.error_message,
        r.expo_push_token,
      ].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [rows, searchTerm, statusFilter, channelFilter]);

  const statusCounts = useMemo(() => {
    const acc = { queued: 0, sent: 0, failed: 0, retrying: 0, dropped: 0, other: 0 };
    (rows || []).forEach((r) => {
      const k = normalizeStatus(r.send_status);
      if (acc[k] !== undefined) acc[k] += 1;
      else acc.other += 1;
    });
    return acc;
  }, [rows]);

  const openDetail = (row) => {
    setDetailTab('summary');
    setDetail(row);
  };

  const providerPretty = detail ? parseMaybeJson(detail.provider_response) : null;

  return (
    <div className="admin-table-card catalog-tab-card animate-slide-up ntf-page">
      <header className="ntf-hero">
        <div className="ntf-hero-inner">
          <div className="ntf-hero-text">
            <div className="ntf-eyebrow">
              <Activity size={12} strokeWidth={2.5} aria-hidden />
              Delivery audit
            </div>
            <h2 className="ntf-title">Notification logs</h2>
            <p className="ntf-lead">
              Each row is one send attempt: channel, token snapshot, retry state, provider echo, and errors. Open a row
              for payload and response JSON.
            </p>
          </div>
        </div>
      </header>

      <section className="ntf-kpis" aria-label="Status breakdown">
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{(rows || []).length}</span>
          <span className="ntf-kpi-label">Loaded</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#92400e' }}>
            {statusCounts.queued}
          </span>
          <span className="ntf-kpi-label">Queued</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#166534' }}>
            {statusCounts.sent}
          </span>
          <span className="ntf-kpi-label">Sent</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#991b1b' }}>
            {statusCounts.failed}
          </span>
          <span className="ntf-kpi-label">Failed</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#5b21b6' }}>
            {statusCounts.retrying}
          </span>
          <span className="ntf-kpi-label">Retrying</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#475569' }}>
            {statusCounts.dropped}
          </span>
          <span className="ntf-kpi-label">Dropped</span>
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
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="catalog-rows-label">
          Channel
          <select
            className="catalog-rows-select"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value || 'all-ch'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-secondary" onClick={onRefresh}>
          <RefreshCw size={16} /> Refresh
        </button>
        <span className="ntf-toolbar-meta">{filtered.length} rows</span>
      </div>

      <div className="scrollable-section-wrapper">
        <div className="table-wrapper ntf-table-wrap">
          {filtered.length === 0 ? (
            <div className="ntf-empty">
              <div className="ntf-empty-icon">
                <BellRing size={28} strokeWidth={1.75} />
              </div>
              <p className="ntf-empty-title">No log entries</p>
              <p>
                {(rows || []).length === 0
                  ? 'When the backend enqueues or sends notifications, attempts will show up here.'
                  : 'No rows match your filters. Try clearing status or channel.'}
              </p>
            </div>
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
                {filtered.map((row) => {
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
                          <span className="ntf-mono" title={row.user_id}>
                            {shortId(row.user_id)}
                          </span>
                          <button
                            type="button"
                            className="ntf-icon-btn"
                            title="Copy user id"
                            onClick={() => copyText(row.user_id)}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td data-label="Template">
                        <span className="ntf-mono-sm" title={row.notification_master_id}>
                          {shortId(row.notification_master_id)}
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
                          <span className="ntf-retry-label">
                            {cur}/{maxR || '—'}
                          </span>
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
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  className={`ntf-modal-tab ${detailTab === tab ? 'is-active' : ''}`}
                  onClick={() => setDetailTab(tab)}
                >
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
                    <dt>User id</dt>
                    <dd className="ntf-mono" style={{ fontSize: '0.78rem' }}>
                      {detail.user_id}
                    </dd>
                  </div>
                  <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                    <dt>Template id</dt>
                    <dd className="ntf-mono" style={{ fontSize: '0.78rem' }}>
                      {detail.notification_master_id}
                    </dd>
                  </div>
                  {detail.notification_setting_id ? (
                    <div className="ntf-dl" style={{ gridColumn: '1 / -1' }}>
                      <dt>Settings row</dt>
                      <dd className="ntf-mono" style={{ fontSize: '0.78rem' }}>
                        {detail.notification_setting_id}
                      </dd>
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
                    <dd>
                      {detail.retry_count} / {detail.max_retry_attempts}
                    </dd>
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
                  {JSON.stringify(detail.payload_snapshot && typeof detail.payload_snapshot === 'object' ? detail.payload_snapshot : parseMaybeJson(detail.payload_snapshot) || {}, null, 2)}
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
            <div
              className="modal-actions"
              style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)', padding: '1rem 1.5rem', gap: '0.5rem' }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  const blob =
                    detailTab === 'payload'
                      ? JSON.stringify(detail.payload_snapshot || {}, null, 2)
                      : detailTab === 'provider'
                        ? (typeof providerPretty === 'string' ? providerPretty : JSON.stringify(providerPretty ?? {}, null, 2))
                        : JSON.stringify(detail, null, 2);
                  copyText(blob);
                }}
              >
                <Copy size={15} /> Copy visible JSON
              </button>
              <button type="button" className="btn-add" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
