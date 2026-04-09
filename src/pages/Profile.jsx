import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getDoctors } from '../services/doctorsApi';
import { getOrders, getOrderById } from '../services/ordersApi';
import { changePassword } from '../services/authApi';
import { getDeliverySettings } from '../services/deliveryApi';
import { useRefreshDeliverySettingsOnFocus } from '../hooks/useRefreshDeliverySettingsOnFocus';
import { safeError } from '../utils/logger';
import { getPrescriptionFileUrl } from '../utils/prescriptionUrl';
import { getMyAddresses, createAddress, updateAddress, deleteAddress as deleteAddressApi, setDefaultAddress } from '../services/addressesApi';
import {
    User, MapPin, Phone, Mail, Calendar,
    LayoutDashboard, ShoppingBag, Users, Pill,
    LogOut, Menu, X, ChevronRight,
    Bell, Edit, CheckCircle, Package, ArrowLeft,
    Plus, Loader2,
    Save, Trash2, Star, ShoppingCart,
    Lock, Eye, EyeOff, FileText, CreditCard,
    Home, ExternalLink, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { formatOrderStatusLabel } from '../constants/orderLifecycle';
import './Profile.css';

const statusTagClass = (code) =>
    String(code || 'pending')
        .toLowerCase()
        .replace(/_/g, '-');

const Profile = () => {
    const { user, logout, updateUser } = useAuth();
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [orders, setOrders] = useState([]);
    const [deliverySettings, setDeliverySettings] = useState({ is_enabled: true });
    useRefreshDeliverySettingsOnFocus(setDeliverySettings);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [profileUpdates, setProfileUpdates] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        city: user?.city || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Pagination State
    const [ordersPage, setOrdersPage] = useState(1);

    const [showRecentOrders, setShowRecentOrders] = useState(true);

    // Order Detail State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetailLoading, setOrderDetailLoading] = useState(false);
    const [orderDetailError, setOrderDetailError] = useState('');
    const [reorderingOrderId, setReorderingOrderId] = useState(null);
    const [reorderSuccess, setReorderSuccess] = useState(null);

    // Password Change State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Addresses State
    const [addresses, setAddresses] = useState([]);
    const [addressFormVisible, setAddressFormVisible] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [addressForm, setAddressForm] = useState({
        label: '', street: '', city: '', state: '', pincode: '', country: 'India', is_default: false
    });
    const [addressSaving, setAddressSaving] = useState(false);
    const [addressError, setAddressError] = useState('');

    // Fetch addresses
    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const addressesList = await getMyAddresses();
                setAddresses(addressesList || []);
            } catch (error) {
                safeError('Error fetching addresses:', error);
                setAddresses([]);
            }
        };

        if (user && user.id !== 'admin-001') {
            fetchAddresses();
        }
    }, [user]);


    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const userId = user?.id || user?.user?.id;
                
                const [doctorsResponse, ordersResponse, settings] = await Promise.all([
                    getDoctors({ is_active: true, limit: 100 }).catch(() => ({ items: [] })),
                    userId ? getOrders({ limit: 100 }).catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
                    getDeliverySettings().catch(() => ({ is_enabled: true }))
                ]);

                setDoctors(doctorsResponse.items || []);
                
                // Filter orders for current user and map backend fields
                const userOrdersList = (ordersResponse.items || [])
                    .filter(order => order.customer_id === userId)
                    .map(order => ({
                        ...order,
                        status: order.order_status || order.status || 'PENDING',
                        date: order.created_at ? new Date(order.created_at).toISOString().split('T')[0] : (order.date || new Date().toISOString().split('T')[0]),
                        total: order.final_amount || order.total_amount || order.total || 0,
                    }));
                setOrders(userOrdersList);
                
                setDeliverySettings(settings);
            } catch (error) {
                console.error('Error fetching profile data:', error);
            } finally {
                setLoading(false);
            }
        };
        
        if (user) {
            fetchData();
        }
    }, [user]);

    // Sync state with user data when user changes
    React.useEffect(() => {
        if (user) {
            setProfileUpdates({
                name: user.name || user.full_name || '',
                email: user.email || '',
                phone: user.phone || user.mobile_number || '',
                city: user.city || ''
            });
        }
    }, [user]);

    // Derived Data for User - orders are already filtered by user ID
    const userOrders = orders;

    const stats = [
        { label: 'Total Orders', value: userOrders.length, icon: <Package size={24} />, color: '#3b82f6', bg: '#eff6ff' },
        { label: 'Available Doctors', value: doctors.length, icon: <Users size={24} />, color: '#f59e0b', bg: '#fffbeb' },
    ];

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 'profile', label: 'My Profile', icon: <User size={20} /> },
        { id: 'addresses', label: 'My Addresses', icon: <MapPin size={20} /> },
        { id: 'orders', label: 'My Orders', icon: <ShoppingBag size={20} /> },
    ];


    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        const result = await updateUser(profileUpdates);
        if (result.success) {
            alert('Profile updated successfully!');
        } else {
            alert('Failed to update profile: ' + result.message);
        }
        setIsSaving(false);
    };

    // Order Detail Handler
    const handleViewOrderDetail = async (orderId) => {
        setOrderDetailLoading(true);
        setOrderDetailError('');
        try {
            const orderData = await getOrderById(orderId);
            setSelectedOrder(orderData);
        } catch (error) {
            safeError('Error fetching order details:', error);
            setOrderDetailError(error.message || 'Failed to load order details');
        } finally {
            setOrderDetailLoading(false);
        }
    };

    const handleBackToOrders = () => {
        setSelectedOrder(null);
        setOrderDetailError('');
    };

    // Invoice Download Handler
    const handleDownloadInvoice = () => {
        if (!selectedOrder) return;

        const detail = selectedOrder;
        const orderItems = detail.items || detail.order_items || [];
        const subtotal = parseFloat(detail.total_amount || detail.total || 0);
        const discount = parseFloat(detail.discount_amount || detail.discount || 0);
        const deliveryFee = parseFloat(detail.delivery_fee || detail.delivery_charge || 0);
        const finalAmount = parseFloat(detail.final_amount || detail.grand_total || (subtotal - discount + deliveryFee));
        const orderDate = detail.created_at || detail.date || detail.order_date;
        const formattedInvoiceDate = orderDate
            ? new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';

        const customerName = detail.customer_name || user?.name || user?.full_name || 'N/A';
        const customerPhone = detail.customer_phone || user?.phone || user?.mobile_number || 'N/A';
        const deliveryAddress = detail.delivery_address
            || (detail.address ? [detail.address.address_line1, detail.address.address_line2, detail.address.city, detail.address.state, detail.address.pincode].filter(Boolean).join(', ') : '')
            || 'N/A';
        const paymentMethod = detail.payment_method || detail.payment_type || 'N/A';
        const orderId = (detail.id || '').toString().slice(-6);

        const itemRows = orderItems.map((item, idx) => {
            const name = item.medicine_name || item.product_name || item.name || `Item #${(item.medicine_id || item.product_id || '').toString().slice(-6)}`;
            const qty = item.quantity || 0;
            const unitPrice = parseFloat(item.unit_price || item.price || 0);
            const totalPrice = parseFloat(item.total_price || item.subtotal || (qty * unitPrice));
            return `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${idx + 1}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${name}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${qty}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">&#8377;${unitPrice.toFixed(2)}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">&#8377;${totalPrice.toFixed(2)}</td>
            </tr>`;
        }).join('');

        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice - Order #${orderId}</title>
<style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #1e293b; background: #fff; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .invoice-header { background: #0f766e; color: #fff; padding: 24px 32px; }
    .invoice-header h1 { margin: 0 0 4px; font-size: 22px; }
    .invoice-header p { margin: 0; opacity: 0.85; font-size: 13px; }
    .invoice-body { padding: 24px 32px; }
    .info-grid { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .info-block { flex: 1; min-width: 200px; }
    .info-block h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
    .info-block p { margin: 0; font-size: 14px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #f1f5f9; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; text-align: left; }
    thead th:first-child, thead th:nth-child(3) { text-align: center; }
    thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    .summary-table { width: 300px; margin-left: auto; }
    .summary-table td { padding: 6px 0; font-size: 14px; }
    .summary-table .total-row td { border-top: 2px solid #1e293b; padding-top: 10px; font-weight: 700; font-size: 16px; }
    .invoice-footer { text-align: center; padding: 16px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
    @media print { body { padding: 0; } .invoice-container { border: none; } }
</style>
</head>
<body>
<div class="invoice-container">
    <div class="invoice-header">
        <h1>New Balan Medical &amp; Clinic</h1>
        <p>Invoice / Receipt</p>
    </div>
    <div class="invoice-body">
        <div class="info-grid">
            <div class="info-block">
                <h4>Invoice Date</h4>
                <p>${formattedInvoiceDate}</p>
            </div>
            <div class="info-block">
                <h4>Order ID</h4>
                <p>#${orderId}</p>
            </div>
            <div class="info-block">
                <h4>Payment Method</h4>
                <p>${paymentMethod}</p>
            </div>
        </div>
        <div class="info-grid">
            <div class="info-block">
                <h4>Customer</h4>
                <p>${customerName}</p>
                <p>${customerPhone}</p>
            </div>
            <div class="info-block">
                <h4>Delivery Address</h4>
                <p>${deliveryAddress}</p>
            </div>
        </div>
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemRows || '<tr><td colspan="5" style="padding:12px;text-align:center;color:#94a3b8;">No items</td></tr>'}
            </tbody>
        </table>
        <table class="summary-table">
            <tbody>
                <tr>
                    <td>Subtotal</td>
                    <td style="text-align:right;">&#8377;${subtotal.toFixed(2)}</td>
                </tr>
                ${discount > 0 ? `<tr>
                    <td style="color:#16a34a;">Discount</td>
                    <td style="text-align:right;color:#16a34a;">-&#8377;${discount.toFixed(2)}</td>
                </tr>` : ''}
                <tr>
                    <td>Delivery Fee</td>
                    <td style="text-align:right;">${deliveryFee > 0 ? `&#8377;${deliveryFee.toFixed(2)}` : 'Free'}</td>
                </tr>
                <tr class="total-row">
                    <td>Final Amount</td>
                    <td style="text-align:right;">&#8377;${finalAmount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="invoice-footer">
        Thank you for your purchase! &mdash; New Balan Medical &amp; Clinic
    </div>
</div>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_Order_${orderId}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleReorder = async (e, orderId) => {
        e.stopPropagation(); // Prevent row click from opening detail view
        setReorderingOrderId(orderId);
        setReorderSuccess(null);
        try {
            const orderData = await getOrderById(orderId);
            const items = orderData.items || orderData.order_items || [];
            if (items.length === 0) {
                setReorderingOrderId(null);
                return;
            }
            for (const item of items) {
                const product = {
                    id: item.medicine_id || item.product_id || item.id,
                    name: item.medicine_name || item.product_name || item.name || 'Unknown Item',
                    price: parseFloat(item.unit_price || item.price || 0),
                    requiresPrescription: item.requires_prescription || false,
                };
                for (let i = 0; i < (item.quantity || 1); i++) {
                    addToCart(product);
                }
            }
            setReorderSuccess(orderId);
            setTimeout(() => {
                setReorderSuccess(null);
                navigate('/cart');
            }, 1000);
        } catch (error) {
            safeError('Error reordering:', error);
        } finally {
            setReorderingOrderId(null);
        }
    };

    // Password Change Handler
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        // Validation
        if (passwordForm.newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match' });
            return;
        }
        if (passwordForm.currentPassword === passwordForm.newPassword) {
            setPasswordMessage({ type: 'error', text: 'New password must be different from current password' });
            return;
        }

        setPasswordChanging(true);
        try {
            await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 5000);
        } catch (error) {
            setPasswordMessage({ type: 'error', text: error.message || 'Failed to change password' });
        } finally {
            setPasswordChanging(false);
        }
    };

    if (!user) return <div className="loading-screen">Loading...</div>;
    
    if (loading) {
        return (
            <div className="loading-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Loader2 size={32} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '1rem' }}>Loading profile data...</p>
            </div>
        );
    }

    // Address handlers
    const handleAddressFormChange = (e) => {
        setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();
        setAddressSaving(true);
        setAddressError('');
        try {
            if (editingAddress) {
                await updateAddress(editingAddress.id, addressForm);
            } else {
                await createAddress(addressForm);
            }
            const updated = await getMyAddresses();
            setAddresses(updated || []);
            setAddressFormVisible(false);
            setEditingAddress(null);
            setAddressForm({ label: '', street: '', city: '', state: '', pincode: '', country: 'India', is_default: false });
        } catch (error) {
            setAddressError(error.message || 'Failed to save address');
        } finally {
            setAddressSaving(false);
        }
    };

    const handleEditAddress = (addr) => {
        setEditingAddress(addr);
        setAddressForm({
            label: addr.label || '',
            street: addr.street,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            country: addr.country || 'India',
            is_default: addr.is_default,
        });
        setAddressFormVisible(true);
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await deleteAddressApi(addressId);
            setAddresses(addresses.filter(a => a.id !== addressId));
        } catch (error) {
            alert('Failed to delete address: ' + (error.message || ''));
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            await setDefaultAddress(addressId);
            const updated = await getMyAddresses();
            setAddresses(updated || []);
        } catch (error) {
            alert('Failed to set default: ' + (error.message || ''));
        }
    };

    const renderSection = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="section-content animate-fade">
                        <div className="stats-grid">
                            {stats.map((stat, i) => (
                                <div key={i} className="stat-card">
                                    <div className="stat-icon" style={{ backgroundColor: stat.bg, color: stat.color }}>
                                        {stat.icon}
                                    </div>
                                    <div className="stat-info">
                                        <h3>{stat.value}</h3>
                                        <p>{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="section-card" style={{ marginBottom: '1.25rem' }}>
                            <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                                <h3>
                                    <Truck size={20} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
                                    Delivery
                                </h3>
                            </div>
                            <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted, #64748b)', fontSize: '0.95rem' }}>
                                {deliverySettings.delivery_schedule?.customer_message ||
                                    (deliverySettings.is_enabled === false
                                        ? 'Home delivery is turned off. Contact the store for options.'
                                        : 'Orders are accepted online; delivery follows store timings.')}
                            </p>
                            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                                Status:{' '}
                                {deliverySettings.is_enabled === false ? (
                                    <span style={{ color: '#b91c1c' }}>Off</span>
                                ) : (
                                    <span style={{ color: '#15803d' }}>On</span>
                                )}
                            </p>
                            {deliverySettings.is_enabled !== false &&
                                Array.isArray(deliverySettings.delivery_slot_times) &&
                                deliverySettings.delivery_slot_times.length > 0 && (
                                    <div>
                                        <p style={{ margin: '0.5rem 0 0.35rem', fontWeight: 600, fontSize: '0.9rem' }}>
                                            Scheduled windows (IST)
                                        </p>
                                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                                            {deliverySettings.delivery_slot_times
                                                .filter((s) => s && s.is_active !== false && (s.slot_time || s.time))
                                                .map((s, i) => (
                                                    <li key={i}>{s.slot_time || s.time}</li>
                                                ))}
                                        </ul>
                                        {deliverySettings.delivery_schedule?.fulfillment_date_iso &&
                                            deliverySettings.delivery_schedule?.slot_label && (
                                                <p style={{ marginTop: '0.65rem', fontSize: '0.88rem', color: 'var(--text-muted, #64748b)' }}>
                                                    If you order now, the next scheduled window is{' '}
                                                    <strong>{deliverySettings.delivery_schedule.slot_label}</strong>
                                                    {deliverySettings.delivery_schedule.fulfillment_date_iso
                                                        ? ` (${deliverySettings.delivery_schedule.fulfillment_date_iso})`
                                                        : ''}
                                                    .
                                                </p>
                                            )}
                                    </div>
                                )}
                        </div>

                        <div className="dashboard-grid">
                            {showRecentOrders && (
                                <div className="recent-orders section-card">
                                    <div className="card-header">
                                        <h3>Recent Orders</h3>
                                        <div className="card-header-actions">
                                            <button onClick={() => setActiveTab('orders')} className="text-btn">View All</button>
                                            <button onClick={() => setShowRecentOrders(false)} className="close-recent-orders"><X size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="mini-list">
                                        {userOrders.slice(0, 5).map(order => (
                                            <div key={order.id} className="mini-item">
                                                <div className="item-icon"><Package size={18} /></div>
                                                <div className="item-details">
                                                    <p className="item-title">Order #{order.id.toString().slice(-6)}</p>
                                                    <p className="item-sub">{order.date}</p>
                                                </div>
                                                <span className={`status-tag ${statusTagClass(order.status)}`}>{formatOrderStatusLabel(order.status)}</span>
                                            </div>
                                        ))}
                                        {userOrders.length === 0 && <p className="empty-msg">No recent orders found.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 'profile':
                return (
                    <div className="section-card animate-slide-up">
                        {/* Profile Header Card */}
                        <div className="profile-header-card">
                            <div className="profile-avatar-large">
                                {(user?.name || user?.full_name) ? (user.name || user.full_name).charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="profile-header-info">
                                <h2>{user?.name || user?.full_name || 'User'}</h2>
                                <p><Mail size={14} /> {user?.email || 'No email set'}</p>
                                {(user?.phone || user?.mobile_number) && <p><Phone size={14} /> {user.phone || user.mobile_number}</p>}
                            </div>
                        </div>

                        <h2 className="section-title"><Edit size={20} /> Edit Profile</h2>
                        <form onSubmit={handleProfileUpdate} className="profile-form">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><User size={14} /> Full Name</label>
                                    <input type="text" value={profileUpdates.name} onChange={e => setProfileUpdates({ ...profileUpdates, name: e.target.value })} placeholder="John Doe" />
                                </div>
                                <div className="form-group">
                                    <label><Mail size={14} /> Email Address</label>
                                    <input type="email" value={profileUpdates.email} onChange={e => setProfileUpdates({ ...profileUpdates, email: e.target.value })} placeholder="john@example.com" />
                                </div>
                                <div className="form-group">
                                    <label><Phone size={14} /> Phone Number</label>
                                    <input type="tel" value={profileUpdates.phone} onChange={e => setProfileUpdates({ ...profileUpdates, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
                                </div>
                                <div className="form-group">
                                    <label><MapPin size={14} /> City</label>
                                    <input type="text" value={profileUpdates.city} onChange={e => setProfileUpdates({ ...profileUpdates, city: e.target.value })} placeholder="Chennai" />
                                </div>
                            </div>
                            <button type="submit" className="save-btn" disabled={isSaving}>
                                {isSaving ? <><Loader2 size={16} className="spinning" /> Saving...</> : <><Save size={16} /> Save Changes</>}
                            </button>
                        </form>

                        {/* Change Password Section */}
                        <div className="password-section">
                            <div className="password-section-header">
                                <div className="password-icon-box"><Lock size={20} /></div>
                                <div>
                                    <h3>Change Password</h3>
                                    <p>Update your account password</p>
                                </div>
                            </div>

                            {passwordMessage.text && (
                                <div className={`message ${passwordMessage.type}`}>
                                    {passwordMessage.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
                                    {passwordMessage.text}
                                </div>
                            )}

                            <form onSubmit={handlePasswordChange} className="profile-form">
                                <div className="form-group">
                                    <label><Lock size={14} /> Current Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                            required
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)} tabIndex={-1}>
                                            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label><Lock size={14} /> New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="Min 6 characters"
                                                required
                                                minLength={6}
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}>
                                                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
                                            <p className="form-hint">Password must be at least 6 characters</p>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label><Lock size={14} /> Confirm New Password</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Re-enter new password"
                                                required
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}>
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                            <p className="form-hint">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>
                                <button type="submit" className="password-change-btn" disabled={passwordChanging}>
                                    {passwordChanging ? (
                                        <><Loader2 size={16} className="spinning" /> Changing...</>
                                    ) : (
                                        <><Lock size={16} /> Change Password</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                );

            case 'addresses':
                return (
                    <div className="section-card animate-slide-up">
                        <div className="addresses-header">
                            <h2 className="section-title" style={{ margin: 0 }}><MapPin size={20} /> My Addresses</h2>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    setEditingAddress(null);
                                    setAddressForm({ label: '', street: '', city: '', state: '', pincode: '', country: 'India', is_default: false });
                                    setAddressFormVisible(true);
                                    setAddressError('');
                                }}
                            >
                                <Plus size={16} /> Add Address
                            </button>
                        </div>

                        {addressFormVisible && (
                            <form onSubmit={handleSaveAddress} className="address-form-wrapper">
                                <h3>{editingAddress ? 'Edit Address' : 'New Address'}</h3>
                                {addressError && <div className="message error">{addressError}</div>}
                                <div className="form-group">
                                    <label>Label (optional)</label>
                                    <input type="text" name="label" placeholder="Home, Office, etc." value={addressForm.label} onChange={handleAddressFormChange} />
                                </div>
                                <div className="form-group">
                                    <label>Street Address *</label>
                                    <textarea name="street" required value={addressForm.street} onChange={handleAddressFormChange} rows="2" />
                                </div>
                                <div className="address-form-grid">
                                    <div className="form-group">
                                        <label>City *</label>
                                        <input type="text" name="city" required value={addressForm.city} onChange={handleAddressFormChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>State *</label>
                                        <input type="text" name="state" required value={addressForm.state} onChange={handleAddressFormChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>PIN Code *</label>
                                        <input type="text" name="pincode" required value={addressForm.pincode} onChange={handleAddressFormChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <select name="country" value={addressForm.country} onChange={handleAddressFormChange}>
                                            <option value="India">India</option>
                                        </select>
                                    </div>
                                </div>
                                <label className="address-checkbox-label">
                                    <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} />
                                    Set as default address
                                </label>
                                <div className="address-form-actions">
                                    <button type="submit" className="btn-primary" disabled={addressSaving}>
                                        {addressSaving ? <><Loader2 size={14} className="spinning" /> Saving...</> : (editingAddress ? 'Update' : 'Save Address')}
                                    </button>
                                    <button type="button" className="btn-cancel"
                                        onClick={() => { setAddressFormVisible(false); setEditingAddress(null); setAddressError(''); }}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {addresses.length === 0 && !addressFormVisible ? (
                            <div className="empty-state">
                                <MapPin size={48} />
                                <h3>No saved addresses yet</h3>
                                <p>Add an address to speed up your checkout.</p>
                            </div>
                        ) : (
                            <div className="address-list">
                                {addresses.map(addr => (
                                    <div key={addr.id} className={`address-card-item ${addr.is_default ? 'is-default' : ''}`}>
                                        <div className="address-card-content">
                                            <div className="address-card-label-row">
                                                <strong>{addr.label || 'Address'}</strong>
                                                {addr.is_default && <span className="default-badge">Default</span>}
                                            </div>
                                            <p className="address-card-text">
                                                {addr.street}, {addr.city}, {addr.state} - {addr.pincode}, {addr.country}
                                            </p>
                                        </div>
                                        <div className="address-card-actions">
                                            {!addr.is_default && (
                                                <button onClick={() => handleSetDefault(addr.id)} title="Set as default" className="address-action-btn set-default">
                                                    <Star size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => handleEditAddress(addr)} title="Edit" className="address-action-btn edit">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDeleteAddress(addr.id)} title="Delete" className="address-action-btn delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'orders':
                // If viewing order detail
                if (selectedOrder) {
                    const detail = selectedOrder;
                    const orderItems = detail.items || detail.order_items || [];
                    const subtotal = detail.total_amount || detail.total || 0;
                    const discount = detail.discount_amount || detail.discount || 0;
                    const deliveryFee = detail.delivery_fee || detail.delivery_charge || 0;
                    const finalAmount = detail.final_amount || detail.grand_total || (subtotal - discount + deliveryFee);
                    const orderDate = detail.created_at || detail.date || detail.order_date;
                    const formattedOrderDate = orderDate ? new Date(orderDate).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : 'N/A';

                    return (
                        <div className="animate-fade">
                            <div className="back-btn-container">
                                <button onClick={handleBackToOrders} className="back-btn">
                                    <ArrowLeft size={18} /> Back to Orders
                                </button>
                            </div>
                            <h2 className="section-title"><FileText size={22} /> Order Details</h2>

                            <div className="section-card">
                                <div className="order-detail-header">
                                    <div>
                                        <h3 className="order-detail-title">
                                            Order #{(detail.id || '').toString().slice(-6)}
                                        </h3>
                                        <p className="order-detail-date">
                                            <Calendar size={14} /> {formattedOrderDate}
                                        </p>
                                    </div>
                                    <div className="order-detail-actions">
                                        <span className={`status-tag ${statusTagClass(detail.status)}`}>
                                            {formatOrderStatusLabel(detail.status) || 'Unknown'}
                                        </span>
                                        <button onClick={handleDownloadInvoice} className="btn-primary btn-sm">
                                            <FileText size={15} /> Invoice
                                        </button>
                                    </div>
                                </div>

                                {/* Order Info Grid */}
                                <div className="order-info-grid">
                                    <div className="order-info-block">
                                        <p className="label">Payment Method</p>
                                        <p className="value"><CreditCard size={15} /> {detail.payment_method || detail.payment_type || 'N/A'}</p>
                                    </div>
                                    <div className="order-info-block">
                                        <p className="label">Delivery Address</p>
                                        <p className="value"><MapPin size={15} /> {detail.delivery_address || 'N/A'}</p>
                                    </div>
                                </div>

                                {detail.prescription_path ? (
                                    <div className="order-prescription-row" style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                                        <p className="label" style={{ marginBottom: '0.5rem' }}>Prescription</p>
                                        {(() => {
                                            const rxUrl = getPrescriptionFileUrl(detail.prescription_path);
                                            return rxUrl ? (
                                                <a
                                                    href={rxUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-btn"
                                                    style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                                >
                                                    <ExternalLink size={16} /> View uploaded prescription
                                                </a>
                                            ) : (
                                                <span style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{detail.prescription_path}</span>
                                            );
                                        })()}
                                    </div>
                                ) : null}

                                {/* Order Items Table */}
                                <h3 className="order-items-heading">
                                    <Package size={18} /> Items
                                </h3>
                                {orderItems.length > 0 ? (
                                    <div className="table-container table-container-flush">
                                        <table className="dashboard-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Medicine</th>
                                                    <th>Qty</th>
                                                    <th>Price</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orderItems.map((item, idx) => (
                                                    <tr key={item.id || idx}>
                                                        <td data-label="#">{idx + 1}</td>
                                                        <td data-label="Medicine" style={{ fontWeight: 500 }}>
                                                            {item.medicine_name || item.product_name || item.name || `Item #${(item.medicine_id || item.product_id || '').toString().slice(-6)}`}
                                                        </td>
                                                        <td data-label="Qty">{item.quantity}</td>
                                                        <td data-label="Price">{'\u20B9'}{parseFloat(item.unit_price || item.price || 0).toFixed(2)}</td>
                                                        <td data-label="Total" style={{ fontWeight: 600 }}>{'\u20B9'}{parseFloat(item.total_price || item.subtotal || (item.quantity * (item.unit_price || item.price || 0))).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p>No item details available for this order.</p>
                                    </div>
                                )}

                                {/* Order Summary */}
                                <div className="order-summary-box">
                                    <h4>Order Summary</h4>
                                    <div className="summary-row">
                                        <span>Subtotal</span>
                                        <span>{'\u20B9'}{parseFloat(subtotal).toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="summary-row discount">
                                            <span>Discount</span>
                                            <span>-{'\u20B9'}{parseFloat(discount).toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="summary-row">
                                        <span>Delivery Fee</span>
                                        <span>{deliveryFee > 0 ? `\u20B9${parseFloat(deliveryFee).toFixed(2)}` : 'Free'}</span>
                                    </div>
                                    <div className="summary-row total">
                                        <span>Final Amount</span>
                                        <span className="amount">{'\u20B9'}{parseFloat(finalAmount).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Order list view — customer-friendly cards
                const sortedOrders = [...userOrders].sort((a, b) => new Date(b.date) - new Date(a.date));
                const ordersTotalPages = Math.ceil(sortedOrders.length / 8);
                const currentOrders = sortedOrders.slice((ordersPage - 1) * 8, ordersPage * 8);

                return (
                    <div className="animate-fade">
                        <h2 className="section-title"><ShoppingBag size={22} /> My Orders</h2>

                        {orderDetailLoading && (
                            <div className="section-card loading-card">
                                <Loader2 size={24} className="spinning" />
                                <p>Loading order details...</p>
                            </div>
                        )}

                        {orderDetailError && (
                            <div className="message error">{orderDetailError}</div>
                        )}

                        {sortedOrders.length === 0 ? (
                            <div className="section-card">
                                <div className="empty-state">
                                    <ShoppingBag size={48} />
                                    <h3>No orders yet</h3>
                                    <p>Your order history will appear here after you place an order.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="order-cards-list">
                                {currentOrders.map(order => {
                                    const orderDate = new Date(order.date || order.created_at);
                                    const formattedDate = orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

                                    return (
                                        <div key={order.id} className="order-card" onClick={() => handleViewOrderDetail(order.id)}>
                                            <div className="order-card-left">
                                                <div className="order-card-icon"><Package size={20} /></div>
                                                <div className="order-card-info">
                                                    <h4>Order #{order.id.toString().slice(-6)}</h4>
                                                    <p>{formattedDate}</p>
                                                </div>
                                            </div>
                                            <div className="order-card-right">
                                                <span className={`status-tag ${statusTagClass(order.status)}`}>{formatOrderStatusLabel(order.status)}</span>
                                                <span className="order-card-amount">{'\u20B9'}{order.total}</span>
                                                <button
                                                    className={`reorder-btn ${reorderSuccess === order.id ? 'success' : ''}`}
                                                    onClick={(e) => handleReorder(e, order.id)}
                                                    disabled={reorderingOrderId === order.id}
                                                >
                                                    {reorderingOrderId === order.id ? (
                                                        <><Loader2 size={13} className="spinning" /> Reordering...</>
                                                    ) : reorderSuccess === order.id ? (
                                                        <><CheckCircle size={13} /> Added!</>
                                                    ) : (
                                                        <><ShoppingCart size={13} /> Reorder</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {ordersTotalPages > 1 && (
                            <div className="pagination-bar">
                                <button onClick={() => setOrdersPage(p => Math.max(1, p - 1))} disabled={ordersPage === 1} className="page-nav-btn">
                                    <ArrowLeft size={16} /> Prev
                                </button>
                                <div className="page-numbers">Page <span>{ordersPage}</span> of {ordersTotalPages}</div>
                                <button onClick={() => setOrdersPage(p => Math.min(ordersTotalPages, p + 1))} disabled={ordersPage === ordersTotalPages} className="page-nav-btn">
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                );




            default:
                return null;
        }
    }

    return (
        <div className="dashboard-page-wrapper">
            <div className="dashboard-layout">
                {/* Sidebar */}
                <aside className={`dashboard-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <div className="sidebar-brand">
                        <div className="brand-icon"><Pill size={24} /></div>
                        <div className="brand-name">
                            <span className="logo-main">NEW BALAN</span>
                            <span className="logo-sub">Medical & Clinic</span>
                        </div>
                        <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
                    </div>

                    {/* User Details */}
                    <div className="sidebar-user-card">
                        <div className="sidebar-user-avatar">
                            {(user?.name || user?.full_name) ? (user.name || user.full_name).charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user?.name || user?.full_name || 'User'}</span>
                            <span className="sidebar-user-email">{user?.email || ''}</span>
                            {(user?.phone || user?.mobile_number) && (
                                <span className="sidebar-user-phone"><Phone size={11} /> {user.phone || user.mobile_number}</span>
                            )}
                        </div>
                    </div>

                    <nav className="sidebar-menu">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsMobileMenuOpen(false);
                                    if (item.id !== 'orders') {
                                        setSelectedOrder(null);
                                        setOrderDetailError('');
                                    }
                                }}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <button className="menu-item back-to-site-btn" onClick={() => navigate('/')}>
                            <Home size={20} />
                            <span>Back to Website</span>
                            <ExternalLink size={14} className="external-icon" />
                        </button>
                        <button className="menu-item logout-btn" onClick={() => { logout(); navigate('/login'); }}>
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="customer-main">
                    <header className="customer-header">
                        <div className="header-left">
                            <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                                <Menu size={24} />
                            </button>

                        </div>

                        <div className="header-actions">
                            <button className="icon-btn"><Bell size={20} /></button>
                        </div>
                    </header>

                    <div className="customer-content">
                        {renderSection()}
                    </div>

                    <div className="mobile-logout-container">
                        <button className="mobile-action-logout" onClick={() => { logout(); navigate('/login'); }}>
                            <LogOut size={20} />
                            <span>Logout of Account</span>
                        </button>
                    </div>
                </main>

                {/* Mobile Sidebar Overlay */}
                {isMobileMenuOpen && (
                    <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
                )}
            </div>

            <Footer />

        </div>
    );
};

export default Profile;
