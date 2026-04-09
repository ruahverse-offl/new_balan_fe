/**
 * Order fulfillment lifecycle — keep in sync with backend `app/domain/order_lifecycle.py`.
 */

export const ORDER_STATUS_LABELS = {
    PENDING: 'Payment pending',
    ORDER_RECEIVED: 'Order received (staff)',
    ORDER_TAKEN: 'Order taken',
    ORDER_PROCESSING: 'Processing',
    DELIVERY_ASSIGNED: 'Delivery assigned',
    PARCEL_TAKEN: 'Parcel picked up',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    CANCELLED_BY_STAFF: 'Cancelled by staff',
    DELIVERY_RETURNED: 'Returned — customer refused',
    REFUND_INITIATED: 'Refund initiated',
    REFUNDED: 'Refunded',
    // Legacy API values still possible until DB migrated
    CONFIRMED: 'Order received (staff)',
    CANCELLED: 'Cancelled',
    PROCESSING: 'Processing',
    COMPLETED: 'Delivered',
    SHIPPED: 'Out for delivery',
};

/** All values that may appear in filters / tables */
export const ORDER_STATUS_FILTER_VALUES = [
    'PENDING',
    'ORDER_RECEIVED',
    'ORDER_TAKEN',
    'ORDER_PROCESSING',
    'DELIVERY_ASSIGNED',
    'PARCEL_TAKEN',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED_BY_STAFF',
    'DELIVERY_RETURNED',
    'REFUND_INITIATED',
    'REFUNDED',
];

const TERMINAL = new Set([
    'DELIVERED',
    'CANCELLED_BY_STAFF',
    'DELIVERY_RETURNED',
    'REFUND_INITIATED',
    'REFUNDED',
    'CANCELLED',
    'COMPLETED',
]);

const STAFF_NEXT = {
    PENDING: ['CANCELLED_BY_STAFF'],
    ORDER_RECEIVED: ['ORDER_TAKEN', 'CANCELLED_BY_STAFF'],
    ORDER_TAKEN: ['ORDER_PROCESSING', 'CANCELLED_BY_STAFF'],
    ORDER_PROCESSING: ['DELIVERY_ASSIGNED', 'CANCELLED_BY_STAFF'],
    DELIVERY_ASSIGNED: ['CANCELLED_BY_STAFF'],
    PARCEL_TAKEN: ['CANCELLED_BY_STAFF'],
    OUT_FOR_DELIVERY: ['CANCELLED_BY_STAFF'],
};

const DELIVERY_NEXT = {
    DELIVERY_ASSIGNED: ['PARCEL_TAKEN'],
    PARCEL_TAKEN: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_RETURNED'],
};

export function normalizeOrderStatus(raw) {
    if (raw == null || raw === '') return 'PENDING';
    const r = String(raw).trim().toUpperCase();
    if (r === 'CONFIRMED') return 'ORDER_RECEIVED';
    if (r === 'CANCELLED') return 'CANCELLED_BY_STAFF';
    if (r === 'COMPLETED') return 'DELIVERED';
    if (r === 'SHIPPED') return 'OUT_FOR_DELIVERY';
    if (r === 'PROCESSING') return 'ORDER_PROCESSING';
    return r;
}

export function isTerminalOrderStatus(raw) {
    const n = normalizeOrderStatus(raw);
    return TERMINAL.has(n) || TERMINAL.has(String(raw || '').toUpperCase());
}

export function formatOrderStatusLabel(code) {
    if (!code) return '—';
    const u = String(code).toUpperCase();
    return ORDER_STATUS_LABELS[u] || ORDER_STATUS_LABELS[code] || code;
}

/**
 * @param {object} opts
 * @param {object} opts.order — row with order_status, delivery_assigned_user_id
 * @param {string[]} opts.backendPermissions — raw codes e.g. ORDER_UPDATE
 * @param {string} opts.userId — current user id
 * @param {boolean} opts.isAdminRole — ADMIN / DEV_ADMIN bypass
 */
export function getAllowedNextStatusActions({ order, backendPermissions = [], userId, isAdminRole = false }) {
    const raw = order?.order_status;
    const current = normalizeOrderStatus(raw);
    if (isTerminalOrderStatus(raw)) return [];

    const hasStaff = isAdminRole || backendPermissions.includes('ORDER_UPDATE');
    const hasDelivery = backendPermissions.includes('DELIVERY_ORDER_UPDATE');
    const assignedId = order?.delivery_assigned_user_id;
    const isAssignedCourier =
        assignedId != null && userId != null && String(assignedId) === String(userId);

    const out = [];
    const add = (code) => {
        if (!out.some((x) => x.status === code)) {
            out.push({
                status: code,
                label: ORDER_STATUS_LABELS[code] || code,
                requires: code === 'CANCELLED_BY_STAFF' ? 'cancellation_reason' : code === 'DELIVERY_RETURNED' ? 'return_reason' : code === 'DELIVERY_ASSIGNED' ? 'delivery_assigned_user_id' : null,
            });
        }
    };

    if (hasStaff) {
        (STAFF_NEXT[current] || []).forEach(add);
        (DELIVERY_NEXT[current] || []).forEach(add);
    } else if (hasDelivery && isAssignedCourier) {
        (DELIVERY_NEXT[current] || []).forEach(add);
    }

    return out;
}
