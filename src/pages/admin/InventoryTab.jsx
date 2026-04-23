import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, Package, X, Eye } from 'lucide-react';
import { PageLoading, InlineSpinner } from '../../components/common/PageLoading';
import { useAuth } from '../../context/AuthContext';
import { hasModuleGrant } from '../../utils/permissionMapper';
import { getMedicines, getAllMedicinesForSelect } from '../../services/medicinesApi';
import { updateOfferingStock } from '../../services/inventoryApi';
import { fetchAllBrandMasters, createBrand, deleteBrand } from '../../services/brandsApi';
import './AdminCatalogTabs.css';
import './MedicinesTab.css';
import './InventoryTab.css';

/**
 * Admin: medicine–brand offerings with on-hand stock (M_inventory).
 * Stock updates: PATCH /inventory/offering/{id}. Offering CRUD: /medicine-brands.
 */
const InventoryTab = ({ showNotify, refreshToken = 0 }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = (user?.backendRole || user?.role || '').toUpperCase();
    const isAdminRole = role === 'DEV_ADMIN' || role === 'ADMIN';
    const mi = user?.menuItems || [];
    const canUpdateStock = isAdminRole || hasModuleGrant(mi, 'inventory', 'update');
    const canManageOfferings = isAdminRole || hasModuleGrant(mi, 'medicines', 'update');

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState(null);

    const [stockDraft, setStockDraft] = useState({});
    const [savingOfferingId, setSavingOfferingId] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [medicineOptions, setMedicineOptions] = useState([]);
    const [brandOptions, setBrandOptions] = useState([]);
    const [dropdownsLoading, setDropdownsLoading] = useState(false);
    const [addForm, setAddForm] = useState({
        medicine_id: '',
        brand_id: '',
        manufacturer: '',
        mrp: '',
        description: '',
        is_available: true,
    });

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, rowsPerPage]);

    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const offset = (page - 1) * rowsPerPage;
            const res = await getMedicines({
                limit: rowsPerPage,
                offset,
                search: debouncedSearch || undefined,
                sort_by: 'name',
                sort_order: 'asc',
                include_brands: true,
            });
            setItems(res.items || []);
            setPagination(res.pagination || null);
            setStockDraft({});
        } catch (e) {
            showNotify(e?.message || 'Failed to load medicines', 'error');
            setItems([]);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, debouncedSearch, showNotify]);

    useEffect(() => {
        loadList();
    }, [loadList, refreshToken]);

    const flatRows = useMemo(() => {
        const rows = [];
        for (const m of items) {
            const brands = m.brands || [];
            for (const b of brands) {
                rows.push({
                    offeringId: b.id,
                    medicineId: m.id,
                    medicineName: m.name || '—',
                    brandName: b.brand_name || '—',
                    manufacturer: b.manufacturer || '—',
                    mrp: b.mrp,
                    stock_quantity: typeof b.stock_quantity === 'number' ? b.stock_quantity : 0,
                    is_available: b.is_available !== false,
                    description: b.description || '',
                });
            }
        }
        return rows;
    }, [items]);

    const openAddModal = async () => {
        setAddForm({
            medicine_id: '',
            brand_id: '',
            manufacturer: '',
            mrp: '',
            description: '',
            is_available: true,
        });
        setShowAddModal(true);
        setDropdownsLoading(true);
        try {
            const meds = await getAllMedicinesForSelect();
            setMedicineOptions(meds || []);
        } catch (e) {
            showNotify(e?.message || 'Failed to load medicines', 'error');
            setMedicineOptions([]);
        }
        try {
            const brands = await fetchAllBrandMasters({ sort_by: 'name', sort_order: 'asc' });
            setBrandOptions(brands || []);
        } catch (e) {
            showNotify(e?.message || 'Failed to load brand catalog', 'error');
            setBrandOptions([]);
        } finally {
            setDropdownsLoading(false);
        }
    };

    const handleSaveStock = async (offeringId) => {
        const raw = stockDraft[offeringId];
        if (raw === undefined || raw === '') {
            showNotify('Enter a stock quantity', 'error');
            return;
        }
        const n = parseInt(String(raw).trim(), 10);
        if (Number.isNaN(n) || n < 0) {
            showNotify('Stock must be a non-negative integer', 'error');
            return;
        }
        setSavingOfferingId(offeringId);
        try {
            await updateOfferingStock(offeringId, n);
            showNotify('Stock updated', 'success');
            setStockDraft((prev) => {
                const next = { ...prev };
                delete next[offeringId];
                return next;
            });
            await loadList();
        } catch (e) {
            showNotify(e?.message || 'Failed to update stock', 'error');
        } finally {
            setSavingOfferingId(null);
        }
    };

    const handleCreateOffering = async (e) => {
        e.preventDefault();
        if (!addForm.medicine_id || !addForm.brand_id) {
            showNotify('Medicine and brand are required', 'error');
            return;
        }
        const mrp = parseFloat(String(addForm.mrp).replace(',', '.'));
        if (Number.isNaN(mrp) || mrp < 0) {
            showNotify('Enter a valid MRP', 'error');
            return;
        }
        setAddSubmitting(true);
        try {
            await createBrand({
                medicine_id: addForm.medicine_id,
                brand_id: addForm.brand_id,
                manufacturer: addForm.manufacturer?.trim() || undefined,
                mrp,
                description: addForm.description?.trim() || undefined,
                is_available: addForm.is_available !== false,
            });
            showNotify('Medicine–brand offering created', 'success');
            setShowAddModal(false);
            await loadList();
        } catch (err) {
            showNotify(err?.message || 'Create failed', 'error');
        } finally {
            setAddSubmitting(false);
        }
    };

    const handleDeleteOffering = async () => {
        if (!deleteConfirm?.id) return;
        try {
            await deleteBrand(deleteConfirm.id);
            showNotify('Offering removed', 'success');
            setDeleteConfirm(null);
            await loadList();
        } catch (err) {
            showNotify(err?.message || 'Delete failed', 'error');
        }
    };

    const totalPages =
        pagination?.total != null && rowsPerPage > 0
            ? Math.max(1, Math.ceil(pagination.total / rowsPerPage))
            : 1;

    const formatOfferingMrp = (v) => {
        const n = parseFloat(v);
        if (Number.isNaN(n)) return '—';
        return n.toFixed(2);
    };

    const medicineTotal = pagination?.total;

    return (
        <div className="admin-table-card catalog-tab-card inventory-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Inventory</h2>
                <p className="catalog-tab-subtitle">
                    On-hand stock and MRP per sellable line (medicine + brand). Search by medicine;{' '}
                    <strong>View</strong> / <strong>Edit</strong> open full pages. One row per brand line.
                </p>
            </div>

            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search by medicine name…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Search inventory by medicine name"
                    />
                </div>
                <label className="catalog-rows-label">
                    Rows
                    <select
                        className="catalog-rows-select"
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        aria-label="Medicines per page"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </label>
                {canManageOfferings && (
                    <button type="button" className="btn-add" onClick={openAddModal}>
                        <Plus size={18} /> Add offering
                    </button>
                )}
                {!loading && flatRows.length > 0 && (
                    <span className="catalog-tab-meta">
                        {flatRows.length} line{flatRows.length !== 1 ? 's' : ''} shown
                        {medicineTotal != null ? ` · ${medicineTotal} medicine${medicineTotal !== 1 ? 's' : ''} in catalog` : ''}
                    </span>
                )}
            </div>

            <p className="inventory-tab-hint">
                <Package size={16} className="inventory-tab-hint__icon" aria-hidden />
                Update the quantity and click <strong>Save</strong>. Use <strong>View</strong> for full line details.
            </p>

            {loading && flatRows.length === 0 ? (
                <PageLoading
                    variant="compact"
                    className="catalog-loading"
                    message="Loading inventory…"
                />
            ) : (
                <div className="scrollable-section-wrapper inventory-tab-scroll-wrap">
                    <div className="inventory-table-scroll">
                        <table className="admin-table catalog-table inventory-offerings-table">
                            <thead>
                                <tr>
                                    <th scope="col" className="inv-col-medicine">
                                        Medicine
                                    </th>
                                    <th scope="col" className="inv-col-brand">
                                        Brand
                                    </th>
                                    <th scope="col" className="inv-col-mfr">
                                        Manufacturer
                                    </th>
                                    <th scope="col" className="inv-col-mrp">
                                        MRP (₹)
                                    </th>
                                    <th scope="col" className="inv-col-stock">
                                        Stock
                                    </th>
                                    <th scope="col" className="inv-col-avail">
                                        For sale
                                    </th>
                                    <th scope="col" className="inv-col-actions">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {flatRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="table-empty-cell">
                                            No lines on this page. Try another search or add an offering.
                                        </td>
                                    </tr>
                                ) : (
                                    flatRows.map((row) => {
                                        const oid = String(row.offeringId);
                                        const draft =
                                            stockDraft[oid] !== undefined
                                                ? stockDraft[oid]
                                                : String(row.stock_quantity);
                                        return (
                                            <tr key={oid}>
                                                <td data-label="Medicine" className="inv-col-medicine">
                                                    <span className="inventory-medicine-cell">{row.medicineName}</span>
                                                </td>
                                                <td data-label="Brand" className="inv-col-brand">
                                                    <span className="catalog-brand-pill" title={row.brandName || ''}>
                                                        {row.brandName}
                                                    </span>
                                                </td>
                                                <td data-label="Manufacturer" className="inv-col-mfr">
                                                    <span style={{ wordBreak: 'break-word' }}>{row.manufacturer}</span>
                                                </td>
                                                <td data-label="MRP" className="inv-col-mrp">
                                                    {formatOfferingMrp(row.mrp)}
                                                </td>
                                                <td data-label="Stock" className="inv-col-stock">
                                                    {canUpdateStock ? (
                                                        <div className="inv-stock-row">
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                step={1}
                                                                className="inv-stock-input"
                                                                value={draft}
                                                                onChange={(e) =>
                                                                    setStockDraft((prev) => ({ ...prev, [oid]: e.target.value }))
                                                                }
                                                                aria-label={`Stock for ${row.medicineName}`}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="action-btn"
                                                                title="Save stock"
                                                                disabled={savingOfferingId === oid}
                                                                onClick={() => handleSaveStock(row.offeringId)}
                                                            >
                                                                {savingOfferingId === oid ? (
                                                                    <InlineSpinner size={16} />
                                                                ) : (
                                                                    'Save'
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.stock_quantity}</span>
                                                    )}
                                                </td>
                                                <td data-label="For sale" className="inv-col-avail">
                                                    <span className={`status-tag ${row.is_available ? 'active' : 'inactive'}`}>
                                                        {row.is_available ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td data-label="Actions" className="actions inv-col-actions">
                                                    <button
                                                        type="button"
                                                        className="action-btn medicines-view-btn inventory-view-btn--eye"
                                                        title="View offering details (read-only)"
                                                        aria-label={`View details for ${row.medicineName} (${row.brandName})`}
                                                        onClick={() =>
                                                            navigate(
                                                                `/admin/inventory-offerings/${row.medicineId}/${row.offeringId}`,
                                                            )
                                                        }
                                                    >
                                                        <Eye size={18} strokeWidth={2.25} aria-hidden />
                                                        <span className="medicines-view-btn-label">View</span>
                                                    </button>
                                                    {canManageOfferings && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="action-btn"
                                                                title="Edit offering"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/admin/inventory-offerings/${row.medicineId}/${row.offeringId}/edit`,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="action-btn delete"
                                                                title="Remove offering"
                                                                onClick={() =>
                                                                    setDeleteConfirm({
                                                                        id: row.offeringId,
                                                                        label: `${row.medicineName} (${row.brandName})`,
                                                                    })
                                                                }
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {pagination?.total != null && (
                <div className="catalog-tab-footer">
                    <span className="catalog-tab-meta">
                        Page {page} of {totalPages} ({pagination.total} medicine{pagination.total !== 1 ? 's' : ''})
                    </span>
                    <div className="pagination-bar">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="page-nav-btn"
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={loading || !pagination.has_next}
                            className="page-nav-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {showAddModal && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="inv-add-title">
                    <div className="admin-modal" style={{ maxWidth: '500px', maxHeight: 'min(88vh, 560px)' }}>
                        <div className="modal-header">
                            <h3 id="inv-add-title">Add medicine–brand offering</h3>
                            <button type="button" onClick={() => setShowAddModal(false)} style={{ color: 'var(--admin-text-muted)' }} aria-label="Close">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOffering} className="modal-form inventory-add-offering-form">
                            {dropdownsLoading && (
                                <p className="inventory-add-dropdowns-loading">
                                    <InlineSpinner size={18} />
                                    Loading lists…
                                </p>
                            )}
                            <div className="inventory-add-selects">
                                <div className="form-group">
                                    <label htmlFor="inv-add-medicine">Medicine</label>
                                    <select
                                        id="inv-add-medicine"
                                        required
                                        disabled={dropdownsLoading}
                                        value={addForm.medicine_id}
                                        onChange={(e) => setAddForm((f) => ({ ...f, medicine_id: e.target.value }))}
                                        className="inventory-add-select"
                                    >
                                        <option value="">Select medicine…</option>
                                        {medicineOptions.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="inv-add-brand">Brand</label>
                                    <select
                                        id="inv-add-brand"
                                        required
                                        disabled={dropdownsLoading}
                                        value={addForm.brand_id}
                                        onChange={(e) => setAddForm((f) => ({ ...f, brand_id: e.target.value }))}
                                        className="inventory-add-select"
                                    >
                                        <option value="">
                                            {brandOptions.length === 0 && !dropdownsLoading ? 'No brands in catalog' : 'Select brand…'}
                                        </option>
                                        {brandOptions.map((b) => (
                                            <option key={b.id} value={b.id}>
                                                {b.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {brandOptions.length === 0 && !dropdownsLoading && (
                                <p className="inventory-add-catalog-hint">
                                    Add brands under the Brand master tab first if the list is empty.
                                </p>
                            )}
                            <div className="form-group">
                                <label>Manufacturer (optional)</label>
                                <input
                                    required
                                    value={addForm.manufacturer}
                                    onChange={(e) => setAddForm((f) => ({ ...f, manufacturer: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>MRP (₹)*</label>
                                <input
                                    required
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={addForm.mrp}
                                    onChange={(e) => setAddForm((f) => ({ ...f, mrp: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (optional)</label>
                                <input
                                    value={addForm.description}
                                    onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                                />
                            </div>
                            <div className="form-group form-group-checkbox" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="inv-add-avail"
                                    checked={addForm.is_available}
                                    onChange={(e) => setAddForm((f) => ({ ...f, is_available: e.target.checked }))}
                                />
                                <label htmlFor="inv-add-avail">Available for sale</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-add" style={{ flex: 2 }} disabled={addSubmitting}>
                                    {addSubmitting ? 'Saving…' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="inv-del-title">
                    <div className="admin-modal" style={{ maxWidth: '420px' }}>
                        <div className="modal-header">
                            <h3 id="inv-del-title">Remove offering?</h3>
                            <button type="button" onClick={() => setDeleteConfirm(null)} style={{ color: 'var(--admin-text-muted)' }} aria-label="Close">
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ margin: '0 0 0.75rem' }}>{deleteConfirm.label}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
                            This soft-deletes the medicine–brand link. Historical orders may still reference it.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button type="button" className="btn-add btn-danger" style={{ flex: 1 }} onClick={handleDeleteOffering}>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTab;
