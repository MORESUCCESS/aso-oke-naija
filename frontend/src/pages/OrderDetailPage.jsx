import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { formatNaira } from '../utils/api';
import { StatusBadge, PageSpinner } from '../components/common';

export default function OrderDetailPage() {
  const { ref } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['order', ref],
    queryFn:  () => api.get(`/orders/my/${ref}`).then(r => r.data.data.order),
  });

  if (isLoading) return <PageSpinner />;
  if (!data) return <div className="text-center py-20"><p className="font-serif text-2xl">Order not found.</p></div>;

  const o = data;
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/account/orders" className="text-sm text-[#9B8B6E] hover:text-[#C4A45A] transition-colors mb-6 inline-flex items-center gap-1">← Back to Orders</Link>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl">Order <em>{o.orderRef}</em></h1>
          <p className="text-[#9B8B6E] text-sm mt-1">{new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.paymentStatus} /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white border border-[#EDE0C0] p-5">
            <h2 className="font-serif text-lg mb-4 pb-3 border-b border-[#EDE0C0]">Items Ordered</h2>
            <div className="space-y-4">
              {o.items?.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.product?.images?.[0]?.url || '/placeholder.jpg'} alt="" className="w-16 h-20 object-cover bg-[#F5E6C8]" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-[#9B8B6E]">{item.variantName}</p>}
                    <p className="text-xs text-[#9B8B6E]">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-display text-sm">{formatNaira(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Status history */}
          {o.statusHistory?.length > 0 && (
            <div className="bg-white border border-[#EDE0C0] p-5">
              <h2 className="font-serif text-lg mb-4 pb-3 border-b border-[#EDE0C0]">Order Timeline</h2>
              <div className="space-y-3">
                {o.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#C4A45A] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{h.status}</p>
                      {h.note && <p className="text-xs text-[#9B8B6E]">{h.note}</p>}
                      <p className="text-xs text-[#9B8B6E]">{new Date(h.createdAt).toLocaleDateString('en-NG')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white border border-[#EDE0C0] p-5">
            <h2 className="font-serif text-lg mb-4 pb-3 border-b border-[#EDE0C0]">Summary</h2>
            <div className="space-y-2 text-sm">
              {[['Subtotal', formatNaira(o.subtotal)],['Shipping', o.shippingFee == 0 ? 'FREE' : formatNaira(o.shippingFee)],['Discount', o.discount > 0 ? `-${formatNaira(o.discount)}` : '₦0'],['Total', formatNaira(o.total)]].map(([l,v], i) => (
                <div key={l} className={`flex justify-between ${i === 3 ? 'font-bold text-base pt-2 border-t border-[#EDE0C0]' : 'text-[#9B8B6E]'}`}><span>{l}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
          {/* Delivery address */}
          <div className="bg-white border border-[#EDE0C0] p-5">
            <h2 className="font-serif text-lg mb-3 pb-3 border-b border-[#EDE0C0]">Delivery Address</h2>
            <div className="text-sm text-[#9B8B6E] space-y-1">
              <p className="text-[#1A0E00] font-medium">{o.shippingName}</p>
              <p>{o.shippingStreet}</p>
              <p>{o.shippingCity}, {o.shippingState}</p>
              <p>{o.shippingCountry}</p>
              <p>{o.shippingPhone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
