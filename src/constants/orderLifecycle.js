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

/** CSS class suffix for `.status-tag` (Admin.css) from raw order_status */
export function orderStatusTagClass(raw) {
    const n = normalizeOrderStatus(raw);
    switch (n) {
        case 'PENDING':
        case 'REFUND_INITIATED':
            return 'pending';
        case 'ORDER_RECEIVED':
        case 'ORDER_TAKEN':
            return 'active';
        case 'ORDER_PROCESSING':
        case 'DELIVERY_ASSIGNED':
        case 'PARCEL_TAKEN':
        case 'OUT_FOR_DELIVERY':
            return 'processing';
        case 'DELIVERED':
            return 'delivered';
        case 'CANCELLED_BY_STAFF':
        case 'DELIVERY_RETURNED':
            return 'inactive';
        case 'REFUNDED':
            return 'refunded';
        default:
            return 'pending';
    }
}

/** CSS class for payment row status pills */
export function paymentStatusTagClass(raw) {
    const u = String(raw || '').toUpperCase();
    if (u === 'SUCCESS' || u === 'COMPLETED') return 'success';
    if (u === 'FAILED' || u === 'FAILURE') return 'failed';
    if (u === 'INITIATED') return 'initiated';
    if (u === 'PENDING') return 'pending';
    return 'pending';
}

/** Forward-only statuses shown left-to-right in admin order fulfillment chain (excludes cancel). */
export const FULFILLMENT_CHAIN_ORDER = [
    'ORDER_TAKEN',
    'ORDER_PROCESSING',
    'DELIVERY_ASSIGNED',
    'PARCEL_TAKEN',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'DELIVERY_RETURNED',
];

/** Short labels for chain buttons (staff / delivery). */
export const FULFILLMENT_CHAIN_BUTTON_LABELS = {
    ORDER_TAKEN: 'Order packed',
    ORDER_PROCESSING: 'Order packed',
    DELIVERY_ASSIGNED: 'Assign delivery agent',
    PARCEL_TAKEN: 'Parcel picked up',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Mark delivered',
    DELIVERY_RETURNED: 'Customer refused delivery',
};

const STATUS_RANK = {
    PENDING: 0,
    ORDER_RECEIVED: 1,
    ORDER_TAKEN: 2,
    ORDER_PROCESSING: 3,
    DELIVERY_ASSIGNED: 4,
    PARCEL_TAKEN: 5,
    OUT_FOR_DELIVERY: 6,
    DELIVERED: 7,
    DELIVERY_RETURNED: 7,
    CANCELLED_BY_STAFF: 8,
    REFUND_INITIATED: 8,
    REFUNDED: 8,
};

export function fulfillmentStatusRank(raw) {
    return STATUS_RANK[normalizeOrderStatus(raw)] ?? 0;
}

/** Allowed forward actions (same rules as getAllowedNextStatusActions), sorted for chain UI. */
export function getSortedForwardLifecycleActions(opts) {
    const actions = getAllowedNextStatusActions(opts);
    const forward = (actions || []).filter((a) => a && a.status !== 'CANCELLED_BY_STAFF');
    return FULFILLMENT_CHAIN_ORDER.map((status) => forward.find((a) => a.status === status)).filter(Boolean);
}

/**
 * One "Order packed" action: prefer ORDER_TAKEN over ORDER_PROCESSING when both allowed.
 */
export function getPackedActionFromActions(actions) {
    const forward = (actions || []).filter((a) => a && a.status !== 'CANCELLED_BY_STAFF');
    const t = forward.find((a) => a.status === 'ORDER_TAKEN');
    if (t) return { ...t, label: FULFILLMENT_CHAIN_BUTTON_LABELS.ORDER_TAKEN };
    const p = forward.find((a) => a.status === 'ORDER_PROCESSING');
    if (p) return { ...p, label: FULFILLMENT_CHAIN_BUTTON_LABELS.ORDER_PROCESSING };
    return null;
}

/**
 * Forward actions for the chain excluding ORDER_TAKEN / ORDER_PROCESSING (handled by packed button).
 */
export function getSortedForwardLifecycleActionsAfterPacked(opts) {
    const sorted = getSortedForwardLifecycleActions(opts);
    return sorted.filter((a) => a.status !== 'ORDER_TAKEN' && a.status !== 'ORDER_PROCESSING');
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
