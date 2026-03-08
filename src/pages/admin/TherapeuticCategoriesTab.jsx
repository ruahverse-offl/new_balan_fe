import React from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';

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
    onDeleteClick
}) => {
    const filteredCategories = (therapeuticCategories || []).filter(c =>
        c && c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCategories.length / therapeuticCategoriesRowsPerPage);

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search therapeutic categories..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setTherapeuticCategoriesPage(1);
                        }}
                    />
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Category
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories
                                .slice((therapeuticCategoriesPage - 1) * therapeuticCategoriesRowsPerPage, therapeuticCategoriesPage * therapeuticCategoriesRowsPerPage)
                                .map(c => (
                                    <tr key={c.id}>
                                        <td data-label="Name">{c.name}</td>
                                        <td data-label="Description">
                                            {c.description ? (c.description.length > 50 ? c.description.substring(0, 50) + '...' : c.description) : 'N/A'}
                                        </td>
                                        <td data-label="Active">
                                            <span className={`status-tag ${c.is_active ? 'active' : 'inactive'}`}>
                                                {c.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => onEditClick(c)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick('therapeutic-category', c.id, c.name)}
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
                        value={therapeuticCategoriesRowsPerPage}
                        onChange={(e) => {
                            setTherapeuticCategoriesRowsPerPage(Number(e.target.value));
                            setTherapeuticCategoriesPage(1);
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
                {totalPages > 1 && (
                    <div className="pagination-bar">
                        <button
                            onClick={() => setTherapeuticCategoriesPage(p => Math.max(1, p - 1))}
                            disabled={therapeuticCategoriesPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{therapeuticCategoriesPage}</span> of {totalPages}
                        </div>
                        <button
                            onClick={() => setTherapeuticCategoriesPage(p => Math.min(totalPages, p + 1))}
                            disabled={therapeuticCategoriesPage === totalPages}
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

export default TherapeuticCategoriesTab;
