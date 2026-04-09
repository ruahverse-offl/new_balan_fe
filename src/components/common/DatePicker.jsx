/**
 * Date picker using native <input type="date">.
 * Value/onChange use string "YYYY-MM-DD" for compatibility with forms and API.
 */
import React from 'react';

export default function DatePicker({
  value = '',
  onChange,
  min,
  max,
  placeholder = 'Select date',
  required,
  disabled,
  className = '',
  ...rest
}) {
  const val = value && typeof value === 'string' ? value.trim().slice(0, 10) : '';

  const handleChange = (e) => {
    const v = e.target.value;
    onChange(v || '');
  };

  return (
    <input
      type="date"
      value={val}
      onChange={handleChange}
      min={min}
      max={max}
      required={required}
      disabled={disabled}
      className={`admin-date-picker ${className}`}
      style={{
        width: '100%',
        padding: '0.5rem',
        borderRadius: '8px',
        border: '1px solid var(--admin-border, #e5e7eb)',
      }}
      {...rest}
    />
  );
}
