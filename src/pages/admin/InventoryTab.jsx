import React, { useState, useCallback } from 'react';
import { Search, Plus, Pencil, Trash2, ArrowLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { getInventoryTransactionDetail } from '../../services/inventoryTransactionsApi';

const InventoryTab = ({
    inventoryTransactions,
    brands = [],
    batches = [],
    searchTerm,
    setSearchTerm,
    inventoryPage,
    setInventoryPage,
    inventoryRowsPerPage,
    setInventoryRowsPerPage,
    onAddClick,
    onEditClick,
    onDeleteClick,
    medicineBrandIdFilter,
    setMedicineBrandIdFilter,
}) => {
    const [transactionDetail, setTransactionDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const handleRowClick = useCallback(async (t, e) => {
        if (e.target.closest('button')) return;
        setDetailError(null);
        setDetailLoading(true);
        setTransactionDetail(null);
        try {
            const detail = await getInventoryTransactionDetail(t.id);
            setTransactionDetail(detail);
        } catch (err) {
            setDetailError(err?.message || 'Failed to load transaction detail');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const brandById = React.useMemo(() => {
        const m = {};
        (brands || []).forEach(b => { m[String(b.id)] = b; });
        return m;
    }, [brands]);
    const batchById = React.useMemo(() => {
        const m = {};
        (batches || []).forEach(b => { m[String(b.id)] = b; });
        return m;
    }, [batches]);
    const filteredTransactions = (inventoryTransactions || []).filter(t =>
        t && (
            (t.transaction_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.remarks || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    };

    const totalPages = Math.ceil(filteredTransactions.length / inventoryRowsPerPage);

    return (
        <div className="admin-table-card animate-slide-up">
            <div className="table-actions" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div className="table-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search inventory..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setInventoryPage(1);
                        }}
                    />
                </div>
                {setMedicineBrandIdFilter && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>By medicine brand:</label>
                        <select
                            value={medicineBrandIdFilter || ''}
                            onChange={(e) => {
                                setMedicineBrandIdFilter(e.target.value || null);
                                setInventoryPage(1);
                            }}
                            style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid var(--admin-border)',
                                backgroundColor: 'var(--admin-bg)',
                                color: 'var(--admin-text)',
                                minWidth: '220px',
                            }}
                        >
                            <option value="">All brands</option>
                            {(brands || []).map(br => (
                                <option key={br.id} value={br.id}>
                                    {(br.medicine_name || '') + (br.brand_name ? ` — ${br.brand_name}` : br.brand_name || '')}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <button className="btn-add" onClick={onAddClick}>
                    <Plus size={18} /> Add Transaction
                </button>
            </div>
            <div className="scrollable-section-wrapper">
                <div className="table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Brand (Product)</th>
                                <th>Batch</th>
                                <th>Type</th>
                                <th>Qty Change</th>
                                <th>Remarks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions
                                .slice((inventoryPage - 1) * inventoryRowsPerPage, inventoryPage * inventoryRowsPerPage)
                                .map(t => (
                                    <tr
                                        key={t.id}
                                        onClick={(e) => handleRowClick(t, e)}
                                        style={{ cursor: 'pointer' }}
                                        title="Click for details"
                                    >
                                        <td data-label="Brand (Product)">
                                            {(() => {
                                                const brand = brandById[String(t.medicine_brand_id)];
                                                if (!brand) return '—';
                                                const med = brand.medicine_name || '';
                                                const brandCompany = (brand.brand_name || '') + (brand.manufacturer ? ' — ' + brand.manufacturer : '');
                                                return med ? `${med} → ${brandCompany}` : brandCompany;
                                            })()}
                                        </td>
                                        <td data-label="Batch">
                                            {batchById[String(t.product_batch_id)] ? batchById[String(t.product_batch_id)].batch_number : '—'}
                                        </td>
                                        <td data-label="Type">
                                            <span className={`status-tag ${
                                                t.transaction_type === 'PURCHASE' ? 'active' :
                                                t.transaction_type === 'SALE' ? 'pending' :
                                                'inactive'
                                            }`}>
                                                {t.transaction_type}
                                            </span>
                                        </td>
                                        <td data-label="Qty Change">
                                            {t.quantity_change > 0 ? '+' : ''}{t.quantity_change}
                                        </td>
                                        <td data-label="Remarks">
                                            {t.remarks ? (t.remarks.length > 40 ? t.remarks.substring(0, 40) + '...' : t.remarks) : 'N/A'}
                                        </td>
                                        <td data-label="Actions" className="actions">
                                            <button
                                                className="action-btn"
                                                onClick={() => onEditClick(t)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => onDeleteClick('inventory-transaction', t.id, t.transaction_type)}
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
                        value={inventoryRowsPerPage}
                        onChange={(e) => {
                            setInventoryRowsPerPage(Number(e.target.value));
                            setInventoryPage(1);
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
                {totalPages > 1 && (
                    <div className="pagination-bar">
                        <button
                            onClick={() => setInventoryPage(p => Math.max(1, p - 1))}
                            disabled={inventoryPage === 1}
                            className="page-nav-btn"
                        >
                            <ArrowLeft size={18} /> Prev
                        </button>
                        <div className="page-numbers">
                            Page <span>{inventoryPage}</span> of {totalPages}
                        </div>
                        <button
                            onClick={() => setInventoryPage(p => Math.min(totalPages, p + 1))}
                            disabled={inventoryPage === totalPages}
                            className="page-nav-btn"
                        >
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* Transaction detail modal (row click) */}
            {(detailLoading || transactionDetail || detailError) && (
                <div className="admin-modal-overlay" onClick={() => { if (!detailLoading) { setTransactionDetail(null); setDetailError(null); } }}>
                    <div className="admin-modal" style={{ maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Transaction details</h3>
                            {!detailLoading && (
                                <button type="button" className="action-btn" onClick={() => { setTransactionDetail(null); setDetailError(null); }} aria-label="Close">
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
                            {!detailLoading && !detailError && transactionDetail && (
                                <>
                                    <section style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Transaction</h4>
                                        <table className="admin-table" style={{ margin: 0 }}>
                                            <tbody>
                                                <tr><td><strong>Type</strong></td><td><span className={`status-tag ${transactionDetail.transaction?.transaction_type === 'SALE' ? 'pending' : 'active'}`}>{transactionDetail.transaction?.transaction_type}</span></td></tr>
                                                <tr><td><strong>Quantity change</strong></td><td>{(transactionDetail.transaction?.quantity_change > 0 ? '+' : '') + (transactionDetail.transaction?.quantity_change ?? '')}</td></tr>
                                                <tr><td><strong>Remarks</strong></td><td>{transactionDetail.transaction?.remarks || '—'}</td></tr>
                                                <tr><td><strong>Date</strong></td><td>{formatDateTime(transactionDetail.transaction?.created_at)}</td></tr>
                                            </tbody>
                                        </table>
                                    </section>
                                    {transactionDetail.order_summary && (
                                        <section>
                                            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Linked order (sale)</h4>
                                            <table className="admin-table" style={{ margin: 0 }}>
                                                <tbody>
                                                    <tr><td><strong>Order ref</strong></td><td>{transactionDetail.order_summary.order_reference || transactionDetail.order_summary.order_id}</td></tr>
                                                    <tr><td><strong>Customer</strong></td><td>{transactionDetail.order_summary.customer_name || '—'}</td></tr>
                                                    <tr><td><strong>Status</strong></td><td>{transactionDetail.order_summary.order_status || '—'}</td></tr>
                                                    <tr><td><strong>Amount</strong></td><td>{transactionDetail.order_summary.final_amount != null ? `₹${Number(transactionDetail.order_summary.final_amount).toFixed(2)}` : '—'}</td></tr>
                                                    <tr><td><strong>Date</strong></td><td>{formatDateTime(transactionDetail.order_summary.created_at)}</td></tr>
                                                </tbody>
                                            </table>
                                        </section>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryTab;
