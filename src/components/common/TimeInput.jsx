/**
 * Time input using native <input type="time">.
 * Opens the browser's clock-style time picker (like setting an alarm in calendar).
 * Value/onChange use string "HH:mm" (24-hour).
 */
import React from 'react';

/** Normalize to HH:mm for native input (e.g. "10:00 AM" -> "10:00", "14:30" -> "14:30") */
function toHHmm(val) {
  if (!val || typeof val !== 'string') return '';
  const s = val.trim();
  if (!s) return '';
  if (/^\d{1,2}:\d{2}(:\d{2})?\.?\d*$/.test(s)) return s.slice(0, 5);
  const match = s.match(/^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2] || '00';
    if (match[4].toUpperCase() === 'PM' && h !== 12) h += 12;
    if (match[4].toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  return '';
}

export default function TimeInput({
  value = '',
  onChange,
  min,
  max,
  required,
  disabled,
  className = '',
  ...rest
}) {
  const val = toHHmm(value);
  const minVal = toHHmm(min) || undefined;
  const maxVal = toHHmm(max) || undefined;

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v || '');
  };

  return (
    <input
      type="time"
      value={val}
      onChange={handleChange}
      min={minVal}
      max={maxVal}
      required={required}
      disabled={disabled}
      className={`admin-time-input ${className}`}
      style={{
        width: '100%',
        padding: '0.5rem',
        borderRadius: '8px',
        border: '1px solid var(--admin-border, #e5e7eb)',
        fontSize: '1rem',
      }}
      {...rest}
    />
  );
}
