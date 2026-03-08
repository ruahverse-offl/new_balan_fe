import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, User, Pill } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { isStaffUser } from '../../utils/roles';
import './Navbar.css';

import logo from '../../assets/new_balan_logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isStaff = isStaffUser(user);

  // Full site navigation for everyone (guests, customers, staff)
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Clinic', path: '/clinic' },
    { name: 'Polyclinic', path: '/polyclinic' },
    { name: 'Pharmacy', path: '/pharmacy' },
    { name: 'Insurance', path: '/insurance' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    // Staff get an extra link to the admin dashboard
    ...(isAuthenticated && isStaff ? [{ name: 'Dashboard', path: '/admin' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  // Helper to determine where the profile link goes
  const getProfilePath = () => {
    return isStaff ? '/admin' : '/profile';
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-content">
        {/* Logo Section */}
        <Link to="/" className="logo">
          <img src={logo} alt="New Balan Medical" className="navbar-logo-img" />
          <div className="logo-text">
            <span className="logo-main">NEW BALAN</span>
            <span className="logo-sub">Medical & Clinic</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-links desktop-only">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions (Cart, Login/Profile) - visible for everyone including staff */}
        <div className="nav-actions desktop-only">
          <Link to="/pharmacy" className="pharmacy-cta">
            <Pill size={18} />
            <span>Order Medicines</span>
          </Link>

          <Link to="/cart" className="cart-nav-btn" aria-label="Open Cart">
            <ShoppingCart size={20} />
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </Link>

          {isAuthenticated ? (
            <Link to={getProfilePath()} className="profile-nav-btn" title={isStaff ? 'Dashboard' : 'My Profile'}>
              <User size={18} />
              <span className="profile-text">{isStaff ? 'Dashboard' : 'Profile'}</span>
            </Link>
          ) : (
            <Link to="/login" className="login-nav-btn">
              <User size={18} />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Group (Menu, User, Cart) - visible on small screens */}
        <div className="mobile-actions">
          {/* Menu Toggle */}
          <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Login/Profile Button */}
          {isAuthenticated ? (
            <Link to={getProfilePath()} className="login-btn mobile" title={isStaff ? 'Dashboard' : 'My Profile'}>
              <User size={20} />
            </Link>
          ) : (
            <Link to="/login" className="login-btn mobile login-btn-text" title="Login">
              <User size={18} />
              <span className="login-text-mobile">Login</span>
            </Link>
          )}

          {/* Cart - visible for everyone including staff */}
          <Link to="/cart" className="cart-nav-btn mobile" aria-label="Open Cart">
            <ShoppingCart size={22} />
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </Link>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`mobile-link ${isActive(link.path) ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            {link.name}
          </Link>
        ))}

        <div style={{ borderTop: '1px solid #eee', margin: '1rem 0' }}></div>

        {isAuthenticated ? (
          <Link to={getProfilePath()} className="mobile-link" onClick={() => setIsOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} /> {isStaff ? 'Dashboard' : (user?.name?.split(' ')[0] || 'Profile')}
          </Link>
        ) : (
          <Link to="/login" className="mobile-link" onClick={() => setIsOpen(false)}>
            Login
          </Link>
        )}

        <Link to="/pharmacy" className="mobile-cta" onClick={() => setIsOpen(false)}>
          Order Medicines
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
