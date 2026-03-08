import React from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

const PermissionsTab = ({
    permissions,
    searchTerm,
    setSearchTerm,
    onAddClick,
    onEditClick,
    onDeleteClick,
    onDataLoad
}) => {
    const filtered = (permissions || []).filter(perm =>
        perm && (perm.code || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search permissions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Permission
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Permission Code</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(perm => (
                                <tr key={perm.id}>
                                    <td data-label="Permission Code">
                                        <code style={{ fontFamily: 'monospace', fontWeight: 600 }}>{perm.code}</code>
                                    </td>
                                    <td data-label="Description">{perm.description || '—'}</td>
                                    <td data-label="Actions" className="actions">
                                        <button className="action-btn" onClick={() => onEditClick(perm)} title="Edit">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="action-btn delete" onClick={() => onDeleteClick('permission', perm.id, perm.code)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No permissions found. Add a permission to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PermissionsTab;
