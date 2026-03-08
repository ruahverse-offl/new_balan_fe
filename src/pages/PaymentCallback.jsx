import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { checkPaymentStatus } from '../services/razorpayApi';
import { CheckCircle, XCircle, Loader2, ShoppingBag, RefreshCw, Phone, MessageSquare, Clock } from 'lucide-react';
import './PaymentCallback.css';

const MAX_POLL_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 3000;

const PaymentCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { clearCart } = useCart();

    const [status, setStatus] = useState('checking'); // checking | success | failed | processing | error
    const [paymentData, setPaymentData] = useState(null);
    const [pollCount, setPollCount] = useState(0);
    const pollTimer = useRef(null);
    const hasCleared = useRef(false);

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
    }, [clearCart]);

    const handleFailed = useCallback((data) => {
        setPaymentData(data);
        setStatus('failed');
        sessionStorage.removeItem('payment_order_id');
    }, []);

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

                // Still PENDING / INITIATED — retry if attempts left
                if (attempt < MAX_POLL_ATTEMPTS) {
                    pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
                } else {
                    // Max attempts reached — show "still processing"
                    setPaymentData(result);
                    setStatus('processing');
                }
            } catch (err) {
                console.error('Payment status check error:', err);
                if (attempt < MAX_POLL_ATTEMPTS) {
                    pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
                } else {
                    setStatus('error');
                }
            }
        };

        poll();

        return () => {
            if (pollTimer.current) clearTimeout(pollTimer.current);
        };
    }, [orderId, handleSuccess, handleFailed]);

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
                setPaymentData(result);
                setStatus('processing');
            }
        } catch {
            setStatus('error');
        }
    };

    // ── Loading state ──
    if (status === 'checking') {
        return (
            <div className="payment-callback-page">
                <div className="callback-card">
                    <Loader2 size={64} className="spin-icon callback-loader" />
                    <h2>Verifying Payment...</h2>
                    <p>Please wait while we confirm your payment with Razorpay.</p>
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
                    <p>Your payment could not be completed. No amount has been deducted from your account.</p>

                    <div className="callback-actions">
                        <button className="btn btn-primary" onClick={() => navigate('/checkout')}>
                            <RefreshCw size={18} />
                            Try Again
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

                    {paymentData && paymentData.order_id && (
                        <div className="callback-details">
                            <div className="callback-row">
                                <span>Order ID</span>
                                <span className="mono">{paymentData.order_id?.substring(0, 8).toUpperCase()}</span>
                            </div>
                        </div>
                    )}

                    <div className="callback-actions">
                        <button className="btn btn-primary" onClick={handleRetryCheck}>
                            <RefreshCw size={18} />
                            Check Again
                        </button>
                        <button className="btn btn-outline" onClick={() => navigate('/profile')}>
                            View My Orders
                        </button>
                    </div>

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
