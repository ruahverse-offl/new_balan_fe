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

    /**
     * Add a line or increase quantity. Pass `{ quantity: n }` to add more than one unit at once
     * (e.g. brand modal). Quantity is always capped by `product.maxStock` when set.
     *
     * @param {object} product - Cart line (must include stable `id` per SKU / medicine–brand line)
     * @param {{ quantity?: number }} [opts]
     */
    const addToCart = (product, opts = {}) => {
        const raw = opts.quantity;
        const addUnits =
            raw != null && Number.isFinite(Number(raw)) ? Math.max(1, Math.floor(Number(raw))) : 1;
        const maxStock =
            product.maxStock != null && product.maxStock !== undefined
                ? Number(product.maxStock)
                : null;
        const cap =
            maxStock != null && !Number.isNaN(maxStock) && maxStock >= 0 ? maxStock : null;

        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                if (cap != null && existing.quantity >= cap) {
                    return prev;
                }
                const nextQty =
                    cap != null ? Math.min(existing.quantity + addUnits, cap) : existing.quantity + addUnits;
                if (nextQty === existing.quantity) {
                    return prev;
                }
                return prev.map((item) =>
                    item.id === product.id
                        ? {
                              ...item,
                              ...product,
                              quantity: nextQty,
                              maxStock: maxStock ?? item.maxStock,
                          }
                        : item
                );
            }
            const firstQty = cap != null ? Math.min(addUnits, cap) : addUnits;
            if (cap != null && firstQty < 1) {
                return prev;
            }
            return [...prev, { ...product, quantity: firstQty, maxStock: maxStock ?? undefined }];
        });
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    /**
     * Set line quantity. Values &lt; 1 (including 0) remove the line from the cart.
     */
    const updateQuantity = (id, quantity) => {
        const n = Math.floor(Number(quantity));
        if (!Number.isFinite(n) || n < 1) {
            removeFromCart(id);
            return;
        }
        setCart((prev) =>
            prev.map((item) => {
                if (item.id !== id) return item;
                const max = item.maxStock != null ? Number(item.maxStock) : null;
                if (max != null && !Number.isNaN(max)) {
                    return { ...item, quantity: Math.min(n, max) };
                }
                return { ...item, quantity: n };
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
