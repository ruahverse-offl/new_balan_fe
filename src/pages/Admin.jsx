import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, User, Pill, ShoppingCart, Search, Plus, Trash2, Check, X, Menu, Clock, MapPin, Phone, Pencil, AlertCircle, Eye, EyeOff, CheckCircle, XCircle, LogOut, Bell, Truck, Ticket, UserCheck, Filter, IndianRupee, ArrowLeft, ChevronRight, Loader2, Shield, Key, Link2, FileText, Package, FlaskConical, Warehouse, CreditCard, Tags, BarChart3, ClipboardList, Calendar, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor as deleteDoctorApi } from '../services/doctorsApi';
import { getMedicines, getAllMedicinesForSelect, createMedicine, updateMedicine, deleteMedicine as deleteMedicineApi } from '../services/medicinesApi';
import { getOrders, updateOrder } from '../services/ordersApi';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment as deleteAppointmentApi } from '../services/appointmentsApi';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon as deleteCouponApi } from '../services/couponsApi';
import { getUsers, createUser, updateUser as updateUserApi, deleteUser as deleteUserApi } from '../services/usersApi';
import { getCategories, createCategory, deleteCategory as deleteCategoryApi } from '../services/categoriesApi';
import { getDeliverySettings, updateDeliverySettings as updateDeliverySettingsApi, getDeliverySlots, createDeliverySlot, updateDeliverySlot, deleteDeliverySlot as deleteDeliverySlotApi } from '../services/deliveryApi';
import { getMarqueeSettings, updateMarqueeSettings as updateMarqueeSettingsApi } from '../services/marqueeApi';
import { getRoles, createRole, updateRole, deleteRole as deleteRoleApi } from '../services/rolesApi';
import { getPermissions, createPermission, updatePermission, deletePermission as deletePermissionApi } from '../services/permissionsApi';
import { getRolePermissions, createRolePermission, deleteRolePermission as deleteRolePermissionApi } from '../services/rolePermissionsApi';
import { getFinanceDashboard, getInventoryDashboard, getSalesDashboard } from '../services/dashboardsApi';
import { getBrands, createBrand, updateBrand, deleteBrand as deleteBrandApi } from '../services/brandsApi';
import { getCompositions, createComposition, updateComposition, deleteComposition as deleteCompositionApi } from '../services/compositionsApi';
import { getBatches, createBatch, updateBatch, deleteBatch as deleteBatchApi } from '../services/batchesApi';
import { getPayments } from '../services/paymentsApi';
import { refundPayment } from '../services/razorpayApi';
import { getTherapeuticCategories, createTherapeuticCategory, updateTherapeuticCategory, deleteTherapeuticCategory as deleteTherapeuticCategoryApi } from '../services/therapeuticCategoriesApi';
import { getCouponUsages } from '../services/couponUsagesApi';
import { getInventoryTransactions, createInventoryTransaction, updateInventoryTransaction, deleteInventoryTransaction as deleteInventoryTransactionApi } from '../services/inventoryTransactionsApi';
import { getTestBookings, createTestBooking, updateTestBooking, deleteTestBooking as deleteTestBookingApi } from '../services/testBookingsApi';
import { getPolyclinicTests } from '../services/polyclinicTestsApi';
import { getPrescriptions, approvePrescription, rejectPrescription, deletePrescription as deletePrescriptionApi } from '../services/prescriptionsApi';
import { buildApiUrl } from '../config/api';
import { mapDoctorToFrontend, mapDoctorToBackend, mapDoctorToBackendUpdatePayload, mapMedicineToFrontend, mapCouponToFrontend, mapCouponToBackend, mapAppointmentToFrontend, mapAppointmentToBackend, mapTestBookingToFrontend, mapTestBookingToBackend } from '../utils/dataMapper';
import { formatTimeRangeTo24h, formatTimeTo12h, parseTimeToHHmm } from '../utils/timeFormatters';
import { mapBackendPermissionsToFrontend } from '../utils/permissionMapper';
import { getUserPermissions } from '../services/authApi';
import FinanceDashboard from '../components/dashboards/FinanceDashboard';
import InventoryDashboard from '../components/dashboards/InventoryDashboard';
import SalesDashboard from '../components/dashboards/SalesDashboard';
import DashboardTab from './admin/DashboardTab';
import DoctorsTab from './admin/DoctorsTab';
import MedicinesTab from './admin/MedicinesTab';
import OrdersTab from './admin/OrdersTab';
import AppointmentsTab from './admin/AppointmentsTab';
import DeliveryTab from './admin/DeliveryTab';
import CouponsTab from './admin/CouponsTab';
import StaffTab from './admin/StaffTab';
import CategoriesTab from './admin/CategoriesTab';
import RolesTab from './admin/RolesTab';
import PermissionsTab from './admin/PermissionsTab';
import RolePermissionsTab from './admin/RolePermissionsTab';
import PrescriptionsTab from './admin/PrescriptionsTab';
import TestBookingsTab from './admin/TestBookingsTab';
import BrandsTab from './admin/BrandsTab';
import CompositionsTab from './admin/CompositionsTab';
import BatchesTab from './admin/BatchesTab';
import PaymentsTab from './admin/PaymentsTab';
import TherapeuticCategoriesTab from './admin/TherapeuticCategoriesTab';
import CouponUsagesTab from './admin/CouponUsagesTab';
import InventoryTab from './admin/InventoryTab';
import MyProfileTab from './admin/MyProfileTab';
import OrderDetailPage from './admin/OrderDetailPage';
import AdminLayout from './admin/AdminLayout';
import './Admin.css';
import './admin/StatisticsDashboard.css';

// Simple beep sound
const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'; // Short placeholder, will replace with better if needed or use browser default logic

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

