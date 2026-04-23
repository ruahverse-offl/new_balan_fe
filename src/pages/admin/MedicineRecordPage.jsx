import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Tag, Plus, Trash2, Pencil } from 'lucide-react';
import { AdminRecordShell, AdminDetailGrid, AdminDetailField } from '../../components/admin/AdminRecordShell';
import { PageLoading, InlineSpinner } from '../../components/common/PageLoading';
import {
  getMedicineById,
  createMedicine,
  updateMedicine,
} from '../../services/medicinesApi';
import {
  fetchAllBrandMasters,
  createBrand as createMedicineBrandOffering,
  deleteBrand as deleteMedicineBrandOffering,
  updateBrand as updateMedicineBrandOffering,
} from '../../services/brandsApi';
import { uploadMedicineImage } from '../../services/uploadApi';
import { getStorageFileUrl } from '../../utils/prescriptionUrl';
import './MedicinesTab.css';
import './MedicineRecordPage.css';

const formatMedicineMrp = (v) => {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return '—';
  return `₹${n.toFixed(2)}`;
};

const formatMedicineTs = (v) => {
  if (v == null || v === '') return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};

const emptyForm = () => ({
  name: '',
  medicine_category_id: '',
  is_prescription_required: false,
  description: '',
  image_path: '',
});

/** True if at least one non-deleted active brand line is marked available on the storefront. */
const computeMedicineAvailableFromBrands = (brands) =>
  (brands || []).some((b) => b.is_active !== false && b.is_available !== false);

/**
 * Full-page view / edit / create for a generic medicine (no modal).
 * Routes: /admin/medicines/new | :medicineId | :medicineId/edit
 */
