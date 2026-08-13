import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { formatNaira } from '../../utils/api';
import { StatusBadge, PageSpinner, Pagination } from '../../components/common';

export default function AdminOrders() {
  const [page,   setPage]  = useState(1);
  const [status, setStatus]= useState('');
  const [search, setSearch]= useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, status, search],
    queryFn:  () => {
      const p = new URLSearchParams({ page, limit: 20, ...(status && { status }), ...(search && { search }) });
      return api.get(`/orders/admin/all?${p}`).then(r => r.data.data);
    },
  });
  if (isLoading) return <PageSpinner />;
  const orders = data?.orders || [];
  const pag    = data?.pagination || {};

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Orders <span className="text-gray-400 text-xl">({pag.total || 0})</span></h1>
      <div className="flex flex-wrap gap-3 mb-5">
        <input type="text" placeholder="Search by ref, name, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field max-w-xs" />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="select-field w-44">
          <option value="">All Statuses</option>
          {['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-gray-50 border-b">
            {['Ref','Customer','Total','Payment','Status','Date','Action'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] tracking-widest text-gray-500 font-display">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 italic text-sm">No orders found.</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="hover:bg-amber-50/40 transition-colors">
                <td className="px-4 py-3 font-display text-sm tracking-widest text-[#C4A45A]">{o.orderRef}</td>
                <td className="px-4 py-3"><p className="text-sm font-medium">{o.shippingName}</p><p className="text-xs text-gray-400">{o.shippingEmail}</p></td>
                <td className="px-4 py-3 font-display text-sm">{formatNaira(o.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="text-xs border border-[#C4A45A] text-[#C4A45A] px-3 py-1.5 hover:bg-[#C4A45A] hover:text-white transition-all font-sans">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pag.page} pages={pag.pages} onPage={setPage} />
    </div>
  );
}
