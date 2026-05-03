import React, { useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tags, Eye } from 'lucide-react';
import {
    Toolbar,
    SearchInput,
    Btn,
    IconBtn,
    StatusBadge,
    EmptyState,
    TableFooter,
} from '../../components/admin/AdminUI';
import { InlineSpinner } from '../../components/common/PageLoading';
import './AdminCatalogTabs.css';
import './TherapeuticCategoriesTab.css';

/**
 * Therapeutic (medicine) categories — list is driven from ``Admin.jsx``.
 * No duplicate page title: the sidebar already names this section.
 */
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
    loading = false,
}) => {
    const filteredCategories = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        return (therapeuticCategories || []).filter((c) => c && (c.name || '').toLowerCase().includes(q));
    }, [therapeuticCategories, searchTerm]);

    const rows = therapeuticCategoriesRowsPerPage;
    const total = filteredCategories.length;
    const totalPages = Math.max(1, Math.ceil(total / rows) || 1);
    const effectivePage = Math.min(Math.max(1, therapeuticCategoriesPage), totalPages);
    const start = (effectivePage - 1) * rows;
    const pageRows = filteredCategories.slice(start, start + rows);

    useEffect(() => {
        if (therapeuticCategoriesPage > totalPages) {
            setTherapeuticCategoriesPage(totalPages);
        }
    }, [therapeuticCategoriesPage, totalPages, setTherapeuticCategoriesPage]);

    return (
        <div className="admin-table-card catalog-tab-card animate-slide-up therap-cat-tab">
            <Toolbar className="therap-cat-toolbar">
                <SearchInput
                    value={searchTerm || ''}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setTherapeuticCategoriesPage(1);
                    }}
                    placeholder="Search categories by name…"
                />
                <span className="catalog-tab-meta therap-cat-toolbar-meta">
                    {total > 0 ? `${total} ${total === 1 ? 'category' : 'categories'}` : ''}
                </span>
                {loading && <InlineSpinner size={16} style={{ color: 'var(--admin-text-muted)' }} />}
                <Btn variant="primary" size="md" onClick={onAddClick} className="therap-cat-add-btn">
                    <Plus size={15} /> Add category
                </Btn>
            </Toolbar>

            <div className="table-wrapper therap-cat-table-wrap">
                {total === 0 ? (
                    <EmptyState
                        icon={Tags}
                        title="No categories found"
                        description={
                            (searchTerm || '').trim()
                                ? 'Try another name or clear the search.'
                                : 'Add a category with the button above.'
                        }
                        action={
                            !(searchTerm || '').trim() ? (
                                <Btn variant="primary" size="sm" onClick={onAddClick}>
                                    <Plus size={14} /> Add category
                                </Btn>
                            ) : null
                        }
                    />
                ) : (
                    <table className="admin-table catalog-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
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
                                        <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                                    </td>
                                    <td data-label="Actions">
                                        <div className="actions therap-cat-actions">
                                            <IconBtn
                                                title="View details"
                                                aria-label={`View details for ${c.name || 'category'}`}
                                                onClick={() => onViewClick?.(c)}
                                            >
                                                <Eye size={14} />
                                            </IconBtn>
                                            <IconBtn
                                                title="Edit category"
                                                aria-label={`Edit ${c.name || 'category'}`}
                                                onClick={() => onEditClick(c)}
                                            >
                                                <Pencil size={14} />
                                            </IconBtn>
                                            <IconBtn
                                                variant="danger"
                                                title="Delete category"
                                                aria-label={`Delete ${c.name || 'category'}`}
                                                onClick={() => onDeleteClick('therapeutic-category', c.id, c.name)}
                                            >
                                                <Trash2 size={14} />
                                            </IconBtn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {total > 0 && (
                <TableFooter
                    page={effectivePage}
                    totalPages={totalPages}
                    total={total}
                    rowsPerPage={rows}
                    onRowsChange={(n) => {
                        setTherapeuticCategoriesRowsPerPage(n);
                        setTherapeuticCategoriesPage(1);
                    }}
                    onPage={setTherapeuticCategoriesPage}
                    label="categories"
                    rowsOptions={[5, 10, 20, 50, 100]}
                />
            )}
        </div>
    );
};

export default TherapeuticCategoriesTab;
