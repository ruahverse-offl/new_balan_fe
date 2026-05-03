import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, Package, TrendingDown, AlertTriangle,
    Minus, Plus as PlusIcon, X,
} from 'lucide-react';
import { PageLoading, InlineSpinner } from '../../components/common/PageLoading';
import { useAuth } from '../../context/AuthContext';
import { hasModuleGrant } from '../../utils/permissionMapper';
import { getMedicines } from '../../services/medicinesApi';
import { updateOfferingStock } from '../../services/inventoryApi';
import './AdminCatalogTabs.css';
import './InventoryTab.css';

const LOW_STOCK_THRESHOLD = 10;

function stockStatus(qty) {
    if (qty === 0) return 'out';
    if (qty <= LOW_STOCK_THRESHOLD) return 'low';
    return 'ok';
}

const InventoryTab = ({ showNotify, refreshToken = 0 }) => {
    const { user } = useAuth();
    const role = (user?.backendRole || user?.role || '').toUpperCase();
    const isAdminRole = role === 'DEV_ADMIN' || role === 'ADMIN';
    const canUpdateStock = isAdminRole || hasModuleGrant(user?.menuItems || [], 'inventory', 'update');

    const [search, setSearch]               = useState('');
    const [debouncedSearch, setDebounced]   = useState('');
    const [filter, setFilter]               = useState('all');
    const [page, setPage]                   = useState(1);
    const [loading, setLoading]             = useState(false);
    const [items, setItems]                 = useState([]);
    const [pagination, setPagination]       = useState(null);
    const rowsPerPage                       = 50;

    const [editingOffering, setEditingOffering] = useState(null);
    const [editStock, setEditStock]             = useState('');
    const [saving, setSaving]                   = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const loadList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMedicines({
                limit: rowsPerPage,
                offset: (page - 1) * rowsPerPage,
                search: debouncedSearch || undefined,
                sort_by: 'name',
                sort_order: 'asc',
                include_brands: true,
            });
            setItems(res.items || []);
            setPagination(res.pagination || null);
        } catch (e) {
            showNotify(e?.message || 'Failed to load inventory', 'error');
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, showNotify]);

    useEffect(() => { loadList(); }, [loadList, refreshToken]);

    const flatRows = useMemo(() => {
        const rows = [];
        for (const m of items) {
            for (const b of (m.brands || [])) {
                rows.push({
                    offeringId:   b.id,
                    medicineName: m.name || '—',
                    brandName:    b.brand_name || '—',
                    mrp:          b.mrp,
                    stock:        typeof b.stock_quantity === 'number' ? b.stock_quantity : 0,
                    isAvailable:  b.is_available !== false,
                });
            }
        }
        return rows;
    }, [items]);

    const stats = useMemo(() => ({
        total: flatRows.length,
        out:   flatRows.filter(r => r.stock === 0).length,
        low:   flatRows.filter(r => r.stock > 0 && r.stock <= LOW_STOCK_THRESHOLD).length,
    }), [flatRows]);

    const filteredRows = useMemo(() => {
        if (filter === 'out') return flatRows.filter(r => r.stock === 0);
        if (filter === 'low') return flatRows.filter(r => r.stock > 0 && r.stock <= LOW_STOCK_THRESHOLD);
        return flatRows;
    }, [flatRows, filter]);

    const openEdit = (row) => {
        setEditingOffering(row);
        setEditStock(String(row.stock));
    };

    const closeEdit = () => { if (!saving) setEditingOffering(null); };

    const adjustQty = (delta) =>
        setEditStock(s => String(Math.max(0, (parseInt(s, 10) || 0) + delta)));

    const handleSaveStock = async () => {
        const n = parseInt(String(editStock).trim(), 10);
        if (Number.isNaN(n) || n < 0) {
            showNotify('Enter a valid stock count (0 or more)', 'error');
            return;
        }
        setSaving(true);
        try {
            await updateOfferingStock(editingOffering.offeringId, n);
            showNotify('Stock updated', 'success');
            setEditingOffering(null);
            await loadList();
        } catch (e) {
            showNotify(e?.message || 'Failed to update stock', 'error');
        } finally {
            setSaving(false);
        }
    };

    const totalPages =
        pagination?.total != null ? Math.max(1, Math.ceil(pagination.total / rowsPerPage)) : 1;

    const FILTER_LABELS = { all: 'All', low: 'Low stock', out: 'Out of stock' };

    return (
        <div className="inv2-root animate-slide-up">

            {/* ── Stats strip ── */}
            <div className="inv2-stats">
                {[
                    { key: 'all',  icon: <Package size={18} />,       cls: 'total', val: stats.total, label: 'Total SKUs' },
                    { key: 'out',  icon: <AlertTriangle size={18} />, cls: 'out',   val: stats.out,   label: 'Out of stock' },
                    { key: 'low',  icon: <TrendingDown size={18} />,  cls: 'low',   val: stats.low,   label: `Low (≤${LOW_STOCK_THRESHOLD})` },
                ].map(({ key, icon, cls, val, label }) => (
                    <div
                        key={cls}
                        className={`inv2-stat inv2-stat--${cls}${key && filter === key ? ' inv2-stat--active' : ''}`}
                        role={key ? 'button' : undefined}
                        tabIndex={key ? 0 : undefined}
                        onClick={key ? () => setFilter(key) : undefined}
                        onKeyDown={key ? (e) => e.key === 'Enter' && setFilter(key) : undefined}
                    >
                        <span className="inv2-stat__icon">{icon}</span>
                        <div>
                            <p className="inv2-stat__val">{val}</p>
                            <p className="inv2-stat__label">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="inv2-toolbar">
                <div className="table-search inv2-search">
                    <Search size={17} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search medicine or brand…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        aria-label="Search inventory"
                    />
                </div>
                <div className="inv2-filter-pills">
                    {Object.entries(FILTER_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={`inv2-filter-pill${filter === key ? ' inv2-filter-pill--active' : ''}`}
                            onClick={() => setFilter(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {!loading && (
                    <span className="inv2-count-meta">
                        {filteredRows.length} item{filteredRows.length !== 1 ? 's' : ''}
                        {filter !== 'all' ? ` · ${FILTER_LABELS[filter].toLowerCase()}` : ''}
                    </span>
                )}
            </div>

            {/* ── Content ── */}
            {loading && items.length === 0 ? (
                <PageLoading variant="compact" className="catalog-loading" message="Loading inventory…" />
            ) : filteredRows.length === 0 ? (
                <div className="inv2-empty">
                    <Package size={44} className="inv2-empty__icon" aria-hidden />
                    <p>
                        {search
                            ? 'No matches for your search.'
                            : filter !== 'all'
                                ? `No items are ${filter === 'out' ? 'out of stock' : 'low on stock'}.`
                                : 'No inventory lines on this page. Add brand lines to a medicine under Medicines — they will show up here.'}
                    </p>
                    {filter !== 'all' ? (
                        <button type="button" className="inv2-empty__reset" onClick={() => setFilter('all')}>
                            Show all
                        </button>
                    ) : null}
                </div>
            ) : (
                <div className="inv2-grid">
                    {filteredRows.map(row => {
                        const st = stockStatus(row.stock);
                        return (
                            <div key={row.offeringId} className={`inv2-card inv2-card--${st}`}>
                                <div className="inv2-card__top">
                                    <span className="inv2-card__brand" title={row.brandName}>
                                        {row.brandName}
                                    </span>
                                    {!row.isAvailable && (
                                        <span className="inv2-card__unavail">Off sale</span>
                                    )}
                                </div>

                                <p className="inv2-card__name">{row.medicineName}</p>
                                <p className="inv2-card__mrp">
                                    MRP ₹{parseFloat(row.mrp || 0).toFixed(2)}
                                </p>

                                <div className="inv2-card__footer">
                                    <div className={`inv2-stock-badge inv2-stock-badge--${st}`}>
                                        <span className="inv2-stock-badge__num">{row.stock}</span>
                                        <span className="inv2-stock-badge__label">
                                            {st === 'out' ? 'Out of stock' : st === 'low' ? 'Low' : 'In stock'}
                                        </span>
                                    </div>
                                    {canUpdateStock && (
                                        <button
                                            type="button"
                                            className="inv2-update-btn"
                                            onClick={() => openEdit(row)}
                                        >
                                            Update
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Pagination ── */}
            {pagination?.total != null && totalPages > 1 && (
                <div className="catalog-tab-footer inv2-pagination">
                    <span className="catalog-tab-meta">
                        Page {page} of {totalPages}
                    </span>
                    <div className="pagination-bar">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="page-nav-btn"
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage(p => p + 1)}
                            disabled={loading || !pagination.has_next}
                            className="page-nav-btn"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* ── Update stock modal ── */}
            {editingOffering && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
                >
                    <div
                        className="admin-modal compact-modal inv2-update-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="inv2-modal-title"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header inv2-update-modal__header">
                            <div className="inv2-update-modal__titles">
                                <span className="inv2-modal-brand">{editingOffering.brandName}</span>
                                <h3 id="inv2-modal-title" className="inv2-modal-name">
                                    {editingOffering.medicineName}
                                </h3>
                            </div>
                            <button type="button" className="modal-close" onClick={closeEdit} aria-label="Close dialog">
                                <X size={18} aria-hidden />
                            </button>
                        </div>

                        <div className="modal-form inv2-update-modal__body">
                        <p className="inv2-modal-hint">Set the current on-hand stock count.</p>

                        <div className="inv2-modal-qty-row">
                            <button
                                type="button"
                                className="inv2-qty-btn"
                                aria-label="Decrease by 1"
                                disabled={saving || (parseInt(editStock, 10) || 0) <= 0}
                                onClick={() => adjustQty(-1)}
                            >
                                <Minus size={18} />
                            </button>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                className="inv2-qty-input"
                                value={editStock}
                                onChange={e => setEditStock(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveStock()}
                                autoFocus
                                aria-label="Stock quantity"
                            />
                            <button
                                type="button"
                                className="inv2-qty-btn"
                                aria-label="Increase by 1"
                                disabled={saving}
                                onClick={() => adjustQty(1)}
                            >
                                <PlusIcon size={18} />
                            </button>
                        </div>

                        <div className="modal-actions inv2-modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={closeEdit}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-add"
                                onClick={handleSaveStock}
                                disabled={saving}
                            >
                                {saving
                                    ? <><InlineSpinner size={14} /> Saving…</>
                                    : 'Save stock'}
                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTab;
