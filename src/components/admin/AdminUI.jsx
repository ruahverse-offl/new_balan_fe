/**
 * AdminUI — shared enterprise components for every admin tab.
 *
 * Exports:
 *   PageCard        wraps a tab in a white card with radius + shadow
 *   CardHeader      icon + title + subtitle + optional stat chips
 *   Toolbar         search bar + action buttons row
 *   SearchInput     controlled search box
 *   Btn             primary / ghost / danger button
 *   IconBtn         small square icon button
 *   StatusBadge     coloured pill for status labels
 *   EmptyState      centered icon + title + description for empty tables
 *   TableFooter     pagination + rows-per-page row
 *   ConfirmModal    "are you sure?" dialog
 *   FormModal       generic modal wrapper
 *   FormField       label + input / textarea + optional hint
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, AlertTriangle } from 'lucide-react';
import './AdminUI.css';

/** Render modals on ``document.body`` so they are not clipped or sized by transformed/overflow ancestors (e.g. ``.admin-table-card`` + ``.animate-slide-up``). */
function portalModal(node) {
  if (typeof document === 'undefined') return node;
  return createPortal(node, document.body);
}

/* ── PageCard ── */
export function PageCard({ children, className = '' }) {
  return <div className={`aui-card ${className}`}>{children}</div>;
}

