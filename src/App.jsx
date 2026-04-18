import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import CartDrawer from './components/common/CartDrawer';
import Chatbot from './components/chatbot/Chatbot';
import CouponMarquee from './components/common/CouponMarquee';
import { isStaffUser } from './utils/roles';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageLoading variant="fullscreen" message="Checking your session…" />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageLoading variant="fullscreen" message="Loading account…" />
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isStaffUser(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// CustomerRoute: allows everyone (guests, customers, staff) to browse the full website
const CustomerRoute = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <PageLoading variant="fullscreen" message="Loading…" />
    );
  }

  return children;
};

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Clinic = lazy(() => import('./pages/Clinic'));
const Pharmacy = lazy(() => import('./pages/Pharmacy'));
const Insurance = lazy(() => import('./pages/Insurance'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const CartPage = lazy(() => import('./pages/CartPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Profile = lazy(() => import('./pages/Profile'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const SpecialistDetail = lazy(() => import('./pages/SpecialistDetail'));
const Polyclinic = lazy(() => import('./pages/Polyclinic'));
const MedicineDetail = lazy(() => import('./pages/MedicineDetail'));
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'));
const NotFound = lazy(() => import('./pages/NotFound'));

import ScrollToTop from './components/common/ScrollToTop';
import { PageLoading } from './components/common/PageLoading';

function AppContent() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const hideFooter = ['/profile', '/admin', '/login'].some(path => location.pathname.toLowerCase().startsWith(path));
  const hideNavbar = ['/profile', '/admin', '/login'].some(path => location.pathname.toLowerCase().startsWith(path));
  const isMarqueeRoute = !['/profile', '/admin', '/login'].some(path => location.pathname.toLowerCase().startsWith(path));

  // Show full site (marquee, cart, chatbot) for everyone so staff can see the complete website too
  const isMarqueeVisible = isMarqueeRoute;

  return (
    <div className={`app-container ${isMarqueeVisible ? 'with-marquee' : ''}`}>
      <a
        href="#main-content"
        className="skip-link"
        onClick={() => {
          document.getElementById('main-content')?.focus({ preventScroll: true });
        }}
      >
        Skip to main content
      </a>
      <ScrollToTop />
      {!hideNavbar && <Navbar />}
      {isMarqueeVisible && <CouponMarquee />}
      <CartDrawer />
      <main id="main-content" tabIndex={-1} className={isMarqueeVisible ? 'has-marquee-offset' : ''}>
        <Suspense
          fallback={<PageLoading variant="fullscreen" message="Loading page…" />}
        >
          <Routes>
            {/* Home is available to everyone (guests, customers, staff) */}
            <Route path="/" element={<Home />} />
            <Route path="/clinic" element={<CustomerRoute><Clinic /></CustomerRoute>} />
            <Route path="/clinic/specialist/:id" element={<CustomerRoute><SpecialistDetail /></CustomerRoute>} />
            <Route path="/pharmacy" element={<CustomerRoute><Pharmacy /></CustomerRoute>} />
            <Route path="/pharmacy/medicine/:id" element={<CustomerRoute><MedicineDetail /></CustomerRoute>} />
            <Route path="/insurance" element={<CustomerRoute><Insurance /></CustomerRoute>} />
            <Route path="/polyclinic" element={<CustomerRoute><Polyclinic /></CustomerRoute>} />
            <Route path="/cart" element={<CustomerRoute><CartPage /></CustomerRoute>} />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <CustomerRoute><Checkout /></CustomerRoute>
              </ProtectedRoute>
            } />
            <Route path="/payment-callback" element={
              <ProtectedRoute>
                <CustomerRoute><PaymentCallback /></CustomerRoute>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <CustomerRoute><Profile /></CustomerRoute>
              </ProtectedRoute>
            } />

            {/* Public info pages - accessible to everyone */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />

            {/* Admin panel - only staff roles */}
            <Route path="/admin" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/orders/:orderId" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/medicine-categories/new" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/medicine-categories/:categoryId/edit" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/medicine-categories/:categoryId" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/medicines/new" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/medicines/:medicineId/edit" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/medicines/:medicineId" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/inventory-offerings/:medicineId/:offeringId/edit" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />
            <Route path="/admin/inventory-offerings/:medicineId/:offeringId" element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } />

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!hideFooter && <Footer />}
      {!hideFooter && <Chatbot />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}


export default App;
