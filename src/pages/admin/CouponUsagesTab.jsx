import React from 'react';
import { Search, ArrowLeft, ChevronRight, Ticket, Percent, Calendar, User, Phone, ShoppingBag } from 'lucide-react';

const CouponUsagesTab = ({
    couponUsages,
    searchTerm,
    setSearchTerm,
    couponUsagesPage,
    setCouponUsagesPage,
    couponUsagesRowsPerPage,
    setCouponUsagesRowsPerPage,
    onViewOrder
}) => {
    const list = couponUsages || [];
    const filteredUsages = list.filter(u => {
        if (!u) return false;
        const term = (searchTerm || '').toLowerCase().trim();
        if (!term) return true;
        return (
            (u.coupon_code || '').toLowerCase().includes(term) ||
            (u.order_customer_name || '').toLowerCase().includes(term) ||
            (u.order_customer_phone || '').includes(term) ||
            (u.id || '').toLowerCase().includes(term) ||
            (u.order_id || '').toLowerCase().includes(term)
        );
    });

    const totalPages = Math.max(1, Math.ceil(filteredUsages.length / couponUsagesRowsPerPage));
    const paginatedUsages = filteredUsages.slice(
        (couponUsagesPage - 1) * couponUsagesRowsPerPage,
        couponUsagesPage * couponUsagesRowsPerPage
    );

    const totalDiscountGiven = filteredUsages.reduce((sum, u) => sum + (parseFloat(u.discount_amount) || 0), 0);

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatCurrency = (val) => {
        const n = Number(val);
        return isNaN(n) ? '—' : `₹${n.toFixed(2)}`;
    };

    return (
        <div className="coupon-usages-section animate-slide-up">
            <div className="coupon-usages-header">
                <div className="coupon-usages-search">
                    <Search size={20} strokeWidth={2} />
                    <input
                        type="text"
                        placeholder="Search by coupon code, customer name, phone, or ID..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCouponUsagesPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="coupon-usages-stats">
                <div className="coupon-stat-card coupon-stat-total">
                    <div className="coupon-stat-icon">
                        <Ticket size={28} />
                    </div>
                    <div className="coupon-stat-content">
                        <span className="coupon-stat-label">Total usages</span>
                        <span className="coupon-stat-value">{filteredUsages.length}</span>
                    </div>
                </div>
                <div className="coupon-stat-card coupon-stat-discount">
                    <div className="coupon-stat-icon">
                        <Percent size={28} />
                    </div>
                    <div className="coupon-stat-content">
                        <span className="coupon-stat-label">Total discount given</span>
                        <span className="coupon-stat-value">{formatCurrency(totalDiscountGiven)}</span>
                    </div>
                </div>
            </div>

            <div className="coupon-usages-table-wrap">
                <table className="coupon-usages-table">
                    <thead>
                        <tr>
                            <th><Calendar size={16} /> Used at</th>
                            <th>Coupon code</th>
                            <th>Discount</th>
                            <th><User size={16} /> Customer</th>
                            <th><Phone size={16} /> Phone</th>
                            <th><ShoppingBag size={16} /> Order total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsages.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="coupon-usages-empty">
                                        <Ticket size={48} strokeWidth={1.5} />
                                        <p>{list.length === 0 ? 'No coupon usages yet.' : 'No matches for your search.'}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedUsages.map(u => (
                                <tr
                                    key={u.id}
                                    className={onViewOrder && u.order_id ? 'coupon-usage-row-clickable' : ''}
                                    role={onViewOrder && u.order_id ? 'button' : undefined}
                                    tabIndex={onViewOrder && u.order_id ? 0 : undefined}
                                    onClick={() => onViewOrder && u.order_id && onViewOrder(u.order_id)}
                                    onKeyDown={(e) => onViewOrder && u.order_id && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onViewOrder(u.order_id))}
                                >
                                    <td data-label="Used at">
                                        <span className="coupon-cell-date">
                                            <Calendar size={14} />
                                            {formatDate(u.created_at)}
                                        </span>
                                    </td>
                                    <td data-label="Coupon code">
                                        <span className="coupon-code-badge">{u.coupon_code || '—'}</span>
                                    </td>
                                    <td data-label="Discount">
                                        <span className="coupon-discount">−{formatCurrency(u.discount_amount)}</span>
                                    </td>
                                    <td data-label="Customer">{u.order_customer_name || '—'}</td>
                                    <td data-label="Phone">
                                        <a href={`tel:${u.order_customer_phone || ''}`} className="coupon-phone-link" onClick={(e) => e.stopPropagation()}>
                                            {u.order_customer_phone || '—'}
                                        </a>
                                    </td>
                                    <td data-label="Order total">
                                        <span className="coupon-order-total">{formatCurrency(u.order_final_amount)}</span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="coupon-usages-footer">
                <label className="coupon-rows-label">
                    Rows per page:
                    <select
                        value={couponUsagesRowsPerPage}
                        onChange={(e) => {
                            setCouponUsagesRowsPerPage(Number(e.target.value));
                            setCouponUsagesPage(1);
                        }}
                        className="coupon-rows-select"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                {totalPages > 1 && (
                    <div className="coupon-pagination">
                        <button
                            onClick={() => setCouponUsagesPage(p => Math.max(1, p - 1))}
                            disabled={couponUsagesPage === 1}
                            className="coupon-page-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <span className="coupon-page-info">Page {couponUsagesPage} of {totalPages}</span>
                        <button
                            onClick={() => setCouponUsagesPage(p => Math.min(totalPages, p + 1))}
                            disabled={couponUsagesPage === totalPages}
                            className="coupon-page-btn"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponUsagesTab;
