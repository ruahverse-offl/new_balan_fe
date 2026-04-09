import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight, Pill, Loader2, Eye, X } from 'lucide-react';
import { getMedicineById } from '../../services/medicinesApi';
import { getStorageFileUrl } from '../../utils/prescriptionUrl';
import './MedicinesTab.css';

const formatMedicineMrp = (v) => {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    return `₹${n.toFixed(2)}`;
};

const formatMedicineTs = (v) => {
    if (v == null || v === '') return '—';
    try {
        return new Date(v).toLocaleString();
    } catch {
        return String(v);
    }
};

/**
 * Manage Medicines — catalog list with server search & pagination.
 */
const MedicinesTab = ({
    medicines = [],
    loading = false,
    pagination = null,
    page = 1,
    setPage,
    rowsPerPage = 10,
    setRowsPerPage,
    searchTerm = '',
    setSearchTerm,
    onAdd,
    onEdit,
    onDelete,
    onAvailabilityChange,
    showNotify,
}) => {
    const [medicineView, setMedicineView] = useState(null);

    const closeMedicineView = useCallback(() => setMedicineView(null), []);

    useEffect(() => {
        if (!medicineView) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeMedicineView();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [medicineView, closeMedicineView]);

    const openMedicineView = useCallback(
        async (row) => {
            if (!row?.id) return;
            setMedicineView({ row, detail: null, loading: true, loadError: null });
            try {
                const full = await getMedicineById(row.id, { include_brands: true });
                setMedicineView((prev) =>
                    prev?.row?.id === row.id ? { row, detail: full, loading: false, loadError: null } : prev,
                );
            } catch (e) {
                const msg = e?.message || 'Failed to load details';
                setMedicineView((prev) =>
                    prev?.row?.id === row.id ? { row, detail: null, loading: false, loadError: msg } : prev,
                );
                showNotify?.(msg, 'error');
            }
        },
        [showNotify],
    );

    const limit = pagination?.limit || rowsPerPage;
    const total = pagination?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
    const hasPrev = pagination?.has_previous === true || page > 1;
    const hasNext = pagination?.has_next === true;
    const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
    const showingTo = total === 0 ? 0 : Math.min(page * limit, total);

    const viewSource = medicineView ? medicineView.detail || medicineView.row : null;
    const viewBrands = medicineView?.detail?.brands;

    return (
        <div className="admin-table-card medicines-tab-card animate-slide-up">
            <div className="medicines-tab-header">
                <h2 className="medicines-tab-title">Manage medicines</h2>
                <p className="medicines-tab-subtitle">
                    Generic medicine records, categories, and storefront availability. Brand lines are edited per medicine.
                    Search and pagination are handled on the server. Use the <strong>eye (View)</strong> on a row for
                    read-only details and linked sellable lines.
                </p>
            </div>

            <div className="medicines-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search by name or category…"
                        value={searchTerm || ''}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        aria-label="Search medicines"
                    />
                </div>
                <label className="medicines-rows-label">
                    Rows
                    <select
                        className="medicines-rows-select"
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPage(1);
                        }}
                    >
                        {[5, 10, 20, 50, 100].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
                <button type="button" className="btn-add" onClick={onAdd}>
                    <Plus size={18} /> Add medicine
                </button>
                {!loading && total > 0 && (
                    <span className="medicines-tab-meta">
                        {total} product{total !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    {loading && medicines.length === 0 ? (
                        <div className="medicines-loading-overlay" role="status" aria-live="polite">
                            <Loader2 size={36} aria-hidden />
                            <span>Loading medicines…</span>
                        </div>
                    ) : medicines.length === 0 ? (
                        <div className="medicines-empty">
                            <Pill size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} aria-hidden />
                            <p className="medicines-empty-title">No medicines found</p>
                            <p>
                                {searchTerm?.trim()
                                    ? 'Try another search or clear the box to see the full list.'
                                    : 'Add your first medicine with the button above.'}
                            </p>
                        </div>
                    ) : (
                        <table className="admin-table medicines-table">
                            <thead>
                                <tr>
                                    <th>Medicine</th>
                                    <th>Category</th>
                                    <th>Rx</th>
                                    <th>Listed</th>
                                    <th>Storefront</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.map((med) => (
                                    <tr key={med.id}>
                                        <td data-label="Medicine" className="medicines-cell-name">
                                            <strong>{med.name || '—'}</strong>
                                        </td>
                                        <td data-label="Category">
                                            <span className="medicines-category-pill" title={med.medicine_category_name || ''}>
                                                {med.medicine_category_name || '—'}
                                            </span>
                                        </td>
                                        <td data-label="Rx">
                                            <span
                                                className={`medicines-rx-badge ${
                                                    med.is_prescription_required ? 'medicines-rx-badge--yes' : 'medicines-rx-badge--no'
                                                }`}
                                            >
                                                {med.is_prescription_required ? 'Rx' : 'OTC'}
                                            </span>
                                        </td>
                                        <td data-label="Listed">
                                            <span
                                                className={`status-tag ${med.is_active !== false ? 'active' : 'inactive'}`}
                                            >
                                                {med.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td data-label="Storefront">
                                            <select
                                                className="medicines-avail-select"
                                                value={med.is_available !== false ? 'yes' : 'no'}
                                                disabled={loading}
                                                onChange={async (e) => {
                                                    const newValue = e.target.value === 'yes';
                                                    await onAvailabilityChange(med, newValue);
                                                }}
                                                aria-label={`Availability for ${med.name || 'medicine'}`}
                                                title="Shown as available on the storefront"
                                            >
                                                <option value="yes">Available</option>
                                                <option value="no">Unavailable</option>
                                            </select>
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                type="button"
                                                className="action-btn medicines-view-btn"
                                                title="View medicine details (read-only)"
                                                aria-label={`View details for ${med.name || 'medicine'}`}
                                                onClick={() => openMedicineView(med)}
                                            >
                                                <Eye size={18} strokeWidth={2.25} aria-hidden />
                                                <span className="medicines-view-btn-label">View</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn"
                                                title="Edit medicine"
                                                onClick={() => onEdit(med)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn delete"
                                                title="Delete medicine"
                                                onClick={() => onDelete(med)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {pagination && total > 0 && (
                <div className="medicines-tab-footer">
                    <span className="medicines-tab-meta">
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
                            disabled={!hasNext || loading}
                            className="page-nav-btn"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {medicineView && viewSource && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeMedicineView();
                    }}
                >
                    <div
                        className="admin-modal compact-modal medicine-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="medicine-details-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="medicine-details-modal__hero">
                            <div className="medicine-details-modal__identity">
                                {viewSource.image_path ? (
                                    <img
                                        className="medicine-details-modal__thumb"
                                        src={getStorageFileUrl(viewSource.image_path)}
                                        alt=""
                                    />
                                ) : (
                                    <div className="medicine-details-modal__thumb medicine-details-modal__thumb--fallback" aria-hidden>
                                        <Pill size={32} strokeWidth={1.75} />
                                    </div>
                                )}
                                <div className="medicine-details-modal__head-text">
                                    <h3 id="medicine-details-title" className="medicine-details-modal__title">
                                        {viewSource.name || 'Medicine'}
                                    </h3>
                                    <p className="medicine-details-modal__subtitle">
                                        {viewSource.medicine_category_name && viewSource.medicine_category_name !== '—'
                                            ? viewSource.medicine_category_name
                                            : 'Category not set'}
                                    </p>
                                    <div className="medicine-details-modal__badges">
                                        <span
                                            className={`medicines-rx-badge ${
                                                viewSource.is_prescription_required
                                                    ? 'medicines-rx-badge--yes'
                                                    : 'medicines-rx-badge--no'
                                            }`}
                                        >
                                            {viewSource.is_prescription_required ? 'Prescription required' : 'OTC'}
                                        </span>
                                        <span
                                            className={`status-tag ${viewSource.is_active !== false ? 'active' : 'inactive'}`}
                                        >
                                            Listed {viewSource.is_active !== false ? 'active' : 'inactive'}
                                        </span>
                                        <span
                                            className={`status-tag ${viewSource.is_available !== false ? 'active' : 'inactive'}`}
                                        >
                                            Storefront {viewSource.is_available !== false ? 'available' : 'unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                aria-label="Close"
                                onClick={closeMedicineView}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="medicine-details-modal__body">
                            <section className="medicine-details-modal__section">
                                <h4 className="medicine-details-modal__section-title">About</h4>
                                <div className="medicine-details-modal__prose">
                                    {viewSource.description ? (
                                        viewSource.description
                                    ) : (
                                        <span className="medicine-details-modal__empty">No description</span>
                                    )}
                                </div>
                            </section>

                            <section className="medicine-details-modal__section">
                                <h4 className="medicine-details-modal__section-title">Sellable brand lines</h4>
                                {medicineView.loading ? (
                                    <div className="medicine-details-modal__brands-loading" role="status">
                                        <Loader2 size={22} aria-hidden className="medicine-details-modal__spin" />
                                        <span>Loading linked brands…</span>
                                    </div>
                                ) : medicineView.loadError ? (
                                    <p className="medicine-details-modal__brands-error">
                                        Could not load brand lines. Details above are from the catalog list.
                                    </p>
                                ) : Array.isArray(viewBrands) && viewBrands.length > 0 ? (
                                    <ul className="medicine-details-modal__brand-list" aria-label="Brand offerings">
                                        {viewBrands.map((o) => (
                                            <li key={o.id} className="medicine-details-modal__brand-row">
                                                <div className="medicine-details-modal__brand-main">
                                                    <span className="medicine-details-modal__brand-name">
                                                        {o.brand_name || '—'}
                                                    </span>
                                                    <span className="medicine-details-modal__brand-meta">
                                                        {o.manufacturer || '—'}
                                                        {o.is_active === false || o.is_available === false ? (
                                                            <span className="medicine-details-modal__brand-flag">Inactive</span>
                                                        ) : null}
                                                    </span>
                                                </div>
                                                <span className="medicine-details-modal__brand-mrp">
                                                    {formatMedicineMrp(o.mrp)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="medicine-details-modal__brands-empty">
                                        No catalog brand lines linked yet. Edit this medicine to add sellable SKUs.
                                    </p>
                                )}
                            </section>

                            <section className="medicine-details-modal__section">
                                <h4 className="medicine-details-modal__section-title">Record</h4>
                                <div className="medicine-details-modal__grid">
                                    <div className="medicine-details-modal__field medicine-details-modal__field--full">
                                        <div className="medicine-details-modal__label">Medicine ID</div>
                                        <div className="medicine-details-modal__value medicine-details-modal__value--mono">
                                            {viewSource.id != null ? String(viewSource.id) : '—'}
                                        </div>
                                    </div>
                                    {viewSource.medicine_category_id != null && (
                                        <div className="medicine-details-modal__field medicine-details-modal__field--full">
                                            <div className="medicine-details-modal__label">Category ID</div>
                                            <div className="medicine-details-modal__value medicine-details-modal__value--mono">
                                                {String(viewSource.medicine_category_id)}
                                            </div>
                                        </div>
                                    )}
                                    {medicineView.detail?.created_at != null && (
                                        <div className="medicine-details-modal__field">
                                            <div className="medicine-details-modal__label">Created</div>
                                            <div className="medicine-details-modal__value">
                                                {formatMedicineTs(medicineView.detail.created_at)}
                                            </div>
                                        </div>
                                    )}
                                    {medicineView.detail?.updated_at != null && (
                                        <div className="medicine-details-modal__field">
                                            <div className="medicine-details-modal__label">Updated</div>
                                            <div className="medicine-details-modal__value">
                                                {formatMedicineTs(medicineView.detail.updated_at)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="medicine-details-modal__footer">
                            <button type="button" className="btn-add btn-cancel medicine-details-modal__close-btn" onClick={closeMedicineView}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicinesTab;
