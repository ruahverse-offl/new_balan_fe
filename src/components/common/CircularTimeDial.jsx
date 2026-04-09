import React, { useRef, useCallback } from 'react';

const VIEW = 200;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R_FACE = 90;
const R_NUM = 74;
const R_TICK_OUT = 86;
const R_TICK_IN = 80;
const R_HAND = 70;

/**
 * Circular dial: click / drag selects an integer 0 .. segments-1.
 * Uses getBoundingClientRect() so clicks match visuals inside modals, zoom, flex layout.
 */
export default function CircularTimeDial({
  segments,
  value,
  onChange,
  title,
  formatTick = (i) => String(i),
  showTickLabel = () => true,
  className = '',
}) {
  const svgRef = useRef(null);

  const pickFromClient = useCallback(
    (clientX, clientY) => {
      const el = svgRef.current;
      if (!el || segments < 1) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return;

      const sx = ((clientX - rect.left) / rect.width) * VIEW;
      const sy = ((clientY - rect.top) / rect.height) * VIEW;
      const x = sx - CX;
      const y = sy - CY;
      const dist = Math.hypot(x, y);
      if (dist < 14) return;

      const angle = Math.atan2(y, x);
      const twoPi = Math.PI * 2;
      const normalized = (angle + Math.PI / 2 + twoPi) % twoPi;
      let idx = Math.round((normalized / twoPi) * segments);
      idx = ((idx % segments) + segments) % segments;
      onChange(idx);
    },
    [segments, onChange],
  );

  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pickFromClient(e.clientX, e.clientY);
  };

  const onPointerMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    pickFromClient(e.clientX, e.clientY);
  };

  const release = (e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const safeVal = Math.min(segments - 1, Math.max(0, Number(value) || 0));
  const handAngle = (safeVal / segments) * 2 * Math.PI - Math.PI / 2;
  const hx = CX + R_HAND * Math.cos(handAngle);
  const hy = CY + R_HAND * Math.sin(handAngle);

  const numFont = segments >= 40 ? 11 : segments === 24 ? 9 : 10;

  const ticks = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const x1 = CX + R_TICK_IN * cos;
    const y1 = CY + R_TICK_IN * sin;
    const x2 = CX + R_TICK_OUT * cos;
    const y2 = CY + R_TICK_OUT * sin;
    const lx = CX + R_NUM * cos;
    const ly = CY + R_NUM * sin;
    const show = showTickLabel(i);
    ticks.push(
      <g key={i}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="circular-time-dial-tick" />
        {show ? (
          <text
            x={lx}
            y={ly}
            className="circular-time-dial-num"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: numFont }}
          >
            {formatTick(i)}
          </text>
        ) : null}
      </g>,
    );
  }

  return (
    <div className={`circular-time-dial-wrap ${className}`}>
      {title ? <span className="circular-time-dial-title">{title}</span> : null}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="circular-time-dial-svg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={release}
        onPointerCancel={release}
        role="img"
        aria-label={title || 'Time dial'}
      >
        <circle cx={CX} cy={CY} r={R_FACE} className="circular-time-dial-face" />
        {ticks}
        <line x1={CX} y1={CY} x2={hx} y2={hy} className="circular-time-dial-hand" />
        <circle cx={CX} cy={CY} r={5.5} className="circular-time-dial-hub" />
      </svg>
    </div>
  );
}

/**
 * Pair of dials (24h hour + minute) → single "HH:mm" string.
 */
export function DeliverySlotTimeDials({ value, onChange, fallbackHour = 9, fallbackMinute = 0, className = '' }) {
  const padM = (n) => String(Math.min(59, Math.max(0, n))).padStart(2, '0');
  const padH = (n) => String(Math.min(23, Math.max(0, n))).padStart(2, '0');

  let h = fallbackHour;
  let m = fallbackMinute;
  if (value && typeof value === 'string') {
    const [hs, ms] = value.trim().split(':');
    const hh = parseInt(hs, 10);
    const mm = parseInt(ms ?? '0', 10);
    if (!Number.isNaN(hh)) h = Math.min(23, Math.max(0, hh));
    if (!Number.isNaN(mm)) m = Math.min(59, Math.max(0, mm));
  }

  return (
    <div className={`delivery-slot-dial-pair ${className}`}>
      <CircularTimeDial
        segments={24}
        value={h}
        onChange={(nh) => onChange(`${padH(nh)}:${padM(m)}`)}
        title="Hour (24h)"
        formatTick={(i) => String(i)}
        showTickLabel={(i) => i % 2 === 0}
      />
      <CircularTimeDial
        segments={60}
        value={m}
        onChange={(nm) => onChange(`${padH(h)}:${padM(nm)}`)}
        title="Minute"
        formatTick={(i) => String(i).padStart(2, '0')}
        showTickLabel={(i) => i % 5 === 0}
      />
    </div>
  );
}
