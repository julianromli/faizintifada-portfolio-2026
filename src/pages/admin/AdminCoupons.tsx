import { useEffect, useState } from 'react';
import { m } from 'motion/react';
import { staggerContainer, staggerItemOpacity } from '../../lib/motion';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import {
  createCoupon,
  deleteCoupon,
  fetchCoupons,
  updateCoupon,
} from '../../lib/coupons-admin-api';
import {
  adminAlertError,
  adminAlertSuccess,
  adminAlertWarning,
  adminBtnDestructive,
  adminBtnPrimarySm,
  adminBtnSecondarySm,
  adminInputClass,
  adminLabelClass,
  adminSectionCard,
  adminTableContainer,
  adminTableDivide,
  adminTableHead,
  adminTableRow,
} from '../../lib/admin-styles';
import type { Coupon, CouponDiscountType } from '../../types/coupon';
import { formatCouponDiscount } from '../../lib/format-coupon';

type FormState = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  active: boolean;
  expiresAt: string;
};

const EMPTY_FORM: FormState = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  active: true,
  expiresAt: '',
};

function formatDiscount(coupon: Coupon): string {
  return formatCouponDiscount(coupon.discountType, coupon.discountValue);
}

function formatExpiry(ms?: number): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

function toDatetimeLocalValue(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDatetimeLocalValue(value: string): number | null {
  if (!value.trim()) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function couponToForm(coupon: Coupon): FormState {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: String(coupon.discountValue),
    active: coupon.active,
    expiresAt: toDatetimeLocalValue(coupon.expiresAt),
  };
}

function parseForm(form: FormState): Omit<Coupon, 'id' | 'createdAt'> {
  const discountValue = Number.parseInt(form.discountValue, 10);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new Error('Enter a valid discount value.');
  }
  if (form.discountType === 'percent' && discountValue > 100) {
    throw new Error('Percentage cannot exceed 100.');
  }

  return {
    code: form.code.trim(),
    discountType: form.discountType,
    discountValue,
    active: form.active,
    expiresAt: parseDatetimeLocalValue(form.expiresAt) ?? undefined,
  };
}

export function AdminCoupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchCoupons());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function startEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm(couponToForm(coupon));
    setFormError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setActionSuccess(null);

    try {
      const payload = parseForm(form);
      const saved =
        editingId === null
          ? await createCoupon(payload)
          : await updateCoupon(editingId, payload);

      setItems((prev) => {
        if (editingId === null) return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
      setActionSuccess(editingId === null ? `Created coupon “${saved.code}”.` : `Updated “${saved.code}”.`);
      cancelForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionSuccess(null);
    try {
      await deleteCoupon(pendingDelete.id);
      setItems((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setActionSuccess(`Deleted coupon “${pendingDelete.code}”.`);
      if (editingId === pendingDelete.id) cancelForm();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coupons"
        description="Promo codes for Faiz UI checkout. Codes are matched case-insensitively."
        action={{
          type: 'button',
          label: 'Add coupon',
          icon: <Plus size={18} weight="bold" aria-hidden />,
          onClick: startNew,
        }}
      />

      {loading && (
        <div className="space-y-2.5">
          <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
          <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
          <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
          <div className="skeleton skeleton-shimmer h-9 w-full rounded-lg" />
        </div>
      )}

      {!loading && error && (
        <div className={`${adminAlertWarning} space-y-2`}>
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center underline font-medium">
            Retry
          </button>
        </div>
      )}

      {actionSuccess ? <div className={adminAlertSuccess}>{actionSuccess}</div> : null}

      {showForm ? (
        <form onSubmit={(e) => void handleSave(e)} className={`${adminSectionCard} space-y-4`}>
          <h2 className="text-[15px] font-semibold text-foreground">
            {editingId === null ? 'New coupon' : 'Edit coupon'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-code" className={adminLabelClass}>
                Code
              </label>
              <input
                id="coupon-code"
                required
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className={adminInputClass}
                placeholder="FAIZ50"
              />
            </div>
            <div>
              <label htmlFor="coupon-type" className={adminLabelClass}>
                Discount type
              </label>
              <select
                id="coupon-type"
                value={form.discountType}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    discountType: e.target.value as CouponDiscountType,
                  }))
                }
                className={adminInputClass}
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed IDR off</option>
              </select>
            </div>
            <div>
              <label htmlFor="coupon-value" className={adminLabelClass}>
                {form.discountType === 'percent' ? 'Percent off (1–100)' : 'IDR off'}
              </label>
              <input
                id="coupon-value"
                type="number"
                required
                min={1}
                max={form.discountType === 'percent' ? 100 : undefined}
                value={form.discountValue}
                onChange={(e) => setForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                className={adminInputClass}
              />
            </div>
            <div>
              <label htmlFor="coupon-expires" className={adminLabelClass}>
                Expires (optional)
              </label>
              <input
                id="coupon-expires"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className={adminInputClass}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-[14px] text-foreground">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              className="size-4 rounded border-border"
            />
            Active
          </label>

          {formError ? <div className={adminAlertError}>{formError}</div> : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className={adminBtnPrimarySm}>
              {saving ? 'Saving…' : editingId === null ? 'Create coupon' : 'Save changes'}
            </button>
            <button type="button" onClick={cancelForm} disabled={saving} className={adminBtnSecondarySm}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {!loading && !error && items.length === 0 && (
        <p className="text-[15px] text-muted">No coupons yet. Create one to offer a discount at checkout.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={adminTableContainer}>
          <table className="w-full text-left text-[14px]">
            <thead className={adminTableHead}>
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <m.tbody className={`divide-y ${adminTableDivide}`} initial="hidden" animate="show" variants={staggerContainer}>
              {items.map((coupon) => (
                <m.tr key={coupon.id} className={adminTableRow} variants={staggerItemOpacity}>
                  <td className="px-4 py-3 font-mono text-foreground">{coupon.code}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{formatDiscount(coupon)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                        coupon.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-surface-nested text-muted'
                      }`}
                    >
                      {coupon.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted whitespace-nowrap">
                    {formatExpiry(coupon.expiresAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(coupon)}
                        className={adminBtnSecondarySm}
                      >
                        <PencilSimple size={16} weight="bold" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(coupon)}
                        className={adminBtnDestructive}
                      >
                        <Trash size={16} weight="bold" aria-hidden />
                        Delete
                      </button>
                    </div>
                  </td>
                </m.tr>
              ))}
            </m.tbody>
          </table>
        </div>
      )}

      {pendingDelete ? (
        <ConfirmDialog
          open
          title="Delete coupon?"
          description={
            <>
              Remove <strong>{pendingDelete.code}</strong>? Buyers will no longer be able to use it.
            </>
          }
          confirmLabel="Delete"
          variant="danger"
          busy={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
