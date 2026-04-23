import React, { useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight, Stethoscope, Eye } from 'lucide-react';
import { formatTimeRangeTo24h } from '../../utils/timeFormatters';
import { hasModuleGrant } from '../../utils/permissionMapper';
import './AdminCatalogTabs.css';
import './DoctorsTab.css';

function doctorPermissions(menuItems = [], isAdminRole) {
    if (isAdminRole) {
        return { canCreate: true, canUpdate: true, canDelete: true };
    }
    return {
        canCreate: hasModuleGrant(menuItems, 'doctors', 'create'),
        canUpdate: hasModuleGrant(menuItems, 'doctors', 'update'),
        canDelete: hasModuleGrant(menuItems, 'doctors', 'delete'),
    };
}

const DoctorsTab = ({
    doctors = [],
    searchTerm,
    setSearchTerm,
    doctorsPage,
    setDoctorsPage,
    rowsPerPage,
    setRowsPerPage,
    onAdd,
    onEdit,
    onDelete,
    onViewDoctorDetails,
    menuItems = [],
    isAdminRole = false,
}) => {
    const { canCreate, canUpdate, canDelete } = doctorPermissions(menuItems, isAdminRole);
    const canViewDetails = typeof onViewDoctorDetails === 'function';
    const showActionsColumn = canViewDetails || canUpdate || canDelete;

    const filtered = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        const haystack = (d) =>
            [
                d.name,
                d.specialty,
                d.subSpecialty,
                d.qualification,
                d.bio,
                d.phone,
                d.email,
                d.morning,
                d.evening,
                d.id != null ? String(d.id) : '',
                Array.isArray(d.education) ? d.education.join(' ') : d.education,
                Array.isArray(d.specializations) ? d.specializations.join(' ') : d.specializations,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
        return (doctors || []).filter((d) => {
            if (!d) return false;
            if (!q) return true;
            return haystack(d).includes(q);
        });
    }, [doctors, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage) || 1);
    const page = Math.min(doctorsPage, totalPages);
    const start = (page - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);
    const showingFrom = filtered.length === 0 ? 0 : start + 1;
    const showingTo = Math.min(start + pageRows.length, filtered.length);

    return (
        <div className="admin-table-card catalog-tab-card doctors-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Doctors</h2>
                <p className="catalog-tab-subtitle">
                    Specialists on the site and for appointments. <strong>View</strong> opens a read-only profile; roles
                    control who can add, edit, or remove.
                </p>
            </div>

            <div className="catalog-tab-toolbar doctors-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search by name, specialty, qualifications…"
                        value={searchTerm || ''}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setDoctorsPage(1);
                        }}
                        aria-label="Search doctors"
                    />
                </div>
                <label className="catalog-rows-label doctors-rows-label">
                    Rows
                    <select
                        className="catalog-rows-select doctors-rows-select"
                        value={rowsPerPage}
                        onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setDoctorsPage(1);
                        }}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
                {canCreate && (
                    <button type="button" className="btn-add" onClick={onAdd}>
                        <Plus size={18} /> Add doctor
                    </button>
                )}
                <span className="catalog-tab-meta doctors-tab-meta">
                    {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    {filtered.length === 0 ? (
                        <div className="doctors-empty">
                            <Stethoscope size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} />
                            <p className="doctors-empty-title">No doctors found</p>
                            <p>
                                {searchTerm
                                    ? 'Try a different search term.'
                                    : canCreate
                                      ? 'Add your first doctor with the button above.'
                                      : 'No doctors match your access or search.'}
                            </p>
                        </div>
                    ) : (
                        <table className="admin-table doctors-table">
                            <thead>
                                <tr>
                                    <th>Doctor</th>
                                    <th>Qualifications</th>
                                    <th>Fee</th>
                                    <th>Hours</th>
                                    <th>Status</th>
                                    <th>Phone</th>
                                    {showActionsColumn && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((doc) => {
                                    const initial = (doc.name || '?').trim().charAt(0).toUpperCase();
                                    return (
                                        <tr key={doc.id}>
                                            <td data-label="Doctor" className="doctors-cell-name">
                                                <div className="doctors-name-row">
                                                    <div className="doctors-avatar doctors-avatar-fallback" aria-hidden>
                                                        {initial}
                                                    </div>
                                                    <div className="doctors-name-text">
                                                        <strong>{doc.name || '—'}</strong>
                                                        <span className="doctors-name-specialty">
                                                            {doc.specialty || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Qualifications">
                                                <span className="doctors-qual-preview" title={doc.qualification || ''}>
                                                    {doc.qualification || '—'}
                                                </span>
                                            </td>
                                            <td data-label="Fee">
                                                {doc.consultationFee != null && doc.consultationFee !== ''
                                                    ? `₹${Number(doc.consultationFee).toFixed(2)}`
                                                    : '—'}
                                            </td>
                                            <td data-label="Hours">
                                                <div>
                                                    {doc.morning ? (
                                                        <div className="doctors-slot-pill">
                                                            AM {formatTimeRangeTo24h(doc.morning)}
                                                        </div>
                                                    ) : null}
                                                    {doc.evening ? (
                                                        <div className="doctors-slot-pill">
                                                            PM {formatTimeRangeTo24h(doc.evening)}
                                                        </div>
                                                    ) : null}
                                                    {!doc.morning && !doc.evening ? '—' : null}
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <span
                                                    className={`status-tag ${doc.available !== false ? 'active' : 'inactive'}`}
                                                >
                                                    {doc.available !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td data-label="Phone">{doc.phone || '—'}</td>
                                            {showActionsColumn && (
                                                <td data-label="Actions" className="actions">
                                                    {canViewDetails && (
                                                        <button
                                                            type="button"
                                                            className="action-btn doctors-view-btn"
                                                            title="View full doctor profile (read-only)"
                                                            aria-label={`View details for ${doc.name || 'doctor'}`}
                                                            onClick={() => onViewDoctorDetails(doc)}
                                                        >
                                                            <Eye size={18} strokeWidth={2.25} aria-hidden />
                                                            <span className="doctors-view-btn-label">View</span>
                                                        </button>
                                                    )}
                                                    {canUpdate && (
                                                        <button
                                                            type="button"
                                                            className="action-btn"
                                                            title="Edit doctor"
                                                            onClick={() => onEdit(doc)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            className="action-btn delete"
                                                            title="Remove doctor"
                                                            onClick={() => onDelete(doc)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {filtered.length > 0 && (
                <div className="catalog-tab-footer doctors-tab-footer">
                    <span className="catalog-tab-meta doctors-tab-meta">
                        Showing {showingFrom}–{showingTo} of {filtered.length}
                    </span>
                    {totalPages > 1 && (
                        <div className="pagination-bar">
                            <button
                                type="button"
                                onClick={() => setDoctorsPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="page-nav-btn"
                            >
                                <ArrowLeft size={18} /> Prev
                            </button>
                            <div className="page-numbers">
                                Page <span>{page}</span> of {totalPages}
                            </div>
                            <button
                                type="button"
                                onClick={() => setDoctorsPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
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

export default DoctorsTab;
