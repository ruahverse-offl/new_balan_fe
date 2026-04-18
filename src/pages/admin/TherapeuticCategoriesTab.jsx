import React, { useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight, Tags, Eye } from 'lucide-react';
import './AdminCatalogTabs.css';
import './TherapeuticCategoriesTab.css';

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
    onViewClick,
    onDeleteClick,
}) => {
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
                    Therapeutic groups for catalog and storefront. Search this list; use <strong>View</strong> for
                    read-only details.
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
                                                title="View category details"
                                                aria-label={`View details for ${c.name || 'category'}`}
                                                onClick={() => onViewClick?.(c)}
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
        </div>
    );
};

export default TherapeuticCategoriesTab;
