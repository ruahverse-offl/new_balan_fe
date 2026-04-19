import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight, Pill, Eye } from 'lucide-react';
import { PageLoading } from '../../components/common/PageLoading';
import './MedicinesTab.css';

/**
 * Manage Medicines — catalog list with server search & pagination.
 * View / add / edit use full-page routes under /admin/medicines/…
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
}) => {
    const navigate = useNavigate();

    const limit = pagination?.limit || rowsPerPage;
    const total = pagination?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
    const hasPrev = pagination?.has_previous === true || page > 1;
    const hasNext = pagination?.has_next === true;
    const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
    const showingTo = total === 0 ? 0 : Math.min(page * limit, total);

    return (
        <div className="admin-table-card medicines-tab-card animate-slide-up">
            <div className="medicines-tab-header">
                <h2 className="medicines-tab-title">Manage medicines</h2>
                <p className="medicines-tab-subtitle">
                    Catalog records and categories. Storefront visibility is set per brand line on each medicine’s{' '}
                    <strong>View</strong> or <strong>Edit</strong> page. Server search and pagination.{' '}
                    <strong>View</strong> is read-only except brand storefront toggles; <strong>Add</strong> /{' '}
                    <strong>Edit</strong> use full pages.
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
                        <PageLoading
                            variant="compact"
                            className="medicines-loading-overlay"
                            message="Loading medicines…"
                        />
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
                                    <th>Storefront (summary)</th>
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
                                        <td data-label="Storefront (summary)">
                                            <span
                                                className={`status-tag ${med.is_available !== false ? 'active' : 'inactive'}`}
                                                title="Per-brand controls are on View / Edit"
                                            >
                                                {med.is_available !== false ? 'Any line on' : 'None on'}
                                            </span>
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                type="button"
                                                className="action-btn medicines-view-btn"
                                                title="View medicine details (read-only)"
                                                aria-label={`View details for ${med.name || 'medicine'}`}
                                                onClick={() => med.id && navigate(`/admin/medicines/${med.id}`)}
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
        </div>
    );
};

export default MedicinesTab;
