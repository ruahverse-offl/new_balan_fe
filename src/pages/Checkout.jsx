import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { prodCheck } from '../config';
import { getDeliverySettings } from '../services/deliveryApi';
import { validateCoupon as validateCouponApi, getActiveCoupons } from '../services/couponsApi';
import { mockInitiatePayment, mockCompletePayment, initiatePayment, verifyPayment, loadRazorpayScript } from '../services/razorpayApi';
import { getMyAddresses, createAddress } from '../services/addressesApi';
import { ShoppingBag, ArrowLeft, Loader2, Plus, MapPin, FileText, X } from 'lucide-react';
import PrescriptionUpload from '../components/common/PrescriptionUpload';
import './Checkout.css';

const Checkout = () => {
    const { cart, subtotal, updateQuantity, removeFromCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [deliverySettings, setDeliverySettings] = useState({ is_enabled: true, show_marquee: true });

    const [appliedCoupons, setAppliedCoupons] = useState([]); // [{ code, discountAmount }, ...]
    const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });
    const [availableCoupons, setAvailableCoupons] = useState([]);

    useEffect(() => {
        if (!prodCheck) {
            navigate('/pharmacy', { replace: true });
            return;
        }
        const fetchSettings = async () => {
            try {
                const settings = await getDeliverySettings();
                setDeliverySettings(settings);
            } catch (error) {
                console.error('Error fetching delivery settings:', error);
            }
        };
        fetchSettings();
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
    // Mock payment screen (instead of Razorpay)
    const [showMockPaymentScreen, setShowMockPaymentScreen] = useState(false);
    const [mockOrderId, setMockOrderId] = useState(null);
    const [mockOrderRef, setMockOrderRef] = useState(null);
    const [mockAmount, setMockAmount] = useState(0);
    const [mockCompleting, setMockCompleting] = useState(false);
    const [prescriptionId, setPrescriptionId] = useState(null);

    // Saved addresses state
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [saveNewAddress, setSaveNewAddress] = useState(false);
    const [newAddressLabel, setNewAddressLabel] = useState('');
    const [loadingAddresses, setLoadingAddresses] = useState(false);

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

    const deliveryFee = deliverySettings.is_enabled !== false ? 40 : 0;
    const discountAmount = appliedCoupons.reduce((sum, ac) => sum + (Number(ac.discountAmount) || 0), 0);
    const finalTotal = subtotal + deliveryFee - discountAmount;
    const cartRequiresPrescription = cart.some(item => item.requiresPrescription || item.requires_prescription);

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

        // Delivery slot validation removed
        // if (deliverySettings.isEnabled && !formData.deliverySlot) errors.deliverySlot = 'Please select a slot';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
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

    const handleInitiatePayment = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setProcessingPayment(true);
        setCouponMsg({ text: '', type: '' });

        try {
            // Save new address if user opted in (refetch so next time they see it in saved list)
            if (showNewAddressForm && saveNewAddress && user) {
                try {
                    await createAddress({
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
                } catch (err) {
                    console.error('Failed to save address:', err);
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
                    requires_prescription: item.requires_prescription || item.requiresPrescription || false,
                })),
                subtotal: subtotal,
                delivery_fee: deliveryFee,
                discount_amount: discountAmount,
                final_amount: finalTotal,
                coupon_code: appliedCoupons.length > 0 ? appliedCoupons[0].code : null,
                applied_coupons: appliedCoupons.length > 0 ? appliedCoupons.map(ac => ({ code: ac.code, discount_amount: Number(ac.discountAmount) || 0 })) : null,
                prescription_id: prescriptionId || null,
            };

            let result;
            try {
                result = await mockInitiatePayment(orderData);
            } catch (mockErr) {
                // Backend may not have mock-initiate (e.g. older deploy); try real Razorpay initiate
                const is404 = mockErr.status === 404 || (mockErr.message && String(mockErr.message).includes('Not Found'));
                if (is404) {
                    try {
                        result = await initiatePayment(orderData);
                        if (result && result.order_id && result.razorpay_order_id && result.key_id != null) {
                            await loadRazorpayScript();
                            const Razorpay = window.Razorpay;
                            if (!Razorpay) {
                                setCouponMsg({ text: 'Payment script failed to load. Please try again.', type: 'error' });
                                setProcessingPayment(false);
                                return;
                            }
                            const orderId = result.order_id;
                            sessionStorage.setItem('payment_order_id', orderId);
                            new Razorpay({
                                key: result.key_id,
                                amount: result.amount,
                                order_id: result.razorpay_order_id,
                                name: 'New Balan Pharmacy',
                                description: `Order ${result.order_reference || orderId}`,
                                handler: async (res) => {
                                    try {
                                        await verifyPayment({
                                            razorpay_payment_id: res.razorpay_payment_id,
                                            razorpay_order_id: res.razorpay_order_id,
                                            razorpay_signature: res.razorpay_signature,
                                        });
                                        navigate(`/payment-callback?orderId=${orderId}`);
                                    } catch (verifyErr) {
                                        console.error('Verify payment failed:', verifyErr);
                                        setCouponMsg({ text: verifyErr.message || 'Payment verification failed.', type: 'error' });
                                    }
                                },
                                modal: { ondismiss: () => setProcessingPayment(false) },
                            }).open();
                            setProcessingPayment(false);
                            return;
                        }
                    } catch (initErr) {
                        console.error('Razorpay initiate failed:', initErr);
                        setCouponMsg({
                            text: initErr.message || 'Payment service unavailable. Please try again or contact support.',
                            type: 'error',
                        });
                        setProcessingPayment(false);
                        return;
                    }
                }
                throw mockErr;
            }

            if (!result.order_id) {
                setCouponMsg({ text: 'Could not create order. Please try again.', type: 'error' });
                setProcessingPayment(false);
                return;
            }

            sessionStorage.setItem('payment_order_id', result.order_id);
            setMockOrderId(result.order_id);
            setMockOrderRef(result.order_reference || result.order_id);
            setMockAmount(Number(result.amount) || finalTotal);
            setShowMockPaymentScreen(true);
            setProcessingPayment(false);
        } catch (error) {
            console.error('Error creating order:', error);
            setCouponMsg({ text: `Failed to create order: ${error.message || 'Please try again.'}`, type: 'error' });
            setProcessingPayment(false);
        }
    };

    const handleMockProceed = async () => {
        if (!mockOrderId) return;
        setMockCompleting(true);
        try {
            await mockCompletePayment(mockOrderId);
            navigate(`/payment-callback?orderId=${mockOrderId}`);
        } catch (err) {
            console.error('Mock complete failed:', err);
            setCouponMsg({ text: err.message || 'Could not complete order. Please try again.', type: 'error' });
        } finally {
            setMockCompleting(false);
        }
    };

    // Mock payment screen (instead of Razorpay)
    if (showMockPaymentScreen) {
        return (
            <div className="checkout-page animate-fade mock-payment-screen">
                <div className="container">
                    <div className="mock-payment-card">
                        <h2 className="mock-payment-title">Complete your order</h2>
                        <p className="mock-payment-desc">Order has been created. Click Proceed to confirm and save.</p>
                        <div className="mock-payment-details">
                            <div className="mock-payment-row">
                                <span>Order reference</span>
                                <strong>{mockOrderRef}</strong>
                            </div>
                            <div className="mock-payment-row mock-payment-total">
                                <span>Amount to pay</span>
                                <strong>₹{mockAmount.toFixed(2)}</strong>
                            </div>
                        </div>
                        <div className="mock-payment-actions">
                            <button
                                type="button"
                                className="btn-mock-back"
                                onClick={() => { setShowMockPaymentScreen(false); setMockOrderId(null); }}
                                disabled={mockCompleting}
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                            <button
                                type="button"
                                className="btn-place-order"
                                onClick={handleMockProceed}
                                disabled={mockCompleting}
                            >
                                {mockCompleting ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
                                        Completing...
                                    </>
                                ) : (
                                    'Proceed'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page animate-fade">
            <div className="container">
                <button className="back-link" onClick={() => navigate('/pharmacy')}>
                    <ArrowLeft size={20} /> Back to Pharmacy
                </button>

                <h1 className="checkout-main-title">Checkout & Delivery</h1>

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
                                    <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
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

                            {cartRequiresPrescription && (
                                <>
                                    <h3 className="checkout-section-title checkout-section-divider">
                                        <FileText size={20} /> Prescription (required)
                                    </h3>
                                    <p className="checkout-label" style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem' }}>
                                        Your cart has prescription-only items. Please upload a clear image or PDF of your prescription.
                                    </p>
                                    <PrescriptionUpload
                                        maxSizeMB={5}
                                        onUploadSuccess={(data) => setPrescriptionId(data.prescriptionId || data.id)}
                                        onUploadError={() => setPrescriptionId(null)}
                                    />
                                    {prescriptionId && (
                                        <p style={{ fontSize: '0.85rem', color: '#22c55e', marginTop: '0.5rem', fontWeight: 600 }}>
                                            Prescription attached. It will be sent with your order.
                                        </p>
                                    )}
                                </>
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
                                                    onClick={() => item.quantity <= 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.quantity - 1)}
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>
                                                <span className="checkout-qty-value">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    className="checkout-qty-btn"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    aria-label="Increase quantity"
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

                            <div className="summary-totals">
                                <div className="summary-row">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Delivery Fee</span>
                                    <span className="delivery-fee">{deliverySettings.is_enabled !== false ? '₹40.00' : 'Free'}</span>
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
                                    disabled={processingPayment}
                                >
                                    {processingPayment ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" style={{ marginRight: '8px' }} />
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

        </div >
    );
};

export default Checkout;
