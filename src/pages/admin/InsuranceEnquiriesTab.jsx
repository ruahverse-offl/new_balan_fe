import React, { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Eye, X, CheckCircle, Phone, User, Users, Heart, AlertCircle, Shield, MessageSquare } from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import { getInsuranceEnquiries, updateInsuranceEnquiry, deleteInsuranceEnquiry } from '../../services/insuranceEnquiriesApi';
import './AppointmentsTab.css';
import './AdminCatalogTabs.css';

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'CONVERTED', label: 'Converted' },
    { value: 'NOT_INTERESTED', label: 'Not interested' },
];

const STATUS_LABELS = {
    PENDING: 'Pending',
    CONTACTED: 'Contacted',
    CONVERTED: 'Converted',
    NOT_INTERESTED: 'Not interested',
};

function statusClass(s) {
    switch ((s || '').toUpperCase()) {
        case 'PENDING': return 'tag-warning';
        case 'CONTACTED': return 'tag-info';
        case 'CONVERTED': return 'tag-active';
        case 'NOT_INTERESTED': return 'tag-inactive';
        default: return 'tag-inactive';
    }
}

function formatDate(ts) {
    if (!ts) return '—';
    try {
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return String(ts);
    }
}

const ROWS_OPTIONS = [10, 20, 50];

