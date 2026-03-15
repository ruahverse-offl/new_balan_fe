/**
 * Time selection dropdown (HH:mm). Options every 30 minutes from 00:00 to 23:30.
 * Value/onChange use string "HH:mm". Use this for a clear "selection" UI instead of typing.
 */
import React from 'react';

const MINUTES_INTERVAL = 30;
const HOURS = 24;

function buildTimeOptions() {
  const options = [];
  for (let h = 0; h < HOURS; h++) {
    for (let m = 0; m < 60; m += MINUTES_INTERVAL) {
      const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const hour12 = h % 12 || 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
      options.push({ value, label });
    }
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

export default function TimeSelect({
  value = '',
  onChange,
  placeholder = 'Select time',
  required,
  disabled,
  className = '',
  min,
  max,
  ...rest
}) {
  const val = value && typeof value === 'string' ? value.trim().slice(0, 5) : '';
  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v || '');
  };

  let options = TIME_OPTIONS;
  if (min || max) {
    const minVal = min && /^\d{1,2}:\d{2}$/.test(String(min).trim()) ? String(min).trim() : null;
    const maxVal = max && /^\d{1,2}:\d{2}$/.test(String(max).trim()) ? String(max).trim() : null;
    if (minVal || maxVal) {
      options = TIME_OPTIONS.filter((o) => {
        if (minVal && o.value < minVal) return false;
        if (maxVal && o.value > maxVal) return false;
        return true;
      });
    }
  }

  return (
    <select
      value={val}
      onChange={handleChange}
      required={required}
      disabled={disabled}
      className={`admin-time-select ${className}`}
      style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border, #e5e7eb)' }}
      {...rest}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
