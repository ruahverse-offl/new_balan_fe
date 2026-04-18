import React, { useMemo, useEffect, useState } from 'react';
import {
    Search,
    ArrowLeft,
    ChevronRight,
    Ticket,
    Percent,
    Calendar,
    ExternalLink,
} from 'lucide-react';
import './AdminCatalogTabs.css';
import './CouponUsagesTab.css';

function usageCalendarDate(iso) {
    if (!iso) return '';
    return String(iso).slice(0, 10);
}

const CouponUsagesTab = ({
    couponUsages,
    searchTerm,
    setSearchTerm,
    couponUsagesPage,
    setCouponUsagesPage,
    couponUsagesRowsPerPage,
    setCouponUsagesRowsPerPage,
    onViewOrder,
}) => {
    const [dateFilter, setDateFilter] = useState('');
    const list = couponUsages || [];

    const filtered = useMemo(() => {
        const term = (searchTerm || '').toLowerCase().trim();
        return list.filter((u) => {
            if (!u) return false;
            const day = usageCalendarDate(u.created_at);
            if (dateFilter && day !== dateFilter) return false;
            if (!term) return true;
            return (
                (u.coupon_code || '').toLowerCase().includes(term) ||
                (u.order_customer_name || '').toLowerCase().includes(term) ||
                (u.order_customer_phone || '').includes(term) ||
                String(u.id || '').toLowerCase().includes(term) ||
                String(u.order_id || '').toLowerCase().includes(term) ||
                (u.order_reference != null && String(u.order_reference).toLowerCase().includes(term))
            );
        });
    }, [list, searchTerm, dateFilter]);

    const totalDiscountGiven = useMemo(
        () => filtered.reduce((sum, u) => sum + (parseFloat(u.discount_amount) || 0), 0),
        [filtered],
    );

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / couponUsagesRowsPerPage) || 1);
    const effectivePage = Math.min(Math.max(1, couponUsagesPage), totalPages);

    useEffect(() => {
        if (couponUsagesPage > totalPages) setCouponUsagesPage(totalPages);
    }, [couponUsagesPage, totalPages, setCouponUsagesPage]);

    const start = (effectivePage - 1) * couponUsagesRowsPerPage;
    const paginatedUsages = filtered.slice(start, start + couponUsagesRowsPerPage);
    const showingFrom = total === 0 ? 0 : start + 1;
    const showingTo = total === 0 ? 0 : Math.min(start + paginatedUsages.length, total);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '—';
        }
    };

    const formatCurrency = (val) => {
        const n = Number(val);
        return Number.isNaN(n) ? '—' : `₹${n.toFixed(2)}`;
    };

    const hasActiveFilters = Boolean((searchTerm || '').trim()) || Boolean(dateFilter);

    const openOrder = (orderId) => {
        if (onViewOrder && orderId) onViewOrder(orderId);
    };

    return (
        <div className="admin-table-card catalog-tab-card coupon-usages-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Coupon usages</h2>
                <p className="catalog-tab-subtitle">
                    Each coupon application at checkout: code, discount, customer, and order. Filter by usage date; search
                    code, customer, phone, or order. Open the order from a row when needed.
                </p>
            </div>

            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search code, customer, phone, order id…"
                        value={searchTerm || ''}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCouponUsagesPage(1);
                        }}
                        aria-label="Search coupon usages"
                    />
                </div>
                <div className="cu-toolbar-filters">
                    <div className="cu-date-filter-wrap">
                        <Calendar size={16} aria-hidden style={{ color: 'var(--admin-text-muted)' }} />
                        <label htmlFor="cu-admin-date-filter">Usage date</label>
                        <input
                            id="cu-admin-date-filter"
                            className="cu-date-input"
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setCouponUsagesPage(1);
                            }}
                        />
                        {dateFilter ? (
                            <button
                                type="button"
                                className="cu-clear-date"
                                onClick={() => {
                                    setDateFilter('');
                                    setCouponUsagesPage(1);
                                }}
                            >
                                Clear date
                            </button>
                        ) : null}
                    </div>
                </div>
                <label className="catalog-rows-label">
                    Rows
                    <select
                        className="catalog-rows-select"
                        value={couponUsagesRowsPerPage}
                        onChange={(e) => {
                            setCouponUsagesRowsPerPage(Number(e.target.value));
                            setCouponUsagesPage(1);
                        }}
                    >
                        {[5, 10, 20, 50].map((n) => (
                            <option key={n} value={n}>
                                {n}
                            </option>
                        ))}
                    </select>
                </label>
                {total > 0 && (
                    <span className="catalog-tab-meta">
                        {total} usage{total !== 1 ? 's' : ''}
                        {dateFilter ? ' (filtered)' : ''}
                    </span>
                )}
            </div>

            <div className="coupon-usages-stats">
                <div className="coupon-stat-card coupon-stat-total">
                    <div className="coupon-stat-icon">
                        <Ticket size={28} />
                    </div>
                    <div className="coupon-stat-content">
                        <span className="coupon-stat-label">In view</span>
                        <span className="coupon-stat-value">{filtered.length}</span>
                    </div>
                </div>
                <div className="coupon-stat-card coupon-stat-discount">
                    <div className="coupon-stat-icon">
                        <Percent size={28} />
                    </div>
                    <div className="coupon-stat-content">
                        <span className="coupon-stat-label">Discount in view</span>
                        <span className="coupon-stat-value">{formatCurrency(totalDiscountGiven)}</span>
                    </div>
                </div>
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    {total === 0 ? (
                        <div className="catalog-empty">
                            <Ticket size={40} style={{ opacity: 0.35, marginBottom: '0.75rem' }} aria-hidden />
                            <p className="catalog-empty-title">No usages match</p>
                            <p>
                                {list.length === 0 && !hasActiveFilters
                                    ? 'When customers apply coupons at checkout, they will appear here.'
                                    : 'Try another search or clear the date filter.'}
                            </p>
                        </div>
                    ) : (
                        <table className="admin-table coupon-usages-table catalog-table">
                            <thead>
                                <tr>
                                    <th>Used at</th>
                                    <th>Coupon</th>
                                    <th>Discount</th>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Order total</th>
                                    <th>Order</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsages.map((u) => {
                                    const clickable = Boolean(onViewOrder && u.order_id);
                                    return (
                                        <tr
                                            key={u.id}
                                            className={clickable ? 'coupon-usage-row-clickable' : ''}
                                            role={clickable ? 'button' : undefined}
                                            tabIndex={clickable ? 0 : undefined}
                                            onClick={() => clickable && openOrder(u.order_id)}
                                            onKeyDown={(e) => {
                                                if (!clickable) return;
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    openOrder(u.order_id);
                                                }
                                            }}
                                        >
                                            <td data-label="Used at">
                                                <span className="coupon-cell-date">
                                                    <Calendar size={14} aria-hidden />
                                                    {formatDateTime(u.created_at)}
                                                </span>
                                            </td>
                                            <td data-label="Coupon">
                                                <span className="coupon-code-badge">{u.coupon_code || '—'}</span>
                                            </td>
                                            <td data-label="Discount">
                                                <span className="coupon-discount">−{formatCurrency(u.discount_amount)}</span>
                                            </td>
                                            <td data-label="Customer">
                                                <span className="cu-customer-name">{u.order_customer_name || '—'}</span>
                                            </td>
                                            <td data-label="Phone">
                                                {u.order_customer_phone ? (
                                                    <a
                                                        href={`tel:${u.order_customer_phone}`}
                                                        className="coupon-phone-link cu-customer-phone"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {u.order_customer_phone}
                                                    </a>
                                                ) : (
                                                    <span className="cu-customer-phone" style={{ color: 'var(--admin-text-muted)' }}>
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td data-label="Order total">
                                                <span className="coupon-order-total">
                                                    {formatCurrency(u.order_final_amount)}
                                                </span>
                                            </td>
                                            <td data-label="Order" className="actions" onClick={(e) => e.stopPropagation()}>
                                                {u.order_id ? (
                                                    <button
                                                        type="button"
                                                        className="action-btn"
                                                        title="View order"
                                                        onClick={() => openOrder(u.order_id)}
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                ) : (
                                                    <span className="cu-customer-phone" style={{ color: 'var(--admin-text-muted)' }}>
                                                        —
                                                    </span>
                                                )}
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
                                onClick={() => setCouponUsagesPage((p) => Math.max(1, p - 1))}
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
                                onClick={() => setCouponUsagesPage((p) => Math.min(totalPages, p + 1))}
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
    );
};

export default CouponUsagesTab;
