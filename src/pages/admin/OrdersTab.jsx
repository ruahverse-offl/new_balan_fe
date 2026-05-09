import React from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, History, FileText } from 'lucide-react';
import {
    ACTIVE_ORDER_STATUS_FILTER_VALUES,
    formatOrderStatusLabel,
} from '../../constants/orderLifecycle';
import { getPrescriptionFileUrl } from '../../utils/prescriptionUrl';
import { PageLoading } from '../../components/common/PageLoading';
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

const fmt = (n) =>
    Number.parseFloat(n || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const OrdersTab = ({
    orders,
    totalOrders,
    ordersLoading,
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
    onOpenHistory,
    salesSummary,
}) => {
    const pageOrders = orders || [];
    const total = totalOrders ?? pageOrders.length;
    const totalPages = Math.ceil(total / ordersRowsPerPage) || 1;

    const netRevenue =
        salesSummary != null
            ? Number.parseFloat(
                  salesSummary.net_revenue !== undefined && salesSummary.net_revenue !== null
                      ? salesSummary.net_revenue
                      : salesSummary.net_sales || 0,
              )
            : null;
    const delivered = salesSummary ? Number.parseFloat(salesSummary.delivered_amount || 0) : null;
    const cancelled = salesSummary ? Number.parseFloat(salesSummary.cancelled_amount || 0) : null;
    const returned = salesSummary ? Number.parseFloat(salesSummary.returned_amount || 0) : null;
    const refunded = salesSummary ? Number.parseFloat(salesSummary.refunded_amount || 0) : null;

    return (
        <div className="admin-table-card catalog-tab-card orders-tab-card animate-slide-up">
            <div className="orders-kpi-strip" aria-label="Order totals for current filters">
                <div className="orders-kpi-card">
                    <span className="orders-kpi-label">Total orders</span>
                    <span className="orders-kpi-value">{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="orders-kpi-card orders-kpi-card-accent" title="Net revenue = delivered − cancelled − returned − refunded. All orders are prepaid so cancellations reduce realized revenue immediately.">
                    <span className="orders-kpi-label">Net revenue</span>
                    {salesSummary ? (
                        <>
                            <span className="orders-kpi-value">₹{fmt(netRevenue)}</span>
                            <span className="orders-kpi-breakdown">
                                ₹{fmt(delivered)} delivered
                                {cancelled > 0 && <> · −₹{fmt(cancelled)} cancelled</>}
                                {returned > 0 && <> · −₹{fmt(returned)} returned</>}
                                {refunded > 0 && <> · −₹{fmt(refunded)} refunded</>}
                            </span>
                            <span className="orders-kpi-footnote">
                                Before inventory &amp; operating costs — not net profit.
                            </span>
                        </>
                    ) : (
                        <span className="orders-kpi-value orders-kpi-loading">—</span>
                    )}
                </div>
                {onOpenHistory && (
                    <button type="button" className="btn-add orders-history-btn" onClick={onOpenHistory}>
                        <History size={16} aria-hidden /> History
                    </button>
                )}
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
                    <option value="">All active</option>
                    {ACTIVE_ORDER_STATUS_FILTER_VALUES.map((s) => (
                        <option key={s} value={s}>
                            {formatOrderStatusLabel(s)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="scrollable-section-wrapper orders-table-scroll">
                <div className="table-wrapper orders-table-inner">
                    <table className="admin-table orders-table orders-table-v2">
                        <thead>
                            <tr>
                                <th scope="col" style={{ width: '3rem' }}>#</th>
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
                            {ordersLoading ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: 0, border: 0 }}>
                                        <PageLoading variant="compact" message="Loading orders…" />
                                    </td>
                                </tr>
                            ) : pageOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="orders-empty-cell">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : (
                                pageOrders.map((order, idx) => {
                                    const src = formatOrderSource(order);
                                    const sno = (ordersPage - 1) * ordersRowsPerPage + idx + 1;
                                    return (
                                        <tr key={order.id} className="orders-row-v2">
                                            <td data-label="#" style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{sno}</td>
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
                                                {Number.parseFloat(order.final_amount || 0).toLocaleString('en-IN', {
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
                                                    {order.prescription_path && (() => {
                                                        const rxUrl = getPrescriptionFileUrl(order.prescription_path);
                                                        return rxUrl ? (
                                                            <a
                                                                href={rxUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="orders-icon-btn"
                                                                title="View prescription"
                                                                aria-label="View prescription"
                                                            >
                                                                <FileText size={18} />
                                                            </a>
                                                        ) : null;
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </label>
                {totalPages > 1 && (
                    <div className="pagination-bar">
                        <button
                            type="button"
                            onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                            disabled={ordersPage === 1 || ordersLoading}
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
                            disabled={ordersPage === totalPages || ordersLoading}
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
