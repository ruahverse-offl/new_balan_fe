import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight, Tags, Eye, X } from 'lucide-react';
import { getTherapeuticCategoryById } from '../../services/therapeuticCategoriesApi';
import './AdminCatalogTabs.css';
import './TherapeuticCategoriesTab.css';

const formatCategoryTs = (v) => {
    if (v == null || v === '') return '—';
    try {
        return new Date(v).toLocaleString();
    } catch {
        return String(v);
    }
};

const TherapeuticCategoriesTab = ({
    therapeuticCategories,
    searchTerm,
    setSearchTerm,
    therapeuticCategoriesPage,
    setTherapeuticCategoriesPage,
    therapeuticCategoriesRowsPerPage,
    setTherapeuticCategoriesRowsPerPage,
    onAddClick,
    onEditClick,
    onDeleteClick,
    showNotify,
}) => {
    const [viewCategory, setViewCategory] = useState(null);

    const closeView = useCallback(() => setViewCategory(null), []);

    useEffect(() => {
        if (!viewCategory) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeView();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [viewCategory, closeView]);

    const openCategoryView = useCallback(
        async (row) => {
            if (!row?.id) return;
            setViewCategory({ row, detail: null, loading: true, loadError: null });
            try {
                const full = await getTherapeuticCategoryById(row.id);
                setViewCategory((prev) =>
                    prev?.row?.id === row.id ? { row, detail: full, loading: false, loadError: null } : prev,
                );
            } catch (e) {
                const msg = e?.message || 'Failed to load category';
                setViewCategory((prev) =>
                    prev?.row?.id === row.id ? { row, detail: null, loading: false, loadError: msg } : prev,
                );
                showNotify?.(msg, 'error');
            }
        },
        [showNotify],
    );
    const filteredCategories = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        return (therapeuticCategories || []).filter(
            (c) => c && (c.name || '').toLowerCase().includes(q)
        );
    }, [therapeuticCategories, searchTerm]);

    const rows = therapeuticCategoriesRowsPerPage;
    const total = filteredCategories.length;
    const totalPages = Math.max(1, Math.ceil(total / rows) || 1);
    const effectivePage = Math.min(Math.max(1, therapeuticCategoriesPage), totalPages);
    const start = (effectivePage - 1) * rows;
    const pageRows = filteredCategories.slice(start, start + rows);
    const showingFrom = total === 0 ? 0 : start + 1;
    const showingTo = total === 0 ? 0 : Math.min(start + pageRows.length, total);

    return (
        <div className="admin-table-card catalog-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Medicine categories</h2>
                <p className="catalog-tab-subtitle">
                    Categories for the generic medicine catalog (clinical grouping). Each medicine links to one category.
                    Search filters this list in the browser; use rows to change page size. Use{' '}
                    <strong>View</strong> on a row for read-only details (including audit fields from the server).
                </p>
            </div>

            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search categories by name…"
                        value={searchTerm || ''}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setTherapeuticCategoriesPage(1);
                        }}
                        aria-label="Search medicine categories"
                    />
                </div>
                <label className="catalog-rows-label">
                    Rows
                    <select
                        className="catalog-rows-select"
                        value={therapeuticCategoriesRowsPerPage}
                        onChange={(e) => {
                            setTherapeuticCategoriesRowsPerPage(Number(e.target.value));
                            setTherapeuticCategoriesPage(1);
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                <button type="button" className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add category
                </button>
                {total > 0 && (
                    <span className="catalog-tab-meta">
                        {total} {total === 1 ? 'category' : 'categories'}
                    </span>
                )}
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    {total === 0 ? (
                        <div className="catalog-empty">
                            <Tags size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} aria-hidden />
                            <p className="catalog-empty-title">No categories found</p>
                            <p>
                                {(searchTerm || '').trim()
                                    ? 'Try another name or clear the search.'
                                    : 'Add a category with the button above.'}
                            </p>
                        </div>
                    ) : (
                        <table className="admin-table catalog-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((c) => (
                                    <tr key={c.id}>
                                        <td data-label="Category" className="catalog-cell-name">
                                            <span className="catalog-name-pill" title={c.name || ''}>
                                                {c.name || '—'}
                                            </span>
                                        </td>
                                        <td data-label="Description">
                                            {c.description ? (
                                                <span className="catalog-desc-preview" title={c.description}>
                                                    {c.description}
                                                </span>
                                            ) : (
                                                <span className="catalog-desc-preview">—</span>
                                            )}
                                        </td>
                                        <td data-label="Status">
                                            <span className={`status-tag ${c.is_active ? 'active' : 'inactive'}`}>
                                                {c.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                type="button"
                                                className="action-btn tc-category-view-btn"
                                                title="View category details (read-only)"
                                                aria-label={`View details for ${c.name || 'category'}`}
                                                onClick={() => openCategoryView(c)}
                                            >
                                                <Eye size={18} strokeWidth={2.25} aria-hidden />
                                                <span className="tc-category-view-btn-label">View</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn"
                                                title="Edit category"
                                                onClick={() => onEditClick(c)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="action-btn delete"
                                                title="Delete category"
                                                onClick={() => onDeleteClick('therapeutic-category', c.id, c.name)}
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

            {total > 0 && (
                <div className="catalog-tab-footer">
                    <span className="catalog-tab-meta">
                        Showing {showingFrom}–{showingTo} of {total}
                    </span>
                    {totalPages > 1 && (
                        <div className="pagination-bar">
                            <button
                                type="button"
                                onClick={() => setTherapeuticCategoriesPage((p) => Math.max(1, p - 1))}
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
                                onClick={() =>
                                    setTherapeuticCategoriesPage((p) => Math.min(totalPages, p + 1))
                                }
                                disabled={effectivePage >= totalPages}
                                className="page-nav-btn"
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {viewCategory && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeView();
                    }}
                >
                    <div
                        className="admin-modal compact-modal"
                        style={{ maxWidth: '560px' }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="tc-view-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3 id="tc-view-title">Category details</h3>
                            <button
                                type="button"
                                onClick={closeView}
                                style={{ color: 'var(--admin-text-muted)' }}
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {viewCategory.loading ? (
                            <p style={{ margin: 0, padding: '0.5rem 0', color: 'var(--admin-text-muted)' }}>
                                Loading…
                            </p>
                        ) : viewCategory.loadError ? (
                            <p style={{ margin: 0, color: '#b91c1c' }}>{viewCategory.loadError}</p>
                        ) : (
                            (() => {
                                const d = viewCategory.detail || viewCategory.row || {};
                                return (
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '0.75rem 1rem',
                                        }}
                                    >
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Name</div>
                                            <div style={{ fontWeight: 700 }}>{d.name || '—'}</div>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div
                                                style={{
                                                    color: 'var(--admin-text-muted)',
                                                    fontSize: '0.85rem',
                                                    marginBottom: '0.25rem',
                                                }}
                                            >
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
                                                {d.description ? (
                                                    d.description
                                                ) : (
                                                    <span style={{ color: 'var(--admin-text-muted)' }}>No description</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</div>
                                            <div style={{ fontWeight: 700 }}>{d.is_active !== false ? 'Active' : 'Inactive'}</div>
                                        </div>
                                        {d.is_deleted != null && (
                                            <div>
                                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                                    Deleted
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{d.is_deleted ? 'Yes' : 'No'}</div>
                                            </div>
                                        )}
                                        {d.created_at != null && (
                                            <div>
                                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                                    Created
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{formatCategoryTs(d.created_at)}</div>
                                            </div>
                                        )}
                                        {d.updated_at != null && (
                                            <div>
                                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                                    Updated
                                                </div>
                                                <div style={{ fontWeight: 600 }}>{formatCategoryTs(d.updated_at)}</div>
                                            </div>
                                        )}
                                        {d.created_by != null && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                                    Created by (user id)
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                                    {String(d.created_by)}
                                                </div>
                                            </div>
                                        )}
                                        {d.updated_by != null && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                                                    Updated by (user id)
                                                </div>
                                                <div style={{ fontWeight: 600, fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                                    {String(d.updated_by)}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Category ID</div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                                {d.id != null ? String(d.id) : '—'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={closeView}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TherapeuticCategoriesTab;
