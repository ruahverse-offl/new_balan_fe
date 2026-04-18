import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { LayoutDashboard, Users, User, Pill, ShoppingCart, Search, Plus, Trash2, Check, X, Menu, Clock, MapPin, Phone, Pencil, AlertCircle, Eye, EyeOff, CheckCircle, XCircle, LogOut, Bell, Truck, Ticket, UserCheck, IndianRupee, ArrowLeft, ChevronRight, Shield, CreditCard, Tags, BarChart3, Calendar, Home, Package, Tag } from 'lucide-react';
import { PageLoading, InlineSpinner } from '../components/common/PageLoading';
import { useAuth } from '../context/AuthContext';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor as deleteDoctorApi } from '../services/doctorsApi';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine as deleteMedicineApi } from '../services/medicinesApi';
import { getOrders, updateOrder } from '../services/ordersApi';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment as deleteAppointmentApi } from '../services/appointmentsApi';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon as deleteCouponApi } from '../services/couponsApi';
import { getUsers, getUserById, createUser, updateUser as updateUserApi, deleteUser as deleteUserApi } from '../services/usersApi';
import { getDeliverySettings, updateDeliverySettings as updateDeliverySettingsApi } from '../services/deliveryApi';
import { getMarqueeSettings, updateMarqueeSettings as updateMarqueeSettingsApi } from '../services/marqueeApi';
import { getRoles } from '../services/rolesApi';
import { getKpiSummary } from '../services/kpiApi';
import { getPayments } from '../services/paymentsApi';
import { refundPayment } from '../services/razorpayApi';
import { getTherapeuticCategories, deleteTherapeuticCategory as deleteTherapeuticCategoryApi } from '../services/therapeuticCategoriesApi';
import { getCouponUsages } from '../services/couponUsagesApi';
import { getInventoryAlerts } from '../services/inventoryApi';
import { getTestBookings, createTestBooking, updateTestBooking, deleteTestBooking as deleteTestBookingApi } from '../services/testBookingsApi';
import { getPolyclinicTests } from '../services/polyclinicTestsApi';
import { buildApiUrl } from '../config/api';
import { getStorageFileUrl } from '../utils/prescriptionUrl';
import { mapDoctorToFrontend, mapDoctorToBackend, mapDoctorToBackendUpdatePayload, mapMedicineToFrontend, mapCouponToFrontend, mapCouponToBackend, mapAppointmentToFrontend, mapAppointmentToBackend, mapTestBookingToFrontend, mapTestBookingToBackend } from '../utils/dataMapper';
import { formatTimeTo12h, parseTimeToHHmm, formatTimeRangeTo24h } from '../utils/timeFormatters';
import { validateDoctorForm } from '../utils/doctorFormValidation';
import { mapBackendPermissionsToFrontend } from '../utils/permissionMapper';
import { getUserPermissions } from '../services/authApi';
import DoctorsTab from './admin/DoctorsTab';
import DoctorModalForm, { INITIAL_DOCTOR_FORM } from './admin/DoctorModalForm';
import MedicinesTab from './admin/MedicinesTab';
import OrdersTab from './admin/OrdersTab';
import AppointmentsTab from './admin/AppointmentsTab';
import DeliveryTab from './admin/DeliveryTab';
import CouponsTab from './admin/CouponsTab';
import StaffTab from './admin/StaffTab';
import TestBookingsTab from './admin/TestBookingsTab';
import PaymentsTab from './admin/PaymentsTab';
import TherapeuticCategoriesTab from './admin/TherapeuticCategoriesTab';
import CouponUsagesTab from './admin/CouponUsagesTab';
import MyProfileTab from './admin/MyProfileTab';
import OrderDetailPage from './admin/OrderDetailPage';
import MedicineCategoryRecordPage from './admin/MedicineCategoryRecordPage';
import MedicineRecordPage from './admin/MedicineRecordPage';
import InventoryOfferingRecordPage from './admin/InventoryOfferingRecordPage';
import AdminLayout from './admin/AdminLayout';
import InventoryTab from './admin/InventoryTab';
import BrandMasterTab from './admin/BrandMasterTab';
import AccessControlTab from './admin/AccessControlTab';
import DatePicker from '../components/common/DatePicker';
import TimeInput from '../components/common/TimeInput';
import './Admin.css';
import './admin/StatisticsDashboard.css';

// Simple beep sound
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Short placeholder, will replace with better if needed or use browser default logic

/** Sidebar icons: API `icon_key` matches Lucide component names */
const ADMIN_SIDEBAR_ICON_MAP = {
    LayoutDashboard,
    Users,
    Pill,
    ShoppingCart,
    Clock,
    Truck,
    Ticket,
    UserCheck,
    CreditCard,
    Tags,
    BarChart3,
    Calendar,
    Package,
    Tag,
    Shield,
};

/** Legacy permission filter when `menu_items` is absent (tab id → frontend permission key) */
const ADMIN_TAB_PERMISSION_FALLBACK = {
    dashboard: 'dashboard',
    doctors: 'doctors',
    medicines: 'medicines',
    orders: 'orders',
    'delivery-orders': 'delivery-orders',
    appointments: 'appointments',
    delivery: 'delivery',
    coupons: 'coupons',
    staff: 'staff',
    'test-bookings': 'appointments',
    payments: 'orders',
    'therapeutic-categories': 'medicines',
    'coupon-usages': 'coupons',
    inventory: 'inventory',
    'brand-master': 'medicines',
    'roles-access': 'roles-access',
};

/** Align DB `menu_tasks.code` with React tab ids (lowercase, hyphenated). Fixes Inventory etc. when API sends different casing. */
function normalizeMenuTaskCode(code) {
    if (code == null || code === '') return '';
    return String(code)
        .trim()
        .toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
}

function resolveSidebarIcon(iconKey) {
    if (iconKey == null || iconKey === '') return LayoutDashboard;
    const k = String(iconKey).trim();
    if (ADMIN_SIDEBAR_ICON_MAP[k]) return ADMIN_SIDEBAR_ICON_MAP[k];
    const titled = k.charAt(0).toUpperCase() + k.slice(1);
    return ADMIN_SIDEBAR_ICON_MAP[titled] || LayoutDashboard;
}

/**
 * Only these tab ids exist in the staff portal (`Admin.jsx` content). Anything else from
 * `M_menu_tasks` (e.g. "Home", "Polyclinic" meant for the public site) must not appear in
 * the sidebar — it would show wrong labels and `setActiveTab` would open no panel.
 */
const ADMIN_PORTAL_TAB_IDS = new Set([
    'dashboard',
    'roles-access',
    'doctors',
    'medicines',
    'therapeutic-categories',
    'inventory',
    'brand-master',
    'orders',
    'delivery-orders',
    'appointments',
    'delivery',
    'coupons',
    'staff',
    'test-bookings',
    'payments',
    'coupon-usages',
]);

function buildSidebarItemsFromMenuItems(menuItemsFromApi) {
    return (menuItemsFromApi || [])
        .map((m) => {
            const id = normalizeMenuTaskCode(m.code);
            if (!id) return null;
            if (!ADMIN_PORTAL_TAB_IDS.has(id)) return null;
            const IconComp = resolveSidebarIcon(m.icon_key);
            return {
                id,
                label: m.display_name,
                icon: <IconComp size={20} />,
                permission: ADMIN_TAB_PERMISSION_FALLBACK[id] || null,
            };
        })
        .filter(Boolean);
}

const PROFILE_NAV_ITEM = { id: 'my-profile', label: 'My Profile', icon: <User size={20} />, alwaysShow: true };

const LEGACY_SIDEBAR_TEMPLATE = [
    { id: 'dashboard', label: 'Statistics', icon: <LayoutDashboard size={20} />, menuKey: 'nav_dashboard', permission: 'dashboard' },
    { id: 'doctors', label: 'Manage Doctors', icon: <Users size={20} />, menuKey: 'nav_doctors', permission: 'doctors' },
    { id: 'medicines', label: 'Manage Medicines', icon: <Pill size={20} />, menuKey: 'nav_medicines', permission: 'medicines' },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} />, menuKey: 'nav_orders', permission: 'orders' },
    { id: 'delivery-orders', label: 'My deliveries', icon: <Truck size={20} />, menuKey: 'nav_delivery_orders', permission: 'delivery-orders' },
    { id: 'appointments', label: 'Appointments', icon: <Clock size={20} />, menuKey: 'nav_appointments', permission: 'appointments' },
    { id: 'delivery', label: 'Delivery Settings', icon: <Truck size={20} />, menuKey: 'nav_delivery', permission: 'delivery' },
    { id: 'coupons', label: 'Coupons & Marquee', icon: <Ticket size={20} />, menuKey: 'nav_coupons', permission: 'coupons' },
    { id: 'staff', label: 'Manage Staff', icon: <UserCheck size={20} />, menuKey: 'nav_staff', permission: 'staff' },
    { id: 'test-bookings', label: 'Test Bookings', icon: <Calendar size={20} />, menuKey: 'nav_test_bookings', permission: 'appointments' },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} />, menuKey: 'nav_payments', permission: 'orders' },
    { id: 'therapeutic-categories', label: 'Medicine Cat.', icon: <Tags size={20} />, menuKey: 'nav_medicine_categories', permission: 'medicines' },
    { id: 'coupon-usages', label: 'Coupon Usages', icon: <BarChart3 size={20} />, menuKey: 'nav_coupon_usages', permission: 'coupons' },
    { id: 'brand-master', label: 'Brand catalog', icon: <Tag size={20} />, menuKey: 'nav_brand_catalog', permission: 'medicines' },
].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));

function computeAvailableMenuItems(user) {
    if (!user) return [PROFILE_NAV_ITEM];

    const hasPermission = (perm) => {
        if (!user) return false;
        return user.permissions?.includes(perm);
    };

    let navigableItems;
    if (Array.isArray(user.menuItems) && user.menuItems.length > 0) {
        navigableItems = buildSidebarItemsFromMenuItems(user.menuItems);
        // API returned rows, but none were valid staff-portal tabs (e.g. only public-site junk tasks)
        if (navigableItems.length === 0) {
            navigableItems = LEGACY_SIDEBAR_TEMPLATE.filter((item) => {
                const keys = user.menuKeys;
                if (Array.isArray(keys) && keys.length > 0) {
                    return keys.some((k) => normalizeMenuTaskCode(k) === item.id) ||
                        Boolean(
                            item.menuKey &&
                                keys.some((k) => normalizeMenuTaskCode(k) === normalizeMenuTaskCode(item.menuKey)),
                        );
                }
                return !item.permission || hasPermission(item.permission);
            });
        }
    } else {
        navigableItems = LEGACY_SIDEBAR_TEMPLATE.filter((item) => {
            const keys = user.menuKeys;
            if (Array.isArray(keys) && keys.length > 0) {
                return keys.some((k) => normalizeMenuTaskCode(k) === item.id) ||
                    Boolean(
                        item.menuKey &&
                            keys.some((k) => normalizeMenuTaskCode(k) === normalizeMenuTaskCode(item.menuKey)),
                    );
            }
            return !item.permission || hasPermission(item.permission);
        });
    }

    return [...navigableItems, PROFILE_NAV_ITEM];
}

