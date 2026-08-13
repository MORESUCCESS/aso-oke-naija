import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatNaira } from '../../utils/api';
import { PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn:  () => api.get(`/products?page=${page}&limit=20${search ? `&search=${search}` : ''}&isActive=all`).then(r => r.data.data),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['admin-products']); toast.success('Product deleted.'); },
    onError:    () => toast.error('Delete failed.'),
  });

  if (isLoading) return <PageSpinner />;
  const products = data?.products || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">Products <span className="text-gray-400 text-xl">({data?.pagination?.total || 0})</span></h1>
        <Link to="/admin/products/new" className="btn-dark text-xs px-6 py-3">+ ADD PRODUCT</Link>
      </div>
      <div className="mb-5">
        <input type="text" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input-field max-w-sm" />
      </div>
      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-gray-50 border-b border-gray-200">
            {['Image','Name','Category','Price','Stock','Status','Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-[10px] tracking-widest text-gray-500 font-display">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 italic text-sm">No products found.</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                <td className="px-4 py-3"><img src={p.primaryImage || p.images?.[0]?.url || '/placeholder.jpg'} alt="" className="w-12 h-14 object-cover bg-[#F5E6C8]" /></td>
                <td className="px-4 py-3"><p className="text-sm font-medium max-w-[180px] truncate">{p.name}</p>{p.badge && <span className="text-[10px] bg-[#1A0E00] text-white px-2 py-0.5">{p.badge}</span>}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.category?.name}</td>
                <td className="px-4 py-3 font-display text-sm">{formatNaira(p.price)}{p.comparePrice && <span className="line-through text-gray-400 text-xs ml-1">{formatNaira(p.comparePrice)}</span>}</td>
                <td className="px-4 py-3"><span className={`text-xs font-bold ${p.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{p.stock}</span></td>
                <td className="px-4 py-3"><span className={`text-[10px] px-2 py-1 ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.isActive ? 'ACTIVE' : 'HIDDEN'}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link to={`/admin/products/${p.id}/edit`} className="text-xs border border-[#C4A45A] text-[#C4A45A] px-3 py-1.5 hover:bg-[#C4A45A] hover:text-white transition-all font-sans">Edit</Link>
                    <button onClick={() => { if (window.confirm('Delete this product?')) del.mutate(p.id); }} className="text-xs border border-red-300 text-red-500 px-3 py-1.5 hover:bg-red-500 hover:text-white transition-all font-sans">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