const MedicineRecordPage = ({ mode, medicineId, therapeuticCategories = [], showNotify, onMedicinesChanged }) => {
  const navigate = useNavigate();
  const goList = useCallback(() => {
    navigate('/admin', { state: { tab: 'medicines' } });
  }, [navigate]);

  const [loading, setLoading] = useState(mode !== 'new');
  const [loadError, setLoadError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [medicineImageUploading, setMedicineImageUploading] = useState(false);
  const [medicineBrandCatalog, setMedicineBrandCatalog] = useState([]);
  const [medicineOfferings, setMedicineOfferings] = useState([]);
  const [medicineOfferingsLoading, setMedicineOfferingsLoading] = useState(false);
  const [addingBrandLine, setAddingBrandLine] = useState(false);
  const [medicineNewOffering, setMedicineNewOffering] = useState({
    brand_id: '',
    manufacturer: '',
    mrp: '',
    description: '',
  });
  const [brandAvailUpdatingId, setBrandAvailUpdatingId] = useState(null);
  const categoryDefaulted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchAllBrandMasters({ is_active: true })
      .then((list) => {
        if (!cancelled) setMedicineBrandCatalog(list || []);
      })
      .catch(() => {
        if (!cancelled) setMedicineBrandCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mode !== 'new' || categoryDefaulted.current) return;
    const first = therapeuticCategories?.[0];
    if (first?.id) {
      categoryDefaulted.current = true;
      setForm((f) => ({ ...f, medicine_category_id: String(first.id) }));
    }
  }, [mode, therapeuticCategories]);

  const composerBrandOptions = useMemo(() => {
    const catalog = medicineBrandCatalog || [];
    if (mode !== 'edit') return catalog;
    const used = new Set((medicineOfferings || []).map((o) => String(o.brand_id)));
    return catalog.filter((b) => !used.has(String(b.id)));
  }, [mode, medicineBrandCatalog, medicineOfferings]);

  useEffect(() => {
    if (mode === 'new') {
      setDetail(null);
      setForm(emptyForm());
      categoryDefaulted.current = false;
      setMedicineOfferings([]);
      setMedicineNewOffering({ brand_id: '', manufacturer: '', mrp: '', description: '' });
      setMedicineOfferingsLoading(false);
      setAddingBrandLine(false);
      setLoading(false);
      setLoadError(null);
      return;
    }
    if (!medicineId) {
      setLoadError('Missing medicine id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      setAddingBrandLine(false);
      try {
        const full = await getMedicineById(medicineId, { include_brands: true });
        if (cancelled) return;
        setDetail(full);
        if (mode === 'view') {
          setLoading(false);
          return;
        }
        setForm({
          name: full?.name || '',
          medicine_category_id: full?.medicine_category_id ? String(full.medicine_category_id) : '',
          is_prescription_required: full?.is_prescription_required === true,
          description: full?.description || '',
          image_path: full?.image_path || '',
        });
        setMedicineOfferings(full?.brands || []);
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Failed to load medicine');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, medicineId]);

  const handleAddMedicineOffering = async () => {
    if (addingBrandLine) return;
    if (!medicineId) {
      showNotify?.('Save the medicine first, then add brand lines.', 'error');
      return;
    }
    const bid = medicineNewOffering.brand_id;
    const mfr = String(medicineNewOffering.manufacturer || '').trim();
    const mrpRaw = medicineNewOffering.mrp;
    if (!bid || mrpRaw === '' || Number.isNaN(Number(mrpRaw))) {
      showNotify?.('Select a catalog brand and enter MRP.', 'error');
      return;
    }
    if ((medicineOfferings || []).some((o) => String(o.brand_id) === String(bid))) {
      showNotify?.('That catalog brand is already linked to this medicine.', 'error');
      return;
    }
    setAddingBrandLine(true);
    try {
      const row = await createMedicineBrandOffering({
        medicine_id: medicineId,
        brand_id: bid,
        manufacturer: mfr || undefined,
        mrp: Number(mrpRaw),
        description: String(medicineNewOffering.description || '').trim() || null,
      });
      setMedicineOfferings((prev) => [...(prev || []), row]);
      setMedicineNewOffering({ brand_id: '', manufacturer: '', mrp: '', description: '' });
      const synced = await syncMedicineHeaderAvailability();
      if (synced?.brands) setMedicineOfferings(synced.brands);
      showNotify?.('Brand line added', 'success');
      onMedicinesChanged?.();
    } catch (e) {
      showNotify?.(e?.message || 'Failed to add line', 'error');
    } finally {
      setAddingBrandLine(false);
    }
  };

  const handleRemoveMedicineOffering = async (offeringId) => {
    try {
      await deleteMedicineBrandOffering(offeringId);
      const next = (medicineOfferings || []).filter((o) => o.id !== offeringId);
      setMedicineOfferings(next);
      const anyAvail = computeMedicineAvailableFromBrands(next);
      await updateMedicine(medicineId, { is_available: anyAvail });
      showNotify?.('Brand line removed', 'success');
      onMedicinesChanged?.();
    } catch (e) {
      showNotify?.(e?.message || 'Remove failed', 'error');
    }
  };

  const syncMedicineHeaderAvailability = async () => {
    if (!medicineId) return null;
    let fresh = await getMedicineById(medicineId, { include_brands: true });
    const anyAvail = computeMedicineAvailableFromBrands(fresh.brands);
    if (!!fresh.is_available !== anyAvail) {
      await updateMedicine(medicineId, { is_available: anyAvail });
      fresh = await getMedicineById(medicineId, { include_brands: true });
    }
    return fresh;
  };

  const handleOfferingStorefrontToggle = async (offering, nextAvailable) => {
    if (!medicineId || !offering?.id) return;
    if (offering.is_active === false) {
      showNotify?.('Turn the line active in Inventory before showing it on the storefront.', 'error');
      return;
    }
    setBrandAvailUpdatingId(offering.id);
    try {
      await updateMedicineBrandOffering(offering.id, { is_available: nextAvailable });
      const fresh = await syncMedicineHeaderAvailability();
      if (!fresh) return;
      if (mode === 'view') {
        setDetail(fresh);
      } else if (mode === 'edit') {
        setMedicineOfferings(fresh.brands || []);
      }
      showNotify?.(nextAvailable ? 'Brand line is on the storefront' : 'Brand line hidden from storefront', 'success');
      onMedicinesChanged?.();
    } catch (e) {
      showNotify?.(e?.message || 'Update failed', 'error');
    } finally {
      setBrandAvailUpdatingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mcId = form.medicine_category_id && String(form.medicine_category_id).trim();
    if ((mode === 'new' || mode === 'edit') && !mcId) {
      showNotify?.('Please select a medicine category', 'error');
      return;
    }
    const name = String(form.name || '').trim();
    if (!name) {
      showNotify?.('Medicine name is required', 'error');
      return;
    }
    const payload = {
      name,
      is_prescription_required: form.is_prescription_required === true,
      description: form.description || null,
      image_path: (form.image_path && String(form.image_path).trim()) || null,
      ...(mcId && { medicine_category_id: mcId }),
    };
    if (mode === 'new') {
      payload.is_available = true;
    } else if (mode === 'edit') {
      payload.is_available = computeMedicineAvailableFromBrands(medicineOfferings);
    }
    setSaving(true);
    try {
      if (mode === 'new') {
        const created = await createMedicine(payload);
        showNotify?.('Medicine added successfully', 'success');
        onMedicinesChanged?.();
        const d = medicineNewOffering;
        const hasAny =
          d.brand_id || String(d.manufacturer || '').trim() !== '' || String(d.mrp || '') !== '';
        const hasAll =
          d.brand_id && d.mrp !== '' && !Number.isNaN(Number(d.mrp));
        if (hasAny && !hasAll) {
          showNotify?.(
            'Medicine saved. To link a catalog brand, choose brand and MRP (manufacturer optional) — or edit this medicine to add lines.',
            'success',
          );
        } else if (hasAll && created?.id) {
          try {
            await createMedicineBrandOffering({
              medicine_id: created.id,
              brand_id: d.brand_id,
              manufacturer: String(d.manufacturer || '').trim() || undefined,
              mrp: Number(d.mrp),
              description: String(d.description || '').trim() || null,
            });
            showNotify?.('Catalog brand linked as a sellable line', 'success');
          } catch (error) {
            showNotify?.('Medicine saved; linking brand failed: ' + (error?.message || ''), 'error');
          }
        }
        navigate(`/admin/medicines/${created.id}`, { replace: true });
        return;
      }
      if (mode === 'edit' && medicineId) {
        await updateMedicine(medicineId, payload);
        showNotify?.('Medicine updated successfully', 'success');
        onMedicinesChanged?.();
        navigate(`/admin/medicines/${medicineId}`, { replace: true });
      }
    } catch (err) {
      showNotify?.(err?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="medicine-record-page-wrap">
        <PageLoading variant="block" message="Loading medicine…" />
      </div>
    );
  }

  if (loadError && mode !== 'new') {
    return (
      <AdminRecordShell title="Medicine" onBack={goList} backLabel="Back to medicines">
        <p style={{ margin: 0, color: '#b91c1c' }}>{loadError}</p>
      </AdminRecordShell>
    );
  }

  if (mode === 'view' && !detail && !loading) {
    return (
      <AdminRecordShell title="Medicine" onBack={goList} backLabel="Back to medicines">
        <p style={{ margin: 0 }}>Medicine not found.</p>
      </AdminRecordShell>
    );
  }

  if (mode === 'view' && detail) {
    const d = detail;
    const viewSource = d;
    const viewBrands = Array.isArray(d.brands) ? d.brands : [];
    const showActivity = d.created_at != null || d.updated_at != null;
    return (
      <AdminRecordShell
        wide
        title={d.name || 'Medicine'}
        onBack={goList}
        backLabel="Back to medicines"
        footer={
          <button type="button" className="btn-add" onClick={() => navigate(`/admin/medicines/${medicineId}/edit`)}>
            Edit
          </button>
        }
      >
        <div className="medicine-record-page-inner">
          <div className="medicine-details-modal__hero">
            <div className="medicine-details-modal__identity">
              {viewSource.image_path ? (
                <img
                  className="medicine-details-modal__thumb"
                  src={getStorageFileUrl(viewSource.image_path)}
                  alt=""
                />
              ) : (
                <div className="medicine-details-modal__thumb medicine-details-modal__thumb--fallback" aria-hidden>
                  <Pill size={32} strokeWidth={1.75} />
                </div>
              )}
              <div className="medicine-details-modal__head-text">
                <h3 className="medicine-details-modal__title" style={{ margin: 0 }}>
                  {viewSource.name || 'Medicine'}
                </h3>
              </div>
            </div>
          </div>

          <div className="medicine-details-modal__body medicine-record-page-inner__body">
            <section className="medicine-details-modal__section">
              <h4 className="medicine-details-modal__section-title">Medicine details</h4>
              <AdminDetailGrid variant="tiles">
                <AdminDetailField label="Category">
                  {viewSource.medicine_category_name && viewSource.medicine_category_name !== '—' ? (
                    <span className="medicines-category-pill">{viewSource.medicine_category_name}</span>
                  ) : (
                    <span style={{ color: 'var(--admin-text-muted)' }}>Not set</span>
                  )}
                </AdminDetailField>
                <AdminDetailField label="Prescription">
                  <span
                    className={`medicines-rx-badge ${
                      viewSource.is_prescription_required ? 'medicines-rx-badge--yes' : 'medicines-rx-badge--no'
                    }`}
                  >
                    {viewSource.is_prescription_required ? 'Required' : 'OTC'}
                  </span>
                </AdminDetailField>
                <AdminDetailField label="Listed">
                  <span
                    className={`admin-detail-badge ${
                      viewSource.is_active !== false ? 'admin-detail-badge--active' : 'admin-detail-badge--inactive'
                    }`}
                  >
                    {viewSource.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </AdminDetailField>
                <AdminDetailField label="Storefront (summary)">
                  <span
                    className={`admin-detail-badge ${
                      computeMedicineAvailableFromBrands(viewBrands) ? 'admin-detail-badge--active' : 'admin-detail-badge--inactive'
                    }`}
                  >
                    {computeMedicineAvailableFromBrands(viewBrands)
                      ? 'At least one line on storefront'
                      : 'No line on storefront'}
                  </span>
                </AdminDetailField>
                <AdminDetailField label="Description" fullWidth>
                  {viewSource.description ? (
                    viewSource.description
                  ) : (
                    <span style={{ color: 'var(--admin-text-muted)' }}>No description</span>
                  )}
                </AdminDetailField>
              </AdminDetailGrid>
            </section>

            <section className="medicine-details-modal__section">
              <h4 className="medicine-details-modal__section-title">Sellable brand lines</h4>
              {Array.isArray(viewBrands) && viewBrands.length > 0 ? (
                <ul className="medicine-details-modal__brand-list" aria-label="Brand offerings">
                  {viewBrands.map((o) => (
                    <li key={o.id} className="medicine-details-modal__brand-row">
                      <div className="medicine-details-modal__brand-main">
                        <span className="medicine-details-modal__brand-name">{o.brand_name || '—'}</span>
                        <span className="medicine-details-modal__brand-meta">
                          {o.manufacturer || '—'}
                          {o.is_active === false ? (
                            <span className="medicine-details-modal__brand-flag">Line inactive</span>
                          ) : null}
                          {o.is_active !== false && o.is_available === false ? (
                            <span className="medicine-details-modal__brand-flag medicine-details-modal__brand-flag--muted">
                              Hidden on storefront
                            </span>
                          ) : null}
                        </span>
                      </div>
                      <div className="medicine-details-modal__brand-actions">
                        <span className="medicine-details-modal__brand-mrp">{formatMedicineMrp(o.mrp)}</span>
                        <button
                          type="button"
                          className="medicine-details-modal__brand-edit-btn"
                          title="Edit MRP, manufacturer, description, stock"
                          onClick={() =>
                            navigate(`/admin/inventory-offerings/${medicineId}/${o.id}/edit`, {
                              state: { returnToMedicineView: medicineId },
                            })
                          }
                        >
                          <Pencil size={14} aria-hidden />
                          Edit line
                        </button>
                        <label className="medicine-brand-storefront-toggle">
                          <input
                            type="checkbox"
                            checked={o.is_available !== false && o.is_active !== false}
                            disabled={
                              o.is_active === false ||
                              brandAvailUpdatingId === o.id
                            }
                            onChange={(e) => handleOfferingStorefrontToggle(o, e.target.checked)}
                          />
                          <span className="medicine-brand-storefront-toggle__label">On storefront</span>
                          {brandAvailUpdatingId === o.id ? <InlineSpinner size={14} /> : null}
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="medicine-details-modal__brands-empty">
                  No catalog brand lines linked yet. Edit this medicine to add sellable SKUs.
                </p>
              )}
            </section>

            {showActivity ? (
              <section className="medicine-details-modal__section">
                <h4 className="medicine-details-modal__section-title">Activity</h4>
                <AdminDetailGrid variant="tiles">
                  {d.created_at != null && (
                    <AdminDetailField label="Created">{formatMedicineTs(d.created_at)}</AdminDetailField>
                  )}
                  {d.updated_at != null && (
                    <AdminDetailField label="Updated">{formatMedicineTs(d.updated_at)}</AdminDetailField>
                  )}
                </AdminDetailGrid>
              </section>
            ) : null}
          </div>
        </div>
      </AdminRecordShell>
    );
  }

  const isEdit = mode === 'edit';
  const isNew = mode === 'new';
  const title = isNew ? 'New medicine' : isEdit ? 'Edit medicine' : 'Medicine';

  const handleFormBack = () => {
    if (isNew) goList();
    else if (isEdit && medicineId) navigate(`/admin/medicines/${medicineId}`);
    else goList();
  };

  return (
    <AdminRecordShell
      wide
      title={title}
      onBack={handleFormBack}
      backLabel={isNew ? 'Back to medicines' : isEdit ? 'Back to details' : 'Back to medicines'}
      footer={null}
    >
      <form
        onSubmit={handleSubmit}
        className="modal-form medicine-record-form"
        style={{ margin: 0, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}
      >
        <div className="form-group">
          <label htmlFor="med-rec-name">Medicine name*</label>
          <input
            id="med-rec-name"
            type="text"
            required
            value={form.name}
            placeholder="e.g. Paracetamol"
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label htmlFor="med-rec-cat">Medicine category*</label>
          <select
            id="med-rec-cat"
            required
            value={String(form.medicine_category_id || '')}
            onChange={(e) => setForm((f) => ({ ...f, medicine_category_id: e.target.value }))}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}
          >
            <option value="">Select category</option>
            {(therapeuticCategories || []).map((c) => (
              <option key={c.id} value={String(c.id || '')}>
                {c.name || '—'}
              </option>
            ))}
          </select>
          {(therapeuticCategories || []).length === 0 && (
            <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Add categories in Medicine Cat. tab first.
            </small>
          )}
        </div>
        <div className="form-group form-group-checkbox">
          <input
            type="checkbox"
            id="med-rec-rx"
            checked={form.is_prescription_required === true}
            onChange={(e) => setForm((f) => ({ ...f, is_prescription_required: e.target.checked }))}
          />
          <label htmlFor="med-rec-rx">Prescription required</label>
        </div>
        <div className="form-group">
          <label htmlFor="med-rec-desc">Description</label>
          <textarea
            id="med-rec-desc"
            rows={3}
            value={form.description || ''}
            placeholder="Optional"
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="form-group medicine-record-image-field">
          <label htmlFor="med-rec-product-image">Product image</label>
          <div className="medicine-record-image-field__wrap">
            <input
              id="med-rec-product-image"
              type="file"
              accept="image/*"
              disabled={medicineImageUploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setMedicineImageUploading(true);
                try {
                  const res = await uploadMedicineImage(file);
                  const path = res.stored_as || (res.url && res.url.replace(/^.*\/storage\//, ''));
                  if (path) setForm((prev) => ({ ...prev, image_path: path }));
                  showNotify?.('Image uploaded', 'success');
                } catch (err) {
                  showNotify?.(err?.message || 'Image upload failed', 'error');
                } finally {
                  setMedicineImageUploading(false);
                }
              }}
            />
            {medicineImageUploading && (
              <div
                className="medicine-record-image-field__overlay"
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label="Uploading image"
              >
                <InlineSpinner size={28} />
                <span className="medicine-record-image-field__overlay-text">Uploading image…</span>
                <span className="medicine-record-image-field__overlay-hint">Please wait</span>
              </div>
            )}
            {form.image_path ? (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <img
                  src={getStorageFileUrl(form.image_path)}
                  alt="Preview"
                  style={{
                    maxWidth: 120,
                    maxHeight: 120,
                    objectFit: 'contain',
                    borderRadius: 8,
                    border: '1px solid var(--admin-border)',
                  }}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem' }}
                  disabled={medicineImageUploading}
                  onClick={() => setForm((f) => ({ ...f, image_path: '' }))}
                >
                  Remove image
                </button>
              </div>
            ) : (
              <small style={{ color: 'var(--admin-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Optional. JPEG/PNG/WebP.
              </small>
            )}
          </div>
        </div>

        <div className="admin-medicine-brands-panel" aria-labelledby="med-rec-brands-heading">
          <div className="admin-medicine-brands-panel__head">
            <div>
              <h4 id="med-rec-brands-heading" className="admin-medicine-brands-panel__title">
                <Tag size={18} aria-hidden />
                Sellable brand lines
              </h4>
              <p className="admin-medicine-brands-panel__meta">
                Each line is one <strong>catalog brand</strong> + MRP — this is the SKU customers add to cart. Use{' '}
                <strong>Edit</strong> to change MRP, manufacturer, pack note, or stock. Use <strong>On storefront</strong>{' '}
                per line to show or hide it on the shop (when the line is active).
              </p>
            </div>
            {isEdit && !medicineOfferingsLoading && (
              <span className="admin-medicine-brands-count" aria-live="polite">
                {(medicineOfferings || []).length} linked
              </span>
            )}
          </div>

          {isEdit && medicineOfferingsLoading && (
            <div className="admin-medicine-brands-loading" role="status" aria-busy="true">
              <InlineSpinner size={18} />
              Loading linked lines…
            </div>
          )}

          {isEdit && !medicineOfferingsLoading && (medicineOfferings || []).length === 0 && (
            <div className="admin-medicine-brands-empty">
              <strong>No brand lines yet</strong>
              <span>Use the form below to link a catalog brand.</span>
            </div>
          )}

          {isEdit && !medicineOfferingsLoading && (medicineOfferings || []).length > 0 && (
            <ul className="admin-medicine-brand-line-list" aria-label="Linked brand lines">
              {(medicineOfferings || []).map((o) => (
                <li key={o.id}>
                  <div className="admin-medicine-brand-line-card">
                    <div className="admin-medicine-brand-line-card__main">
                      <div className="admin-medicine-brand-line-card__badge">{o.brand_name || '—'}</div>
                      <div className="admin-medicine-brand-line-card__sub">
                        <span>{o.manufacturer || '—'}</span>
                        {o.description ? (
                          <>
                            <span aria-hidden> · </span>
                            <span>{o.description}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="admin-medicine-brand-line-card__side">
                      <span className="admin-medicine-brand-line-card__mrp">₹{Number(o.mrp).toFixed(2)}</span>
                      <label className="medicine-brand-storefront-toggle medicine-brand-storefront-toggle--inline">
                        <input
                          type="checkbox"
                          checked={o.is_available !== false && o.is_active !== false}
                          disabled={
                            o.is_active === false ||
                            brandAvailUpdatingId === o.id
                          }
                          onChange={(e) => handleOfferingStorefrontToggle(o, e.target.checked)}
                        />
                        <span className="medicine-brand-storefront-toggle__label">On storefront</span>
                        {brandAvailUpdatingId === o.id ? <InlineSpinner size={14} /> : null}
                      </label>
                      <div className="admin-medicine-brand-line-card__row-actions">
                        <button
                          type="button"
                          className="admin-medicine-brand-line-card__edit"
                          title="Edit MRP, manufacturer, description, stock"
                          aria-label={`Edit ${o.brand_name || 'brand'} line`}
                          onClick={() =>
                            navigate(`/admin/inventory-offerings/${medicineId}/${o.id}/edit`, {
                              state: { returnToMedicineEdit: medicineId },
                            })
                          }
                        >
                          <Pencil size={16} strokeWidth={2} />
                          <span className="admin-medicine-brand-line-card__edit-label">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="admin-medicine-brand-line-card__remove"
                          title="Remove this line"
                          aria-label={`Remove ${o.brand_name || 'brand'} line`}
                          onClick={() => handleRemoveMedicineOffering(o.id)}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="admin-medicine-brand-composer">
            <p className="admin-medicine-brand-composer__label">
              {isEdit ? 'Add another line' : 'Optional first line (on save)'}
            </p>
            <div className="form-group">
              <label htmlFor="med-rec-composer-brand">Brand from catalog</label>
              <select
                id="med-rec-composer-brand"
                value={medicineNewOffering.brand_id || ''}
                onChange={(e) => setMedicineNewOffering({ ...medicineNewOffering, brand_id: e.target.value })}
              >
                <option value="">{composerBrandOptions.length ? 'Choose a brand…' : 'No brands available'}</option>
                {composerBrandOptions.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name || '—'}
                  </option>
                ))}
              </select>
              {(medicineBrandCatalog || []).length === 0 && (
                <small style={{ color: 'var(--admin-text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  Add names in <strong>Brand catalog</strong> first.
                </small>
              )}
              {isEdit && (medicineBrandCatalog || []).length > 0 && composerBrandOptions.length === 0 && (
                <small style={{ color: 'var(--admin-text-muted)', display: 'block', marginTop: '0.35rem' }}>
                  Every catalog brand is already linked, or catalog is empty.
                </small>
              )}
            </div>
            <div className="admin-medicine-brand-form-row2">
              <div className="form-group">
                <label htmlFor="med-rec-mfr">Manufacturer (optional)</label>
                <input
                  id="med-rec-mfr"
                  type="text"
                  value={medicineNewOffering.manufacturer}
                  onChange={(e) => setMedicineNewOffering({ ...medicineNewOffering, manufacturer: e.target.value })}
                  placeholder="e.g. GSK Consumer — leave blank if unknown"
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label htmlFor="med-rec-mrp">MRP (₹)</label>
                <input
                  id="med-rec-mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={medicineNewOffering.mrp}
                  onChange={(e) => setMedicineNewOffering({ ...medicineNewOffering, mrp: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="med-rec-pack">Pack / variant note (optional)</label>
              <input
                id="med-rec-pack"
                type="text"
                value={medicineNewOffering.description}
                onChange={(e) => setMedicineNewOffering({ ...medicineNewOffering, description: e.target.value })}
                placeholder="e.g. 500 mg · strip of 10"
              />
            </div>
            {isEdit && medicineId && (
              <button
                type="button"
                className="admin-btn-add-brand-line"
                disabled={
                  addingBrandLine ||
                  medicineOfferingsLoading ||
                  composerBrandOptions.length === 0 ||
                  (medicineBrandCatalog || []).length === 0
                }
                aria-busy={addingBrandLine}
                onClick={handleAddMedicineOffering}
              >
                {addingBrandLine ? (
                  <>
                    <InlineSpinner size={18} aria-hidden />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus size={20} strokeWidth={2.5} aria-hidden />
                    Add brand line
                  </>
                )}
              </button>
            )}
          </div>

          {isNew && (
            <div className="admin-medicine-brands-hint">
              When you <strong>Save medicine</strong>, we will create the first line automatically if catalog brand and
              MRP are filled (manufacturer optional). To add more lines, edit the medicine afterward.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={handleFormBack}>
            Cancel
          </button>
          <button type="submit" className="btn-add" style={{ flex: 2 }} disabled={saving}>
            {saving ? (
              <>
                <InlineSpinner size={16} /> Saving…
              </>
            ) : isNew ? (
              'Create'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </AdminRecordShell>
  );
};

export default MedicineRecordPage;
