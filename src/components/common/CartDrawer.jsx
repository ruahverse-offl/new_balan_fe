import React, { useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import CartContent from './CartContent';
import './CartDrawer.css';

const CartDrawer = () => {
    const { isCartOpen, setIsCartOpen } = useCart();

    // Close on Escape key
    useEffect(() => {
        if (!isCartOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsCartOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isCartOpen, setIsCartOpen]);

    if (!isCartOpen) return null;

    return (
        <>
            <div className={`cart-drawer-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}></div>
            <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
                <CartContent closeCart={() => setIsCartOpen(false)} isDrawer={true} />
            </div>
        </>
    );
};

export default CartDrawer;
