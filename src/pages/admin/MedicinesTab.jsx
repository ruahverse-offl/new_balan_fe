import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Pill, Eye } from 'lucide-react';
import { PageLoading } from '../../components/common/PageLoading';
import {
    Toolbar,
    SearchInput,
    Btn,
    IconBtn,
    StatusBadge,
    EmptyState,
    TableFooter,
} from '../../components/admin/AdminUI';
import './MedicinesTab.css';

/**
 * Manage Medicines — catalog list with server search & pagination.
 * View / add / edit use full-page routes under /admin/medicines/…
 * No duplicate in-card title: the admin shell already names this section.
 */
const MedicinesTab = ({
    medicines = [],
    loading = false,
    pagination = null,
    page = 1,
    setPage,
    rowsPerPage = 10,
    setRowsPerPage,
    searchTerm = '',
    setSearchTerm,
    onAdd,
    onEdit,
    onDelete,
}) => {
    const navigate = useNavigate();

    const limit = pagination?.limit || rowsPerPage;
    const total = pagination?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages, setPage]);

    return (
        <div className="admin-table-card catalog-tab-card medicines-tab-card animate-slide-up">
            <Toolbar className="medicines-tab-toolbar">
                <SearchInput
                    value={searchTerm || ''}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                    }}
                    placeholder="Search by name or category…"
                />
                {!loading && total > 0 && (
                    <span className="catalog-tab-meta medicines-tab-toolbar-meta">
                        {total} product{total !== 1 ? 's' : ''}
                    </span>
                )}
                <Btn variant="primary" size="md" onClick={onAdd} className="medicines-tab-add-btn">
                    <Plus size={15} /> Add medicine
                </Btn>
            </Toolbar>

            <div className="table-wrapper medicines-tab-table-wrap">
                {loading && medicines.length === 0 ? (
                    <PageLoading
                        variant="compact"
                        className="medicines-loading-overlay"
                        message="Loading medicines…"
                    />
                ) : medicines.length === 0 ? (
                    <EmptyState
                        icon={Pill}
                        title="No medicines found"
                        description={
                            searchTerm?.trim()
                                ? 'Try another search or clear the box to see the full list.'
                                : 'Add your first medicine with the button above.'
                        }
                        action={
                            !searchTerm?.trim() ? (
                                <Btn variant="primary" size="sm" onClick={onAdd}>
                                    <Plus size={14} /> Add medicine
                                </Btn>
                            ) : null
                        }
                    />
                ) : (
                    <table className="admin-table medicines-table">
                        <thead>
                            <tr>
                                <th>Medicine</th>
                                <th>Category</th>
                                <th>Rx</th>
                                <th>Listed</th>
                                <th>Storefront (summary)</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicines.map((med) => (
                                <tr key={med.id}>
                                    <td data-label="Medicine" className="medicines-cell-name">
                                        <strong>{med.name || '—'}</strong>
                                    </td>
                                    <td data-label="Category">
                                        <span
                                            className="medicines-category-pill"
                                            title={med.medicine_category_name || ''}
                                        >
                                            {med.medicine_category_name || '—'}
                                        </span>
                                    </td>
                                    <td data-label="Rx">
                                        <span
                                            className={`medicines-rx-badge ${
                                                med.is_prescription_required
                                                    ? 'medicines-rx-badge--yes'
                                                    : 'medicines-rx-badge--no'
                                            }`}
                                        >
                                            {med.is_prescription_required ? 'Rx' : 'OTC'}
                                        </span>
                                    </td>
                                    <td data-label="Listed">
                                        <StatusBadge
                                            status={med.is_active !== false ? 'active' : 'inactive'}
                                        />
                                    </td>
                                    <td data-label="Storefront (summary)">
                                        <span
                                            className={`status-tag ${med.is_available !== false ? 'active' : 'inactive'}`}
                                            title="Per-brand controls are on View / Edit"
                                        >
                                            {med.is_available !== false ? 'Any line on' : 'None on'}
                                        </span>
                                    </td>
                                    <td data-label="Actions">
                                        <div className="actions medicines-tab-actions">
                                            <IconBtn
                                                title="View medicine details (read-only)"
                                                aria-label={`View details for ${med.name || 'medicine'}`}
                                                onClick={() => med.id && navigate(`/admin/medicines/${med.id}`)}
                                            >
                                                <Eye size={14} />
                                            </IconBtn>
                                            <IconBtn
                                                title="Edit medicine"
                                                aria-label={`Edit ${med.name || 'medicine'}`}
                                                onClick={() => onEdit(med)}
                                            >
                                                <Pencil size={14} />
                                            </IconBtn>
                                            <IconBtn
                                                variant="danger"
                                                title="Delete medicine"
                                                aria-label={`Delete ${med.name || 'medicine'}`}
                                                onClick={() => onDelete(med)}
                                            >
                                                <Trash2 size={14} />
                                            </IconBtn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination && total > 0 && (
                <TableFooter
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    rowsPerPage={limit}
                    onRowsChange={(n) => {
                        setRowsPerPage(n);
                        setPage(1);
                    }}
                    onPage={setPage}
                    label="medicines"
                    rowsOptions={[5, 10, 20, 50, 100]}
                />
            )}
        </div>
    );
};

export default MedicinesTab;
