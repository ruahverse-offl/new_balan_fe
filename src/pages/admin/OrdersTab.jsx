import React from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, CreditCard } from 'lucide-react';
import {
    ORDER_STATUS_FILTER_VALUES,
    formatOrderStatusLabel,
    normalizeOrderStatus,
    getAllowedNextStatusActions,
    isTerminalOrderStatus,
} from '../../constants/orderLifecycle';

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
    onOrderLifecycleIntent,
    onViewDetails,
    backendPermissions = [],
    userId,
    isAdminRole = false,
}) => {
    const filteredOrders = (orders || []).filter((o) => {
        if (!o) return false;
        const term = (searchTerm || '').toLowerCase();
        const matchesSearch =
            !term ||
            (o.customer_name || '').toLowerCase().includes(term) ||
            (o.customer_phone || '').includes(term) ||
            (o.id || '').toLowerCase().includes(term);
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

    const totalPages = Math.ceil(filteredOrders.length / ordersRowsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (ordersPage - 1) * ordersRowsPerPage,
        ordersPage * ordersRowsPerPage,
    );

    const statusClass = (status) => {
        const n = normalizeOrderStatus(status);
        switch (n) {
            case 'ORDER_RECEIVED':
            case 'DELIVERED':
                return 'active';
            case 'PENDING':
                return 'pending';
            case 'ORDER_TAKEN':
            case 'ORDER_PROCESSING':
            case 'DELIVERY_ASSIGNED':
            case 'PARCEL_TAKEN':
            case 'OUT_FOR_DELIVERY':
                return 'pending';
            case 'CANCELLED_BY_STAFF':
            case 'DELIVERY_RETURNED':
            case 'REFUNDED':
            case 'REFUND_INITIATED':
                return 'inactive';
            default:
                return 'pending';
        }
    };

    return (
        <div className="admin-table-card orders-tab-card animate-slide-up">
            <div className="orders-tab-header">
                <h3 className="orders-tab-title">Orders</h3>
                <div className="table-actions orders-tab-actions">
                    <div className="table-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or order ID..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setOrdersPage(1);
                            }}
                        />
                    </div>
                    <label
                        className="orders-date-filter"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            color: 'var(--admin-text-muted)',
                        }}
                    >
                        <span>Date</span>
                        <input
                            type="date"
                            value={dateFilter || ''}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setOrdersPage(1);
                            }}
                            style={{
                                padding: '0.35rem 0.5rem',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border)',
                                background: 'var(--admin-bg)',
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
                    >
                        <option value="">All Statuses</option>
                        {ORDER_STATUS_FILTER_VALUES.map((s) => (
                            <option key={s} value={s}>
                                {formatOrderStatusLabel(s)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table orders-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Source</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map((order) => {
                                const actions = getAllowedNextStatusActions({
                                    order,
                                    backendPermissions,
                                    userId,
                                    isAdminRole,
                                });
                                const terminal = isTerminalOrderStatus(order.order_status);
                                const selectKey = `${order.id}-${order.order_status}`;

                                return (
                                    <tr
                                        key={order.id}
                                        className="orders-row-clickable"
                                        onClick={() => onViewDetails(order)}
                                    >
                                        <td data-label="Order ID" className="orders-cell-id">
                                            <span className="orders-id-value" title={order.id}>
                                                {(order.id || '').substring(0, 8)}…
                                            </span>
                                        </td>
                                        <td data-label="Customer" className="orders-cell-customer">
                                            <span className="orders-customer-name">
                                                {order.customer_name || 'N/A'}
                                            </span>
                                            <span className="orders-customer-phone">
                                                {order.customer_phone || ''}
                                            </span>
                                        </td>
                                        <td data-label="Source">
                                            <span
                                                className={`status-tag ${(order.order_source || '').toLowerCase()}`}
                                            >
                                                {order.order_source || 'N/A'}
                                            </span>
                                        </td>
                                        <td data-label="Date" className="orders-cell-date">
                                            {order.created_at
                                                ? new Date(order.created_at).toLocaleDateString('en-IN', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric',
                                                  })
                                                : 'N/A'}
                                        </td>
                                        <td data-label="Amount" className="orders-cell-amount">
                                            ₹{parseFloat(order.final_amount || 0).toFixed(2)}
                                        </td>
                                        <td data-label="Payment" className="orders-cell-payment">
                                            <span
                                                className="orders-payment-method"
                                                title="View details for transaction ID"
                                            >
                                                <CreditCard
                                                    size={14}
                                                    style={{ verticalAlign: 'middle', marginRight: '4px' }}
                                                />
                                                {order.payment_method || 'N/A'}
                                            </span>
                                        </td>
                                        <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                <span
                                                    className={`status-tag ${statusClass(order.order_status)}`}
                                                    style={{ fontSize: '0.75rem', width: 'fit-content' }}
                                                >
                                                    {formatOrderStatusLabel(order.order_status)}
                                                </span>
                                                {!terminal && actions.length > 0 && onOrderLifecycleIntent && (
                                                    <select
                                                        key={selectKey}
                                                        defaultValue=""
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            if (!v) return;
                                                            const act = actions.find((a) => a.status === v);
                                                            if (act) {
                                                                onOrderLifecycleIntent(order, act);
                                                            }
                                                            e.target.value = '';
                                                        }}
                                                        className={`admin-status-select ${(order.order_status || 'pending').toLowerCase()}`}
                                                        aria-label="Advance order status"
                                                    >
                                                        <option value="">Advance status…</option>
                                                        {actions.map((a) => (
                                                            <option key={a.status} value={a.status}>
                                                                → {a.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {terminal && (
                                                    <span className="muted" style={{ fontSize: '0.75rem' }}>
                                                        No further actions
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td
                                            data-label="Actions"
                                            className="actions"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="action-btn"
                                                onClick={() => onViewDetails(order)}
                                                title="View details & transaction IDs"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="orders-empty-cell">
                                        No orders found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="orders-tab-footer">
                <label className="orders-rows-label">
                    Rows per page:
                    <select
                        className="orders-rows-select"
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
