import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  X,
  Clock,
  Loader2,
  ArrowRight,
  IndianRupee,
  Check,
  Sparkles,
} from 'lucide-react';
import { DeliverySlotTimeDials } from '../../components/common/CircularTimeDial';
import {
  buildDeliverySlotLabel,
  parseDeliverySlotRangeToHHmm,
  isValidDeliverySlotRange,
} from '../../utils/timeFormatters';
import './DeliveryTab.css';

const formatInr = (value) => {
  if (value === '' || value == null) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);
};

const emptySlotForm = () => ({
  startHm: '',
  endHm: '',
  is_active: true,
});

/**
 * Admin delivery settings: home delivery toggle, IST windows (clock time pickers), free-delivery band.
 */
const DeliveryTab = ({ deliverySettings, setDeliverySettings, updateDeliverySettings, showNotify }) => {
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [savingFreeRange, setSavingFreeRange] = useState(false);
  const [toggleSaving, setToggleSaving] = useState(false);

  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [slotModalMode, setSlotModalMode] = useState('add');
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [slotForm, setSlotForm] = useState(emptySlotForm);

  const closeSlotModal = useCallback(() => {
    setSlotModalOpen(false);
    setEditingSlotIndex(null);
    setSlotForm(emptySlotForm());
  }, []);

  useEffect(() => {
    if (!slotModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeSlotModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slotModalOpen, closeSlotModal]);

  const openAddSlot = () => {
    setSlotModalMode('add');
    setEditingSlotIndex(null);
    setSlotForm({ startHm: '09:00', endHm: '11:00', is_active: true });
    setSlotModalOpen(true);
  };

  const openEditSlot = (idx) => {
    const row = (deliverySettings.delivery_slot_times || [])[idx];
    if (!row) return;
    const { startHm, endHm } = parseDeliverySlotRangeToHHmm(row.slot_time || '');
    setSlotModalMode('edit');
    setEditingSlotIndex(idx);
    setSlotForm({
      startHm: startHm || '09:00',
      endHm: endHm || '11:00',
      is_active: row.is_active !== false,
    });
    setSlotModalOpen(true);
  };

  const applySlotModal = (e) => {
    e?.preventDefault();
    const { startHm, endHm, is_active } = slotForm;
    if (!startHm || !endHm) {
      showNotify?.('Choose a start and end time on the clock dials.', 'error');
      return;
    }
    if (!isValidDeliverySlotRange(startHm, endHm)) {
      showNotify?.('End time must be after start time (same day).', 'error');
      return;
    }
    const slot_time = buildDeliverySlotLabel(startHm, endHm);
    if (!slot_time) {
      showNotify?.('Could not build a valid time window label.', 'error');
      return;
    }

    setDeliverySettings((prev) => {
      const list = [...(prev.delivery_slot_times || [])];
      const entry = { slot_time, is_active };
      if (slotModalMode === 'edit' && editingSlotIndex != null) {
        list[editingSlotIndex] = entry;
      } else {
        list.push(entry);
      }
      return { ...prev, delivery_slot_times: list };
    });
    closeSlotModal();
  };

  const removeSlot = (idx) => {
    if (!window.confirm('Remove this delivery window from the list?')) return;
    setDeliverySettings((prev) => ({
      ...prev,
      delivery_slot_times: (prev.delivery_slot_times || []).filter((_, i) => i !== idx),
    }));
  };

  const toggleSlotActive = (idx, checked) => {
    setDeliverySettings((prev) => {
      const list = [...(prev.delivery_slot_times || [])];
      if (!list[idx]) return prev;
      list[idx] = { ...list[idx], is_active: checked };
      return { ...prev, delivery_slot_times: list };
    });
  };

  const saveAvailability = async (e) => {
    e?.preventDefault();
    setSavingAvailability(true);
    try {
      await updateDeliverySettings({
        is_enabled: deliverySettings.is_enabled !== false,
        delivery_slot_times: deliverySettings.delivery_slot_times || [],
      });
    } finally {
      setSavingAvailability(false);
    }
  };

  const saveFreeRange = async (e) => {
    e.preventDefault();
    setSavingFreeRange(true);
    try {
      await updateDeliverySettings({
        free_delivery_min_amount: deliverySettings.free_delivery_min_amount,
        free_delivery_max_amount: deliverySettings.free_delivery_max_amount,
        delivery_fee: deliverySettings.delivery_fee,
      });
    } finally {
      setSavingFreeRange(false);
    }
  };

  const slots = deliverySettings.delivery_slot_times || [];
  const deliveryOn = deliverySettings.is_enabled !== false;

  const summary = useMemo(() => {
    const activeCount = slots.filter((s) => s.is_active !== false).length;
    const inactiveCount = slots.length - activeCount;
    const fee = formatInr(deliverySettings.delivery_fee);
    const minAmt = formatInr(deliverySettings.free_delivery_min_amount);
    const maxRaw = deliverySettings.free_delivery_max_amount;
    const maxAmt = maxRaw !== '' && maxRaw != null ? formatInr(maxRaw) : null;
    let band = '—';
    if (minAmt) {
      band = maxAmt ? `${minAmt} – ${maxAmt}` : `${minAmt}+ (no cap)`;
    }
    return {
      activeCount,
      inactiveCount,
      feeLabel: fee || '—',
      freeBandLabel: band,
    };
  }, [slots, deliverySettings.delivery_fee, deliverySettings.free_delivery_min_amount, deliverySettings.free_delivery_max_amount]);

  const applyDeliveryEnabled = async (enabled) => {
    const wasEnabled = deliverySettings.is_enabled !== false;
    setDeliverySettings((prev) => ({ ...prev, is_enabled: enabled }));
    setToggleSaving(true);
    const ok = await updateDeliverySettings({ is_enabled: enabled }, { silent: true });
    setToggleSaving(false);
    if (!ok) {
      setDeliverySettings((prev) => ({ ...prev, is_enabled: wasEnabled }));
      return;
    }
    showNotify?.(
      enabled
        ? 'Home delivery is on — customers can check out for delivery.'
        : 'Home delivery is off — checkout blocks delivery until you turn it on.',
      'success',
    );
  };

  const windowsLine =
    slots.length === 0
      ? 'No windows configured'
      : `${summary.activeCount} active${summary.inactiveCount ? ` · ${summary.inactiveCount} disabled` : ''}`;

  return (
    <div className="delivery-page animate-slide-up">
      <div className="delivery-shell">
        <header className="delivery-masthead">
          <div className="delivery-masthead__glow" aria-hidden />
          <div className="delivery-masthead__content">
            <span className="delivery-masthead__badge">
              <Truck size={14} strokeWidth={2.5} aria-hidden />
              Checkout & logistics
            </span>
            <h1 className="delivery-masthead__title">Delivery</h1>
            <p className="delivery-masthead__subtitle">
              Configure home delivery, IST time slots at checkout, and when the delivery fee applies. The service switch saves
              instantly; use Save for windows and pricing.
            </p>
          </div>
        </header>

        <div className="delivery-stats" role="region" aria-label="Delivery summary">
          <article className={`delivery-stat ${deliveryOn ? 'delivery-stat--on' : 'delivery-stat--off'}`}>
            <div className={`delivery-stat__icon ${deliveryOn ? 'delivery-stat__icon--success' : 'delivery-stat__icon--muted'}`}>
              <Truck size={18} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <span className="delivery-stat__label">Service</span>
              <span className="delivery-stat__value">{deliveryOn ? 'Accepting orders' : 'Paused'}</span>
            </div>
          </article>
          <article className="delivery-stat">
            <div className="delivery-stat__icon">
              <Clock size={18} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <span className="delivery-stat__label">Time windows</span>
              <span className="delivery-stat__value">{windowsLine}</span>
            </div>
          </article>
          <article className="delivery-stat">
            <div className="delivery-stat__icon">
              <IndianRupee size={18} strokeWidth={2} aria-hidden />
            </div>
            <div>
              <span className="delivery-stat__label">Fee & free band</span>
              <span className="delivery-stat__value">
                {summary.feeLabel}
                <span className="delivery-stat__sep">·</span>
                {summary.freeBandLabel}
              </span>
            </div>
          </article>
        </div>

        <div className="delivery-layout">
          <div className="delivery-layout__main">
            <section className="delivery-card" aria-labelledby="delivery-service-heading">
              <div className="delivery-card__head">
                <div className="delivery-card__head-text">
                  <h2 id="delivery-service-heading" className="delivery-card__title">
                    Home delivery service
                  </h2>
                  <p className="delivery-card__desc">
                    When off, customers cannot choose delivery at checkout. Turning on or off syncs to the server right away.
                  </p>
                </div>
              </div>
              <div className="delivery-master">
                <div>
                  <p className="delivery-master__label">Master switch</p>
                  <p className="delivery-master__hint">
                    <Sparkles size={12} strokeWidth={2.5} className="delivery-master__sparkle" aria-hidden />
                    Instant save — no extra button for ON/OFF.
                  </p>
                </div>
                <div className="delivery-master__side">
                  <div className="delivery-switch" role="group" aria-label="Home delivery on or off">
                    <button
                      type="button"
                      disabled={toggleSaving}
                      onClick={() => applyDeliveryEnabled(true)}
                      className={`delivery-switch__btn ${deliveryOn ? 'delivery-switch__btn--active' : ''}`}
                      aria-pressed={deliveryOn}
                    >
                      On
                    </button>
                    <button
                      type="button"
                      disabled={toggleSaving}
                      onClick={() => applyDeliveryEnabled(false)}
                      className={`delivery-switch__btn ${!deliveryOn ? 'delivery-switch__btn--active-off' : ''}`}
                      aria-pressed={!deliveryOn}
                    >
                      Off
                    </button>
                  </div>
                  {toggleSaving ? (
                    <span className="delivery-switch-saving" role="status" aria-live="polite">
                      <Loader2 size={14} className="spin-icon" aria-hidden />
                      Saving…
                    </span>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="delivery-card delivery-card--windows" aria-labelledby="delivery-windows-heading">
              <div className="delivery-windows-toolbar">
                <h3 id="delivery-windows-heading">IST delivery windows</h3>
                <button type="button" className="delivery-btn-primary" onClick={openAddSlot}>
                  <Plus size={17} strokeWidth={2.25} />
                  Add window
                </button>
              </div>

              {slots.length === 0 ? (
                <div className="delivery-empty">
                  <Clock size={40} strokeWidth={1.2} className="delivery-empty__icon" aria-hidden />
                  <p className="delivery-empty__title">No time windows yet</p>
                  <p className="delivery-empty__text">
                    Customers need at least one window to pick a delivery slot when home delivery is enabled.
                  </p>
                  <button type="button" className="delivery-btn-ghost" onClick={openAddSlot}>
                    <Plus size={18} /> Create first window
                  </button>
                </div>
              ) : (
                <ol className="delivery-timeline">
                  {slots.map((row, idx) => (
                    <li key={idx} className="delivery-timeline__item">
                      <span className="delivery-timeline__marker" aria-hidden>
                        {idx + 1}
                      </span>
                      <div
                        className={`delivery-timeline__card ${row.is_active === false ? 'delivery-timeline__card--inactive' : ''}`}
                      >
                        <div className="delivery-timeline__main">
                          <span className="delivery-timeline__clock" aria-hidden>
                            <Clock size={18} strokeWidth={2} />
                          </span>
                          <div className="delivery-timeline__copy">
                            <span className="delivery-timeline__time">{row.slot_time || '—'}</span>
                            {row.is_active === false ? (
                              <span className="delivery-timeline__badge">Hidden at checkout</span>
                            ) : null}
                            <label className="delivery-timeline__active">
                              <input
                                type="checkbox"
                                checked={row.is_active !== false}
                                onChange={(e) => toggleSlotActive(idx, e.target.checked)}
                              />
                              <span>Active</span>
                            </label>
                          </div>
                        </div>
                        <div className="delivery-timeline__actions">
                          <button type="button" className="action-btn" title="Edit window" onClick={() => openEditSlot(idx)}>
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="action-btn delete"
                            title="Remove window"
                            onClick={() => removeSlot(idx)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              <div className="delivery-save-bar">
                <p className="delivery-save-bar__hint">
                  After adding, editing, removing, or toggling windows, save so checkout and the server stay in sync.
                </p>
                <button type="button" className="btn-add" disabled={savingAvailability} onClick={saveAvailability}>
                  {savingAvailability ? <Loader2 size={18} className="spin-icon" aria-hidden /> : null}
                  Save windows
                </button>
              </div>
            </section>
          </div>

          <aside className="delivery-layout__aside" aria-labelledby="delivery-pricing-heading">
            <div className="delivery-pricing-head">
              <h2 id="delivery-pricing-heading">Pricing</h2>
              <p>Delivery fee outside the free band, and the cart subtotal range that ships free.</p>
            </div>

            <div className="delivery-band-diagram" aria-hidden="true">
              <p className="delivery-band-diagram__title">Cart subtotal (conceptual)</p>
              <div className="delivery-band-diagram__bar">
                <span className="delivery-band-diagram__seg delivery-band-diagram__seg--fee" title="Fee" />
                <span className="delivery-band-diagram__seg delivery-band-diagram__seg--free" title="Free delivery" />
                <span className="delivery-band-diagram__seg delivery-band-diagram__seg--fee" title="Fee if max set" />
              </div>
              <div className="delivery-band-diagram__labels">
                <span>Below min</span>
                <span>Free band</span>
                <span>Above max</span>
              </div>
            </div>

            <div className="delivery-rules">
              <p className="delivery-rules__title">Rules</p>
              <ul>
                <li>
                  <span className="delivery-rules__dot delivery-rules__dot--fee" />
                  <span>
                    Subtotal <strong>below</strong> the minimum → pay the delivery fee.
                  </span>
                </li>
                <li>
                  <span className="delivery-rules__dot delivery-rules__dot--free" />
                  <span>
                    Subtotal <strong>between</strong> min and max (inclusive) → <strong>free delivery</strong>.
                  </span>
                </li>
                <li>
                  <span className="delivery-rules__dot delivery-rules__dot--fee" />
                  <span>
                    If max is set, subtotal <strong>above</strong> it → fee applies again.
                  </span>
                </li>
              </ul>
            </div>

            <form onSubmit={saveFreeRange}>
              <div className="delivery-field">
                <label htmlFor="delivery-fee">Delivery fee (outside band)</label>
                <div className="delivery-input-wrap">
                  <span className="delivery-input-wrap__prefix">₹</span>
                  <input
                    id="delivery-fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={deliverySettings.delivery_fee ?? ''}
                    onChange={(e) =>
                      setDeliverySettings((prev) => ({
                        ...prev,
                        delivery_fee: e.target.value,
                      }))
                    }
                    placeholder="40"
                    required
                  />
                </div>
                <small className="delivery-field-hint">Charged when the cart is outside the free band.</small>
              </div>

              <div className="delivery-field">
                <label htmlFor="delivery-free-min">Minimum for free delivery</label>
                <div className="delivery-input-wrap">
                  <span className="delivery-input-wrap__prefix">₹</span>
                  <input
                    id="delivery-free-min"
                    type="number"
                    step="0.01"
                    min="0"
                    value={deliverySettings.free_delivery_min_amount ?? ''}
                    onChange={(e) =>
                      setDeliverySettings((prev) => ({
                        ...prev,
                        free_delivery_min_amount: e.target.value,
                      }))
                    }
                    placeholder="500"
                    required
                  />
                </div>
              </div>

              <div className="delivery-field">
                <label htmlFor="delivery-free-max">Maximum for free delivery (optional)</label>
                <div className="delivery-input-wrap">
                  <span className="delivery-input-wrap__prefix">₹</span>
                  <input
                    id="delivery-free-max"
                    type="number"
                    step="0.01"
                    min="0"
                    value={deliverySettings.free_delivery_max_amount ?? ''}
                    onChange={(e) =>
                      setDeliverySettings((prev) => ({
                        ...prev,
                        free_delivery_max_amount: e.target.value,
                      }))
                    }
                    placeholder="Empty = no upper limit"
                  />
                </div>
                <small className="delivery-field-hint">Large carts above this pay the fee again.</small>
              </div>

              <button type="submit" className="btn-add delivery-pricing-submit" disabled={savingFreeRange}>
                {savingFreeRange ? <Loader2 size={18} className="spin-icon" aria-hidden /> : null}
                Save pricing
              </button>
            </form>
          </aside>
        </div>
      </div>

      {slotModalOpen && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSlotModal();
          }}
        >
          <div
            className="admin-modal compact-modal delivery-slot-modal delivery-slot-modal--clocks"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delivery-slot-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="delivery-slot-modal-top">
              <div className="delivery-slot-modal-brand">
                <div className="delivery-slot-modal-icon-wrap" aria-hidden>
                  <Clock size={20} strokeWidth={2} />
                </div>
                <div className="delivery-slot-modal-titles">
                  <p className="delivery-slot-modal-kicker">India Standard Time</p>
                  <h3 id="delivery-slot-modal-title">
                    {slotModalMode === 'add' ? 'New delivery window' : 'Edit delivery window'}
                  </h3>
                </div>
              </div>
              <button type="button" className="delivery-slot-modal-close" onClick={closeSlotModal} aria-label="Close">
                <X size={20} />
              </button>
            </header>

            <form className="delivery-slot-modal-form" onSubmit={applySlotModal}>
              <div className="delivery-slot-modal-tip">
                <p>
                  Drag or tap the <strong>hour</strong> and <strong>minute</strong> rings. Preview updates live.{' '}
                  <strong>Cancel</strong> discards; <strong>Save window</strong> adds this range to your list (remember to save
                  windows on the main screen).
                </p>
              </div>

              <div className="delivery-slot-clocks">
                <div className="delivery-slot-clock-panel delivery-slot-clock-panel--start">
                  <div className="delivery-slot-clock-panel-head">
                    <span className="delivery-slot-clock-step" aria-hidden>
                      1
                    </span>
                    <div>
                      <span className="delivery-slot-clock-title">Opens</span>
                      <span className="delivery-slot-clock-sub">Start</span>
                    </div>
                  </div>
                  <div className="delivery-slot-clock-panel-body">
                    <DeliverySlotTimeDials
                      value={slotForm.startHm}
                      onChange={(v) => setSlotForm((f) => ({ ...f, startHm: v }))}
                      fallbackHour={9}
                      fallbackMinute={0}
                    />
                  </div>
                </div>

                <div className="delivery-slot-clocks-connector" aria-hidden>
                  <ArrowRight size={20} strokeWidth={2} />
                </div>

                <div className="delivery-slot-clock-panel delivery-slot-clock-panel--end">
                  <div className="delivery-slot-clock-panel-head">
                    <span className="delivery-slot-clock-step" aria-hidden>
                      2
                    </span>
                    <div>
                      <span className="delivery-slot-clock-title">Closes</span>
                      <span className="delivery-slot-clock-sub">End</span>
                    </div>
                  </div>
                  <div className="delivery-slot-clock-panel-body">
                    <DeliverySlotTimeDials
                      value={slotForm.endHm}
                      onChange={(v) => setSlotForm((f) => ({ ...f, endHm: v }))}
                      fallbackHour={11}
                      fallbackMinute={0}
                    />
                  </div>
                </div>
              </div>

              {slotForm.startHm && slotForm.endHm && isValidDeliverySlotRange(slotForm.startHm, slotForm.endHm) && (
                <div className="delivery-slot-preview">
                  <div className="delivery-slot-preview-inner">
                    <span className="delivery-slot-preview-label">Checkout label</span>
                    <span className="delivery-slot-preview-value">{buildDeliverySlotLabel(slotForm.startHm, slotForm.endHm)}</span>
                  </div>
                </div>
              )}

              <div className="delivery-slot-active-card">
                <label className="delivery-slot-checkbox-label">
                  <input
                    type="checkbox"
                    checked={slotForm.is_active}
                    onChange={(e) => setSlotForm((f) => ({ ...f, is_active: e.target.checked }))}
                  />
                  <span>
                    <strong>Offer this slot at checkout</strong>
                    <span className="delivery-slot-active-hint">Uncheck to keep the window in the list but hide it from customers.</span>
                  </span>
                </label>
              </div>

              <footer className="delivery-slot-modal-footer">
                <button type="button" className="btn-secondary" onClick={closeSlotModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-add delivery-slot-modal-submit"
                  aria-label={slotModalMode === 'add' ? 'Save new delivery window' : 'Save delivery window changes'}
                >
                  <Check size={18} strokeWidth={2.5} aria-hidden />
                  Save window
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryTab;
