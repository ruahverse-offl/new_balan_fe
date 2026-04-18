/**
 * Match cart lines that belong to a catalog medicine (any brand line).
 * Single-brand lines use `id === medicineId`; multi-brand use `medicineId` or composite `id` prefix.
 *
 * @param {Array<object>} cart
 * @param {string} medicineId
 * @returns {Array<object>}
 */
export function cartLinesForMedicine(cart, medicineId) {
    if (!cart?.length || medicineId == null) return [];
    const mid = String(medicineId);
    return cart.filter((c) => {
        if (c.medicineId != null && String(c.medicineId) === mid) return true;
        if (c.id != null && String(c.id) === mid) return true;
        if (typeof c.id === 'string' && c.id.startsWith(`${mid}_`)) return true;
        return false;
    });
}

/**
 * @param {Array<object>} lines
 * @returns {number}
 */
export function totalUnitsForMedicineLines(lines) {
    return lines.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}
