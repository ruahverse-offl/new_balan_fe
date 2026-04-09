import React, { useState } from 'react';
import { Search, Eye, ArrowLeft, ChevronRight, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

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

    const filteredPayments = (payments || []).filter(p =>
        p && (
            (p.payment_method || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.payment_status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.order_id || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const totalPages = Math.ceil(filteredPayments.length / paymentsRowsPerPage);
    const paginatedPayments = filteredPayments.slice(
        (paymentsPage - 1) * paymentsRowsPerPage,
        paymentsPage * paymentsRowsPerPage
    );

    const paymentStatusClass = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'SUCCESS': case 'COMPLETED': return 'active';
            case 'PENDING': case 'INITIATED': return 'pending';
            case 'FAILED': return 'inactive';
            default: return 'pending';
        }
    };

    const refundStatusClass = (status) => {
        switch ((status || '').toUpperCase()) {
            case 'COMPLETED': return 'active';
            case 'INITIATED': return 'pending';
            case 'FAILED': return 'inactive';
            default: return '';
        }
    };

    const canRefund = (payment) => {
        return payment.payment_status === 'SUCCESS' && (!payment.refund_status || payment.refund_status === 'NONE');
    };

    const toggleExpand = (id) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search payments..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPaymentsPage(1);
                        }}
                    />
                </div>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Method</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th>Refund</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedPayments.map(payment => (
                                <React.Fragment key={payment.id}>
                                    <tr>
                                        <td data-label="Order ID">
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                                {payment.order_id ? payment.order_id.substring(0, 8) + '...' : 'N/A'}
                                            </span>
                                        </td>
                                        <td data-label="Method">{payment.payment_method}</td>
                                        <td data-label="Status">
                                            <span className={`status-tag ${paymentStatusClass(payment.payment_status)}`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td data-label="Amount" style={{ fontWeight: 600 }}>
                                            ₹{parseFloat(payment.amount || 0).toFixed(2)}
                                        </td>
                                        <td data-label="Refund">
                                            {payment.refund_status && payment.refund_status !== 'NONE' ? (
                                                <span className={`status-tag ${refundStatusClass(payment.refund_status)}`}>
                                                    {payment.refund_status}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>—</span>
                                            )}
                                        </td>
                                        <td data-label="Date">
                                            {payment.created_at
                                                ? new Date(payment.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                                                : 'N/A'}
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => toggleExpand(payment.id)}
                                                title="View Details"
                                            >
                                                {expandedId === payment.id ? <ChevronUp size={16} /> : <Eye size={16} />}
                                            </button>
                                            {canRefund(payment) && (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => onRefund(payment)}
                                                    disabled={refundLoading}
                                                    title="Refund"
                                                    style={{ color: '#dc2626' }}
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedId === payment.id && (
                                        <tr>
                                            <td colSpan="7" style={{ padding: 0 }}>
                                                <div style={{
                                                    padding: '1rem 1.5rem',
                                                    background: 'var(--admin-bg, #f8fafc)',
                                                    borderTop: '1px solid var(--admin-border, #e2e8f0)',
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                                    gap: '0.75rem',
                                                    fontSize: '0.875rem',
                                                }}>
                                                    <div>
                                                        <span style={{ color: '#64748b' }}>Merchant Txn ID</span>
                                                        <div style={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                                                            {payment.merchant_transaction_id || '—'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b' }}>Gateway Txn ID</span>
                                                        <div style={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                                                            {payment.gateway_transaction_id || '—'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b' }}>Gateway Order ID</span>
                                                        <div style={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                                                            {payment.gateway_order_id || '—'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b' }}>Payment Date</span>
                                                        <div style={{ fontWeight: 600 }}>
                                                            {payment.payment_date
                                                                ? new Date(payment.payment_date).toLocaleString('en-IN')
                                                                : '—'}
                                                        </div>
                                                    </div>
                                                    {payment.refund_status && payment.refund_status !== 'NONE' && (
                                                        <>
                                                            <div>
                                                                <span style={{ color: '#64748b' }}>Refund Amount</span>
                                                                <div style={{ fontWeight: 600 }}>
                                                                    ₹{parseFloat(payment.refund_amount || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <span style={{ color: '#64748b' }}>Refund Txn ID</span>
                                                                <div style={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}>
                                                                    {payment.refund_transaction_id || '—'}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--admin-text-muted)'
                }}>
                    Rows per page:
                    <select
                        value={paymentsRowsPerPage}
                        onChange={(e) => {
                            setPaymentsRowsPerPage(Number(e.target.value));
                            setPaymentsPage(1);
                        }}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border)',
                            backgroundColor: 'var(--admin-bg)',
                            color: 'var(--admin-text)',
                            cursor: 'pointer'
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
                            onClick={() => setPaymentsPage(p => Math.max(1, p - 1))}
                            disabled={paymentsPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{paymentsPage}</span> of {totalPages}
                        </div>
                        <button
                            onClick={() => setPaymentsPage(p => Math.min(totalPages, p + 1))}
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
