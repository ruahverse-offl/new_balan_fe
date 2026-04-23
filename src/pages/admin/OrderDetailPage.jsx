import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink, Copy, Check, Ban, RotateCcw } from 'lucide-react';
import { PageLoading } from '../../components/common/PageLoading';
import { getOrderDetail } from '../../services/ordersApi';
import { getPrescriptionFileUrl } from '../../utils/prescriptionUrl';
import {
    formatOrderStatusLabel,
    FULFILLMENT_CHAIN_BUTTON_LABELS,
    fulfillmentStatusRank,
    getAllowedNextStatusActions,
    getPackedActionFromActions,
    getSortedForwardLifecycleActionsAfterPacked,
    isTerminalOrderStatus,
    orderStatusTagClass,
    paymentStatusTagClass,
} from '../../constants/orderLifecycle';

function formatLifecycleTimestamp(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
        return String(iso);
    }
}

const OrderDetailPage = ({
    onOrderLifecycleIntent,
    onCancelOrderWithReason,
    onRefundPayment,
    refundInProgress = false,
    showNotify,
    menuItems = [],
    userId,
    isAdminRole = false,
    lifecycleRefreshKey = 0,
}) => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const orderFromState = location.state?.order;
    const fromTab = location.state?.fromTab;
    const orderListBackTab =
        fromTab === 'coupon-usages'
            ? 'coupon-usages'
            : fromTab === 'delivery-orders'
              ? 'delivery-orders'
              : 'orders';
    const orderListBackLabel =
        fromTab === 'coupon-usages'
            ? 'Back to Coupon Usages'
            : fromTab === 'delivery-orders'
              ? 'Back to My deliveries'
              : 'Back to Orders';
    const [detail, setDetail] = useState(
        orderFromState ? { order: orderFromState, items: [], payment: null } : null
    );
    const [loading, setLoading] = useState(!orderFromState);
    const [error, setError] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [copiedId, setCopiedId] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [refundModalOpen, setRefundModalOpen] = useState(false);
    const [refundError, setRefundError] = useState('');
    const didScrollStatusFocus = useRef(false);

    useEffect(() => {
        didScrollStatusFocus.current = false;
    }, [orderId]);

    useEffect(() => {
        if (!orderId) return;
        if (!orderFromState) setLoading(true);
        setError('');
        setFetchError('');
        getOrderDetail(orderId)
            .then((data) => {
                if (data && typeof data === 'object') {
                    setDetail({
                        order: data.order || data.data?.order || orderFromState || {},
                        items: data.items || data.data?.items || [],
                        payment: data.payment ?? data.data?.payment ?? null,
                    });
                }
            })
            .catch((err) => {
                const msg = err?.message || 'Could not load full details';
                if (orderFromState) {
                    setDetail((prev) => prev || { order: orderFromState, items: [], payment: null });
                    setFetchError(msg === 'Network error. Please check your connection.'
                        ? 'Server unreachable. Check that the backend is running and VITE_API_BASE_URL is correct.'
                        : msg);
                } else {
                    setError(msg === 'Network error. Please check your connection.'
                        ? 'Could not load order. Check your connection and that the backend is running.'
                        : msg);
                    setDetail(null);
                }
            })
            .finally(() => setLoading(false));
    }, [orderId, lifecycleRefreshKey]);

    useEffect(() => {
        if (loading || error || !detail || didScrollStatusFocus.current) return;
        if (location.state?.orderDetailFocus !== 'status') return;
        didScrollStatusFocus.current = true;
        const el = document.getElementById('order-detail-status-section');
        if (el) {
            requestAnimationFrame(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }, [loading, error, detail, location.state?.orderDetailFocus]);

    const handleBack = () => navigate('/admin', { state: { tab: orderListBackTab } });

    if (loading) {
        return (
            <div className="order-detail-page">
                <PageLoading
                    variant="bare"
                    className="order-detail-loading"
                    message="Loading order details…"
                />
            </div>
        );
    }

    if (error || !detail) {
        return (
            <div className="order-detail-page">
                <div className="order-detail-error">
                    <p>{error || 'Order not found.'}</p>
                    <button type="button" className="btn-add btn-cancel" onClick={handleBack}>
                        <ArrowLeft size={18} /> {orderListBackLabel}
                    </button>
                </div>
            </div>
        );
    }

    const order = detail.order || {};
    const items = detail.items || [];
    const payment = detail.payment || null;
    const fullOrderId = String(order.id || orderId || '');
    const displayRef = (order.order_reference || '').trim();
    const lifecycleActions = getAllowedNextStatusActions({
        order,
        menuItems,
        userId,
        isAdminRole,
    });
    const cancelStaffAction = lifecycleActions.find((a) => a.status === 'CANCELLED_BY_STAFF');
    const canRefundPayment =
        Boolean(onRefundPayment) &&
        payment &&
        String(payment.payment_status || '').toUpperCase() === 'SUCCESS' &&
        (!payment.refund_status || String(payment.refund_status).toUpperCase() === 'NONE');

    const copyOrderId = async () => {
        if (!fullOrderId) return;
        try {
            await navigator.clipboard.writeText(fullOrderId);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } catch {
            setCopiedId(false);
        }
    };

    return (
        <div className="order-detail-page">
            <div className="order-detail-nav">
                <button type="button" className="order-detail-back" onClick={handleBack}>
                    <ArrowLeft size={20} /> {orderListBackLabel}
                </button>
            </div>

            <header className="order-detail-hero">
                <div className="order-detail-hero-main">
                    <p className="order-detail-hero-label">Order</p>
                    <h1 className="order-detail-hero-title">
                        {displayRef || `Order ${fullOrderId.slice(0, 8)}…`}
                    </h1>
                    <div className="order-detail-hero-id-row">
                        <code className="order-detail-hero-id" title={fullOrderId}>
                            {fullOrderId || '—'}
                        </code>
                        {fullOrderId ? (
                            <button
                                type="button"
                                className="order-detail-copy-id"
                                onClick={copyOrderId}
                                aria-label="Copy order id"
                            >
                                {copiedId ? <Check size={16} /> : <Copy size={16} />}
                                {copiedId ? 'Copied' : 'Copy ID'}
                            </button>
                        ) : null}
                    </div>
                </div>
                <div className="order-detail-hero-aside">
                    <span className={`status-tag ${orderStatusTagClass(order.order_status)}`}>
                        {formatOrderStatusLabel(order.order_status)}
                    </span>
                    <p className="order-detail-hero-amount">
                        ₹{parseFloat(order.final_amount || 0).toFixed(2)}
                    </p>
                    <p className="order-detail-hero-meta">
                        {order.created_at
                            ? new Date(order.created_at).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                              })
                            : ''}
                    </p>
                </div>
            </header>

            {fetchError && (
                <div className="order-detail-fetch-warning" role="status">
                    {fetchError} Showing summary from list (order items and payment may be incomplete).
                </div>
            )}

            <div className="order-detail-sections">
                {/* Customer & delivery */}
                <section className="order-detail-section order-detail-info">
                    <h3>Customer & delivery</h3>
                    <div className="order-detail-grid">
                        <div>
                            <span className="label">Customer</span>
                            <div className="value">{order.customer_name || 'N/A'}</div>
                        </div>
                        <div>
                            <span className="label">Phone</span>
                            <div className="value">{order.customer_phone || 'N/A'}</div>
                        </div>
                        {order.customer_email && (
                            <div>
                                <span className="label">Email</span>
                                <div className="value">{order.customer_email}</div>
                            </div>
                        )}
                        {order.pincode && (
                            <div>
                                <span className="label">Pincode</span>
                                <div className="value">{order.pincode}</div>
                            </div>
                        )}
                        {order.city && (
                            <div>
                                <span className="label">City</span>
                                <div className="value">{order.city}</div>
                            </div>
                        )}
                        <div>
                            <span className="label">Source</span>
                            <div>
                                <span className={`status-tag ${(order.order_source || '').toLowerCase()}`}>
                                    {order.order_source || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <span className="label">Placed at</span>
                            <div className="value">
                                {order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : 'N/A'}
                            </div>
                        </div>
                        {order.payment_completed_at && (
                            <div>
                                <span className="label">Payment completed at</span>
                                <div className="value">
                                    {new Date(order.payment_completed_at).toLocaleString('en-IN')}
                                </div>
                            </div>
                        )}
                        {order.delivery_address && (
                            <div className="full-width">
                                <span className="label">Delivery address</span>
                                <div className="value">{order.delivery_address}</div>
                            </div>
                        )}
                        {order.notes && (
                            <div className="full-width">
                                <span className="label">Notes</span>
                                <div className="value">{order.notes}</div>
                            </div>
                        )}
                    </div>
                </section>

                {order.prescription_path ? (
                    <section className="order-detail-section order-detail-prescription">
                        <h3 className="order-detail-section-title-with-icon">
                            <FileText size={18} aria-hidden />
                            Prescription
                        </h3>
                        <p className="order-detail-prescription-hint">
                            A prescription file was submitted with this order. Open it in a new tab to review (image or PDF).
                        </p>
                        {(() => {
                            const rxUrl = getPrescriptionFileUrl(order.prescription_path);
                            return rxUrl ? (
                                <a
                                    href={rxUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-add order-detail-rx-link"
                                >
                                    <ExternalLink size={16} aria-hidden /> View prescription
                                </a>
                            ) : (
                                <div className="value mono order-detail-rx-path-fallback">
                                    {order.prescription_path}
                                </div>
                            );
                        })()}
                    </section>
                ) : null}

                {/* Fulfillment: status + chain + warnings (cancel / refund modals) */}
                <section
                    id="order-detail-status-section"
                    className="order-detail-section order-detail-fulfillment"
                >
                    <h3>Fulfillment</h3>
                    <div className="order-detail-status-row order-detail-fulfillment-status">
                        <div>
                            <span className="label">Current status</span>
                            <span className={`status-tag ${orderStatusTagClass(order.order_status)}`}>
                                {formatOrderStatusLabel(order.order_status)}
                            </span>
                        </div>
                        {order.delivery_assigned_user_id && (
                            <div>
                                <span className="label">Assigned delivery (user id)</span>
                                <div className="value mono order-detail-mono-sm">
                                    {String(order.delivery_assigned_user_id)}
                                </div>
                            </div>
                        )}
                        {order.cancellation_reason && (
                            <div className="full-width">
                                <span className="label">Cancellation reason</span>
                                <div className="value">{order.cancellation_reason}</div>
                            </div>
                        )}
                        {order.return_reason && (
                            <div className="full-width">
                                <span className="label">Return reason</span>
                                <div className="value">{order.return_reason}</div>
                            </div>
                        )}
                    </div>

                    {(order.order_received_at ||
                        order.order_packed_at ||
                        order.delivery_assigned_at ||
                        order.delivered_at ||
                        order.payment_completed_at) && (
                        <div className="order-detail-milestones" style={{ marginTop: '1rem' }}>
                            <span className="label">Milestone timestamps</span>
                            <dl
                                className="order-detail-grid"
                                style={{ marginTop: '0.5rem', rowGap: '0.35rem' }}
                            >
                                <dt className="label">Order received (paid)</dt>
                                <dd className="value">
                                    {formatLifecycleTimestamp(
                                        order.order_received_at || order.payment_completed_at,
                                    )}
                                </dd>
                                <dt className="label">Order packed</dt>
                                <dd className="value">{formatLifecycleTimestamp(order.order_packed_at)}</dd>
                                <dt className="label">Delivery assigned</dt>
                                <dd className="value">{formatLifecycleTimestamp(order.delivery_assigned_at)}</dd>
                                <dt className="label">Delivered</dt>
                                <dd className="value">{formatLifecycleTimestamp(order.delivered_at)}</dd>
                            </dl>
                        </div>
                    )}

                    {!isTerminalOrderStatus(order.order_status) && (
                        <div className="order-detail-fulfillment-chain-wrap">
                            <p className="order-detail-chain-title">Progress</p>
                            <div className="order-detail-fulfillment-chain" aria-label="Order fulfillment steps">
                                {(() => {
                                    const rank = fulfillmentStatusRank(order.order_status);
                                    const packedAct = getPackedActionFromActions(lifecycleActions);
                                    const tailActs = getSortedForwardLifecycleActionsAfterPacked({
                                        order,
                                        menuItems,
                                        userId,
                                        isAdminRole,
                                    });
                                    const nodes = [];

                                    nodes.push(
                                        <div
                                            key="received"
                                            className={`order-detail-chain-node ${rank >= 1 ? 'done' : rank === 0 ? 'pending' : ''}`}
                                        >
                                            {rank >= 1 ? <Check size={14} className="order-detail-chain-check" aria-hidden /> : null}
                                            <span>Order received</span>
                                        </div>,
                                    );

                                    const packedDone = rank >= 3;
                                    nodes.push(
                                        <span key="a1" className="order-detail-chain-arrow" aria-hidden>
                                            →
                                        </span>,
                                    );
                                    if (packedAct && onOrderLifecycleIntent) {
                                        nodes.push(
                                            <button
                                                key="packed"
                                                type="button"
                                                className="order-detail-chain-btn"
                                                onClick={() => onOrderLifecycleIntent(order, packedAct)}
                                            >
                                                {packedAct.label}
                                            </button>,
                                        );
                                    } else {
                                        nodes.push(
                                            <div
                                                key="packed"
                                                className={`order-detail-chain-node ${packedDone ? 'done' : rank >= 1 ? 'waiting' : 'locked'}`}
                                            >
                                                {packedDone ? (
                                                    <Check size={14} className="order-detail-chain-check" aria-hidden />
                                                ) : null}
                                                <span>Order packed</span>
                                            </div>,
                                        );
                                    }

                                    if (onOrderLifecycleIntent) {
                                        tailActs.forEach((act) => {
                                            nodes.push(
                                                <span key={`arr-${act.status}`} className="order-detail-chain-arrow" aria-hidden>
                                                    →
                                                </span>,
                                            );
                                            const btnLabel =
                                                FULFILLMENT_CHAIN_BUTTON_LABELS[act.status] || act.label || act.status;
                                            nodes.push(
                                                <button
                                                    key={act.status}
                                                    type="button"
                                                    className="order-detail-chain-btn"
                                                    onClick={() => onOrderLifecycleIntent(order, act)}
                                                >
                                                    {btnLabel}
                                                </button>,
                                            );
                                        });
                                    }

                                    return (
                                        <>
                                            {rank === 0 ? (
                                                <p className="order-detail-chain-payment-note">
                                                    Awaiting payment. The steps below apply after payment is received.
                                                </p>
                                            ) : null}
                                            <div className="order-detail-fulfillment-chain-row">{nodes}</div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {(cancelStaffAction && onCancelOrderWithReason) || canRefundPayment ? (
                        <div className="order-detail-warning-actions" role="region" aria-label="Destructive actions">
                            <p className="order-detail-warning-title">
                                <Ban size={16} aria-hidden /> Cancel or refund
                            </p>
                            <div className="order-detail-warning-buttons">
                                {cancelStaffAction && onCancelOrderWithReason ? (
                                    <button
                                        type="button"
                                        className="order-detail-warning-btn order-detail-warning-btn-cancel"
                                        onClick={() => {
                                            setCancelReason('');
                                            setCancelModalOpen(true);
                                        }}
                                    >
                                        Cancel order…
                                    </button>
                                ) : null}
                                {canRefundPayment ? (
                                    <button
                                        type="button"
                                        className="order-detail-warning-btn order-detail-warning-btn-refund"
                                        onClick={() => {
                                            setRefundError('');
                                            setRefundModalOpen(true);
                                        }}
                                    >
                                        <RotateCcw size={16} aria-hidden /> Refund payment…
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </section>

                {cancelModalOpen ? (
                    <div
                        className="admin-modal-overlay"
                        role="presentation"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !cancelSubmitting) setCancelModalOpen(false);
                        }}
                    >
                        <div
                            className="admin-modal order-detail-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cancel-order-title"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 id="cancel-order-title" className="order-detail-modal-title">
                                Cancel order
                            </h3>
                            <p className="order-detail-modal-warning">
                                This cancels the order for the customer. Please give a clear reason (stock, prescription,
                                etc.).
                            </p>
                            <textarea
                                className="order-detail-modal-textarea"
                                rows={4}
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Cancellation reason…"
                                aria-label="Cancellation reason"
                            />
                            <div className="order-detail-modal-actions">
                                <button
                                    type="button"
                                    className="btn-add btn-cancel"
                                    onClick={() => setCancelModalOpen(false)}
                                    disabled={cancelSubmitting}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="btn-add btn-danger"
                                    disabled={cancelSubmitting}
                                    onClick={async () => {
                                        const trimmed = cancelReason.trim();
                                        if (!trimmed) {
                                            if (showNotify) showNotify('Please enter a cancellation reason.', 'error');
                                            return;
                                        }
                                        setCancelSubmitting(true);
                                        try {
                                            await onCancelOrderWithReason(order.id, trimmed);
                                            setCancelModalOpen(false);
                                            setCancelReason('');
                                            if (showNotify) showNotify('Order cancelled.', 'success');
                                        } catch (err) {
                                            if (showNotify) {
                                                showNotify(err?.message || 'Could not cancel order.', 'error');
                                            }
                                        } finally {
                                            setCancelSubmitting(false);
                                        }
                                    }}
                                >
                                    {cancelSubmitting ? 'Cancelling…' : 'Confirm cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {refundModalOpen && payment && onRefundPayment ? (
                    <div
                        className="admin-modal-overlay"
                        role="presentation"
                        onClick={(e) => {
                            if (e.target === e.currentTarget && !refundInProgress) setRefundModalOpen(false);
                        }}
                    >
                        <div
                            className="admin-modal order-detail-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="refund-title"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 id="refund-title" className="order-detail-modal-title">
                                Refund payment
                            </h3>
                            <p className="order-detail-modal-warning">
                                This starts a gateway refund for the captured payment. Amount:{' '}
                                <strong>
                                    ₹
                                    {parseFloat(payment.amount ?? order.final_amount ?? 0).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                </strong>
                            </p>
                            {refundError ? <p className="order-detail-modal-error">{refundError}</p> : null}
                            <div className="order-detail-modal-actions">
                                <button
                                    type="button"
                                    className="btn-add btn-cancel"
                                    onClick={() => setRefundModalOpen(false)}
                                    disabled={refundInProgress}
                                >
                                    Close
                                </button>
                                <button
                                    type="button"
                                    className="btn-add"
                                    disabled={refundInProgress}
                                    onClick={async () => {
                                        setRefundError('');
                                        try {
                                            await onRefundPayment({
                                                ...payment,
                                                order_id: payment.order_id || order.id,
                                                amount: payment.amount ?? order.final_amount,
                                            });
                                            setRefundModalOpen(false);
                                        } catch (err) {
                                            const msg = err?.message || 'Refund failed.';
                                            setRefundError(msg);
                                            if (showNotify) showNotify(msg, 'error');
                                        }
                                    }}
                                >
                                    {refundInProgress ? 'Processing…' : 'Initiate refund'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Items ordered */}
                <section className="order-detail-section">
                    <h3>Items ordered</h3>
                    {items.length > 0 ? (
                        <div className="table-wrapper">
                            <table className="admin-table order-detail-items-table">
                                <thead>
                                    <tr>
                                        <th>Product (Medicine - Brand)</th>
                                        <th>Qty</th>
                                        <th>Unit price</th>
                                        <th>Total</th>
                                        <th>Rx</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id}>
                                            <td>
                                                {(item.medicine_name || item.brand_name) ? (
                                                    <span>{[item.medicine_name, item.brand_name].filter(Boolean).join(' - ')}</span>
                                                ) : (
                                                    <span className="mono">{(item.medicine_brand_id || item.id || '').toString().substring(0, 8)}…</span>
                                                )}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>₹{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                                            <td className="amount">₹{parseFloat(item.total_price || 0).toFixed(2)}</td>
                                            <td>
                                                {item.requires_prescription ? (
                                                    <span className="status-tag pending order-detail-rx-pill">Rx</span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="order-detail-empty">No items for this order.</p>
                    )}
                </section>

                {/* Payment & transaction */}
                <section className="order-detail-section">
                    <h3>Payment & transaction</h3>
                    {payment ? (
                        <div className="order-detail-payment-grid">
                            <div>
                                <span className="label">Status</span>
                                <div>
                                    <span className={`status-tag ${paymentStatusTagClass(payment.payment_status)}`}>
                                        {payment.payment_status}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <span className="label">Method</span>
                                <div className="value">{payment.payment_method || 'N/A'}</div>
                            </div>
                            {payment.payment_date && (
                                <div>
                                    <span className="label">Paid at</span>
                                    <div className="value">{new Date(payment.payment_date).toLocaleString('en-IN')}</div>
                                </div>
                            )}
                            {payment.merchant_transaction_id && (
                                <div>
                                    <span className="label">Merchant txn ID</span>
                                    <div className="value mono break">{payment.merchant_transaction_id}</div>
                                </div>
                            )}
                            {payment.gateway_transaction_id && (
                                <div>
                                    <span className="label">Gateway txn ID</span>
                                    <div className="value mono break">{payment.gateway_transaction_id}</div>
                                </div>
                            )}
                            {payment.refund_status && payment.refund_status !== 'NONE' && (
                                <>
                                    <div>
                                        <span className="label">Refund status</span>
                                        <div>
                                            <span
                                                className={`status-tag ${
                                                    payment.refund_status === 'COMPLETED'
                                                        ? 'active'
                                                        : payment.refund_status === 'FAILED'
                                                          ? 'inactive'
                                                          : 'pending'
                                                }`}
                                            >
                                                {payment.refund_status}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="label">Refund amount</span>
                                        <div className="value">₹{parseFloat(payment.refund_amount || 0).toFixed(2)}</div>
                                    </div>
                                    {payment.refund_transaction_id && (
                                        <div className="full-width">
                                            <span className="label">Refund txn ID</span>
                                            <div className="value mono break">{payment.refund_transaction_id}</div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="order-detail-payment-empty">
                            No payment record loaded. If the order is paid, refresh or check the API; unpaid orders may not
                            have a row yet.
                        </p>
                    )}
                </section>

                {/* Totals */}
                <section className="order-detail-section order-detail-totals">
                    <h3>Amount summary</h3>
                    <div className="order-detail-summary">
                        <div className="row">
                            <span className="muted">Subtotal</span>
                            <span>₹{parseFloat(order.total_amount || 0).toFixed(2)}</span>
                        </div>
                        {parseFloat(order.discount_amount || 0) > 0 && (
                            <div className="row discount">
                                <span>Discount</span>
                                <span>-₹{parseFloat(order.discount_amount).toFixed(2)}</span>
                            </div>
                        )}
                        {parseFloat(order.delivery_fee || 0) > 0 && (
                            <div className="row">
                                <span className="muted">Delivery fee</span>
                                <span>₹{parseFloat(order.delivery_fee).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="row total">
                            <span>Total</span>
                            <span>₹{parseFloat(order.final_amount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default OrderDetailPage;
