import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, Eye, RefreshCw } from 'lucide-react';
import { PageLoading } from '../../components/common/PageLoading';
import ActionOverlay from '../../components/admin/ActionOverlay';
import { useActionLock } from '../../hooks/useActionLock';
import {
  CardHeader, Toolbar, SearchInput, Btn, IconBtn,
  StatusBadge, EmptyState, TableFooter, ConfirmModal, FormModal, FormField, Input, Textarea,
} from '../../components/admin/AdminUI';
import { useAuth } from '../../context/AuthContext';
import { hasModuleGrant } from '../../utils/permissionMapper';
import { listBrandMasters, createBrandMaster, updateBrandMaster, deleteBrandMaster } from '../../services/brandsApi';
import './AdminCatalogTabs.css';
import './BrandMasterTab.css';

const BrandMasterTab = ({ showNotify }) => {
  const { user } = useAuth();
  const role = (user?.backendRole || user?.role || '').toUpperCase();
  const isAdminRole = role === 'DEV_ADMIN' || role === 'ADMIN';
  const mi = user?.menuItems || [];
  const canCreate = isAdminRole || hasModuleGrant(mi, 'brand-master', 'create');
  const canUpdate = isAdminRole || hasModuleGrant(mi, 'brand-master', 'update');
  const canDelete  = isAdminRole || hasModuleGrant(mi, 'brand-master', 'delete');

  const [search, setSearch]         = useState('');
  const [debSearch, setDebSearch]   = useState('');
  const [page, setPage]             = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading]       = useState(false);
  const [items, setItems]           = useState([]);
  const [pagination, setPagination] = useState(null);

  const [showModal, setShowModal]       = useState(false);
  const [modalMode, setModalMode]       = useState('add');
  const [editingId, setEditingId]       = useState(null);
  const [form, setForm]                 = useState({ name: '', description: '', is_active: true });
  const [viewBrand, setViewBrand]       = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { locked, message: lockMsg, run: lockRun } = useActionLock();

  /* ── debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setDebSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debSearch, rowsPerPage]);

  /* ── load ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listBrandMasters({
        limit: rowsPerPage,
        offset: (page - 1) * rowsPerPage,
        search: debSearch || undefined,
        sort_by: 'name',
        sort_order: 'asc',
      });
      setItems(res.items || []);
      setPagination(res.pagination || null);
    } catch (e) {
      showNotify(e?.message || 'Failed to load brands', 'error');
      setItems([]); setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debSearch, showNotify]);

  useEffect(() => { load(); }, [load]);

  /* ── keyboard close for view modal ── */
  useEffect(() => {
    if (!viewBrand) return;
    const onKey = (e) => { if (e.key === 'Escape') setViewBrand(null); };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [viewBrand]);

  const openAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setForm({ name: '', description: '', is_active: true });
    setShowModal(true);
  };

  const openEdit = (row) => {
    setModalMode('edit');
    setEditingId(row.id);
    setForm({ name: row.name || '', description: row.description || '', is_active: row.is_active !== false });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name?.trim();
    if (!name) { showNotify('Brand name is required', 'error'); return; }
    const label = modalMode === 'add' ? 'Creating brand…' : 'Saving brand…';
    await lockRun(async () => {
      try {
        if (modalMode === 'add') {
          await createBrandMaster({ name, description: form.description?.trim() || undefined });
          showNotify('Brand created', 'success');
        } else {
          await updateBrandMaster(editingId, { name, description: form.description?.trim() || null, is_active: form.is_active });
          showNotify('Brand updated', 'success');
        }
        setShowModal(false);
        await load();
      } catch (err) {
        showNotify(err?.message || 'Save failed', 'error');
      }
    }, label);
  };

  const handleDelete = async () => {
    if (!deleteConfirm?.id) return;
    await lockRun(async () => {
      try {
        await deleteBrandMaster(deleteConfirm.id);
        showNotify('Brand removed', 'success');
        setDeleteConfirm(null);
        await load();
      } catch (err) {
        showNotify(err?.message || 'Delete failed', 'error');
      }
    }, 'Deleting brand…');
  };

  const fmtTs = (v) => { try { return v ? new Date(v).toLocaleString() : '—'; } catch { return String(v); } };

  const total      = pagination?.total ?? 0;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / rowsPerPage)) : 1;
  const activeCount = items.filter((b) => b.is_active !== false).length;

  return (
    <div className="admin-table-card catalog-tab-card animate-slide-up" style={{ position: 'relative' }}>
      <ActionOverlay show={locked} message={lockMsg} />

      {/* ── Header ── */}
      <CardHeader
        icon={Tag}
        iconColor="blue"
        title="Brand catalog"
        subtitle="Shared trade names used by medicine–brand lines and inventory."
        stats={[
          { value: total, label: 'Total' },
          { value: activeCount, label: 'Active' },
        ]}
        actions={
          <Btn variant="ghost" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'aui-spin' : ''} /> Refresh
          </Btn>
        }
      />

      {/* ── Toolbar ── */}
      <Toolbar>
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands…"
        />
        <span className="catalog-tab-meta" style={{ marginLeft: 0 }}>
          {total > 0 && !loading ? `${total} brand${total !== 1 ? 's' : ''}` : ''}
        </span>
        {canCreate && (
          <Btn variant="primary" size="md" onClick={openAdd} style={{ marginLeft: 'auto' }}>
            <Plus size={15} /> Add brand
          </Btn>
        )}
      </Toolbar>

      {/* ── Table ── */}
      <div className="table-wrapper">
        {loading && items.length === 0 ? (
          <PageLoading variant="compact" className="catalog-loading" message="Loading brands…" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="No brands found"
            description={debSearch?.trim() ? 'Try another search or clear the box.' : 'Add a brand with the button above.'}
            action={canCreate ? <Btn variant="primary" size="sm" onClick={openAdd}><Plus size={14} /> Add brand</Btn> : null}
          />
        ) : (
          <table className="admin-table catalog-table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td className="catalog-cell-name">
                    <div className="brand-name-row">
                      <span className="brand-initial-badge" aria-hidden>
                        {(row.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="catalog-brand-pill" title={row.name || ''}>{row.name || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="catalog-desc-preview" title={row.description || ''}>
                      {row.description || <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={row.is_active !== false ? 'active' : 'inactive'} />
                  </td>
                  <td>
                    <div className="actions">
                      <IconBtn title="View details" onClick={() => setViewBrand(row)}>
                        <Eye size={14} />
                      </IconBtn>
                      {canUpdate && (
                        <IconBtn title="Edit brand" onClick={() => openEdit(row)}>
                          <Pencil size={14} />
                        </IconBtn>
                      )}
                      {canDelete && (
                        <IconBtn variant="danger" title="Delete brand" onClick={() => setDeleteConfirm({ id: row.id, name: row.name })}>
                          <Trash2 size={14} />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {total > 0 && (
        <TableFooter
          page={page}
          totalPages={totalPages}
          total={total}
          rowsPerPage={rowsPerPage}
          onRowsChange={(n) => { setRowsPerPage(n); setPage(1); }}
          onPage={setPage}
          label="brands"
        />
      )}

      {/* ── Create / Edit Modal ── */}
      <FormModal
        show={showModal && (canCreate || canUpdate)}
        title={modalMode === 'add' ? 'Add brand' : 'Edit brand'}
        icon={Tag}
        iconColor="blue"
        onClose={() => setShowModal(false)}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSubmit}>
              {modalMode === 'add' ? 'Create brand' : 'Save changes'}
            </Btn>
          </>
        }
      >
        <form id="brand-form" onSubmit={handleSubmit}>
          <FormField label="Brand name" htmlFor="bm-name" required>
            <Input
              id="bm-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Crocin"
              autoFocus
            />
          </FormField>
          <FormField label="Description" htmlFor="bm-desc">
            <Textarea
              id="bm-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional notes about this brand…"
            />
          </FormField>
          {modalMode === 'edit' && (
            <FormField label="Status" htmlFor="bm-active">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  id="bm-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Active — brand appears in dropdowns and inventory
              </label>
            </FormField>
          )}
        </form>
      </FormModal>

      {/* ── View Details Modal ── */}
      <FormModal
        show={!!viewBrand}
        title="Brand details"
        icon={Tag}
        iconColor="blue"
        onClose={() => setViewBrand(null)}
        footer={<Btn variant="ghost" onClick={() => setViewBrand(null)}>Close</Btn>}
      >
        {viewBrand && (
          <div className="bm-detail-grid">
            <div className="bm-detail-row bm-detail-row--full">
              <span className="bm-detail-label">Name</span>
              <span className="bm-detail-value bm-detail-name">{viewBrand.name || '—'}</span>
            </div>
            <div className="bm-detail-row bm-detail-row--full">
              <span className="bm-detail-label">Description</span>
              <div className="bm-detail-desc">
                {viewBrand.description || <span style={{ color: 'var(--admin-text-muted)' }}>No description</span>}
              </div>
            </div>
            <div className="bm-detail-row">
              <span className="bm-detail-label">Status</span>
              <StatusBadge status={viewBrand.is_active !== false ? 'active' : 'inactive'} />
            </div>
            <div className="bm-detail-row">
              <span className="bm-detail-label">ID</span>
              <code className="bm-detail-id">{viewBrand.id ?? '—'}</code>
            </div>
            {viewBrand.created_at != null && (
              <div className="bm-detail-row">
                <span className="bm-detail-label">Created</span>
                <span className="bm-detail-value">{fmtTs(viewBrand.created_at)}</span>
              </div>
            )}
            {viewBrand.updated_at != null && (
              <div className="bm-detail-row">
                <span className="bm-detail-label">Updated</span>
                <span className="bm-detail-value">{fmtTs(viewBrand.updated_at)}</span>
              </div>
            )}
          </div>
        )}
      </FormModal>

      {/* ── Delete Confirm ── */}
      <ConfirmModal
        show={!!deleteConfirm && canDelete}
        title="Delete brand?"
        message={`Remove "${deleteConfirm?.name}" from the catalog? Existing offerings keep their link; this soft-deletes the master row.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default BrandMasterTab;
