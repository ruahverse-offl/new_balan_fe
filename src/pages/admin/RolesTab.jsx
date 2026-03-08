import React, { useEffect, useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

const RolesTab = ({
    roles,
    searchTerm,
    setSearchTerm,
    onAddClick,
    onEditClick,
    onDeleteClick,
    onDataLoad
}) => {
    const filtered = (roles || []).filter(role =>
        role && (role.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Role
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Role Name</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(role => (
                                <tr key={role.id}>
                                    <td data-label="Role Name"><strong>{role.name}</strong></td>
                                    <td data-label="Description">{role.description || '—'}</td>
                                    <td data-label="Actions" className="actions">
                                        <button className="action-btn" onClick={() => onEditClick(role)} title="Edit">
                                            <Pencil size={16} />
                                        </button>
                                        <button className="action-btn delete" onClick={() => onDeleteClick('role', role.id, role.name)} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No roles found. Add a role to get started.
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

export default RolesTab;
