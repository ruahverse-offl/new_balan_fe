import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
    checkPaymentStatus,
    retryPendingPayment,
    loadRazorpayScript,
    verifyPayment,
    reportCheckoutOutcome,
} from '../services/razorpayApi';
import { CheckCircle, XCircle, ShoppingBag, RefreshCw, Phone, MessageSquare, Clock } from 'lucide-react';
import { PageLoading } from '../components/common/PageLoading';
import './PaymentCallback.css';

const RETRY_DELAYS_MS = [1500, 2500];
const MAX_POLL_ATTEMPTS = 1 + RETRY_DELAYS_MS.length; // 1 immediate + short retries
const PENDING_CART_SNAPSHOTS_KEY = 'nb_pending_cart_snapshots_v1';

function readPendingCartSnapshots() {
    try {
        const raw = localStorage.getItem(PENDING_CART_SNAPSHOTS_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

function writePendingCartSnapshots(map) {
    try {
        localStorage.setItem(PENDING_CART_SNAPSHOTS_KEY, JSON.stringify(map || {}));
    } catch {
        // Best effort only.
    }
}

function consumePendingCartSnapshot(orderId) {
    const key = String(orderId || '');
    if (!key) return [];
    const snapshots = readPendingCartSnapshots();
    const items = Array.isArray(snapshots[key]) ? snapshots[key] : [];
    if (key in snapshots) {
        delete snapshots[key];
        writePendingCartSnapshots(snapshots);
    }
    return items;
}

function dropPendingCartSnapshot(orderId) {
    const key = String(orderId || '');
    if (!key) return;
    const snapshots = readPendingCartSnapshots();
    if (key in snapshots) {
        delete snapshots[key];
        writePendingCartSnapshots(snapshots);
    }
}

function formatCountdown(totalSeconds) {
    const s = Math.max(0, Number(totalSeconds) || 0);
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart, addToCart } = useCart();

    const [status, setStatus] = useState('checking'); // checking | success | failed | processing | error
    const [paymentData, setPaymentData] = useState(null);
    const [pollCount, setPollCount] = useState(0);
    const [countdownSecs, setCountdownSecs] = useState(0);
    const [retryingPayment, setRetryingPayment] = useState(false);
    const [pollCycle, setPollCycle] = useState(0);
    const pollTimer = useRef(null);
    const hasCleared = useRef(false);
    const hasRestored = useRef(false);

    // Get orderId from URL params, fallback to sessionStorage
    const orderId = searchParams.get('orderId') || sessionStorage.getItem('payment_order_id');

    const handleSuccess = useCallback((data) => {
        setPaymentData(data);
        setStatus('success');
        if (!hasCleared.current) {
            clearCart();
            hasCleared.current = true;
        }
        // Clean up sessionStorage
        sessionStorage.removeItem('payment_order_id');
        if (data?.order_id) {
            dropPendingCartSnapshot(data.order_id);
        }
    }, [clearCart]);

    const handleFailed = useCallback((data) => {
        setPaymentData(data);
        setStatus('failed');
        sessionStorage.removeItem('payment_order_id');
        const restoreOrderId = data?.order_id || orderId;
        if (!hasRestored.current && restoreOrderId) {
            const snapshotItems = consumePendingCartSnapshot(restoreOrderId);
            if (snapshotItems.length > 0) {
                clearCart();
                snapshotItems.forEach((item) => {
                    addToCart(item, { quantity: Number(item.quantity) || 1 });
                });
            }
            hasRestored.current = true;
        }
    }, [addToCart, clearCart, orderId]);

    useEffect(() => {
        const raw = Number(paymentData?.payment_expires_in_seconds);
        if (!Number.isFinite(raw) || raw <= 0) {
            setCountdownSecs(0);
            return undefined;
        }
        setCountdownSecs(raw);
        const timer = setInterval(() => {
            setCountdownSecs((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [paymentData?.payment_expires_in_seconds]);

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            return;
        }

        let attempt = 0;

        const poll = async () => {
            attempt++;
            setPollCount(attempt);

            try {
                const result = await checkPaymentStatus(orderId);

                if (result.payment_status === 'SUCCESS') {
                    handleSuccess(result);
                    return;
                }

                if (result.payment_status === 'FAILED') {
                    handleFailed(result);
                    return;
                }

                // Event-driven fallback: one immediate check, then only short retries.
                if (attempt < MAX_POLL_ATTEMPTS) {
                    const delay = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] ?? 2000;
                    pollTimer.current = setTimeout(poll, delay);
                } else {
                    if (result.payment_window_expired || Number(result.payment_expires_in_seconds || 0) <= 0) {
                        handleFailed(result);
                    } else {
                        // Max attempts reached — still inside payment grace window
                        setPaymentData(result);
                        setStatus('processing');
                    }
                }
            } catch (err) {
                console.error('Payment status check error:', err);
                if (attempt < MAX_POLL_ATTEMPTS) {
                    const delay = RETRY_DELAYS_MS[attempt - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] ?? 2000;
                    pollTimer.current = setTimeout(poll, delay);
                } else {
                    setStatus('error');
                }
            }
        };

        poll();

        return () => {
            if (pollTimer.current) clearTimeout(pollTimer.current);
        };
    }, [orderId, handleSuccess, handleFailed, pollCycle]);

    // Manual retry handler
    const handleRetryCheck = async () => {
        if (!orderId) return;
        setStatus('checking');
        setPollCount(0);
        try {
            const result = await checkPaymentStatus(orderId);
            if (result.payment_status === 'SUCCESS') {
                handleSuccess(result);
            } else if (result.payment_status === 'FAILED') {
                handleFailed(result);
            } else {
                if (result.payment_window_expired || Number(result.payment_expires_in_seconds || 0) <= 0) {
                    handleFailed(result);
                } else {
                    setPaymentData(result);
                    setStatus('processing');
                }
            }
        } catch {
            setStatus('error');
        }
    };

    const handleCompletePendingPayment = async () => {
        if (!orderId || retryingPayment) return;
        setRetryingPayment(true);
        try {
            const retry = await retryPendingPayment(orderId);
            await loadRazorpayScript();
            const Razorpay = window.Razorpay;
            if (!Razorpay) throw new Error('Payment checkout unavailable.');

            const rzp = new Razorpay({
                key: retry.key_id,
                amount: Math.round(Number(retry.amount || 0)),
                currency: 'INR',
                order_id: retry.razorpay_order_id,
                name: 'New Balan Pharmacy',
                description: `Order ${retry.order_reference || retry.order_id}`,
                theme: { color: '#1d4ed8' },
                retry: { enabled: true, max_count: 4 },
                notes: { internal_order_id: retry.order_id },
                handler: async (res) => {
                    await verifyPayment({
                        razorpay_payment_id: res.razorpay_payment_id,
                        razorpay_order_id: res.razorpay_order_id,
                        razorpay_signature: res.razorpay_signature,
                    });
                    setStatus('checking');
                    setPollCount(0);
                    setPollCycle((n) => n + 1);
                },
                modal: {
                    ondismiss: () => {
                        reportCheckoutOutcome({
                            order_id: orderId,
                            outcome: 'abandoned',
                            error_description: 'Customer closed the payment window.',
                        }).catch(() => {});
                    },
                    escape: true,
                    animation: true,
                },
            });
            rzp.on('payment.failed', (response) => {
                const err = response?.error || {};
                const desc = err.description || err.reason || err.code || 'Payment failed.';
                reportCheckoutOutcome({
                    order_id: orderId,
                    outcome: 'failed',
                    razorpay_payment_id:
                        response?.metadata?.payment_id ||
                        response?.payment_id ||
                        err?.metadata?.payment_id ||
                        err?.payment_id ||
                        undefined,
                    error_description: String(desc),
                }).catch(() => {});
                setStatus('processing');
            });
            rzp.open();
        } catch (e) {
            console.error('Retry payment error:', e);
            setStatus('error');
        } finally {
            setRetryingPayment(false);
        }
    };

    // ── Loading state ──
    if (status === 'checking') {
        return (
            <div className="payment-callback-page">
                <div className="callback-card">
                    <PageLoading
                        variant="bare"
                        message="Verifying payment…"
                        subtitle="Please wait while we confirm your payment with Razorpay."
                        className="payment-callback-verify-loading"
                    />
                    {pollCount > 1 && (
                        <p className="poll-hint">Attempt {pollCount} of {MAX_POLL_ATTEMPTS}...</p>
                    )}
                </div>
            </div>
        );
    }

    // ── Success state ──
    if (status === 'success') {
        return (
            <div className="payment-callback-page">
                <div className="callback-card callback-success">
                    <div className="callback-icon-circle success-circle">
                        <CheckCircle size={56} />
                    </div>
                    <h2>Payment Successful!</h2>
                    <p>Your order has been placed successfully. You will receive a confirmation shortly.</p>

                    {paymentData && (
                        <div className="callback-details">
                            <div className="callback-row">
                                <span>Order ID</span>
                                <span className="mono">{paymentData.order_id?.substring(0, 8).toUpperCase()}</span>
                            </div>
                            {paymentData.transaction_id && (
                                <div className="callback-row">
                                    <span>Transaction ID</span>
                                    <span className="mono">{paymentData.transaction_id}</span>
                                </div>
                            )}
                            {paymentData.amount != null && (
                                <div className="callback-row">
                                    <span>Amount Paid</span>
                                    <span className="amount-paid">{'\u20B9'}{Number(paymentData.amount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="callback-row">
                                <span>Status</span>
                                <span className="status-badge status-success">Paid</span>
                            </div>
                        </div>
                    )}

                    <div className="callback-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                            View My Orders
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/pharmacy')}>
                            <ShoppingBag size={18} />
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Failed state ──
    if (status === 'failed') {
        return (
            <div className="payment-callback-page">
                <div className="callback-card callback-failed">
                    <div className="callback-icon-circle failed-circle">
                        <XCircle size={56} />
                    </div>
                    <h2>Payment Failed</h2>
                    <p>
                        {paymentData?.payment_window_expired
                            ? 'Payment was not completed within the allowed time window, so this order was marked as failed.'
                            : 'Your payment could not be completed. No amount has been deducted from your account.'}
                    </p>

                    <div className="callback-actions">
                        <button className="btn btn-primary" onClick={handleCompletePendingPayment} disabled={retryingPayment}>
                            <RefreshCw size={18} />
                            {retryingPayment ? 'Opening payment...' : 'Complete Payment'}
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/pharmacy')}>
                            Back to Pharmacy
                        </button>
                    </div>

                    <div className="callback-support">
                        <p>Need help? Contact us:</p>
                        <div className="support-links">
                            <a href="tel:+919894880598" className="support-link">
                                <Phone size={16} /> Call Support
                            </a>
                            <a
                                href={`https://wa.me/9894880598?text=${encodeURIComponent(`Hi, my payment failed for order ${orderId?.substring(0, 8).toUpperCase()}. Please help.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="support-link support-whatsapp"
                            >
                                <MessageSquare size={16} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Still processing state (max polls reached, still pending) ──
    if (status === 'processing') {
        return (
            <div className="payment-callback-page">
                <div className="callback-card callback-processing">
                    <div className="callback-icon-circle processing-circle">
                        <Clock size={56} />
                    </div>
                    <h2>Payment Processing</h2>
                    <p>Your payment is still being processed by Razorpay. This usually takes a few seconds but can sometimes take longer.</p>
                    {countdownSecs > 0 && (
                        <p className="callback-note">
                            Payment window remaining: <strong>{formatCountdown(countdownSecs)}</strong>. If payment is not completed in this time, the order will be marked failed automatically.
                        </p>
                    )}

                    {paymentData && paymentData.order_id && (
                        <div className="callback-details">
                            <div className="callback-row">
                                <span>Order ID</span>
                                <span className="mono">{paymentData.order_id?.substring(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                    )}

                    <div className="callback-actions">
                        <button className="btn btn-primary" onClick={handleCompletePendingPayment} disabled={retryingPayment}>
                            <RefreshCw size={18} />
                            {retryingPayment ? 'Opening payment...' : 'Complete Payment'}
                        </button>
                        <button className="btn btn-outline" onClick={handleRetryCheck}>
                            <RefreshCw size={18} />
                            Check Status
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/profile')}>
                            View My Orders
                        </button>
                    </div>
                    <p className="callback-note">
                        You can retry payment while the payment window is active.
                    </p>

                    <p className="callback-note">
                        If money was deducted and the payment doesn't confirm within a few minutes, it will be automatically refunded within 5-7 business days.
                    </p>
                </div>
            </div>
        );
    }

    // ── Error state ──
    return (
        <div className="payment-callback-page">
            <div className="callback-card callback-failed">
                <div className="callback-icon-circle failed-circle">
                    <XCircle size={56} />
                </div>
                <h2>Something Went Wrong</h2>
                <p>We couldn't verify your payment. If money was deducted, it will be refunded within 5-7 business days.</p>

                <div className="callback-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                        View My Orders
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate('/pharmacy')}>
                        Back to Pharmacy
                    </button>
                </div>

                <div className="callback-support">
                    <p>Need help? Contact us:</p>
                    <div className="support-links">
                        <a href="tel:+919894880598" className="support-link">
                            <Phone size={16} /> Call Support
                        </a>
                        <a
                            href={`https://wa.me/9894880598?text=${encodeURIComponent('Hi, I had an issue with my payment. Please help.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="support-link support-whatsapp"
                        >
                            <MessageSquare size={16} /> WhatsApp
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCallback;
