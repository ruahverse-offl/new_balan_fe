import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';
import { AdminRecordShell, AdminDetailGrid, AdminDetailField } from '../../components/admin/AdminRecordShell';
import { PageLoading, InlineSpinner } from '../../components/common/PageLoading';
import { useAuth } from '../../context/AuthContext';
import { getMedicineById } from '../../services/medicinesApi';
import { updateBrand } from '../../services/brandsApi';
import { updateOfferingStock } from '../../services/inventoryApi';
import './MedicinesTab.css';
import './InventoryTab.css';
import './InventoryOfferingRecordPage.css';

const formatMrp = (v) => {
  const n = parseFloat(v);
  if (Number.isNaN(n)) return '—';
  return `₹${n.toFixed(2)}`;
};

/**
 * Full-page view / edit for one medicine–brand offering (inventory line).
 * Path includes medicineId so we can load via GET /medicines/{id}?include_brands=true.
 * Routes: /admin/inventory-offerings/:medicineId/:offeringId | .../edit
 */
const InventoryOfferingRecordPage = ({ mode, medicineId, offeringId, showNotify, onInventoryChanged }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const returnToMedicineEdit = location.state?.returnToMedicineEdit;
  const returnToMedicineView = location.state?.returnToMedicineView;
  const { user } = useAuth();
  const role = (user?.backendRole || user?.role || '').toUpperCase();
  const isAdminRole = role === 'DEV_ADMIN' || role === 'ADMIN';
  const canUpdateStock =
    isAdminRole || (Array.isArray(user?.backendPermissions) && user.backendPermissions.includes('INVENTORY_UPDATE'));
  const canManageOfferings =
    isAdminRole || (Array.isArray(user?.permissions) && user.permissions.includes('medicines'));

  const goList = useCallback(() => {
    navigate('/admin', { state: { tab: 'inventory' } });
  }, [navigate]);

  const goBackFromOffering = useCallback(() => {
    if (returnToMedicineEdit) {
      navigate(`/admin/medicines/${returnToMedicineEdit}/edit`);
    } else if (returnToMedicineView) {
      navigate(`/admin/medicines/${returnToMedicineView}`);
    } else {
      goList();
    }
  }, [navigate, returnToMedicineEdit, returnToMedicineView, goList]);

  const offeringViewPath = `/admin/inventory-offerings/${medicineId}/${offeringId}`;
  const offeringEditPath = `${offeringViewPath}/edit`;
  const navState =
    returnToMedicineEdit != null
      ? { returnToMedicineEdit }
      : returnToMedicineView != null
        ? { returnToMedicineView }
        : undefined;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  /** Resolved medicine name + brand row from API */
  const [medicineName, setMedicineName] = useState('');
  const [offering, setOffering] = useState(null);
  const [stockDraft, setStockDraft] = useState('');
  const [savingStock, setSavingStock] = useState(false);
  const [form, setForm] = useState({
    manufacturer: '',
    mrp: '',
    description: '',
    is_available: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!medicineId || !offeringId) {
      setLoadError('Missing route parameters');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const med = await getMedicineById(medicineId, { include_brands: true });
        if (cancelled) return;
        const name = med?.name || '—';
        const b = (med?.brands || []).find((x) => String(x.id) === String(offeringId));
        if (!b) {
          setLoadError('This offering was not found for this medicine. It may have been removed.');
          setMedicineName(name);
          setOffering(null);
          return;
        }
        setMedicineName(name);
        setOffering(b);
        const sq = typeof b.stock_quantity === 'number' ? b.stock_quantity : 0;
        setStockDraft(String(sq));
        setForm({
          manufacturer: b.manufacturer || '',
          mrp: String(b.mrp ?? ''),
          description: b.description || '',
          is_available: b.is_available !== false,
        });
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Failed to load offering');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [medicineId, offeringId]);

  const handleSaveStock = async () => {
    if (!offering) return;
    const raw = stockDraft;
    if (raw === undefined || raw === '') {
      showNotify?.('Enter a stock quantity', 'error');
      return;
    }
    const n = parseInt(String(raw).trim(), 10);
    if (Number.isNaN(n) || n < 0) {
      showNotify?.('Stock must be a non-negative integer', 'error');
      return;
    }
    setSavingStock(true);
    try {
      await updateOfferingStock(offeringId, n);
      showNotify?.('Stock updated', 'success');
      onInventoryChanged?.();
      const med = await getMedicineById(medicineId, { include_brands: true });
      const b = (med?.brands || []).find((x) => String(x.id) === String(offeringId));
      if (b) {
        setOffering(b);
        setStockDraft(String(typeof b.stock_quantity === 'number' ? b.stock_quantity : 0));
      }
    } catch (e) {
      showNotify?.(e?.message || 'Failed to update stock', 'error');
    } finally {
      setSavingStock(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!offeringId) return;
    const mrp = parseFloat(String(form.mrp).replace(',', '.'));
    if (Number.isNaN(mrp) || mrp < 0) {
      showNotify?.('Enter a valid MRP', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateBrand(offeringId, {
        manufacturer: String(form.manufacturer || '').trim(),
        mrp,
        description: form.description?.trim() || null,
        is_available: form.is_available !== false,
      });
      showNotify?.('Offering updated', 'success');
      onInventoryChanged?.();
      if (returnToMedicineEdit) {
        navigate(`/admin/medicines/${returnToMedicineEdit}/edit`, { replace: true });
      } else if (returnToMedicineView) {
        navigate(`/admin/medicines/${returnToMedicineView}`, { replace: true });
      } else {
        navigate(offeringViewPath, { replace: true });
      }
    } catch (err) {
      showNotify?.(err?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="inventory-offering-record-wrap">
        <PageLoading variant="block" message="Loading line…" />
      </div>
    );
  }

  if (loadError || !offering) {
    return (
      <AdminRecordShell
        title="Inventory"
        onBack={goBackFromOffering}
        backLabel={returnToMedicineEdit ? 'Back to medicine' : returnToMedicineView ? 'Back to medicine' : 'Back to inventory'}
      >
        <p style={{ margin: 0, color: loadError ? '#b91c1c' : 'var(--admin-text-muted)' }}>
          {loadError || 'Offering not found.'}
        </p>
      </AdminRecordShell>
    );
  }

  const brandLabel = offering.brand_name || '—';
  const pageTitle = mode === 'edit' ? 'Edit inventory line' : `${medicineName} · ${brandLabel}`;

  if (mode === 'view') {
    const showActivity = offering.created_at != null || offering.updated_at != null;
    return (
      <AdminRecordShell
        wide
        title={pageTitle}
        onBack={goBackFromOffering}
        backLabel={returnToMedicineEdit || returnToMedicineView ? 'Back to medicine' : 'Back to inventory'}
        footer={
          <>
            {canManageOfferings && (
              <button
                type="button"
                className="btn-add"
                onClick={() => navigate(offeringEditPath, { state: navState })}
              >
                Edit
              </button>
            )}
          </>
        }
      >
        <div className="inventory-offering-record-hero">
          <Package size={22} aria-hidden className="inventory-offering-record-hero__icon" />
          <div>
            <div className="inventory-offering-record-hero__kicker">Sellable line</div>
            <div className="inventory-offering-record-hero__title">{medicineName}</div>
            <div className="inventory-offering-record-hero__sub">{brandLabel}</div>
          </div>
        </div>

        <div className="inventory-offering-record-section-title">Details</div>
        <AdminDetailGrid variant="tiles">
          <AdminDetailField label="Medicine">{medicineName}</AdminDetailField>
          <AdminDetailField label="Brand">
            <span className="medicines-category-pill" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)' }}>
              {brandLabel}
            </span>
          </AdminDetailField>
          <AdminDetailField label="Manufacturer">{offering.manufacturer || '—'}</AdminDetailField>
          <AdminDetailField label="MRP">{formatMrp(offering.mrp)}</AdminDetailField>
          <AdminDetailField label="For sale">
            <span
              className={`admin-detail-badge ${
                offering.is_available !== false ? 'admin-detail-badge--active' : 'admin-detail-badge--inactive'
              }`}
            >
              {offering.is_available !== false ? 'Yes' : 'No'}
            </span>
          </AdminDetailField>
          <AdminDetailField label="Stock on hand" fullWidth>
            {canUpdateStock ? (
              <div className="inv-stock-row" style={{ marginTop: '0.15rem' }}>
                <input
                  type="number"
                  min={0}
                  step={1}
                  className="inv-stock-input"
                  value={stockDraft}
                  onChange={(e) => setStockDraft(e.target.value)}
                  aria-label="Stock quantity"
                />
                <button
                  type="button"
                  className="btn-add"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                  disabled={savingStock}
                  onClick={handleSaveStock}
                >
                  {savingStock ? <InlineSpinner size={16} /> : 'Save stock'}
                </button>
              </div>
            ) : (
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {typeof offering.stock_quantity === 'number' ? offering.stock_quantity : 0}
              </span>
            )}
          </AdminDetailField>
          <AdminDetailField label="Description" fullWidth>
            {offering.description?.trim() ? (
              offering.description
            ) : (
              <span style={{ color: 'var(--admin-text-muted)' }}>No description</span>
            )}
          </AdminDetailField>
        </AdminDetailGrid>

        {showActivity ? (
          <>
            <div className="inventory-offering-record-section-title" style={{ marginTop: '1.25rem' }}>
              Activity
            </div>
            <AdminDetailGrid variant="tiles">
              {offering.created_at != null && (
                <AdminDetailField label="Created">
                  {new Date(offering.created_at).toLocaleString()}
                </AdminDetailField>
              )}
              {offering.updated_at != null && (
                <AdminDetailField label="Updated">
                  {new Date(offering.updated_at).toLocaleString()}
                </AdminDetailField>
              )}
            </AdminDetailGrid>
          </>
        ) : null}

        <details className="inventory-offering-record-tech">
          <summary>Technical IDs</summary>
          <dl>
            <div>
              <dt>Offering</dt>
              <dd>{String(offeringId)}</dd>
            </div>
            <div>
              <dt>Medicine</dt>
              <dd>{String(medicineId)}</dd>
            </div>
            <div>
              <dt>Brand master</dt>
              <dd>{offering.brand_id != null ? String(offering.brand_id) : '—'}</dd>
            </div>
          </dl>
        </details>
      </AdminRecordShell>
    );
  }

  return (
    <AdminRecordShell
      wide
      title={pageTitle}
      onBack={() => {
        if (returnToMedicineEdit) {
          navigate(`/admin/medicines/${returnToMedicineEdit}/edit`);
        } else if (returnToMedicineView) {
          navigate(`/admin/medicines/${returnToMedicineView}`);
        } else {
          navigate(offeringViewPath);
        }
      }}
      backLabel={returnToMedicineEdit || returnToMedicineView ? 'Back to medicine' : 'Back to details'}
      footer={null}
    >
      <form className="modal-form inventory-offering-edit-form" onSubmit={handleSubmitEdit} style={{ margin: 0, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
          {medicineName} — {brandLabel}
        </p>
        <div className="form-group">
          <label htmlFor="inv-off-mfr">Manufacturer (optional)</label>
          <input
            id="inv-off-mfr"
            value={form.manufacturer}
            onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="inv-off-mrp">MRP (₹)*</label>
          <input
            id="inv-off-mrp"
            required
            type="number"
            min={0}
            step="0.01"
            value={form.mrp}
            onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label htmlFor="inv-off-desc">Description</label>
          <input
            id="inv-off-desc"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="form-group form-group-checkbox" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="inv-off-avail"
            checked={form.is_available}
            onChange={(e) => setForm((f) => ({ ...f, is_available: e.target.checked }))}
          />
          <label htmlFor="inv-off-avail">Available for sale</label>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
          <button
            type="button"
            className="btn-add btn-cancel"
            style={{ flex: 1 }}
            onClick={() => {
              if (returnToMedicineEdit) {
                navigate(`/admin/medicines/${returnToMedicineEdit}/edit`);
              } else if (returnToMedicineView) {
                navigate(`/admin/medicines/${returnToMedicineView}`);
              } else {
                navigate(offeringViewPath, { state: navState });
              }
            }}
          >
            Cancel
          </button>
          <button type="submit" className="btn-add" style={{ flex: 2 }} disabled={saving}>
            {saving ? (
              <>
                <InlineSpinner size={16} /> Saving…
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </AdminRecordShell>
  );
};

export default InventoryOfferingRecordPage;
