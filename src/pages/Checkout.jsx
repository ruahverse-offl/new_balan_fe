import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { prodCheck } from '../config';
import { getDeliverySettings } from '../services/deliveryApi';
import { useRefreshDeliverySettingsOnFocus } from '../hooks/useRefreshDeliverySettingsOnFocus';
import { validateCoupon as validateCouponApi, getActiveCoupons } from '../services/couponsApi';
import { initiatePayment, verifyPayment, loadRazorpayScript } from '../services/razorpayApi';
import { getMyAddresses, createAddress } from '../services/addressesApi';
import { uploadPrescriptionFile } from '../services/uploadApi';
import { ShoppingBag, ArrowLeft, Plus, MapPin, X, FileText, AlertCircle } from 'lucide-react';
import { InlineSpinner } from '../components/common/PageLoading';
import './Checkout.css';

/**
 * Turn API/gateway error strings into short, non-technical copy for the checkout alert modal.
 * Log full errors with console.error; do not show raw exception types in the UI.
 */
function userFacingCheckoutError(raw) {
    const s = String(raw ?? '').trim();
    if (!s) {
        return 'Something went wrong. Please try again.';
    }
    const lower = s.toLowerCase();
    if (
        lower.includes('badrequesterror') ||
        lower.includes('authentication failed') ||
        lower.includes('authentication_failed')
    ) {
        return 'The payment service could not be reached or there is a configuration issue. Please try again in a few minutes, or contact support if this continues.';
    }
    if (lower.includes('payment gateway') || lower.includes('gateway error')) {
        return 'The payment service returned an error. Please try again or use another payment method.';
    }
    if (lower.includes('network') || lower.includes('failed to fetch')) {
        return 'Network error. Check your connection and try again.';
    }
    let cleaned = s
        .replace(/^Failed to create order:\s*/i, '')
        .replace(/\s*\(?BadRequestError:\s*[^)]*\)?/gi, '')
        .replace(/\s*\(?\w+Error:\s*[^)]*\)?/g, '')
        .trim();
    if (/^\w+Error:/.test(cleaned) || cleaned.length > 220) {
        return 'We could not complete that step. Please try again.';
    }
    return cleaned || 'Something went wrong. Please try again.';
}

/** Delivery fee from settings: ₹0 when subtotal is inside the free-delivery min/max band. */
function computeDeliveryFee(subtotal, settings) {
    if (!settings || settings.is_enabled === false) return 0;
    const fee = Number(settings.delivery_fee ?? 40);
    const min =
        settings.free_delivery_min_amount != null && settings.free_delivery_min_amount !== ''
            ? Number(settings.free_delivery_min_amount)
            : Number(settings.free_delivery_threshold ?? 500);
    const maxRaw = settings.free_delivery_max_amount;
    const max =
        maxRaw != null && maxRaw !== '' && !Number.isNaN(Number(maxRaw)) ? Number(maxRaw) : null;
    if (subtotal < min) return fee;
    if (max != null && max > 0 && subtotal > max) return fee;
    return 0;
}

