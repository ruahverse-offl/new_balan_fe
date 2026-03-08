import React from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, CreditCard } from 'lucide-react';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const OrdersTab = ({
    orders,
    searchTerm,
    setSearchTerm,
    ordersPage,
    setOrdersPage,
    ordersRowsPerPage,
    setOrdersRowsPerPage,
    statusFilter,
    setStatusFilter,
    onUpdateStatus,
    onViewDetails,
}) => {
    const filteredOrders = (orders || []).filter(o => {
        if (!o) return false;
        const term = (searchTerm || '').toLowerCase();
        const matchesSearch = !term ||
            (o.customer_name || '').toLowerCase().includes(term) ||
            (o.customer_phone || '').includes(term) ||
            (o.id || '').toLowerCase().includes(term);
        const matchesStatus = !statusFilter || o.order_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredOrders.length / ordersRowsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (ordersPage - 1) * ordersRowsPerPage,
        ordersPage * ordersRowsPerPage
    );

    const statusClass = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'CONFIRMED': case 'DELIVERED': case 'APPROVED': case 'SUCCESS': return 'active';
            case 'PENDING': case 'INITIATED': return 'pending';
            case 'PROCESSING': return 'pending';
            case 'CANCELLED': case 'FAILED': case 'REJECTED': return 'inactive';
            case 'REFUNDED': return 'inactive';
            default: return 'pending';
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
                            onChange={(e) => { setSearchTerm(e.target.value); setOrdersPage(1); }}
                        />
                    </div>
                    <select
                        className="orders-status-filter"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setOrdersPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
                                <th>Approval</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedOrders.map(order => (
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
                                        <span className="orders-customer-name">{order.customer_name || 'N/A'}</span>
                                        <span className="orders-customer-phone">{order.customer_phone || ''}</span>
                                    </td>
                                    <td data-label="Source">
                                        <span className={`status-tag ${(order.order_source || '').toLowerCase()}`}>
                                            {order.order_source || 'N/A'}
                                        </span>
                                    </td>
                                    <td data-label="Date" className="orders-cell-date">
                                        {order.created_at
                                            ? new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                                            : 'N/A'}
                                    </td>
                                    <td data-label="Amount" className="orders-cell-amount">
                                        ₹{parseFloat(order.final_amount || 0).toFixed(2)}
                                    </td>
                                    <td data-label="Payment" className="orders-cell-payment">
                                        <span className="orders-payment-method" title="View details for transaction ID">
                                            <CreditCard size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            {order.payment_method || 'N/A'}
                                        </span>
                                    </td>
                                    <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={order.order_status || 'PENDING'}
                                            onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                                            className={`admin-status-select ${(order.order_status || 'pending').toLowerCase()}`}
                                        >
                                            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td data-label="Approval">
                                        <span className={`status-tag ${statusClass(order.approval_status)}`}>
                                            {order.approval_status || 'N/A'}
                                        </span>
                                    </td>
                                    <td data-label="Actions" className="actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="action-btn"
                                            onClick={() => onViewDetails(order)}
                                            title="View details & transaction IDs"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="orders-empty-cell">
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
                        onChange={(e) => { setOrdersRowsPerPage(Number(e.target.value)); setOrdersPage(1); }}
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
                            onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                            disabled={ordersPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{ordersPage}</span> of {totalPages}
                        </div>
                        <button
                            onClick={() => setOrdersPage(p => Math.min(totalPages, p + 1))}
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
