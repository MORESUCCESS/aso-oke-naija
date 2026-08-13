import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { formatNaira } from '../utils/api';
import { StatusBadge, PageSpinner, EmptyState, Pagination } from '../components/common';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn:  () => api.get(`/orders/my?page=${page}&limit=10`).then(r => r.data.data),
  });
  const orders = data?.orders || [];
  const pag    = data?.pagination || {};

  if (isLoading) return <PageSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-4xl mb-8">My <em>Orders</em></h1>
      {orders.length === 0 ? (
        <EmptyState icon="📦" title="No orders yet" message="Start shopping to see your orders here." action={() => window.location.href = '/shop'} actionLabel="SHOP NOW" />
      ) : (
        <>
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.id} to={`/account/orders/${order.orderRef}`} className="block bg-white border border-[#EDE0C0] p-5 hover:border-[#C4A45A] transition-all duration-200 group">
                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                  <div>
                    <p className="font-display text-sm tracking-widest text-[#C4A45A]">{order.orderRef}</p>
                    <p className="text-xs text-[#9B8B6E] mt-0.5">{new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#9B8B6E]">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                  <p className="font-display text-lg text-[#1A0E00]">{formatNaira(order.total)}</p>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={pag.page} pages={pag.pages} onPage={setPage} />
        </>
      )}
    </div>
  );
}
