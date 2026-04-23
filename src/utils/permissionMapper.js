/**
 * UI access from ``GET /auth/me/permissions`` → ``menuItems[].grants`` (M_module × CRUD).
 * ``M_modules.name`` matches ``menuItems[].code`` (e.g. ``orders``, ``doctors``).
 */

/**
 * @param {Array<{ code?: string, grants?: object }>|undefined} menuItems
 * @param {string} moduleCode - ``M_modules.name`` / sidebar code
 * @returns {object|null}
 */
export const getModuleGrants = (menuItems, moduleCode) => {
  if (!Array.isArray(menuItems) || !moduleCode) return null;
  const m = menuItems.find((x) => x && String(x.code) === String(moduleCode));
  return m?.grants || null;
};

/**
 * @param {Array} menuItems
 * @param {string} moduleCode
 * @param {'create'|'read'|'update'|'delete'} action
 */
export const hasModuleGrant = (menuItems, moduleCode, action) => {
  const g = getModuleGrants(menuItems, moduleCode);
  if (!g) return false;
  const c = g.canCreate ?? g.can_create;
  const r = g.canRead ?? g.can_read;
  const u = g.canUpdate ?? g.can_update;
  const d = g.canDelete ?? g.can_delete;
  if (action === 'create') return Boolean(c);
  if (action === 'read') return Boolean(r);
  if (action === 'update') return Boolean(u);
  if (action === 'delete') return Boolean(d);
  return false;
};

/**
 * @deprecated No longer used; the API does not return a flat ``permissions`` list.
 * @returns {string[]}
 */
export const mapBackendPermissionsToFrontend = () => [];

/**
 * @deprecated Use hasModuleGrant(menuItems, moduleCode, 'read') instead.
 */
export const hasFrontendPermission = () => false;
