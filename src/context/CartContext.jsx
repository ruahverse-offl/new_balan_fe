/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

const CartContext = createContext();

const CART_STORAGE_KEY = 'nb_cart';

const loadCartFromStorage = () => {
    try {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(loadCartFromStorage);

    // Persist cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product) => {
        const maxStock =
            product.maxStock != null && product.maxStock !== undefined
                ? Number(product.maxStock)
                : null;
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (maxStock != null && !Number.isNaN(maxStock) && existing.quantity >= maxStock) {
                    return prev;
                }
                const nextQty =
                    maxStock != null && !Number.isNaN(maxStock)
                        ? Math.min(existing.quantity + 1, maxStock)
                        : existing.quantity + 1;
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, ...product, quantity: nextQty, maxStock: maxStock ?? item.maxStock }
                        : item
                );
            }
            const firstQty =
                maxStock != null && !Number.isNaN(maxStock) ? Math.min(1, Math.max(0, maxStock)) : 1;
            if (maxStock != null && firstQty < 1) {
                return prev;
            }
            return [...prev, { ...product, quantity: firstQty, maxStock: maxStock ?? undefined }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateQuantity = (id, quantity) => {
        if (quantity < 1) return removeFromCart(id);
        setCart(prev =>
            prev.map(item => {
                if (item.id !== id) return item;
                const max = item.maxStock != null ? Number(item.maxStock) : null;
                if (max != null && !Number.isNaN(max)) {
                    return { ...item, quantity: Math.min(quantity, max) };
                }
                return { ...item, quantity };
            })
        );
    };

    const clearCart = useCallback(() => {
        setCart([]);
        localStorage.removeItem(CART_STORAGE_KEY);
    }, []);

    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }, [cart]);

    const requiresPrescription = useMemo(() => {
        return cart.some(
            (item) =>
                item.requiresPrescription === true ||
                item.requires_prescription === true ||
                item.is_prescription_required === true
        );
    }, [cart]);

    const [isCartOpen, setIsCartOpen] = useState(false);

    const toggleCart = () => setIsCartOpen(prev => !prev);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            subtotal,
            requiresPrescription,
            isCartOpen,
            setIsCartOpen,
            toggleCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
