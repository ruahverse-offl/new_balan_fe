import React, { useState, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { getBatchDetail } from '../../services/batchesApi';

const BatchesTab = ({
    batches,
    brands = [],
    searchTerm,
    setSearchTerm,
    batchesPage,
    setBatchesPage,
    batchesRowsPerPage,
    setBatchesRowsPerPage,
    onAddClick,
    onEditClick,
    onDeleteClick
}) => {
    const [batchDetail, setBatchDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const handleRowClick = useCallback(async (b, e) => {
        if (e.target.closest('button')) return;
        setDetailError(null);
        setDetailLoading(true);
        setBatchDetail(null);
        try {
            const detail = await getBatchDetail(b.id);
            setBatchDetail(detail);
        } catch (err) {
            setDetailError(err?.message || 'Failed to load batch detail');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const brandById = React.useMemo(() => {
        const m = {};
        (brands || []).forEach(b => { m[String(b.id)] = b; });
        return m;
    }, [brands]);
    const filteredBatches = (batches || []).filter(b =>
        b && b.batch_number && b.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getExpiryStyle = (expiryDate) => {
        if (!expiryDate) return {};
        const expiry = new Date(expiryDate);
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        if (expiry < now) {
            return { color: 'var(--admin-danger)' };
        } else if (expiry <= thirtyDaysFromNow) {
            return { color: 'var(--admin-warning, orange)' };
        }
        return {};
    };

    const formatExpiryDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    };

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions">
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setBatchesPage(1);
                        }}
                    />
                </div>
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Batch
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Batch Number</th>
                                <th>Brand (Product)</th>
                                <th>Expiry Date</th>
                                <th>Quantity</th>
                                <th>Purchase Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBatches
                                .slice((batchesPage - 1) * batchesRowsPerPage, batchesPage * batchesRowsPerPage)
                                .map(b => (
                                    <tr
                                        key={b.id}
                                        onClick={(e) => handleRowClick(b, e)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click for full details"
                                    >
                                        <td data-label="Batch Number">{b.batch_number}</td>
                                        <td data-label="Brand (Product)">
                                            {(() => {
                                                const brand = brandById[String(b.medicine_brand_id)];
                                                if (!brand) return '—';
                                                const med = brand.medicine_name || '';
                                                const brandCompany = (brand.brand_name || '') + (brand.manufacturer ? ' — ' + brand.manufacturer : '');
                                                return med ? `${med} → ${brandCompany}` : brandCompany;
                                            })()}
                                        </td>
                                        <td data-label="Expiry Date" style={getExpiryStyle(b.expiry_date)}>
                                            {formatExpiryDate(b.expiry_date)}
                                        </td>
                                        <td data-label="Quantity">{b.quantity_available}</td>
                                        <td data-label="Purchase Price">{b.purchase_price != null ? `₹${Number(b.purchase_price).toFixed(2)}` : '—'}</td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => onEditClick(b)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick('batch', b.id, b.batch_number)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    color: 'var(--admin-text-muted)'
                }}>
                    Rows per page:
                    <select
                        value={batchesRowsPerPage}
                        onChange={(e) => {
                            setBatchesRowsPerPage(Number(e.target.value));
                            setBatchesPage(1);
                        }}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--admin-border)',
                            backgroundColor: 'var(--admin-bg)',
                            color: 'var(--admin-text)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </label>
                {Math.ceil(filteredBatches.length / batchesRowsPerPage) > 1 && (
                    <div className="pagination-bar">
                        <button
                            onClick={() => setBatchesPage(p => Math.max(1, p - 1))}
                            disabled={batchesPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{batchesPage}</span> of {Math.ceil(filteredBatches.length / batchesRowsPerPage)}
                        </div>
                        <button
                            onClick={() => setBatchesPage(p => Math.min(Math.ceil(filteredBatches.length / batchesRowsPerPage), p + 1))}
                            disabled={batchesPage === Math.ceil(filteredBatches.length / batchesRowsPerPage)}
                            className="page-nav-btn"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Batch detail modal (row click) */}
            {(detailLoading || batchDetail || detailError) && (
                <div className="admin-modal-overlay" onClick={() => { if (!detailLoading) { setBatchDetail(null); setDetailError(null); } }}>
                    <div className="admin-modal" style={{ maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Batch details</h3>
                            {!detailLoading && (
                                <button type="button" className="action-btn" onClick={() => { setBatchDetail(null); setDetailError(null); }} aria-label="Close">
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        <div className="modal-body" style={{ padding: '1rem' }}>
                            {detailLoading && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem' }}>
                                    <Loader2 size={24} className="spin" /> Loading…
                                </div>
                            )}
                            {detailError && (
                                <p style={{ color: 'var(--admin-danger)', padding: '1rem' }}>{detailError}</p>
                            )}
                            {!detailLoading && !detailError && batchDetail && (
                                <>
                                    <section style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Batch</h4>
                                        <table className="admin-table" style={{ margin: 0 }}>
                                            <tbody>
                                                <tr><td><strong>Batch number</strong></td><td>{batchDetail.batch?.batch_number}</td></tr>
                                                <tr><td><strong>Expiry date</strong></td><td style={getExpiryStyle(batchDetail.batch?.expiry_date)}>{formatExpiryDate(batchDetail.batch?.expiry_date)}</td></tr>
                                                <tr><td><strong>Quantity available</strong></td><td>{batchDetail.batch?.quantity_available}</td></tr>
                                                <tr><td><strong>Purchase price</strong></td><td>{batchDetail.batch?.purchase_price != null ? `₹${Number(batchDetail.batch.purchase_price).toFixed(2)}` : '—'}</td></tr>
                                            </tbody>
                                        </table>
                                    </section>
                                    <section style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Inventory history for this batch</h4>
                                        {(batchDetail.transactions?.length || 0) === 0 ? (
                                            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>No transactions yet.</p>
                                        ) : (
                                            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                                <table className="admin-table">
                                                    <thead><tr><th>Type</th><th>Qty change</th><th>Remarks</th><th>Date</th></tr></thead>
                                                    <tbody>
                                                        {batchDetail.transactions.map(t => (
                                                            <tr key={t.id}>
                                                                <td><span className={`status-tag ${t.transaction_type === 'SALE' ? 'pending' : 'active'}`}>{t.transaction_type}</span></td>
                                                                <td>{t.quantity_change > 0 ? '+' : ''}{t.quantity_change}</td>
                                                                <td>{t.remarks || '—'}</td>
                                                                <td>{formatDateTime(t.created_at)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>
                                    <section>
                                        <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Order lines that used this batch</h4>
                                        {(batchDetail.order_items?.length || 0) === 0 ? (
                                            <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem' }}>None yet.</p>
                                        ) : (
                                            <div className="table-wrapper" style={{ overflowX: 'auto' }}>
                                                <table className="admin-table">
                                                    <thead><tr><th>Order ref</th><th>Product</th><th>Qty</th><th>Total</th><th>Date</th></tr></thead>
                                                    <tbody>
                                                        {batchDetail.order_items.map(oi => (
                                                            <tr key={oi.id}>
                                                                <td>{oi.order_reference || oi.order_id}</td>
                                                                <td>{(oi.medicine_name || '') + (oi.brand_name ? ` — ${oi.brand_name}` : '')}</td>
                                                                <td>{oi.quantity}</td>
                                                                <td>{oi.total_price != null ? `₹${Number(oi.total_price).toFixed(2)}` : '—'}</td>
                                                                <td>{formatDateTime(oi.created_at)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchesTab;
