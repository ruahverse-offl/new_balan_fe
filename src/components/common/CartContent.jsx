import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { getDeliverySettings } from '../../services/deliveryApi';
import { useToast } from './Toast';
import { prodCheck } from '../../config';
import { ShoppingCart, X, Plus, Minus, Trash2, FileUp, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CartDrawer.css';

const CartContent = ({ closeCart, isDrawer = false }) => {
    const { cart, removeFromCart, updateQuantity, subtotal, clearCart, requiresPrescription, setIsCartOpen } = useCart();
    const [deliverySettings, setDeliverySettings] = useState({ is_enabled: true });
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const settings = await getDeliverySettings();
                setDeliverySettings(settings);
            } catch (error) {
                console.error('Error fetching delivery settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const isOrderAllowed = () => {
        return deliverySettings.is_enabled !== false;
    };

    const startShopping = () => {
        if (closeCart) closeCart();
        setIsCartOpen(false);
        navigate('/pharmacy');
    };

    const calculateItemTotal = (item) => {
        return (item.price * item.quantity).toFixed(2);
    };

    const handleRemoveItem = (id, name) => {
        removeFromCart(id);
        toast.info(`${name} removed from cart`);
    };

    const handleClearCart = () => {
        clearCart();
        setShowClearConfirm(false);
        toast.success('Cart cleared');
    };

    return (
        <div className={`cart-content-wrapper ${isDrawer ? '' : 'page-mode'}`}>
            <div className="cart-header">
                <div className="cart-header-content">
                    <div className="cart-title-section">
                        <ShoppingCart size={24} className="cart-title-icon" />
                        <h3>Shopping Cart</h3>
                        {cart.length > 0 && <span className="cart-count-badge">{cart.length}</span>}
                    </div>
                    <div className="cart-header-actions">
                        {cart.length > 0 && (
                            <button className="clear-cart-btn" onClick={() => setShowClearConfirm(true)}>
                                Clear All
                            </button>
                        )}
                        {isDrawer && (
                            <button className="close-cart-btn" onClick={closeCart}>
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Clear Cart Confirmation */}
            {showClearConfirm && (
                <div className="clear-confirm-banner">
                    <span>Remove all {cart.length} items from cart?</span>
                    <div className="clear-confirm-actions">
                        <button className="clear-confirm-yes" onClick={handleClearCart}>Yes, Clear</button>
                        <button className="clear-confirm-no" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="cart-items">
                {cart.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-icon">
                            <ShoppingCart size={64} />
                        </div>
                        <h3>Your cart is empty</h3>
                        <p>Add items to your cart to get started</p>
                        <button className="btn btn-primary start-shopping-btn" onClick={startShopping}>
                            <ShoppingBag size={18} />
                            <span>Start Shopping</span>
                        </button>
                    </div>
                ) : (
                    <div className="cart-items-list">
                        {cart.map(item => (
                            <div key={item.id} className="cart-item-card">
                                <div className="cart-item-image">
                                    <ShoppingBag size={28} />
                                </div>
                                <div className="cart-item-content">
                                    <div className="cart-item-header">
                                        <h4>{item.name}</h4>
                                        <button
                                            className="remove-item-btn"
                                            onClick={() => handleRemoveItem(item.id, item.name)}
                                            title="Remove item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="cart-item-price">{'\u20B9'}{item.price} per unit</div>
                                    <div className="cart-item-footer">
                                        <div className="quantity-controls">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="item-total">{'\u20B9'}{calculateItemTotal(item)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div className="cart-footer">
                    {requiresPrescription && (
                        <div className="prescription-notice">
                            <FileUp size={18} />
                            <div>
                                <strong>Prescription Required</strong>
                                <p>Some items in your cart require a prescription</p>
                            </div>
                        </div>
                    )}
                    <div className="cart-summary">
                        <div className="summary-row">
                            <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                            <span className="summary-amount">{'\u20B9'}{subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                    {prodCheck ? (
                        <button
                            className={`checkout-btn ${!isOrderAllowed() ? 'disabled' : ''}`}
                            disabled={!isOrderAllowed()}
                            onClick={() => {
                                if (closeCart) closeCart();
                                setIsCartOpen(false);
                                navigate('/checkout');
                            }}
                        >
                            {isOrderAllowed() ? (
                                <>
                                    <span>Proceed to Checkout</span>
                                    <ArrowRight size={18} />
                                </>
                            ) : (
                                'Orders Currently Closed'
                            )}
                        </button>
                    ) : (
                        <p className="delivery-note" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                            We are coming to online store soon.
                        </p>
                    )}
                    <p className="delivery-note">
                        <span>{'\uD83D\uDCE6'}</span> Home delivery available within 5km radius
                    </p>
                </div>
            )}
        </div>
    );
};

export default CartContent;
