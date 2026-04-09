import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaffRoleCode } from '../utils/roles';
import { Lock, Mail, AlertCircle, ArrowRight, User, Phone, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/new_balan_logo.png';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, isLoading } = useAuth();

    // Get the intended destination from location state (set by ProtectedRoute)
    const from = location.state?.from?.pathname || '/';

    // Mode: 'login' or 'register'
    const [mode, setMode] = useState('login');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        city: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mode === 'login') {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                const role = (result.role || '').toUpperCase();
                if (isStaffRoleCode(role)) {
                    navigate('/admin', { replace: true });
                } else {
                    navigate(from, { replace: true });
                }
            } else {
                setError(result.message || 'Invalid credentials');
            }
        } else {
            if (!formData.name?.trim()) {
                setError('Full name is required');
                return;
            }
            if (!formData.email?.trim()) {
                setError('Email is required');
                return;
            }
            if (!formData.password || formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (!formData.phone?.trim()) {
                setError('Phone number is required');
                return;
            }
            if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
                setError('Please enter a valid 10-digit phone number');
                return;
            }
            const result = await register(formData);
            if (result.success) {
                navigate('/profile');
            } else {
                setError(result.message || 'Registration failed');
            }
        }
    };

    return (
        <div className="login-page animate-fade">
            <Link to="/" className="login-brand">
                <img src={logo} alt="New Balan Medical" className="login-brand-logo" />
                <div className="login-brand-text">
                    <span className="login-brand-name">NEW BALAN</span>
                    <span className="login-brand-sub">Medical & Clinic</span>
                </div>
            </Link>
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">
                        {mode === 'login' ? <Lock size={28} /> : <User size={28} />}
                    </div>
                    <h2>{mode === 'login' ? 'Welcome Back!' : 'Create Account'}</h2>
                    <p>{mode === 'login' ? 'Login to your account' : 'Join us for a healthy lifestyle'}</p>
                </div>

                {error && (
                    <div className="login-error-alert">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    {mode === 'register' && (
                        <>
                            <div className="form-group">
                                <label className="input-label">Full Name</label>
                                <div className="input-with-icon">
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                        className="styled-input"
                                    />
                                    <User size={18} className="input-icon" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="input-label">Phone Number</label>
                                <div className="input-with-icon">
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 XXXXXXXXXX"
                                        className="styled-input"
                                    />
                                    <Phone size={18} className="input-icon" />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="input-label">Email Address</label>
                        <div className="input-with-icon">
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="styled-input"
                            />
                            <Mail size={18} className="input-icon" />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                        <label className="input-label">Password</label>
                        <div className="password-input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="styled-input"
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={isLoading} className="login-submit-btn">
                        {isLoading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>

                    <div className="login-switch">
                        <p>
                            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                            <button
                                type="button"
                                className="login-switch-btn"
                                onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}
                            >
                                {mode === 'login' ? 'Create one' : 'Login here'}
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
