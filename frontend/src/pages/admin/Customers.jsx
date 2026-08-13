import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatNaira } from '../../utils/api';
import { PageSpinner, Pagination, StatusBadge } from '../../components/common';
import toast from 'react-hot-toast';

export default function AdminCustomers() {
  const qc             = useQueryClient();
  const [page, setPage]   = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', page, search, role],
    queryFn:  () => {
      const p = new URLSearchParams({ page, limit: 20, ...(search && { search }), ...(role && { role }) });
      return api.get(`/users?${p}`).then(r => r.data.data);
    },
  });

  const toggle = useMutation({
    mutationFn: (id) => api.put(`/users/${id}/toggle`),
    onSuccess:  () => { qc.invalidateQueries(['admin-customers']); toast.success('User status updated.'); },
    onError:    () => toast.error('Action failed.'),
  });

  if (isLoading) return <PageSpinner />;
  const users = data?.users       || [];
  const pag   = data?.pagination  || {};

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">
        Customers <span className="text-gray-400 text-xl">({pag.total || 0})</span>
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text" placeholder="Search name or email..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input-field max-w-xs"
        />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="select-field w-40">
          <option value="">All Roles</option>
          <option value="CUSTOMER">Customers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Name','Email','Phone','Role','Orders','Joined','Status','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] tracking-widest text-gray-500 font-display whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400 italic text-sm">No customers found.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-amber-50/40 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#C4A45A] flex items-center justify-center text-white text-xs font-bold font-sans flex-shrink-0">
                      {u.firstName?.[0]}{u.lastName?.[0]}
                    </div>
                    <span className="text-sm font-medium">{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <a href={`mailto:${u.email}`} className="text-sm text-[#C4A45A] hover:text-[#1A0E00] transition-colors">{u.email}</a>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 font-sans ${u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' : u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center font-display">{u._count?.orders || 0}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 font-sans ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a href={`mailto:${u.email}`} className="text-xs border border-gray-300 text-gray-500 px-2 py-1.5 hover:border-[#C4A45A] hover:text-[#C4A45A] transition-all font-sans">Email</a>
                    {u.role === 'CUSTOMER' && (
                      <button
                        onClick={() => toggle.mutate(u.id)}
                        className={`text-xs border px-2 py-1.5 transition-all font-sans ${u.isActive ? 'border-red-300 text-red-400 hover:bg-red-500 hover:text-white' : 'border-green-300 text-green-500 hover:bg-green-500 hover:text-white'}`}
                      >
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pag.page} pages={pag.pages} onPage={setPage} />
    </div>
  );
}