/* ── CardHeader ── */
export function CardHeader({ icon: Icon, iconColor = 'blue', title, subtitle, stats, actions }) {
  return (
    <div className={`aui-card-header aui-card-header--${iconColor}`}>
      <div className="aui-card-header__left">
        {Icon && (
          <div className={`aui-header-icon aui-header-icon--${iconColor}`}>
            <Icon size={22} strokeWidth={2} />
          </div>
        )}
        <div className="aui-header-copy">
          <h2 className="aui-header-title">{title}</h2>
          {subtitle && <p className="aui-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="aui-card-header__right">
        {stats && stats.length > 0 && (
          <div className="aui-stat-strip">
            {stats.map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="aui-stat-divider" />}
                <div className="aui-stat">
                  <span className="aui-stat-value">{s.value}</span>
                  <span className="aui-stat-label">{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
        {actions && <div className="aui-header-actions">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Toolbar ── */
export function Toolbar({ children, className = '' }) {
  return <div className={`aui-toolbar ${className}`}>{children}</div>;
}

/* ── SearchInput ── */
export function SearchInput({ value, onChange, placeholder = 'Search…', color = 'blue' }) {
  return (
    <div className={`aui-search aui-search--${color}`}>
      <Search size={15} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === 'Escape' && onChange({ target: { value: '' } })}
      />
    </div>
  );
}

/* ── Btn ── */
export function Btn({ variant = 'primary', size = 'md', children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`aui-btn aui-btn--${variant} aui-btn--${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── IconBtn ── */
export function IconBtn({ variant = 'default', title, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`aui-icon-btn aui-icon-btn--${variant} ${className}`}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── StatusBadge ── */
const BADGE_PRESETS = {
  active:    { color: 'green',  label: 'Active' },
  inactive:  { color: 'gray',   label: 'Inactive' },
  pending:   { color: 'amber',  label: 'Pending' },
  success:   { color: 'green',  label: 'Success' },
  failed:    { color: 'red',    label: 'Failed' },
  cancelled: { color: 'red',    label: 'Cancelled' },
  delivered: { color: 'green',  label: 'Delivered' },
  confirmed: { color: 'blue',   label: 'Confirmed' },
  system:    { color: 'amber',  label: 'System' },
  custom:    { color: 'green',  label: 'Custom' },
};

export function StatusBadge({ status, label, color, icon: Icon, className = '' }) {
  const preset = BADGE_PRESETS[(status || '').toLowerCase()] || {};
  const resolvedColor = color || preset.color || 'gray';
  const resolvedLabel = label ?? preset.label ?? status;
  return (
    <span className={`aui-badge aui-badge--${resolvedColor} ${className}`}>
      {Icon && <Icon size={10} />}
      {resolvedLabel}
    </span>
  );
}

/* ── EmptyState ── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="aui-empty">
      {Icon && <div className="aui-empty__icon"><Icon size={38} strokeWidth={1.2} /></div>}
      <p className="aui-empty__title">{title || 'No data'}</p>
      {description && <p className="aui-empty__desc">{description}</p>}
      {action && <div className="aui-empty__action">{action}</div>}
    </div>
  );
}

/* ── TableFooter ── */
export function TableFooter({ page, totalPages, total, rowsPerPage, onRowsChange, onPage, rowsOptions = [10, 20, 50, 100], label = 'rows' }) {
  const start = total === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, total);

  return (
    <div className="aui-table-footer">
      <div className="aui-footer-left">
        <label className="aui-rows-label">
          Rows:
          <select
            className="aui-rows-select"
            value={rowsPerPage}
            onChange={(e) => onRowsChange?.(Number(e.target.value))}
          >
            {rowsOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span className="aui-footer-count">
          {total > 0 ? `${start}–${end} of ${total} ${label}` : `0 ${label}`}
        </span>
      </div>
      <div className="aui-pagination">
        <button className="aui-page-btn" onClick={() => onPage?.(1)} disabled={page <= 1} title="First page">
          <ChevronsLeft size={14} />
        </button>
        <button className="aui-page-btn" onClick={() => onPage?.(page - 1)} disabled={page <= 1} title="Previous page">
          <ChevronLeft size={14} />
        </button>
        <span className="aui-page-indicator">{page} / {totalPages || 1}</span>
        <button className="aui-page-btn" onClick={() => onPage?.(page + 1)} disabled={page >= totalPages} title="Next page">
          <ChevronRight size={14} />
        </button>
        <button className="aui-page-btn" onClick={() => onPage?.(totalPages)} disabled={page >= totalPages} title="Last page">
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── ConfirmModal ── */
export function ConfirmModal({ show, title, message, confirmLabel = 'Confirm', danger = true, onConfirm, onCancel }) {
  if (!show) return null;
  return portalModal(
    <div className="aui-modal-overlay" role="dialog" aria-modal="true">
      <div className="aui-modal aui-modal--sm aui-confirm-modal">
        <div className="aui-modal-header">
          <div className="aui-modal-title-row">
            <div className={`aui-modal-icon ${danger ? 'aui-modal-icon--red' : 'aui-modal-icon--blue'}`}>
              <AlertTriangle size={16} />
            </div>
            <h3>{title || 'Are you sure?'}</h3>
          </div>
        </div>
        <div className="aui-modal-body">
          <p className="aui-confirm-msg">{message}</p>
        </div>
        <div className="aui-modal-footer">
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Btn>
        </div>
      </div>
    </div>,
  );
}

/* ── FormModal ── */
export function FormModal({ show, title, icon: Icon, iconColor = 'blue', onClose, children, footer, size = 'md' }) {
  if (!show) return null;
  const sizeClass = size === 'lg' ? 'aui-modal--lg' : size === 'sm' ? 'aui-modal--sm' : '';
  return portalModal(
    <div className="aui-modal-overlay" role="dialog" aria-modal="true">
      <div className={['aui-modal', sizeClass].filter(Boolean).join(' ')}>
        <div className="aui-modal-header">
          <div className="aui-modal-title-row">
            {Icon && (
              <div className={`aui-modal-icon aui-modal-icon--${iconColor}`}><Icon size={16} /></div>
            )}
            <h3>{title}</h3>
          </div>
          <button type="button" className="aui-modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="aui-modal-body">{children}</div>
        {footer && <div className="aui-modal-footer">{footer}</div>}
      </div>
    </div>,
  );
}

/* ── FormField ── */
export function FormField({ label, htmlFor, hint, required, children, className = '' }) {
  return (
    <div className={`aui-field ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="aui-field__label">
          {label}
          {!required && <span className="aui-field__optional">(optional)</span>}
        </label>
      )}
      {children}
      {hint && <span className="aui-field__hint">{hint}</span>}
    </div>
  );
}

/* ── Input / Textarea shortcuts ── */
export function Input({ mono = false, className = '', ...props }) {
  return <input className={`aui-input ${mono ? 'aui-input--mono' : ''} ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`aui-input aui-input--textarea ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }) {
  return <select className={`aui-input aui-select ${className}`} {...props}>{children}</select>;
}
