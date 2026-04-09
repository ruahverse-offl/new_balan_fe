import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    ArrowLeft,
    ChevronRight,
    Calendar,
    TestTube,
    Filter,
    Eye,
} from 'lucide-react';
import { formatTimeTo12h, parseTimeToHHmm } from '../../utils/timeFormatters';
import './AdminCatalogTabs.css';
import './TestBookingsTab.css';

function formatBookingDate(d) {
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

function formatBookingTime(t) {
    if (t == null || String(t).trim() === '') return '—';
    const s = String(t).trim();
    const hhmm = parseTimeToHHmm(s);
    if (hhmm) return formatTimeTo12h(hhmm);
    const as24 = /^\d{1,2}:\d{2}$/.test(s) ? s : null;
    if (as24) return formatTimeTo12h(as24);
    return s;
}

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
];

const TestBookingsTab = ({
    testBookings = [],
    polyclinicTests = [],
    searchTerm = '',
    setSearchTerm,
    testBookingsPage = 1,
    setTestBookingsPage,
    testBookingsRowsPerPage = 10,
    setTestBookingsRowsPerPage,
    onAddClick,
    onEditClick,
    onViewDetails,
    onDeleteClick,
}) => {
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const getTestName = useCallback(
        (b) => {
            if (b?.test_name && b.test_name !== '—') return b.test_name;
            if (!b?.test_id || !polyclinicTests?.length) return '—';
            const t = polyclinicTests.find((test) => String(test.id) === String(b.test_id));
            return t?.name || '—';
        },
        [polyclinicTests],
    );

    const filtered = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        return (testBookings || []).filter((b) => {
            if (!b) return false;
            const dateStr = b.booking_date ? String(b.booking_date).slice(0, 10) : '';
            const dateOk = !dateFilter || dateStr === dateFilter;
            if (!dateOk) return false;
            const st = (b.status || 'PENDING').toUpperCase();
            const statusOk = !statusFilter || st === statusFilter.toUpperCase();
            if (!statusOk) return false;
            if (!q) return true;
            const testName = getTestName(b).toLowerCase();
            return (
                (b.patient_name || '').toLowerCase().includes(q) ||
                (b.patient_phone || '').toLowerCase().includes(q) ||
                testName.includes(q)
            );
        });
    }, [testBookings, searchTerm, dateFilter, statusFilter, getTestName]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / testBookingsRowsPerPage) || 1);
    const effectivePage = Math.min(Math.max(1, testBookingsPage), totalPages);

    useEffect(() => {
        if (testBookingsPage > totalPages) setTestBookingsPage(totalPages);
    }, [testBookingsPage, totalPages, setTestBookingsPage]);

    const start = (effectivePage - 1) * testBookingsRowsPerPage;
    const pageRows = filtered.slice(start, start + testBookingsRowsPerPage);
    const showingFrom = total === 0 ? 0 : start + 1;
    const showingTo = total === 0 ? 0 : Math.min(start + pageRows.length, total);

    return (
        <div className="admin-table-card catalog-tab-card test-bookings-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Test bookings</h2>
                <p className="catalog-tab-subtitle">
                    Polyclinic lab test reservations: patient contact, chosen test, and schedule. Filter by booking date
                    or status, search by patient or test name, then add or edit rows from the table.
                </p>
            </div>

            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search by patient, phone, or test…"
                        value={searchTerm || ''}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setTestBookingsPage(1);
                        }}
                        aria-label="Search test bookings"
                    />
                </div>
                <div className="test-bookings-toolbar-filters">
                    <div className="test-bookings-date-filter-wrap">
                        <Calendar size={16} aria-hidden style={{ color: 'var(--admin-text-muted)' }} />
                        <label htmlFor="tb-admin-date-filter">Date</label>
                        <input
                            id="tb-admin-date-filter"
                            className="test-bookings-date-input"
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setTestBookingsPage(1);
                            }}
                        />
                        {dateFilter ? (
                            <button
                                type="button"
                                className="test-bookings-clear-date"
                                onClick={() => {
                                    setDateFilter('');
                                    setTestBookingsPage(1);
                                }}
                            >
                                Clear date
                            </button>
                        ) : null}
                    </div>
                    <div className="test-bookings-status-filter-wrap">
                        <Filter size={16} aria-hidden style={{ color: 'var(--admin-text-muted)' }} />
                        <label htmlFor="tb-admin-status-filter">Status</label>
                        <select
                            id="tb-admin-status-filter"
                            className="catalog-rows-select"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setTestBookingsPage(1);
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
                        value={testBookingsRowsPerPage}
                        onChange={(e) => {
                            setTestBookingsRowsPerPage(Number(e.target.value));
                            setTestBookingsPage(1);
                        }}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="button" className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add booking
                </button>
                {total > 0 && (
                    <span className="catalog-tab-meta">
                        {total} booking{total !== 1 ? 's' : ''}
                        {dateFilter || statusFilter ? ' (filtered)' : ''}
                    </span>
                )}
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    {total === 0 ? (
                        <div className="catalog-empty">
                            <TestTube size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} aria-hidden />
                            <p className="catalog-empty-title">No bookings match</p>
                            <p>
                                {(searchTerm || '').trim() || dateFilter || statusFilter
                                    ? 'Try another search or clear filters.'
                                    : 'When patients book polyclinic tests, they will appear here. Add one with the button above.'}
                            </p>
                        </div>
                    ) : (
                        <table className="admin-table test-bookings-table catalog-table">
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Patient</th>
                                    <th>Contact</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((b) => {
                                    const testTitle = getTestName(b);
                                    const statusClass = (b.status || 'pending').toLowerCase();
                                    return (
                                        <tr key={b.id}>
                                            <td data-label="Test">
                                                <span className="test-bookings-test-pill" title={testTitle}>
                                                    {testTitle}
                                                </span>
                                            </td>
                                            <td data-label="Patient" className="test-bookings-patient">
                                                <strong>{b.patient_name || '—'}</strong>
                                            </td>
                                            <td data-label="Contact">
                                                <span className="test-bookings-phone">{b.patient_phone || '—'}</span>
                                            </td>
                                            <td data-label="Schedule">
                                                <div className="test-bookings-schedule">
                                                    <span className="test-bookings-schedule-date">
                                                        {formatBookingDate(b.booking_date)}
                                                    </span>
                                                    <span className="test-bookings-schedule-time">
                                                        {formatBookingTime(b.booking_time)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <span className={`status-tag ${statusClass}`}>{b.status || '—'}</span>
                                            </td>
                                            <td data-label="Notes">
                                                {b.notes ? (
                                                    <span className="test-bookings-notes-preview" title={b.notes}>
                                                        {b.notes}
                                                    </span>
                                                ) : (
                                                    <span className="test-bookings-notes-preview">—</span>
                                                )}
                                            </td>
                                            <td data-label="Actions" className="actions">
                                                <div className="test-bookings-actions-split">
                                                    {typeof onViewDetails === 'function' && (
                                                        <button
                                                            type="button"
                                                            className="action-btn"
                                                            title="View booking details"
                                                            onClick={() => onViewDetails(b)}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="action-btn"
                                                        title="Edit booking"
                                                        onClick={() => onEditClick(b)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="action-btn delete"
                                                        title="Delete booking"
                                                        onClick={() => onDeleteClick('test-booking', b.id, b.patient_name)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
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
                                onClick={() => setTestBookingsPage((p) => Math.max(1, p - 1))}
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
                                onClick={() => setTestBookingsPage((p) => Math.min(totalPages, p + 1))}
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

export default TestBookingsTab;