const Admin = () => {
    const { orderId: orderIdFromUrl } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dashboardSubTab, setDashboardSubTab] = useState('finance'); // finance, inventory, orders, sales
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const { logout, user, updateUser } = useAuth();
    
    // State for all data
    const [doctors, setDoctors] = useState([]);
    const [products, setProducts] = useState([]);
    const [medicinesList, setMedicinesList] = useState([]);
    const [medicinesForDropdown, setMedicinesForDropdown] = useState([]); // Full list for Brands/Compositions dropdowns (not overwritten by paginated Medicines tab)
    const [orders, setOrders] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [managers, setManagers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [deliverySettings, setDeliverySettings] = useState({ is_enabled: true, show_marquee: true, slots: [] });
    const [marqueeSettings, setMarqueeSettings] = useState({ show_marquee: true });

    // RBAC state
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState([]);
    // New entity data
    const [prescriptions, setPrescriptions] = useState([]);
    const [testBookings, setTestBookings] = useState([]);
    const [polyclinicTests, setPolyclinicTests] = useState([]);
    const [brands, setBrands] = useState([]);
    const [compositions, setCompositions] = useState([]);
    const [batches, setBatches] = useState([]);
    const [payments, setPayments] = useState([]);
    const [therapeuticCategories, setTherapeuticCategories] = useState([]);
    const [couponUsages, setCouponUsages] = useState([]);
    const [inventoryTransactions, setInventoryTransactions] = useState([]);
    const [newOrderNotification, setNewOrderNotification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchByTab, setSearchByTab] = useState({});
    const getSearchForTab = (tab) => searchByTab[tab] ?? '';
    const setSearchForTab = (tab, value) => setSearchByTab(prev => ({ ...prev, [tab]: value }));
    const [tabPermissionDenied, setTabPermissionDenied] = useState(new Set());
    const [dashboardSubTabDenied, setDashboardSubTabDenied] = useState({ finance: false, inventory: false, sales: false });
    
    // Statistics (dashboard) data state — Finance, Inventory, Sales only; Orders live in Orders section
    const [financeDashboard, setFinanceDashboard] = useState(null);
    const [inventoryDashboard, setInventoryDashboard] = useState(null);
    const [salesDashboard, setSalesDashboard] = useState(null);

    // Pagination State
    const [medicinesPage, setMedicinesPage] = useState(1);
    const [medicinesPagination, setMedicinesPagination] = useState(null);
    const [medicinesRowsPerPage, setMedicinesRowsPerPage] = useState(10);
    const [medicinesLoading, setMedicinesLoading] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(10);
    const [orderStatusFilter, setOrderStatusFilter] = useState('');
    const [refundLoading, setRefundLoading] = useState(false);
    const [appointmentsPage, setAppointmentsPage] = useState(1);
    const [categoriesPage, setCategoriesPage] = useState(1);
    const [doctorsPage, setDoctorsPage] = useState(1);
    const adminItemsPerPage = 10;
    const [prescriptionsPage, setPrescriptionsPage] = useState(1);
    const [prescriptionsRowsPerPage, setPrescriptionsRowsPerPage] = useState(10);
    const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState('');
    const [testBookingsPage, setTestBookingsPage] = useState(1);
    const [testBookingsRowsPerPage, setTestBookingsRowsPerPage] = useState(10);
    const [brandsPage, setBrandsPage] = useState(1);
    const [brandsRowsPerPage, setBrandsRowsPerPage] = useState(10);
    const [compositionsPage, setCompositionsPage] = useState(1);
    const [compositionsRowsPerPage, setCompositionsRowsPerPage] = useState(10);
    const [batchesPage, setBatchesPage] = useState(1);
    const [batchesRowsPerPage, setBatchesRowsPerPage] = useState(10);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [paymentsRowsPerPage, setPaymentsRowsPerPage] = useState(10);
    const [therapeuticCategoriesPage, setTherapeuticCategoriesPage] = useState(1);
    const [therapeuticCategoriesRowsPerPage, setTherapeuticCategoriesRowsPerPage] = useState(10);
    const [couponUsagesPage, setCouponUsagesPage] = useState(1);
    const [couponUsagesRowsPerPage, setCouponUsagesRowsPerPage] = useState(10);
    const [inventoryPage, setInventoryPage] = useState(1);
    const [inventoryRowsPerPage, setInventoryRowsPerPage] = useState(10);
    const [medicineBrandIdFilter, setMedicineBrandIdFilter] = useState(null);

    // Track which tabs have been loaded
    const [loadedTabs, setLoadedTabs] = useState(new Set());

    // Fetch data for specific tab
    const fetchTabData = async (tab, forceReload = false) => {
        setTabPermissionDenied(prev => { const s = new Set(prev); s.delete(tab); return s; });
        // Skip if already loaded and not forcing reload
        if (!forceReload && loadedTabs.has(tab)) {
            return;
        }

        try {
            setLoading(true);
            
            switch (tab) {
                case 'dashboard': {
                    const currentSubTab = (dashboardSubTab === 'orders' ? 'finance' : dashboardSubTab) || 'finance';
                    if (currentSubTab !== dashboardSubTab) setDashboardSubTab(currentSubTab);
                    setDashboardSubTabDenied(prev => ({ ...prev, [currentSubTab]: false }));
                    if (currentSubTab === 'finance') {
                        const financeData = await getFinanceDashboard({ include_charts: true }).catch((err) => { if (err?.status === 403) setDashboardSubTabDenied(prev => ({ ...prev, finance: true })); return null; });
                        setFinanceDashboard(financeData);
                    } else if (currentSubTab === 'inventory') {
                        const inventoryData = await getInventoryDashboard({ include_charts: true }).catch((err) => { if (err?.status === 403) setDashboardSubTabDenied(prev => ({ ...prev, inventory: true })); return null; });
                        setInventoryDashboard(inventoryData);
                    } else if (currentSubTab === 'sales') {
                        const salesData = await getSalesDashboard({ include_charts: true }).catch((err) => { if (err?.status === 403) setDashboardSubTabDenied(prev => ({ ...prev, sales: true })); return null; });
                        setSalesDashboard(salesData);
                    }
                    const [ordersSummary, appointmentsSummary] = await Promise.all([
                        getOrders({ limit: 10 }).catch(() => ({ items: [] })),
                        getAppointments({ limit: 10 }).catch(() => ({ items: [] }))
                    ]);
                    setOrders(ordersSummary.items || []);
                    setAppointments((appointmentsSummary.items || []).map(mapAppointmentToFrontend));
                    break;
                }
                    
                case 'doctors':
                    if (forceReload || doctors.length === 0) {
                        const doctorsRes = await getDoctors({ limit: 100 }).catch(() => ({ items: [] }));
                        setDoctors((doctorsRes.items || []).map(mapDoctorToFrontend).filter(Boolean));
                    }
                    break;
                    
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
                        const settings = await getDeliverySettings().catch(() => ({ is_enabled: true, show_marquee: true, slots: [] }));
                        let slots = [];
                        if (settings?.id) {
                            const slotsRes = await getDeliverySlots({ delivery_settings_id: settings.id, limit: 100 }).catch(() => ({ items: [] }));
                            slots = (slotsRes?.items || []).map(s => ({ id: s.id, time: s.slot_time, active: s.is_active }));
                        }
                        setDeliverySettings({ ...settings, slots });
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
                        if (roles.length === 0 && (rolesRes.items || []).length) setRoles(rolesRes.items || []);
                        setManagers((usersRes.items || []).map(user => ({
                            ...user,
                            name: user.name || user.full_name || '',
                            role_id: user.role_id
                        })));
                    }
                    break;
                    
                case 'categories':
                    if (forceReload || categories.length === 0) {
                        const categoriesRes = await getCategories({ limit: 100 }).catch(() => ({ items: [] }));
                        setCategories(categoriesRes.items.map(cat => cat.name || cat.category_name));
                    }
                    break;

                case 'prescriptions':
                    const prescRes = await getPrescriptions({ limit: 100, status: prescriptionStatusFilter || undefined }).catch(() => ({ items: [] }));
                    setPrescriptions(prescRes.items || []);
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
                case 'brands': {
                    const [brandsResForTab, medsResForBrands] = await Promise.all([
                        getBrands({ limit: 100 }).catch(() => ({ items: [] })),
                        getMedicines({ limit: 500 }).catch(() => ({ items: [] }))
                    ]);
                    const meds = medsResForBrands.items || [];
                    const nameById = {};
                    meds.forEach(m => { nameById[String(m?.id)] = m?.name ?? '—'; });
                    setBrands((brandsResForTab.items || []).map(b => ({ ...b, medicine_name: nameById[String(b?.medicine_id)] || b.medicine_name || '—' })));
                    setMedicinesForDropdown(meds);
                    break;
                }
                case 'compositions': {
                    const [compRes, medsResForComp] = await Promise.all([
                        getCompositions({ limit: 100 }).catch(() => ({ items: [] })),
                        getMedicines({ limit: 500 }).catch(() => ({ items: [] }))
                    ]);
                    setCompositions(compRes.items || []);
                    setMedicinesForDropdown(medsResForComp.items || []);
                    break;
                }
                case 'batches':
                    const [batchResForTab, brandsResForBatches] = await Promise.all([
                        getBatches({ limit: 100 }).catch(() => ({ items: [] })),
                        getBrands({ limit: 100 }).catch(() => ({ items: [] }))
                    ]);
                    setBatches(batchResForTab.items || []);
                    setBrands(brandsResForBatches.items || []);
                    break;
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
                case 'inventory': {
                    const [brandsResForInv, batchResForInv] = await Promise.all([
                        getBrands({ limit: 100 }).catch(() => ({ items: [] })),
                        getBatches({ limit: 500 }).catch(() => ({ items: [] }))
                    ]);
                    setBrands(brandsResForInv.items || []);
                    setBatches(batchResForInv.items || []);
                    // Inventory transactions are loaded by the effect that depends on activeTab + medicineBrandIdFilter
                    break;
                }
                case 'roles':
                    if (forceReload || roles.length === 0) {
                        const rolesRes = await getRoles({ limit: 100 }).catch(() => ({ items: [] }));
                        setRoles(rolesRes.items || []);
                    }
                    break;
                case 'permissions':
                    if (forceReload || permissions.length === 0) {
                        const permsRes = await getPermissions({ limit: 100 }).catch(() => ({ items: [] }));
                        setPermissions(permsRes.items || []);
                    }
                    break;
                case 'role-permissions':
                    if (forceReload || rolePermissions.length === 0) {
                        const [rpRes, rolesRes, permsRes] = await Promise.all([
                            getRolePermissions({ limit: 100 }).catch(() => ({ items: [] })),
                            roles.length === 0 ? getRoles({ limit: 100 }).catch(() => ({ items: [] })) : Promise.resolve({ items: roles }),
                            permissions.length === 0 ? getPermissions({ limit: 100 }).catch(() => ({ items: [] })) : Promise.resolve({ items: permissions })
                        ]);
                        setRolePermissions(rpRes.items || []);
                        if (roles.length === 0) setRoles(rolesRes.items || []);
                        if (permissions.length === 0) setPermissions(permsRes.items || []);
                    }
                    break;
            }
            
            // Mark tab as loaded
            setLoadedTabs(prev => new Set([...prev, tab]));
        } catch (error) {
            const tabStr = typeof tab === 'string' ? tab : String(tab ?? 'unknown');
            const errMsg = error?.message ?? (typeof error === 'object' && error !== null ? 'Request failed' : String(error));
            console.error('Error fetching data for', tabStr, errMsg);
            if (error?.status === 403) {
                if (tab === 'dashboard') {
                    const sub = (dashboardSubTab === 'orders' ? 'finance' : dashboardSubTab) || 'finance';
                    setDashboardSubTabDenied(prev => ({ ...prev, [sub]: true }));
                    showNotify('You don\'t have permission to view this section. Contact your administrator.', 'error');
                } else {
                    setTabPermissionDenied(prev => new Set([...prev, tab]));
                    showNotify('You don\'t have permission to view this data. Contact your administrator.', 'error');
                }
            } else {
                showNotify(`Failed to load ${tab} data: ` + error.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // Load data when tab changes
    useEffect(() => {
        if (activeTab) {
            fetchTabData(activeTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, dashboardSubTab]);

    // When on inventory tab: load transactions (and when filter by medicine brand changes, refetch)
    useEffect(() => {
        if (activeTab !== 'inventory') return;
        const fetchInv = async () => {
            try {
                const res = await getInventoryTransactions({ limit: 100, medicine_brand_id: medicineBrandIdFilter || undefined });
                setInventoryTransactions(res.items || []);
            } catch {
                setInventoryTransactions([]);
            }
        };
        fetchInv();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, medicineBrandIdFilter]);

    // Refresh user permissions on mount to ensure we have latest data from backend
    // Use a ref to prevent multiple calls
    const permissionsRefreshedRef = useRef(false);
    
    useEffect(() => {
        const refreshUserPermissions = async () => {
            // Only refresh once and if user exists
            if (permissionsRefreshedRef.current || !user || !user.id) {
                return;
            }
            
            // Check if permissions are already loaded
            if (user.permissions && user.permissions.length > 0 && user.backendPermissions && user.backendPermissions.length > 0) {
                permissionsRefreshedRef.current = true;
                return;
            }
            
            permissionsRefreshedRef.current = true;
            
            try {
                const permResult = await getUserPermissions();
                const backendPermissions = permResult.permissions || [];
                const roleCode = permResult.role_code || null;
                const frontendPermissions = mapBackendPermissionsToFrontend(backendPermissions);

                // Use actual backend role instead of guessing
                const userRole = roleCode || user.backendRole || user.role || 'CUSTOMER';

                // Update user object with fresh permissions
                const updatedUser = {
                    ...user,
                    role: userRole,
                    backendRole: roleCode,
                    permissions: frontendPermissions,
                    backendPermissions: backendPermissions,
                };

                // Update localStorage only - don't call updateUser to avoid loading loop
                const storedAuth = localStorage.getItem('nb_auth');
                if (storedAuth) {
                    const parsed = JSON.parse(storedAuth);
                    localStorage.setItem('nb_auth', JSON.stringify({
                        ...parsed,
                        user: updatedUser
                    }));
                }

                console.log('User permissions refreshed:', {
                    role: userRole,
                    backendRole: roleCode,
                    frontendPermissions,
                    backendPermissions,
                });
            } catch (error) {
                console.warn('Failed to refresh permissions on Admin page load:', error);
                permissionsRefreshedRef.current = false; // Allow retry on error
            }
        };
        
        refreshUserPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]); // Only run when user.id changes

    // Load dashboard data on initial mount
    useEffect(() => {
        if (activeTab === 'dashboard') {
            fetchTabData('dashboard', true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            const meds = (medsRes.items || []).map(m => ({ ...m, therapeutic_category_name: m.therapeutic_category_name || '—' }));
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

    const [doctorForm, setDoctorForm] = useState({ 
        name: '', 
        specialty: '', 
        subSpecialty: '',
        qualification: '',
        bio: '',
        experience: '',
        education: '',
        specializations: '',
        morning: '10:00 AM - 1:00 PM', 
        evening: '5:00 PM - 9:00 PM', 
        consultationFee: '',
        phone: '',
        email: '',
        address: '',
        available: true 
    });
    const [productForm, setProductForm] = useState({ name: '', category: categories?.[0] || 'OTC', price: '', image: '', discount: '0', requiresPrescription: false, stock: true });
    const [medicineForm, setMedicineForm] = useState({ name: '', therapeutic_category_id: '', dosage_form: 'Tablet', schedule_type: 'OTC', is_controlled: false, description: '' });
    const [orderForm, setOrderForm] = useState({ customerId: '', customerName: '', phone: '', address: '', total: '', paymentMethod: 'cash' });
    const [appointmentForm, setAppointmentForm] = useState({ patientName: '', phone: '', doctorId: '', message: '', status: 'CONFIRMED', date: new Date().toISOString().slice(0, 10), time: '' });
    const [slotForm, setSlotForm] = useState({ start: '09:00', end: '11:00', active: true });
    const [couponForm, setCouponForm] = useState({ code: '', discount: 5, isActive: true, expiryDate: '', firstOrderOnly: false });
    const [managerForm, setManagerForm] = useState({ name: '', email: '', password: '', mobile_number: '', role_id: '' });
    const [categoryName, setCategoryName] = useState('');
    const [brandForm, setBrandForm] = useState({ brand_name: '', manufacturer: '', mrp: '', medicine_id: '', description: '' });
    const [compositionForm, setCompositionForm] = useState({ medicine_id: '', salt_name: '', strength: '', unit: '' });
    const [batchForm, setBatchForm] = useState({ medicine_brand_id: '', batch_number: '', expiry_date: '', purchase_price: '', quantity_available: '' });
    const [batchBrandSearch, setBatchBrandSearch] = useState('');
    const [batchBrandsLoadError, setBatchBrandsLoadError] = useState(null);
    const [showAddBrandFromBatchModal, setShowAddBrandFromBatchModal] = useState(false);
    const [quickAddBrandForm, setQuickAddBrandForm] = useState({ medicine_id: '', brand_name: '', manufacturer: '', mrp: '', description: '' });
    const [therapeuticCategoryForm, setTherapeuticCategoryForm] = useState({ name: '', description: '' });
    const [inventoryTransactionForm, setInventoryTransactionForm] = useState({ medicine_brand_id: '', product_batch_id: '', transaction_type: 'PURCHASE', quantity_change: '', remarks: '' });
    const [testBookingForm, setTestBookingForm] = useState({ test_id: '', patient_name: '', patient_phone: '', booking_date: '', booking_time: '', status: 'PENDING', notes: '' });
    const [roleForm, setRoleForm] = useState({ name: '', description: '' });
    const [permissionForm, setPermissionForm] = useState({ code: '', description: '' });
    const [rolePermissionForm, setRolePermissionForm] = useState({ role_id: '', permission_id: '' });

    // RBAC CRUD (roles, permissions, role-permissions)
    const addRoleFn = async (data) => {
        try {
            const created = await createRole({ name: data.name?.trim(), description: data.description || null });
            setRoles(prev => [...prev, created]);
            showNotify('Role created', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to create role: ' + (error?.message || ''), 'error');
            return false;
        }
    };
    const updateRoleFn = async (id, data) => {
        try {
            const updated = await updateRole(id, { name: data.name?.trim(), description: data.description ?? null });
            setRoles(prev => prev.map(r => r.id === id ? updated : r));
            showNotify('Role updated', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update role: ' + (error?.message || ''), 'error');
            return false;
        }
    };
    const deleteRoleFn = async (id) => {
        try {
            await deleteRoleApi(id);
            setRoles(prev => prev.filter(r => r.id !== id));
            showNotify('Role deleted', 'success');
        } catch (error) {
            showNotify('Failed to delete role: ' + (error?.message || ''), 'error');
        }
    };
    const addPermissionFn = async (data) => {
        try {
            const created = await createPermission({ code: data.code?.trim(), description: data.description || null });
            setPermissions(prev => [...prev, created]);
            showNotify('Permission created', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to create permission: ' + (error?.message || ''), 'error');
            return false;
        }
    };
    const updatePermissionFn = async (id, data) => {
        try {
            const updated = await updatePermission(id, { code: data.code?.trim(), description: data.description ?? null });
            setPermissions(prev => prev.map(p => p.id === id ? updated : p));
            showNotify('Permission updated', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update permission: ' + (error?.message || ''), 'error');
            return false;
        }
    };
    const deletePermissionFn = async (id) => {
        try {
            await deletePermissionApi(id);
            setPermissions(prev => prev.filter(p => p.id !== id));
            showNotify('Permission deleted', 'success');
        } catch (error) {
            showNotify('Failed to delete permission: ' + (error?.message || ''), 'error');
        }
    };
    const addRolePermissionFn = async (data) => {
        try {
            const created = await createRolePermission({ role_id: data.role_id, permission_id: data.permission_id });
            setRolePermissions(prev => [...prev, created]);
            showNotify('Permission assigned to role', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to assign permission: ' + (error?.message || ''), 'error');
            return false;
        }
    };
    const deleteRolePermissionFn = async (id) => {
        try {
            await deleteRolePermissionApi(id);
            setRolePermissions(prev => prev.filter(rp => rp.id !== id));
            showNotify('Permission removed from role', 'success');
        } catch (error) {
            showNotify('Failed to remove assignment: ' + (error?.message || ''), 'error');
        }
    };

    // New entity CRUD handlers
    const approvePrescriptionFn = async (id, notes = '') => {
        try {
            await approvePrescription(id, notes);
            setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
            showNotify('Prescription approved', 'success');
        } catch (error) { showNotify('Failed to approve: ' + (error?.message || ''), 'error'); }
    };
    const rejectPrescriptionFn = async (id, reason) => {
        try {
            await rejectPrescription(id, reason);
            setPrescriptions(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
            showNotify('Prescription rejected', 'success');
        } catch (error) { showNotify('Failed to reject: ' + (error?.message || ''), 'error'); }
    };
    const deletePrescriptionFn = async (id) => {
        try {
            await deletePrescriptionApi(id);
            setPrescriptions(prev => prev.filter(p => p.id !== id));
            showNotify('Prescription deleted', 'success');
        } catch (error) { showNotify('Failed to delete: ' + (error?.message || ''), 'error'); }
    };
    const addBrand = async (data) => {
        try {
            await createBrand(data);
            await fetchTabData('brands', true);
            showNotify('Brand added', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const openQuickAddBrandFromBatch = async () => {
        if ((medicinesForDropdown || []).length === 0) {
            const res = await getMedicines({ limit: 500 }).catch(() => ({ items: [] }));
            const meds = res.items || [];
            setMedicinesForDropdown(meds);
            setQuickAddBrandForm({ medicine_id: meds[0]?.id || '', brand_name: '', manufacturer: '', mrp: '', description: '' });
        } else {
            setQuickAddBrandForm({ medicine_id: (medicinesForDropdown[0]?.id) || '', brand_name: '', manufacturer: '', mrp: '', description: '' });
        }
        setShowAddBrandFromBatchModal(true);
    };
    const submitQuickAddBrandFromBatch = async (e) => {
        e?.preventDefault?.();
        if (!quickAddBrandForm.medicine_id || !quickAddBrandForm.brand_name?.trim() || !quickAddBrandForm.manufacturer?.trim() || quickAddBrandForm.mrp === '' || quickAddBrandForm.mrp == null) {
            showNotify('Please fill Medicine, Brand name, Company and MRP', 'error');
            return;
        }
        try {
            const created = await createBrand({
                medicine_id: quickAddBrandForm.medicine_id,
                brand_name: quickAddBrandForm.brand_name.trim(),
                manufacturer: quickAddBrandForm.manufacturer.trim(),
                mrp: Number(quickAddBrandForm.mrp),
                description: (quickAddBrandForm.description || '').trim() || undefined
            });
            await fetchTabData('batches', true);
            setBatchForm(prev => ({ ...prev, medicine_brand_id: created.id }));
            setShowAddBrandFromBatchModal(false);
            showNotify('Brand added. It is now selected above — complete batch details and save.');
        } catch (err) {
            showNotify(err?.message || 'Failed to add brand', 'error');
        }
    };
    const updateBrandFn = async (id, data) => {
        try {
            await updateBrand(id, data);
            await fetchTabData('brands', true);
            showNotify('Brand updated', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const deleteBrandFn = async (id) => {
        try {
            await deleteBrandApi(id);
            setBrands(prev => prev.filter(b => b.id !== id));
            showNotify('Brand deleted', 'success');
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); }
    };
    const addComposition = async (data) => {
        try {
            const created = await createComposition(data);
            setCompositions(prev => [...prev, created]);
            showNotify('Composition added', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const updateCompositionFn = async (id, data) => {
        try {
            const updated = await updateComposition(id, data);
            setCompositions(prev => prev.map(c => c.id === id ? updated : c));
            showNotify('Composition updated', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const deleteCompositionFn = async (id) => {
        try {
            await deleteCompositionApi(id);
            setCompositions(prev => prev.filter(c => c.id !== id));
            showNotify('Composition deleted', 'success');
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); }
    };
    const addBatch = async (data) => {
        try {
            const created = await createBatch(data);
            setBatches(prev => [...prev, created]);
            showNotify('Batch added', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const updateBatchFn = async (id, data) => {
        try {
            const updated = await updateBatch(id, data);
            setBatches(prev => prev.map(b => b.id === id ? updated : b));
            showNotify('Batch updated', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const deleteBatchFn = async (id) => {
        try {
            await deleteBatchApi(id);
            setBatches(prev => prev.filter(b => b.id !== id));
            showNotify('Batch deleted', 'success');
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); }
    };
    const addTherapeuticCategory = async (data) => {
        try {
            const created = await createTherapeuticCategory(data);
            setTherapeuticCategories(prev => [...prev, created]);
            showNotify('Category added', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const updateTherapeuticCategoryFn = async (id, data) => {
        try {
            const updated = await updateTherapeuticCategory(id, data);
            setTherapeuticCategories(prev => prev.map(c => c.id === id ? updated : c));
            showNotify('Category updated', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const deleteTherapeuticCategoryFn = async (id) => {
        try {
            await deleteTherapeuticCategoryApi(id);
            setTherapeuticCategories(prev => prev.filter(c => c.id !== id));
            showNotify('Category deleted', 'success');
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); }
    };
    const addInventoryTransaction = async (data) => {
        try {
            const created = await createInventoryTransaction({ ...data, quantity_change: Number(data.quantity_change) });
            setInventoryTransactions(prev => [...prev, created]);
            showNotify('Transaction added', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const updateInventoryTransactionFn = async (id, data) => {
        try {
            const updated = await updateInventoryTransaction(id, { ...data, quantity_change: Number(data.quantity_change) });
            setInventoryTransactions(prev => prev.map(t => t.id === id ? updated : t));
            showNotify('Transaction updated', 'success'); return true;
        } catch (error) { showNotify('Failed: ' + (error?.message || ''), 'error'); return false; }
    };
    const deleteInventoryTransactionFn = async (id) => {
        try {
            await deleteInventoryTransactionApi(id);
            setInventoryTransactions(prev => prev.filter(t => t.id !== id));
            showNotify('Transaction deleted', 'success');
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

        // Only DEV_ADMIN and ADMIN bypass permission checks
        const role = (user.backendRole || user.role || '').toUpperCase();
        if (role === 'DEV_ADMIN' || role === 'ADMIN') return true;

        // All other roles check specific permissions
        return user.permissions?.includes(perm);
    };

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
            const doctorsRes = await getDoctors({ limit: 100 }).catch(() => ({ items: [] }));
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

    const addMedicineGeneric = async (payload) => {
        try {
            await createMedicine(payload);
            setMedicinesPage(1);
            await fetchMedicines(1, getSearchForTab('medicines'), medicinesRowsPerPage);
            showNotify('Medicine added successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to add medicine: ' + (error?.message || ''), 'error');
            return false;
        }
    };

    const updateMedicineGenericFn = async (id, payload) => {
        try {
            await updateMedicine(id, payload);
            await fetchMedicines(medicinesPage, getSearchForTab('medicines'), medicinesRowsPerPage);
            showNotify('Medicine updated successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update medicine: ' + (error?.message || ''), 'error');
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

    const updateOrderStatusFn = async (id, status) => {
        try {
            const upperStatus = status.toUpperCase();
            await updateOrder(id, { order_status: upperStatus });
            setOrders(orders.map(o => o.id === id ? { ...o, order_status: upperStatus } : o));
            showNotify('Order status updated', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update order: ' + error.message, 'error');
            return false;
        }
    };

    const updateOrderApprovalFn = async (id, approvalStatus) => {
        try {
            await updateOrder(id, { approval_status: approvalStatus });
            setOrders(orders.map(o => o.id === id ? { ...o, approval_status: approvalStatus } : o));
            showNotify(`Order approval: ${approvalStatus}`, 'success');
            return true;
        } catch (error) {
            showNotify('Failed to update approval: ' + error.message, 'error');
            return false;
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

    const updateDeliverySettingsFn = async (settingsData) => {
        try {
            const updated = await updateDeliverySettingsApi(settingsData);
            setDeliverySettings(prev => ({ ...updated, slots: updated?.slots ?? prev?.slots ?? [] }));
            showNotify('Delivery settings updated', 'success');
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

    const addCategoryFn = async (name) => {
        try {
            await createCategory({ name, is_active: true });
            // Reload current tab data
            await fetchTabData(activeTab, true);
            showNotify('Category added successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to add category: ' + error.message, 'error');
            return false;
        }
    };

    const deleteCategoryFn = async (id) => {
        try {
            await deleteCategoryApi(id);
            // Reload current tab data
            await fetchTabData(activeTab, true);
            showNotify('Category deleted successfully', 'success');
            return true;
        } catch (error) {
            showNotify('Failed to delete category: ' + error.message, 'error');
            return false;
        }
    };



    const parseTimeForSlotEdit = (t) => parseTimeToHHmm(t) || '09:00';

    // Delete Confirmation State
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null, name: '' });

    const handleDoctorSubmit = async (e) => {
        e.preventDefault();
        const mode = modalMode;

        setShowModal(false);

        if (mode === 'add') {
            await addDoctor(doctorForm);
            showNotify('Doctor added');
        } else {
            await updateDoctorFn(editingId, doctorForm);
            showNotify('Doctor updated');
        }

        setDoctorForm({ 
            name: '', 
            specialty: '', 
            subSpecialty: '',
            qualification: '',
            bio: '',
            experience: '',
            education: '',
            specializations: '',
            morning: '', 
            evening: '', 
            consultationFee: '',
            phone: '',
            email: '',
            address: '',
            available: true 
        });
    };

    const startEditDoctor = (doc) => {
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
            consultationFee: doc.consultationFee != null && doc.consultationFee !== '' ? String(doc.consultationFee) : '',
            phone: doc.phone || '',
            email: doc.email || '',
            address: doc.address || '',
            available: doc.available 
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
            setProductForm({ name: '', category: categories?.[0] || 'OTC', price: '', image: '', discount: '0', requiresPrescription: false, stock: true });
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

    const handleSlotSubmit = async (e) => {
        e.preventDefault();
        const formattedTime = `${formatTimeTo12h(slotForm.start)} - ${formatTimeTo12h(slotForm.end)}`;
        if (modalMode === 'add') {
            if (!deliverySettings?.id) {
                showNotify('Load delivery settings first (refresh the tab)', 'error');
                return;
            }
            try {
                await createDeliverySlot({
                    delivery_settings_id: deliverySettings.id,
                    slot_time: formattedTime,
                    slot_order: (deliverySettings.slots?.length || 0) + 1
                });
                showNotify('Slot added', 'success');
                setShowModal(false);
                setSlotForm({ start: '09:00', end: '11:00', active: true });
                setEditingId(null);
                await fetchTabData('delivery', true);
            } catch (err) {
                showNotify('Failed to add slot: ' + (err?.message || ''), 'error');
            }
        } else {
            try {
                await updateDeliverySlot(editingId, { slot_time: formattedTime, is_active: slotForm.active });
                showNotify('Slot updated', 'success');
                setShowModal(false);
                setSlotForm({ start: '09:00', end: '11:00', active: true });
                setEditingId(null);
                await fetchTabData('delivery', true);
            } catch (err) {
                showNotify('Failed to update slot: ' + (err?.message || ''), 'error');
            }
        }
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

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return;
        await addCategoryFn(categoryName.trim());
        showNotify(`Category "${categoryName}" added!`);
        setCategoryName('');
        // Modal stays open for adding more categories
    };

    // RBAC Submit Handlers
    const handleRoleSubmit = async (e) => {
        e.preventDefault();
        if (!roleForm.name.trim()) {
            showNotify('Role name is required', 'error');
            return;
        }
        setShowModal(false);
        if (modalMode === 'add') {
            await addRoleFn(roleForm);
        } else {
            await updateRoleFn(editingId, roleForm);
        }
        setRoleForm({ name: '', description: '' });
        setEditingId(null);
        await fetchTabData('roles', true);
    };

    const handlePermissionSubmit = async (e) => {
        e.preventDefault();
        if (!permissionForm.code.trim()) {
            showNotify('Permission code is required', 'error');
            return;
        }
        setShowModal(false);
        if (modalMode === 'add') {
            await addPermissionFn(permissionForm);
        } else {
            await updatePermissionFn(editingId, permissionForm);
        }
        setPermissionForm({ code: '', description: '' });
        setEditingId(null);
        await fetchTabData('permissions', true);
    };

    const handleRolePermissionSubmit = async (e) => {
        e.preventDefault();
        if (!rolePermissionForm.role_id || !rolePermissionForm.permission_id) {
            showNotify('Both role and permission are required', 'error');
            return;
        }
        setShowModal(false);
        await addRolePermissionFn(rolePermissionForm);
        setRolePermissionForm({ role_id: '', permission_id: '' });
        await fetchTabData('role-permissions', true);
    };

    const handleNewEntitySubmit = async (e) => {
        e.preventDefault();
        let success = false;
        if (activeTab === 'medicines') {
            const sched = medicineForm.schedule_type || 'OTC';
            const isPrescriptionRequired = ['H', 'H1', 'Prescription'].includes(sched);
            const tcId = medicineForm.therapeutic_category_id && String(medicineForm.therapeutic_category_id).trim();
            if (modalMode === 'add' && !tcId) {
                showNotify('Please select a therapeutic category', 'error');
                return;
            }
            const payload = {
                name: medicineForm.name,
                dosage_form: medicineForm.dosage_form || 'Tablet',
                schedule_type: sched,
                is_prescription_required: isPrescriptionRequired,
                is_controlled: medicineForm.is_controlled === true,
                description: medicineForm.description || null,
                ...(tcId && { therapeutic_category_id: tcId }),
            };
            success = modalMode === 'add' ? await addMedicineGeneric(payload) : await updateMedicineGenericFn(editingId, payload);
        } else if (activeTab === 'brands') {
            success = modalMode === 'add' ? await addBrand(brandForm) : await updateBrandFn(editingId, brandForm);
        } else if (activeTab === 'compositions') {
            success = modalMode === 'add' ? await addComposition(compositionForm) : await updateCompositionFn(editingId, compositionForm);
        } else if (activeTab === 'batches') {
            success = modalMode === 'add' ? await addBatch(batchForm) : await updateBatchFn(editingId, batchForm);
        } else if (activeTab === 'therapeutic-categories') {
            success = modalMode === 'add' ? await addTherapeuticCategory(therapeuticCategoryForm) : await updateTherapeuticCategoryFn(editingId, therapeuticCategoryForm);
        } else if (activeTab === 'inventory') {
            success = modalMode === 'add' ? await addInventoryTransaction(inventoryTransactionForm) : await updateInventoryTransactionFn(editingId, inventoryTransactionForm);
        } else if (activeTab === 'test-bookings') {
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
            if (activeTab === 'medicines') fetchMedicines(medicinesPage, getSearchForTab('medicines'), medicinesRowsPerPage);
            else fetchTabData(activeTab, true);
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

    const deleteSlot = async (id) => {
        try {
            await deleteDeliverySlotApi(id);
            setDeliverySettings(prev => ({ ...prev, slots: (prev.slots || []).filter(s => s.id !== id) }));
            showNotify('Slot removed', 'success');
        } catch (err) {
            showNotify('Failed to remove slot: ' + (err?.message || ''), 'error');
        }
    };


    const startEditProduct = (prod) => {
        setModalMode('edit');
        setEditingId(prod.id);
        setProductForm({ ...prod });
        setShowModal(true);
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
        } else if (deleteConfirm.type === 'role') {
            await deleteRoleFn(deleteConfirm.id);
        } else if (deleteConfirm.type === 'permission') {
            await deletePermissionFn(deleteConfirm.id);
        } else if (deleteConfirm.type === 'role-permission') {
            await deleteRolePermissionFn(deleteConfirm.id);
        } else if (deleteConfirm.type === 'prescription') {
            await deletePrescriptionFn(deleteConfirm.id);
            showNotify('Prescription deleted');
        } else if (deleteConfirm.type === 'test-booking') {
            await deleteTestBookingFn(deleteConfirm.id);
            showNotify('Test booking deleted');
        } else if (deleteConfirm.type === 'brand') {
            await deleteBrandFn(deleteConfirm.id);
        } else if (deleteConfirm.type === 'composition') {
            await deleteCompositionFn(deleteConfirm.id);
            showNotify('Composition deleted');
        } else if (deleteConfirm.type === 'batch') {
            await deleteBatchFn(deleteConfirm.id);
            showNotify('Batch deleted');
        } else if (deleteConfirm.type === 'therapeutic-category') {
            await deleteTherapeuticCategoryFn(deleteConfirm.id);
            showNotify('Therapeutic category deleted');
        } else if (deleteConfirm.type === 'inventory-transaction') {
            await deleteInventoryTransactionFn(deleteConfirm.id);
            showNotify('Inventory transaction deleted');
        } else {
            deleteSlot(deleteConfirm.id);
            showNotify('Slot deleted');
        }
        setDeleteConfirm({ show: false, type: '', id: null, name: '' });
    };

    // Determine user's actual role from backend
    const effectiveRole = (user?.backendRole || user?.role || '').toUpperCase();

    // Check if user is DEV_ADMIN (only DEV_ADMIN gets RBAC management tabs)
    const isDevAdmin = effectiveRole === 'DEV_ADMIN';

    const menuItems = [
        { id: 'dashboard', label: 'Statistics', icon: <LayoutDashboard size={20} />, permission: 'dashboard' },
        { id: 'doctors', label: 'Manage Doctors', icon: <Users size={20} />, permission: 'doctors' },
        { id: 'medicines', label: 'Manage Medicines', icon: <Pill size={20} />, permission: 'medicines' },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart size={20} />, permission: 'orders' },
        { id: 'appointments', label: 'Appointments', icon: <Clock size={20} />, permission: 'appointments' },
        { id: 'delivery', label: 'Delivery Settings', icon: <Truck size={20} />, permission: 'delivery' },
        { id: 'coupons', label: 'Coupons & Marquee', icon: <Ticket size={20} />, permission: 'coupons' },
        { id: 'staff', label: 'Manage Staff', icon: <UserCheck size={20} />, permission: 'staff' },
        { id: 'categories', label: 'Medicine Categories', icon: <Filter size={20} />, permission: 'medicines' },
        { id: 'prescriptions', label: 'Prescriptions', icon: <FileText size={20} />, permission: 'orders' },
        { id: 'test-bookings', label: 'Test Bookings', icon: <Calendar size={20} />, permission: 'appointments' },
        { id: 'brands', label: 'Medicine Brands', icon: <Package size={20} />, permission: 'medicines' },
        { id: 'compositions', label: 'Compositions', icon: <FlaskConical size={20} />, permission: 'medicines' },
        { id: 'batches', label: 'Product Batches', icon: <Warehouse size={20} />, permission: 'medicines' },
        { id: 'payments', label: 'Payments', icon: <CreditCard size={20} />, permission: 'orders' },
        { id: 'therapeutic-categories', label: 'Therapeutic Cat.', icon: <Tags size={20} />, permission: 'medicines' },
        { id: 'coupon-usages', label: 'Coupon Usages', icon: <BarChart3 size={20} />, permission: 'coupons' },
        { id: 'inventory', label: 'Inventory', icon: <ClipboardList size={20} />, permission: 'medicines' },
        { id: 'my-profile', label: 'My Profile', icon: <User size={20} /> },
        // RBAC Management tabs (only for DEV_ADMIN)
        ...(isDevAdmin ? [
            { id: 'roles', label: 'Roles', icon: <Shield size={20} />, permission: 'ROLE_VIEW', isRbac: true },
            { id: 'permissions', label: 'Permissions', icon: <Key size={20} />, permission: 'PERMISSION_VIEW', isRbac: true },
            { id: 'role-permissions', label: 'Role Permissions', icon: <Link2 size={20} />, permission: 'ROLE_PERMISSION_VIEW', isRbac: true },
        ] : []),
    ];

    // Only DEV_ADMIN and ADMIN see all menu items
    // All other roles (MANAGER, PHARMACIST, CASHIER, etc.) see only their permitted tabs
    const isAdminUser = effectiveRole === 'DEV_ADMIN' || effectiveRole === 'ADMIN';

    // Filter menu items based on permissions for non-admin roles
    // Items without a permission property (e.g., My Profile) are always visible
    const availableMenuItems = isAdminUser ? menuItems : menuItems.filter(item => !item.permission || hasPermission(item.permission));

    useEffect(() => {
        if (availableMenuItems.length > 0 && !availableMenuItems.find(m => m.id === activeTab)) {
            setActiveTab(availableMenuItems[0].id);
        }
    }, [user, availableMenuItems, activeTab]);

    // Keep Orders section active when viewing an order (order detail lives under Orders, not Dashboard)
    useEffect(() => {
        if (orderIdFromUrl) {
            setActiveTab('orders');
        }
    }, [orderIdFromUrl]);

    // When returning from order detail page, show Orders tab
    useEffect(() => {
        if (location.pathname === '/admin' && location.state?.tab === 'orders') {
            setActiveTab('orders');
        }
        if (location.pathname === '/admin' && location.state?.tab === 'coupon-usages') {
            setActiveTab('coupon-usages');
        }
    }, [location.pathname, location.state]);


    const filteredDoctors = (doctors || []).filter(d => (d && d.name && d.name.toLowerCase().includes(getSearchForTab('doctors').toLowerCase())));
    // Products are now filtered on the backend, no need for client-side filtering
    const filteredProducts = products || [];

    return (
        <div className={`admin-layout ${!isMobileSidebarOpen ? 'sidebar-closed' : ''}`}>
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
            <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`} aria-hidden={!isMobileSidebarOpen}>
                <div className="sidebar-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3>New Balan</h3>
                            <p>{effectiveRole === 'DEV_ADMIN' || effectiveRole === 'ADMIN' ? 'ADMIN PORTAL' : effectiveRole === 'MANAGER' ? 'MANAGER DASHBOARD' : effectiveRole === 'PHARMACIST' ? 'PHARMACIST DASHBOARD' : effectiveRole === 'CASHIER' ? 'CASHIER DASHBOARD' : effectiveRole === 'CUSTOMER_SERVICE' ? 'SUPPORT DASHBOARD' : 'DASHBOARD'}</p>
                        </div>
                        <button className="mobile-close-btn" onClick={() => setIsMobileSidebarOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {availableMenuItems.map(item => (
                        <div
                            key={item.id}
                            className={`nav-item ${activeTab === item.id || (item.id === 'orders' && orderIdFromUrl) ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsMobileSidebarOpen(false);
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <Link to="/" className="nav-item" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px' }} onClick={() => setIsMobileSidebarOpen(false)}>
                        <Home size={20} />
                        <span>View Website</span>
                    </Link>
                    <div className="nav-item logout-btn" onClick={() => { logout(); window.location.href = '/login'; }}>
                        <LogOut size={20} />
                        <span>Logout</span>
                    </div>
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
                        <h2>{orderIdFromUrl ? 'Order details' : (availableMenuItems.find(m => m.id === activeTab)?.label || 'Statistics')}</h2>
                    </div>
                    <div className="admin-user">
                        <div className="admin-user-info">
                            <span>{effectiveRole === 'DEV_ADMIN' ? 'Dev Admin' : effectiveRole === 'ADMIN' ? 'Administrator' : effectiveRole === 'MANAGER' ? 'Manager' : effectiveRole === 'PHARMACIST' ? 'Pharmacist' : effectiveRole === 'CASHIER' ? 'Cashier' : effectiveRole === 'CUSTOMER_SERVICE' ? 'Customer Service' : effectiveRole || 'User'}</span>
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
                    {orderIdFromUrl ? (
                        <OrderDetailPage
                            onUpdateStatus={updateOrderStatusFn}
                            onUpdateApproval={updateOrderApprovalFn}
                        />
                    ) : loading ? (
                        <div className="content-loading" style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            minHeight: '400px',
                            padding: '2rem'
                        }}>
                            <Loader2 size={48} className="spinning" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                            <p style={{ marginTop: '1.5rem', fontSize: '1rem', color: '#666' }}>Loading...</p>
                        </div>
                    ) : (
                        <div key={activeTab} className="content-wrapper animate-fade-in">
                            {/* Dashboard Tab */}
                            {activeTab === 'dashboard' && (
                                tabPermissionDenied.has('dashboard') ? (
                                    <div className="admin-table-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                                        <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.6 }} />
                                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>You don&apos;t have permission to view Statistics.</p>
                                        <p style={{ fontSize: '0.9rem' }}>Contact your administrator to get access.</p>
                                    </div>
                                ) : (
                                <div className="dashboard-view animate-slide-up">
                                    <div className="statistics-tabs">
                                        <button
                                            type="button"
                                            className={`statistics-tab ${dashboardSubTab === 'finance' ? 'active' : ''}`}
                                            onClick={() => { setDashboardSubTab('finance'); fetchTabData('dashboard', true); }}
                                        >
                                            Finance
                                        </button>
                                        <button
                                            type="button"
                                            className={`statistics-tab ${dashboardSubTab === 'inventory' ? 'active' : ''}`}
                                            onClick={() => { setDashboardSubTab('inventory'); fetchTabData('dashboard', true); }}
                                        >
                                            Inventory
                                        </button>
                                        <button
                                            type="button"
                                            className={`statistics-tab ${dashboardSubTab === 'sales' ? 'active' : ''}`}
                                            onClick={() => { setDashboardSubTab('sales'); fetchTabData('dashboard', true); }}
                                        >
                                            Sales
                                        </button>
                                    </div>

                                    {/* Statistics content per sub-tab */}
                                    {dashboardSubTab === 'finance' && (
                                        dashboardSubTabDenied.finance ? (
                                            <div className="admin-table-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                                                <Shield size={32} style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                                                <p style={{ fontWeight: 600 }}>You don&apos;t have permission to view Finance statistics.</p>
                                            </div>
                                        ) : <FinanceDashboard data={financeDashboard} />
                                    )}
                                    {dashboardSubTab === 'inventory' && (
                                        dashboardSubTabDenied.inventory ? (
                                            <div className="admin-table-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                                                <Shield size={32} style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                                                <p style={{ fontWeight: 600 }}>You don&apos;t have permission to view Inventory statistics.</p>
                                            </div>
                                        ) : <InventoryDashboard data={inventoryDashboard} />
                                    )}
                                    {dashboardSubTab === 'sales' && (
                                        dashboardSubTabDenied.sales ? (
                                            <div className="admin-table-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                                                <Shield size={32} style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
                                                <p style={{ fontWeight: 600 }}>You don&apos;t have permission to view Sales statistics.</p>
                                            </div>
                                        ) : <SalesDashboard data={salesDashboard} />
                                    )}
                                </div>
                                )
                            )}

                    {/* Doctors Tab */}
                    {activeTab === 'doctors' && (
                        <div className="admin-table-card animate-slide-up">
                            <div className="table-actions">
                                <div className="table-search"><Search size={18} /><input type="text" placeholder="Search doctors..." value={getSearchForTab('doctors')} onChange={(e) => { setSearchForTab('doctors', e.target.value); setDoctorsPage(1); }} /></div>
                                <button className="btn-add" onClick={() => { 
                                    setModalMode('add'); 
                                    setDoctorForm({ 
                                        name: '', 
                                        specialty: '', 
                                        subSpecialty: '',
                                        qualification: '',
                                        bio: '',
                                        experience: '',
                                        education: '',
                                        specializations: '',
                                        morning: '', 
                                        evening: '', 
                                        consultationFee: '',
                                        phone: '',
                                        email: '',
                                        address: '',
                                        available: true 
                                    }); 
                                    setShowModal(true); 
                                }}><Plus size={18} /> Add Doctor</button>
                            </div>
                            <div className="scrollable-section-wrapper">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead><tr><th>Doctor Name</th><th>Specialty</th><th>Consultation Fee</th><th>Morning</th><th>Evening</th><th>Actions</th></tr></thead>
                                        <tbody>{filteredDoctors
                                            .slice((doctorsPage - 1) * adminItemsPerPage, doctorsPage * adminItemsPerPage)
                                            .map(doc => (
                                                <tr key={doc.id}>
                                                    <td data-label="Doctor Name">{doc.name}</td>
                                                    <td data-label="Specialty">{doc.specialty}</td>
                                                    <td data-label="Consultation Fee">{doc.consultationFee != null ? `₹${Number(doc.consultationFee).toFixed(2)}` : '—'}</td>
                                                    <td data-label="Morning">{doc.morning ? formatTimeRangeTo24h(doc.morning) : '—'}</td>
                                                    <td data-label="Evening">{doc.evening ? formatTimeRangeTo24h(doc.evening) : '—'}</td>
                                                    <td data-label="Actions" className="actions">
                                                        <button className="action-btn" onClick={() => startEditDoctor(doc)}><Pencil size={16} /></button>
                                                        <button className="action-btn delete" onClick={() => requestDelete('doctor', doc.id, doc.name)}><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}</tbody>
                                    </table>
                                </div>
                            </div>
                            {Math.ceil(filteredDoctors.length / adminItemsPerPage) > 1 && (
                                <div className="pagination-bar">
                                    <button
                                        onClick={() => setDoctorsPage(p => Math.max(1, p - 1))}
                                        disabled={doctorsPage === 1}
                                        className="page-nav-btn"
                                    >
                                        <ArrowLeft size={18} /> Prev
                                    </button>
                                    <div className="page-numbers">
                                        Page <span>{doctorsPage}</span> of {Math.ceil(filteredDoctors.length / adminItemsPerPage)}
                                    </div>
                                    <button
                                        onClick={() => setDoctorsPage(p => Math.min(Math.ceil(filteredDoctors.length / adminItemsPerPage), p + 1))}
                                        disabled={doctorsPage === Math.ceil(filteredDoctors.length / adminItemsPerPage)}
                                        className="page-nav-btn"
                                    >
                                        Next <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Medicines Tab (generic medicines: name, therapeutic category, dosage form, etc.) */}
                    {activeTab === 'medicines' && (
                        <div className="admin-table-card animate-slide-up">
                            <div className="table-actions">
                                <div className="table-search"><Search size={18} /><input type="text" placeholder="Search medicines..." value={getSearchForTab('medicines')} onChange={(e) => { setSearchForTab('medicines', e.target.value); setMedicinesPage(1); }} /></div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
                                        Rows per page:
                                        <select value={medicinesRowsPerPage} onChange={(e) => { setMedicinesRowsPerPage(Number(e.target.value)); setMedicinesPage(1); }} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)', color: 'var(--admin-text)', cursor: 'pointer' }}>
                                            <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                                        </select>
                                    </label>
                                    <button className="btn-add" onClick={() => { setModalMode('add'); setMedicineForm({ name: '', therapeutic_category_id: (therapeuticCategories && therapeuticCategories[0]) ? String(therapeuticCategories[0].id) : '', dosage_form: 'Tablet', schedule_type: 'OTC', is_controlled: false, description: '' }); setShowModal(true); }}><Plus size={18} /> Add Medicine</button>
                                </div>
                            </div>
                            <div className="scrollable-section-wrapper">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead><tr><th>Name</th><th>Therapeutic Category</th><th>Dosage Form</th><th>Schedule</th><th>Rx</th><th>Active</th><th>Actions</th></tr></thead>
                                        <tbody>{(medicinesList || []).filter(m => !getSearchForTab('medicines') || (m.name || '').toLowerCase().includes((getSearchForTab('medicines') || '').toLowerCase()) || (m.therapeutic_category_name || '').toLowerCase().includes((getSearchForTab('medicines') || '').toLowerCase())).map(med => (
                                                <tr key={med.id}>
                                                    <td data-label="Name">{med.name || '—'}</td>
                                                    <td data-label="Therapeutic Category">{med.therapeutic_category_name || '—'}</td>
                                                    <td data-label="Dosage Form">{med.dosage_form || '—'}</td>
                                                    <td data-label="Schedule">{med.schedule_type || '—'}</td>
                                                    <td data-label="Rx">{med.is_prescription_required ? 'Yes' : 'No'}</td>
                                                    <td data-label="Active"><span className={`status-tag ${med.is_active !== false ? 'active' : 'inactive'}`}>{med.is_active !== false ? 'Yes' : 'No'}</span></td>
                                                    <td data-label="Actions" className="actions">
                                                        <button className="action-btn" onClick={() => { setModalMode('edit'); setEditingId(med.id); setMedicineForm({ name: med.name || '', therapeutic_category_id: med.therapeutic_category_id ? String(med.therapeutic_category_id) : '', dosage_form: med.dosage_form || 'Tablet', schedule_type: med.schedule_type || 'OTC', is_controlled: med.is_controlled === true, description: med.description || '' }); setShowModal(true); }}><Pencil size={16} /></button>
                                                        <button className="action-btn delete" onClick={() => requestDelete('medicine', med.id, med.name)}><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}</tbody>
                                    </table>
                                </div>
                            </div>
                            {medicinesPagination && medicinesPagination.total !== undefined && (
                                <div className="pagination-bar">
                                    <button
                                        onClick={() => setMedicinesPage(p => Math.max(1, p - 1))}
                                        disabled={medicinesPage === 1 || medicinesLoading || !medicinesPagination.has_previous}
                                        className="page-nav-btn"
                                    >
                                        <ArrowLeft size={18} /> Prev
                                    </button>
                                    <div className="page-numbers">
                                        Page <span>{medicinesPage}</span> of {Math.ceil(medicinesPagination.total / (medicinesPagination.limit || medicinesRowsPerPage)) || 1} ({medicinesPagination.total} total)
                                    </div>
                                    <button
                                        onClick={() => setMedicinesPage(p => p + 1)}
                                        disabled={!medicinesPagination.has_next || medicinesLoading}
                                        className="page-nav-btn"
                                    >
                                        Next <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === 'orders' && (
                        tabPermissionDenied.has('orders') ? (
                            <div className="admin-table-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                                <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.6 }} />
                                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>You don&apos;t have permission to view orders</p>
                                <p style={{ fontSize: '0.9rem' }}>Contact your administrator to get access.</p>
                            </div>
                        ) : (
                        <OrdersTab
                            orders={orders}
                            searchTerm={getSearchForTab('orders')}
                            setSearchTerm={(v) => setSearchForTab('orders', v)}
                            ordersPage={ordersPage}
                            setOrdersPage={setOrdersPage}
                            ordersRowsPerPage={ordersRowsPerPage}
                            setOrdersRowsPerPage={setOrdersRowsPerPage}
                            statusFilter={orderStatusFilter}
                            setStatusFilter={setOrderStatusFilter}
                            onUpdateStatus={updateOrderStatusFn}
                            onUpdateApproval={updateOrderApprovalFn}
                            onViewDetails={(order) => navigate(`/admin/orders/${order.id}`, { state: { order } })}
                            showNotify={showNotify}
                        />
                        )
                    )}

                    {/* Appointments Tab */}
                    {activeTab === 'appointments' && (
                        <div className="admin-table-card animate-slide-up">
                            <div className="table-actions">
                                <div className="table-search"><Search size={18} /><input type="text" placeholder="Search appointments..." value={getSearchForTab('appointments')} onChange={(e) => { setSearchForTab('appointments', e.target.value); setAppointmentsPage(1); }} /></div>
                                <button className="btn-add" onClick={async () => { setModalMode('add'); setAppointmentForm({ patientName: '', phone: '', doctorId: (doctors && doctors[0]) ? doctors[0].id : '', message: '', status: 'CONFIRMED', date: new Date().toISOString().slice(0, 10), time: '' }); if ((doctors || []).length === 0) { const dr = await getDoctors({ limit: 100 }).catch(() => ({ items: [] })); const list = (dr.items || []).map(mapDoctorToFrontend).filter(Boolean); setDoctors(list); } setShowModal(true); }}><Plus size={18} /> Add Appointment</button>
                            </div>
                            <div className="scrollable-section-wrapper">
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead><tr><th>Patient</th><th>Phone</th><th>Doctor</th><th>Status</th><th>Actions</th></tr></thead>
                                        <tbody>{(appointments || [])
                                            .filter(app => app && (
                                                (app.patientName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.phone || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.doctorName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase())
                                            ))
                                            .slice((appointmentsPage - 1) * adminItemsPerPage, appointmentsPage * adminItemsPerPage)
                                            .map(app => (
                                                <tr key={app.id}>
                                                    <td data-label="Patient">{app.patientName || 'N/A'}</td>
                                                    <td data-label="Phone">{app.phone || 'N/A'}</td>
                                                    <td data-label="Doctor">{app.doctorName || 'N/A'}</td>
                                                    <td data-label="Status">
                                                        <span className={`status-tag ${(app.status || '').toLowerCase()}`}>
                                                            {app.status || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td data-label="Actions" className="actions">
                                                        <button className="action-btn" onClick={() => {
                                                            setModalMode('edit');
                                                            setEditingId(app.id);
                                                            setAppointmentForm({
                                                                patientName: app.patientName || '',
                                                                phone: app.phone || '',
                                                                doctorId: app.doctorId || '',
                                                                message: app.message || '',
                                                                status: app.status || 'PENDING',
                                                                date: app.date ? (typeof app.date === 'string' ? app.date.slice(0, 10) : new Date(app.date).toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
                                                                time: timeToHHmm(app.time) || ''
                                                            });
                                                            setShowModal(true);
                                                        }} title="Edit"><Pencil size={16} /></button>
                                                        <button className="action-btn delete" onClick={() => requestDelete('appointment', app.id, app.patientName)} title="Delete"><Trash2 size={16} /></button>
                                                        {(app.status || '').toLowerCase() === 'pending' && (
                                                            <>
                                                                <button className="action-btn" onClick={() => { updateAppointmentStatusFn(app.id, 'Confirmed'); showNotify('Confirmed'); }} title="Confirm"><CheckCircle size={16} /></button>
                                                                <button className="action-btn delete" onClick={() => { updateAppointmentStatusFn(app.id, 'Cancelled'); showNotify('Cancelled', 'error'); }} title="Cancel"><XCircle size={16} /></button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}</tbody>
                                    </table>
                                </div>
                            </div>
                            {Math.ceil((appointments || []).filter(app => app && (
                                                (app.patientName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.phone || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.doctorName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase())
                                            )).length / adminItemsPerPage) > 1 && (
                                <div className="pagination-bar">
                                    <button
                                        onClick={() => setAppointmentsPage(p => Math.max(1, p - 1))}
                                        disabled={appointmentsPage === 1}
                                        className="page-nav-btn"
                                    >
                                        <ArrowLeft size={18} /> Prev
                                    </button>
                                    <div className="page-numbers">
                                        Page <span>{appointmentsPage}</span> of {Math.ceil((appointments || []).filter(app => app && (
                                                (app.patientName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.phone || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.doctorName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase())
                                            )).length / adminItemsPerPage)}
                                    </div>
                                    <button
                                        onClick={() => setAppointmentsPage(p => Math.min(Math.ceil((appointments || []).filter(app => app && (
                                                (app.patientName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.phone || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.doctorName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase())
                                            )).length / adminItemsPerPage), p + 1))}
                                        disabled={appointmentsPage === Math.ceil((appointments || []).filter(app => app && (
                                                (app.patientName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.phone || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase()) ||
                                                (app.doctorName || '').toLowerCase().includes((getSearchForTab('appointments') || '').toLowerCase())
                                            )).length / adminItemsPerPage)}
                                        className="page-nav-btn"
                                    >
                                        Next <ChevronRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delivery Tab */}
                    {activeTab === 'delivery' && (
                        <div className="animate-slide-up">
                            <div className="admin-table-card">
                                <div className="table-actions">
                                    <h3 style={{ fontWeight: 800 }}>Time Windows</h3>
                                    <button className="btn-add" onClick={() => { setModalMode('add'); setSlotForm({ start: '09:00', end: '11:00', active: true }); setShowModal(true); }}>
                                        <Plus size={18} /> Add Slot
                                    </button>
                                </div>
                                <div className="scrollable-section-wrapper">
                                    <div className="table-wrapper">
                                        <table className="admin-table">
                                            <thead>
                                                <tr>
                                                    <th>Time Slot</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {deliverySettings?.slots?.map(slot => (
                                                    <tr key={slot.id}>
                                                        <td data-label="Time Slot">{formatTimeRangeTo24h(slot.time) || slot.time}</td>
                                                        <td data-label="Status">
                                                            <span className={`status-tag ${slot.active ? 'active' : 'inactive'}`}>
                                                                {slot.active ? 'Active' : 'Hidden'}
                                                            </span>
                                                        </td>
                                                        <td data-label="Actions" className="actions">
                                                            <button className="action-btn" onClick={() => {
                                                                setModalMode('edit');
                                                                setEditingId(slot.id);
                                                                const [startPart, endPart] = slot.time.split(/\s*-\s*/).map((p) => p.trim());
                                                                setSlotForm({
                                                                    start: parseTimeForSlotEdit(startPart),
                                                                    end: parseTimeForSlotEdit(endPart),
                                                                    active: slot.active
                                                                });
                                                                setShowModal(true);
                                                            }}><Pencil size={16} /></button>
                                                            <button className="action-btn delete" onClick={() => deleteSlot(slot.id)}><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Coupons Tab */}
                    {activeTab === 'coupons' && (
                        <div className="animate-slide-up">
                            <div className="section-card">
                                <div className="marquee-header-flex">
                                    <div>
                                        <h3 style={{ marginBottom: '0.5rem' }}>Coupon Marquee Display</h3>
                                        <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>Enable or disable the scrolling coupon bar on the website.</p>
                                    </div>
                                    <div className="status-toggle-group">
                                        <button
                                            onClick={() => {
                                                if (marqueeSettings.show_marquee !== true) {
                                                    updateMarqueeSettingsFn({ show_marquee: true });
                                                    showNotify('Marquee On');
                                                }
                                            }}
                                            className={`toggle-btn on ${marqueeSettings.show_marquee !== false ? 'active' : ''}`}
                                        >
                                            VISIBLE
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (marqueeSettings.show_marquee !== false) {
                                                    updateMarqueeSettingsFn({ show_marquee: false });
                                                    showNotify('Marquee Off');
                                                }
                                            }}
                                            className={`toggle-btn off ${marqueeSettings.show_marquee === false ? 'active' : ''}`}
                                        >
                                            HIDDEN
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="admin-table-card">
                                <div className="table-actions">
                                    <div className="table-search"><Search size={18} /><input type="text" placeholder="Search coupons..." value={getSearchForTab('coupons')} onChange={(e) => setSearchForTab('coupons', e.target.value)} /></div>
                                    <button className="btn-add" onClick={() => { setModalMode('add'); setCouponForm({ code: '', discount: 5, isActive: true, expiryDate: '', firstOrderOnly: false }); setShowModal(true); }}><Plus size={18} /> Create Coupon</button>
                                </div>
                                <div className="scrollable-section-wrapper">
                                    <div className="table-wrapper">
                                        <table className="admin-table">
                                            <thead><tr><th>Code</th><th>Discount (%)</th><th>Expiry</th><th>First order only</th><th>Status</th><th>Actions</th></tr></thead>
                                            <tbody>
                                                {(coupons || []).filter(c => c && (c.code || '').toLowerCase().includes((getSearchForTab('coupons') || '').toLowerCase())).map(coupon => (
                                                    <tr key={coupon.id}>
                                                        <td data-label="Code"><strong style={{ color: 'var(--primary)' }}>{coupon.code}</strong></td>
                                                        <td data-label="Discount (%)">{Number(coupon.discount) ?? 0}%</td>
                                                        <td data-label="Expiry">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No Limit'}</td>
                                                        <td data-label="First order only">{coupon.firstOrderOnly ? 'Yes' : 'No'}</td>
                                                        <td data-label="Status">
                                                            <span className={`status-tag ${coupon.isActive ? 'active' : 'inactive'}`} style={{ cursor: 'pointer' }} onClick={() => updateCouponFn(coupon.id, { isActive: !coupon.isActive })}>
                                                                {coupon.isActive ? 'Enabled' : 'Disabled'}
                                                            </span>
                                                        </td>
                                                        <td data-label="Actions" className="actions">
                                                            <button className="action-btn" onClick={() => startEditCoupon(coupon)} title="Edit"><Pencil size={16} /></button>
                                                            <button className="action-btn delete" onClick={() => requestDelete('coupon', coupon.id, coupon.code)} title="Delete"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {coupons.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>No coupons created yet.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Staff Tab */}
                    {activeTab === 'staff' && (
                        <div className="admin-table-card staff-table-card animate-slide-up">
                            <div className="table-actions">
                                <div className="table-search"><Search size={18} /><input type="text" placeholder="Search staff..." value={getSearchForTab('staff')} onChange={(e) => setSearchForTab('staff', e.target.value)} /></div>
                                <button className="btn-add" onClick={async () => { setModalMode('add'); setManagerForm({ name: '', email: '', password: '', mobile_number: '', role_id: '' }); if (roles.length === 0) await fetchTabData('roles', true); setShowModal(true); }}><Plus size={18} /> Add Staff</button>
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
                                                        <button className="action-btn" onClick={() => {
                                                            setModalMode('edit');
                                                            setEditingId(manager.id);
                                                            setManagerForm({
                                                                name: manager.name || manager.full_name || '',
                                                                email: manager.email || '',
                                                                password: '',
                                                                mobile_number: manager.mobile_number || '',
                                                                role_id: manager.role_id || ''
                                                            });
                                                            if (roles.length === 0) fetchTabData('roles', true);
                                                            setShowModal(true);
                                                        }} title="Edit"><Pencil size={16} /></button>
                                                        <button className="action-btn delete" onClick={() => requestDelete('manager', manager.id, manager.name || manager.full_name || 'Unknown')} title="Delete"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!managers || managers.length === 0) && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>No staff added yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                        <CategoriesTab
                            categories={categories}
                            searchTerm={getSearchForTab('categories')}
                            setSearchTerm={(v) => setSearchForTab('categories', v)}
                            categoriesPage={categoriesPage}
                            setCategoriesPage={setCategoriesPage}
                            adminItemsPerPage={adminItemsPerPage}
                            onAddClick={() => {
                                setModalMode('add');
                                setCategoryName('');
                                setShowModal(true);
                            }}
                            onDeleteClick={(cat) => {
                                // Note: This needs category ID, not name - you may need to adjust
                                showNotify('Category deletion requires ID', 'info');
                            }}
                            showNotify={showNotify}
                        />
                    )}

                    {/* Roles Tab */}
                    {activeTab === 'roles' && (
                        <RolesTab
                            roles={roles}
                            searchTerm={getSearchForTab('roles')}
                            setSearchTerm={(v) => setSearchForTab('roles', v)}
                            onAddClick={() => {
                                setModalMode('add');
                                setRoleForm({ name: '', description: '' });
                                setShowModal(true);
                            }}
                            onEditClick={(role) => {
                                setModalMode('edit');
                                setEditingId(role.id);
                                setRoleForm({ name: role.name || '', description: role.description || '' });
                                setShowModal(true);
                            }}
                            onDeleteClick={requestDelete}
                            onDataLoad={(data) => setRoles(data)}
                        />
                    )}

                    {/* Permissions Tab */}
                    {activeTab === 'permissions' && (
                        <PermissionsTab
                            permissions={permissions}
                            searchTerm={getSearchForTab('permissions')}
                            setSearchTerm={(v) => setSearchForTab('permissions', v)}
                            onAddClick={() => {
                                setModalMode('add');
                                setPermissionForm({ code: '', description: '' });
                                setShowModal(true);
                            }}
                            onEditClick={(permission) => {
                                setModalMode('edit');
                                setEditingId(permission.id);
                                setPermissionForm({ code: permission.code || '', description: permission.description || '' });
                                setShowModal(true);
                            }}
                            onDeleteClick={requestDelete}
                            onDataLoad={(data) => setPermissions(data)}
                        />
                    )}

                    {/* Role Permissions Tab */}
                    {activeTab === 'role-permissions' && (
                        <RolePermissionsTab
                            roles={roles}
                            permissions={permissions}
                            rolePermissions={rolePermissions}
                            searchTerm={getSearchForTab('role-permissions')}
                            setSearchTerm={(v) => setSearchForTab('role-permissions', v)}
                            onAssignClick={() => {
                                setModalMode('add');
                                setRolePermissionForm({ role_id: '', permission_id: '' });
                                setShowModal(true);
                            }}
                            onRemoveClick={requestDelete}
                            onBulkAssignClick={(roleId) => {
                                setModalMode('bulk-assign');
                                setEditingId(roleId);
                                setShowModal(true);
                            }}
                            onDataLoad={(data) => {
                                if (data.rolePermissions) setRolePermissions(data.rolePermissions);
                                if (data.roles) setRoles(data.roles);
                                if (data.permissions) setPermissions(data.permissions);
                            }}
                        />
                    )}
                    {activeTab === 'prescriptions' && (
                        <PrescriptionsTab
                            prescriptions={prescriptions}
                            searchTerm={getSearchForTab('prescriptions')}
                            setSearchTerm={(v) => setSearchForTab('prescriptions', v)}
                            prescriptionsPage={prescriptionsPage}
                            setPrescriptionsPage={setPrescriptionsPage}
                            prescriptionsRowsPerPage={prescriptionsRowsPerPage}
                            setPrescriptionsRowsPerPage={setPrescriptionsRowsPerPage}
                            statusFilter={prescriptionStatusFilter}
                            setStatusFilter={(val) => { setPrescriptionStatusFilter(val); fetchTabData('prescriptions'); }}
                            onApprove={approvePrescriptionFn}
                            onReject={rejectPrescriptionFn}
                            onViewFile={(id) => {
                                const url = buildApiUrl(`/prescriptions/${id}/download`);
                                window.open(url, '_blank');
                            }}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'test-bookings' && (
                        <TestBookingsTab
                            testBookings={testBookings}
                            polyclinicTests={polyclinicTests}
                            searchTerm={getSearchForTab('test-bookings')}
                            setSearchTerm={(v) => setSearchForTab('test-bookings', v)}
                            testBookingsPage={testBookingsPage}
                            setTestBookingsPage={setTestBookingsPage}
                            testBookingsRowsPerPage={testBookingsRowsPerPage}
                            setTestBookingsRowsPerPage={setTestBookingsRowsPerPage}
                            onAddClick={async () => { const today = new Date().toISOString().slice(0, 10); setModalMode('add'); let tests = polyclinicTests || []; if (tests.length === 0) { const pt = await getPolyclinicTests({ limit: 100 }).catch(() => ({ items: [] })); tests = pt.items || []; setPolyclinicTests(tests); } setTestBookingForm({ test_id: tests[0] ? tests[0].id : '', patient_name: '', patient_phone: '', booking_date: today, booking_time: '', status: 'PENDING', notes: '' }); setShowModal(true); }}
                            onEditClick={(b) => { setModalMode('edit'); setEditingId(b.id); const dateStr = b.booking_date ? (typeof b.booking_date === 'string' ? b.booking_date.slice(0, 10) : new Date(b.booking_date).toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10); setTestBookingForm({ test_id: b.test_id || '', patient_name: b.patient_name || '', patient_phone: b.patient_phone || '', booking_date: dateStr, booking_time: timeToHHmm(b.booking_time) || '', status: b.status || 'PENDING', notes: b.notes || '' }); setShowModal(true); }}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'brands' && (
                        <BrandsTab
                            brands={brands}
                            searchTerm={getSearchForTab('brands')}
                            setSearchTerm={(v) => setSearchForTab('brands', v)}
                            brandsPage={brandsPage}
                            setBrandsPage={setBrandsPage}
                            brandsRowsPerPage={brandsRowsPerPage}
                            setBrandsRowsPerPage={setBrandsRowsPerPage}
                            onAddClick={async () => {
                                        const meds = await getAllMedicinesForSelect();
                                        setMedicinesForDropdown(meds);
                                        setModalMode('add');
                                        setBrandForm({ medicine_id: (meds[0] && meds[0].id) ? String(meds[0].id) : '', brand_name: '', manufacturer: '', mrp: '', description: '' });
                                        setShowModal(true);
                                    }}
                            onEditClick={async (b) => {
                                        const meds = await getAllMedicinesForSelect();
                                        setMedicinesForDropdown(meds);
                                        setModalMode('edit');
                                        setEditingId(b.id);
                                        setBrandForm({ brand_name: b.brand_name || '', manufacturer: b.manufacturer || '', mrp: b.mrp || '', medicine_id: b.medicine_id ? String(b.medicine_id) : '', description: b.description || '' });
                                        setShowModal(true);
                                    }}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'compositions' && (
                        <CompositionsTab
                            compositions={compositions}
                            searchTerm={getSearchForTab('compositions')}
                            setSearchTerm={(v) => setSearchForTab('compositions', v)}
                            compositionsPage={compositionsPage}
                            setCompositionsPage={setCompositionsPage}
                            compositionsRowsPerPage={compositionsRowsPerPage}
                            setCompositionsRowsPerPage={setCompositionsRowsPerPage}
                            onAddClick={async () => {
                                        const meds = await getAllMedicinesForSelect();
                                        setMedicinesForDropdown(meds);
                                        setModalMode('add');
                                        setCompositionForm({ medicine_id: (meds[0] && meds[0].id) ? String(meds[0].id) : '', salt_name: '', strength: '', unit: '' });
                                        setShowModal(true);
                                    }}
                            onEditClick={async (c) => {
                                        const meds = await getAllMedicinesForSelect();
                                        setMedicinesForDropdown(meds);
                                        setModalMode('edit');
                                        setEditingId(c.id);
                                        setCompositionForm({ medicine_id: c.medicine_id ? String(c.medicine_id) : '', salt_name: c.salt_name || '', strength: c.strength || '', unit: c.unit || '' });
                                        setShowModal(true);
                                    }}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'batches' && (
                        <BatchesTab
                            batches={batches}
                            brands={brands}
                            searchTerm={getSearchForTab('batches')}
                            setSearchTerm={(v) => setSearchForTab('batches', v)}
                            batchesPage={batchesPage}
                            setBatchesPage={setBatchesPage}
                            batchesRowsPerPage={batchesRowsPerPage}
                            setBatchesRowsPerPage={setBatchesRowsPerPage}
                            onAddClick={async () => {
                                setBatchBrandSearch('');
                                setBatchBrandsLoadError(null);
                                try {
                                    const res = await getBrands({ limit: 100 });
                                    const brandList = res.items || [];
                                    setBrands(brandList);
                                    setModalMode('add');
                                    setBatchForm({ medicine_brand_id: brandList[0]?.id || '', batch_number: '', expiry_date: '', purchase_price: '', quantity_available: '' });
                                    setShowModal(true);
                                } catch (err) {
                                    setBatchBrandsLoadError(err?.message || 'Failed to load brands');
                                    showNotify(err?.message || 'Failed to load brands', 'error');
                                }
                            }}
                            onEditClick={(b) => { setModalMode('edit'); setEditingId(b.id); setBatchBrandSearch(''); setBatchForm({ medicine_brand_id: b.medicine_brand_id || '', batch_number: b.batch_number || '', expiry_date: b.expiry_date || '', purchase_price: b.purchase_price || '', quantity_available: b.quantity_available || '' }); setShowModal(true); }}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'payments' && (
                        tabPermissionDenied.has('payments') ? (
                            <div className="admin-table-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-text-secondary)' }}>
                                <Shield size={48} style={{ marginBottom: '1rem', opacity: 0.6 }} />
                                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>You don&apos;t have permission to view payments</p>
                                <p style={{ fontSize: '0.9rem' }}>Contact your administrator to get access.</p>
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
                            onAddClick={() => { setModalMode('add'); setTherapeuticCategoryForm({ name: '', description: '' }); setShowModal(true); }}
                            onEditClick={(c) => { setModalMode('edit'); setEditingId(c.id); setTherapeuticCategoryForm({ name: c.name || '', description: c.description || '' }); setShowModal(true); }}
                            onDeleteClick={requestDelete}
                        />
                    )}
                    {activeTab === 'coupon-usages' && (
                        <CouponUsagesTab
                            couponUsages={couponUsages}
                            searchTerm={getSearchForTab('coupon-usages')}
                            setSearchTerm={(v) => setSearchForTab('coupon-usages', v)}
                            couponUsagesPage={couponUsagesPage}
                            setCouponUsagesPage={setCouponUsagesPage}
                            couponUsagesRowsPerPage={couponUsagesRowsPerPage}
                            setCouponUsagesRowsPerPage={setCouponUsagesRowsPerPage}
                            onViewOrder={(orderId) => navigate(`/admin/orders/${orderId}`, { state: { fromTab: 'coupon-usages' } })}
                        />
                    )}
                    {activeTab === 'inventory' && (
                        <InventoryTab
                            inventoryTransactions={inventoryTransactions}
                            brands={brands}
                            batches={batches}
                            searchTerm={getSearchForTab('inventory')}
                            setSearchTerm={(v) => setSearchForTab('inventory', v)}
                            inventoryPage={inventoryPage}
                            setInventoryPage={setInventoryPage}
                            inventoryRowsPerPage={inventoryRowsPerPage}
                            setInventoryRowsPerPage={setInventoryRowsPerPage}
                            medicineBrandIdFilter={medicineBrandIdFilter}
                            setMedicineBrandIdFilter={setMedicineBrandIdFilter}
                            onAddClick={() => { setModalMode('add'); setInventoryTransactionForm({ medicine_brand_id: (brands && brands[0]) ? brands[0].id : '', product_batch_id: '', transaction_type: 'PURCHASE', quantity_change: '', remarks: '' }); setShowModal(true); }}
                            onEditClick={(t) => { setModalMode('edit'); setEditingId(t.id); setInventoryTransactionForm({ medicine_brand_id: t.medicine_brand_id || '', product_batch_id: t.product_batch_id || '', transaction_type: t.transaction_type || 'PURCHASE', quantity_change: t.quantity_change || '', remarks: t.remarks || '' }); setShowModal(true); }}
                            onDeleteClick={requestDelete}
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
                    <div className={`admin-modal ${activeTab !== 'dashboard' ? 'compact-modal' : ''}`}>
                        <div className="modal-header">
                            <h3>{modalMode === 'add' ? 'New' : 'Update'} {
                                activeTab === 'staff' ? 'Staff' :
                                activeTab === 'categories' ? 'Category' :
                                activeTab === 'roles' ? 'Role' :
                                activeTab === 'permissions' ? 'Permission' :
                                activeTab === 'role-permissions' ? 'Role Permission' :
                                activeTab === 'medicines' ? 'Medicine' :
                                activeTab === 'brands' ? 'Brand' :
                                activeTab === 'compositions' ? 'Composition' :
                                activeTab === 'batches' ? 'Batch' :
                                activeTab === 'therapeutic-categories' ? 'Therapeutic Category' :
                                activeTab === 'inventory' ? 'Inventory Transaction' :
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
                                                    activeTab === 'categories' ? handleCategorySubmit :
                                                        activeTab === 'roles' ? handleRoleSubmit :
                                                            activeTab === 'permissions' ? handlePermissionSubmit :
                                                                activeTab === 'role-permissions' ? handleRolePermissionSubmit :
                                                                    activeTab === 'medicines' ? handleNewEntitySubmit :
                                                                        activeTab === 'brands' ? handleNewEntitySubmit :
                                                                            activeTab === 'compositions' ? handleNewEntitySubmit :
                                                                            activeTab === 'batches' ? handleNewEntitySubmit :
                                                                                activeTab === 'therapeutic-categories' ? handleNewEntitySubmit :
                                                                                    activeTab === 'inventory' ? handleNewEntitySubmit :
                                                                                        activeTab === 'test-bookings' ? handleNewEntitySubmit :
                                                                                            handleSlotSubmit
                        } className="modal-form">
                            {activeTab === 'doctors' && (
                                <>
                                    <div className="form-group"><label>Doctor Name*</label><input type="text" required value={doctorForm.name} onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })} /></div>
                                    <div className="form-group"><label>Specialization*</label><input type="text" required value={doctorForm.specialty} onChange={e => setDoctorForm({ ...doctorForm, specialty: e.target.value })} /></div>
                                    <div className="form-group"><label>Sub-Specialty</label><input type="text" value={doctorForm.subSpecialty} onChange={e => setDoctorForm({ ...doctorForm, subSpecialty: e.target.value })} placeholder="e.g., Cardiology" /></div>
                                    <div className="form-group"><label>Qualifications</label><input type="text" value={doctorForm.qualification} onChange={e => setDoctorForm({ ...doctorForm, qualification: e.target.value })} placeholder="e.g., MBBS, MD" /></div>
                                    <div className="form-group"><label>About / Biography</label><textarea rows="4" value={doctorForm.bio} onChange={e => setDoctorForm({ ...doctorForm, bio: e.target.value })} placeholder="Doctor's biography and background..." /></div>
                                    <div className="form-group"><label>Experience</label><textarea rows="2" value={doctorForm.experience} onChange={e => setDoctorForm({ ...doctorForm, experience: e.target.value })} placeholder="e.g., 15+ years of experience in general medicine" /></div>
                                    <div className="form-group"><label>Education</label><input type="text" value={Array.isArray(doctorForm.education) ? doctorForm.education.join(', ') : (doctorForm.education ?? '')} onChange={e => setDoctorForm({ ...doctorForm, education: e.target.value })} placeholder="Comma-separated: MBBS from ABC, MD from XYZ" /></div>
                                    <div className="form-group"><label>Specializations</label><input type="text" value={Array.isArray(doctorForm.specializations) ? doctorForm.specializations.join(', ') : (doctorForm.specializations ?? '')} onChange={e => setDoctorForm({ ...doctorForm, specializations: e.target.value })} placeholder="Comma-separated: Cardiology, Diabetes Management" /></div>
                                    <div className="form-group"><label>Morning Slot (optional)</label><input type="text" value={doctorForm.morning || ''} onChange={e => setDoctorForm({ ...doctorForm, morning: e.target.value })} placeholder="e.g., 10:00 - 13:00 (24h)" /></div>
                                    <div className="form-group"><label>Evening Slot (optional)</label><input type="text" value={doctorForm.evening || ''} onChange={e => setDoctorForm({ ...doctorForm, evening: e.target.value })} placeholder="e.g., 17:00 - 21:00 (24h)" /></div>
                                    <div className="form-group"><label>Consultation Fee (₹)</label><input type="number" step="0.01" min="0" value={doctorForm.consultationFee} onChange={e => setDoctorForm({ ...doctorForm, consultationFee: e.target.value })} placeholder="e.g., 500" /></div>
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--admin-border)' }}>
                                        <h4 style={{ marginBottom: '1rem', color: 'var(--admin-text)', fontSize: '1rem' }}>Contact Information</h4>
                                        <div className="form-group"><label>Phone</label><input type="tel" value={doctorForm.phone} onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })} placeholder="+91 9894880598" /></div>
                                        <div className="form-group"><label>Email</label><input type="email" value={doctorForm.email} onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })} placeholder="doctor@example.com" /></div>
                                        <div className="form-group"><label>Address</label><textarea rows="3" value={doctorForm.address} onChange={e => setDoctorForm({ ...doctorForm, address: e.target.value })} placeholder="Full address..." /></div>
                                    </div>
                                </>
                            )}
                            {activeTab === 'medicines' && (
                                <>
                                    <div className="form-group"><label>Medicine name*</label><input type="text" required value={medicineForm.name} placeholder="e.g. Paracetamol" onChange={e => setMedicineForm({ ...medicineForm, name: e.target.value })} /></div>
                                    <div className="form-group">
                                        <label>Therapeutic category*</label>
                                        <select required value={String(medicineForm.therapeutic_category_id || '')} onChange={e => setMedicineForm({ ...medicineForm, therapeutic_category_id: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                            <option value="">Select category</option>
                                            {(therapeuticCategories || []).map(c => <option key={c.id} value={String(c.id || '')}>{c.name || '—'}</option>)}
                                        </select>
                                        {(therapeuticCategories || []).length === 0 && <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Add categories in Therapeutic Cat. tab first (data from database).</small>}
                                        {(therapeuticCategories || []).length > 0 && <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>From Therapeutic Cat. (database)</small>}
                                    </div>
                                    <div className="form-group"><label>Dosage form*</label><input type="text" required value={medicineForm.dosage_form} placeholder="e.g. Tablet, Syrup" onChange={e => setMedicineForm({ ...medicineForm, dosage_form: e.target.value })} /></div>
                                    <div className="form-group">
                                        <label>Schedule*</label>
                                        <select value={medicineForm.schedule_type} onChange={e => setMedicineForm({ ...medicineForm, schedule_type: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                            <option value="OTC">OTC</option>
                                            <option value="G">G</option>
                                            <option value="H">H</option>
                                            <option value="H1">H1</option>
                                            <option value="Prescription">Prescription</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input type="checkbox" id="med-controlled" checked={medicineForm.is_controlled === true} onChange={e => setMedicineForm({ ...medicineForm, is_controlled: e.target.checked })} />
                                        <label htmlFor="med-controlled" style={{ marginBottom: 0 }}>Controlled substance</label>
                                    </div>
                                    <div className="form-group"><label>Description</label><textarea rows={2} value={medicineForm.description || ''} placeholder="Optional" onChange={e => setMedicineForm({ ...medicineForm, description: e.target.value })} /></div>
                                </>
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
                                    <div className="form-group"><label>Date*</label><input type="date" required value={appointmentForm.date || ''} onChange={e => setAppointmentForm({ ...appointmentForm, date: e.target.value })} /></div>
                                    <div className="form-group"><label>Time</label><input type="time" value={timeToHHmm(appointmentForm.time) || ''} onChange={e => setAppointmentForm({ ...appointmentForm, time: e.target.value })} placeholder="Optional" /></div>
                                    <div className="form-group"><label>Status</label><select value={appointmentForm.status} onChange={e => setAppointmentForm({ ...appointmentForm, status: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="COMPLETED">Completed</option></select></div>
                                    <div className="form-group"><label>Patient Message</label><textarea value={appointmentForm.message} onChange={e => setAppointmentForm({ ...appointmentForm, message: e.target.value })} placeholder="Message from patient (optional)"></textarea></div>
                                </>
                            )}
                            {activeTab === 'delivery' && (
                                <>
                                    <div className="form-group">
                                        <label>Start (e.g., 09:00)</label>
                                        <input type="time" required value={slotForm.start} onChange={e => setSlotForm({ ...slotForm, start: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>End (e.g., 11:00)</label>
                                        <input type="time" required value={slotForm.end} onChange={e => setSlotForm({ ...slotForm, end: e.target.value })} />
                                    </div>
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
                                        <input type="date" value={couponForm.expiryDate} onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })} />
                                        <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>After this date the coupon will be terminated and cannot be used</small>
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
                            {activeTab === 'categories' && (
                                <>
                                    <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, border: '1px solid #dbeafe' }}>
                                        💡 Add multiple categories. Close the modal when done.
                                    </div>
                                    <div className="form-group">
                                        <label>Category Name*</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Wellness"
                                            value={categoryName}
                                            onChange={e => setCategoryName(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}
                            {activeTab === 'roles' && (
                                <>
                                    <div className="form-group">
                                        <label>Role Name*</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. PHARMACIST, ADMIN"
                                            value={roleForm.name}
                                            onChange={e => setRoleForm({ ...roleForm, name: e.target.value.toUpperCase() })}
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            rows="3"
                                            placeholder="Describe the role's purpose and responsibilities..."
                                            value={roleForm.description}
                                            onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            {activeTab === 'permissions' && (
                                <>
                                    <div className="form-group">
                                        <label>Permission Code*</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. PRESCRIPTION_REVIEW, INVENTORY_UPDATE"
                                            value={permissionForm.code}
                                            onChange={e => setPermissionForm({ ...permissionForm, code: e.target.value.toUpperCase() })}
                                            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            rows="3"
                                            placeholder="Describe what this permission allows..."
                                            value={permissionForm.description}
                                            onChange={e => setPermissionForm({ ...permissionForm, description: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                            {activeTab === 'role-permissions' && (
                                <>
                                    <div className="form-group">
                                        <label>Role*</label>
                                        <select
                                            required
                                            value={rolePermissionForm.role_id}
                                            onChange={e => setRolePermissionForm({ ...rolePermissionForm, role_id: e.target.value })}
                                        >
                                            <option value="">Select Role</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Permission*</label>
                                        <select
                                            required
                                            value={rolePermissionForm.permission_id}
                                            onChange={e => setRolePermissionForm({ ...rolePermissionForm, permission_id: e.target.value })}
                                        >
                                            <option value="">Select Permission</option>
                                            {permissions.map(permission => (
                                                <option key={permission.id} value={permission.id}>
                                                    {permission.code} - {permission.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            {activeTab === 'brands' && (
                                <>
                                    <div className="form-group">
                                        <label>Medicine (drug name)*</label>
                                        <select
                                            required
                                            value={String(brandForm.medicine_id || '')}
                                            onChange={e => setBrandForm({ ...brandForm, medicine_id: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                        >
                                            <option value="">Select medicine (e.g. Paracetamol)</option>
                                            {(medicinesForDropdown || []).map(m => (
                                                <option key={m.id} value={String(m.id || '')}>{m.name || '—'}</option>
                                            ))}
                                        </select>
                                        {(medicinesForDropdown || []).length === 0 && <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Add medicines in Manage Medicines first.</small>}
                                        {(medicinesForDropdown || []).length > 0 && (
                                            <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                                {(medicinesForDropdown || []).length} medicine(s) available
                                            </small>
                                        )}
                                    </div>
                                    <div className="form-group"><label>Brand / Manufacturer*</label><input type="text" required value={brandForm.brand_name} onChange={e => setBrandForm({ ...brandForm, brand_name: e.target.value })} placeholder="e.g. Dolo, Crocin" /></div>
                                    <div className="form-group"><label>Company*</label><input type="text" required value={brandForm.manufacturer} onChange={e => setBrandForm({ ...brandForm, manufacturer: e.target.value })} placeholder="e.g. Micro Labs, GSK" /></div>
                                    <div className="form-group"><label>MRP (₹)*</label><input type="number" step="0.01" required value={brandForm.mrp} onChange={e => setBrandForm({ ...brandForm, mrp: e.target.value })} placeholder="0.00" /></div>
                                    <div className="form-group"><label>Description</label><textarea rows="2" value={brandForm.description} onChange={e => setBrandForm({ ...brandForm, description: e.target.value })} placeholder="Optional" /></div>
                                </>
                            )}
                            {activeTab === 'compositions' && (
                                <>
                                    <div className="form-group">
                                        <label>Medicine*</label>
                                        <select
                                            required
                                            value={String(compositionForm.medicine_id || '')}
                                            onChange={e => setCompositionForm({ ...compositionForm, medicine_id: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                        >
                                            <option value="">Select medicine</option>
                                            {(medicinesForDropdown || []).map(m => (
                                                <option key={m.id} value={String(m.id || '')}>{m.name || '—'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Salt Name*</label><input type="text" required value={compositionForm.salt_name} onChange={e => setCompositionForm({ ...compositionForm, salt_name: e.target.value })} placeholder="e.g. Paracetamol" /></div>
                                    <div className="form-group"><label>Strength*</label><input type="text" required value={compositionForm.strength} onChange={e => setCompositionForm({ ...compositionForm, strength: e.target.value })} placeholder="e.g. 500" /></div>
                                    <div className="form-group"><label>Unit</label><input type="text" value={compositionForm.unit} onChange={e => setCompositionForm({ ...compositionForm, unit: e.target.value })} placeholder="e.g. mg, ml" /></div>
                                </>
                            )}
                            {activeTab === 'batches' && (
                                <>
                                    <div className="form-group">
                                        <label>Brand (Product)*</label>
                                        <div style={{ position: 'relative', marginBottom: '0.25rem' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', pointerEvents: 'none' }} />
                                            <input
                                                type="text"
                                                placeholder="Search by brand name, company or medicine..."
                                                value={batchBrandSearch}
                                                onChange={e => setBatchBrandSearch(e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <select
                                            required
                                            value={batchForm.medicine_brand_id}
                                            onChange={e => setBatchForm({ ...batchForm, medicine_brand_id: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                        >
                                            <option value="">Select brand</option>
                                            {(brands || [])
                                                .filter(b => {
                                                    if (!batchBrandSearch.trim()) return true;
                                                    const q = batchBrandSearch.toLowerCase();
                                                    const name = (b.brand_name || '').toLowerCase();
                                                    const manu = (b.manufacturer || '').toLowerCase();
                                                    const med = (b.medicine_name || '').toLowerCase();
                                                    return name.includes(q) || manu.includes(q) || med.includes(q);
                                                })
                                                .map(b => (
                                                    <option key={b.id} value={b.id}>{b.brand_name} — {b.manufacturer || '—'} {b.medicine_name ? `(${b.medicine_name})` : ''}</option>
                                                ))}
                                        </select>
                                        {batchBrandsLoadError && <small style={{ color: 'var(--admin-error, #dc2626)', marginTop: '0.25rem', display: 'block' }}>Could not load brands: {batchBrandsLoadError}. Check your connection and try again, or use &quot;Add new brand&quot; below.</small>}
                                        {(brands || []).length === 0 && !batchBrandsLoadError && <small style={{ color: 'var(--admin-warning, #b45309)', marginTop: '0.25rem', display: 'block' }}>No brands in database. Add brands in Medicine Brands first, or use &quot;Add new brand&quot; below.</small>}
                                        <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                            Brand must exist first. {' '}
                                            <button type="button" onClick={openQuickAddBrandFromBatch} className="link-button" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit' }}>
                                                Brand not listed? Add new brand
                                            </button>
                                        </small>
                                    </div>
                                    <div className="form-group"><label>Batch Number*</label><input type="text" required value={batchForm.batch_number} onChange={e => setBatchForm({ ...batchForm, batch_number: e.target.value })} placeholder="e.g. BATCH-001" /></div>
                                    <div className="form-group"><label>Expiry Date*</label><input type="date" required value={batchForm.expiry_date} onChange={e => setBatchForm({ ...batchForm, expiry_date: e.target.value })} /></div>
                                    <div className="form-group"><label>Quantity*</label><input type="number" required min="0" value={batchForm.quantity_available} onChange={e => setBatchForm({ ...batchForm, quantity_available: e.target.value })} placeholder="0" /></div>
                                    <div className="form-group"><label>Purchase Price (₹)*</label><input type="number" step="0.01" required value={batchForm.purchase_price} onChange={e => setBatchForm({ ...batchForm, purchase_price: e.target.value })} placeholder="0.00" /></div>
                                </>
                            )}
                            {activeTab === 'therapeutic-categories' && (
                                <>
                                    <div className="form-group"><label>Name*</label><input type="text" required value={therapeuticCategoryForm.name} onChange={e => setTherapeuticCategoryForm({ ...therapeuticCategoryForm, name: e.target.value })} /></div>
                                    <div className="form-group"><label>Description</label><textarea rows="3" value={therapeuticCategoryForm.description} onChange={e => setTherapeuticCategoryForm({ ...therapeuticCategoryForm, description: e.target.value })} /></div>
                                </>
                            )}
                            {activeTab === 'inventory' && (
                                <>
                                    <div className="form-group">
                                        <label>Brand (Product)*</label>
                                        <select
                                            required
                                            value={inventoryTransactionForm.medicine_brand_id}
                                            onChange={e => setInventoryTransactionForm({ ...inventoryTransactionForm, medicine_brand_id: e.target.value, product_batch_id: '' })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                        >
                                            <option value="">Select brand</option>
                                            {(brands || []).map(b => (
                                                <option key={b.id} value={b.id}>{b.brand_name} — {b.manufacturer || '—'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Batch*</label>
                                        <select
                                            required
                                            value={inventoryTransactionForm.product_batch_id}
                                            onChange={e => setInventoryTransactionForm({ ...inventoryTransactionForm, product_batch_id: e.target.value })}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                        >
                                            <option value="">Select batch</option>
                                            {(batches || [])
                                                .filter(b => !inventoryTransactionForm.medicine_brand_id || b.medicine_brand_id === inventoryTransactionForm.medicine_brand_id)
                                                .map(b => (
                                                    <option key={b.id} value={b.id}>{b.batch_number} (qty: {b.quantity_available})</option>
                                                ))}
                                        </select>
                                        {inventoryTransactionForm.medicine_brand_id && (batches || []).filter(b => b.medicine_brand_id === inventoryTransactionForm.medicine_brand_id).length === 0 && (
                                            <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>No batches for this brand. Add a batch first.</small>
                                        )}
                                    </div>
                                    <div className="form-group"><label>Type*</label>
                                        <select required value={inventoryTransactionForm.transaction_type} onChange={e => setInventoryTransactionForm({ ...inventoryTransactionForm, transaction_type: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                            <option value="PURCHASE">PURCHASE</option><option value="SALE">SALE</option><option value="ADJUSTMENT">ADJUSTMENT</option><option value="RETURN">RETURN</option>
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Quantity Change*</label><input type="number" required value={inventoryTransactionForm.quantity_change} onChange={e => setInventoryTransactionForm({ ...inventoryTransactionForm, quantity_change: e.target.value })} placeholder="Positive for in, negative for out" /></div>
                                    <div className="form-group"><label>Remarks</label><textarea rows="2" value={inventoryTransactionForm.remarks} onChange={e => setInventoryTransactionForm({ ...inventoryTransactionForm, remarks: e.target.value })} placeholder="Optional" /></div>
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
                                    <div className="form-group"><label>Date*</label><input type="date" required value={testBookingForm.booking_date} min={dateMin} onChange={e => setTestBookingForm({ ...testBookingForm, booking_date: e.target.value })} title={modalMode === 'add' ? 'Only future dates allowed for new bookings' : ''} /></div>
                                    <div className="form-group"><label>Time</label><input type="time" value={timeToHHmm(testBookingForm.booking_time) || ''} min={modalMode === 'add' ? timeMin : undefined} onChange={e => setTestBookingForm({ ...testBookingForm, booking_time: e.target.value })} placeholder="Optional" title={modalMode === 'add' && testBookingForm.booking_date === todayStr ? 'Only future time when date is today' : ''} /></div>
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
                                            {(roles || []).map(r => (
                                                <option key={r.id} value={r.id}>{r.name || r.id}</option>
                                            ))}
                                        </select>
                                        <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Staff will get all permissions assigned to this role.</small>
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

            {/* Quick-add brand from Product Batch form (nested modal) */}
            {showAddBrandFromBatchModal && (
                <div className="admin-modal-overlay" style={{ zIndex: 10001 }}>
                    <div className="admin-modal" style={{ maxWidth: '420px' }}>
                        <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Add new brand</h3>
                            <button type="button" onClick={() => setShowAddBrandFromBatchModal(false)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--admin-text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', marginBottom: '1rem' }}>Add a medicine brand so you can select it in the batch form. Medicine must exist first.</p>
                        <form onSubmit={submitQuickAddBrandFromBatch} className="modal-form">
                            <div className="form-group">
                                <label>Medicine*</label>
                                <select
                                    required
                                    value={String(quickAddBrandForm.medicine_id || '')}
                                    onChange={e => setQuickAddBrandForm({ ...quickAddBrandForm, medicine_id: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
                                >
                                    <option value="">Select medicine</option>
                                    {(medicinesForDropdown || []).map(m => (
                                        <option key={m.id} value={String(m.id || '')}>{m.name || '—'}</option>
                                    ))}
                                </select>
                                {(medicinesForDropdown || []).length === 0 && <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>Add medicines in Manage Medicines first.</small>}
                            </div>
                            <div className="form-group"><label>Brand name*</label><input type="text" required value={quickAddBrandForm.brand_name} onChange={e => setQuickAddBrandForm({ ...quickAddBrandForm, brand_name: e.target.value })} placeholder="e.g. Dolo, Crocin" /></div>
                            <div className="form-group"><label>Company*</label><input type="text" required value={quickAddBrandForm.manufacturer} onChange={e => setQuickAddBrandForm({ ...quickAddBrandForm, manufacturer: e.target.value })} placeholder="e.g. Micro Labs, GSK" /></div>
                            <div className="form-group"><label>MRP (₹)*</label><input type="number" step="0.01" required value={quickAddBrandForm.mrp} onChange={e => setQuickAddBrandForm({ ...quickAddBrandForm, mrp: e.target.value })} placeholder="0.00" /></div>
                            <div className="form-group"><label>Description</label><textarea rows="2" value={quickAddBrandForm.description || ''} onChange={e => setQuickAddBrandForm({ ...quickAddBrandForm, description: e.target.value })} placeholder="Optional" /></div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={() => setShowAddBrandFromBatchModal(false)}>Cancel</button>
                                <button type="submit" className="btn-add" style={{ flex: 1 }}>Add brand</button>
                            </div>
                        </form>
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
