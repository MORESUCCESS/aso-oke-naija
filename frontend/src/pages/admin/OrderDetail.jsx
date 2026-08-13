import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api, { formatNaira } from '../../utils/api';
import { PageSpinner, StatusBadge } from '../../components/common';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'];

export default function AdminOrderDetail() {
  const { id }  = useParams();
  const qc      = useQueryClient();
  const [note,  setNote]          = useState('');
  const [tracking, setTracking]   = useState('');
  const [newStatus, setNewStatus] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn:  () => api.get(`/orders/admin/all?search=${id}`).then(r => {
      // Fallback: get by id from all orders list
      return api.get(`/orders/my/${id}`).then(res => res.data.data.order);
    }),
  });

  // Better: fetch via admin endpoint
  const { data: ord, isLoading: loading2 } = useQuery({
    queryKey: ['admin-order-detail', id],
    queryFn:  async () => {
      // We search orders and find by id
      const res = await api.get(`/orders/admin/all?limit=200`);
      const list = res.data.data.orders;
      return list.find(o => o.id === id) || null;
    },
  });

  const updateStatus = useMutation({
    mutationFn: () => api.put(`/orders/admin/${id}/status`, { status: newStatus, note, trackingNumber: tracking }),
    onSuccess:  () => {
      qc.invalidateQueries(['admin-order-detail', id]);
      toast.success('Order status updated!');
      setNote(''); setTracking('');
    },
    onError: () => toast.error('Failed to update status.'),
  });

  if (loading2) return <PageSpinner />;
  const o = ord;
  if (!o) return (
    <div className="text-center py-20">
      <p className="font-serif text-2xl text-gray-500">Order not found.</p>
      <Link to="/admin/orders" className="btn-dark text-xs mt-4 inline-block">← Back to Orders</Link>
    </div>
  );

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl">Order <span className="text-[#C4A45A]">{o.orderRef}</span></h1>
          <p className="text-gray-400 text-sm mt-1">{new Date(o.createdAt).toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
        </div>
        <Link to="/admin/orders" className="text-sm text-gray-500 hover:text-gray-800 font-sans">← Back to Orders</Link>
      </div>

      {/* Status badges */}
      <div className="flex gap-3 mb-6">
        <StatusBadge status={o.status} />
        <StatusBadge status={o.paymentStatus} />
        {o.paymentMethod && <span className="inline-block px-2.5 py-1 text-[10px] tracking-widest bg-blue-50 text-blue-600 font-sans uppercase">{o.paymentMethod}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + History */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order Items */}
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="font-serif text-lg mb-4 pb-3 border-b border-gray-100">Items Ordered</h3>
            <div className="space-y-4">
              {o.items?.map(item => (
                <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="w-16 h-20 bg-[#F5E6C8] flex-shrink-0 overflow-hidden">
                    {item.product?.images?.[0]?.url
                      ? <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl text-[#EDE0C0]">✦</div>
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-gray-400 mt-0.5">{item.variantName}</p>}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                      <span className="text-xs text-gray-400">Unit: {formatNaira(item.price)}</span>
                    </div>
                  </div>
                  <p className="font-display text-sm text-[#1A0E00]">{formatNaira(item.subtotal)}</p>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              {[
                ['Subtotal',    formatNaira(o.subtotal)],
                ['Shipping',    parseFloat(o.shippingFee) === 0 ? 'FREE' : formatNaira(o.shippingFee)],
                ['Discount',    parseFloat(o.discount) > 0 ? `-${formatNaira(o.discount)}` : '₦0'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm text-gray-500"><span>{l}</span><span>{v}</span></div>
              ))}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200">
                <span className="font-serif">Total</span>
                <span className="font-display text-[#C4A45A]">{formatNaira(o.total)}</span>
              </div>
            </div>
          </div>

          {/* Update Status */}
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="font-serif text-lg mb-4 pb-3 border-b border-gray-100">Update Order Status</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-sans font-semibold">New Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans bg-white">
                  <option value="">Select status...</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-sans font-semibold">Tracking Number</label>
                <input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="Optional tracking #" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1.5 font-sans font-semibold">Internal Note</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note for this status update..." className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
              </div>
            </div>
            <button
              onClick={() => { if (!newStatus) { toast.error('Please select a status.'); return; } updateStatus.mutate(); }}
              disabled={updateStatus.isPending || !newStatus}
              className="bg-[#1A0E00] text-white px-6 py-2.5 text-xs tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all disabled:opacity-50"
            >
              {updateStatus.isPending ? 'UPDATING...' : 'UPDATE STATUS'}
            </button>
          </div>
        </div>

        {/* Right: Customer + Address + Payment */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="font-serif text-lg mb-4 pb-3 border-b border-gray-100">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-[#1A0E00]">{o.shippingName}</p>
              <a href={`mailto:${o.shippingEmail}`} className="block text-[#C4A45A] hover:text-[#1A0E00] transition-colors">{o.shippingEmail}</a>
              <a href={`tel:${o.shippingPhone}`} className="block text-gray-500 hover:text-[#1A0E00] transition-colors">{o.shippingPhone}</a>
              <a
                href={`https://wa.me/${o.shippingPhone?.replace(/[^0-9]/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-sans mt-1"
              >💬 WhatsApp</a>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="font-serif text-lg mb-4 pb-3 border-b border-gray-100">Delivery Address</h3>
            <div className="text-sm text-gray-500 space-y-1 leading-relaxed">
              <p>{o.shippingStreet}</p>
              <p>{o.shippingCity}, {o.shippingState}</p>
              <p>{o.shippingCountry}</p>
              {o.shippingNotes && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-1">CUSTOMER NOTE</p>
                  <p className="text-xs text-amber-600">{o.shippingNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-gray-200 p-5">
            <h3 className="font-serif text-lg mb-4 pb-3 border-b border-gray-100">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Method</span><span className="capitalize font-medium">{o.paymentMethod || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Status</span><StatusBadge status={o.paymentStatus} /></div>
              {o.paymentRef && <div className="flex justify-between"><span className="text-gray-400">Reference</span><span className="font-mono text-xs">{o.paymentRef}</span></div>}
              {o.paidAt && <div className="flex justify-between"><span className="text-gray-400">Paid at</span><span className="text-xs">{new Date(o.paidAt).toLocaleDateString()}</span></div>}
              {o.couponCode && (
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-400">Coupon</span>
                  <span className="font-mono text-xs bg-green-50 text-green-700 px-2 py-0.5">{o.couponCode}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
