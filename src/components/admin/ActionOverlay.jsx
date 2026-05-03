import React from 'react';
import './ActionOverlay.css';

/**
 * Freezes the nearest positioned ancestor while an async action runs.
 * Drop inside any `position: relative` container and pass show={locked}.
 *
 * Usage:
 *   <div style={{ position: 'relative' }}>
 *     <ActionOverlay show={locked} message="Saving…" />
 *     … your content …
 *   </div>
 *
 * Or use the full-page variant:
 *   <ActionOverlay show={locked} fullPage message="Deleting…" />
 */
const ActionOverlay = ({ show = false, message = 'Processing…', fullPage = false }) => {
  if (!show) return null;

  return (
    <div
      className={`action-overlay ${fullPage ? 'action-overlay--fullpage' : ''}`}
      aria-live="assertive"
      aria-busy="true"
      aria-label={message}
      role="status"
    >
      <div className="action-overlay__card">
        <div className="action-overlay__spinner">
          <div className="ao-ring ao-ring--a" />
          <div className="ao-ring ao-ring--b" />
          <div className="ao-ring ao-ring--c" />
        </div>
        <p className="action-overlay__message">{message}</p>
      </div>
    </div>
  );
};

export default ActionOverlay;
