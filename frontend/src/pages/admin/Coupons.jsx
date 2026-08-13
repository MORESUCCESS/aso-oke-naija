import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatNaira } from '../../utils/api';
import { PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

const BLANK = { code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxUses: '', startsAt: '', expiresAt: '' };

export default function AdminCoupons() {
  const qc = useQueryClient();
  const [form, setForm]   = useState(BLANK);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn:  () => api.get('/coupons').then(r => r.data.data.coupons),
  });

  const save = useMutation({
    mutationFn: () => editing
      ? api.put(`/coupons/${editing.id}`, form)
      : api.post('/coupons', form),
    onSuccess: () => {
      qc.invalidateQueries(['admin-coupons']);
      toast.success(editing ? 'Coupon updated!' : 'Coupon created!');
      setForm(BLANK); setEditing(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed.'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/coupons/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['admin-coupons']); toast.success('Coupon deleted.'); },
    onError:    () => toast.error('Delete failed.'),
  });

  const toggle = useMutation({
    mutationFn: (c) => api.put(`/coupons/${c.id}`, { isActive: !c.isActive }),
    onSuccess:  () => qc.invalidateQueries(['admin-coupons']),
  });

  const startEdit = (c) => {
    setEditing(c);
    setForm({ code: c.code, description: c.description || '', type: c.type, value: c.value, minOrderAmount: c.minOrderAmount || '', maxUses: c.maxUses || '', startsAt: c.startsAt ? c.startsAt.slice(0,10) : '', expiresAt: c.expiresAt ? c.expiresAt.slice(0,10) : '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) return <PageSpinner />;
  const coupons = data || [];

  const F = ({ label, k, type='text', hint }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">{label}</label>
      <input type={type} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Coupons & Discounts</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* FORM */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-5 sticky top-6">
          <h3 className="font-serif text-xl mb-4 pb-3 border-b border-gray-100">
            {editing ? `Edit: ${editing.code}` : 'Create New Coupon'}
          </h3>
          <div className="space-y-3">
            <F label="Coupon Code *" k="code" hint="e.g. ROYALE10 (uppercase recommended)" />
            <F label="Description" k="description" />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">Discount Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans bg-white">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₦)</option>
              </select>
            </div>
            <F label={`Discount Value (${form.type === 'PERCENTAGE' ? '%' : '₦'}) *`} k="value" type="number" hint={form.type === 'PERCENTAGE' ? 'e.g. 10 for 10% off' : 'e.g. 5000 for ₦5,000 off'} />
            <F label="Min Order Amount (₦)" k="minOrderAmount" type="number" hint="Leave blank for no minimum" />
            <F label="Max Uses" k="maxUses" type="number" hint="Leave blank for unlimited" />
            <div className="grid grid-cols-2 gap-2">
              <F label="Start Date"  k="startsAt"  type="date" />
              <F label="Expiry Date" k="expiresAt" type="date" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => { if (!form.code || !form.value) { toast.error('Code and value are required.'); return; } save.mutate(); }} disabled={save.isPending} className="flex-1 bg-[#1A0E00] text-white py-3 text-xs tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all disabled:opacity-50">
              {save.isPending ? 'SAVING...' : (editing ? 'UPDATE' : 'CREATE COUPON')}
            </button>
            {editing && <button onClick={() => { setEditing(null); setForm(BLANK); }} className="px-4 border border-gray-300 text-xs text-gray-500 hover:border-gray-500 font-sans">CANCEL</button>}
          </div>
        </div>

        {/* LIST */}
        <div className="lg:col-span-3 space-y-3">
          <h3 className="font-serif text-lg">All Coupons ({coupons.length})</h3>
          {coupons.length === 0 ? (
            <div className="bg-white border border-gray-200 p-12 text-center text-gray-400 italic text-sm">No coupons yet.</div>
          ) : coupons.map(c => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <div key={c.id} className={`bg-white border p-4 ${!c.isActive || expired ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-[#C4A45A]'} transition-all`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm text-[#1A0E00] bg-[#F5E6C8] px-2 py-0.5">{c.code}</span>
                      <span className={`text-[10px] px-2 py-0.5 font-sans ${c.isActive && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {expired ? 'EXPIRED' : c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-gray-500 mb-1">{c.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span className="font-semibold text-[#C4A45A]">
                        {c.type === 'PERCENTAGE' ? `${c.value}% off` : `₦${parseFloat(c.value).toLocaleString()} off`}
                      </span>
                      {c.minOrderAmount && <span>Min: {formatNaira(c.minOrderAmount)}</span>}
                      <span>Used: {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''} times</span>
                      {c.expiresAt && <span>Expires: {new Date(c.expiresAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(c)} className="text-xs border border-[#C4A45A] text-[#C4A45A] px-3 py-1.5 hover:bg-[#C4A45A] hover:text-white transition-all font-sans">Edit</button>
                    <button onClick={() => toggle.mutate(c)} className={`text-xs border px-3 py-1.5 transition-all font-sans ${c.isActive ? 'border-gray-300 text-gray-500 hover:bg-gray-500 hover:text-white' : 'border-green-300 text-green-500 hover:bg-green-500 hover:text-white'}`}>
                      {c.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => { if (window.confirm(`Delete coupon "${c.code}"?`)) del.mutate(c.id); }} className="text-xs border border-red-300 text-red-400 px-3 py-1.5 hover:bg-red-500 hover:text-white transition-all font-sans">Del</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
