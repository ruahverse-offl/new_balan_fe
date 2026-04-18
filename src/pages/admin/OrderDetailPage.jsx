import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { PageLoading } from '../../components/common/PageLoading';
import { getOrderDetail } from '../../services/ordersApi';
import { getPrescriptionFileUrl } from '../../utils/prescriptionUrl';
import {
    formatOrderStatusLabel,
    getAllowedNextStatusActions,
    isTerminalOrderStatus,
} from '../../constants/orderLifecycle';

const OrderDetailPage = ({
    onOrderLifecycleIntent,
    backendPermissions = [],
    userId,
    isAdminRole = false,
    lifecycleRefreshKey = 0,
}) => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const orderFromState = location.state?.order;
    const fromTab = location.state?.fromTab;
    const [detail, setDetail] = useState(
        orderFromState ? { order: orderFromState, items: [], payment: null } : null
    );
    const [loading, setLoading] = useState(!orderFromState);
    const [error, setError] = useState('');
    const [fetchError, setFetchError] = useState('');

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

    const handleBack = () => navigate('/admin', { state: { tab: fromTab === 'coupon-usages' ? 'coupon-usages' : 'orders' } });

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
                        <ArrowLeft size={18} /> {fromTab === 'coupon-usages' ? 'Back to Coupon Usages' : 'Back to Orders'}
                    </button>
                </div>
            </div>
        );
    }

    const order = detail.order || {};
    const items = detail.items || [];
    const payment = detail.payment || null;

    return (
        <div className="order-detail-page">
            <div className="order-detail-header">
                <button type="button" className="order-detail-back" onClick={handleBack}>
                    <ArrowLeft size={20} /> {fromTab === 'coupon-usages' ? 'Back to Coupon Usages' : 'Back to Orders'}
                </button>
                <h1 className="order-detail-title">Order #{(order.id || orderId || '').toString().substring(0, 8).toUpperCase()}</h1>
            </div>

            {fetchError && (
                <div className="order-detail-fetch-warning" style={{ padding: '0.75rem 1rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, marginBottom: '1rem', fontSize: '0.875rem', color: '#92400e' }}>
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
                        <h3>
                            <FileText size={18} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem' }} />
                            Prescription
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                            A prescription file was submitted with this order. Open it in a new tab to review (image or PDF).
                        </p>
                        {(() => {
                            const rxUrl = getPrescriptionFileUrl(order.prescription_path);
                            return rxUrl ? (
                                <a
                                    href={rxUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-add"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        textDecoration: 'none',
                                        width: 'fit-content',
                                    }}
                                >
                                    <ExternalLink size={16} /> View prescription
                                </a>
                            ) : (
                                <div className="value mono" style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>
                                    {order.prescription_path}
                                </div>
                            );
                        })()}
                    </section>
                ) : null}

                {/* Status & fulfillment */}
                <section className="order-detail-section order-detail-status">
                    <h3>Status & fulfillment</h3>
                    <div className="order-detail-status-row">
                        <div>
                            <span className="label">Order status</span>
                            <span className={`status-tag ${(order.order_status || '').toLowerCase()}`}>
                                {formatOrderStatusLabel(order.order_status)}
                            </span>
                        </div>
                        {order.delivery_assigned_user_id && (
                            <div>
                                <span className="label">Assigned delivery (user id)</span>
                                <div className="value mono" style={{ fontSize: '0.85rem' }}>
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
                    {onOrderLifecycleIntent &&
                        !isTerminalOrderStatus(order.order_status) &&
                        getAllowedNextStatusActions({
                            order,
                            backendPermissions,
                            userId,
                            isAdminRole,
                        }).length > 0 && (
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <span className="label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Advance status</span>
                                <select
                                    defaultValue=""
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        if (!v) return;
                                        const actions = getAllowedNextStatusActions({
                                            order,
                                            backendPermissions,
                                            userId,
                                            isAdminRole,
                                        });
                                        const act = actions.find((a) => a.status === v);
                                        if (act) onOrderLifecycleIntent(order, act);
                                        e.target.value = '';
                                    }}
                                    style={{
                                        padding: '0.45rem 0.6rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--admin-border)',
                                        minWidth: '220px',
                                    }}
                                >
                                    <option value="">Choose next step…</option>
                                    {getAllowedNextStatusActions({
                                        order,
                                        backendPermissions,
                                        userId,
                                        isAdminRole,
                                    }).map((a) => (
                                        <option key={a.status} value={a.status}>
                                            {a.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                </section>

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
                                                    <span className="status-tag pending" style={{ fontSize: '0.75rem' }}>Rx</span>
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
                {payment && (
                    <section className="order-detail-section">
                        <h3>Payment & transaction</h3>
                        <div className="order-detail-payment-grid">
                            <div>
                                <span className="label">Status</span>
                                <div>
                                    <span className={`status-tag ${(payment.payment_status || '').toLowerCase()}`}>
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
                                                    payment.refund_status === 'COMPLETED' ? 'active' : payment.refund_status === 'FAILED' ? 'inactive' : 'pending'
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
                    </section>
                )}

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
