import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ChevronRight, Eye } from 'lucide-react';
import { PageLoading } from '../../components/common/PageLoading';
import { getOrders } from '../../services/ordersApi';
import {
    formatOrderStatusLabel,
    orderStatusTagClass,
    HISTORY_ORDER_STATUS_FILTER_VALUES,
} from '../../constants/orderLifecycle';

const OrderHistoryPage = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetch = useCallback(
        async (p = page, s = search, rpp = rowsPerPage, d = dateFilter, sf = statusFilter) => {
            setLoading(true);
            try {
                const res = await getOrders({
                    limit: rpp,
                    offset: (p - 1) * rpp,
                    search: s || undefined,
                    order_date: d || undefined,
                    order_status: sf || undefined,
                    staff_scope: 'history',
                }).catch(() => ({ items: [], pagination: {} }));
                setOrders(res.items || []);
                setTotal(res.pagination?.total ?? 0);
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    useEffect(() => {
        fetch(page, search, rowsPerPage, dateFilter, statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage]);

    const totalPages = Math.ceil(total / rowsPerPage) || 1;

    return (
        <div className="admin-content-area animate-slide-up" style={{ padding: '1.5rem' }}>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                    type="button"
                    className="order-detail-back-btn"
                    onClick={() => navigate('/admin', { state: { tab: 'orders' } })}
                >
                    <ArrowLeft size={18} /> Back to Orders
                </button>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Order History</h2>
            </div>

            <div className="admin-table-card catalog-tab-card orders-tab-card" style={{ padding: 0 }}>
                {/* Toolbar */}
                <div className="catalog-tab-toolbar orders-tab-toolbar" style={{ borderTop: 'none' }}>
                    <div className="table-search">
                        <Search size={18} aria-hidden />
                        <input
                            type="search"
                            placeholder="Search by customer name, phone, order id…"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                                fetch(1, e.target.value, rowsPerPage, dateFilter, statusFilter);
                            }}
                            aria-label="Search history orders"
                        />
                    </div>
                    <label className="orders-date-filter">
                        <span>Date</span>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => {
                                setDateFilter(e.target.value);
                                setPage(1);
                                fetch(1, search, rowsPerPage, e.target.value, statusFilter);
                            }}
                        />
                    </label>
                    <select
                        className="orders-status-filter"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                            fetch(1, search, rowsPerPage, dateFilter, e.target.value);
                        }}
                        aria-label="Filter by order status"
                    >
                        <option value="">All history</option>
                        {HISTORY_ORDER_STATUS_FILTER_VALUES.map((s) => (
                            <option key={s} value={s}>
                                {formatOrderStatusLabel(s)}
                            </option>
                        ))}
                    </select>
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {total.toLocaleString('en-IN')} order{total !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Table */}
                <div className="scrollable-section-wrapper orders-table-scroll">
                    <div className="table-wrapper orders-table-inner">
                    <table className="admin-table orders-table orders-table-v2">
                        <thead>
                            <tr>
                                <th scope="col" style={{ width: '3rem' }}>#</th>
                                <th scope="col">Customer</th>
                                <th scope="col">Date</th>
                                <th scope="col">Amount</th>
                                <th scope="col">Payment</th>
                                <th scope="col">Status</th>
                                <th scope="col" className="orders-th-actions">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: 0, border: 0 }}>
                                        <PageLoading variant="compact" message="Loading orders…" />
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="orders-empty-cell">No history orders found.</td>
                                </tr>
                            ) : orders.map((order, idx) => (
                                <tr key={order.id} className="orders-row-v2">
                                    <td data-label="#" style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                        {(page - 1) * rowsPerPage + idx + 1}
                                    </td>
                                    <td data-label="Customer" className="orders-cell-customer-name">
                                        {order.customer_name?.trim() || '—'}
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
                                        ₹{Number.parseFloat(order.final_amount || 0).toLocaleString('en-IN', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </td>
                                    <td data-label="Payment" className="orders-cell-payment">
                                        {order.payment_method || '—'}
                                    </td>
                                    <td data-label="Status">
                                        <span className={`status-tag ${orderStatusTagClass(order.order_status)}`}>
                                            {formatOrderStatusLabel(order.order_status)}
                                        </span>
                                    </td>
                                    <td data-label="Action" className="orders-cell-actions">
                                        <div className="orders-action-icons">
                                            <button
                                                type="button"
                                                className="orders-icon-btn"
                                                title="View order"
                                                aria-label="View order"
                                                onClick={() => navigate(`/admin/orders/${order.id}`, {
                                                    state: { order, fromTab: 'orders' },
                                                })}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="catalog-tab-footer orders-tab-footer">
                    <label className="catalog-rows-label orders-rows-label">
                        Rows
                        <select
                            className="catalog-rows-select orders-rows-select"
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                    {totalPages > 1 && (
                        <div className="pagination-bar">
                            <button
                                type="button"
                                className="page-nav-btn"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ArrowLeft size={18} /> Prev
                            </button>
                            <div className="page-numbers">
                                Page <span>{page}</span> of {totalPages}
                            </div>
                            <button
                                type="button"
                                className="page-nav-btn"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderHistoryPage;