const InsuranceEnquiriesTab = ({ showNotify, canUpdate, canDelete }) => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [editStatus, setEditStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getInsuranceEnquiries({ limit: 200 });
            setEnquiries(res.items || []);
        } catch {
            showNotify?.('Failed to load enquiries', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const filtered = useMemo(() => {
        let list = enquiries;
        if (statusFilter) list = list.filter((e) => (e.status || '').toUpperCase() === statusFilter);
        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            list = list.filter(
                (e) =>
                    (e.customer_name || '').toLowerCase().includes(q) ||
                    (e.customer_phone || '').toLowerCase().includes(q) ||
                    (e.plan_type || '').toLowerCase().includes(q),
            );
        }
        return list;
    }, [enquiries, statusFilter, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const safePage = Math.min(page, totalPages);
    const pageItems = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

    const openDetail = (e) => {
        setSelectedEnquiry(e);
        setEditStatus(e.status || 'PENDING');
        setEditNotes(e.notes || '');
        setSaveError('');
        setDetailOpen(true);
    };

    const closeDetail = () => { setDetailOpen(false); setSelectedEnquiry(null); };

    const handleSave = async () => {
        if (!selectedEnquiry) return;
        setSaving(true);
        setSaveError('');
        try {
            const updated = await updateInsuranceEnquiry(selectedEnquiry.id, {
                status: editStatus,
                notes: editNotes.trim() || null,
            });
            setEnquiries((prev) => prev.map((e) => (e.id === selectedEnquiry.id ? updated : e)));
            setSelectedEnquiry(updated);
            showNotify?.('Enquiry updated', 'success');
        } catch (err) {
            setSaveError(err?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await deleteInsuranceEnquiry(id);
            setEnquiries((prev) => prev.filter((e) => e.id !== id));
            if (selectedEnquiry?.id === id) closeDetail();
            showNotify?.('Enquiry deleted', 'success');
        } catch {
            showNotify?.('Failed to delete', 'error');
        } finally {
            setDeleting(false);
            setDeleteConfirmId(null);
        }
    };

    return (
        <div className="admin-tab-content">
            <div className="tab-header">
                <div className="tab-header-left">
                    <Shield size={22} style={{ color: '#6366f1' }} />
                    <h2 className="tab-title">Insurance Enquiries</h2>
                    <span className="record-count">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
                </div>
            </div>

            <div className="catalog-filters" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search name, phone, plan…"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button className="search-clear" onClick={() => { setSearchTerm(''); setPage(1); }}>
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="filter-select"
                    style={{ minWidth: '150px' }}
                >
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <button className="btn-outline btn-sm" onClick={load} disabled={loading} style={{ marginLeft: 'auto' }}>
                    {loading ? <InlineSpinner size={14} /> : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <InlineSpinner size={24} /> Loading…
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <Shield size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <p>No enquiries found.</p>
                </div>
            ) : (
                <div className="catalog-table-wrapper">
                    <table className="catalog-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Age</th>
                                <th>Family</th>
                                <th>Plan</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((e) => (
                                <tr key={e.id} onClick={() => openDetail(e)} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontWeight: 500 }}>{e.customer_name || '—'}</td>
                                    <td>{e.customer_phone || '—'}</td>
                                    <td>{e.customer_age ?? '—'}</td>
                                    <td>{e.family_size ?? '—'}</td>
                                    <td>{e.plan_type || '—'}</td>
                                    <td onClick={(ev) => ev.stopPropagation()}>
                                        <span className={`status-tag ${statusClass(e.status)}`}>
                                            {STATUS_LABELS[e.status] || e.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.created_at)}</td>
                                    <td onClick={(ev) => ev.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button
                                                className="icon-btn"
                                                title="View / edit"
                                                onClick={() => openDetail(e)}
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {canDelete && (
                                                <button
                                                    className="icon-btn icon-btn-danger"
                                                    title="Delete"
                                                    onClick={() => setDeleteConfirmId(e.id)}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > rowsPerPage && (
                <div className="pagination-bar" style={{ marginTop: '0.75rem' }}>
                    <select
                        value={rowsPerPage}
                        onChange={(ev) => { setRowsPerPage(Number(ev.target.value)); setPage(1); }}
                        className="filter-select"
                        style={{ width: 'auto' }}
                    >
                        {ROWS_OPTIONS.map((n) => (
                            <option key={n} value={n}>{n} / page</option>
                        ))}
                    </select>
                    <span className="pagination-info">
                        Page {safePage} of {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn-outline btn-sm" disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
                        <button className="btn-outline btn-sm" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                        <button className="btn-outline btn-sm" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                        <button className="btn-outline btn-sm" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
                    </div>
                </div>
            )}

            {/* Detail / Edit modal */}
            {detailOpen && selectedEnquiry && (
                <div
                    className="modal-overlay"
                    role="presentation"
                    onClick={(ev) => { if (ev.target === ev.currentTarget) closeDetail(); }}
                >
                    <div
                        className="modal-content"
                        role="dialog"
                        aria-modal="true"
                        onClick={(ev) => ev.stopPropagation()}
                        style={{ maxWidth: '500px', width: '100%' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Insurance Enquiry</h3>
                            <button className="icon-btn" onClick={closeDetail}><X size={18} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 1rem', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Name</div>
                                <div style={{ fontWeight: 500, display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <User size={14} style={{ flexShrink: 0 }} />{selectedEnquiry.customer_name}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Phone</div>
                                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <Phone size={14} style={{ flexShrink: 0 }} />{selectedEnquiry.customer_phone}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Age</div>
                                <div>{selectedEnquiry.customer_age ?? '—'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Family size</div>
                                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <Users size={14} style={{ flexShrink: 0 }} />{selectedEnquiry.family_size ?? '—'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Plan</div>
                                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <Heart size={14} style={{ flexShrink: 0 }} />{selectedEnquiry.plan_type || '—'}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>Submitted</div>
                                <div>{formatDate(selectedEnquiry.created_at)}</div>
                            </div>
                        </div>

                        {selectedEnquiry.message && (
                            <div style={{ marginBottom: '1rem', background: '#f8fafc', borderRadius: '6px', padding: '0.6rem 0.8rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                    <MessageSquare size={13} /> Customer message
                                </div>
                                <div style={{ fontSize: '0.9rem' }}>{selectedEnquiry.message}</div>
                            </div>
                        )}

                        {canUpdate && (
                            <>
                                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                                        Status
                                    </label>
                                    <select
                                        value={editStatus}
                                        onChange={(ev) => setEditStatus(ev.target.value)}
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                    >
                                        {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
                                        Staff notes
                                    </label>
                                    <textarea
                                        value={editNotes}
                                        onChange={(ev) => setEditNotes(ev.target.value)}
                                        rows={3}
                                        placeholder="Add internal notes…"
                                        style={{ width: '100%', resize: 'vertical', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                    />
                                </div>
                                {saveError && (
                                    <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                                        <AlertCircle size={14} />{saveError}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button className="btn-outline btn-sm" onClick={closeDetail}>Close</button>
                                    <button
                                        className="btn-primary btn-sm"
                                        onClick={handleSave}
                                        disabled={saving}
                                        style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}
                                    >
                                        {saving ? <InlineSpinner size={14} /> : <CheckCircle size={14} />}
                                        Save
                                    </button>
                                </div>
                            </>
                        )}
                        {!canUpdate && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button className="btn-outline btn-sm" onClick={closeDetail}>Close</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            {deleteConfirmId && (
                <div
                    className="modal-overlay"
                    role="presentation"
                    onClick={(ev) => { if (ev.target === ev.currentTarget) setDeleteConfirmId(null); }}
                >
                    <div
                        className="modal-content"
                        role="dialog"
                        style={{ maxWidth: '360px' }}
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 }}>Delete enquiry?</h3>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: '#64748b' }}>
                            This will permanently remove the enquiry record.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn-outline btn-sm" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                            <button
                                className="btn-sm"
                                style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 1rem', cursor: 'pointer', display: 'flex', gap: '0.3rem', alignItems: 'center' }}
                                onClick={() => handleDelete(deleteConfirmId)}
                                disabled={deleting}
                            >
                                {deleting ? <InlineSpinner size={14} /> : <Trash2 size={14} />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsuranceEnquiriesTab;
