import React, { useState } from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, RotateCcw, ChevronUp } from 'lucide-react';
import './AdminCatalogTabs.css';
import './PaymentsTab.css';

const PaymentsTab = ({
    payments,
    searchTerm,
    setSearchTerm,
    paymentsPage,
    setPaymentsPage,
    paymentsRowsPerPage,
    setPaymentsRowsPerPage,
    onRefund,
    refundLoading,
}) => {
    const [expandedId, setExpandedId] = useState(null);

    const q = (searchTerm || '').toLowerCase();
    const filteredPayments = (payments || []).filter(
        (p) =>
            p &&
            ((p.payment_method || '').toLowerCase().includes(q) ||
                (p.payment_status || '').toLowerCase().includes(q) ||
                (p.order_id || '').toLowerCase().includes(q)),
    );

    const totalPages = Math.max(1, Math.ceil(filteredPayments.length / paymentsRowsPerPage) || 1);
    const paginatedPayments = filteredPayments.slice(
        (paymentsPage - 1) * paymentsRowsPerPage,
        paymentsPage * paymentsRowsPerPage,
    );

    const paymentStatusClass = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'SUCCESS':
            case 'COMPLETED':
                return 'active';
            case 'PENDING':
            case 'INITIATED':
                return 'pending';
            case 'FAILED':
                return 'inactive';
            default:
                return 'pending';
        }
    };

    const refundStatusClass = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'COMPLETED':
                return 'active';
            case 'INITIATED':
                return 'pending';
            case 'FAILED':
                return 'inactive';
            default:
                return '';
        }
    };

    const canRefund = (payment) => {
        return payment.payment_status === 'SUCCESS' && (!payment.refund_status || payment.refund_status === 'NONE');
    };

    const toggleExpand = (id) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <div className="admin-table-card catalog-tab-card payments-tab-card animate-slide-up">
            <div className="catalog-tab-header">
                <h2 className="catalog-tab-title">Payments</h2>
                <p className="catalog-tab-subtitle">
                    Gateway charges linked to orders. Search by method, status, or order id. Expand a row for transaction
                    ids; refund when eligible.
                </p>
            </div>
            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={18} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search by method, status, or order id…"
                        value={searchTerm || ''}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPaymentsPage(1);
                        }}
                        aria-label="Search payments"
                    />
                </div>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th>Refund</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPayments.map((payment) => (
                                <React.Fragment key={payment.id}>
                                    <tr>
                                        <td data-label="Order">
                                            <span className="payments-order-id" title={payment.order_id || ''}>
                                                {payment.order_id ? `${payment.order_id.substring(0, 8)}…` : '—'}
                                            </span>
                                        </td>
                                        <td data-label="Method">{payment.payment_method}</td>
                                        <td data-label="Status">
                                            <span
                                                className={`status-tag ${paymentStatusClass(payment.payment_status)}`}
                                            >
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td data-label="Amount" style={{ fontWeight: 600 }}>
                                            ₹{parseFloat(payment.amount || 0).toFixed(2)}
                                        </td>
                                        <td data-label="Refund">
                                            {payment.refund_status && payment.refund_status !== 'NONE' ? (
                                                <span
                                                    className={`status-tag ${refundStatusClass(
                                                        payment.refund_status,
                                                    )}`}
                                                >
                                                    {payment.refund_status}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                        <td data-label="Date">
                                            {payment.created_at
                                                ? new Date(payment.created_at).toLocaleDateString('en-IN', {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric',
                                                  })
                                                : '—'}
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                type="button"
                                                className="action-btn"
                                                onClick={() => toggleExpand(payment.id)}
                                                title="View details"
                                                aria-expanded={expandedId === payment.id}
                                            >
                                                {expandedId === payment.id ? (
                                                    <ChevronUp size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                            {canRefund(payment) && (
                                                <button
                                                    type="button"
                                                    className="action-btn payments-refund-btn"
                                                    onClick={() => onRefund(payment)}
                                                    disabled={refundLoading}
                                                    title="Refund"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedId === payment.id && (
                                        <tr>
                                            <td colSpan="7" style={{ padding: 0 }}>
                                                <div className="payments-expand-panel">
                                                    <div className="payments-expand-field payments-expand-field--mono">
                                                        <span>Merchant txn id</span>
                                                        <div>{payment.merchant_transaction_id || '—'}</div>
                                                    </div>
                                                    <div className="payments-expand-field payments-expand-field--mono">
                                                        <span>Gateway txn id</span>
                                                        <div>{payment.gateway_transaction_id || '—'}</div>
                                                    </div>
                                                    <div className="payments-expand-field payments-expand-field--mono">
                                                        <span>Gateway order id</span>
                                                        <div>{payment.gateway_order_id || '—'}</div>
                                                    </div>
                                                    <div className="payments-expand-field">
                                                        <span>Payment date</span>
                                                        <div>
                                                            {payment.payment_date
                                                                ? new Date(payment.payment_date).toLocaleString('en-IN')
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                    {payment.refund_status && payment.refund_status !== 'NONE' && (
                                                        <>
                                                            <div className="payments-expand-field">
                                                                <span>Refund amount</span>
                                                                <div>₹{parseFloat(payment.refund_amount || 0).toFixed(2)}</div>
                                                            </div>
                                                            <div className="payments-expand-field payments-expand-field--mono">
                                                                <span>Refund txn id</span>
                                                                <div>{payment.refund_transaction_id || '—'}</div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                            {filteredPayments.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="payments-empty-cell">
                                        No payments match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="catalog-tab-footer">
                <label className="catalog-rows-label">
                    Rows
                    <select
                        className="catalog-rows-select"
                        value={paymentsRowsPerPage}
                        onChange={(e) => {
                            setPaymentsRowsPerPage(Number(e.target.value));
                            setPaymentsPage(1);
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
                            onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                            disabled={paymentsPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{paymentsPage}</span> of {totalPages}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPaymentsPage((p) => Math.min(totalPages, p + 1))}
                            disabled={paymentsPage === totalPages}
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

export default PaymentsTab;
