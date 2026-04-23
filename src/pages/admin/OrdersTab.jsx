import React from 'react';
import { Search, Eye, Pencil, ArrowLeft, ChevronRight } from 'lucide-react';
import {
    ORDER_STATUS_FILTER_VALUES,
    formatOrderStatusLabel,
    normalizeOrderStatus,
} from '../../constants/orderLifecycle';
import './AdminCatalogTabs.css';

/**
 * @param {object} order
 * @returns {{ label: string, tagClass: string, title: string }}
 */
function formatOrderSource(order) {
    const raw = String(order?.order_source ?? '').trim();
    if (!raw) {
        const pm = String(order?.payment_method || '').toUpperCase();
        if (pm === 'RAZORPAY' || pm === 'UPI' || pm === 'CARD' || pm === 'NETBANKING') {
            return { label: 'Online', tagClass: 'online', title: 'From payment method' };
        }
        return { label: '—', tagClass: '', title: '' };
    }
    const norm = raw.toUpperCase().replace(/\s+/g, '_');
    if (norm === 'ONLINE' || norm === 'APP' || norm === 'MOBILE' || norm === 'WEB' || norm === 'MOBILE_APP') {
        return { label: 'Online', tagClass: 'online', title: raw };
    }
    if (norm === 'WALK_IN' || norm === 'WALKIN') {
        return { label: 'Walk-in', tagClass: 'walk_in', title: raw };
    }
    const label = raw
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    return { label: label || raw, tagClass: norm.toLowerCase(), title: raw };
}

const OrdersTab = ({
    orders,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    ordersPage,
    setOrdersPage,
    ordersRowsPerPage,
    setOrdersRowsPerPage,
    statusFilter,
    setStatusFilter,
    onViewDetails,
    onEditDetails,
}) => {
    const filteredOrders = (orders || []).filter((o) => {
        if (!o) return false;
        const term = (searchTerm || '').toLowerCase();
        const ref = (o.order_reference || '').toLowerCase();
        const matchesSearch =
            !term ||
            (o.customer_name || '').toLowerCase().includes(term) ||
            (o.customer_phone || '').includes(term) ||
            (o.id || '').toLowerCase().includes(term) ||
            (ref && ref.includes(term));
        const matchesStatus =
            !statusFilter ||
            normalizeOrderStatus(o.order_status) === normalizeOrderStatus(statusFilter) ||
            String(o.order_status || '').toUpperCase() === String(statusFilter || '').toUpperCase();
        const matchesDate = (() => {
            if (!dateFilter) return true;
            const createdAt = o.created_at ? new Date(o.created_at) : null;
            if (!createdAt || Number.isNaN(createdAt.getTime())) return false;
            const createdDateStr = createdAt.toISOString().slice(0, 10);
            return createdDateStr === dateFilter;
        })();
        return matchesSearch && matchesStatus && matchesDate;
    });

    const kpiOrderCount = filteredOrders.length;
    const kpiTotalAmount = filteredOrders.reduce((sum, o) => sum + parseFloat(o.final_amount || 0), 0);

    const totalPages = Math.ceil(filteredOrders.length / ordersRowsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (ordersPage - 1) * ordersRowsPerPage,
        ordersPage * ordersRowsPerPage,
    );

    const openEdit = onEditDetails || onViewDetails;

    return (
        <div className="admin-table-card catalog-tab-card orders-tab-card animate-slide-up">
            <div className="catalog-tab-header orders-tab-header-compact">
                <div>
                    <h2 className="catalog-tab-title">Orders</h2>
                    <p className="catalog-tab-subtitle">
                        Filter by date and status, search by customer, phone, or order id. Use view or edit to open an
                        order.
                    </p>
                </div>
            </div>

            <div className="orders-kpi-strip" aria-label="Order totals for current filters">
                <div className="orders-kpi-card">
                    <span className="orders-kpi-label">Total orders</span>
                    <span className="orders-kpi-value">{kpiOrderCount.toLocaleString('en-IN')}</span>
                </div>
                <div className="orders-kpi-card orders-kpi-card-accent">
                    <span className="orders-kpi-label">Total amount</span>
                    <span className="orders-kpi-value">
                        ₹
                        {kpiTotalAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </span>
                </div>
            </div>

            <div className="catalog-tab-toolbar orders-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search by customer name, phone, order id…"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setOrdersPage(1);
                        }}
                        aria-label="Search orders"
                    />
                </div>
                <label className="orders-date-filter">
                    <span>Date</span>
                    <input
                        type="date"
                        value={dateFilter || ''}
                        onChange={(e) => {
                            setDateFilter(e.target.value);
                            setOrdersPage(1);
                        }}
                    />
                </label>
                <select
                    className="orders-status-filter"
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setOrdersPage(1);
                    }}
                    aria-label="Filter by order status"
                >
                    <option value="">All statuses</option>
                    {ORDER_STATUS_FILTER_VALUES.map((s) => (
                        <option key={s} value={s}>
                            {formatOrderStatusLabel(s)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table orders-table orders-table-v2">
                        <thead>
                            <tr>
                                <th scope="col">Name of the customer</th>
                                <th scope="col">Source</th>
                                <th scope="col">Date</th>
                                <th scope="col">Amount</th>
                                <th scope="col">Payment</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="orders-th-actions">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order) => {
                                const src = formatOrderSource(order);

                                return (
                                    <tr key={order.id} className="orders-row-v2">
                                        <td data-label="Customer" className="orders-cell-customer-name">
                                            {order.customer_name?.trim() || '—'}
                                        </td>
                                        <td data-label="Source">
                                            <span
                                                className={`orders-source-tag status-tag ${src.tagClass}`.trim()}
                                                title={src.title || undefined}
                                            >
                                                {src.label}
                                            </span>
                                        </td>
                                        <td data-label="Date" className="orders-cell-date">
                                            {order.created_at
                                                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric',
                                                  })
                                                : '—'}
                                        </td>
                                        <td data-label="Amount" className="orders-cell-amount">
                                            ₹
                                            {parseFloat(order.final_amount || 0).toLocaleString('en-IN', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </td>
                                        <td data-label="Payment" className="orders-cell-payment">
                                            {order.payment_method || '—'}
                                        </td>
                                        <td data-label="Status" className="orders-cell-status-text">
                                            {formatOrderStatusLabel(order.order_status)}
                                        </td>
                                        <td data-label="Action" className="orders-cell-actions">
                                            <div className="orders-action-icons">
                                                <button
                                                    type="button"
                                                    className="orders-icon-btn"
                                                    title="View order"
                                                    aria-label="View order"
                                                    onClick={() => onViewDetails(order)}
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="orders-icon-btn orders-icon-btn-edit"
                                                    title="Edit order — status and details"
                                                    aria-label="Edit order"
                                                    onClick={() => openEdit(order)}
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="orders-empty-cell">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="catalog-tab-footer orders-tab-footer">
                <label className="catalog-rows-label orders-rows-label">
                    Rows
                    <select
                        className="catalog-rows-select orders-rows-select"
                        value={ordersRowsPerPage}
                        onChange={(e) => {
                            setOrdersRowsPerPage(Number(e.target.value));
                            setOrdersPage(1);
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                {totalPages > 1 && (
                    <div className="pagination-bar">
                        <button
                            type="button"
                            onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                            disabled={ordersPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{ordersPage}</span> of {totalPages}
                        </div>
                        <button
                            type="button"
                            onClick={() => setOrdersPage((p) => Math.min(totalPages, p + 1))}
                            disabled={ordersPage === totalPages}
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

export default OrdersTab;
