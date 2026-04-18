import React from 'react';
import { Loader2 } from 'lucide-react';
import logoUrl from '../../assets/new_balan_logo.png';
import './PageLoading.css';

const VARIANT_CLASS = {
  fullscreen: 'page-loading--fullscreen',
  page: 'page-loading--page',
  block: 'page-loading--block',
  compact: 'page-loading--compact',
  row: 'page-loading--row',
  bare: 'page-loading--bare',
};

/** Orbit graphic size presets (outer ring diameter) */
const ORBIT_SIZE_CLASS = {
  fullscreen: 'page-loading__orbit-root--lg',
  page: 'page-loading__orbit-root--md',
  block: 'page-loading__orbit-root--md',
  compact: 'page-loading__orbit-root--sm',
  row: 'page-loading__orbit-root--xs',
  bare: 'page-loading__orbit-root--md',
};

/**
 * Full-screen or in-page loading state with optional title and subtitle.
 * Shows the app logo with animated rings around it (not the generic spinner).
 *
 * @param {object} props
 * @param {string} [props.message] - Primary line under the spinner
 * @param {string} [props.subtitle] - Secondary muted line
 * @param {'fullscreen'|'page'|'block'|'compact'|'row'|'bare'} [props.variant='page'] - Layout preset
 * @param {string} [props.className] - Extra classes (e.g. catalog-loading, order-detail-loading)
 * @param {string} [props.label] - Accessible name if message is empty
 */
export function PageLoading({
  message = '',
  subtitle = '',
  variant = 'page',
  className = '',
  label,
}) {
  const vClass = VARIANT_CLASS[variant] || VARIANT_CLASS.page;
  const orbitClass = ORBIT_SIZE_CLASS[variant] || ORBIT_SIZE_CLASS.page;
  const ariaLabel = label || message || subtitle || 'Loading';

  return (
    <div
      className={`page-loading ${vClass} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      <div className={`page-loading__orbit-root ${orbitClass}`.trim()} aria-hidden>
        <div className="page-loading__ring page-loading__ring--a" />
        <div className="page-loading__ring page-loading__ring--b" />
        <div className="page-loading__ring page-loading__ring--c" />
        <div className="page-loading__logo">
          <img src={logoUrl} alt="" width={48} height={48} decoding="async" />
        </div>
      </div>
      {message ? <p className="page-loading__message">{message}</p> : null}
      {subtitle ? <p className="page-loading__subtitle">{subtitle}</p> : null}
    </div>
  );
}

/**
 * Small inline spinner for buttons and compact rows (saving, uploading, etc.).
 *
 * @param {object} props
 * @param {number} [props.size=16]
 * @param {string} [props.className]
 */
export function InlineSpinner({ size = 16, className = '', ...rest }) {
  return (
    <Loader2
      className={`page-loading__icon page-loading__icon--inline ${className}`.trim()}
      size={size}
      aria-hidden
      {...rest}
    />
  );
}

export default PageLoading;
