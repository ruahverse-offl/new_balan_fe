import React from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';
import { formatSingleTimeTo24h } from '../../utils/timeFormatters';

const TestBookingsTab = ({
    testBookings,
    polyclinicTests = [],
    searchTerm,
    setSearchTerm,
    testBookingsPage,
    setTestBookingsPage,
    testBookingsRowsPerPage,
    setTestBookingsRowsPerPage,
    onAddClick,
    onEditClick,
    onDeleteClick
}) => {
    const getTestName = (b) => {
        if (b?.test_name) return b.test_name;
        if (!b?.test_id || !polyclinicTests?.length) return '—';
        const t = polyclinicTests.find(test => String(test.id) === String(b.test_id));
        return t?.name || '—';
    };
    const filteredBookings = (testBookings || []).filter(b =>
        b && (
            (b.patient_name && b.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (b.patient_phone && b.patient_phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (getTestName(b) && getTestName(b).toLowerCase().includes(searchTerm.toLowerCase()))
        )
    );

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'pending';
            case 'CONFIRMED': return 'active';
            case 'CANCELLED': return 'inactive';
            case 'COMPLETED': return 'active';
            default: return 'pending';
        }
    };

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setTestBookingsPage(1);
                        }}
                    />
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Booking
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Test</th>
                                <th>Patient Name</th>
                                <th>Phone</th>
                                <th>Booking Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Notes</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings
                                .slice((testBookingsPage - 1) * testBookingsRowsPerPage, testBookingsPage * testBookingsRowsPerPage)
                                .map(b => (
                                    <tr key={b.id}>
                                        <td data-label="Test">{getTestName(b)}</td>
                                        <td data-label="Patient Name">{b.patient_name || '—'}</td>
                                        <td data-label="Phone">{b.patient_phone || '—'}</td>
                                        <td data-label="Booking Date">{b.booking_date ? new Date(b.booking_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '--'}</td>
                                        <td data-label="Time">{b.booking_time ? formatSingleTimeTo24h(b.booking_time) : '--'}</td>
                                        <td data-label="Status">
                                            <span className={`status-tag ${getStatusClass(b.status)}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td data-label="Notes">
                                            {b.notes ? (b.notes.length > 30 ? b.notes.substring(0, 30) + '...' : b.notes) : '—'}
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => onEditClick(b)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick('test-booking', b.id, b.patient_name)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--admin-text-muted)'
                }}>
                    Rows per page:
                    <select
                        value={testBookingsRowsPerPage}
                        onChange={(e) => {
                            setTestBookingsRowsPerPage(Number(e.target.value));
                            setTestBookingsPage(1);
                        }}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border)',
                            backgroundColor: 'var(--admin-bg)',
                            color: 'var(--admin-text)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                {Math.ceil(filteredBookings.length / testBookingsRowsPerPage) > 1 && (
                    <div className="pagination-bar">
                        <button
                            onClick={() => setTestBookingsPage(p => Math.max(1, p - 1))}
                            disabled={testBookingsPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{testBookingsPage}</span> of {Math.ceil(filteredBookings.length / testBookingsRowsPerPage)}
                        </div>
                        <button
                            onClick={() => setTestBookingsPage(p => Math.min(Math.ceil(filteredBookings.length / testBookingsRowsPerPage), p + 1))}
                            disabled={testBookingsPage === Math.ceil(filteredBookings.length / testBookingsRowsPerPage)}
                            className="page-nav-btn"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestBookingsTab;
