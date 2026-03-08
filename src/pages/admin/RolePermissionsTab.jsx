import React from 'react';
import { Search, Plus, Trash2, Shield } from 'lucide-react';

const RolePermissionsTab = ({
    roles,
    permissions,
    rolePermissions,
    searchTerm,
    setSearchTerm,
    onAssignClick,
    onRemoveClick,
    onBulkAssignClick,
    onDataLoad
}) => {
    const filtered = (rolePermissions || []).filter(rp => {
        if (!rp) return false;
        const role = (roles || []).find(r => r.id === rp.role_id);
        const perm = (permissions || []).find(p => p.id === rp.permission_id);
        const roleName = role ? role.name : '';
        const permCode = perm ? perm.code : '';
        return roleName.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
               permCode.toLowerCase().includes((searchTerm || '').toLowerCase());
    });

    // Group by role_id
    const byRole = (filtered || []).reduce((acc, rp) => {
        const rid = rp.role_id;
        if (!acc[rid]) acc[rid] = [];
        acc[rid].push(rp);
        return acc;
    }, {});

    const rolesWithAssignments = Object.keys(byRole)
        .map(id => (roles || []).find(r => r.id === id))
        .filter(Boolean)
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by role or permission..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-add" onClick={onAssignClick}>
                    <Plus size={18} /> Assign Permission
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
                {rolesWithAssignments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-muted)' }}>
                        No assignments found. Click "Assign Permission" to link a role to a permission.
                    </div>
                )}
                {rolesWithAssignments.length > 0 && rolesWithAssignments.map(role => {
                    const assignments = byRole[role.id] || [];
                    return (
                        <div
                            key={role.id}
                            style={{
                                border: '1px solid var(--admin-border)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                backgroundColor: 'var(--admin-bg)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    background: 'var(--admin-border)',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                }}
                            >
                                <Shield size={18} />
                                {role.name}
                                <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                                    ({assignments.length} permission{assignments.length !== 1 ? 's' : ''})
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    padding: '1rem',
                                }}
                            >
                                {assignments.map(rp => {
                                    const perm = (permissions || []).find(p => p.id === rp.permission_id);
                                    const label = perm ? perm.code : rp.permission_id;
                                    const desc = perm?.description;
                                    return (
                                        <span
                                            key={rp.id}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.35rem',
                                                padding: '0.35rem 0.6rem',
                                                borderRadius: '8px',
                                                backgroundColor: 'var(--admin-card-bg, rgba(0,0,0,0.03))',
                                                border: '1px solid var(--admin-border)',
                                                fontSize: '0.8rem',
                                            }}
                                        >
                                            <code style={{ fontFamily: 'monospace', fontWeight: 600 }}>{label}</code>
                                            {desc && (
                                                <span style={{ color: 'var(--admin-text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={desc}>
                                                    — {desc}
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                className="action-btn delete"
                                                onClick={() => onRemoveClick('role-permission', rp.id, `${role.name} - ${label}`)}
                                                title="Remove"
                                                style={{ marginLeft: '0.25rem', padding: '0.15rem' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RolePermissionsTab;
