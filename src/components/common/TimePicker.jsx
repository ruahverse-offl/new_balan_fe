/**
 * Time picker using PrimeReact Calendar (time only).
 * Value/onChange use string "HH:mm" for compatibility with forms and API.
 */
import React from 'react';
import { Calendar } from 'primereact/calendar';

const timeToDate = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const [h, m] = hhmm.trim().split(':').map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return null;
  const d = new Date(1970, 0, 1, h ?? 0, m ?? 0, 0, 0);
  return d;
};

const dateToHHmm = (d) => {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function TimePicker({ value = '', onChange, min, max, placeholder = 'Select time', required, disabled, className = '', inputClassName = '', ...rest }) {
  const timeValue = timeToDate(value);
  const minTime = min ? timeToDate(min) : undefined;
  const maxTime = max ? timeToDate(max) : undefined;

  const handleChange = (e) => {
    const next = e.value;
    onChange(dateToHHmm(next ?? null));
  };

  return (
    <Calendar
      value={timeValue}
      onChange={handleChange}
      timeOnly
      hourFormat="24"
      minDate={minTime}
      maxDate={maxTime}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      showIcon
      className={`admin-time-picker ${className}`}
      inputClassName={inputClassName}
      {...rest}
    />
  );
}
