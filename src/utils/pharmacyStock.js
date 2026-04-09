/**
 * Storefront rules: a brand line is buyable only with positive M_inventory stock.
 * Backend sends stock_quantity on each nested brand when include_brands=true.
 */

export function brandStockQuantity(brand) {
  if (!brand || brand.stock_quantity == null) return 0;
  const n = Number(brand.stock_quantity);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function isBrandPurchasable(brand) {
  if (!brand) return false;
  if (brand.is_active === false || brand.is_available === false) return false;
  return brandStockQuantity(brand) > 0;
}
