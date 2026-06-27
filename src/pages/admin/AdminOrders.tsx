import { useEffect, useState } from 'react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { fetchOrders } from '../../lib/orders-admin-api';
import {
  adminTableContainer,
  adminTableDivide,
  adminTableHead,
  adminTableRow,
} from '../../lib/admin-styles';
import type { Order, OrderStatus } from '../../types/order';

function formatDate(ms?: number): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString();
  } catch {
    return String(ms);
  }
}

function formatAmount(o: Order): string {
  const prefix = o.currency === 'IDR' ? 'Rp' : `${o.currency} `;
  return `${prefix}${o.amount.toLocaleString('id-ID')}`;
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  refunded: 'bg-surface-nested text-muted',
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function AdminOrders() {
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchOrders());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Faiz UI checkout orders. Newest first. Paid orders are fulfilled by email automatically."
      />

      {loading && <p className="text-[15px] text-muted animate-pulse">Loading orders…</p>}

      {!loading && error && (
        <div className="alert alert-warning space-y-2">
          <p>{error}</p>
          <button type="button" onClick={() => void load()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-[15px] text-muted">No orders yet.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className={adminTableContainer}>
          <table className="w-full text-left text-[14px]">
            <thead className={adminTableHead}>
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Fulfilled</th>
                <th className="px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${adminTableDivide}`}>
              {items.map((o) => (
                <tr key={o.id} className={adminTableRow}>
                  <td className="px-4 py-3">
                    <span className="text-foreground">{o.name || '—'}</span>
                    <span className="block font-mono text-[13px] text-muted">{o.email}</span>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{formatAmount(o)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {o.emailSentAt ? formatDate(o.emailSentAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatDate(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
