import React, { useMemo, useEffect, useState } from 'react';
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    ArrowLeft,
    ChevronRight,
    Ticket,
    Filter,
    Percent,
    IndianRupee,
    Eye,
} from 'lucide-react';
import './AdminCatalogTabs.css';
import './CouponsTab.css';

const STATUS_FILTER_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

function formatExpiry(expiryDate) {
    if (!expiryDate) return { line: 'No expiry', sub: '' };
    try {
        const s = typeof expiryDate === 'string' ? expiryDate.slice(0, 10) : '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
            const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
            const label = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
            return { line: label, sub: s };
        }
        return { line: new Date(expiryDate).toLocaleDateString('en-IN'), sub: '' };
    } catch {
        return { line: String(expiryDate).slice(0, 10), sub: '' };
    }
}

function formatMinOrder(v) {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (Number.isNaN(n) || n <= 0) return '—';
    return `₹${n.toFixed(2)}`;
}

const CouponsTab = ({
    marqueeSettings = { show_marquee: true },
    onMarqueeEnable,
    onMarqueeDisable,
    coupons = [],
    searchTerm = '',
    setSearchTerm,
    onAddCoupon,
    onEditCoupon,
    onDeleteCoupon,
    onToggleCouponActive,
    onViewCouponDetails,
    onViewMarqueeDetails,
}) => {
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const marqueeLive = marqueeSettings?.show_marquee !== false;

    const filtered = useMemo(() => {
        const q = (searchTerm || '').trim().toLowerCase();
        return (coupons || []).filter((c) => {
            if (!c) return false;
            if (statusFilter === 'active' && !c.isActive) return false;
            if (statusFilter === 'inactive' && c.isActive) return false;
            if (!q) return true;
            return (c.code || '').toLowerCase().includes(q);
        });
    }, [coupons, searchTerm, statusFilter]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage) || 1);
    const effectivePage = Math.min(Math.max(1, page), totalPages);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, statusFilter]);

    const start = (effectivePage - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);
    const showingFrom = total === 0 ? 0 : start + 1;
    const showingTo = total === 0 ? 0 : Math.min(start + pageRows.length, total);

    const hasFilters = Boolean((searchTerm || '').trim()) || Boolean(statusFilter);
    const listLen = (coupons || []).length;

    return (
        <div className="coupons-tab-stack animate-slide-up">
            <div className="admin-table-card catalog-tab-card coupons-marquee-card">
                <div className="catalog-tab-header">
                    <h2 className="catalog-tab-title">Coupon marquee</h2>
                    <p className="catalog-tab-subtitle">
                        Toggles the scrolling promo bar on the public site. Hide it without deleting coupons.
                    </p>
                </div>
                <div className="coupons-marquee-row">
                    <div className="coupons-marquee-status" aria-live="polite">
                        <span
                            className={`coupons-marquee-status-dot ${marqueeLive ? 'on' : 'off'}`}
                            aria-hidden
                        />
                        <span>{marqueeLive ? 'Bar visible on website' : 'Bar hidden'}</span>
                    </div>
                    <div className="coupons-marquee-actions">
                        {typeof onViewMarqueeDetails === 'function' && (
                            <button
                                type="button"
                                className="action-btn"
                                title="View marquee details"
                                aria-label="View marquee details"
                                onClick={() => onViewMarqueeDetails()}
                            >
                                <Eye size={18} />
                            </button>
                        )}
                        <div className="status-toggle-group" role="group" aria-label="Marquee visibility">
                            <button
                                type="button"
                                className={`toggle-btn on ${marqueeLive ? 'active' : ''}`}
                                onClick={() => onMarqueeEnable?.()}
                            >
                                Visible
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn off ${!marqueeLive ? 'active' : ''}`}
                                onClick={() => onMarqueeDisable?.()}
                            >
                                Hidden
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="admin-table-card catalog-tab-card coupons-list-card">
                <div className="catalog-tab-header">
                    <h2 className="catalog-tab-title">Discount coupons</h2>
                    <p className="catalog-tab-subtitle">
                        Discount codes with optional expiry and rules. Search by code; filter by status; edit or remove in
                        the table.
                    </p>
                </div>

                <div className="catalog-tab-toolbar">
                    <div className="table-search">
                        <Search size={18} aria-hidden />
                        <input
                            type="search"
                            placeholder="Search by coupon code…"
                            value={searchTerm || ''}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Search coupons"
                        />
                    </div>
                    <div className="coupons-toolbar-filters">
                        <Filter size={16} aria-hidden style={{ color: 'var(--admin-text-muted)' }} />
                        <label htmlFor="coupons-status-filter" className="catalog-rows-label" style={{ margin: 0 }}>
                            Status
                            <select
                                id="coupons-status-filter"
                                className="catalog-rows-select"
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                {STATUS_FILTER_OPTIONS.map((o) => (
                                    <option key={o.value || 'all'} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <label className="catalog-rows-label">
                        Rows
                        <select
                            className="catalog-rows-select"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            {[5, 10, 20, 50].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="button" className="btn-add" onClick={onAddCoupon}>
                        <Plus size={18} /> Create coupon
                    </button>
                    {total > 0 && (
                        <span className="catalog-tab-meta">
                            {total} coupon{total !== 1 ? 's' : ''}
                            {hasFilters ? ' (filtered)' : ''}
                        </span>
                    )}
                </div>

                <div className="scrollable-section-wrapper">
                    <div className="table-wrapper">
                        {total === 0 ? (
                            <div className="catalog-empty">
                                <Ticket size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} aria-hidden />
                                <p className="catalog-empty-title">No coupons match</p>
                                <p>
                                    {listLen === 0 && !hasFilters
                                        ? 'Create a coupon to offer percentage discounts at checkout.'
                                        : 'Try another search or change the status filter.'}
                                </p>
                            </div>
                        ) : (
                            <table className="admin-table catalog-table coupons-table">
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Discount</th>
                                        <th>Expiry</th>
                                        <th>Min. order</th>
                                        <th>First order</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageRows.map((coupon) => {
                                        const exp = formatExpiry(coupon.expiryDate);
                                        return (
                                            <tr key={coupon.id}>
                                                <td data-label="Code">
                                                    <span className="coupons-code-pill" title={coupon.code}>
                                                        {coupon.code || '—'}
                                                    </span>
                                                </td>
                                                <td data-label="Discount">
                                                    <span className="coupons-discount-value">
                                                        <Percent
                                                            size={14}
                                                            style={{
                                                                display: 'inline',
                                                                verticalAlign: 'middle',
                                                                marginRight: 4,
                                                                opacity: 0.75,
                                                            }}
                                                            aria-hidden
                                                        />
                                                        {Number(coupon.discount) || 0}%
                                                    </span>
                                                </td>
                                                <td data-label="Expiry">
                                                    <span className="coupons-expiry-muted">{exp.line}</span>
                                                    {exp.sub ? (
                                                        <div
                                                            style={{
                                                                fontSize: '0.7rem',
                                                                color: 'var(--admin-text-muted)',
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {exp.sub}
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td data-label="Min. order">
                                                    <span className="coupons-min-order">
                                                        <IndianRupee
                                                            size={13}
                                                            style={{
                                                                display: 'inline',
                                                                verticalAlign: 'middle',
                                                                marginRight: 2,
                                                                opacity: 0.7,
                                                            }}
                                                            aria-hidden
                                                        />
                                                        {formatMinOrder(coupon.minOrderAmount)}
                                                    </span>
                                                </td>
                                                <td data-label="First order">
                                                    <span
                                                        className={`coupons-first-order-pill ${coupon.firstOrderOnly ? '' : 'no'}`}
                                                    >
                                                        {coupon.firstOrderOnly ? 'First order' : 'Any order'}
                                                    </span>
                                                </td>
                                                <td data-label="Status">
                                                    <button
                                                        type="button"
                                                        className="coupons-status-btn"
                                                        title={
                                                            coupon.isActive
                                                                ? 'Click to disable coupon'
                                                                : 'Click to enable coupon'
                                                        }
                                                        onClick={() => onToggleCouponActive?.(coupon)}
                                                    >
                                                        <span
                                                            className={`status-tag ${coupon.isActive ? 'active' : 'inactive'}`}
                                                        >
                                                            {coupon.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </button>
                                                </td>
                                                <td data-label="Actions" className="actions">
                                                    <div className="coupons-actions-split">
                                                        {typeof onViewCouponDetails === 'function' && (
                                                            <button
                                                                type="button"
                                                                className="action-btn"
                                                                title="View coupon details"
                                                                onClick={() => onViewCouponDetails(coupon)}
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="action-btn"
                                                            title="Edit coupon"
                                                            onClick={() => onEditCoupon?.(coupon)}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="action-btn delete"
                                                            title="Delete coupon"
                                                            onClick={() => onDeleteCoupon?.(coupon)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {total > 0 && (
                    <div className="catalog-tab-footer">
                        <span className="catalog-tab-meta">
                            Showing {showingFrom}–{showingTo} of {total}
                        </span>
                        {totalPages > 1 && (
                            <div className="pagination-bar">
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={effectivePage <= 1}
                                    className="page-nav-btn"
                                >
                                    <ArrowLeft size={18} /> Prev
                                </button>
                                <div className="page-numbers">
                                    Page <span>{effectivePage}</span> of {totalPages}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={effectivePage >= totalPages}
                                    className="page-nav-btn"
                                >
                                    Next <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponsTab;
