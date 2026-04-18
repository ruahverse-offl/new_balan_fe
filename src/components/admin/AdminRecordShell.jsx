import React from 'react';
import { ArrowLeft } from 'lucide-react';
import './AdminRecordShell.css';

/**
 * Full-width admin “record” layout: back control + title + body (no popup).
 * Reuse for view / edit / create flows across admin entities.
 */
export function AdminRecordShell({ title, backLabel = 'Back', onBack, children, footer, wide = false }) {
  return (
    <div className={`admin-record-shell${wide ? ' admin-record-shell--wide' : ''}`}>
      <header className="admin-record-shell__header">
        <button type="button" className="admin-record-shell__back" onClick={onBack}>
          <ArrowLeft size={20} aria-hidden />
          <span>{backLabel}</span>
        </button>
        <h2 className="admin-record-shell__title">{title}</h2>
      </header>
      <div className="admin-record-shell__body">{children}</div>
      {footer ? <footer className="admin-record-shell__footer">{footer}</footer> : null}
    </div>
  );
}

/** Single label + value cell in a responsive detail grid. */
export function AdminDetailField({ label, children, fullWidth = false }) {
  return (
    <div className={`admin-detail-field ${fullWidth ? 'admin-detail-field--full' : ''}`}>
      <div className="admin-detail-field__label">{label}</div>
      <div className="admin-detail-field__value">{children}</div>
    </div>
  );
}

export function AdminDetailGrid({ children, variant = 'default' }) {
  const cls =
    variant === 'tiles'
      ? 'admin-detail-grid admin-detail-grid--tiles'
      : 'admin-detail-grid';
  return <div className={cls}>{children}</div>;
}