const Checkout = () => {
    const { cart, subtotal, updateQuantity, removeFromCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [deliverySettings, setDeliverySettings] = useState({ is_enabled: true, show_marquee: true });
    useRefreshDeliverySettingsOnFocus(setDeliverySettings);

    const [appliedCoupons, setAppliedCoupons] = useState([]); // [{ code, discountAmount }, ...]
    const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });
    const [availableCoupons, setAvailableCoupons] = useState([]);

    useEffect(() => {
        if (!prodCheck) {
            navigate('/pharmacy', { replace: true });
            return;
        }
        const fetchSettingsAndSlots = async () => {
            try {
                const settings = await getDeliverySettings();
                setDeliverySettings(settings);
            } catch (error) {
                console.error('Error fetching delivery settings:', error);
            }
        };
        fetchSettingsAndSlots();
    }, [navigate]);

    // Only fetch and show coupons when marquee is visible (admin can hide via Coupon Marquee Display toggle)
    useEffect(() => {
        if (deliverySettings.show_marquee === false) {
            setAvailableCoupons([]);
            return;
        }
        const fetchCoupons = async () => {
            try {
                const list = await getActiveCoupons();
                setAvailableCoupons(list || []);
            } catch (error) {
                console.error('Error fetching coupons:', error);
            }
        };
        fetchCoupons();
    }, [deliverySettings.show_marquee]);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        street: '',
        city: user?.city || '',
        state: '',
        pincode: '',
        country: 'India',
        paymentMethod: 'online',
        email: user?.email || '',
        deliverySlot: '',
        coupon: ''
    });

    const [processingPayment, setProcessingPayment] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    // Saved addresses state
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [saveNewAddress, setSaveNewAddress] = useState(false);
    const [newAddressLabel, setNewAddressLabel] = useState('');
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [prescriptionUpload, setPrescriptionUpload] = useState(null);
    const [uploadingPrescription, setUploadingPrescription] = useState(false);
    const [showRazorpayTestBanner, setShowRazorpayTestBanner] = useState(false);
    /** Payment / checkout errors (not coupon messages) — shown in a modal instead of inline by the coupon field. */
    const [checkoutErrorModal, setCheckoutErrorModal] = useState(null);
    const prescriptionSectionRef = useRef(null);

    useEffect(() => {
        if (!checkoutErrorModal) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setCheckoutErrorModal(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [checkoutErrorModal]);

    // Fetch saved addresses on mount
    useEffect(() => {
        if (!user) return;
        const fetchAddresses = async () => {
            setLoadingAddresses(true);
            try {
                const addresses = await getMyAddresses();
                setSavedAddresses(addresses || []);
                const defaultAddr = (addresses || []).find(a => a.is_default);
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr.id);
                    setFormData(prev => ({
                        ...prev,
                        street: defaultAddr.street,
                        city: defaultAddr.city,
                        state: defaultAddr.state,
                        pincode: defaultAddr.pincode,
                        country: defaultAddr.country || 'India',
                    }));
                }
            } catch (error) {
                console.error('Error fetching addresses:', error);
            } finally {
                setLoadingAddresses(false);
            }
        };
        fetchAddresses();
    }, [user]);

    // Minimum order amount
    const minOrderAmount = deliverySettings.min_order_amount || 0;
    const meetsMinOrder = subtotal >= minOrderAmount;
    const itemNeedsPrescription = (item) =>
        item.requires_prescription === true ||
        item.requiresPrescription === true ||
        item.is_prescription_required === true;
    const cartNeedsPrescription = cart.some(itemNeedsPrescription);
    const prescriptionReady =
        !cartNeedsPrescription ||
        Boolean(prescriptionUpload?.stored_as || prescriptionUpload?.url);
    // Do not disable the pay button for missing prescription — otherwise clicks do nothing and users see no reason.
    // Validation in handleInitiatePayment shows errors and scrolls to the prescription block.
    const canPlaceOrder =
        deliverySettings.is_enabled !== false && meetsMinOrder && !processingPayment;

    if (!prodCheck) {
        return null;
    }

    // If cart is empty, show empty state
    if (cart.length === 0) {
        return (
            <div className="checkout-page container empty-cart-state" style={{ textAlign: 'center' }}>
                <ShoppingBag size={64} style={{ color: 'var(--gray-400)', marginBottom: '1rem' }} />
                <h2>Your cart is empty</h2>
                <button className="btn-primary" onClick={() => navigate('/pharmacy')} style={{ marginTop: '1rem' }}>
                    Browse Medicines
                </button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (formErrors[e.target.name]) {
            setFormErrors({ ...formErrors, [e.target.name]: null }); // Clear error
        }
        if (e.target.name === 'coupon') {
            setCouponMsg({ text: '', type: '' });
        }
    };

    const handleApplyCoupon = async (codeFromChip) => {
        const code = ((codeFromChip ?? formData.coupon) || '').trim();
        if (!code) {
            setCouponMsg({ text: 'Please enter a coupon code', type: 'error' });
            return;
        }
        const codeUpper = code.toUpperCase();
        if (appliedCoupons.some(ac => ac.code.toUpperCase() === codeUpper)) {
            setCouponMsg({ text: 'This coupon is already applied.', type: 'error' });
            return;
        }

        try {
            const result = await validateCouponApi(code, subtotal);
            if (result.valid) {
                const discountAmount = Number(result.discount_amount) || 0;
                setAppliedCoupons(prev => [...prev, { code: codeUpper, discountAmount }]);
                setFormData(prev => ({ ...prev, coupon: '' }));
                setCouponMsg({ text: result.message || `Added! ₹${discountAmount.toFixed(2)} off.`, type: 'success' });
            } else {
                setCouponMsg({ text: result.message || 'Invalid coupon code', type: 'error' });
            }
        } catch (error) {
            setCouponMsg({ text: error.message || 'Failed to validate coupon', type: 'error' });
        }
    };

    const handleRemoveCoupon = (codeToRemove) => {
        if (codeToRemove !== undefined) {
            setAppliedCoupons(prev => prev.filter(ac => ac.code.toUpperCase() !== (codeToRemove || '').toUpperCase()));
        } else {
            setAppliedCoupons([]);
            setFormData(prev => ({ ...prev, coupon: '' }));
        }
        setCouponMsg({ text: '', type: '' });
    };

    const deliveryFee = computeDeliveryFee(subtotal, deliverySettings);
    const discountAmount = appliedCoupons.reduce((sum, ac) => sum + (Number(ac.discountAmount) || 0), 0);
    const finalTotal = subtotal + deliveryFee - discountAmount;
    const validateForm = () => {
        const errors = {};
        if (!formData.name) errors.name = 'Required';
        if (!formData.phone) {
            errors.phone = 'Required';
        } else {
            const phoneDigits = formData.phone.replace(/\D/g, '');
            if (phoneDigits.length < 10) errors.phone = 'Enter a valid 10-digit phone number';
        }
        if (!formData.street) errors.street = 'Required';
        if (!formData.city) errors.city = 'Required';
        if (!formData.state) errors.state = 'Required';
        if (!formData.pincode) errors.pincode = 'Required';

        // Validate minimum order amount
        if (!meetsMinOrder && minOrderAmount > 0) {
            errors.minOrder = `Minimum order amount is ₹${minOrderAmount.toFixed(2)}. Please add more items to your cart.`;
        }

        if (
            cartNeedsPrescription &&
            !prescriptionUpload?.stored_as &&
            !prescriptionUpload?.url
        ) {
            errors.prescription =
                'Your cart includes prescription-only medicines. Please upload a clear photo or PDF of a valid prescription from a licensed practitioner before you can pay.';
        }

        // Delivery slot validation removed
        // if (deliverySettings.isEnabled && !formData.deliverySlot) errors.deliverySlot = 'Please select a slot';

        setFormErrors(errors);
        const valid = Object.keys(errors).length === 0;
        return { valid, errors };
    };

    const handleSelectAddress = (address) => {
        setSelectedAddressId(address.id);
        setShowNewAddressForm(false);
        setFormData(prev => ({
            ...prev,
            street: address.street,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country || 'India',
        }));
    };

    const handleAddNewAddress = () => {
        setSelectedAddressId(null);
        setShowNewAddressForm(true);
        setFormData(prev => ({
            ...prev,
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India',
        }));
    };

    const handlePrescriptionFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCouponMsg({ text: '', type: '' });
        setUploadingPrescription(true);
        try {
            const res = await uploadPrescriptionFile(file);
            setPrescriptionUpload({
                stored_as: res.stored_as,
                url: res.url,
                filename: res.filename || file.name,
            });
            if (formErrors.prescription) {
                setFormErrors((prev) => ({ ...prev, prescription: null }));
            }
        } catch (err) {
            console.error('Prescription upload:', err);
            setCheckoutErrorModal({
                title: "Couldn't upload prescription",
                message: userFacingCheckoutError(
                    err.message || 'Could not upload prescription. Please try again.',
                ),
            });
            setPrescriptionUpload(null);
        } finally {
            setUploadingPrescription(false);
            e.target.value = '';
        }
    };

    const handleInitiatePayment = async (e) => {
        e.preventDefault();
        const { valid, errors: validationErrors } = validateForm();
        if (!valid) {
            if (validationErrors.prescription && prescriptionSectionRef.current) {
                prescriptionSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
        }

        if (deliverySettings.is_enabled === false) {
            setCheckoutErrorModal({
                title: 'Delivery unavailable',
                message: 'Delivery is currently turned off. Please try again later.',
            });
            return;
        }

        setProcessingPayment(true);
        setCouponMsg({ text: '', type: '' });
        setCheckoutErrorModal(null);
        setShowRazorpayTestBanner(false);

        try {
            // Save new address if user opted in (refetch so next time they see it in saved list).
            // Must run when there are zero saved rows too — that path shows the form without setting
            // showNewAddressForm (only "Add new address" sets that), so do not require showNewAddressForm alone.
            const shouldSaveAddress =
                Boolean(user) &&
                saveNewAddress &&
                (showNewAddressForm || savedAddresses.length === 0);
            if (shouldSaveAddress) {
                try {
                    const created = await createAddress({
                        label: newAddressLabel || null,
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        pincode: formData.pincode,
                        country: formData.country,
                        is_default: savedAddresses.length === 0,
                    });
                    const updated = await getMyAddresses();
                    setSavedAddresses(updated || []);
                    if (created?.id) {
                        setSelectedAddressId(created.id);
                        setShowNewAddressForm(false);
                    }
                } catch (err) {
                    console.error('Failed to save address:', err);
                    setCheckoutErrorModal({
                        title: 'Address not saved',
                        message:
                            userFacingCheckoutError(err?.message) ||
                            'Could not save your address for next time. Your order will still go through.',
                    });
                }
            }

            const orderData = {
                customer_name: formData.name,
                customer_phone: formData.phone,
                customer_email: (formData.email || user?.email || '').trim() || undefined,
                delivery_address: `${formData.street}, ${formData.city}, ${formData.state} - ${formData.pincode}, ${formData.country}`,
                pincode: (formData.pincode || '').trim() || undefined,
                city: (formData.city || '').trim() || undefined,
                items: cart.map(item => ({
                    medicine_brand_id: item.brandId || item.id || null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    requires_prescription: itemNeedsPrescription(item),
                })),
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                discount_amount: discountAmount,
                final_amount: finalTotal,
                coupon_code: appliedCoupons.length > 0 ? appliedCoupons[0].code : null,
                applied_coupons: appliedCoupons.length > 0 ? appliedCoupons.map(ac => ({ code: ac.code, discount_amount: Number(ac.discountAmount) || 0 })) : null,
                prescription_path:
                    prescriptionUpload?.stored_as ||
                    prescriptionUpload?.url ||
                    undefined,
            };

            const result = await initiatePayment(orderData);

            if (!result || !result.order_id || !result.razorpay_order_id || result.key_id == null) {
                setCheckoutErrorModal({
                    title: "Payment couldn't start",
                    message: userFacingCheckoutError('Could not create Razorpay order. Please try again.'),
                });
                setProcessingPayment(false);
                return;
            }

            const orderId = result.order_id;
            sessionStorage.setItem('payment_order_id', orderId);

            const isRazorpayTest =
                result.razorpay_mode === 'test' ||
                String(result.key_id || '').startsWith('rzp_test_');
            if (isRazorpayTest) {
                setShowRazorpayTestBanner(true);
            }

            try {
                await loadRazorpayScript();
            } catch (loadErr) {
                console.error('Razorpay script load:', loadErr);
                setCheckoutErrorModal({
                    title: 'Payment checkout unavailable',
                    message: userFacingCheckoutError(
                        loadErr.message || 'Could not load payment checkout. Please try again.',
                    ),
                });
                setProcessingPayment(false);
                return;
            }

            const Razorpay = window.Razorpay;
            if (!Razorpay) {
                setCheckoutErrorModal({
                    title: 'Payment checkout unavailable',
                    message: userFacingCheckoutError('Payment script failed to load. Please try again.'),
                });
                setProcessingPayment(false);
                return;
            }

            const amountPaise = Math.round(Number(result.amount));
            if (!Number.isFinite(amountPaise) || amountPaise < 1) {
                setCheckoutErrorModal({
                    title: 'Invalid amount',
                    message: 'Invalid payment amount. Please refresh the page and try again.',
                });
                setProcessingPayment(false);
                return;
            }

            const phoneDigits = String(formData.phone || '').replace(/\D/g, '');
            const contactPrefill =
                phoneDigits.length >= 10 ? `+91${phoneDigits.slice(-10)}` : undefined;

            const rzp = new Razorpay({
                key: result.key_id,
                amount: amountPaise,
                currency: 'INR',
                order_id: result.razorpay_order_id,
                name: 'New Balan Pharmacy',
                description: `Order ${result.order_reference || orderId}`,
                prefill: {
                    ...(formData.name?.trim() ? { name: formData.name.trim() } : {}),
                    ...((formData.email || user?.email || '').trim()
                        ? { email: (formData.email || user?.email || '').trim() }
                        : {}),
                    ...(contactPrefill ? { contact: contactPrefill } : {}),
                },
                theme: { color: '#1d4ed8' },
                retry: { enabled: true, max_count: 4 },
                notes: { internal_order_id: orderId },
                handler: async (res) => {
                    try {
                        await verifyPayment({
                            razorpay_payment_id: res.razorpay_payment_id,
                            razorpay_order_id: res.razorpay_order_id,
                            razorpay_signature: res.razorpay_signature,
                        });
                        setProcessingPayment(false);
                        navigate(`/payment-callback?orderId=${orderId}`);
                    } catch (verifyErr) {
                        console.error('Verify payment failed:', verifyErr);
                        setCheckoutErrorModal({
                            title: 'Payment verification failed',
                            message: userFacingCheckoutError(
                                verifyErr.message || 'Payment verification failed.',
                            ),
                        });
                        setProcessingPayment(false);
                    }
                },
                modal: {
                    ondismiss: () => setProcessingPayment(false),
                    escape: true,
                    animation: true,
                },
            });

            rzp.on('payment.failed', (response) => {
                const err = response?.error || {};
                const desc =
                    err.description ||
                    err.reason ||
                    err.code ||
                    'Payment failed. Please try again or use another method.';
                setCheckoutErrorModal({
                    title: 'Payment failed',
                    message: userFacingCheckoutError(String(desc)),
                });
                setProcessingPayment(false);
            });

            rzp.open();
        } catch (error) {
            console.error('Error creating order:', error);
            setCheckoutErrorModal({
                title: "Couldn't start payment",
                message: userFacingCheckoutError(
                    error.message || 'Failed to create order. Please try again.',
                ),
            });
            setProcessingPayment(false);
        }
    };

    return (
        <div className="checkout-page animate-fade">
            <div className="container">
                <button className="back-link" onClick={() => navigate('/pharmacy')}>
                    <ArrowLeft size={20} /> Back to Pharmacy
                </button>

                <h1 className="checkout-main-title">Checkout & Delivery</h1>

                {deliverySettings.is_enabled === false && (
                    <div
                        className="delivery-window-banner closed"
                        style={{
                            margin: '0.75rem 0 1.25rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                            fontWeight: 600,
                        }}
                    >
                        Delivery is currently turned off.
                    </div>
                )}

                {deliverySettings.is_enabled !== false && deliverySettings.delivery_schedule?.customer_message && (
                    <div
                        className="delivery-window-banner"
                        role="status"
                        style={{
                            margin: '0.75rem 0 1.25rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.9rem',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: '#1e40af',
                        }}
                    >
                        {deliverySettings.delivery_schedule.customer_message}
                    </div>
                )}

                {showRazorpayTestBanner && (
                    <div className="checkout-razorpay-test-banner" role="status">
                        <p>
                            <strong>Razorpay test mode</strong> — the &quot;Test Mode&quot; label in the payment window is
                            expected when using test API keys. Choose a payment method inside Razorpay, then use{' '}
                            <a
                                href="https://razorpay.com/docs/payments/payments/test-card-details/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Razorpay&apos;s test card / UPI details
                            </a>
                            . If the window keeps loading, try another browser or turn off ad blockers for this site.
                        </p>
                    </div>
                )}

                <div className="checkout-grid">
                    {/* Left: Form */}
                    <div className="checkout-form-section">
                        <form onSubmit={handleInitiatePayment} className="checkout-form-container">
                            <h3 className="checkout-section-title">Contact Information</h3>
                            <div className="form-row-2">
                                <div className="checkout-input-group">
                                    <label className="checkout-label">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        autoComplete="name"
                                        className={`checkout-input ${formErrors.name ? 'error' : ''}`}
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                    {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                                </div>
                                <div className="checkout-input-group">
                                    <label className="checkout-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        autoComplete="tel"
                                        className={`checkout-input ${formErrors.phone ? 'error' : ''}`}
                                        placeholder="+91 98765 43210"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                    {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                                </div>
                            </div>
                            <div className="checkout-input-group" style={{ marginTop: '0.75rem' }}>
                                <label className="checkout-label">Email (for receipts)</label>
                                <input
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    className="checkout-input"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <h3 className="checkout-section-title checkout-section-divider">
                                <MapPin size={20} /> {user ? 'Select delivery address' : 'Shipping Address'}
                            </h3>

                            {/* For logged-in users: Select address block (saved addresses + Add new address button) */}
                            {user && !loadingAddresses && (
                                <div className="checkout-select-address-block">
                                    {savedAddresses.length > 0 ? (
                                        <>
                                            <p className="checkout-select-address-hint">Choose a saved address or add a new one.</p>
                                            <div className="saved-addresses-grid">
                                                {savedAddresses.map(addr => (
                                                    <div
                                                        key={addr.id}
                                                        className={`address-card ${selectedAddressId === addr.id && !showNewAddressForm ? 'selected' : ''}`}
                                                        onClick={() => handleSelectAddress(addr)}
                                                    >
                                                        <div className="address-card-radio">
                                                            <input
                                                                type="radio"
                                                                name="savedAddress"
                                                                checked={selectedAddressId === addr.id && !showNewAddressForm}
                                                                onChange={() => handleSelectAddress(addr)}
                                                            />
                                                        </div>
                                                        <div className="address-card-content">
                                                            <div className="address-card-header">
                                                                <span className="address-label-tag">
                                                                    {addr.label || 'Address'}
                                                                </span>
                                                                {addr.is_default && (
                                                                    <span className="address-default-badge">Default</span>
                                                                )}
                                                            </div>
                                                            <p className="address-card-text">
                                                                {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {selectedAddressId && !showNewAddressForm && (() => {
                                                const addr = savedAddresses.find(a => a.id === selectedAddressId);
                                                return addr ? (
                                                    <p className="checkout-delivering-to">
                                                        Delivering to: {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                    </p>
                                                ) : null;
                                            })()}
                                            {!showNewAddressForm && (
                                                <button type="button" className="btn-add-new-address" onClick={handleAddNewAddress}>
                                                    <Plus size={18} /> Add new address
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <p className="checkout-select-address-hint">You don&apos;t have any saved addresses. Add your delivery address below.</p>
                                    )}
                                </div>
                            )}

                            {loadingAddresses && (
                                <div className="checkout-address-loading">
                                    <InlineSpinner size={24} />
                                    <span>Loading your addresses…</span>
                                </div>
                            )}

                            {/* Address form: when no saved addresses, or "Add new address" clicked, or guest */}
                            {(savedAddresses.length === 0 || showNewAddressForm || !user) && !loadingAddresses && (
                                <div className="checkout-address-form-block">
                                    {user && savedAddresses.length > 0 && showNewAddressForm && (
                                        <div className="checkout-address-form-header">
                                            <p className="checkout-form-block-title">New delivery address</p>
                                            <button type="button" className="btn-cancel-new-address" onClick={() => setShowNewAddressForm(false)}>
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                    <div className="checkout-input-group">
                                        <label className="checkout-label">Street Address *</label>
                                        <textarea
                                            name="street"
                                            className={`checkout-input ${formErrors.street ? 'error' : ''}`}
                                            placeholder="House/Flat no., Building name, Street name"
                                            value={formData.street}
                                            onChange={handleChange}
                                            rows="2"
                                            style={{ fontFamily: 'inherit', resize: 'none' }}
                                        />
                                    </div>

                                    <div className="form-row-2">
                                        <div className="checkout-input-group">
                                            <label className="checkout-label">City *</label>
                                            <input
                                                type="text"
                                                name="city"
                                                className={`checkout-input ${formErrors.city ? 'error' : ''}`}
                                                placeholder="City"
                                                value={formData.city}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="checkout-input-group">
                                            <label className="checkout-label">State *</label>
                                            <input
                                                type="text"
                                                name="state"
                                                className={`checkout-input ${formErrors.state ? 'error' : ''}`}
                                                placeholder="State"
                                                value={formData.state}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row-2">
                                        <div className="checkout-input-group">
                                            <label className="checkout-label">PIN Code *</label>
                                            <input
                                                type="text"
                                                name="pincode"
                                                className={`checkout-input ${formErrors.pincode ? 'error' : ''}`}
                                                placeholder="PIN Code"
                                                value={formData.pincode}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="checkout-input-group">
                                            <label className="checkout-label">Country</label>
                                            <select
                                                name="country"
                                                className="checkout-select"
                                                value={formData.country}
                                                onChange={handleChange}
                                            >
                                                <option value="India">India</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Save address option for logged-in users adding new address */}
                                    {user && (showNewAddressForm || savedAddresses.length === 0) && (
                                        <div className="save-address-option">
                                            <label className="save-address-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={saveNewAddress}
                                                    onChange={(e) => setSaveNewAddress(e.target.checked)}
                                                />
                                                <span>Save this address for future orders</span>
                                            </label>
                                            {saveNewAddress && (
                                                <input
                                                    type="text"
                                                    placeholder="Label (e.g., Home, Office)"
                                                    className="checkout-input"
                                                    value={newAddressLabel}
                                                    onChange={(e) => setNewAddressLabel(e.target.value)}
                                                    style={{ marginTop: '0.75rem' }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                        </form>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="order-summary-section">
                        <div className="summary-card">
                            <h3 className="summary-title">Order Summary</h3>

                            <div className="summary-items">
                                {cart.map(item => (
                                    <div key={item.id} className="summary-item">
                                        <div className="summary-item-info">
                                            <p className="summary-item-name">{item.name}</p>
                                            <p className="summary-item-qty">₹{item.price} each</p>
                                            <div className="checkout-qty-controls">
                                                <button
                                                    type="button"
                                                    className="checkout-qty-btn"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    aria-label="Decrease quantity (removes item at zero)"
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    min={0}
                                                    max={item.maxStock != null ? Number(item.maxStock) : undefined}
                                                    className="checkout-qty-input"
                                                    aria-label="Quantity"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const s = String(e.target.value).trim();
                                                        if (s === '') return;
                                                        const n = parseInt(s, 10);
                                                        if (Number.isNaN(n)) return;
                                                        if (n < 1) {
                                                            removeFromCart(item.id);
                                                            return;
                                                        }
                                                        const max = item.maxStock != null ? Number(item.maxStock) : null;
                                                        if (max != null && n > max) {
                                                            updateQuantity(item.id, max);
                                                            return;
                                                        }
                                                        updateQuantity(item.id, n);
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="checkout-qty-btn"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    aria-label="Increase quantity"
                                                    disabled={item.maxStock != null && item.quantity >= item.maxStock}
                                                    title={
                                                        item.maxStock != null && item.quantity >= item.maxStock
                                                            ? 'Only this many units are available for this brand'
                                                            : undefined
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <p className="summary-item-price">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            {deliverySettings.show_marquee !== false && (
                            <div className="coupon-box">
                                <label className="checkout-label">Have a Coupon?</label>
                                {availableCoupons.length > 0 && (
                                    <div className="available-coupons" style={{ marginBottom: '0.75rem' }}>
                                        <span className="checkout-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Available coupons:</span>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {availableCoupons.map((c) => {
                                                const isApplied = appliedCoupons.some(ac => ac.code.toUpperCase() === (c.code || '').toUpperCase());
                                                return (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    className="coupon-chip"
                                                    onClick={() => {
                                                        if (isApplied) return;
                                                        handleApplyCoupon(c.code);
                                                    }}
                                                    style={{
                                                        padding: '0.35rem 0.6rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--primary, #2563eb)',
                                                        background: isApplied ? 'var(--primary, #2563eb)' : 'transparent',
                                                        color: isApplied ? '#fff' : 'var(--primary, #2563eb)',
                                                        fontSize: '0.8rem',
                                                        cursor: isApplied ? 'default' : 'pointer',
                                                        fontWeight: 600,
                                                        opacity: isApplied ? 0.9 : 1,
                                                    }}
                                                >
                                                    {c.code} ({(Number(c.discount_percentage ?? c.discount) || 0)}% off){c.first_order_only ? ' · First order only' : ''}
                                                </button>
                                            ); })}
                                        </div>
                                    </div>
                                )}
                                <div className="coupon-input-group">
                                    <input
                                        type="text"
                                        name="coupon"
                                        placeholder="Enter code"
                                        className="checkout-input"
                                        value={formData.coupon}
                                        onChange={handleChange}
                                    />
                                    <button type="button" className="btn-apply-coupon" onClick={handleApplyCoupon}>Apply</button>
                                </div>
                                {appliedCoupons.length > 0 && (
                                    <div className="applied-coupons-list">
                                        {appliedCoupons.map((ac) => (
                                            <div key={ac.code} className="applied-coupon-row">
                                                <span>{ac.code} &ndash; ₹{Number(ac.discountAmount).toFixed(2)} off</span>
                                                <button type="button" className="btn-remove-one-coupon" onClick={() => handleRemoveCoupon(ac.code)} aria-label={`Remove ${ac.code}`}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {appliedCoupons.length > 1 && (
                                            <button type="button" className="btn-remove-coupon" onClick={() => handleRemoveCoupon()}>
                                                <X size={14} /> Remove all coupons
                                            </button>
                                        )}
                                    </div>
                                )}
                                {couponMsg.text && (
                                    <p style={{
                                        fontSize: '0.8rem',
                                        marginTop: '0.5rem',
                                        fontWeight: 600,
                                        color: couponMsg.type === 'success' ? '#22c55e' : '#ef4444'
                                    }}>
                                        {couponMsg.text}
                                    </p>
                                )}
                            </div>
                            )}

                            {cartNeedsPrescription && (
                                <div
                                    className="checkout-prescription-box"
                                    ref={prescriptionSectionRef}
                                    id="checkout-prescription-section"
                                >
                                    {!prescriptionReady && (
                                        <div className="checkout-prescription-warning" role="alert">
                                            <strong>Prescription required to pay.</strong> Your cart includes prescription-only
                                            medicines. Upload a valid prescription (photo or PDF) below before you proceed to
                                            payment.
                                        </div>
                                    )}
                                    <label className="checkout-label" htmlFor="checkout-prescription-file">
                                        <FileText size={16} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem' }} />
                                        Prescription required
                                    </label>
                                    <p className="checkout-prescription-hint">
                                        Your order includes prescription-only medicine. Upload a legible photo or PDF of a valid prescription from a licensed practitioner.
                                    </p>
                                    <div className="checkout-prescription-file-row">
                                        <input
                                            id="checkout-prescription-file"
                                            type="file"
                                            accept="image/*,.pdf,application/pdf"
                                            disabled={uploadingPrescription}
                                            onChange={handlePrescriptionFileChange}
                                        />
                                        {uploadingPrescription && (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: '#64748b' }}>
                                                <InlineSpinner size={16} /> Uploading…
                                            </span>
                                        )}
                                    </div>
                                    {formErrors.prescription && (
                                        <p style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, marginTop: '0.5rem' }}>
                                            {formErrors.prescription}
                                        </p>
                                    )}
                                    {prescriptionUpload?.filename && !formErrors.prescription && (
                                        <p className="checkout-prescription-status">
                                            Uploaded: {prescriptionUpload.filename}
                                        </p>
                                    )}
                                </div>
                            )}

                            {!meetsMinOrder && minOrderAmount > 0 && (
                                <p className="checkout-summary-error" role="alert">
                                    Minimum order is ₹{minOrderAmount.toFixed(2)}. Add more items to your cart to proceed to
                                    payment.
                                </p>
                            )}

                            <div className="summary-totals">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery Fee</span>
                                    <span className="delivery-fee">
                                        {deliverySettings.is_enabled === false ? '—' : deliveryFee > 0 ? `₹${deliveryFee.toFixed(2)}` : 'Free'}
                                    </span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="summary-row" style={{ color: '#22c55e' }}>
                                        <span>Discount</span>
                                        <span>-₹{discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="total-row">
                                    <span>Total</span>
                                    <span>₹{finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="order-methods">
                                <button
                                    type="button"
                                    onClick={handleInitiatePayment}
                                    className="btn-place-order"
                                    disabled={!canPlaceOrder}
                                    title={
                                        !meetsMinOrder && minOrderAmount > 0
                                            ? `Add items to reach the minimum order of ₹${minOrderAmount.toFixed(2)}`
                                            : deliverySettings.is_enabled === false
                                              ? 'Delivery is unavailable'
                                              : undefined
                                    }
                                >
                                    {processingPayment ? (
                                        <>
                                            <InlineSpinner size={20} style={{ marginRight: '8px' }} />
                                            Processing payment...
                                        </>
                                    ) : (
                                        <>Proceed to Pay ₹{finalTotal.toFixed(2)}</>
                                    )}
                                </button>

                                <p className="payment-secure-badge">UPI &bull; Cards &bull; Net Banking &mdash; Secure Payment by Razorpay</p>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            {checkoutErrorModal && (
                <div
                    className="checkout-error-modal-backdrop"
                    role="presentation"
                    onClick={() => setCheckoutErrorModal(null)}
                >
                    <div
                        className="checkout-error-modal"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="checkout-error-modal-title"
                        aria-describedby="checkout-error-modal-desc"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="checkout-error-modal__icon" aria-hidden>
                            <AlertCircle size={40} strokeWidth={1.75} />
                        </div>
                        <h2 id="checkout-error-modal-title" className="checkout-error-modal__title">
                            {checkoutErrorModal.title}
                        </h2>
                        <p id="checkout-error-modal-desc" className="checkout-error-modal__message">
                            {checkoutErrorModal.message}
                        </p>
                        <button
                            type="button"
                            className="checkout-error-modal__btn"
                            onClick={() => setCheckoutErrorModal(null)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

        </div >
    );
};

export default Checkout;