/** Convert time string (e.g. "10:00 AM" or "14:30") to HH:mm for <input type="time"> */
const timeToHHmm = (val) => {
    if (!val || typeof val !== 'string') return '';
    const t = val.trim();
    if (!t) return '';
    if (/^\d{1,2}:\d{2}(:\d{2})?\.?\d*$/.test(t)) return t.slice(0, 5);
    const match = t.match(/^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*$/i);
    if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        if (match[4].toUpperCase() === 'PM' && h !== 12) h += 12;
        if (match[4].toUpperCase() === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${m}`;
    }
    return '';
};

/** Booking time for read-only test booking modal (12h when parsable). */
const formatTestBookingDetailTime = (t) => {
    if (t == null || String(t).trim() === '') return 'N/A';
    const s = String(t).trim();
    const hhmm = parseTimeToHHmm(s);
    if (hhmm) return formatTimeTo12h(hhmm);
    if (/^\d{1,2}:\d{2}$/.test(s)) return formatTimeTo12h(s);
    return s;
};

const formatCouponDetailExpiry = (expiryDate) => {
    if (!expiryDate) return 'No expiry';
    const s = String(expiryDate).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const [y, m, d] = s.split('-').map((x) => parseInt(x, 10));
        const label = new Date(y, m - 1, d).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        return `${label} (${s})`;
    }
    try {
        return new Date(expiryDate).toLocaleString('en-IN');
    } catch {
        return String(expiryDate);
    }
};

const formatCouponDetailMinOrder = (v) => {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (Number.isNaN(n) || n <= 0) return '—';
    return `₹${n.toFixed(2)}`;
};

const formatDoctorDetailList = (value) => {
    if (value == null || value === '') return '—';
    if (Array.isArray(value)) {
        const parts = value.map((x) => String(x).trim()).filter(Boolean);
        return parts.length ? parts.join(', ') : '—';
    }
    return String(value).trim() || '—';
};

const formatDoctorDetailFee = (v) => {
    if (v == null || v === '') return '—';
    const n = Number(v);
    if (Number.isNaN(n)) return '—';
    return `₹${n.toFixed(2)}`;
};

const formatDoctorDetailSlot = (rangeStr) => {
    if (!rangeStr || typeof rangeStr !== 'string' || !rangeStr.trim()) return '—';
    return formatTimeRangeTo24h(rangeStr);
};

const formatStaffDetailTs = (v) => {
    if (v == null || v === '') return '—';
    try {
        return new Date(v).toLocaleString();
    } catch {
        return String(v);
    }
};

const Admin = () => {
    const { orderId: orderIdFromUrl } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const matchMedicineCategoryNew = useMatch({ path: '/admin/medicine-categories/new', end: true });
    const matchMedicineCategoryEdit = useMatch({ path: '/admin/medicine-categories/:categoryId/edit', end: true });
    const matchMedicineCategoryViewRaw = useMatch({ path: '/admin/medicine-categories/:categoryId', end: true });
    const matchMedicineCategoryView =
        matchMedicineCategoryViewRaw &&
        matchMedicineCategoryViewRaw.params.categoryId &&
        matchMedicineCategoryViewRaw.params.categoryId !== 'new'
            ? matchMedicineCategoryViewRaw
            : null;
    const medicineCategoryRecordMode = matchMedicineCategoryNew
        ? 'new'
        : matchMedicineCategoryEdit
          ? 'edit'
          : matchMedicineCategoryView
            ? 'view'
            : null;
    const medicineCategoryIdFromRoute =
        matchMedicineCategoryEdit?.params?.categoryId || matchMedicineCategoryView?.params?.categoryId || null;

    const matchMedicineNew = useMatch({ path: '/admin/medicines/new', end: true });
    const matchMedicineEdit = useMatch({ path: '/admin/medicines/:medicineId/edit', end: true });
    const matchMedicineViewRaw = useMatch({ path: '/admin/medicines/:medicineId', end: true });
    const matchMedicineView =
        matchMedicineViewRaw &&
        matchMedicineViewRaw.params.medicineId &&
        matchMedicineViewRaw.params.medicineId !== 'new'
            ? matchMedicineViewRaw
            : null;
    const medicineRecordMode = matchMedicineNew
        ? 'new'
        : matchMedicineEdit
          ? 'edit'
          : matchMedicineView
            ? 'view'
            : null;
    const medicineIdFromRoute =
        matchMedicineEdit?.params?.medicineId || matchMedicineView?.params?.medicineId || null;

    const matchInventoryOfferingEdit = useMatch({ path: '/admin/inventory-offerings/:medicineId/:offeringId/edit', end: true });
    const matchInventoryOfferingView = useMatch({ path: '/admin/inventory-offerings/:medicineId/:offeringId', end: true });
    const inventoryOfferingRecordMode = matchInventoryOfferingEdit
        ? 'edit'
        : matchInventoryOfferingView
          ? 'view'
          : null;
    const inventoryOfferingMedicineIdFromRoute =
        matchInventoryOfferingEdit?.params?.medicineId || matchInventoryOfferingView?.params?.medicineId || null;
    const inventoryOfferingIdFromRoute =
        matchInventoryOfferingEdit?.params?.offeringId || matchInventoryOfferingView?.params?.offeringId || null;

    /** Bumps when inventory lines are saved from full-page flows so the list refetches. */
    const [inventoryRefreshToken, setInventoryRefreshToken] = useState(0);

    const [activeTab, setActiveTab] = useState('dashboard');
    /** Mobile drawer open state. On desktop (≥1025px) the sidebar stays visible regardless (Admin.css). */
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    /** Used so aria-hidden matches visibility: drawer closed on narrow viewports = off-screen. */
    const [isNarrowViewport, setIsNarrowViewport] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia('(max-width: 1024px)').matches,
    );
    const { logout, user, updateUser } = useAuth();

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1024px)');
        const onChange = () => setIsNarrowViewport(mq.matches);
        onChange();
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);
    
    // State for all data
    const [doctors, setDoctors] = useState([]);
    const [products, setProducts] = useState([]);
    const [medicinesList, setMedicinesList] = useState([]);
    const [orders, setOrders] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [managers, setManagers] = useState([]);
    const [deliverySettings, setDeliverySettings] = useState({
        free_delivery_min_amount: 500,
        free_delivery_max_amount: '',
        delivery_fee: 40,
        is_enabled: true,
        delivery_slot_times: [],
    });
    const [marqueeSettings, setMarqueeSettings] = useState({ show_marquee: true });

    // RBAC state
    const [roles, setRoles] = useState([]);
    // New entity data
    const [testBookings, setTestBookings] = useState([]);
    const [polyclinicTests, setPolyclinicTests] = useState([]);
    const [payments, setPayments] = useState([]);
    const [therapeuticCategories, setTherapeuticCategories] = useState([]);
    const [couponUsages, setCouponUsages] = useState([]);
    const [newOrderNotification, setNewOrderNotification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchByTab, setSearchByTab] = useState({});
    const getSearchForTab = (tab) => searchByTab[tab] ?? '';
    const setSearchForTab = (tab, value) => setSearchByTab(prev => ({ ...prev, [tab]: value }));
    const [tabPermissionDenied, setTabPermissionDenied] = useState(new Set());

    /** KPI row for Statistics tab (from GET /kpi/summary) */
    const [kpiSummary, setKpiSummary] = useState(null);

    /** Low-stock alerts (GET /inventory/alerts; INVENTORY_VIEW) */
    const [inventoryAlerts, setInventoryAlerts] = useState([]);
    const [inventoryThreshold, setInventoryThreshold] = useState(10);

    // Pagination State
    const [medicinesPage, setMedicinesPage] = useState(1);
    const [medicinesPagination, setMedicinesPagination] = useState(null);
    const [medicinesRowsPerPage, setMedicinesRowsPerPage] = useState(10);
    const [medicinesLoading, setMedicinesLoading] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(10);
    const [orderStatusFilter, setOrderStatusFilter] = useState('');
    const [orderDateFilter, setOrderDateFilter] = useState('');
    const [refundLoading, setRefundLoading] = useState(false);
    const [appointmentsPage, setAppointmentsPage] = useState(1);
    const [appointmentsRowsPerPage, setAppointmentsRowsPerPage] = useState(10);
    const [doctorsPage, setDoctorsPage] = useState(1);
    const [doctorsRowsPerPage, setDoctorsRowsPerPage] = useState(10);
    const [testBookingsPage, setTestBookingsPage] = useState(1);
    const [testBookingsRowsPerPage, setTestBookingsRowsPerPage] = useState(10);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [paymentsRowsPerPage, setPaymentsRowsPerPage] = useState(10);
    const [therapeuticCategoriesPage, setTherapeuticCategoriesPage] = useState(1);
    const [therapeuticCategoriesRowsPerPage, setTherapeuticCategoriesRowsPerPage] = useState(10);
    const [couponUsagesPage, setCouponUsagesPage] = useState(1);
    const [couponUsagesRowsPerPage, setCouponUsagesRowsPerPage] = useState(10);

    // Track which tabs have been loaded
    const [loadedTabs, setLoadedTabs] = useState(new Set());

    // Read-only patient/appointment details modal (eye icon)
    const [appointmentDetails, setAppointmentDetails] = useState(null);
    const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);

    const [testBookingDetails, setTestBookingDetails] = useState(null);
    const [showTestBookingDetails, setShowTestBookingDetails] = useState(false);

    const [couponDetails, setCouponDetails] = useState(null);
    const [showCouponDetails, setShowCouponDetails] = useState(false);

    const [doctorDetails, setDoctorDetails] = useState(null);
    const [showDoctorDetails, setShowDoctorDetails] = useState(false);

    /** Manage Staff — read-only view modal { row, detail?, loading, loadError? } */
    const [staffView, setStaffView] = useState(null);

    /** Serial for in-flight doctor list fetches (search debounce) — ignore stale responses */
    const doctorsSearchFetchSeqRef = useRef(0);
    const activeTabRef = useRef(activeTab);
    activeTabRef.current = activeTab;

    // Fetch data for specific tab
    const fetchTabData = async (tab, forceReload = false) => {
        setTabPermissionDenied(prev => { const s = new Set(prev); s.delete(tab); return s; });
        // Skip if already loaded and not forcing reload
        if (!forceReload && loadedTabs.has(tab)) {
            return;
        }

        // Full-page loader only on first load of this tab — not after saves/refreshes (forceReload),
        // so the UI does not blank the whole content area on every mutation.
        const showGlobalLoading = !loadedTabs.has(tab);

        try {
            if (showGlobalLoading) {
                setLoading(true);
            }

            switch (tab) {
                case 'dashboard': {
                    const kpi = await getKpiSummary().catch((err) => {
                        if (err?.status === 403) {
                            setTabPermissionDenied(prev => new Set([...prev, 'dashboard']));
                            return null;
                        }
                        throw err;
                    });
                    setKpiSummary(kpi);
                    break;
                }
                    
                case 'doctors': {
                    const q = (getSearchForTab('doctors') || '').trim();
                    const doctorsRes = await getDoctors({ limit: 100, search: q || undefined }).catch(() => ({ items: [] }));
                    setDoctors((doctorsRes.items || []).map(mapDoctorToFrontend).filter(Boolean));
                    break;
                }
                    
                case 'medicines':
                    if (forceReload || medicinesList.length === 0) {
                        const [medsRes, catRes] = await Promise.all([
                            getMedicines({ limit: medicinesRowsPerPage || 10, offset: 0, search: getSearchForTab('medicines') || undefined }).catch(() => ({ items: [], pagination: null })),
                            getTherapeuticCategories({ limit: 100 }).catch(() => ({ items: [] }))
                        ]);
                        setMedicinesList(medsRes.items || []);
                        setMedicinesPagination(medsRes.pagination || null);
                        if ((catRes.items || []).length > 0) setTherapeuticCategories(catRes.items || []);
                    }
                    break;
                    
                case 'orders':
                case 'delivery-orders':
                    if (forceReload || orders.length === 0) {
                        const ordersRes = await getOrders({ limit: 100 }).catch(() => ({ items: [] }));
                        setOrders(ordersRes.items || []);
                    }
                    break;
                    
                case 'appointments': {
                    const [appointmentsRes, doctorsResForApt] = await Promise.all([
                        getAppointments({ limit: 100 }).catch(() => ({ items: [] })),
                        getDoctors({ limit: 100 }).catch(() => ({ items: [] }))
                    ]);
                    const mappedDoctors = (doctorsResForApt.items || []).map(mapDoctorToFrontend).filter(Boolean);
                    setDoctors(mappedDoctors);
                    setAppointments((appointmentsRes.items || []).map(a => {
                        const mapped = mapAppointmentToFrontend(a);
                        const docName = mapped.doctorName || mappedDoctors.find(d => String(d.id) === String(mapped.doctorId))?.name;
                        return { ...mapped, doctorName: docName || mapped.doctorName || '—' };
                    }));
                    break;
                }
                    
                case 'delivery':
                    if (forceReload || !deliverySettings.id) {
                        const settings = await getDeliverySettings().catch(() => ({
                            free_delivery_min_amount: 500,
                            free_delivery_max_amount: null,
                            delivery_fee: 40,
                            is_enabled: true,
                            delivery_slot_times: [],
                        }));
                        const rawSlots = settings.delivery_slot_times;
                        const slotList = Array.isArray(rawSlots)
                            ? rawSlots.map((s) => ({
                                  slot_time: s?.slot_time || s?.time || '',
                                  is_active: s?.is_active !== false,
                              }))
                            : [];
                        setDeliverySettings({
                            ...settings,
                            free_delivery_min_amount:
                                settings.free_delivery_min_amount ?? settings.free_delivery_threshold ?? 500,
                            free_delivery_max_amount:
                                settings.free_delivery_max_amount != null && settings.free_delivery_max_amount !== ''
                                    ? settings.free_delivery_max_amount
                                    : '',
                            delivery_fee:
                                settings.delivery_fee != null && settings.delivery_fee !== ''
                                    ? Number(settings.delivery_fee)
                                    : 40,
                            is_enabled: settings.is_enabled !== false,
                            delivery_slot_times: slotList,
                        });
                    }
                    break;
                    
                case 'coupons':
                    if (forceReload || coupons.length === 0) {
                        const couponsRes = await getCoupons({ limit: 100 }).catch(() => ({ items: [] }));
                        setCoupons(couponsRes.items.map(mapCouponToFrontend));
                    }
                    const ms = await getMarqueeSettings().catch(() => ({ show_marquee: true }));
                    setMarqueeSettings(ms);
                    break;
                    
                case 'staff':
                    if (forceReload || managers.length === 0) {
                        const [usersRes, rolesRes] = await Promise.all([
                            getUsers({ limit: 100 }).catch(() => ({ items: [] })),
                            roles.length === 0 ? getRoles({ limit: 100 }).catch(() => ({ items: [] })) : Promise.resolve({ items: roles })
                        ]);
                        const rolesList = roles.length === 0 && (rolesRes.items || []).length ? rolesRes.items : roles;
                        if (roles.length === 0 && (rolesRes.items || []).length) setRoles(rolesRes.items || []);
                        const customerRoleId = (rolesList || []).find(r => (r.name || '').toUpperCase() === 'CUSTOMER')?.id;
                        const staffOnly = (usersRes.items || []).filter(u => !customerRoleId || u.role_id !== customerRoleId);
                        setManagers(staffOnly.map(user => ({
                            ...user,
                            name: user.name || user.full_name || '',
                            role_id: user.role_id
                        })));
                    }
                    break;
                    
                case 'test-bookings': {
                    const [tbRes, polyRes] = await Promise.all([
                        getTestBookings({ limit: 100 }).catch(() => ({ items: [] })),
                        getPolyclinicTests({ limit: 100 }).catch(() => ({ items: [] }))
                    ]);
                    const tests = polyRes.items || [];
                    setPolyclinicTests(tests);
                    const nameByTestId = {};
                    tests.forEach(t => { if (t?.id) nameByTestId[String(t.id)] = t.name || '—'; });
                    const mapped = (tbRes.items || []).map(mapTestBookingToFrontend).filter(Boolean);
                    const enriched = mapped.map(b => ({
                        ...b,
                        test_name: b.test_name && b.test_name !== '—' ? b.test_name : (nameByTestId[String(b.test_id)] || '—')
                    }));
                    setTestBookings(enriched);
                    break;
                }
                case 'payments':
                    const payRes = await getPayments({ limit: 100 }).catch(() => ({ items: [] }));
                    setPayments(payRes.items || []);
                    break;
                case 'therapeutic-categories':
                    const tcRes = await getTherapeuticCategories({ limit: 100 }).catch(() => ({ items: [] }));
                    setTherapeuticCategories(tcRes.items || []);
                    break;
                case 'coupon-usages':
                    const cuRes = await getCouponUsages({ limit: 100 }).catch(() => ({ items: [] }));
                    setCouponUsages(cuRes.items || []);
                    break;
                case 'inventory':
                    break;
                case 'brand-master':
                    break;
            }
            
            // Mark tab as loaded
            setLoadedTabs(prev => new Set([...prev, tab]));
        } catch (error) {
            const tabStr = typeof tab === 'string' ? tab : String(tab ?? 'unknown');
            const errMsg = error?.message ?? (typeof error === 'object' && error !== null ? 'Request failed' : String(error));
            console.error('Error fetching data for', tabStr, errMsg);
            if (error?.status === 403) {
                setTabPermissionDenied(prev => new Set([...prev, tab]));
                showNotify('You don\'t have permission to view this section. Contact your administrator.', 'error');
            } else {
                showNotify(`Failed to load ${tab} data: ` + error.message, 'error');
            }
        } finally {
            if (showGlobalLoading) {
                setLoading(false);
            }
        }
    };

    /** Load roles for staff dropdowns when opening staff modals (roles admin tab removed). */
    const ensureRolesLoaded = async () => {
        if (roles.length > 0) return;
        const rolesRes = await getRoles({ limit: 100 }).catch(() => ({ items: [] }));
        setRoles(rolesRes.items || []);
    };

    // Load data when tab changes
    useEffect(() => {
        if (activeTab) {
            fetchTabData(activeTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Debounced server search when the doctors search box changes (tab load uses fetchTabData)
    useEffect(() => {
        const q = (searchByTab.doctors || '').trim();
        const handle = setTimeout(() => {
            if (activeTabRef.current !== 'doctors') return;
            const seq = ++doctorsSearchFetchSeqRef.current;
            getDoctors({ limit: 100, search: q || undefined })
                .then((doctorsRes) => {
                    if (doctorsSearchFetchSeqRef.current !== seq) return;
                    setDoctors((doctorsRes.items || []).map(mapDoctorToFrontend).filter(Boolean));
                })
                .catch(() => {});
        }, 320);
        return () => clearTimeout(handle);
    }, [searchByTab.doctors]);

    // Refresh user permissions on mount to ensure we have latest data from backend
    // Use a ref to prevent multiple calls
    const permissionsRefreshedRef = useRef(false);
    
    useEffect(() => {
        const refreshUserPermissions = async () => {
            // Only refresh once and if user exists
            if (permissionsRefreshedRef.current || !user || !user.id) {
                return;
            }
            
            permissionsRefreshedRef.current = true;
            
            try {
                const permResult = await getUserPermissions();
                const backendPermissions = permResult.permissions || [];
                const roleCode = permResult.role_code || null;
                const frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);
                const menuItems = permResult.menu_items || [];
                const menuKeys = permResult.menu_keys || menuItems.map((m) => m.code);

                // Use actual backend role instead of guessing
                const userRole = roleCode || user.backendRole || user.role || 'CUSTOMER';

                // Update user object with fresh permissions
                const updatedUser = {
                    ...user,
                    role: userRole,
                    backendRole: roleCode,
                    permissions: frontendPermissions,
                    backendPermissions: backendPermissions,
                    menuKeys,
                    menuItems,
                };

                // Update AuthContext + localStorage so sidebar/tabs update immediately.
                await updateUser(updatedUser);

                console.log('User permissions refreshed:', {
                    role: userRole,
                    backendRole: roleCode,
                    frontendPermissions,
                    backendPermissions,
                    menuKeys,
                    menuItems,
                });
            } catch (error) {
                console.warn('Failed to refresh permissions on Admin page load:', error);
                permissionsRefreshedRef.current = false; // Allow retry on error
            }
        };
        
        refreshUserPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Only run when user.id changes

    // Fetch generic medicines + therapeutic categories for the Manage Medicines tab
    const fetchMedicines = async (page = medicinesPage, search = getSearchForTab('medicines'), rowsPerPage = medicinesRowsPerPage) => {
        if (activeTab !== 'medicines') return;
        try {
            setMedicinesLoading(true);
            const offset = (page - 1) * rowsPerPage;
            const [medsRes, catRes] = await Promise.all([
                getMedicines({ limit: rowsPerPage, offset, search: search || undefined, sort_by: 'name', sort_order: 'asc' }).catch(() => ({ items: [], pagination: null })),
                getTherapeuticCategories({ limit: 100 }).catch(() => ({ items: [] }))
            ]);
            const meds = (medsRes.items || []).map(m => ({ ...m, medicine_category_name: m.medicine_category_name || '—' }));
            setMedicinesList(meds);
            setMedicinesPagination(medsRes.pagination || null);
            if ((catRes.items || []).length > 0) setTherapeuticCategories(catRes.items || []);
        } catch (error) {
            console.error('Error fetching medicines:', error?.message ?? 'Unknown error');
            setMedicinesList([]);
            setMedicinesPagination(null);
        } finally {
            setMedicinesLoading(false);
        }
    };

    // Fetch medicines with backend pagination when page, search, rows per page, or tab changes
    useEffect(() => {
        if (activeTab === 'medicines') {
            fetchMedicines();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, medicinesPage, searchByTab.medicines, medicinesRowsPerPage]);

    // Notification Sound Effect
    useEffect(() => {
        if (newOrderNotification) {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
            audio.play().catch(e => console.log("Audio play failed interaction required:", e));
        }
    }, [newOrderNotification]);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [editingId, setEditingId] = useState(null);
    const [visibleTablePasswords, setVisibleTablePasswords] = useState({});

    const [showStaffPassword, setShowStaffPassword] = useState(false);

    // Notifications state (useRef so notification ids stay unique across re-renders)
    const [notifications, setNotifications] = useState([]);
    const notificationIdRef = React.useRef(0);

    const showNotify = (message, type = 'success') => {
        const id = ++notificationIdRef.current;
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    const [doctorForm, setDoctorForm] = useState(() => ({ ...INITIAL_DOCTOR_FORM }));
    const [productForm, setProductForm] = useState({ name: '', category: 'OTC', price: '', image: '', discount: '0', requiresPrescription: false, stock: true });
    const [orderForm, setOrderForm] = useState({ customerId: '', customerName: '', phone: '', address: '', total: '', paymentMethod: 'cash' });
    const [appointmentForm, setAppointmentForm] = useState({ patientName: '', phone: '', doctorId: '', message: '', status: 'CONFIRMED', date: new Date().toISOString().slice(0, 10), time: '' });
    const [couponForm, setCouponForm] = useState({ code: '', discount: 5, isActive: true, expiryDate: '', firstOrderOnly: false });
    const [managerForm, setManagerForm] = useState({ name: '', email: '', password: '', mobile_number: '', role_id: '' });
    const [testBookingForm, setTestBookingForm] = useState({ test_id: '', patient_name: '', patient_phone: '', booking_date: '', booking_time: '', status: 'PENDING', notes: '' });

    // New entity CRUD handlers
    const refreshTherapeuticCategories = useCallback(async () => {
        try {
            const tcRes = await getTherapeuticCategories({ limit: 100 });
            setTherapeuticCategories(tcRes.items || []);
        } catch {
            /* ignore */
        }
    }, []);

    const deleteTherapeuticCategoryFn = async (id) => {
        try {
            await deleteTherapeuticCategoryApi(id);
            setTherapeuticCategories(prev => prev.filter(c => c.id !== id));
            showNotify('Category deleted', 'success');
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); }
    };
    const enrichTestBookingWithTestName = (b, testsList) => {
        const mapped = mapTestBookingToFrontend(b);
        if (!mapped) return null;
        const name = mapped.test_name && mapped.test_name !== '—'
            ? mapped.test_name
            : (testsList || []).find(t => t && String(t.id) === String(mapped.test_id))?.name;
        return { ...mapped, test_name: name || mapped.test_name || '—' };
    };

    const addTestBooking = async (data) => {
        try {
            await createTestBooking(data);
            const [tbRes, polyRes] = await Promise.all([
                getTestBookings({ limit: 100 }).catch(() => ({ items: [] })),
                getPolyclinicTests({ limit: 100 }).catch(() => ({ items: [] }))
            ]);
            setPolyclinicTests(polyRes.items || []);
            const tests = polyRes.items || [];
            const list = (tbRes.items || []).map(booking => enrichTestBookingWithTestName(booking, tests)).filter(Boolean);
            setTestBookings(list);
            showNotify('Booking added', 'success');
            return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const updateTestBookingFn = async (id, data) => {
        try {
            await updateTestBooking(id, data);
            const [tbRes, polyRes] = await Promise.all([
                getTestBookings({ limit: 100 }).catch(() => ({ items: [] })),
                getPolyclinicTests({ limit: 100 }).catch(() => ({ items: [] }))
            ]);
            setPolyclinicTests(polyRes.items || []);
            const tests = polyRes.items || [];
            const list = (tbRes.items || []).map(booking => enrichTestBookingWithTestName(booking, tests)).filter(Boolean);
            setTestBookings(list);
            showNotify('Booking updated', 'success');
            return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const deleteTestBookingFn = async (id) => {
        try {
            await deleteTestBookingApi(id);
            setTestBookings(prev => prev.filter(b => b.id !== id));
            showNotify('Booking deleted', 'success');
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); }
    };

    // Permissions logic
    const hasPermission = (perm) => {
        if (!user) return false;
        return user.permissions?.includes(perm);
    };

    const hasAnyBackendPermission = (...codes) => {
        if (!user) return false;
        const owned = new Set((user.backendPermissions || []).map((p) => String(p).toUpperCase()));
        return codes.some((code) => owned.has(String(code).toUpperCase()));
    };

    useEffect(() => {
        if (!user || !hasPermission('inventory')) return undefined;
        let cancelled = false;
        getInventoryAlerts({ limit: 40 })
            .then((res) => {
                if (!cancelled) {
                    setInventoryAlerts(res.items || []);
                    setInventoryThreshold(res.threshold ?? 10);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [user, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    // CRUD Functions
    const addDoctor = async (doctorData) => {
        try {
            const backendData = mapDoctorToBackend(doctorData);
            const created = await createDoctor(backendData);
            setDoctors([...doctors, mapDoctorToFrontend(created)]);
            showNotify('Doctor added successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to add doctor: ' + error.message, 'error');
            return false;
        }
    };

    const updateDoctorFn = async (id, doctorData) => {
        try {
            const backendData = mapDoctorToBackendUpdatePayload(doctorData);
            await updateDoctor(id, backendData);
            const dq = (getSearchForTab('doctors') || '').trim();
            const doctorsRes = await getDoctors({ limit: 100, search: dq || undefined }).catch(() => ({ items: [] }));
            const list = (doctorsRes.items || []).map(mapDoctorToFrontend).filter(Boolean);
            setDoctors(list);
            showNotify('Doctor updated successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update doctor: ' + error.message, 'error');
            return false;
        }
    };

    const deleteDoctorFn = async (id) => {
        try {
            await deleteDoctorApi(id);
            setDoctors(doctors.filter(d => d.id !== id));
            showNotify('Doctor deleted successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to delete doctor: ' + error.message, 'error');
            return false;
        }
    };

    const addProduct = async (productData) => {
        try {
            await createMedicine(productData);
            setMedicinesPage(1);
            await fetchMedicines(1, getSearchForTab('medicines'));
            showNotify('Product added successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to add product: ' + error.message, 'error');
            return false;
        }
    };

    const updateProductFn = async (id, productData) => {
        try {
            await updateMedicine(id, productData);
            await fetchMedicines(medicinesPage, getSearchForTab('medicines'), medicinesRowsPerPage);
            showNotify('Product updated successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update product: ' + error.message, 'error');
            return false;
        }
    };

    const deleteProductFn = async (id) => {
        try {
            await deleteMedicineApi(id);
            const currentPageItemCount = (medicinesList || []).length;
            let pageToFetch = medicinesPage;
            if (currentPageItemCount === 1 && medicinesPage > 1) {
                pageToFetch = medicinesPage - 1;
                setMedicinesPage(pageToFetch);
            }
            await fetchMedicines(pageToFetch, getSearchForTab('medicines'), medicinesRowsPerPage);
            showNotify('Medicine deleted successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to delete medicine: ' + error.message, 'error');
            return false;
        }
    };

    const mergeOrderFromApi = (id, updated) => {
        if (!updated || typeof updated !== 'object') return;
        setOrders((prev) =>
            (prev || []).map((o) => (String(o.id) === String(id) ? { ...o, ...updated } : o)),
        );
    };

    const handleOrderLifecycleIntent = async (order, act) => {
        if (!order?.id || !act?.status) return;
        if (act.requires === 'cancellation_reason') {
            setOrderLifecycleForm({ reason: '', assignUserId: '' });
            setOrderLifecycleDialog({ type: 'cancel_staff', order, targetStatus: act.status });
            return;
        }
        if (act.requires === 'return_reason') {
            setOrderLifecycleForm({ reason: '', assignUserId: '' });
            setOrderLifecycleDialog({ type: 'delivery_return', order, targetStatus: act.status });
            return;
        }
        if (act.requires === 'delivery_assigned_user_id') {
            setOrderLifecycleForm({ reason: '', assignUserId: '' });
            setAssignUserOptions([]);
            setOrderLifecycleDialog({ type: 'assign_delivery', order, targetStatus: act.status });
            try {
                const res = await getUsers({ limit: 200 });
                setAssignUserOptions((res.items || []).filter((u) => u && u.is_active !== false));
            } catch {
                showNotify('Could not load users for assignment', 'error');
            }
            return;
        }
        try {
            const updated = await updateOrder(order.id, { order_status: act.status });
            mergeOrderFromApi(order.id, updated);
            setOrderDetailRefreshKey((k) => k + 1);
            showNotify('Order status updated', 'success');
        } catch (error) {
            showNotify('Failed to update order: ' + (error.message || 'Unknown error'), 'error');
        }
    };

    const confirmOrderLifecycleDialog = async () => {
        if (!orderLifecycleDialog?.order?.id) return;
        const { order, targetStatus, type } = orderLifecycleDialog;
        try {
            if (type === 'cancel_staff') {
                const reason = (orderLifecycleForm.reason || '').trim();
                if (!reason) {
                    showNotify('Please enter a cancellation reason', 'error');
                    return;
                }
                const updated = await updateOrder(order.id, {
                    order_status: targetStatus,
                    cancellation_reason: reason,
                });
                mergeOrderFromApi(order.id, updated);
            } else if (type === 'delivery_return') {
                const reason = (orderLifecycleForm.reason || '').trim();
                if (!reason) {
                    showNotify('Please enter a return reason', 'error');
                    return;
                }
                const updated = await updateOrder(order.id, {
                    order_status: targetStatus,
                    return_reason: reason,
                });
                mergeOrderFromApi(order.id, updated);
            } else if (type === 'assign_delivery') {
                const uid = (orderLifecycleForm.assignUserId || '').trim();
                if (!uid) {
                    showNotify('Select a user to assign for delivery', 'error');
                    return;
                }
                const updated = await updateOrder(order.id, {
                    order_status: targetStatus,
                    delivery_assigned_user_id: uid,
                });
                mergeOrderFromApi(order.id, updated);
            }
            showNotify('Order updated', 'success');
            setOrderDetailRefreshKey((k) => k + 1);
            setOrderLifecycleDialog(null);
        } catch (error) {
            showNotify('Failed to update order: ' + (error.message || 'Unknown error'), 'error');
        }
    };

    const handleRefund = async (payment) => {
        if (!window.confirm(`Refund ₹${parseFloat(payment.amount).toFixed(2)} for order ${(payment.order_id || '').substring(0, 8)}...?`)) {
            return;
        }
        setRefundLoading(true);
        try {
            const result = await refundPayment(payment.order_id, {});
            showNotify(`Refund ${result.refund_status}: ₹${result.refund_amount}`, 'success');
            fetchTabData('payments', true);
        } catch (error) {
            showNotify('Refund failed: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            setRefundLoading(false);
        }
    };

    const enrichAppointmentWithDoctorName = (app, doctorsList) => {
        const mapped = mapAppointmentToFrontend(app);
        const name = mapped.doctorName || (doctorsList || []).find(d => d && String(d.id) === String(mapped.doctorId))?.name;
        return { ...mapped, doctorName: name || mapped.doctorName || '—' };
    };

    const addAppointmentFn = async (appointmentData) => {
        try {
            await createAppointment(appointmentData);
            const appointmentsRes = await getAppointments({ limit: 100 }).catch(() => ({ items: [] }));
            setAppointments((appointmentsRes.items || []).map(a => enrichAppointmentWithDoctorName(a, doctors)));
            showNotify('Appointment added successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to add appointment: ' + error.message, 'error');
            return false;
        }
    };

    const updateAppointmentFn = async (id, appointmentData) => {
        try {
            await updateAppointment(id, appointmentData);
            const appointmentsRes = await getAppointments({ limit: 100 }).catch(() => ({ items: [] }));
            setAppointments((appointmentsRes.items || []).map(a => enrichAppointmentWithDoctorName(a, doctors)));
            showNotify('Appointment updated successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update appointment: ' + error.message, 'error');
            return false;
        }
    };

    const deleteAppointmentFn = async (id) => {
        try {
            await deleteAppointmentApi(id);
            setAppointments(appointments.filter(a => a.id !== id));
            showNotify('Appointment deleted successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to delete appointment: ' + error.message, 'error');
            return false;
        }
    };

    const updateAppointmentStatusFn = async (id, status) => {
        try {
            await updateAppointment(id, { status: status.toUpperCase() });
            setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
            showNotify('Appointment status updated', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update appointment status: ' + error.message, 'error');
            return false;
        }
    };

    const openAddAppointmentModal = async () => {
        setModalMode('add');
        setEditingId(null);
        setAppointmentForm({
            patientName: '',
            phone: '',
            doctorId: doctors?.[0]?.id || '',
            message: '',
            status: 'CONFIRMED',
            date: new Date().toISOString().slice(0, 10),
            time: '',
        });
        if ((doctors || []).length === 0) {
            const dr = await getDoctors({ limit: 100 }).catch(() => ({ items: [] }));
            setDoctors((dr.items || []).map(mapDoctorToFrontend).filter(Boolean));
        }
        setShowModal(true);
    };

    const openEditAppointmentModal = (app) => {
        setModalMode('edit');
        setEditingId(app.id);
        setAppointmentForm({
            patientName: app.patientName || '',
            phone: app.phone || '',
            doctorId: app.doctorId || '',
            message: app.message || '',
            status: app.status || 'PENDING',
            date: app.date
                ? typeof app.date === 'string'
                    ? app.date.slice(0, 10)
                    : new Date(app.date).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
            time: timeToHHmm(app.time) || '',
        });
        setShowModal(true);
    };

    const openAppointmentDetailsModal = (app) => {
        setAppointmentDetails(app);
        setShowAppointmentDetails(true);
    };

    const openDoctorDetailsModal = (doc) => {
        setDoctorDetails(doc);
        setShowDoctorDetails(true);
    };

    const openStaffViewModal = async (manager) => {
        if (!manager?.id) return;
        setStaffView({ row: manager, detail: null, loading: true, loadError: null });
        try {
            const full = await getUserById(manager.id);
            setStaffView((prev) =>
                prev?.row?.id === manager.id ? { row: manager, detail: full, loading: false, loadError: null } : prev,
            );
        } catch (e) {
            const msg = e?.message || 'Failed to load staff details';
            setStaffView((prev) =>
                prev?.row?.id === manager.id ? { row: manager, detail: null, loading: false, loadError: msg } : prev,
            );
            showNotify(msg, 'error');
        }
    };

    useEffect(() => {
        if (!showDoctorDetails) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setShowDoctorDetails(false);
                setDoctorDetails(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showDoctorDetails]);

    useEffect(() => {
        if (!staffView) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setStaffView(null);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [staffView]);

    const updateDeliverySettingsFn = async (settingsData, options = {}) => {
        const silent = options?.silent === true;
        /** Only replace local windows when this request PATCHes slots; otherwise keep prev (API may return [] for null DB column). */
        const patchTouchesSlots = Object.hasOwn(settingsData ?? {}, 'delivery_slot_times');
        try {
            const updated = await updateDeliverySettingsApi(settingsData);
            const us = updated.delivery_slot_times;
            const slotList = Array.isArray(us)
                ? us.map((s) => ({
                      slot_time: s?.slot_time || s?.time || '',
                      is_active: s?.is_active !== false,
                  }))
                : [];
            setDeliverySettings((prev) => {
                const nextSlots = patchTouchesSlots
                    ? Array.isArray(updated.delivery_slot_times)
                        ? slotList
                        : prev.delivery_slot_times
                    : prev.delivery_slot_times;
                return {
                    ...updated,
                    free_delivery_min_amount:
                        updated.free_delivery_min_amount ?? updated.free_delivery_threshold ?? prev.free_delivery_min_amount,
                    free_delivery_max_amount:
                        updated.free_delivery_max_amount != null && updated.free_delivery_max_amount !== ''
                            ? updated.free_delivery_max_amount
                            : '',
                    delivery_fee:
                        updated.delivery_fee !== undefined &&
                        updated.delivery_fee !== null &&
                        String(updated.delivery_fee) !== ''
                            ? Number(updated.delivery_fee)
                            : (prev.delivery_fee ?? 40),
                    is_enabled: updated.is_enabled !== false,
                    delivery_slot_times: nextSlots,
                };
            });
            if (!silent) showNotify('Delivery settings updated', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update delivery settings: ' + (error?.message || ''), 'error');
            return false;
        }
    };

    const updateMarqueeSettingsFn = async (data) => {
        try {
            const updated = await updateMarqueeSettingsApi(data);
            setMarqueeSettings(updated);
            return true;
        } catch (error) {
            showNotify('Failed to update marquee: ' + (error?.message || ''), 'error');
            return false;
        }
    };

    const handleMarqueeEnable = () => {
        if (marqueeSettings.show_marquee !== true) {
            updateMarqueeSettingsFn({ show_marquee: true });
            showNotify('Marquee On');
        }
    };

    const handleMarqueeDisable = () => {
        if (marqueeSettings.show_marquee !== false) {
            updateMarqueeSettingsFn({ show_marquee: false });
            showNotify('Marquee Off');
        }
    };

    const addCouponFn = async (couponData) => {
        try {
            const backendData = mapCouponToBackend(couponData);
            const created = await createCoupon(backendData);
            setCoupons([...coupons, mapCouponToFrontend(created)]);
            showNotify('Coupon added successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to add coupon: ' + error.message, 'error');
            return false;
        }
    };

    const updateCouponFn = async (id, couponData) => {
        try {
            const backendData = mapCouponToBackend(couponData);
            const updated = await updateCoupon(id, backendData);
            setCoupons(coupons.map(c => c.id === id ? mapCouponToFrontend(updated) : c));
            showNotify('Coupon updated successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update coupon: ' + error.message, 'error');
            return false;
        }
    };

    const deleteCouponFn = async (id) => {
        try {
            await deleteCouponApi(id);
            setCoupons(coupons.filter(c => c.id !== id));
            showNotify('Coupon deleted successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to delete coupon: ' + error.message, 'error');
            return false;
        }
    };

    const addManagerFn = async (managerData) => {
        try {
            if (!managerData.role_id) {
                showNotify('Please select a role for the staff', 'error');
                return false;
            }
            const created = await createUser({
                full_name: managerData.name,
                email: managerData.email,
                mobile_number: managerData.mobile_number || '0000000000',
                password: managerData.password,
                role_id: managerData.role_id,
            });
            setManagers(prev => [...prev, { ...created, name: created.full_name, role_id: created.role_id }]);
            showNotify('Staff added successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to add staff: ' + (error?.message || ''), 'error');
            return false;
        }
    };

    const updateManagerFn = async (id, managerData) => {
        try {
            const payload = {
                full_name: managerData.name,
                email: managerData.email,
                role_id: managerData.role_id || undefined,
            };
            if (managerData.mobile_number) payload.mobile_number = managerData.mobile_number;
            if (managerData.password && managerData.password.trim()) payload.password = managerData.password;
            await updateUserApi(id, payload);
            await fetchTabData(activeTab, true);
            showNotify('Staff updated successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update staff: ' + (error?.message || ''), 'error');
            return false;
        }
    };

    const deleteManagerFn = async (id) => {
        try {
            await deleteUserApi(id);
            setManagers(managers.filter(m => m.id !== id));
            showNotify('Manager deleted successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to delete manager: ' + error.message, 'error');
            return false;
        }
    };

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null, name: '' });

    /** Order lifecycle: cancel (staff), assign delivery, delivery returned — see `constants/orderLifecycle.js` */
    const [orderLifecycleDialog, setOrderLifecycleDialog] = useState(null);
    const [orderLifecycleForm, setOrderLifecycleForm] = useState({ reason: '', assignUserId: '' });
    const [assignUserOptions, setAssignUserOptions] = useState([]);
    const [orderDetailRefreshKey, setOrderDetailRefreshKey] = useState(0);

    const handleDoctorSubmit = async (e) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        if (formEl && typeof formEl.reportValidity === 'function' && !formEl.reportValidity()) {
            return;
        }

        const checked = validateDoctorForm(doctorForm);
        if (!checked.ok) {
            showNotify(checked.message, 'error');
            return;
        }

        const mode = modalMode;
        const payload = { ...doctorForm, phone: checked.phoneNormalized || '' };

        const morning = (payload.morningStart != null && payload.morningEnd != null && payload.morningStart !== '' && payload.morningEnd !== '')
            ? `${formatTimeTo12h(payload.morningStart)} - ${formatTimeTo12h(payload.morningEnd)}` : (payload.morning || '');
        const evening = (payload.eveningStart != null && payload.eveningEnd != null && payload.eveningStart !== '' && payload.eveningEnd !== '')
            ? `${formatTimeTo12h(payload.eveningStart)} - ${formatTimeTo12h(payload.eveningEnd)}` : (payload.evening || '');

        const ok =
            mode === 'add'
                ? await addDoctor({ ...payload, morning, evening })
                : await updateDoctorFn(editingId, { ...payload, morning, evening });

        if (ok) {
            setShowModal(false);
            setDoctorForm({ ...INITIAL_DOCTOR_FORM });
        }
    };

    const startEditDoctor = (doc) => {
        const parseRange = (s) => {
            if (!s || typeof s !== 'string') return ['', ''];
            const parts = s.split(/\s*-\s*/).map((t) => parseTimeToHHmm(t.trim()));
            return [parts[0] || '', parts[1] || ''];
        };
        const hasMorningSlots =
            doc.morningStart != null &&
            String(doc.morningStart).trim() !== '' &&
            doc.morningEnd != null &&
            String(doc.morningEnd).trim() !== '';
        const hasEveningSlots =
            doc.eveningStart != null &&
            String(doc.eveningStart).trim() !== '' &&
            doc.eveningEnd != null &&
            String(doc.eveningEnd).trim() !== '';
        const [morningStart, morningEnd] = hasMorningSlots
            ? [doc.morningStart, doc.morningEnd]
            : parseRange(doc.morning);
        const [eveningStart, eveningEnd] = hasEveningSlots
            ? [doc.eveningStart, doc.eveningEnd]
            : parseRange(doc.evening);
        setModalMode('edit');
        setEditingId(doc.id);
        setDoctorForm({
            name: doc.name,
            specialty: doc.specialty,
            subSpecialty: doc.subSpecialty || '',
            qualification: doc.qualification || '',
            bio: doc.bio || '',
            experience: doc.experience || '',
            education: Array.isArray(doc.education) ? doc.education.join(', ') : (doc.education || ''),
            specializations: Array.isArray(doc.specializations) ? doc.specializations.join(', ') : (doc.specializations || ''),
            morning: doc.morning || '',
            evening: doc.evening || '',
            morningStart,
            morningEnd,
            eveningStart,
            eveningEnd,
            consultationFee: doc.consultationFee != null && doc.consultationFee !== '' ? String(doc.consultationFee) : '',
            phone: doc.phone || '',
            email: doc.email || '',
            address: doc.address || '',
            image: doc.image || '',
            available: doc.available,
        });
        setShowModal(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        if (!productForm.name || !productForm.price || !productForm.image) {
            showNotify('Missing fields', 'error');
            return;
        }

        const data = {
            ...productForm,
            price: parseFloat(productForm.price),
            discount: parseFloat(productForm.discount || 0),
            requiresPrescription: productForm.category === 'Prescription'
        };

        if (modalMode === 'add') {
            await addProduct(data);
            showNotify(`${data.name} added! You can add another.`, 'success');
            // Keep modal open, reset only entry fields but keep category
            setProductForm({
                ...productForm,
                name: '',
                price: '',
                image: '',
                discount: '0'
            });
        } else {
            await updateProductFn(editingId, data);
            showNotify('Medicine updated');
            setShowModal(false);
            setEditingId(null);
            setProductForm({ name: '', category: 'OTC', price: '', image: '', discount: '0', requiresPrescription: false, stock: true });
        }
    };

    const handleOrderSubmit = (e) => {
        e.preventDefault();
        if (!orderForm.customerName || !orderForm.total || !orderForm.phone) {
            showNotify('Missing fields', 'error');
            return;
        }

        const data = {
            customerId: orderForm.customerId || (user?.id ? user.id.toString() : `CUST-${Date.now()}`),
            customerName: orderForm.customerName,
            phone: orderForm.phone,
            address: orderForm.address || 'In-Store Pickup',
            items: [{ name: 'Store Purchase', quantity: 1, price: parseFloat(orderForm.total) }],
            total: parseFloat(orderForm.total).toFixed(2),
            discount: '0.00',
            couponCode: 'N/A',
            customerEmail: 'walkin@store.com',
            paymentMethod: orderForm.paymentMethod,
            paymentId: 'STORE-' + Date.now(),
            deliverySlot: 'N/A'
        };

        addOrder(data);
        showNotify('Order recorded successfully');
        setShowModal(false);
        setOrderForm({ customerId: '', customerName: '', phone: '', address: '', total: '', paymentMethod: 'cash' });
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        if (!appointmentForm.patientName || !appointmentForm.phone || !appointmentForm.doctorId) {
            showNotify('Please fill Patient Name, Contact, and select a Doctor', 'error');
            return;
        }
        if (!appointmentForm.date) {
            showNotify('Please select appointment date', 'error');
            return;
        }
        const payload = mapAppointmentToBackend(appointmentForm);
        if (modalMode === 'add') {
            await addAppointmentFn(payload);
            showNotify('Appointment added');
        } else {
            await updateAppointmentFn(editingId, payload);
            showNotify('Appointment updated');
        }
        setShowModal(false);
        setAppointmentForm({ patientName: '', phone: '', doctorId: '', message: '', status: 'CONFIRMED', date: new Date().toISOString().slice(0, 10), time: '' });
        setEditingId(null);
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        const discountNum = Number(couponForm.discount);
        if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
            showNotify('Discount must be between 0% and 100%', 'error');
            return;
        }

        if (modalMode === 'add') {
            await addCouponFn(couponForm);
            showNotify('Coupon created');
        } else {
            await updateCouponFn(editingId, couponForm);
            showNotify('Coupon updated');
        }
        setShowModal(false);
        setCouponForm({ code: '', discount: 5, isActive: true, expiryDate: '', firstOrderOnly: false });
        setEditingId(null);
    };

    const handleManagerSubmit = async (e) => {
        e.preventDefault();
        if (!managerForm.name || !managerForm.email) {
            showNotify('Name and email are required', 'error');
            return;
        }
        if (!managerForm.role_id) {
            showNotify('Please select a role', 'error');
            return;
        }
        if (modalMode === 'add' && !managerForm.password) {
            showNotify('Password is required for new staff', 'error');
            return;
        }
        if (modalMode === 'add') {
            const ok = await addManagerFn(managerForm);
            if (ok) setShowModal(false);
        } else {
            const ok = await updateManagerFn(editingId, managerForm);
            if (ok) { setShowModal(false); setEditingId(null); }
        }
        setManagerForm({ name: '', email: '', password: '', mobile_number: '', role_id: '' });
    };

    const handleNewEntitySubmit = async (e) => {
        e.preventDefault();
        let success = false;

        if (activeTab === 'test-bookings') {
            const { booking_date, booking_time } = testBookingForm;
            const today = new Date().toISOString().slice(0, 10);
            if (modalMode === 'add') {
                if (!booking_date || booking_date < today) {
                    showNotify('Please select a date today or in the future', 'error');
                    return;
                }
                if (booking_date === today && booking_time) {
                    const [h, m] = booking_time.split(':').map(Number);
                    const now = new Date();
                    if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
                        showNotify('Please select a time in the future', 'error');
                        return;
                    }
                }
            }
            const payload = mapTestBookingToBackend(testBookingForm);
            success = modalMode === 'add' ? await addTestBooking(payload) : await updateTestBookingFn(editingId, payload);
        }
        if (success) {
            setShowModal(false);
            fetchTabData(activeTab, true);
        }
    };

    const togglePermission = (perm) => {
        setManagerForm(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    const startEditCoupon = (coupon) => {
        setModalMode('edit');
        setEditingId(coupon.id);
        setCouponForm({ ...coupon });
        setShowModal(true);
    };

    const startEditProduct = (prod) => {
        setModalMode('edit');
        setEditingId(prod.id);
        setProductForm({ ...prod });
        setShowModal(true);
    };

    const handleMedicineAvailabilityChange = async (med, newValue) => {
        const prevList = [...(medicinesList || [])];
        setMedicinesList((prev) => prev.map((m) => (m.id === med.id ? { ...m, is_available: newValue } : m)));
        try {
            await updateMedicine(med.id, { is_available: newValue });
            showNotify(newValue ? 'Medicine marked available' : 'Medicine marked not available', 'success');
        } catch (err) {
            setMedicinesList(prevList);
            showNotify(err?.message || 'Update failed', 'error');
        }
    };

    const requestDelete = (type, id, name) => {
        setDeleteConfirm({ show: true, type, id, name });
    };

    const confirmDelete = async () => {
        if (deleteConfirm.type === 'doctor') {
            await deleteDoctorFn(deleteConfirm.id);
            showNotify('Doctor deleted');
        } else if (deleteConfirm.type === 'medicine') {
            await deleteProductFn(deleteConfirm.id);
            showNotify('Medicine deleted');
        } else if (deleteConfirm.type === 'appointment') {
            await deleteAppointmentFn(deleteConfirm.id);
            showNotify('Appointment deleted');
        } else if (deleteConfirm.type === 'coupon') {
            await deleteCouponFn(deleteConfirm.id);
            showNotify('Coupon deleted');
        } else if (deleteConfirm.type === 'manager') {
            await deleteManagerFn(deleteConfirm.id);
            showNotify('Staff deleted');
        } else if (deleteConfirm.type === 'test-booking') {
            await deleteTestBookingFn(deleteConfirm.id);
            showNotify('Test booking deleted');
        } else if (deleteConfirm.type === 'therapeutic-category') {
            await deleteTherapeuticCategoryFn(deleteConfirm.id);
            showNotify('Therapeutic category deleted');
        }
        setDeleteConfirm({ show: false, type: '', id: null, name: '' });
    };

    // Determine user's actual role from backend
    const effectiveRole = (user?.backendRole || user?.role || '').toUpperCase();

    const isAdminUser = effectiveRole === 'DEV_ADMIN' || effectiveRole === 'ADMIN';
    // Staff CRUD actions are permission-driven (with admin bypass above).
    const canManageStaff = hasAnyBackendPermission('STAFF_CREATE', 'STAFF_UPDATE', 'STAFF_DELETE');

    /** Memoized so the active-tab guard effect does not run every render (was resetting sidebar navigation). */
    const availableMenuItems = useMemo(() => computeAvailableMenuItems(user), [user]);
    /** Main nav links only; "My Profile" is shown as a dedicated card in the sidebar footer. */
    const mainSidebarNavItems = useMemo(
        () => availableMenuItems.filter((item) => item.id !== 'my-profile'),
        [availableMenuItems],
    );

    const profileEmail = user?.email && String(user.email).trim() ? String(user.email).trim() : '';
    const sidebarProfileName = user?.full_name || user?.name || profileEmail || 'Your account';
    const sidebarRoleSubtitle =
        effectiveRole === 'DEV_ADMIN'
            ? 'Dev Admin'
            : effectiveRole === 'DEV'
              ? 'Dev'
            : effectiveRole === 'ADMIN'
              ? 'Administrator'
              : effectiveRole === 'MANAGER'
                ? 'Manager'
                : effectiveRole === 'PHARMACIST'
                  ? 'Pharmacist'
                  : effectiveRole === 'CASHIER'
                    ? 'Cashier'
                    : effectiveRole === 'CUSTOMER_SERVICE'
                      ? 'Customer Service'
                      : effectiveRole === 'DELIVERY' || effectiveRole === 'DELIVERY_AGENT'
                        ? 'Delivery Agent'
                        : effectiveRole || 'Staff portal';
    const sidebarProfileSubtitle =
        profileEmail && sidebarProfileName !== profileEmail ? profileEmail : sidebarRoleSubtitle;
    const sidebarProfileInitial =
        (user?.name || user?.full_name)
            ? (user.name || user.full_name).trim().charAt(0).toUpperCase()
            : user?.email
              ? user.email.charAt(0).toUpperCase()
              : '?';

    useEffect(() => {
        if (!user || availableMenuItems.length === 0) return;
        if (!availableMenuItems.find((m) => m.id === activeTab)) {
            setActiveTab(availableMenuItems[0].id);
        }
    }, [user, availableMenuItems, activeTab]);

    // Keep Orders section active when viewing an order (order detail lives under Orders, not Dashboard)
    useEffect(() => {
        if (orderIdFromUrl) {
            setActiveTab('orders');
        }
    }, [orderIdFromUrl]);

    useEffect(() => {
        if (medicineCategoryRecordMode) {
            setActiveTab('therapeutic-categories');
        }
    }, [medicineCategoryRecordMode]);

    useEffect(() => {
        if (medicineRecordMode) {
            setActiveTab('medicines');
        }
    }, [medicineRecordMode]);

    useEffect(() => {
        if (inventoryOfferingRecordMode) {
            setActiveTab('inventory');
        }
    }, [inventoryOfferingRecordMode]);

    // When returning from order detail page, show Orders tab
    useEffect(() => {
        if (location.pathname === '/admin' && location.state?.tab === 'orders') {
            setActiveTab('orders');
        }
        if (location.pathname === '/admin' && location.state?.tab === 'coupon-usages') {
            setActiveTab('coupon-usages');
        }
        if (location.pathname === '/admin' && location.state?.tab === 'medicines') {
            setActiveTab('medicines');
        }
        if (location.pathname === '/admin' && location.state?.tab === 'inventory') {
            setActiveTab('inventory');
        }
    }, [location.pathname, location.state]);


    // Products are now filtered on the backend, no need for client-side filtering
    const filteredProducts = products || [];

    return (
        <div className={`admin-layout ${!isMobileSidebarOpen ? 'sidebar-closed' : ''}`}>
            {inventoryAlerts.length > 0 && hasPermission('inventory') && (
                <div
                    role="status"
                    aria-live="polite"
                    style={{
                        background: '#fff7e6',
                        borderBottom: '1px solid #faad14',
                        padding: '0.75rem 1rem',
                        fontSize: '0.9rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', maxWidth: 1200, margin: '0 auto' }}>
                        <Bell size={20} style={{ flexShrink: 0, marginTop: 2 }} color="#d46b08" />
                        <div>
                            <strong style={{ color: '#ad4e00' }}>Low stock ({inventoryThreshold} unit threshold)</strong>
                            <ul style={{ margin: '0.35rem 0 0 1.1rem', padding: 0 }}>
                                {inventoryAlerts.map((a) => (
                                    <li key={a.id} style={{ marginBottom: '0.25rem' }}>
                                        {a.message || `${a.medicine_name} (${a.brand_name}): ${a.current_stock} unit(s) left.`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications */}
            <div className="admin-notifications">
                {notifications.map(n => (
                    <div key={n.id} className={`notify-toast ${n.type}`}>
                        {n.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span>{n.message}</span>
                    </div>
                ))}
            </div>

            {/* Sidebar Overlay for Mobile */}
            <div className={`sidebar-overlay ${isMobileSidebarOpen ? 'show' : ''}`} onClick={() => setIsMobileSidebarOpen(false)}></div>

            {/* Modern Admin Sidebar - visible when open, slides off when X is clicked */}
            <aside
                className={`admin-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}
                aria-hidden={isNarrowViewport && !isMobileSidebarOpen}
            >
                <div className="sidebar-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3>New Balan</h3>
                            <p>{effectiveRole === 'DEV_ADMIN' || effectiveRole === 'ADMIN' ? 'ADMIN PORTAL' : effectiveRole === 'DEV' ? 'DEV DASHBOARD' : effectiveRole === 'MANAGER' ? 'MANAGER DASHBOARD' : effectiveRole === 'PHARMACIST' ? 'PHARMACIST DASHBOARD' : effectiveRole === 'CASHIER' ? 'CASHIER DASHBOARD' : effectiveRole === 'CUSTOMER_SERVICE' ? 'SUPPORT DASHBOARD' : effectiveRole === 'DELIVERY' || effectiveRole === 'DELIVERY_AGENT' ? 'DELIVERY DASHBOARD' : 'DASHBOARD'}</p>
                        </div>
                        <button className="mobile-close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {mainSidebarNavItems.map((item) => (
                        <button
                            type="button"
                            key={item.id}
                            className={`nav-item ${activeTab === item.id || (item.id === 'orders' && orderIdFromUrl) || (item.id === 'therapeutic-categories' && medicineCategoryRecordMode) || (item.id === 'medicines' && medicineRecordMode) || (item.id === 'inventory' && inventoryOfferingRecordMode) ? 'active' : ''}`}
                            onClick={() => {
                                if (orderIdFromUrl || medicineCategoryRecordMode || medicineRecordMode || inventoryOfferingRecordMode) {
                                    navigate('/admin');
                                }
                                setActiveTab(item.id);
                                setIsMobileSidebarOpen(false);
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button
                        type="button"
                        className={`sidebar-profile-card ${activeTab === 'my-profile' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('my-profile');
                            setIsMobileSidebarOpen(false);
                        }}
                        aria-current={activeTab === 'my-profile' ? 'page' : undefined}
                        aria-label="My profile and account settings"
                    >
                        <div className="sidebar-profile-avatar" aria-hidden>
                            {sidebarProfileInitial}
                        </div>
                        <div className="sidebar-profile-text">
                            <span className="sidebar-profile-name">{sidebarProfileName}</span>
                            <span className="sidebar-profile-meta">{sidebarProfileSubtitle}</span>
                        </div>
                        <ChevronRight className="sidebar-profile-chevron" size={18} aria-hidden />
                    </button>
                    <Link
                        to="/"
                        className="nav-item"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px' }}
                    >
                        <Home size={20} />
                        <span>View Website</span>
                    </Link>
                    <button
                        type="button"
                        className="nav-item logout-btn"
                        onClick={() => {
                            setIsMobileSidebarOpen(false);
                            logout();
                            window.location.href = '/login';
                        }}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area - Always Visible */}
            <main className="admin-main">
                {/* Header - Always Visible */}
                <header className="admin-header">
                    <div className="header-title">
                        <button className="mobile-hamburger" onClick={() => setIsMobileSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <h2>
                            {orderIdFromUrl
                                ? 'Order details'
                                : medicineRecordMode
                                  ? 'Manage medicines'
                                  : inventoryOfferingRecordMode
                                    ? 'Inventory'
                                    : medicineCategoryRecordMode
                                      ? 'Medicine categories'
                                      : availableMenuItems.find((m) => m.id === activeTab)?.label || 'Statistics'}
                        </h2>
                    </div>
                    <div className="admin-user">
                        <div className="admin-user-info">
                            <span>{effectiveRole === 'DEV_ADMIN' ? 'Dev Admin' : effectiveRole === 'DEV' ? 'Dev' : effectiveRole === 'ADMIN' ? 'Administrator' : effectiveRole === 'MANAGER' ? 'Manager' : effectiveRole === 'PHARMACIST' ? 'Pharmacist' : effectiveRole === 'CASHIER' ? 'Cashier' : effectiveRole === 'CUSTOMER_SERVICE' ? 'Customer Service' : effectiveRole === 'DELIVERY' || effectiveRole === 'DELIVERY_AGENT' ? 'Delivery Agent' : effectiveRole || 'User'}</span>
                            <span>{user?.name || user?.full_name || user?.email || 'User'}</span>
                        </div>
                        <div className="avatar">
                            {(user?.name || user?.full_name) 
                                ? (user.name || user.full_name)[0].toUpperCase() 
                                : user?.email 
                                    ? user.email[0].toUpperCase() 
                                    : 'U'}
                        </div>
                    </div>
                </header>

                {/* Content Area - Animated */}
                <div className="admin-content">
                    {medicineRecordMode ? (
                        <MedicineRecordPage
                            mode={medicineRecordMode}
                            medicineId={medicineIdFromRoute}
                            therapeuticCategories={therapeuticCategories}
                            showNotify={showNotify}
                            onMedicinesChanged={() =>
                                fetchMedicines(medicinesPage, getSearchForTab('medicines'), medicinesRowsPerPage)
                            }
                        />
                    ) : inventoryOfferingRecordMode ? (
                        <InventoryOfferingRecordPage
                            mode={inventoryOfferingRecordMode}
                            medicineId={inventoryOfferingMedicineIdFromRoute}
                            offeringId={inventoryOfferingIdFromRoute}
                            showNotify={showNotify}
                            onInventoryChanged={() => setInventoryRefreshToken((n) => n + 1)}
                        />
                    ) : medicineCategoryRecordMode ? (
                        <MedicineCategoryRecordPage
                            mode={medicineCategoryRecordMode}
                            categoryId={medicineCategoryIdFromRoute}
                            showNotify={showNotify}
                            onCategoriesChanged={refreshTherapeuticCategories}
                        />
                    ) : orderIdFromUrl ? (
                        <OrderDetailPage
                            onOrderLifecycleIntent={handleOrderLifecycleIntent}
                            backendPermissions={user?.backendPermissions || []}
                            userId={user?.id}
                            isAdminRole={isAdminUser}
                            lifecycleRefreshKey={orderDetailRefreshKey}
                        />
                    ) : loading ? (
                        <PageLoading
                            variant="block"
                            message="Loading…"
                            className="content-loading"
                        />
                    ) : (
                        <div key={activeTab} className="content-wrapper animate-fade-in">
                            {/* Dashboard Tab */}
                            {activeTab === 'dashboard' && (
                                tabPermissionDenied.has('dashboard') ? (
                                    <div className="admin-table-card admin-message-card">
                                        <Shield size={48} />
                                        <p>You don&apos;t have permission to view Statistics.</p>
                                        <p>Contact your administrator to get access.</p>
                                    </div>
                                ) : (
                                <div className="dashboard-view animate-slide-up">
                                    <div className="dashboard-container">
                                        <section className="dashboard-section">
                                            <h2 className="dashboard-section-title">Overview</h2>
                                            {!kpiSummary ? (
                                                <div className="admin-table-card admin-message-card" style={{ marginTop: 0 }}>
                                                    <AlertCircle size={40} />
                                                    <p>Statistics could not be loaded. Check your connection or try opening this tab again.</p>
                                                </div>
                                            ) : (
                                                <div className="stats-grid">
                                                    <div className="stat-card">
                                                        <div className="stat-icon blue">
                                                            <ShoppingCart size={24} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <h4>Total Orders</h4>
                                                            <p className="stat-value">{(kpiSummary.total_orders ?? 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-icon green">
                                                            <Pill size={24} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <h4>Total Medicines</h4>
                                                            <p className="stat-value">{(kpiSummary.total_medicines ?? 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-icon purple">
                                                            <IndianRupee size={24} />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <h4>Total Sales</h4>
                                                            <p className="stat-value">₹{parseFloat(kpiSummary.total_sales ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </section>
                                        {hasPermission('inventory') && (
                                            <section className="dashboard-section" style={{ marginTop: '1.5rem' }}>
                                                <h2 className="dashboard-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Package size={22} aria-hidden />
                                                    Inventory &amp; low stock
                                                </h2>
                                                <div className="admin-table-card" style={{ marginTop: '0.75rem', padding: '1rem 1.25rem' }}>
                                                    {inventoryAlerts.length > 0 ? (
                                                        <>
                                                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--admin-text-muted, #666)' }}>
                                                                Offerings below the configured threshold ({inventoryThreshold} units):
                                                            </p>
                                                            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                                                {inventoryAlerts.map((a) => (
                                                                    <li key={a.id} style={{ marginBottom: '0.35rem' }}>
                                                                        {a.message || `${a.medicine_name} (${a.brand_name}): ${a.current_stock} unit(s) left.`}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </>
                                                    ) : (
                                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--admin-text-muted, #555)' }}>
                                                            No low-stock alerts. All tracked offerings are at or above the threshold ({inventoryThreshold} units).
                                                        </p>
                                                    )}
                                                    <p style={{ margin: '0.85rem 0 0', fontSize: '0.8125rem', color: 'var(--admin-text-muted, #888)', lineHeight: 1.45 }}>
                                                        Open the{' '}
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveTab('inventory')}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                padding: 0,
                                                                color: 'var(--primary, #2563eb)',
                                                                cursor: 'pointer',
                                                                textDecoration: 'underline',
                                                                font: 'inherit',
                                                            }}
                                                        >
                                                            Inventory
                                                        </button>{' '}
                                                        tab to set stock and manage medicine–brand offerings. This summary matches the optional low-stock banner at the top.
                                                    </p>
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>
                                )
                            )}

                    {/* Doctors Tab */}
                    {activeTab === 'doctors' && (
                        <DoctorsTab
                            doctors={doctors}
                            searchTerm={getSearchForTab('doctors')}
                            setSearchTerm={(v) => setSearchForTab('doctors', v)}
                            doctorsPage={doctorsPage}
                            setDoctorsPage={setDoctorsPage}
                            rowsPerPage={doctorsRowsPerPage}
                            setRowsPerPage={setDoctorsRowsPerPage}
                            onAdd={() => {
                                setModalMode('add');
                                setEditingId(null);
                                setDoctorForm({ ...INITIAL_DOCTOR_FORM });
                                setShowModal(true);
                            }}
                            onEdit={startEditDoctor}
                            onDelete={(doc) => requestDelete('doctor', doc.id, doc.name)}
                            onViewDoctorDetails={openDoctorDetailsModal}
                            backendPermissions={user?.backendPermissions || []}
                            isAdminRole={isAdminUser}
                        />
                    )}

                    {activeTab === 'medicines' && (
                        <MedicinesTab
                            medicines={medicinesList}
                            loading={medicinesLoading}
                            pagination={medicinesPagination}
                            page={medicinesPage}
                            setPage={setMedicinesPage}
                            rowsPerPage={medicinesRowsPerPage}
                            setRowsPerPage={setMedicinesRowsPerPage}
                            searchTerm={getSearchForTab('medicines')}
                            setSearchTerm={(v) => {
                                setSearchForTab('medicines', v);
                                setMedicinesPage(1);
                            }}
                            onAdd={() => navigate('/admin/medicines/new')}
                            onEdit={(m) => navigate(`/admin/medicines/${m.id}/edit`)}
                            onDelete={(m) => requestDelete('medicine', m.id, m.name)}
                            onAvailabilityChange={handleMedicineAvailabilityChange}
                        />
                    )}

                    {activeTab === 'inventory' && (
                        <InventoryTab showNotify={showNotify} refreshToken={inventoryRefreshToken} />
                    )}

                    {activeTab === 'brand-master' && <BrandMasterTab showNotify={showNotify} />}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        tabPermissionDenied.has('orders') ? (
                            <div className="admin-table-card admin-message-card">
                                <Shield size={48} />
                                <p>You don&apos;t have permission to view orders.</p>
                                <p>Contact your administrator to get access.</p>
                            </div>
                        ) : (
                        <OrdersTab
                            orders={orders}
                            searchTerm={getSearchForTab('orders')}
                            setSearchTerm={(v) => setSearchForTab('orders', v)}
                            dateFilter={orderDateFilter}
                            setDateFilter={setOrderDateFilter}
                            ordersPage={ordersPage}
                            setOrdersPage={setOrdersPage}
                            ordersRowsPerPage={ordersRowsPerPage}
                            setOrdersRowsPerPage={setOrdersRowsPerPage}
                            statusFilter={orderStatusFilter}
                            setStatusFilter={setOrderStatusFilter}
                            onOrderLifecycleIntent={handleOrderLifecycleIntent}
                            onViewDetails={(order) => navigate(`/admin/orders/${order.id}`, { state: { order } })}
                            backendPermissions={user?.backendPermissions || []}
                            userId={user?.id}
                            isAdminRole={isAdminUser}
                        />
                        )
                    )}

                    {activeTab === 'delivery-orders' && (
                        tabPermissionDenied.has('delivery-orders') ? (
                            <div className="admin-table-card admin-message-card">
                                <Shield size={48} />
                                <p>You don&apos;t have permission to view delivery orders.</p>
                                <p>Contact your administrator to get access.</p>
                            </div>
                        ) : (
                        <OrdersTab
                            orders={orders}
                            searchTerm={getSearchForTab('delivery-orders')}
                            setSearchTerm={(v) => setSearchForTab('delivery-orders', v)}
                            dateFilter={orderDateFilter}
                            setDateFilter={setOrderDateFilter}
                            ordersPage={ordersPage}
                            setOrdersPage={setOrdersPage}
                            ordersRowsPerPage={ordersRowsPerPage}
                            setOrdersRowsPerPage={setOrdersRowsPerPage}
                            statusFilter={orderStatusFilter}
                            setStatusFilter={setOrderStatusFilter}
                            onOrderLifecycleIntent={handleOrderLifecycleIntent}
                            onViewDetails={(order) => navigate(`/admin/orders/${order.id}`, { state: { order } })}
                            backendPermissions={user?.backendPermissions || []}
                            userId={user?.id}
                            isAdminRole={isAdminUser}
                        />
                        )
                    )}

                    {activeTab === 'appointments' && (
                        <AppointmentsTab
                            appointments={appointments}
                            searchTerm={getSearchForTab('appointments')}
                            setSearchTerm={(v) => {
                                setSearchForTab('appointments', v);
                                setAppointmentsPage(1);
                            }}
                            page={appointmentsPage}
                            setPage={setAppointmentsPage}
                            rowsPerPage={appointmentsRowsPerPage}
                            setRowsPerPage={setAppointmentsRowsPerPage}
                            onAdd={openAddAppointmentModal}
                            onEdit={openEditAppointmentModal}
                            onViewDetails={openAppointmentDetailsModal}
                            onDelete={(app) => requestDelete('appointment', app.id, app.patientName)}
                            onConfirmPending={(app) => updateAppointmentStatusFn(app.id, 'Confirmed')}
                            onCancelPending={(app) => updateAppointmentStatusFn(app.id, 'Cancelled')}
                        />
                    )}

                    {activeTab === 'delivery' && (
                        <DeliveryTab
                            deliverySettings={deliverySettings}
                            setDeliverySettings={setDeliverySettings}
                            updateDeliverySettings={updateDeliverySettingsFn}
                            showNotify={showNotify}
                        />
                    )}

                    {activeTab === 'coupons' && (
                        <CouponsTab
                            marqueeSettings={marqueeSettings}
                            onMarqueeEnable={handleMarqueeEnable}
                            onMarqueeDisable={handleMarqueeDisable}
                            coupons={coupons}
                            searchTerm={getSearchForTab('coupons')}
                            setSearchTerm={(v) => setSearchForTab('coupons', v)}
                            onAddCoupon={() => {
                                setModalMode('add');
                                setCouponForm({
                                    code: '',
                                    discount: 5,
                                    isActive: true,
                                    expiryDate: '',
                                    firstOrderOnly: false,
                                });
                                setShowModal(true);
                            }}
                            onEditCoupon={startEditCoupon}
                            onDeleteCoupon={(c) => requestDelete('coupon', c.id, c.code)}
                            onToggleCouponActive={(c) =>
                                updateCouponFn(c.id, { ...c, isActive: !c.isActive })
                            }
                            onViewCouponDetails={(c) => {
                                setCouponDetails({
                                    ...c,
                                    _marqueeVisible: marqueeSettings.show_marquee !== false,
                                });
                                setShowCouponDetails(true);
                            }}
                            onViewMarqueeDetails={() => {
                                setCouponDetails({
                                    _marqueeOnly: true,
                                    _marqueeVisible: marqueeSettings.show_marquee !== false,
                                });
                                setShowCouponDetails(true);
                            }}
                        />
                    )}
                    {activeTab === 'roles-access' && (
                        <AccessControlTab showNotify={showNotify} onRolesInvalidate={() => setRoles([])} />
                    )}
                    {/* Staff Tab */}
                    {activeTab === 'staff' && (
                        <div className="admin-table-card staff-table-card animate-slide-up">
                            <p className="staff-tab-note" style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>
                                Customers sign up on the website; this section is for staff only. Use the <strong>eye (View)</strong>{' '}
                                on a row for read-only details.
                            </p>
                            <div className="table-actions">
                                <div className="table-search"><Search size={18} /><input type="text" placeholder="Search staff..." value={getSearchForTab('staff')} onChange={(e) => setSearchForTab('staff', e.target.value)} /></div>
                            {canManageStaff && (
                                <button
                                    className="btn-add"
                                    onClick={async () => {
                                        setModalMode('add');
                                        setManagerForm({ name: '', email: '', password: '', mobile_number: '', role_id: '' });
                                        await ensureRolesLoaded();
                                        setShowModal(true);
                                    }}
                                >
                                    <Plus size={18} /> Add Staff
                                </button>
                            )}
                            </div>
                            <div className="scrollable-section-wrapper">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {(managers || []).filter(m => m && (m.name || m.full_name || '').toLowerCase().includes((getSearchForTab('staff') || '').toLowerCase())).map(manager => (
                                                <tr key={manager.id}>
                                                    <td data-label="Name"><strong>{manager.name || manager.full_name || 'N/A'}</strong></td>
                                                    <td data-label="Email">{manager.email || 'N/A'}</td>
                                                    <td data-label="Role">
                                                        <span className="status-tag active" style={{ fontSize: '0.8rem' }}>
                                                            {roles.find(r => r.id === manager.role_id)?.name || manager.role_name || '—'}
                                                        </span>
                                                    </td>
                                                    <td data-label="Actions" className="actions">
                                                        <button
                                                            type="button"
                                                            className="action-btn staff-view-btn"
                                                            title="View staff profile (read-only)"
                                                            aria-label={`View details for ${manager.name || manager.full_name || 'staff'}`}
                                                            onClick={() => openStaffViewModal(manager)}
                                                        >
                                                            <Eye size={18} strokeWidth={2.25} aria-hidden />
                                                            <span className="staff-view-btn-label">View</span>
                                                        </button>
                                                        {canManageStaff && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="action-btn"
                                                                    onClick={async () => {
                                                                        setModalMode('edit');
                                                                        setEditingId(manager.id);
                                                                        setManagerForm({
                                                                            name: manager.name || manager.full_name || '',
                                                                            email: manager.email || '',
                                                                            password: '',
                                                                            mobile_number: manager.mobile_number || '',
                                                                            role_id: manager.role_id || '',
                                                                        });
                                                                        await ensureRolesLoaded();
                                                                        setShowModal(true);
                                                                    }}
                                                                    title="Edit"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="action-btn delete"
                                                                    onClick={() =>
                                                                        requestDelete(
                                                                            'manager',
                                                                            manager.id,
                                                                            manager.name || manager.full_name || 'Unknown',
                                                                        )
                                                                    }
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!managers || managers.length === 0) && <tr><td colSpan="4" className="table-empty-cell">No staff added yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'test-bookings' && (
                        <TestBookingsTab
                            testBookings={testBookings}
                            polyclinicTests={polyclinicTests}
                            searchTerm={getSearchForTab('test-bookings')}
                            setSearchTerm={(v) => {
                                setSearchForTab('test-bookings', v);
                                setTestBookingsPage(1);
                            }}
                            testBookingsPage={testBookingsPage}
                            setTestBookingsPage={setTestBookingsPage}
                            testBookingsRowsPerPage={testBookingsRowsPerPage}
                            setTestBookingsRowsPerPage={setTestBookingsRowsPerPage}
                            onAddClick={async () => { const today = new Date().toISOString().slice(0, 10); setModalMode('add'); let tests = polyclinicTests || []; if (tests.length === 0) { const pt = await getPolyclinicTests({ limit: 100 }).catch(() => ({ items: [] })); tests = pt.items || []; setPolyclinicTests(tests); } setTestBookingForm({ test_id: tests[0] ? tests[0].id : '', patient_name: '', patient_phone: '', booking_date: today, booking_time: '', status: 'PENDING', notes: '' }); setShowModal(true); }}
                            onEditClick={(b) => { setModalMode('edit'); setEditingId(b.id); const dateStr = b.booking_date ? (typeof b.booking_date === 'string' ? b.booking_date.slice(0, 10) : new Date(b.booking_date).toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10); setTestBookingForm({ test_id: b.test_id || '', patient_name: b.patient_name || '', patient_phone: b.patient_phone || '', booking_date: dateStr, booking_time: timeToHHmm(b.booking_time) || '', status: b.status || 'PENDING', notes: b.notes || '' }); setShowModal(true); }}
                            onViewDetails={(b) => {
                                let testName = b.test_name && b.test_name !== '—' ? b.test_name : '';
                                if (!testName && b.test_id && (polyclinicTests || []).length) {
                                    testName =
                                        polyclinicTests.find((t) => String(t.id) === String(b.test_id))?.name || '';
                                }
                                setTestBookingDetails({ ...b, __detailTestName: testName });
                                setShowTestBookingDetails(true);
                            }}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'payments' && (
                        tabPermissionDenied.has('payments') ? (
                            <div className="admin-table-card admin-message-card">
                                <Shield size={48} />
                                <p>You don&apos;t have permission to view payments.</p>
                                <p>Contact your administrator to get access.</p>
                            </div>
                        ) : (
                        <PaymentsTab
                            payments={payments}
                            searchTerm={getSearchForTab('payments')}
                            setSearchTerm={(v) => setSearchForTab('payments', v)}
                            paymentsPage={paymentsPage}
                            setPaymentsPage={setPaymentsPage}
                            paymentsRowsPerPage={paymentsRowsPerPage}
                            setPaymentsRowsPerPage={setPaymentsRowsPerPage}
                            onRefund={handleRefund}
                            refundLoading={refundLoading}
                        />
                        )
                    )}
                    {activeTab === 'therapeutic-categories' && (
                        <TherapeuticCategoriesTab
                            therapeuticCategories={therapeuticCategories}
                            searchTerm={getSearchForTab('therapeutic-categories')}
                            setSearchTerm={(v) => setSearchForTab('therapeutic-categories', v)}
                            therapeuticCategoriesPage={therapeuticCategoriesPage}
                            setTherapeuticCategoriesPage={setTherapeuticCategoriesPage}
                            therapeuticCategoriesRowsPerPage={therapeuticCategoriesRowsPerPage}
                            setTherapeuticCategoriesRowsPerPage={setTherapeuticCategoriesRowsPerPage}
                            onAddClick={() => navigate('/admin/medicine-categories/new')}
                            onEditClick={(c) => navigate(`/admin/medicine-categories/${c.id}/edit`)}
                            onViewClick={(c) => navigate(`/admin/medicine-categories/${c.id}`)}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'coupon-usages' && (
                        <CouponUsagesTab
                            couponUsages={couponUsages}
                            searchTerm={getSearchForTab('coupon-usages')}
                            setSearchTerm={(v) => {
                                setSearchForTab('coupon-usages', v);
                                setCouponUsagesPage(1);
                            }}
                            couponUsagesPage={couponUsagesPage}
                            setCouponUsagesPage={setCouponUsagesPage}
                            couponUsagesRowsPerPage={couponUsagesRowsPerPage}
                            setCouponUsagesRowsPerPage={setCouponUsagesRowsPerPage}
                            onViewOrder={(orderId) => navigate(`/admin/orders/${orderId}`, { state: { fromTab: 'coupon-usages' } })}
                        />
                    )}
                    {activeTab === 'my-profile' && (
                        <MyProfileTab user={user} />
                    )}
                    </div>
                )}
            </div>
            </main>

            {/* Shared Modal Backdrop/Overlay */}
            {showModal && (
                <div className="admin-modal-overlay">
                    <div
                        className={`admin-modal ${activeTab !== 'dashboard' ? 'compact-modal' : ''} ${
                            activeTab === 'doctors' ? 'doctor-form-modal' : ''
                        }`}
                    >
                        <div className="modal-header">
                            <h3>{modalMode === 'add' ? 'New' : 'Update'} {
                                activeTab === 'staff' ? 'Staff' :
                                activeTab === 'test-bookings' ? 'Test Booking' :
                                activeTab.slice(0, -1)
                            }</h3>
                            <button onClick={() => setShowModal(false)} style={{ color: 'var(--admin-text-muted)' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={
                            activeTab === 'doctors' ? handleDoctorSubmit :
                                activeTab === 'orders' ? handleOrderSubmit :
                                        activeTab === 'appointments' ? handleAppointmentSubmit :
                                            activeTab === 'coupons' ? handleCouponSubmit :
                                                activeTab === 'staff' ? handleManagerSubmit :
                                                    activeTab === 'test-bookings' ? handleNewEntitySubmit :
                                                        (e) => e.preventDefault()
                        } className="modal-form">
                            {activeTab === 'doctors' && (
                                <DoctorModalForm doctorForm={doctorForm} setDoctorForm={setDoctorForm} />
                            )}
                            {activeTab === 'orders' && (
                                <>
                                    <div style={{ backgroundColor: '#fdf2f8', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#db2777', fontWeight: 600, border: '1px solid #fce7f3' }}>
                                        🛍️ Record a store/offline order for walk-in customers.
                                    </div>
                                    <div className="form-group"><label>Customer ID (Optional)</label><input type="text" value={orderForm.customerId} placeholder="Auto-generated if empty" onChange={e => setOrderForm({ ...orderForm, customerId: e.target.value })} /></div>
                                    <div className="form-group"><label>Customer Name*</label><input type="text" required value={orderForm.customerName} placeholder="Full Name" onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })} /></div>
                                    <div className="form-group"><label>Phone Number*</label><input type="tel" required value={orderForm.phone} placeholder="+91..." onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })} /></div>
                                    <div className="form-group"><label>Full Address (Optional)</label><textarea value={orderForm.address} placeholder="Shipping or contact address" onChange={e => setOrderForm({ ...orderForm, address: e.target.value })}></textarea></div>
                                    <div className="form-group"><label>Total Bill Amount (₹)*</label><input type="number" required value={orderForm.total} placeholder="0.00" onChange={e => setOrderForm({ ...orderForm, total: e.target.value })} /></div>
                                    <div className="form-group">
                                        <label>Payment Method</label>
                                        <select value={orderForm.paymentMethod} onChange={e => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}>
                                            <option value="cash">Cash on Delivery / In-Store</option>
                                            <option value="online">Online Payment</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            {activeTab === 'appointments' && (
                                <>
                                    <div className="form-group"><label>Patient Name*</label><input type="text" required value={appointmentForm.patientName} onChange={e => setAppointmentForm({ ...appointmentForm, patientName: e.target.value })} placeholder="Full name" /></div>
                                    <div className="form-group"><label>Contact*</label><input type="tel" required value={appointmentForm.phone} onChange={e => setAppointmentForm({ ...appointmentForm, phone: e.target.value })} placeholder="Phone number" /></div>
                                    <div className="form-group">
                                        <label>Doctor*</label>
                                        <select required value={appointmentForm.doctorId} onChange={e => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                            <option value="">Select Doctor</option>
                                            {(doctors || []).filter(d => d && d.id).map(d => <option key={d.id} value={d.id}>{d.name || '—'} ({d.specialty || '—'})</option>)}
                                        </select>
                                        {(doctors || []).length === 0 && <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Loading doctors… Add doctors in Manage Doctors if the list is empty.</small>}
                                    </div>
                                    <div className="form-group"><label>Date*</label><DatePicker required value={appointmentForm.date || ''} onChange={v => setAppointmentForm({ ...appointmentForm, date: v })} placeholder="Select date" /></div>
                                    <div className="form-group"><label>Time</label><TimeInput value={timeToHHmm(appointmentForm.time) || ''} onChange={v => setAppointmentForm({ ...appointmentForm, time: v })} placeholder="Optional" /></div>
                                    <div className="form-group"><label>Status</label><select value={appointmentForm.status} onChange={e => setAppointmentForm({ ...appointmentForm, status: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select></div>
                                    <div className="form-group"><label>Patient Message</label><textarea value={appointmentForm.message} onChange={e => setAppointmentForm({ ...appointmentForm, message: e.target.value })} placeholder="Message from patient (optional)"></textarea></div>
                                </>
                            )}
                            {activeTab === 'coupons' && (
                                <>
                                    <div className="form-group">
                                        <label>Coupon Code (e.g. SAVE5)</label>
                                        <input type="text" required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="ALPHANUMERIC" />
                                    </div>
                                    <div className="form-group">
                                        <label>Discount Percentage (%)</label>
                                        <input type="number" required min="0" max="100" step="0.01" value={couponForm.discount} onChange={e => setCouponForm({ ...couponForm, discount: e.target.value === '' ? '' : Number(e.target.value) })} />
                                        <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Any value from 0% to 100% as per your requirement</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Expiry Date (Optional)</label>
                                        <DatePicker value={couponForm.expiryDate} onChange={v => setCouponForm({ ...couponForm, expiryDate: v })} placeholder="Select expiry date" />
                                        <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>After this date the coupon cannot be used and will not be shown at checkout.</small>
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                        <label style={{ marginBottom: 0 }}>Enable Coupon:</label>
                                        <button
                                            type="button"
                                            className={`status-tag ${couponForm.isActive ? 'active' : 'inactive'}`}
                                            style={{ cursor: 'pointer', border: '1px solid currentColor' }}
                                            onClick={() => setCouponForm({ ...couponForm, isActive: !couponForm.isActive })}
                                        >
                                            {couponForm.isActive ? 'Enabled' : 'Disabled'}
                                        </button>
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            id="coupon-first-order-only"
                                            checked={couponForm.firstOrderOnly === true}
                                            onChange={e => setCouponForm({ ...couponForm, firstOrderOnly: e.target.checked })}
                                        />
                                        <label htmlFor="coupon-first-order-only" style={{ marginBottom: 0 }}>First order only (valid only for customer&apos;s first order)</label>
                                    </div>
                                </>
                            )}
                            {activeTab === 'test-bookings' && (() => {
                                const todayStr = new Date().toISOString().slice(0, 10);
                                const now = new Date();
                                const timeMin = testBookingForm.booking_date === todayStr
                                    ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes() + 1).padStart(2, '0')}`
                                    : '00:00';
                                const dateMin = modalMode === 'add' ? todayStr : undefined;
                                return (
                                <>
                                    <div className="form-group">
                                        <label>Test*</label>
                                        <select required value={testBookingForm.test_id} onChange={e => setTestBookingForm({ ...testBookingForm, test_id: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                            <option value="">Select test</option>
                                            {(polyclinicTests || []).filter(t => t && t.id).map(t => <option key={t.id} value={t.id}>{t.name || '—'}</option>)}
                                        </select>
                                        <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Choose from available polyclinic tests.</small>
                                        {(polyclinicTests || []).length === 0 && <small style={{ color: 'var(--admin-warning, orange)', marginTop: '0.25rem', display: 'block' }}>No tests loaded. Refresh the tab or ensure polyclinic tests exist in the system.</small>}
                                    </div>
                                    <div className="form-group"><label>Patient Name*</label><input type="text" required value={testBookingForm.patient_name} onChange={e => setTestBookingForm({ ...testBookingForm, patient_name: e.target.value })} placeholder="Full name" /></div>
                                    <div className="form-group"><label>Phone*</label><input type="tel" required value={testBookingForm.patient_phone} onChange={e => setTestBookingForm({ ...testBookingForm, patient_phone: e.target.value })} placeholder="Phone number" /></div>
                                    <div className="form-group"><label>Date*</label><DatePicker required value={testBookingForm.booking_date} min={dateMin} onChange={v => setTestBookingForm({ ...testBookingForm, booking_date: v })} placeholder="Select date" title={modalMode === 'add' ? 'Only future dates allowed for new bookings' : ''} /></div>
                                    <div className="form-group"><label>Time</label><TimeInput value={timeToHHmm(testBookingForm.booking_time) || ''} onChange={v => setTestBookingForm({ ...testBookingForm, booking_time: v })} placeholder="Optional" title={modalMode === 'add' && testBookingForm.booking_date === todayStr ? 'Only future time when date is today' : ''} /></div>
                                    <div className="form-group"><label>Status</label>
                                        <select value={testBookingForm.status} onChange={e => setTestBookingForm({ ...testBookingForm, status: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                            <option value="PENDING">PENDING</option><option value="CONFIRMED">CONFIRMED</option><option value="CANCELLED">CANCELLED</option><option value="COMPLETED">COMPLETED</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Notes</label><textarea rows="2" value={testBookingForm.notes} onChange={e => setTestBookingForm({ ...testBookingForm, notes: e.target.value })} placeholder="Optional" /></div>
                                </>
                                );
                            })()}
                            {activeTab === 'staff' && (
                                <>
                                    <div className="form-group">
                                        <label>Role*</label>
                                        <select
                                            required
                                            value={managerForm.role_id || ''}
                                            onChange={e => setManagerForm({ ...managerForm, role_id: e.target.value })}
                                            className="admin-select"
                                        >
                                            <option value="">Select role</option>
                                            {(roles || [])
                                                .filter(r => (r.name || '').toUpperCase() !== 'CUSTOMER')
                                                .map(r => (
                                                    <option key={r.id} value={r.id}>{r.name || r.id}</option>
                                                ))}
                                        </select>
                                        <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Staff roles only. Customers are separate and cannot be added here.</small>
                                    </div>
                                    <div className="form-group"><label>Full Name*</label><input type="text" required value={managerForm.name || ''} onChange={e => setManagerForm({ ...managerForm, name: e.target.value })} /></div>
                                    <div className="form-group"><label>Email Address*</label><input type="email" required value={managerForm.email || ''} onChange={e => setManagerForm({ ...managerForm, email: e.target.value })} /></div>
                                    <div className="form-group"><label>Mobile Number</label><input type="text" placeholder="10-digit mobile" value={managerForm.mobile_number || ''} onChange={e => setManagerForm({ ...managerForm, mobile_number: e.target.value })} maxLength={15} /></div>
                                    <div className="form-group">
                                        <label>Password{modalMode === 'add' ? '*' : ' (leave blank to keep current)'}</label>
                                        <div className="password-input-wrapper">
                                            <input
                                                type={showStaffPassword ? "text" : "password"}
                                                required={modalMode === 'add'}
                                                value={managerForm.password || ''}
                                                onChange={e => setManagerForm({ ...managerForm, password: e.target.value })}
                                                placeholder={modalMode === 'edit' ? 'New password (optional)' : ''}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle-btn"
                                                onClick={() => setShowStaffPassword(!showStaffPassword)}
                                            >
                                                {showStaffPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-add" style={{ flex: 2 }}>
                                    {modalMode === 'add' ? 'Confirm Addition' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointment / Patient Details Modal (eye icon) */}
            {showAppointmentDetails && appointmentDetails && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '560px' }}>
                        <div className="modal-header">
                            <h3>Patient Details</h3>
                            <button
                                onClick={() => {
                                    setShowAppointmentDetails(false);
                                    setAppointmentDetails(null);
                                }}
                                style={{ color: 'var(--admin-text-muted)' }}
                                type="button"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Patient</div>
                                <div style={{ fontWeight: 700 }}>{appointmentDetails.patientName || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Phone</div>
                                <div style={{ fontWeight: 700 }}>{appointmentDetails.phone || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Doctor</div>
                                <div style={{ fontWeight: 700 }}>{appointmentDetails.doctorName || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</div>
                                <div style={{ fontWeight: 700 }}>{appointmentDetails.status || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Date</div>
                                <div style={{ fontWeight: 700 }}>
                                    {appointmentDetails.date ? String(appointmentDetails.date).slice(0, 10) : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Time</div>
                                <div style={{ fontWeight: 700 }}>{appointmentDetails.time || 'N/A'}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    Patient Message
                                </div>
                                <div style={{ padding: '0.75rem', border: '1px solid var(--admin-border)', borderRadius: '10px', background: 'var(--admin-bg)' }}>
                                    {appointmentDetails.message ? appointmentDetails.message : <span style={{ color: 'var(--admin-text-muted)' }}>No message</span>}
                                </div>
                            </div>
                            {appointmentDetails.notes && (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                        Notes
                                    </div>
                                    <div style={{ padding: '0.75rem', border: '1px solid var(--admin-border)', borderRadius: '10px', background: 'var(--admin-bg)' }}>
                                        {appointmentDetails.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                type="button"
                                className="btn-add btn-cancel"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setShowAppointmentDetails(false);
                                    setAppointmentDetails(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test booking details (eye icon) */}
            {showTestBookingDetails && testBookingDetails && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '560px' }}>
                        <div className="modal-header">
                            <h3>Test booking details</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowTestBookingDetails(false);
                                    setTestBookingDetails(null);
                                }}
                                style={{ color: 'var(--admin-text-muted)' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Test</div>
                                <div style={{ fontWeight: 700 }}>
                                    {testBookingDetails.__detailTestName ||
                                        (testBookingDetails.test_name && testBookingDetails.test_name !== '—'
                                            ? testBookingDetails.test_name
                                            : 'N/A')}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Patient</div>
                                <div style={{ fontWeight: 700 }}>{testBookingDetails.patient_name || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Phone</div>
                                <div style={{ fontWeight: 700 }}>{testBookingDetails.patient_phone || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</div>
                                <div style={{ fontWeight: 700 }}>{testBookingDetails.status || 'N/A'}</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Date</div>
                                <div style={{ fontWeight: 700 }}>
                                    {testBookingDetails.booking_date
                                        ? String(testBookingDetails.booking_date).slice(0, 10)
                                        : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Time</div>
                                <div style={{ fontWeight: 700 }}>
                                    {formatTestBookingDetailTime(testBookingDetails.booking_time)}
                                </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                    Notes
                                </div>
                                <div
                                    style={{
                                        padding: '0.75rem',
                                        border: '1px solid var(--admin-border)',
                                        borderRadius: '10px',
                                        background: 'var(--admin-bg)',
                                    }}
                                >
                                    {testBookingDetails.notes ? (
                                        testBookingDetails.notes
                                    ) : (
                                        <span style={{ color: 'var(--admin-text-muted)' }}>No notes</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                type="button"
                                className="btn-add btn-cancel"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setShowTestBookingDetails(false);
                                    setTestBookingDetails(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Doctor read-only details (eye + View on Manage Doctors row) */}
            {showDoctorDetails && doctorDetails && (
                <div
                    className="admin-modal-overlay"
                    role="presentation"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowDoctorDetails(false);
                            setDoctorDetails(null);
                        }
                    }}
                >
                    <div
                        className="admin-modal compact-modal doctor-details-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="doctor-details-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="doctor-details-modal__hero">
                            <div className="doctor-details-modal__identity">
                                {doctorDetails.image ? (
                                    <img
                                        className="doctor-details-modal__avatar"
                                        src={getStorageFileUrl(doctorDetails.image)}
                                        alt=""
                                    />
                                ) : (
                                    <div
                                        className="doctor-details-modal__avatar doctor-details-modal__avatar--fallback"
                                        aria-hidden
                                    >
                                        {(doctorDetails.name || '?').trim().charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="doctor-details-modal__head-text">
                                    <h3 id="doctor-details-title" className="doctor-details-modal__title">
                                        {doctorDetails.name || 'Doctor profile'}
                                    </h3>
                                    <p className="doctor-details-modal__subtitle">
                                        {[doctorDetails.specialty, doctorDetails.subSpecialty]
                                            .filter((x) => x && String(x).trim())
                                            .join(' · ') || 'Specialty not set'}
                                    </p>
                                    <span
                                        className={`status-tag doctor-details-modal__status ${
                                            doctorDetails.available !== false ? 'active' : 'inactive'
                                        }`}
                                    >
                                        {doctorDetails.available !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                aria-label="Close"
                                onClick={() => {
                                    setShowDoctorDetails(false);
                                    setDoctorDetails(null);
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="doctor-details-modal__body">
                            <section className="doctor-details-modal__section">
                                <h4 className="doctor-details-modal__section-title">About</h4>
                                <div className="doctor-details-modal__grid">
                                    <div className="doctor-details-modal__field doctor-details-modal__field--full">
                                        <div className="doctor-details-modal__label">Bio</div>
                                        <div className="doctor-details-modal__prose">
                                            {doctorDetails.bio ? (
                                                doctorDetails.bio
                                            ) : (
                                                <span className="doctor-details-modal__empty">No bio</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="doctor-details-modal__field">
                                        <div className="doctor-details-modal__label">Qualifications</div>
                                        <div className="doctor-details-modal__value">
                                            {doctorDetails.qualification || '—'}
                                        </div>
                                    </div>
                                    <div className="doctor-details-modal__field">
                                        <div className="doctor-details-modal__label">Experience</div>
                                        <div className="doctor-details-modal__value">
                                            {doctorDetails.experience || '—'}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="doctor-details-modal__section">
                                <h4 className="doctor-details-modal__section-title">Schedule & fee</h4>
                                <div className="doctor-details-modal__grid">
                                    <div className="doctor-details-modal__field">
                                        <div className="doctor-details-modal__label">Morning hours</div>
                                        <div className="doctor-details-modal__value">
                                            {formatDoctorDetailSlot(doctorDetails.morning)}
                                        </div>
                                    </div>
                                    <div className="doctor-details-modal__field">
                                        <div className="doctor-details-modal__label">Evening hours</div>
                                        <div className="doctor-details-modal__value">
                                            {formatDoctorDetailSlot(doctorDetails.evening)}
                                        </div>
                                    </div>
                                    <div className="doctor-details-modal__field">
                                        <div className="doctor-details-modal__label">Consultation fee</div>
                                        <div className="doctor-details-modal__value doctor-details-modal__value--accent">
                                            {formatDoctorDetailFee(doctorDetails.consultationFee)}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="doctor-details-modal__section">
                                <h4 className="doctor-details-modal__section-title">Education & focus</h4>
                                <div className="doctor-details-modal__grid">
                                    <div className="doctor-details-modal__field doctor-details-modal__field--full">
                                        <div className="doctor-details-modal__label">Education</div>
                                        <div className="doctor-details-modal__value">
                                            {formatDoctorDetailList(doctorDetails.education)}
                                        </div>
                                    </div>
                                    <div className="doctor-details-modal__field doctor-details-modal__field--full">
                                        <div className="doctor-details-modal__label">Specializations</div>
                                        <div className="doctor-details-modal__value">
                                            {formatDoctorDetailList(doctorDetails.specializations)}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="doctor-details-modal__section">
                                <h4 className="doctor-details-modal__section-title">Contact</h4>
                                <div className="doctor-details-modal__grid">
                                    <div className="doctor-details-modal__field">
                                        <div className="doctor-details-modal__label">Phone</div>
                                        <div className="doctor-details-modal__value">{doctorDetails.phone || '—'}</div>
                                    </div>
                                    <div className="doctor-details-modal__field doctor-details-modal__field--full">
                                        <div className="doctor-details-modal__label">Email</div>
                                        <div className="doctor-details-modal__value doctor-details-modal__value--break">
                                            {doctorDetails.email || '—'}
                                        </div>
                                    </div>
                                    <div className="doctor-details-modal__field doctor-details-modal__field--full">
                                        <div className="doctor-details-modal__label">Address</div>
                                        <div className="doctor-details-modal__prose">
                                            {doctorDetails.address ? (
                                                doctorDetails.address
                                            ) : (
                                                <span className="doctor-details-modal__empty">No address</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="doctor-details-modal__section">
                                <h4 className="doctor-details-modal__section-title">Record</h4>
                                <div className="doctor-details-modal__grid">
                                    <div className="doctor-details-modal__field doctor-details-modal__field--full">
                                        <div className="doctor-details-modal__label">Doctor ID</div>
                                        <div className="doctor-details-modal__value doctor-details-modal__value--mono">
                                            {doctorDetails.id != null ? String(doctorDetails.id) : '—'}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="doctor-details-modal__footer">
                            <button
                                type="button"
                                className="btn-add btn-cancel doctor-details-modal__close-btn"
                                onClick={() => {
                                    setShowDoctorDetails(false);
                                    setDoctorDetails(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff read-only details (eye + View on Manage Staff row) */}
            {staffView &&
                (() => {
                    const u = staffView.detail || staffView.row;
                    const displayName = (u.full_name || u.name || '').trim() || '—';
                    const initial = (displayName !== '—' ? displayName : '?').charAt(0).toUpperCase();
                    const roleName =
                        roles.find((r) => r.id === u.role_id)?.name || u.role_name || '—';
                    const mobile = u.mobile_number != null && String(u.mobile_number).trim() ? String(u.mobile_number).trim() : '—';
                    const email = u.email != null && String(u.email).trim() ? String(u.email).trim() : '—';
                    const active = u.is_active !== false;
                    return (
                        <div
                            className="admin-modal-overlay"
                            role="presentation"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setStaffView(null);
                            }}
                        >
                            <div
                                className="admin-modal compact-modal staff-details-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="staff-details-title"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="staff-details-modal__hero">
                                    <div className="staff-details-modal__identity">
                                        <div
                                            className="staff-details-modal__avatar staff-details-modal__avatar--fallback"
                                            aria-hidden
                                        >
                                            {initial}
                                        </div>
                                        <div className="staff-details-modal__head-text">
                                            <h3 id="staff-details-title" className="staff-details-modal__title">
                                                {displayName}
                                            </h3>
                                            <p className="staff-details-modal__subtitle">{email}</p>
                                            <div className="staff-details-modal__badges">
                                                <span className={`status-tag ${active ? 'active' : 'inactive'}`}>
                                                    {active ? 'Active' : 'Inactive'}
                                                </span>
                                                <span className="staff-details-modal__role-pill">{roleName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="modal-close"
                                        aria-label="Close"
                                        onClick={() => setStaffView(null)}
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="staff-details-modal__body">
                                    <section className="staff-details-modal__section">
                                        <h4 className="staff-details-modal__section-title">Contact</h4>
                                        <div className="staff-details-modal__grid">
                                            <div className="staff-details-modal__field">
                                                <div className="staff-details-modal__label">Mobile</div>
                                                <div className="staff-details-modal__value">{mobile}</div>
                                            </div>
                                            <div className="staff-details-modal__field staff-details-modal__field--full">
                                                <div className="staff-details-modal__label">Email</div>
                                                <div className="staff-details-modal__value staff-details-modal__value--break">
                                                    {email}
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="staff-details-modal__section">
                                        <h4 className="staff-details-modal__section-title">Access</h4>
                                        <div className="staff-details-modal__grid">
                                            <div className="staff-details-modal__field staff-details-modal__field--full">
                                                <div className="staff-details-modal__label">Role</div>
                                                <div className="staff-details-modal__value staff-details-modal__value--lg">
                                                    {roleName}
                                                </div>
                                            </div>
                                            {staffView.loading && !staffView.detail ? (
                                                <div className="staff-details-modal__field staff-details-modal__field--full">
                                                    <div className="staff-details-modal__inline-loading" role="status">
                                                        <InlineSpinner size={20} className="staff-details-modal__spin" />
                                                        <span>Loading full profile…</span>
                                                    </div>
                                                </div>
                                            ) : null}
                                            {staffView.loadError ? (
                                                <p className="staff-details-modal__load-error">{staffView.loadError}</p>
                                            ) : null}
                                        </div>
                                    </section>

                                    <section className="staff-details-modal__section">
                                        <h4 className="staff-details-modal__section-title">Record</h4>
                                        <div className="staff-details-modal__grid">
                                            <div className="staff-details-modal__field staff-details-modal__field--full">
                                                <div className="staff-details-modal__label">User ID</div>
                                                <div className="staff-details-modal__value staff-details-modal__value--mono">
                                                    {u.id != null ? String(u.id) : '—'}
                                                </div>
                                            </div>
                                            <div className="staff-details-modal__field staff-details-modal__field--full">
                                                <div className="staff-details-modal__label">Role ID</div>
                                                <div className="staff-details-modal__value staff-details-modal__value--mono">
                                                    {u.role_id != null ? String(u.role_id) : '—'}
                                                </div>
                                            </div>
                                            {staffView.detail?.created_at != null && (
                                                <div className="staff-details-modal__field">
                                                    <div className="staff-details-modal__label">Created</div>
                                                    <div className="staff-details-modal__value">
                                                        {formatStaffDetailTs(staffView.detail.created_at)}
                                                    </div>
                                                </div>
                                            )}
                                            {staffView.detail?.updated_at != null && (
                                                <div className="staff-details-modal__field">
                                                    <div className="staff-details-modal__label">Updated</div>
                                                    <div className="staff-details-modal__value">
                                                        {formatStaffDetailTs(staffView.detail.updated_at)}
                                                    </div>
                                                </div>
                                            )}
                                            {staffView.detail?.is_deleted != null && (
                                                <div className="staff-details-modal__field">
                                                    <div className="staff-details-modal__label">Deleted</div>
                                                    <div className="staff-details-modal__value">
                                                        {staffView.detail.is_deleted ? 'Yes' : 'No'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="staff-details-modal__footer">
                                    <button
                                        type="button"
                                        className="btn-add btn-cancel staff-details-modal__close-btn"
                                        onClick={() => setStaffView(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

            {/* Coupon / marquee read-only details (eye icon on coupon row, or marquee card) */}
            {showCouponDetails && couponDetails && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '560px' }}>
                        <div className="modal-header">
                            <h3>
                                {couponDetails._marqueeOnly ? 'Coupon marquee' : 'Coupon details'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCouponDetails(false);
                                    setCouponDetails(null);
                                }}
                                style={{ color: 'var(--admin-text-muted)' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {couponDetails._marqueeOnly ? (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-muted)', lineHeight: 1.55 }}>
                                    This controls whether the scrolling promotional bar appears on the public website. It does
                                    not delete or change individual coupons.
                                </p>
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</div>
                                    <div style={{ fontWeight: 700, marginTop: '0.25rem' }}>
                                        {couponDetails._marqueeVisible
                                            ? 'Visible on website'
                                            : 'Hidden'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Use Visible / Hidden</div>
                                    <div style={{ fontWeight: 600, marginTop: '0.25rem', fontSize: '0.9rem' }}>
                                        Switch the toggle on the Coupons tab to change this setting.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1rem' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Code</div>
                                    <div style={{ fontWeight: 700 }}>{couponDetails.code || 'N/A'}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Discount</div>
                                    <div style={{ fontWeight: 700 }}>{Number(couponDetails.discount) || 0}%</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Status</div>
                                    <div style={{ fontWeight: 700 }}>
                                        {couponDetails.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Expiry</div>
                                    <div style={{ fontWeight: 700 }}>
                                        {formatCouponDetailExpiry(couponDetails.expiryDate)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Min. order</div>
                                    <div style={{ fontWeight: 700 }}>
                                        {formatCouponDetailMinOrder(couponDetails.minOrderAmount)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>First order only</div>
                                    <div style={{ fontWeight: 700 }}>
                                        {couponDetails.firstOrderOnly ? 'Yes' : 'No'}
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>Coupon ID</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                        {couponDetails.id || '—'}
                                    </div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                                        Website coupon bar
                                    </div>
                                    <div
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid var(--admin-border)',
                                            borderRadius: '10px',
                                            background: 'var(--admin-bg)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {couponDetails._marqueeVisible
                                            ? 'Scrolling bar is visible on the site (when the theme shows it).'
                                            : 'Scrolling bar is hidden on the site.'}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                type="button"
                                className="btn-add btn-cancel"
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setShowCouponDetails(false);
                                    setCouponDetails(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order lifecycle: cancel / assign delivery / delivery returned */}
            {orderLifecycleDialog && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ maxWidth: '440px' }}>
                        <h3 style={{ marginTop: 0 }}>
                            {orderLifecycleDialog.type === 'cancel_staff' && 'Cancel order (staff)'}
                            {orderLifecycleDialog.type === 'delivery_return' && 'Delivery returned'}
                            {orderLifecycleDialog.type === 'assign_delivery' && 'Assign delivery'}
                        </h3>
                        {(orderLifecycleDialog.type === 'cancel_staff' ||
                            orderLifecycleDialog.type === 'delivery_return') && (
                            <>
                                <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                                    {orderLifecycleDialog.type === 'cancel_staff'
                                        ? 'Provide a clear reason (e.g. invalid prescription, item unavailable).'
                                        : 'Explain why the customer did not accept the order.'}
                                </p>
                                <textarea
                                    value={orderLifecycleForm.reason}
                                    onChange={(e) =>
                                        setOrderLifecycleForm((f) => ({ ...f, reason: e.target.value }))
                                    }
                                    rows={4}
                                    placeholder="Reason…"
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--admin-border)',
                                        marginTop: '0.5rem',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </>
                        )}
                        {orderLifecycleDialog.type === 'assign_delivery' && (
                            <>
                                <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                                    Choose the user who will handle pickup and delivery for this order.
                                </p>
                                <select
                                    value={orderLifecycleForm.assignUserId}
                                    onChange={(e) =>
                                        setOrderLifecycleForm((f) => ({ ...f, assignUserId: e.target.value }))
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginTop: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--admin-border)',
                                    }}
                                >
                                    <option value="">Select user…</option>
                                    {assignUserOptions.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {(u.full_name || u.name || 'User') + (u.email ? ` — ${u.email}` : '')}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                            <button
                                type="button"
                                className="btn-add btn-cancel"
                                style={{ flex: 1 }}
                                onClick={() => setOrderLifecycleDialog(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-add"
                                style={{ flex: 1 }}
                                onClick={confirmOrderLifecycleDialog}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Overlay */}
            {deleteConfirm.show && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal" style={{ textAlign: 'center', maxWidth: '400px' }}>
                        <div style={{ color: '#dc2626', marginBottom: '1rem' }}><Trash2 size={48} /></div>
                        <h3>Are you sure?</h3>
                        <p style={{ margin: '1rem 0 2rem', color: 'var(--admin-text-muted)' }}>You are about to delete <strong>{deleteConfirm.name}</strong>. This cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn-add btn-cancel" style={{ flex: 1 }} onClick={() => setDeleteConfirm({ show: false, type: '', id: null, name: '' })}>No, Cancel</button>
                            <button className="btn-add btn-danger" style={{ flex: 1 }} onClick={confirmDelete}>Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
