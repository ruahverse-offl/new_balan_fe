import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Pencil, Trash2, Loader2, Package, X, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMedicines, getAllMedicinesForSelect } from '../../services/medicinesApi';
import { updateOfferingStock } from '../../services/inventoryApi';
import { fetchAllBrandMasters, createBrandMaster, createBrand, updateBrand, deleteBrand } from '../../services/brandsApi';
import './AdminCatalogTabs.css';
import './MedicinesTab.css';
import './InventoryTab.css';

/**
 * Admin: medicine–brand offerings with on-hand stock (M_inventory).
 * Stock updates: PATCH /inventory/offering/{id}. Offering CRUD: /medicine-brands.
 */
const InventoryTab = ({ showNotify }) => {
    const { user } = useAuth();
    const role = (user?.backendRole || user?.role || '').toUpperCase();
    const isAdminRole = role === 'DEV_ADMIN' || role === 'ADMIN';
    const canUpdateStock =
        isAdminRole || (Array.isArray(user?.backendPermissions) && user.backendPermissions.includes('INVENTORY_UPDATE'));
    const canManageOfferings =
        isAdminRole ||
        (Array.isArray(user?.permissions) && user.permissions.includes('medicines'));

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
    const [brandFilter, setBrandFilter] = useState('');
    const [newBrandName, setNewBrandName] = useState('');
    const [creatingBrand, setCreatingBrand] = useState(false);
    const [addForm, setAddForm] = useState({
        medicine_id: '',
        brand_id: '',
        manufacturer: '',
        mrp: '',
        description: '',
        is_available: true,
    });

    const [editModal, setEditModal] = useState(null);
    const [editSubmitting, setEditSubmitting] = useState(false);

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    /** Read-only row details (medicine–brand offering). */
    const [viewOffering, setViewOffering] = useState(null);

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
    }, [loadList]);

    useEffect(() => {
        if (!viewOffering) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setViewOffering(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [viewOffering]);

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

    const filteredBrandOptions = useMemo(() => {
        const q = (brandFilter || '').trim().toLowerCase();
        let list = !q
            ? brandOptions
            : brandOptions.filter((b) => (b.name || '').toLowerCase().includes(q));
        const selectedId = addForm.brand_id;
        if (selectedId && !list.some((b) => String(b.id) === String(selectedId))) {
            const sel = brandOptions.find((b) => String(b.id) === String(selectedId));
            if (sel) list = [sel, ...list];
        }
        return list;
    }, [brandOptions, brandFilter, addForm.brand_id]);

    const openAddModal = async () => {
        setAddForm({
            medicine_id: '',
            brand_id: '',
            manufacturer: '',
            mrp: '',
            description: '',
            is_available: true,
        });
        setBrandFilter('');
        setNewBrandName('');
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

    const handleCreateBrandMaster = async () => {
        const name = newBrandName.trim();
        if (!name) {
            showNotify('Enter a brand name (e.g. Crocin, Calpol)', 'error');
            return;
        }
        setCreatingBrand(true);
        try {
            const created = await createBrandMaster({ name });
            setBrandOptions((prev) =>
                [...prev.filter((b) => b.id !== created.id), created].sort((a, b) =>
                    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
                ),
            );
            setAddForm((f) => ({ ...f, brand_id: created.id }));
            setNewBrandName('');
            showNotify(`Brand “${created.name}” added and selected`, 'success');
        } catch (err) {
            showNotify(err?.message || 'Could not create brand', 'error');
        } finally {
            setCreatingBrand(false);
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
        if (!addForm.medicine_id || !addForm.brand_id || !addForm.manufacturer?.trim()) {
            showNotify('Medicine, brand, and manufacturer are required', 'error');
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
                manufacturer: addForm.manufacturer.trim(),
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

    const handleEditOffering = async (e) => {
        e.preventDefault();
        if (!editModal?.id) return;
        const mrp = parseFloat(String(editModal.mrp).replace(',', '.'));
        if (Number.isNaN(mrp) || mrp < 0) {
            showNotify('Enter a valid MRP', 'error');
            return;
        }
        setEditSubmitting(true);
        try {
            await updateBrand(editModal.id, {
                manufacturer: editModal.manufacturer?.trim(),
                mrp,
                description: editModal.description?.trim() || null,
                is_available: editModal.is_available !== false,
            });
            showNotify('Offering updated', 'success');
            setEditModal(null);
            await loadList();
        } catch (err) {
            showNotify(err?.message || 'Update failed', 'error');
        } finally {
            setEditSubmitting(false);
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
                <h2 className="catalog-tab-title">Medicine catalogue · stock</h2>
                <p className="catalog-tab-subtitle">
                    Each row is one sellable <strong>offering</strong> (generic medicine + brand line) with MRP and on-hand
                    quantity. Search runs on the server by medicine name. Pagination is by medicine; a page can list multiple
                    offerings when a medicine has several brands.
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
                        {flatRows.length} offering{flatRows.length !== 1 ? 's' : ''} on this page
                        {medicineTotal != null ? ` · ${medicineTotal} medicine${medicineTotal !== 1 ? 's' : ''} total` : ''}
                    </span>
                )}
            </div>

            <p className="inventory-tab-hint">
                <Package size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} aria-hidden />
                Storefront and cart use the offering <code>id</code> as <code>medicine_brand_id</code>. Use{' '}
                <strong>View</strong> for read-only details. Stock changes apply after <strong>Save</strong>.
            </p>

            {loading && flatRows.length === 0 ? (
                <div className="catalog-loading" role="status" aria-live="polite">
                    <Loader2 size={36} aria-hidden />
                    <span>Loading catalogue…</span>
                </div>
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
                                        Avail.
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
                                            No offerings on this page. Add an offering or adjust search.
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
                                                                    <Loader2 size={16} className="spinning" />
                                                                ) : (
                                                                    'Save'
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{row.stock_quantity}</span>
                                                    )}
                                                </td>
                                                <td data-label="Available" className="inv-col-avail">
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
                                                        onClick={() => setViewOffering(row)}
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
                                                                    setEditModal({
                                                                        id: row.offeringId,
                                                                        medicineName: row.medicineName,
                                                                        brandName: row.brandName,
                                                                        manufacturer: row.manufacturer,
                                                                        mrp: String(row.mrp),
                                                                        description: row.description || '',
                                                                        is_available: row.is_available,
                                                                    })
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
                        Page {page} of {totalPages} · {pagination.total} medicine{pagination.total !== 1 ? 's' : ''}
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
                        <form onSubmit={handleCreateOffering} className="modal-form">
                            {dropdownsLoading && (
                                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                                    <Loader2 size={18} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                                    Loading medicines and brand catalog…
                                </p>
                            )}
                            <div className="form-group">
                                <label>Medicine*</label>
                                <select
                                    required
                                    disabled={dropdownsLoading}
                                    value={addForm.medicine_id}
                                    onChange={(e) => setAddForm((f) => ({ ...f, medicine_id: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                >
                                    <option value="">Select…</option>
                                    {medicineOptions.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {canManageOfferings && (
                                <div
                                    className="form-group"
                                    style={{
                                        padding: '0.85rem',
                                        borderRadius: '8px',
                                        border: '1px dashed var(--admin-border)',
                                        background: 'var(--admin-bg, #f8fafc)',
                                    }}
                                >
                                    <label style={{ fontWeight: 600 }}>New brand name (catalog)</label>
                                    <p style={{ margin: '0.25rem 0 0.65rem', fontSize: '0.82rem', color: 'var(--admin-text-muted)', lineHeight: 1.4 }}>
                                        The dropdown lists brands from the master catalog. If yours is missing, add the trade name here first (e.g. Crocin, Calpol).
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={newBrandName}
                                            onChange={(e) => setNewBrandName(e.target.value)}
                                            placeholder="e.g. Crocin"
                                            disabled={creatingBrand}
                                            style={{ flex: '1 1 12rem', minWidth: 0 }}
                                        />
                                        <button
                                            type="button"
                                            className="btn-add"
                                            style={{ whiteSpace: 'nowrap' }}
                                            disabled={creatingBrand || !newBrandName.trim()}
                                            onClick={handleCreateBrandMaster}
                                        >
                                            {creatingBrand ? 'Adding…' : 'Add to catalog'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Brand (master)*</label>
                                <input
                                    type="search"
                                    placeholder="Filter brands…"
                                    value={brandFilter}
                                    onChange={(e) => setBrandFilter(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)', marginBottom: '0.5rem' }}
                                />
                                <select
                                    required
                                    disabled={dropdownsLoading}
                                    value={addForm.brand_id}
                                    onChange={(e) => setAddForm((f) => ({ ...f, brand_id: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                >
                                    <option value="">
                                        {brandOptions.length === 0 && !dropdownsLoading
                                            ? 'No brands yet — use “New brand name” above'
                                            : filteredBrandOptions.length === 0
                                              ? 'No match — clear filter or add a brand'
                                              : 'Select…'}
                                    </option>
                                    {filteredBrandOptions.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--admin-text-muted)' }}>
                                    {brandOptions.length} brand{brandOptions.length !== 1 ? 's' : ''} in catalog
                                    {brandFilter.trim() ? ` · ${filteredBrandOptions.length} shown` : ''}
                                </small>
                                {!canManageOfferings && brandOptions.length === 0 && !dropdownsLoading && (
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', color: '#b45309' }}>
                                        Brand catalog is empty. Ask an administrator with medicine permissions to add brand names, or seed master data in the database.
                                    </p>
                                )}
                            </div>
                            <div className="form-group">
                                <label>Manufacturer*</label>
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

            {editModal && (
                <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="inv-edit-title">
                    <div className="admin-modal" style={{ maxWidth: '500px', maxHeight: 'min(88vh, 560px)' }}>
                        <div className="modal-header">
                            <h3 id="inv-edit-title">Edit offering</h3>
                            <button type="button" onClick={() => setEditModal(null)} style={{ color: 'var(--admin-text-muted)' }} aria-label="Close">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditOffering} className="modal-form">
                            <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                                {editModal.medicineName} — {editModal.brandName}
                            </p>
                            <div className="form-group">
                                <label>Manufacturer*</label>
                                <input
                                    required
                                    value={editModal.manufacturer}
                                    onChange={(e) => setEditModal((m) => ({ ...m, manufacturer: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>MRP (₹)*</label>
                                <input
                                    required
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={editModal.mrp}
                                    onChange={(e) => setEditModal((m) => ({ ...m, mrp: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    value={editModal.description}
                                    onChange={(e) => setEditModal((m) => ({ ...m, description: e.target.value }))}
                                />
                            </div>
                            <div className="form-group form-group-checkbox" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="checkbox"
                                    id="inv-edit-avail"
                                    checked={editModal.is_available}
                                    onChange={(e) => setEditModal((m) => ({ ...m, is_available: e.target.checked }))}
                                />
                                <label htmlFor="inv-edit-avail">Available for sale</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={() => setEditModal(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-add" style={{ flex: 2 }} disabled={editSubmitting}>
                                    {editSubmitting ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewOffering && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setViewOffering(null);
                    }}
                >
                    <div
                        className="admin-modal compact-modal"
                        style={{ maxWidth: '560px' }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="inv-view-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3 id="inv-view-title">Offering details</h3>
                            <button
                                type="button"
                                onClick={() => setViewOffering(null)}
                                style={{ color: 'var(--admin-text-muted)' }}
                                aria-label="Close"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Medicine</div>
                                <div style={{ fontWeight: 700 }}>{viewOffering.medicineName || '—'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Brand</div>
                                <div style={{ fontWeight: 600 }}>{viewOffering.brandName || '—'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Manufacturer</div>
                                <div style={{ fontWeight: 600 }}>{viewOffering.manufacturer || '—'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>MRP (₹)</div>
                                <div style={{ fontWeight: 600 }}>{formatOfferingMrp(viewOffering.mrp)}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Stock on hand</div>
                                <div style={{ fontWeight: 600 }}>{viewOffering.stock_quantity}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Available for sale</div>
                                <div style={{ fontWeight: 600 }}>{viewOffering.is_available ? 'Yes' : 'No'}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Description</div>
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--admin-border)',
                                        borderRadius: '10px',
                                        background: 'var(--admin-bg)',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {viewOffering.description?.trim() ? (
                                        viewOffering.description
                                    ) : (
                                        <span style={{ color: 'var(--admin-text-muted)' }}>No description</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Offering ID (medicine_brand_id)</div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                    {viewOffering.offeringId != null ? String(viewOffering.offeringId) : '—'}
                                </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Medicine ID</div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                    {viewOffering.medicineId != null ? String(viewOffering.medicineId) : '—'}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={() => setViewOffering(null)}>
                                Close
                            </button>
                        </div>
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
