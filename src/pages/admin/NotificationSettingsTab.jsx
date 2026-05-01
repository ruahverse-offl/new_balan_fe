import React, { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Copy, Monitor, RefreshCw, Search, Smartphone } from 'lucide-react';

import './AdminCatalogTabs.css';
import './NotificationTabs.css';

async function copyText(text) {
  const t = String(text ?? '');
  if (!t) return;
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    // ignore
  }
}

function shortId(id) {
  if (!id) return '—';
  const s = String(id);
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

export default function NotificationSettingsTab({
  rows = [],
  searchTerm = '',
  setSearchTerm,
  onRefresh,
  onTogglePush,
}) {
  const [platformFilter, setPlatformFilter] = useState('all');
  const [pushFilter, setPushFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = (searchTerm || '').trim().toLowerCase();
    return (rows || []).filter((r) => {
      const plat = String(r.device_platform || 'unknown').toLowerCase();
      if (platformFilter !== 'all' && plat !== platformFilter) return false;
      if (pushFilter === 'on' && !r.is_push_enabled) return false;
      if (pushFilter === 'off' && r.is_push_enabled) return false;
      if (!q) return true;
      return [r.user_id, r.device_id, r.device_platform, r.expo_push_token].some((v) =>
        String(v || '').toLowerCase().includes(q),
      );
    });
  }, [rows, searchTerm, platformFilter, pushFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const pageRows = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const kpis = useMemo(() => {
    const list = rows || [];
    const pushOn = list.filter((r) => r.is_push_enabled).length;
    const byPlat = { android: 0, ios: 0, web: 0, unknown: 0 };
    list.forEach((r) => {
      const k = String(r.device_platform || 'unknown').toLowerCase();
      if (byPlat[k] !== undefined) byPlat[k] += 1;
      else byPlat.unknown += 1;
    });
    return { total: list.length, pushOn, byPlat };
  }, [rows]);

  return (
    <div className="admin-table-card catalog-tab-card animate-slide-up ntf-page">
      <header className="ntf-hero">
        <div className="ntf-hero-inner">
          <div className="ntf-hero-text">
            <div className="ntf-eyebrow">
              <Smartphone size={12} strokeWidth={2.5} aria-hidden />
              Device registry
            </div>
            <h2 className="ntf-title">Notification settings</h2>
            <p className="ntf-lead">
              Expo tokens registered per user and device. Use this view to audit installs and to disable push for a
              specific token without touching the user account.
            </p>
          </div>
        </div>
      </header>

      <section className="ntf-kpis" aria-label="Summary">
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{kpis.total}</span>
          <span className="ntf-kpi-label">Rows</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value" style={{ color: '#166534' }}>
            {kpis.pushOn}
          </span>
          <span className="ntf-kpi-label">Push on</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{kpis.byPlat.android}</span>
          <span className="ntf-kpi-label">Android</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{kpis.byPlat.ios}</span>
          <span className="ntf-kpi-label">iOS</span>
        </div>
        <div className="ntf-kpi">
          <span className="ntf-kpi-value">{kpis.byPlat.web}</span>
          <span className="ntf-kpi-label">Web</span>
        </div>
      </section>

      <div className="catalog-tab-toolbar ntf-toolbar">
        <div className="table-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search user id, device id, platform, or token…"
            value={searchTerm || ''}
            onChange={(e) => { setSearchTerm?.(e.target.value); setPage(1); }}
            aria-label="Search settings"
          />
        </div>
        <div className="ntf-segments" role="group" aria-label="Platform">
          {['all', 'android', 'ios', 'web', 'unknown'].map((p) => (
            <button
              key={p}
              type="button"
              className={`ntf-seg ${platformFilter === p ? 'is-on' : ''}`}
              onClick={() => setPlatformFilter(p)}
            >
              {p === 'all' ? 'All platforms' : p}
            </button>
          ))}
        </div>
        <div className="ntf-segments" role="group" aria-label="Push preference">
          {[
            { id: 'all', label: 'All' },
            { id: 'on', label: 'Push on' },
            { id: 'off', label: 'Push off' },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              className={`ntf-seg ${pushFilter === o.id ? 'is-on' : ''}`}
              onClick={() => setPushFilter(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn-secondary" onClick={onRefresh}>
          <RefreshCw size={16} /> Refresh
        </button>
        <span className="ntf-toolbar-meta">
          {filtered.length} shown
          {(searchTerm?.trim() || platformFilter !== 'all' || pushFilter !== 'all') && ` · ${(rows || []).length} total`}
        </span>
      </div>

      <div className="scrollable-section-wrapper">
        <div className="table-wrapper ntf-table-wrap">
          {filtered.length === 0 ? (
            <div className="ntf-empty">
              <div className="ntf-empty-icon">
                <Monitor size={28} strokeWidth={1.75} />
              </div>
              <p className="ntf-empty-title">Nothing to show</p>
              <p>
                {(rows || []).length === 0
                  ? 'Tokens appear after a signed-in user opens the app and notification permission is handled.'
                  : 'Adjust filters or search — no rows match right now.'}
              </p>
            </div>
          ) : (
            <table className="admin-table catalog-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Device</th>
                  <th>Platform</th>
                  <th>Expo token</th>
                  <th>Push</th>
                  <th>Row</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const plat = String(row.device_platform || 'unknown').toLowerCase();
                  return (
                    <tr key={row.id}>
                      <td data-label="User">
                        <div className="ntf-token-cell">
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
                      <td data-label="Device">
                        <span className="ntf-mono-sm" title={row.device_id || ''}>
                          {row.device_id ? shortId(row.device_id) : '—'}
                        </span>
                      </td>
                      <td data-label="Platform">
                        <span className={`ntf-platform ${plat}`}>{row.device_platform || 'unknown'}</span>
                      </td>
                      <td data-label="Token">
                        <div className="ntf-token-cell">
                          <div className="ntf-token" title={row.expo_push_token}>
                            {row.expo_push_token || '—'}
                          </div>
                          <button
                            type="button"
                            className="ntf-icon-btn"
                            title="Copy token"
                            onClick={() => copyText(row.expo_push_token)}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td data-label="Push">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className={`ntf-switch ${row.is_push_enabled ? 'on' : ''}`}
                            title={row.is_push_enabled ? 'Disable push for this token' : 'Enable push'}
                            aria-pressed={row.is_push_enabled}
                            onClick={() => onTogglePush?.(row)}
                          />
                          <span className="ntf-mono-sm">{row.is_push_enabled ? 'On' : 'Off'}</span>
                        </div>
                      </td>
                      <td data-label="Row">
                        <span className={`status-tag ${row.is_active !== false ? 'active' : 'inactive'}`}>
                          {row.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td data-label="Updated">
                        <span className="ntf-mono-sm" style={{ whiteSpace: 'nowrap' }}>
                          {row.updated_at
                            ? new Date(row.updated_at).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </span>
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
    </div>
  );
}
