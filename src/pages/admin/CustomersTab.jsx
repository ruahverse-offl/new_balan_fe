import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, Users, User, Phone, Mail, Calendar,
    ShoppingBag, RefreshCw, Package, CheckCircle, XCircle, Clock,
} from 'lucide-react';
import { InlineSpinner } from '../../components/common/PageLoading';
import { getCustomers, getCustomerOrders } from '../../services/customersApi';
import { formatOrderStatusLabel, orderStatusTagClass } from '../../constants/orderLifecycle';
import './AdminCatalogTabs.css';
import './CustomersTab.css';

function formatDate(ts) {
    if (!ts) return '—';
    try {
        return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return String(ts); }
}

function formatAmount(v) {
    const n = parseFloat(v);
    if (Number.isNaN(n)) return '—';
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getInitial(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
}

function isThisMonth(ts) {
    if (!ts) return false;
    const d = new Date(ts);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

const ROWS_OPTIONS = [20, 50, 100];

const CustomersTab = ({ showNotify }) => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    // Detail modal
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getCustomers({ limit: 200 });
            setCustomers(res.items || []);
        } catch {
            showNotify?.('Failed to load customers', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const counts = useMemo(() => ({
        total: customers.length,
        active: customers.filter((c) => c.is_active !== false).length,
        thisMonth: customers.filter((c) => isThisMonth(c.created_at)).length,
    }), [customers]);

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return customers;
        const q = searchTerm.trim().toLowerCase();
        return customers.filter(
            (c) =>
                (c.full_name || '').toLowerCase().includes(q) ||
                (c.mobile_number || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q),
        );
    }, [customers, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    const safePage = Math.min(page, totalPages);
    const pageItems = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

    const openCustomer = async (c) => {
        setSelectedCustomer(c);
        setOrders([]);
        setOrdersLoading(true);
        try {
            const res = await getCustomerOrders(c.id, { limit: 50 });
            setOrders(res.items || []);
        } catch {
            showNotify?.('Failed to load orders', 'error');
        } finally {
            setOrdersLoading(false);
        }
    };

    const closeCustomer = () => { setSelectedCustomer(null); setOrders([]); };

    const orderSummary = useMemo(() => {
        const delivered = orders.filter((o) => o.order_status === 'DELIVERED').length;
        const cancelled = orders.filter((o) =>
            (o.order_status || '').startsWith('CANCELLED') || o.order_status === 'DELIVERY_RETURNED'
        ).length;
        const active = orders.filter((o) =>
            !['DELIVERED', 'DELIVERY_RETURNED', 'PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(o.order_status || '') &&
            !(o.order_status || '').startsWith('CANCELLED')
        ).length;
        const totalSpend = orders
            .filter((o) => o.order_status === 'DELIVERED')
            .reduce((s, o) => s + parseFloat(o.final_amount || 0), 0);
        return { delivered, cancelled, active, totalSpend };
    }, [orders]);

    return (
        <div className="admin-table-card catalog-tab-card cust-tab-card animate-slide-up">

            {/* Header */}
            <div className="catalog-tab-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.25rem' }}>
                        <Users size={20} style={{ color: '#3b82f6' }} />
                        <h2 className="catalog-tab-title">Customers</h2>
                    </div>
                    <p className="catalog-tab-subtitle">
                        Registered customer accounts. Click a row to see their full profile and order history.
                    </p>
                </div>
                <button
                    className="aui-btn aui-btn--ghost aui-btn--sm"
                    onClick={load}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start' }}
                >
                    {loading ? <InlineSpinner size={13} /> : <RefreshCw size={13} />}
                    Refresh
                </button>
            </div>

            {/* KPI strip */}
            <div className="catalog-kpi-strip">
                <div className="catalog-kpi-card">
                    <div className="catalog-kpi-icon catalog-kpi-icon--blue">
                        <Users size={18} />
                    </div>
                    <div className="catalog-kpi-body">
                        <div className="catalog-kpi-value">{counts.total}</div>
                        <div className="catalog-kpi-label">Total</div>
                    </div>
                </div>
                <div className="catalog-kpi-card">
                    <div className="catalog-kpi-icon catalog-kpi-icon--green">
                        <CheckCircle size={18} />
                    </div>
                    <div className="catalog-kpi-body">
                        <div className="catalog-kpi-value">{counts.active}</div>
                        <div className="catalog-kpi-label">Active</div>
                    </div>
                </div>
                <div className="catalog-kpi-card">
                    <div className="catalog-kpi-icon catalog-kpi-icon--purple">
                        <Calendar size={18} />
                    </div>
                    <div className="catalog-kpi-body">
                        <div className="catalog-kpi-value">{counts.thisMonth}</div>
                        <div className="catalog-kpi-label">This month</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="catalog-tab-toolbar">
                <div className="table-search">
                    <Search size={16} aria-hidden />
                    <input
                        type="search"
                        placeholder="Search name, phone, email…"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        aria-label="Search customers"
                    />
                    {searchTerm && (
                        <button
                            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--admin-text-muted, #94a3b8)' }}
                            onClick={() => { setSearchTerm(''); setPage(1); }}
                            aria-label="Clear"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <span className="catalog-tab-meta">
                    {filtered.length} customer{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Body */}
            {loading ? (
                <div className="catalog-loading">
                    <InlineSpinner size={28} />
                    <span>Loading customers…</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="catalog-empty">
                    <Users size={42} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                    <p className="catalog-empty-title">No customers found</p>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                        {searchTerm ? 'Try adjusting your search.' : 'Customer accounts will appear here once they register.'}
                    </p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="admin-table catalog-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.map((c) => (
                                <tr key={c.id} onClick={() => openCustomer(c)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div className="cust-name-cell">
                                            <span className="cust-avatar">{getInitial(c.full_name)}</span>
                                            <div>
                                                <div className="cust-name-main">{c.full_name || '—'}</div>
                                                <div className="cust-name-email">
                                                    <Mail size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                                                    {c.email || '—'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="cust-phone">
                                        <Phone size={13} style={{ color: 'var(--admin-text-muted, #94a3b8)', marginRight: '4px', verticalAlign: 'middle' }} />
                                        {c.mobile_number || '—'}
                                    </td>
                                    <td>
                                        {c.is_active !== false
                                            ? <span className="cust-status-active">Active</span>
                                            : <span className="cust-status-inactive">Inactive</span>
                                        }
                                    </td>
                                    <td style={{ whiteSpace: 'nowrap', color: 'var(--admin-text-muted, #64748b)', fontSize: '0.8125rem' }}>
                                        {formatDate(c.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > rowsPerPage && (
                <div className="pagination-bar">
                    <div className="rows-per-page-wrap">
                        Rows
                        <select
                            value={rowsPerPage}
                            onChange={(ev) => { setRowsPerPage(Number(ev.target.value)); setPage(1); }}
                            className="rows-per-page-select"
                        >
                            {ROWS_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                        per page
                    </div>
                    <span className="pagination-page-info">Page {safePage} of {totalPages}</span>
                    <div className="pagination-controls">
                        <button className="pagination-btn" disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
                        <button className="pagination-btn" disabled={safePage === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                        <button className="pagination-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
                        <button className="pagination-btn" disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
                    </div>
                </div>
            )}

            {/* Customer detail modal */}
            {selectedCustomer && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(ev) => { if (ev.target === ev.currentTarget) closeCustomer(); }}
                >
                    <div
                        className="admin-modal cust-detail-modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="cust-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                    {getInitial(selectedCustomer.full_name)}
                                </span>
                                <h3>{selectedCustomer.full_name}</h3>
                            </div>
                            <button className="modal-close" onClick={closeCustomer} aria-label="Close"><X size={16} /></button>
                        </div>

                        <div className="modal-form">
                            {/* Profile */}
                            <div className="cust-detail-grid">
                                <div>
                                    <div className="cust-detail-label">Phone</div>
                                    <div className="cust-detail-value"><Phone size={13} />{selectedCustomer.mobile_number}</div>
                                </div>
                                <div>
                                    <div className="cust-detail-label">Email</div>
                                    <div className="cust-detail-value"><Mail size={13} />{selectedCustomer.email || '—'}</div>
                                </div>
                                <div>
                                    <div className="cust-detail-label">Joined</div>
                                    <div className="cust-detail-value" style={{ fontWeight: 400 }}>
                                        <Calendar size={13} />{formatDate(selectedCustomer.created_at)}
                                    </div>
                                </div>
                                <div>
                                    <div className="cust-detail-label">Account status</div>
                                    <div className="cust-detail-value">
                                        {selectedCustomer.is_active !== false
                                            ? <span className="cust-status-active">Active</span>
                                            : <span className="cust-status-inactive">Inactive</span>
                                        }
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border, #e2e8f0)', margin: 0 }} />

                            {/* Order summary KPIs */}
                            {!ordersLoading && orders.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <div className="catalog-kpi-card" style={{ flex: 1, minWidth: '100px' }}>
                                        <div className="catalog-kpi-icon catalog-kpi-icon--blue"><Package size={16} /></div>
                                        <div className="catalog-kpi-body">
                                            <div className="catalog-kpi-value">{orders.length}</div>
                                            <div className="catalog-kpi-label">Orders</div>
                                        </div>
                                    </div>
                                    <div className="catalog-kpi-card" style={{ flex: 1, minWidth: '100px' }}>
                                        <div className="catalog-kpi-icon catalog-kpi-icon--green"><CheckCircle size={16} /></div>
                                        <div className="catalog-kpi-body">
                                            <div className="catalog-kpi-value">{orderSummary.delivered}</div>
                                            <div className="catalog-kpi-label">Delivered</div>
                                        </div>
                                    </div>
                                    <div className="catalog-kpi-card" style={{ flex: 1, minWidth: '100px' }}>
                                        <div className="catalog-kpi-icon catalog-kpi-icon--amber"><Clock size={16} /></div>
                                        <div className="catalog-kpi-body">
                                            <div className="catalog-kpi-value">{orderSummary.active}</div>
                                            <div className="catalog-kpi-label">Active</div>
                                        </div>
                                    </div>
                                    <div className="catalog-kpi-card" style={{ flex: 1, minWidth: '100px' }}>
                                        <div className="catalog-kpi-icon catalog-kpi-icon--red"><XCircle size={16} /></div>
                                        <div className="catalog-kpi-body">
                                            <div className="catalog-kpi-value">{orderSummary.cancelled}</div>
                                            <div className="catalog-kpi-label">Cancelled</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Order history */}
                            <div>
                                <p className="cust-section-title">
                                    <ShoppingBag size={14} /> Order history
                                    {!ordersLoading && orders.length > 0 && (
                                        <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 'auto', color: 'var(--admin-text-muted)' }}>
                                            Total spend: <strong style={{ color: 'var(--admin-text-main, #0f172a)' }}>{formatAmount(orderSummary.totalSpend)}</strong>
                                        </span>
                                    )}
                                </p>
                                {ordersLoading ? (
                                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--admin-text-muted)' }}>
                                        <InlineSpinner size={20} />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="cust-orders-empty">No orders placed yet.</div>
                                ) : (
                                    <div className="cust-orders-wrap">
                                        <table className="cust-orders-table">
                                            <thead>
                                                <tr>
                                                    <th>Order ref</th>
                                                    <th>Status</th>
                                                    <th>Amount</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.map((o) => (
                                                    <tr key={o.id}>
                                                        <td>
                                                            <button
                                                                className="cust-order-ref cust-order-link"
                                                                onClick={() => navigate(`/admin/orders/${o.id}`, { state: { order: o, fromTab: 'customers' } })}
                                                            >
                                                                {o.order_reference || o.id?.slice(0, 8)}
                                                            </button>
                                                        </td>
                                                        <td>
                                                            <span className={`status-tag ${orderStatusTagClass(o.order_status)}`}>
                                                                {formatOrderStatusLabel(o.order_status)}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{formatAmount(o.final_amount)}</td>
                                                        <td style={{ whiteSpace: 'nowrap', color: 'var(--admin-text-muted, #64748b)', fontSize: '0.775rem' }}>
                                                            {formatDate(o.created_at)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="aui-btn aui-btn--ghost aui-btn--sm" onClick={closeCustomer}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersTab;
