import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, TestTube } from 'lucide-react';
import { PageLoading } from '../../components/common/PageLoading';
import ActionOverlay from '../../components/admin/ActionOverlay';
import { useActionLock } from '../../hooks/useActionLock';
import {
    CardHeader,
    Toolbar,
    Btn,
    IconBtn,
    StatusBadge,
    EmptyState,
    ConfirmModal,
    FormModal,
    FormField,
    Input,
    Textarea,
} from '../../components/admin/AdminUI';
import {
    getPolyclinicTests,
    createPolyclinicTest,
    updatePolyclinicTest,
    deletePolyclinicTest,
} from '../../services/polyclinicTestsApi';
import './AdminCatalogTabs.css';

const emptyForm = () => ({
    name: '',
    description: '',
    price: '',
    duration: '',
    fasting_required: false,
    icon_name: 'TestTube',
    is_active: true,
});

/**
 * Admin: manage polyclinic lab tests. RBAC module code: ``clinic``.
 */
const PolyclinicTestsTab = ({ showNotify, canCreate, canUpdate, canDelete }) => {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { locked, message: lockMsg, run: lockRun } = useActionLock();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPolyclinicTests({ limit: 100, sort_order: 'asc' });
            setRows(res.items || []);
        } catch (e) {
            showNotify?.(e?.message || 'Failed to load tests', 'error');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [showNotify]);

    useEffect(() => {
        load();
    }, [load]);

    const openAdd = () => {
        setEditingId(null);
        setForm(emptyForm());
        setModalOpen(true);
    };

    const openEdit = (row) => {
        setEditingId(row.id);
        setForm({
            name: row.name || '',
            description: row.description || '',
            price: row.price != null ? String(row.price) : '',
            duration: row.duration || '',
            fasting_required: !!row.fasting_required,
            icon_name: row.icon_name || 'TestTube',
            is_active: row.is_active !== false,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        const name = (form.name || '').trim();
        const priceNum = Number(form.price);
        if (!name) {
            showNotify?.('Name is required', 'error');
            return;
        }
        if (!Number.isFinite(priceNum) || priceNum < 0) {
            showNotify?.('Enter a valid price', 'error');
            return;
        }
        const label = editingId ? 'Saving test…' : 'Creating test…';
        await lockRun(async () => {
            try {
                const body = {
                    name,
                    description: (form.description || '').trim() || undefined,
                    price: priceNum,
                    duration: (form.duration || '').trim() || undefined,
                    fasting_required: !!form.fasting_required,
                    icon_name: (form.icon_name || '').trim() || undefined,
                };
                if (editingId) {
                    await updatePolyclinicTest(editingId, { ...body, is_active: form.is_active });
                    showNotify?.('Test updated', 'success');
                } else {
                    await createPolyclinicTest(body);
                    showNotify?.('Test created', 'success');
                }
                setModalOpen(false);
                await load();
            } catch (err) {
                showNotify?.(err?.message || 'Save failed', 'error');
            }
        }, label);
    };

    const handleDeleteConfirmed = async () => {
        if (!deleteConfirm?.id) return;
        const id = deleteConfirm.id;
        setDeleteConfirm(null);
        await lockRun(async () => {
            try {
                await deletePolyclinicTest(id);
                showNotify?.('Test deleted', 'success');
                await load();
            } catch (err) {
                showNotify?.(err?.message || 'Delete failed', 'error');
            }
        }, 'Deleting test…');
    };

    const total = rows.length;
    const activeCount = rows.filter((r) => r.is_active !== false).length;

    return (
        <div className="admin-table-card catalog-tab-card animate-slide-up" style={{ position: 'relative' }}>
            <ActionOverlay show={locked} message={lockMsg} />

            <CardHeader
                icon={TestTube}
                iconColor="teal"
                title="Polyclinic tests"
                subtitle="Tests on the public Polyclinic page and in test bookings. Requires the clinic module."
                stats={[
                    { value: total, label: 'Tests' },
                    { value: activeCount, label: 'Active' },
                ]}
                actions={
                    <Btn variant="ghost" size="sm" onClick={() => load()} disabled={loading}>
                        <RefreshCw size={14} className={loading ? 'aui-spin' : ''} /> Refresh
                    </Btn>
                }
            />

            <Toolbar>
                {canCreate && (
                    <Btn variant="primary" size="md" onClick={openAdd} style={{ marginLeft: 'auto' }}>
                        <Plus size={15} /> Add test
                    </Btn>
                )}
                {!loading && total > 0 && (
                    <span className="catalog-tab-meta" style={{ marginLeft: canCreate ? '0.5rem' : 'auto' }}>
                        {total} test{total !== 1 ? 's' : ''}
                    </span>
                )}
            </Toolbar>

            <div className="table-wrapper">
                {loading && rows.length === 0 ? (
                    <PageLoading variant="compact" className="catalog-loading" message="Loading polyclinic tests…" />
                ) : rows.length === 0 ? (
                    <EmptyState
                        icon={TestTube}
                        title="No tests yet"
                        description={
                            canCreate
                                ? 'Add a test with the button above.'
                                : 'Nothing to show or you may lack read access to the clinic module.'
                        }
                        action={
                            canCreate ? (
                                <Btn variant="primary" size="sm" onClick={openAdd}>
                                    <Plus size={14} /> Add test
                                </Btn>
                            ) : null
                        }
                    />
                ) : (
                    <table className="admin-table catalog-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price (₹)</th>
                                <th>Duration</th>
                                <th>Active</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id}>
                                    <td className="catalog-cell-name">
                                        <strong>{r.name}</strong>
                                        {r.description ? (
                                            <div className="catalog-desc-preview" title={r.description}>
                                                {r.description}
                                            </div>
                                        ) : null}
                                    </td>
                                    <td>{r.price != null ? Number(r.price).toFixed(2) : '—'}</td>
                                    <td>{r.duration || '—'}</td>
                                    <td>
                                        <StatusBadge status={r.is_active !== false ? 'active' : 'inactive'} />
                                    </td>
                                    <td>
                                        <div className="actions">
                                            {canUpdate && (
                                                <IconBtn title="Edit test" onClick={() => openEdit(r)}>
                                                    <Pencil size={14} />
                                                </IconBtn>
                                            )}
                                            {canDelete && (
                                                <IconBtn
                                                    variant="danger"
                                                    title="Delete test"
                                                    onClick={() =>
                                                        setDeleteConfirm({ id: r.id, name: r.name || 'this test' })
                                                    }
                                                >
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

            <FormModal
                show={modalOpen && (canCreate || canUpdate)}
                title={editingId ? 'Edit test' : 'New test'}
                icon={TestTube}
                iconColor="teal"
                onClose={() => setModalOpen(false)}
                footer={
                    <>
                        <Btn variant="ghost" onClick={() => setModalOpen(false)}>
                            Cancel
                        </Btn>
                        <Btn variant="primary" onClick={handleSubmit}>
                            {editingId ? 'Save changes' : 'Create test'}
                        </Btn>
                    </>
                }
            >
                <form id="polyclinic-test-form" onSubmit={handleSubmit}>
                    <FormField label="Name" htmlFor="pct-name" required>
                        <Input
                            id="pct-name"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            autoFocus
                        />
                    </FormField>
                    <FormField label="Description" htmlFor="pct-desc">
                        <Textarea
                            id="pct-desc"
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Price (₹)" htmlFor="pct-price" required>
                        <Input
                            id="pct-price"
                            type="number"
                            min={0}
                            step="0.01"
                            required
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Duration" htmlFor="pct-duration">
                        <Input
                            id="pct-duration"
                            value={form.duration}
                            onChange={(e) => setForm({ ...form, duration: e.target.value })}
                            placeholder="e.g. 15–20 mins"
                        />
                    </FormField>
                    <FormField label="" htmlFor="pct-fast">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <input
                                id="pct-fast"
                                type="checkbox"
                                checked={form.fasting_required}
                                onChange={(e) => setForm({ ...form, fasting_required: e.target.checked })}
                            />
                            Fasting required
                        </label>
                    </FormField>
                    {editingId && (
                        <FormField label="" htmlFor="pct-active">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                <input
                                    id="pct-active"
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                />
                                Active — shown on site and in booking dropdowns
                            </label>
                        </FormField>
                    )}
                </form>
            </FormModal>

            <ConfirmModal
                show={!!deleteConfirm && canDelete}
                title="Delete test?"
                message={`Remove "${deleteConfirm?.name}"? Test bookings may still reference this test.`}
                confirmLabel="Delete"
                danger
                onConfirm={handleDeleteConfirmed}
                onCancel={() => setDeleteConfirm(null)}
            />
        </div>
    );
};

export default PolyclinicTestsTab;
