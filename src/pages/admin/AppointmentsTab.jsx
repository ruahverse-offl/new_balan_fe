import React, { useMemo, useEffect, useState } from 'react';
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    ArrowLeft,
    ChevronRight,
    Calendar,
    Eye,
    CheckCircle,
    XCircle,
    Filter,
    Stethoscope,
} from 'lucide-react';
import { formatTimeTo12h, parseTimeToHHmm } from '../../utils/timeFormatters';
import './AdminCatalogTabs.css';
import './AppointmentsTab.css';

function formatAppointmentDate(d) {
    if (d == null || d === '') return '—';
    const s = typeof d === 'string' ? d.slice(0, 10) : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return String(d).slice(0, 10) || '—';
    const [y, m, day] = s.split('-').map((x) => parseInt(x, 10));
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(day)) return s;
    try {
        return new Date(y, m - 1, day).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return s;
    }
}

function formatAppointmentTime(t) {
    if (t == null || String(t).trim() === '') return '—';
    const s = String(t).trim();
    const hhmm = parseTimeToHHmm(s);
    if (hhmm) return formatTimeTo12h(hhmm);
    const as24 = /^\d{1,2}:\d{2}$/.test(s) ? s : null;
    if (as24) return formatTimeTo12h(as24);
    return s;
}

/** Combined patient message + admin notes for table preview */
function appointmentMessageNotesLine(app) {
    const msg = (app?.message || '').trim();
    const notes = (app?.notes || '').trim();
    if (msg && notes) return `${msg} · ${notes}`;
    return msg || notes || '';
}

function appointmentMessageNotesTitle(app) {
    const msg = (app?.message || '').trim();
    const notes = (app?.notes || '').trim();
    const lines = [];
    if (msg) lines.push(`Patient message: ${msg}`);
    if (notes) lines.push(`Admin notes: ${notes}`);
    return lines.join('\n') || undefined;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No show' },
];

