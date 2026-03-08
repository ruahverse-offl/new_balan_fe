import React from 'react';
import { Search, Trash2, ArrowLeft, ChevronRight, Eye, Check, X } from 'lucide-react';

const PrescriptionsTab = ({
    prescriptions,
    searchTerm,
    setSearchTerm,
    prescriptionsPage,
    setPrescriptionsPage,
    prescriptionsRowsPerPage,
    setPrescriptionsRowsPerPage,
    statusFilter,
    setStatusFilter,
    onApprove,
    onReject,
    onViewFile,
    onDeleteClick
}) => {
    const filteredPrescriptions = (prescriptions || []).filter(p => {
        if (!p) return false;
        const matchesSearch = p.file_name && p.file_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleReject = (id) => {
        const reason = window.prompt('Please enter a reason for rejection:');
        if (reason) {
            onReject(id, reason);
        }
    };

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search prescriptions..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPrescriptionsPage(1);
                        }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPrescriptionsPage(1);
                    }}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--admin-border)',
                        backgroundColor: 'var(--admin-bg)',
                        color: 'var(--admin-text)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    <option value="All">All</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                </select>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Status</th>
                                <th>File Type</th>
                                <th>Uploaded At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPrescriptions
                                .slice((prescriptionsPage - 1) * prescriptionsRowsPerPage, prescriptionsPage * prescriptionsRowsPerPage)
                                .map(p => (
                                    <tr key={p.id}>
                                        <td data-label="File Name">{p.file_name}</td>
                                        <td data-label="Status">
                                            <span className={`status-tag ${
                                                p.status === 'APPROVED' ? 'active' :
                                                p.status === 'REJECTED' ? 'inactive' :
                                                'pending'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td data-label="File Type">{p.file_type}</td>
                                        <td data-label="Uploaded At">
                                            {p.uploaded_at ? new Date(p.uploaded_at).toLocaleDateString('en-IN', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : '—'}
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => onViewFile(p.id)}
                                                title="View File"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {p.status === 'PENDING' && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => onApprove(p.id)}
                                                    title="Approve"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            {p.status === 'PENDING' && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handleReject(p.id)}
                                                    title="Reject"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick('prescription', p.id, p.file_name)}
                                                title="Delete"
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
                        value={prescriptionsRowsPerPage}
                        onChange={(e) => {
                            setPrescriptionsRowsPerPage(Number(e.target.value));
                            setPrescriptionsPage(1);
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
                {Math.ceil(filteredPrescriptions.length / prescriptionsRowsPerPage) > 1 && (
                    <div className="pagination-bar">
                        <button
                            onClick={() => setPrescriptionsPage(p => Math.max(1, p - 1))}
                            disabled={prescriptionsPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{prescriptionsPage}</span> of {Math.ceil(filteredPrescriptions.length / prescriptionsRowsPerPage)}
                        </div>
                        <button
                            onClick={() => setPrescriptionsPage(p => Math.min(Math.ceil(filteredPrescriptions.length / prescriptionsRowsPerPage), p + 1))}
                            disabled={prescriptionsPage === Math.ceil(filteredPrescriptions.length / prescriptionsRowsPerPage)}
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

export default PrescriptionsTab;
