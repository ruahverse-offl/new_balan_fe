import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { prodCheck } from '../config';
import { getDeliverySettings } from '../services/deliveryApi';
import { validateCoupon as validateCouponApi, getActiveCoupons } from '../services/couponsApi';
import { initiatePayment, verifyPayment, loadRazorpayScript } from '../services/razorpayApi';
import { getMyAddresses, createAddress } from '../services/addressesApi';
import { ShoppingBag, ArrowLeft, Loader2, Plus, MapPin } from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
    const { cart, subtotal } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [deliverySettings, setDeliverySettings] = useState({ is_enabled: true, show_marquee: true });

    const [appliedDiscount, setAppliedDiscount] = useState(0); // Discount amount in rupees
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
            setAppliedDiscount(0);
        }
    };

    const handleApplyCoupon = async () => {
        if (!formData.coupon) {
            setCouponMsg({ text: 'Please enter a coupon code', type: 'error' });
            return;
        }

        try {
            const result = await validateCouponApi(formData.coupon, subtotal);
            if (result.valid) {
                // Use discount_amount directly (in rupees)
                const discountAmount = Number(result.discount_amount) || 0;
                setAppliedDiscount(discountAmount);
                setCouponMsg({ text: result.message || `Success! ₹${discountAmount.toFixed(2)} discount applied.`, type: 'success' });
            } else {
                setAppliedDiscount(0);
                setCouponMsg({ text: result.message || 'Invalid coupon code', type: 'error' });
            }
        } catch (error) {
            setAppliedDiscount(0);
            setCouponMsg({ text: error.message || 'Failed to validate coupon', type: 'error' });
        }
    };

    const deliveryFee = deliverySettings.is_enabled !== false ? 40 : 0;
    // appliedDiscount is already in rupees (from backend validation)
    const discountAmount = appliedDiscount;
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
                coupon_code: appliedDiscount > 0 ? formData.coupon : null,
                prescription_id: null,
            };

            const result = await initiatePayment(orderData);

            if (!result.order_id || !result.razorpay_order_id || !result.key_id) {
                setCouponMsg({ text: 'Payment gateway did not return required data. Please try again.', type: 'error' });
                setProcessingPayment(false);
                return;
            }

            sessionStorage.setItem('payment_order_id', result.order_id);

            await loadRazorpayScript();

            const options = {
                key: result.key_id,
                amount: result.amount,
                currency: 'INR',
                name: 'NEW BALAN',
                description: 'Order payment',
                order_id: result.razorpay_order_id,
                prefill: {
                    name: formData.name,
                    email: (formData.email || user?.email || '').trim() || undefined,
                    contact: formData.phone,
                },
                handler: async (res) => {
                    try {
                        await verifyPayment({
                            razorpay_payment_id: res.razorpay_payment_id,
                            razorpay_order_id: res.razorpay_order_id,
                            razorpay_signature: res.razorpay_signature,
                        });
                        navigate(`/payment-callback?orderId=${result.order_id}`);
                    } catch (err) {
                        console.error('Verify payment failed:', err);
                        setCouponMsg({ text: 'Payment verification failed. Please contact support.', type: 'error' });
                        setProcessingPayment(false);
                    }
                },
                modal: { ondismiss: () => setProcessingPayment(false) },
            };

            const rz = new window.Razorpay(options);
            rz.on('payment.failed', () => {
                setCouponMsg({ text: 'Payment failed or was cancelled.', type: 'error' });
                setProcessingPayment(false);
            });
            rz.open();
        } catch (error) {
            console.error('Error initiating payment:', error);
            setCouponMsg({ text: `Failed to initiate payment: ${error.message || 'Please try again.'}`, type: 'error' });
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

                            {/* For logged-in users: Select address block (saved addresses from profile + Add address) */}
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
                                                <div
                                                    className={`address-card add-new ${showNewAddressForm ? 'selected' : ''}`}
                                                    onClick={handleAddNewAddress}
                                                >
                                                    <Plus size={20} />
                                                    <span>Add address</span>
                                                </div>
                                            </div>
                                            {selectedAddressId && !showNewAddressForm && (() => {
                                                const addr = savedAddresses.find(a => a.id === selectedAddressId);
                                                return addr ? (
                                                    <p className="checkout-delivering-to">
                                                        Delivering to: {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                                                    </p>
                                                ) : null;
                                            })()}
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

                            {/* Address form: when no saved addresses, or "Add address" chosen, or guest */}
                            {(savedAddresses.length === 0 || showNewAddressForm || !user) && !loadingAddresses && (
                                <>
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
                                        <div>
                                            <p className="summary-item-name">{item.name}</p>
                                            <p className="summary-item-qty">Qty: {item.quantity} × ₹{item.price}</p>
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
                                            {availableCoupons.map((c) => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    className="coupon-chip"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, coupon: c.code }));
                                                        setCouponMsg({ text: '', type: '' });
                                                        setAppliedDiscount(0);
                                                    }}
                                                    style={{
                                                        padding: '0.35rem 0.6rem',
                                                        borderRadius: '8px',
                                                        border: '1px solid var(--primary, #2563eb)',
                                                        background: formData.coupon?.toUpperCase() === c.code?.toUpperCase() ? 'var(--primary, #2563eb)' : 'transparent',
                                                        color: formData.coupon?.toUpperCase() === c.code?.toUpperCase() ? '#fff' : 'var(--primary, #2563eb)',
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {c.code} ({Number(c.discount) ?? 0}% off){c.firstOrderOnly ? ' · First order only' : ''}
                                                    {c.expiryDate ? ` · Valid till ${new Date(c.expiryDate).toLocaleDateString()}` : ''}
                                                </button>
                                            ))}
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
                                {appliedDiscount > 0 && (
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
