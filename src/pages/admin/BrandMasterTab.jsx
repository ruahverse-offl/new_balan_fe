import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2, Tag, X, ArrowLeft, ChevronRight, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { listBrandMasters, createBrandMaster, updateBrandMaster, deleteBrandMaster } from '../../services/brandsApi';
import './AdminCatalogTabs.css';
import './BrandMasterTab.css';

/**
 * Admin screen for `M_brands` — shared trade-name catalog (used by medicine–brand offerings).
 */
const BrandMasterTab = ({ showNotify }) => {
    const { user } = useAuth();
    const role = (user?.backendRole || user?.role || '').toUpperCase();
    const isAdminRole = role === 'DEV_ADMIN' || role === 'ADMIN';
    const bp = user?.backendPermissions || [];
    const canCreate = isAdminRole || bp.includes('MEDICINE_CREATE');
    const canUpdate = isAdminRole || bp.includes('MEDICINE_UPDATE');
    const canDelete = isAdminRole || bp.includes('MEDICINE_DELETE');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', is_active: true });
    const [submitting, setSubmitting] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [viewBrand, setViewBrand] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, rowsPerPage]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * rowsPerPage;
            const res = await listBrandMasters({
                limit: rowsPerPage,
                offset,
                search: debouncedSearch || undefined,
                sort_by: 'name',
                sort_order: 'asc',
            });
            setItems(res.items || []);
            setPagination(res.pagination || null);
        } catch (e) {
            showNotify(e?.message || 'Failed to load brands', 'error');
            setItems([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, debouncedSearch, showNotify]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!viewBrand) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setViewBrand(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [viewBrand]);

    const formatBrandTimestamp = (v) => {
        if (v == null || v === '') return '—';
        try {
            return new Date(v).toLocaleString();
        } catch {
            return String(v);
        }
    };

    const openAdd = () => {
        setModalMode('add');
        setEditingId(null);
        setForm({ name: '', description: '', is_active: true });
        setShowModal(true);
    };

    const openEdit = (row) => {
        setModalMode('edit');
        setEditingId(row.id);
        setForm({
            name: row.name || '',
            description: row.description || '',
            is_active: row.is_active !== false,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = form.name?.trim();
        if (!name) {
            showNotify('Brand name is required', 'error');
            return;
        }
        setSubmitting(true);
        try {
            if (modalMode === 'add') {
                await createBrandMaster({
                    name,
                    description: form.description?.trim() || undefined,
                });
                showNotify('Brand created', 'success');
            } else {
                await updateBrandMaster(editingId, {
                    name,
                    description: form.description?.trim() || null,
                    is_active: form.is_active,
                });
                showNotify('Brand updated', 'success');
            }
            setShowModal(false);
            await load();
        } catch (err) {
            showNotify(err?.message || 'Save failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm?.id) return;
        try {
            await deleteBrandMaster(deleteConfirm.id);
            showNotify('Brand removed', 'success');
            setDeleteConfirm(null);
            await load();
        } catch (err) {
            showNotify(err?.message || 'Delete failed', 'error');
        }
    };

    const totalPages =
        pagination?.total != null && rowsPerPage > 0
            ? Math.max(1, Math.ceil(pagination.total / rowsPerPage))
            : 1;
    const total = pagination?.total ?? 0;
    const limit = rowsPerPage;
    const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
    const showingTo = total === 0 ? 0 : Math.min(page * limit, total);
    const hasPrev = pagination?.has_previous === true || page > 1;
    const hasNext = pagination?.has_next === true;

    return (
        <div className="admin-table-card catalog-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Brand catalog</h2>
                <p className="catalog-tab-subtitle">
                    Master list of trade names (<code style={{ fontSize: '0.8em' }}>M_brands</code>). Medicine–brand
                    offerings and inventory reference these rows. Search is debounced and runs on the server. Use{' '}
                    <strong>View</strong> on a row for read-only details.
                </p>
            </div>

            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search brand names…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search brands"
                    />
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
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                {canCreate && (
                    <button type="button" className="btn-add" onClick={openAdd}>
                        <Plus size={18} /> Add brand
                    </button>
                )}
                {!loading && total > 0 && (
                    <span className="catalog-tab-meta">
                        {total} brand{total !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    {loading && items.length === 0 ? (
                        <div className="catalog-loading" role="status" aria-live="polite">
                            <Loader2 size={36} aria-hidden />
                            <span>Loading brands…</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="catalog-empty">
                            <Tag size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} aria-hidden />
                            <p className="catalog-empty-title">No brands found</p>
                            <p>
                                {debouncedSearch?.trim()
                                    ? 'Try another search or clear the box.'
                                    : canCreate
                                      ? 'Add a brand with the button above.'
                                      : 'Nothing matches your search or access.'}
                            </p>
                        </div>
                    ) : (
                        <table className="admin-table catalog-table">
                            <thead>
                                <tr>
                                    <th>Brand</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((row) => {
                                    const initial = (row.name || '?').trim().charAt(0).toUpperCase();
                                    return (
                                        <tr key={row.id}>
                                            <td data-label="Brand" className="catalog-cell-name">
                                                <div className="brand-name-row">
                                                    <span className="brand-initial-badge" aria-hidden>
                                                        {initial}
                                                    </span>
                                                    <div>
                                                        <span className="catalog-brand-pill" title={row.name || ''}>
                                                            {row.name || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Description">
                                                {row.description ? (
                                                    <span className="catalog-desc-preview" title={row.description}>
                                                        {row.description}
                                                    </span>
                                                ) : (
                                                    <span className="catalog-desc-preview">—</span>
                                                )}
                                            </td>
                                            <td data-label="Status">
                                                <span
                                                    className={`status-tag ${row.is_active !== false ? 'active' : 'inactive'}`}
                                                >
                                                    {row.is_active !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td data-label="Actions" className="actions">
                                                <button
                                                    type="button"
                                                    className="action-btn brand-master-view-btn"
                                                    title="View brand details"
                                                    onClick={() => setViewBrand(row)}
                                                >
                                                    <Eye size={18} strokeWidth={2.25} aria-hidden />
                                                    <span className="brand-master-view-btn-label">View</span>
                                                </button>
                                                {canUpdate && (
                                                    <button
                                                        type="button"
                                                        className="action-btn"
                                                        title="Edit brand"
                                                        onClick={() => openEdit(row)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        className="action-btn delete"
                                                        title="Delete brand"
                                                        onClick={() => setDeleteConfirm({ id: row.id, name: row.name })}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {pagination?.total != null && total > 0 && (
                <div className="catalog-tab-footer">
                    <span className="catalog-tab-meta">
                        Showing {showingFrom}–{showingTo} of {total}
                    </span>
                    <div className="pagination-bar">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!hasPrev || loading}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{page}</span> of {totalPages}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={loading || !hasNext}
                            className="page-nav-btn"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {showModal && (canCreate || canUpdate) && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal compact-modal">
                        <div className="modal-header">
                            <h3>{modalMode === 'add' ? 'Add brand' : 'Edit brand'}</h3>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                style={{ color: 'var(--admin-text-muted)' }}
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="bm-name">Brand name*</label>
                                <input
                                    id="bm-name"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Crocin"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="bm-desc">Description</label>
                                <textarea
                                    id="bm-desc"
                                    rows={2}
                                    value={form.description}
                                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            {modalMode === 'edit' && (
                                <div
                                    className="form-group form-group-checkbox"
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <input
                                        type="checkbox"
                                        id="bm-active"
                                        checked={form.is_active}
                                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                                    />
                                    <label htmlFor="bm-active">Active</label>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    className="btn-add btn-cancel"
                                    style={{ flex: 1 }}
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-add" style={{ flex: 2 }} disabled={submitting}>
                                    {submitting ? 'Saving…' : modalMode === 'add' ? 'Create' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewBrand && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setViewBrand(null);
                    }}
                >
                    <div
                        className="admin-modal compact-modal"
                        style={{ maxWidth: '560px' }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="brand-details-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3 id="brand-details-title">Brand details</h3>
                            <button
                                type="button"
                                className="modal-close"
                                aria-label="Close"
                                onClick={() => setViewBrand(null)}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Name</div>
                                <div style={{ fontWeight: 700 }}>{viewBrand.name || '—'}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    Description
                                </div>
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--admin-border)',
                                        borderRadius: '10px',
                                        background: 'var(--admin-bg)',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {viewBrand.description ? (
                                        viewBrand.description
                                    ) : (
                                        <span style={{ color: 'var(--admin-text-muted)' }}>No description</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</div>
                                <div style={{ fontWeight: 700 }}>
                                    {viewBrand.is_active !== false ? 'Active' : 'Inactive'}
                                </div>
                            </div>
                            {viewBrand.is_deleted != null && (
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Deleted</div>
                                    <div style={{ fontWeight: 600 }}>{viewBrand.is_deleted ? 'Yes' : 'No'}</div>
                                </div>
                            )}
                            {viewBrand.created_at != null && (
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Created</div>
                                    <div style={{ fontWeight: 600 }}>{formatBrandTimestamp(viewBrand.created_at)}</div>
                                </div>
                            )}
                            {viewBrand.updated_at != null && (
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Updated</div>
                                    <div style={{ fontWeight: 600 }}>{formatBrandTimestamp(viewBrand.updated_at)}</div>
                                </div>
                            )}
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Brand ID</div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                    {viewBrand.id != null ? String(viewBrand.id) : '—'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                type="button"
                                className="btn-add btn-cancel"
                                style={{ flex: 1 }}
                                onClick={() => setViewBrand(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && canDelete && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true">
                    <div className="admin-modal" style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3>Delete brand?</h3>
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                style={{ color: 'var(--admin-text-muted)' }}
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ margin: '0 0 1rem' }}>
                            Remove <strong>{deleteConfirm.name}</strong> from the catalog? Existing offerings keep their
                            link; this only soft-deletes the master row if unused.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                className="btn-add btn-cancel"
                                style={{ flex: 1 }}
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button type="button" className="btn-add btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandMasterTab;
