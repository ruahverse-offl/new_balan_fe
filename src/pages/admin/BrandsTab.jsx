import React from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight } from 'lucide-react';

const BrandsTab = ({
    brands,
    searchTerm,
    setSearchTerm,
    brandsPage,
    setBrandsPage,
    brandsRowsPerPage,
    setBrandsRowsPerPage,
    onAddClick,
    onEditClick,
    onDeleteClick,
    onToggleAvailability
}) => {
    const filteredBrands = (brands || []).filter(b =>
        b && (
            (b.brand_name && b.brand_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (b.manufacturer && b.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (b.medicine_name && b.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    );

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search brands..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setBrandsPage(1);
                        }}
                    />
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Brand
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Brand Name</th>
                                <th>Company</th>
                                <th>MRP</th>
                                <th>Available</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBrands
                                .slice((brandsPage - 1) * brandsRowsPerPage, brandsPage * brandsRowsPerPage)
                                .map(b => (
                                    <tr key={b.id}>
                                        <td data-label="Medicine">{b.medicine_name || '—'}</td>
                                        <td data-label="Brand Name">{b.brand_name}</td>
                                        <td data-label="Company">{b.manufacturer}</td>
                                        <td data-label="MRP">{b.mrp != null ? `₹${Number(b.mrp).toFixed(2)}` : '—'}</td>
                                        <td data-label="Available">
                                            {onToggleAvailability ? (
                                                <select
                                                    value={b.is_available !== false ? 'yes' : 'no'}
                                                    onChange={(e) => onToggleAvailability(b, e.target.value === 'yes')}
                                                    style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg)', color: 'var(--admin-text)', cursor: 'pointer', minWidth: '6rem' }}
                                                    title="Available for sale"
                                                >
                                                    <option value="yes">Available</option>
                                                    <option value="no">Not available</option>
                                                </select>
                                            ) : (
                                                <span className={`status-tag ${b.is_available !== false ? 'active' : 'inactive'}`}>{b.is_available !== false ? 'Yes' : 'No'}</span>
                                            )}
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => onEditClick(b)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick('brand', b.id, b.brand_name)}
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
                        value={brandsRowsPerPage}
                        onChange={(e) => {
                            setBrandsRowsPerPage(Number(e.target.value));
                            setBrandsPage(1);
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
                {Math.ceil(filteredBrands.length / brandsRowsPerPage) > 1 && (
                    <div className="pagination-bar">
                        <button
                            onClick={() => setBrandsPage(p => Math.max(1, p - 1))}
                            disabled={brandsPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{brandsPage}</span> of {Math.ceil(filteredBrands.length / brandsRowsPerPage)}
                        </div>
                        <button
                            onClick={() => setBrandsPage(p => Math.min(Math.ceil(filteredBrands.length / brandsRowsPerPage), p + 1))}
                            disabled={brandsPage === Math.ceil(filteredBrands.length / brandsRowsPerPage)}
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

export default BrandsTab;
