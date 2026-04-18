import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminRecordShell, AdminDetailGrid, AdminDetailField } from '../../components/admin/AdminRecordShell';
import { PageLoading, InlineSpinner } from '../../components/common/PageLoading';
import {
  getTherapeuticCategoryById,
  createTherapeuticCategory,
  updateTherapeuticCategory,
} from '../../services/therapeuticCategoriesApi';

const formatTs = (v) => {
  if (v == null || v === '') return '—';
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
};

/**
 * Full-page view / edit / create for a medicine category (no modal).
 * Routes: /admin/medicine-categories/new | :id | :id/edit
 */
const MedicineCategoryRecordPage = ({ mode, categoryId, showNotify, onCategoriesChanged }) => {
  const navigate = useNavigate();
  const goList = useCallback(() => {
    navigate('/admin', { state: { tab: 'therapeutic-categories' } });
  }, [navigate]);

  const [loading, setLoading] = useState(mode !== 'new');
  const [loadError, setLoadError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'new') {
      setDetail(null);
      setForm({ name: '', description: '' });
      setLoading(false);
      setLoadError(null);
      return;
    }
    if (!categoryId) {
      setLoadError('Missing category id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const full = await getTherapeuticCategoryById(categoryId);
        if (cancelled) return;
        setDetail(full);
        setForm({
          name: full?.name || '',
          description: full?.description || '',
        });
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Failed to load category');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, categoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = String(form.name || '').trim();
    if (!name) {
      showNotify?.('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        description: String(form.description || '').trim() || null,
      };
      if (mode === 'new') {
        const created = await createTherapeuticCategory(payload);
        showNotify?.('Medicine category created', 'success');
        onCategoriesChanged?.();
        navigate(`/admin/medicine-categories/${created.id}`, { replace: true });
        return;
      }
      if (mode === 'edit' && categoryId) {
        await updateTherapeuticCategory(categoryId, payload);
        showNotify?.('Medicine category updated', 'success');
        onCategoriesChanged?.();
        navigate(`/admin/medicine-categories/${categoryId}`, { replace: true });
      }
    } catch (err) {
      showNotify?.(err?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-record-page-wrap">
        <PageLoading variant="block" message="Loading category…" />
      </div>
    );
  }

  if (loadError && mode !== 'new') {
    return (
      <AdminRecordShell title="Category" onBack={goList} backLabel="Back to categories">
        <p style={{ margin: 0, color: '#b91c1c' }}>{loadError}</p>
      </AdminRecordShell>
    );
  }

  if (mode === 'view' && !detail && !loading) {
    return (
      <AdminRecordShell title="Category" onBack={goList} backLabel="Back to categories">
        <p style={{ margin: 0 }}>Category not found.</p>
      </AdminRecordShell>
    );
  }

  if (mode === 'view' && detail) {
    const d = detail;
    const isActive = d.is_active !== false;
    const showActivity = d.created_at != null || d.updated_at != null;
    return (
      <AdminRecordShell
        wide
        title={d.name || 'Medicine category'}
        onBack={goList}
        backLabel="Back to categories"
        footer={
          <>
            <button type="button" className="btn-add" onClick={() => navigate(`/admin/medicine-categories/${categoryId}/edit`)}>
              Edit
            </button>
          </>
        }
      >
        <div className="admin-detail-section">
          <h3 className="admin-detail-section-title">Category details</h3>
        </div>
        <AdminDetailGrid variant="tiles">
          <AdminDetailField label="Name">{d.name || '—'}</AdminDetailField>
          <AdminDetailField label="Status">
            <span className={`admin-detail-badge ${isActive ? 'admin-detail-badge--active' : 'admin-detail-badge--inactive'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </AdminDetailField>
          {d.is_deleted != null && (
            <AdminDetailField label="Deleted">{d.is_deleted ? 'Yes' : 'No'}</AdminDetailField>
          )}
          <AdminDetailField label="Description" fullWidth>
            {d.description ? d.description : <span style={{ color: 'var(--admin-text-muted)' }}>No description</span>}
          </AdminDetailField>
        </AdminDetailGrid>
        {showActivity ? (
          <>
            <div className="admin-detail-section" style={{ marginTop: '0.25rem' }}>
              <h3 className="admin-detail-section-title">Activity</h3>
            </div>
            <AdminDetailGrid variant="tiles">
              {d.created_at != null && <AdminDetailField label="Created">{formatTs(d.created_at)}</AdminDetailField>}
              {d.updated_at != null && <AdminDetailField label="Updated">{formatTs(d.updated_at)}</AdminDetailField>}
            </AdminDetailGrid>
          </>
        ) : null}
      </AdminRecordShell>
    );
  }

  const isEdit = mode === 'edit';
  const isNew = mode === 'new';
  const title = isNew ? 'New medicine category' : isEdit ? 'Edit medicine category' : 'Medicine category';

  const handleFormBack = () => {
    if (isNew) goList();
    else if (isEdit && categoryId) navigate(`/admin/medicine-categories/${categoryId}`);
    else goList();
  };

  return (
    <AdminRecordShell
      title={title}
      onBack={handleFormBack}
      backLabel={isNew ? 'Back to categories' : isEdit ? 'Back to details' : 'Back to categories'}
      footer={null}
    >
      <form onSubmit={handleSubmit} className="modal-form" style={{ margin: 0, padding: 0, border: 'none', boxShadow: 'none', background: 'transparent' }}>
        <div className="form-group">
          <label htmlFor="mc-name">Name*</label>
          <input
            id="mc-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label htmlFor="mc-desc">Description</label>
          <textarea id="mc-desc" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
          <button type="button" className="btn-add btn-cancel" style={{ flex: 1 }} onClick={goList}>
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

export default MedicineCategoryRecordPage;
