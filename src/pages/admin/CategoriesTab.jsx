import React from 'react';
import { Search, Plus, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';

const CategoriesTab = ({
    categories,
    searchTerm,
    setSearchTerm,
    categoriesPage,
    setCategoriesPage,
    adminItemsPerPage,
    onAddClick,
    onDeleteClick,
    showNotify
}) => {
    const filtered = (categories || []).filter(cat =>
        cat && cat.toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCategoriesPage(1);
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
                                <th>#</th>
                                <th>Category Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered
                                .slice((categoriesPage - 1) * adminItemsPerPage, categoriesPage * adminItemsPerPage)
                                .map((cat, idx) => (
                                    <tr key={cat + idx}>
                                        <td data-label="#">{(categoriesPage - 1) * adminItemsPerPage + idx + 1}</td>
                                        <td data-label="Category Name">{cat}</td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick(cat)}
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No categories found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {Math.ceil(filtered.length / adminItemsPerPage) > 1 && (
                <div className="pagination-bar">
                    <button
                        onClick={() => setCategoriesPage(p => Math.max(1, p - 1))}
                        disabled={categoriesPage === 1}
                        className="page-nav-btn"
                    >
                        <ArrowLeft size={18} /> Prev
                    </button>
                    <div className="page-numbers">
                        Page <span>{categoriesPage}</span> of {Math.ceil(filtered.length / adminItemsPerPage)}
                    </div>
                    <button
                        onClick={() => setCategoriesPage(p => Math.min(Math.ceil(filtered.length / adminItemsPerPage), p + 1))}
                        disabled={categoriesPage === Math.ceil(filtered.length / adminItemsPerPage)}
                        className="page-nav-btn"
                    >
                        Next <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CategoriesTab;
