import React, { useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Stethoscope, Eye } from 'lucide-react';
import { formatTimeRangeTo24h } from '../../utils/timeFormatters';
import { hasModuleGrant } from '../../utils/permissionMapper';
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

/**
 * Staff list of doctors. No in-card page title — the admin header already says **Manage Doctors**.
 */
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
    loading = false,
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
    const page = Math.min(Math.max(1, doctorsPage), totalPages);
    const start = (page - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);

    useEffect(() => {
        if (doctorsPage > totalPages) {
            setDoctorsPage(totalPages);
        }
    }, [doctorsPage, totalPages, setDoctorsPage]);

    return (
        <div className="admin-table-card catalog-tab-card doctors-tab-card animate-slide-up">
            <Toolbar className="doctors-tab-toolbar">
                <SearchInput
                    value={searchTerm || ''}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setDoctorsPage(1);
                    }}
                    placeholder="Search by name, specialty, qualifications…"
                />
                <span className="catalog-tab-meta doctors-tab-toolbar-meta">
                    {filtered.length > 0
                        ? `${filtered.length} doctor${filtered.length !== 1 ? 's' : ''}`
                        : ''}
                </span>
                {loading && <InlineSpinner size={16} style={{ color: 'var(--admin-text-muted)' }} />}
                {canCreate && (
                    <Btn variant="primary" size="md" onClick={onAdd} className="doctors-tab-add-btn">
                        <Plus size={15} /> Add doctor
                    </Btn>
                )}
            </Toolbar>

            <div className="table-wrapper doctors-tab-table-wrap">
                {filtered.length === 0 ? (
                    <EmptyState
                        icon={Stethoscope}
                        title="No doctors found"
                        description={
                            searchTerm
                                ? 'Try a different search term.'
                                : canCreate
                                  ? 'Add your first doctor with the button above.'
                                  : 'No doctors match your access or search.'
                        }
                        action={
                            !searchTerm && canCreate ? (
                                <Btn variant="primary" size="sm" onClick={onAdd}>
                                    <Plus size={14} /> Add doctor
                                </Btn>
                            ) : null
                        }
                    />
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
                                {showActionsColumn && <th style={{ textAlign: 'right' }}>Actions</th>}
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
                                            <StatusBadge
                                                status={doc.available !== false ? 'active' : 'inactive'}
                                            />
                                        </td>
                                        <td data-label="Phone">{doc.phone || '—'}</td>
                                        {showActionsColumn && (
                                            <td data-label="Actions">
                                                <div className="actions doctors-tab-actions">
                                                    {canViewDetails && (
                                                        <IconBtn
                                                            title="View full profile (read-only)"
                                                            aria-label={`View details for ${doc.name || 'doctor'}`}
                                                            onClick={() => onViewDoctorDetails(doc)}
                                                        >
                                                            <Eye size={14} />
                                                        </IconBtn>
                                                    )}
                                                    {canUpdate && (
                                                        <IconBtn
                                                            title="Edit doctor"
                                                            aria-label={`Edit ${doc.name || 'doctor'}`}
                                                            onClick={() => onEdit(doc)}
                                                        >
                                                            <Pencil size={14} />
                                                        </IconBtn>
                                                    )}
                                                    {canDelete && (
                                                        <IconBtn
                                                            variant="danger"
                                                            title="Remove doctor"
                                                            aria-label={`Delete ${doc.name || 'doctor'}`}
                                                            onClick={() => onDelete(doc)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </IconBtn>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {filtered.length > 0 && (
                <TableFooter
                    page={page}
                    totalPages={totalPages}
                    total={filtered.length}
                    rowsPerPage={rowsPerPage}
                    onRowsChange={(n) => {
                        setRowsPerPage(n);
                        setDoctorsPage(1);
                    }}
                    onPage={setDoctorsPage}
                    label="doctors"
                    rowsOptions={[5, 10, 20, 50]}
                />
            )}
        </div>
    );
};

export default DoctorsTab;
