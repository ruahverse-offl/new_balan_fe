import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CartContent from '../components/common/CartContent';
import './CartPage.css';

const CartPage = () => {
    return (
        <div className="cart-page animate-fade">
            <div className="cart-page-header">
                <div className="container">
                    <Link to="/pharmacy" className="back-to-shop">
                        <ArrowLeft size={20} />
                        <span>Continue Shopping</span>
                    </Link>
                    <h1>Shopping Cart</h1>
                </div>
            </div>
            <div className="container cart-page-container">
                <CartContent />
            </div>
        </div>
    );
};

export default CartPage;
