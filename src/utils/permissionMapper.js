/**
 * Permission Mapper
 * Maps backend permission codes to frontend permission strings
 */

/**
 * Map backend permission codes to frontend permission strings
 * @param {Array<string>} backendPermissions - Array of backend permission codes (e.g., ["DASHBOARD_VIEW", "DOCTOR_CREATE"])
 * @returns {Array<string>} Array of frontend permission strings (e.g., ["dashboard", "doctors"])
 */
export const mapBackendPermissionsToFrontend = (backendPermissions = []) => {
  if (!Array.isArray(backendPermissions)) {
    return [];
  }

  // Mapping from backend permission codes to frontend permission strings
  const permissionMap = {
    // Dashboard
    'DASHBOARD_VIEW': 'dashboard',
    'DASHBOARD_ANALYTICS': 'dashboard',
    
    // Doctors
    'DOCTOR_VIEW': 'doctors',
    'DOCTOR_CREATE': 'doctors',
    'DOCTOR_UPDATE': 'doctors',
    'DOCTOR_DELETE': 'doctors',
    
    // Medicines
    'MEDICINE_VIEW': 'medicines',
    'MEDICINE_CREATE': 'medicines',
    'MEDICINE_UPDATE': 'medicines',
    'MEDICINE_DELETE': 'medicines',
    'MEDICINE_CATEGORY_MANAGE': 'medicines',
    'INVENTORY_VIEW': 'medicines',
    'INVENTORY_UPDATE': 'medicines',
    
    // Orders
    'ORDER_VIEW': 'orders',
    'ORDER_CREATE': 'orders',
    'ORDER_UPDATE': 'orders',
    'ORDER_DETAIL_VIEW': 'orders',
    'ORDER_CANCEL': 'orders',

    // Payments
    'PAYMENT_PROCESS': 'orders',

    // Appointments
    'APPOINTMENT_VIEW': 'appointments',
    'APPOINTMENT_CREATE': 'appointments',
    'APPOINTMENT_UPDATE': 'appointments',
    'APPOINTMENT_DELETE': 'appointments',
    'APPOINTMENT_STATUS_UPDATE': 'appointments',
    
    // Delivery
    'DELIVERY_SETTINGS_VIEW': 'delivery',
    'DELIVERY_SETTINGS_UPDATE': 'delivery',
    'DELIVERY_SLOT_MANAGE': 'delivery',
    
    // Coupons
    'COUPON_VIEW': 'coupons',
    'COUPON_CREATE': 'coupons',
    'COUPON_UPDATE': 'coupons',
    'COUPON_DELETE': 'coupons',
    'COUPON_MARQUEE_MANAGE': 'coupons',
    
    // Staff
    'STAFF_VIEW': 'staff',
    'STAFF_CREATE': 'staff',
    'STAFF_UPDATE': 'staff',
    'STAFF_DELETE': 'staff',
    'STAFF_PERMISSIONS_MANAGE': 'staff',
  };

  // Convert backend permissions to frontend permissions
  const frontendPermissions = new Set();
  
  backendPermissions.forEach(perm => {
    if (permissionMap[perm]) {
      frontendPermissions.add(permissionMap[perm]);
    }
  });

  return Array.from(frontendPermissions);
};

/**
 * Check if user has a specific frontend permission
 * @param {Array<string>} backendPermissions - Array of backend permission codes
 * @param {string} frontendPermission - Frontend permission string (e.g., "dashboard", "doctors")
 * @returns {boolean} True if user has the permission
 */
export const hasFrontendPermission = (backendPermissions = [], frontendPermission) => {
  const mappedPermissions = mapBackendPermissionsToFrontend(backendPermissions);
  return mappedPermissions.includes(frontendPermission);
};
