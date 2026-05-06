import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, Trash2, Eye, X, CheckCircle, Phone, User, Users, Heart,
    AlertCircle, Shield, MessageSquare, RefreshCw, Clock, PhoneCall, TrendingUp, Pencil,
} from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import { getInsuranceEnquiries, updateInsuranceEnquiry, deleteInsuranceEnquiry } from '../../services/insuranceEnquiriesApi';
import './AdminCatalogTabs.css';
import './InsuranceEnquiriesTab.css';

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
        case 'PENDING': return 'pending';
        case 'CONTACTED': return 'confirmed';
        case 'CONVERTED': return 'active';
        case 'NOT_INTERESTED': return 'inactive';
        default: return 'inactive';
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

function getInitial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
}

const ROWS_OPTIONS = [10, 20, 50];

const InsuranceEnquiriesTab = ({ showNotify, canUpdate, canDelete }) => {
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // View modal (read-only)
    const [viewEnquiry, setViewEnquiry] = useState(null);

    // Edit modal
    const [editEnquiry, setEditEnquiry] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    // Delete confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');
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

    const counts = useMemo(() => ({
        total: enquiries.length,
        pending: enquiries.filter((e) => (e.status || 'PENDING').toUpperCase() === 'PENDING').length,
        contacted: enquiries.filter((e) => (e.status || '').toUpperCase() === 'CONTACTED').length,
        converted: enquiries.filter((e) => (e.status || '').toUpperCase() === 'CONVERTED').length,
    }), [enquiries]);

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

    const openView = (e) => setViewEnquiry(e);
    const closeView = () => setViewEnquiry(null);

    const openEdit = (e) => {
        setEditEnquiry(e);
        setEditStatus(e.status || 'PENDING');
        setEditNotes(e.notes || '');
        setSaveError('');
    };
    const closeEdit = () => { setEditEnquiry(null); };

    const handleSave = async () => {
        if (!editEnquiry) return;
        setSaving(true);
        setSaveError('');
        try {
            const updated = await updateInsuranceEnquiry(editEnquiry.id, {
                status: editStatus,
                notes: editNotes.trim() || null,
            });
            setEnquiries((prev) => prev.map((e) => (e.id === editEnquiry.id ? updated : e)));
            if (viewEnquiry?.id === editEnquiry.id) setViewEnquiry(updated);
            closeEdit();
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
            if (viewEnquiry?.id === id) closeView();
            if (editEnquiry?.id === id) closeEdit();
            showNotify?.('Enquiry deleted', 'success');
        } catch {
            showNotify?.('Failed to delete', 'error');
        } finally {
            setDeleting(false);
            setDeleteConfirmId(null);
            setDeleteConfirmName('');
        }
    };

    const openDeleteConfirm = (e, ev) => {
        ev.stopPropagation();
        setDeleteConfirmId(e.id);
        setDeleteConfirmName(e.customer_name || 'this enquiry');
    };

    const closeDeleteConfirm = () => { setDeleteConfirmId(null); setDeleteConfirmName(''); };

    return (
        <div className="admin-table-card catalog-tab-card ins-enq-tab-card animate-slide-up">

            {/* Header */}
            <div className="catalog-tab-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
                        <Shield size={20} style={{ color: '#6366f1' }} />
                        <h2 className="catalog-tab-title">Insurance Enquiries</h2>
                    </div>
                    <p className="catalog-tab-subtitle">
                        Leads submitted via the health insurance inquiry form on the website.
                    </p>
                </div>
                <button
                    className="aui-btn aui-btn--ghost aui-btn--sm"
                    onClick={load}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start' }}
                >
                    {loading ? <InlineSpinner size={13} /> : <RefreshCw size={13} />}
                    Refresh
                </button>
            </div>

            {/* KPI strip */}
            <div className="catalog-kpi-strip">
                <div className="catalog-kpi-card">
                    <div className="catalog-kpi-icon catalog-kpi-icon--purple">
                        <Shield size={18} />
                    </div>
                    <div className="catalog-kpi-body">
                        <div className="catalog-kpi-value">{counts.total}</div>
                        <div className="catalog-kpi-label">Total</div>
                    </div>
                </div>
                <div className="catalog-kpi-card">
                    <div className="catalog-kpi-icon catalog-kpi-icon--amber">
                        <Clock size={18} />
                    </div>
                    <div className="catalog-kpi-body">
                        <div className="catalog-kpi-value">{counts.pending}</div>
                        <div className="catalog-kpi-label">Pending</div>
                    </div>
                </div>
                <div className="catalog-kpi-card">
                    <div className="catalog-kpi-icon catalog-kpi-icon--blue">
                        <PhoneCall size={18} />
                    </div>
                    <div className="catalog-kpi-body">
                        <div className="catalog-kpi-value">{counts.contacted}</div>
                        <div className="catalog-kpi-label">Contacted</div>
                    </div>
                </div>
                <div className="catalog-kpi-card">
                    <div className="catalog-kpi-icon catalog-kpi-icon--green">
                        <TrendingUp size={18} />
                    </div>
                    <div className="catalog-kpi-body">
                        <div className="catalog-kpi-value">{counts.converted}</div>
                        <div className="catalog-kpi-label">Converted</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={16} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search name, phone, plan…"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        aria-label="Search insurance enquiries"
                    />
                    {searchTerm && (
                        <button
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--admin-text-muted, #94a3b8)' }}
                            onClick={() => { setSearchTerm(''); setPage(1); }}
                            aria-label="Clear search"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="catalog-rows-select"
                    style={{ minWidth: '148px' }}
                    aria-label="Filter by status"
                >
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <span className="catalog-tab-meta">
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Body */}
            {loading ? (
                <div className="catalog-loading">
                    <InlineSpinner size={28} />
                    <span>Loading enquiries…</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="catalog-empty">
                    <Shield size={42} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                    <p className="catalog-empty-title">No enquiries found</p>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                        {searchTerm || statusFilter
                            ? 'Try adjusting your search or status filter.'
                            : 'Enquiries submitted via the insurance form will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="admin-table catalog-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Age / Family</th>
                                <th>Plan interest</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((e) => (
                                <tr key={e.id} onClick={() => openView(e)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div className="ins-enq-name-cell">
                                            <span className="ins-enq-name-avatar">{getInitial(e.customer_name)}</span>
                                            <div>
                                                <div className="ins-enq-name-main">{e.customer_name || '—'}</div>
                                                <div className="ins-enq-name-phone">
                                                    <Phone size={11} />
                                                    {e.customer_phone || '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {e.customer_age != null ? (
                                            <div className="ins-enq-age-cell">
                                                <User size={13} style={{ color: 'var(--admin-text-muted, #94a3b8)' }} />
                                                {e.customer_age} yrs
                                                {e.family_size != null && (
                                                    <>
                                                        <span className="ins-enq-age-sep">·</span>
                                                        <Users size={13} style={{ color: 'var(--admin-text-muted, #94a3b8)' }} />
                                                        {e.family_size}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--admin-text-muted, #94a3b8)' }}>—</span>
                                        )}
                                    </td>
                                    <td>
                                        {e.plan_type
                                            ? <span className="ins-enq-plan-pill"><Heart size={11} />{e.plan_type}</span>
                                            : <span style={{ color: 'var(--admin-text-muted, #94a3b8)' }}>—</span>
                                        }
                                    </td>
                                    <td onClick={(ev) => ev.stopPropagation()}>
                                        <span className={`status-tag ${statusClass(e.status)}`}>
                                            {STATUS_LABELS[e.status] || e.status || 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap', color: 'var(--admin-text-muted, #64748b)', fontSize: '0.8125rem' }}>
                                        {formatDate(e.created_at)}
                                    </td>
                                    <td className="actions" onClick={(ev) => ev.stopPropagation()}>
                                        <button
                                            className="aui-icon-btn aui-icon-btn--default"
                                            title="View details"
                                            onClick={() => openView(e)}
                                        >
                                            <Eye size={15} />
                                        </button>
                                        {canUpdate && (
                                            <button
                                                className="aui-icon-btn aui-icon-btn--default"
                                                title="Edit status / notes"
                                                onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                className="aui-icon-btn aui-icon-btn--danger"
                                                title="Delete"
                                                onClick={(ev) => openDeleteConfirm(e, ev)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > rowsPerPage && (
                <div className="pagination-bar">
                    <div className="rows-per-page-wrap">
                        Rows
                        <select
                            value={rowsPerPage}
                            onChange={(ev) => { setRowsPerPage(Number(ev.target.value)); setPage(1); }}
                            className="rows-per-page-select"
                        >
                            {ROWS_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        per page
                    </div>
                    <span className="pagination-page-info">
                        Page {safePage} of {totalPages}
                    </span>
                    <div className="pagination-controls">
                        <button className="pagination-btn" disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
                        <button className="pagination-btn" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                        <button className="pagination-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                        <button className="pagination-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
                    </div>
                </div>
            )}

            {/* ── View modal (read-only) ── */}
            {viewEnquiry && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(ev) => { if (ev.target === ev.currentTarget) closeView(); }}
                >
                    <div
                        className="admin-modal"
                        role="dialog"
                        aria-modal="true"
                        style={{ maxWidth: '520px' }}
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Shield size={16} style={{ color: '#6366f1' }} />
                                <h3>Enquiry Details</h3>
                            </div>
                            <button className="modal-close" onClick={closeView} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="modal-form">
                            <div className="ins-enq-detail-grid">
                                <div>
                                    <div className="ins-enq-detail-field-label">Name</div>
                                    <div className="ins-enq-detail-field-value">
                                        <User size={13} />{viewEnquiry.customer_name}
                                    </div>
                                </div>
                                <div>
                                    <div className="ins-enq-detail-field-label">Phone</div>
                                    <div className="ins-enq-detail-field-value">
                                        <Phone size={13} />{viewEnquiry.customer_phone}
                                    </div>
                                </div>
                                <div>
                                    <div className="ins-enq-detail-field-label">Age</div>
                                    <div className="ins-enq-detail-field-value">
                                        {viewEnquiry.customer_age != null ? `${viewEnquiry.customer_age} years` : '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="ins-enq-detail-field-label">Family size</div>
                                    <div className="ins-enq-detail-field-value">
                                        <Users size={13} />{viewEnquiry.family_size ?? '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="ins-enq-detail-field-label">Plan interest</div>
                                    <div className="ins-enq-detail-field-value">
                                        <Heart size={13} />{viewEnquiry.plan_type || '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="ins-enq-detail-field-label">Status</div>
                                    <div className="ins-enq-detail-field-value">
                                        <span className={`status-tag ${statusClass(viewEnquiry.status)}`}>
                                            {STATUS_LABELS[viewEnquiry.status] || viewEnquiry.status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div className="ins-enq-detail-field-label">Submitted</div>
                                    <div className="ins-enq-detail-field-value" style={{ fontWeight: 400 }}>
                                        {formatDate(viewEnquiry.created_at)}
                                    </div>
                                </div>
                            </div>

                            {viewEnquiry.message && (
                                <div className="ins-enq-message-block">
                                    <div className="ins-enq-message-label">
                                        <MessageSquare size={12} /> Customer message
                                    </div>
                                    <div className="ins-enq-message-text">{viewEnquiry.message}</div>
                                </div>
                            )}

                            {viewEnquiry.notes && (
                                <div className="ins-enq-message-block">
                                    <div className="ins-enq-message-label">Staff notes</div>
                                    <div className="ins-enq-message-text">{viewEnquiry.notes}</div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="aui-btn aui-btn--ghost aui-btn--sm" onClick={closeView}>
                                    Close
                                </button>
                                {canUpdate && (
                                    <button
                                        className="aui-btn aui-btn--outline aui-btn--sm"
                                        onClick={() => { closeView(); openEdit(viewEnquiry); }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                    >
                                        <Pencil size={13} /> Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit modal ── */}
            {editEnquiry && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(ev) => { if (ev.target === ev.currentTarget) closeEdit(); }}
                >
                    <div
                        className="admin-modal"
                        role="dialog"
                        aria-modal="true"
                        style={{ maxWidth: '460px' }}
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Pencil size={15} style={{ color: '#6366f1' }} />
                                <h3>Edit Enquiry</h3>
                            </div>
                            <button className="modal-close" onClick={closeEdit} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="modal-form">
                            <div className="ins-enq-edit-context">
                                <span className="ins-enq-name-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                    {getInitial(editEnquiry.customer_name)}
                                </span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--admin-text-main, #0f172a)' }}>
                                        {editEnquiry.customer_name}
                                    </div>
                                    <div style={{ fontSize: '0.775rem', color: 'var(--admin-text-muted, #64748b)' }}>
                                        {editEnquiry.customer_phone}
                                        {editEnquiry.plan_type && ` · ${editEnquiry.plan_type}`}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="ins-enq-edit-status">Status</label>
                                <select
                                    id="ins-enq-edit-status"
                                    value={editStatus}
                                    onChange={(ev) => setEditStatus(ev.target.value)}
                                >
                                    {STATUS_OPTIONS.filter((o) => o.value).map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="ins-enq-edit-notes">Staff notes</label>
                                <textarea
                                    id="ins-enq-edit-notes"
                                    value={editNotes}
                                    onChange={(ev) => setEditNotes(ev.target.value)}
                                    rows={4}
                                    placeholder="Add internal notes…"
                                    className="ins-enq-notes-textarea"
                                />
                            </div>

                            {saveError && (
                                <div className="ins-enq-save-error">
                                    <AlertCircle size={14} />{saveError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="aui-btn aui-btn--ghost aui-btn--sm" onClick={closeEdit}>
                                    Cancel
                                </button>
                                <button
                                    className="aui-btn aui-btn--primary aui-btn--sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                    {saving ? <InlineSpinner size={13} /> : <CheckCircle size={13} />}
                                    Save changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete confirmation ── */}
            {deleteConfirmId && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(ev) => { if (ev.target === ev.currentTarget) closeDeleteConfirm(); }}
                >
                    <div
                        className="admin-modal compact-modal"
                        role="dialog"
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Delete enquiry?</h3>
                            <button className="modal-close" onClick={closeDeleteConfirm} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="modal-form">
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--admin-text-muted, #64748b)' }}>
                                This will permanently remove the enquiry from{' '}
                                <strong style={{ color: 'var(--admin-text-main, #0f172a)' }}>{deleteConfirmName}</strong>.
                                This action cannot be undone.
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button className="aui-btn aui-btn--ghost aui-btn--sm" onClick={closeDeleteConfirm}>
                                    Cancel
                                </button>
                                <button
                                    className="aui-btn aui-btn--danger aui-btn--sm"
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    disabled={deleting}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                    {deleting ? <InlineSpinner size={13} /> : <Trash2 size={13} />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InsuranceEnquiriesTab;
