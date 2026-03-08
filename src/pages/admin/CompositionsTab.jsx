import React from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';

const CompositionsTab = ({
    compositions,
    searchTerm,
    setSearchTerm,
    compositionsPage,
    setCompositionsPage,
    compositionsRowsPerPage,
    setCompositionsRowsPerPage,
    onAddClick,
    onEditClick,
    onDeleteClick
}) => {
    const filteredCompositions = (compositions || []).filter(c =>
        c && c.salt_name && c.salt_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search compositions..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCompositionsPage(1);
                        }}
                    />
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Composition
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Salt Name</th>
                                <th>Strength</th>
                                <th>Unit</th>
                                <th>Medicine ID</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCompositions
                                .slice((compositionsPage - 1) * compositionsRowsPerPage, compositionsPage * compositionsRowsPerPage)
                                .map(c => (
                                    <tr key={c.id}>
                                        <td data-label="Salt Name">{c.salt_name}</td>
                                        <td data-label="Strength">{c.strength}</td>
                                        <td data-label="Unit">{c.unit}</td>
                                        <td data-label="Medicine ID">{c.medicine_id ? c.medicine_id.substring(0, 8) : '—'}</td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => onEditClick(c)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick('composition', c.id, c.salt_name)}
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
                        value={compositionsRowsPerPage}
                        onChange={(e) => {
                            setCompositionsRowsPerPage(Number(e.target.value));
                            setCompositionsPage(1);
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
                {Math.ceil(filteredCompositions.length / compositionsRowsPerPage) > 1 && (
                    <div className="pagination-bar">
                        <button
                            onClick={() => setCompositionsPage(p => Math.max(1, p - 1))}
                            disabled={compositionsPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{compositionsPage}</span> of {Math.ceil(filteredCompositions.length / compositionsRowsPerPage)}
                        </div>
                        <button
                            onClick={() => setCompositionsPage(p => Math.min(Math.ceil(filteredCompositions.length / compositionsRowsPerPage), p + 1))}
                            disabled={compositionsPage === Math.ceil(filteredCompositions.length / compositionsRowsPerPage)}
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

export default CompositionsTab;
