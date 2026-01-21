import React, { useEffect, useMemo, useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { useAppContext } from '../context/SupabaseContext';

interface ScanStatusModalProps {
  isOpen: boolean;
  orderId: string | null;
  onClose: () => void;
}

const getAllowedNextStatuses = (status: OrderStatus): OrderStatus[] => {
  switch (status) {
    case 'Accepted':
      return ['Shipped', 'Delivered'];
    case 'Shipped':
      return ['Delivered'];
    default:
      return [];
  }
};

const ScanStatusModal: React.FC<ScanStatusModalProps> = ({ isOpen, orderId, onClose }) => {
  const { orders, updateOrderStatus, updateOrderScannedUnits } = useAppContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const order: Order | undefined = useMemo(() => {
    if (!orderId) return undefined;
    return orders.find(o => o.id === orderId);
  }, [orders, orderId]);

  const [selected, setSelected] = useState<OrderStatus | ''>('');

  useEffect(() => {
    if (!isOpen || !order) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const uid = params.get('uid');
      if (uid) {
        const already = (order.scannedUnits || []).includes(uid);
        if (!already) {
          const newScanned = [ ...(order.scannedUnits || []), uid ];
          updateOrderScannedUnits(order.id, newScanned)
            .catch(() => {/* ignore, UI will reflect next fetch */});
        }
      }
    } catch (_) {
    }
  }, [isOpen, order, updateOrderScannedUnits]);

  useEffect(() => {
    if (order) {
      const opts = getAllowedNextStatuses(order.status);
      setSelected(opts[0] || '');
    }
  }, [order]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    if (!order || !selected) return;
    try {
      setSubmitting(true);
      setError(null);
      await updateOrderStatus(order.id, selected as OrderStatus);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Update Order Status</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          {!order ? (
            <div className="text-sm text-slate-600">Loading order... Ensure the order exists and you are signed in.</div>
          ) : (
            <>
              <div>
                <p className="text-xs text-slate-500">Order ID</p>
                <p className="text-sm font-medium text-slate-800 break-all">{order.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Current Status</p>
                <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{order.status}</span>
              </div>
              {typeof order.totalUnits === 'number' && order.totalUnits > 0 && (
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">Verification</span>: {order.scannedUnits?.length || 0}/{order.totalUnits} scanned. {Math.max((order.totalUnits || 0) - (order.scannedUnits?.length || 0), 0)} remaining.
                </div>
              )}
              {getAllowedNextStatuses(order.status).length > 0 ? (
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Set Status</label>
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value as OrderStatus)}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-primary focus:border-primary"
                    aria-label="Update status"
                    disabled={submitting || (order.totalUnits || 0) > 0 && (order.scannedUnits?.length || 0) < (order.totalUnits || 0)}
                  >
                    {getAllowedNextStatuses(order.status).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-sm text-slate-600">This order cannot be updated from its current state.</div>
              )}
              {error && <div className="text-sm text-red-600">{error}</div>}
            </>
          )}
        </div>
        <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700">Close</button>
          <button
            onClick={handleUpdate}
            disabled={!order || !selected || submitting || getAllowedNextStatuses(order?.status as OrderStatus).length === 0 || ((order?.totalUnits || 0) > 0 && (order?.scannedUnits?.length || 0) < (order?.totalUnits || 0))}
            className={`px-3 py-2 text-sm rounded-md text-white ${submitting ? 'bg-primary/60' : 'bg-primary hover:bg-primary/90'}`}
          >
            {submitting ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanStatusModal;