const AppointmentsTab = ({
    appointments = [],
    searchTerm = '',
    setSearchTerm,
    page = 1,
    setPage,
    rowsPerPage = 10,
    setRowsPerPage,
    onAdd,
    onEdit,
    onViewDetails,
    onDelete,
    onConfirmPending,
    onCancelPending,
}) => {
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filtered = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        return (appointments || []).filter((app) => {
            if (!app) return false;
            const dateStr = app.date ? String(app.date).slice(0, 10) : '';
            const dateOk = !dateFilter || dateStr === dateFilter;
            if (!dateOk) return false;
            const st = (app.status || 'PENDING').toUpperCase();
            const statusOk = !statusFilter || st === statusFilter.toUpperCase();
            if (!statusOk) return false;
            if (!q) return true;
            return (
                (app.patientName || '').toLowerCase().includes(q) ||
                (app.phone || '').toLowerCase().includes(q) ||
                (app.doctorName || '').toLowerCase().includes(q) ||
                (app.message || '').toLowerCase().includes(q) ||
                (app.notes || '').toLowerCase().includes(q)
            );
        });
    }, [appointments, searchTerm, dateFilter, statusFilter]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage) || 1);
    const effectivePage = Math.min(Math.max(1, page), totalPages);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages, setPage]);

    const start = (effectivePage - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);
    const showingFrom = total === 0 ? 0 : start + 1;
    const showingTo = total === 0 ? 0 : Math.min(start + pageRows.length, total);

    const hasActiveFilters =
        Boolean((searchTerm || '').trim()) || Boolean(dateFilter) || Boolean(statusFilter);

    return (
        <div className="admin-table-card catalog-tab-card appointments-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Appointments</h2>
                <p className="catalog-tab-subtitle">
                    Clinic visit requests: patient contact, assigned doctor, and schedule. Filter by appointment date or
                    status, search by name, phone, doctor, or message text. Pending rows can be confirmed or cancelled in
                    one click.
                </p>
            </div>

            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search by patient, phone, doctor, or message…"
                        value={searchTerm || ''}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Search appointments"
                    />
                </div>
                <div className="appointments-toolbar-filters">
                    <div className="appointments-date-filter-wrap">
                        <Calendar size={16} aria-hidden style={{ color: 'var(--admin-text-muted)' }} />
                        <label htmlFor="apt-admin-date-filter">Date</label>
                        <input
                            id="apt-admin-date-filter"
                            className="appointments-date-input"
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setPage(1);
                            }}
                        />
                        {dateFilter ? (
                            <button
                                type="button"
                                className="appointments-clear-date"
                                onClick={() => {
                                    setDateFilter('');
                                    setPage(1);
                                }}
                            >
                                Clear date
                            </button>
                        ) : null}
                    </div>
                    <div className="appointments-status-filter-wrap">
                        <Filter size={16} aria-hidden style={{ color: 'var(--admin-text-muted)' }} />
                        <label htmlFor="apt-admin-status-filter">Status</label>
                        <select
                            id="apt-admin-status-filter"
                            className="catalog-rows-select"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value || 'all'} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <label className="catalog-rows-label">
                    Rows
                    <select
                        className="catalog-rows-select"
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="button" className="btn-add" onClick={onAdd}>
                    <Plus size={18} /> Add appointment
                </button>
                {total > 0 && (
                    <span className="catalog-tab-meta">
                        {total} appointment{total !== 1 ? 's' : ''}
                        {dateFilter || statusFilter ? ' (filtered)' : ''}
                    </span>
                )}
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    {total === 0 ? (
                        <div className="catalog-empty">
                            <Stethoscope size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} aria-hidden />
                            <p className="catalog-empty-title">No appointments match</p>
                            <p>
                                {hasActiveFilters
                                    ? 'Try another search or clear filters.'
                                    : 'When patients book, they will appear here. Add one manually with the button above.'}
                            </p>
                        </div>
                    ) : (
                        <table className="admin-table appointments-table catalog-table">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Contact</th>
                                    <th>Doctor</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th>Message / notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((app) => {
                                    const pending = String(app.status || '').toLowerCase() === 'pending';
                                    const preview = appointmentMessageNotesLine(app);
                                    const titleFull = appointmentMessageNotesTitle(app);
                                    return (
                                        <tr key={app.id}>
                                            <td data-label="Patient" className="appointments-patient">
                                                <strong>{app.patientName || '—'}</strong>
                                            </td>
                                            <td data-label="Contact">
                                                <span className="appointments-phone">{app.phone || '—'}</span>
                                            </td>
                                            <td data-label="Doctor">
                                                <span className="appointments-doctor-pill" title={app.doctorName || ''}>
                                                    {app.doctorName || '—'}
                                                </span>
                                            </td>
                                            <td data-label="Schedule">
                                                <div className="appointments-schedule">
                                                    <span className="appointments-schedule-date">
                                                        {formatAppointmentDate(app.date)}
                                                    </span>
                                                    <span className="appointments-schedule-time">
                                                        {formatAppointmentTime(app.time)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <span className={`status-tag ${(app.status || '').toLowerCase()}`}>
                                                    {app.status || '—'}
                                                </span>
                                            </td>
                                            <td data-label="Message / notes">
                                                {preview ? (
                                                    <span
                                                        className="appointments-message-preview"
                                                        title={titleFull}
                                                    >
                                                        {preview}
                                                    </span>
                                                ) : (
                                                    <span className="appointments-message-preview">—</span>
                                                )}
                                            </td>
                                            <td data-label="Actions" className="actions">
                                                <div className="appointments-actions-split">
                                                    <button
                                                        type="button"
                                                        className="action-btn"
                                                        title="View details"
                                                        onClick={() => onViewDetails(app)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="action-btn"
                                                        title="Edit appointment"
                                                        onClick={() => onEdit(app)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="action-btn delete"
                                                        title="Delete appointment"
                                                        onClick={() => onDelete(app)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    {pending && (
                                                        <span className="appointments-quick-actions">
                                                            <button
                                                                type="button"
                                                                className="action-btn"
                                                                title="Confirm appointment"
                                                                onClick={() => onConfirmPending(app)}
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-btn delete"
                                                                title="Cancel appointment"
                                                                onClick={() => onCancelPending(app)}
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {total > 0 && (
                <div className="catalog-tab-footer">
                    <span className="catalog-tab-meta">
                        Showing {showingFrom}–{showingTo} of {total}
                    </span>
                    {totalPages > 1 && (
                        <div className="pagination-bar">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={effectivePage <= 1}
                                className="page-nav-btn"
                            >
                                <ArrowLeft size={18} /> Prev
                            </button>
                            <div className="page-numbers">
                                Page <span>{effectivePage}</span> of {totalPages}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={effectivePage >= totalPages}
                                className="page-nav-btn"
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AppointmentsTab;
