import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { formatNaira } from '../../utils/api';
import { PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

const BLANK = { name: '', states: '', rate: '', freeAbove: '', isActive: true };

export default function AdminShipping() {
  const qc = useQueryClient();
  const [form, setForm]     = useState(BLANK);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shipping'],
    queryFn:  () => api.get('/shipping').then(r => r.data.data.zones),
  });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name:      form.name,
        states:    form.states.split(',').map(s => s.trim()).filter(Boolean),
        rate:      parseFloat(form.rate),
        freeAbove: form.freeAbove ? parseFloat(form.freeAbove) : null,
        isActive:  form.isActive,
      };
      return editing
        ? api.put(`/shipping/${editing.id}`, payload)
        : api.post('/shipping', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries(['admin-shipping']);
      toast.success(editing ? 'Zone updated!' : 'Zone created!');
      setForm(BLANK); setEditing(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed.'),
  });

  const startEdit = (z) => {
    setEditing(z);
    setForm({ name: z.name, states: z.states.join(', '), rate: z.rate, freeAbove: z.freeAbove || '', isActive: z.isActive });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) return <PageSpinner />;
  const zones = data || [];

  return (
    <div>
      <h1 className="font-serif text-3xl mb-2">Shipping Zones</h1>
      <p className="text-gray-500 text-sm mb-6">Configure delivery fees by Nigerian state and international destinations.</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* FORM */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-5 sticky top-6">
          <h3 className="font-serif text-xl mb-4 pb-3 border-b border-gray-100">
            {editing ? `Edit: ${editing.name}` : 'Add Shipping Zone'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">Zone Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lagos" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">States / Regions *</label>
              <input value={form.states} onChange={e => setForm(f => ({ ...f, states: e.target.value }))} placeholder="Lagos, Ogun, Oyo" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
              <p className="text-xs text-gray-400 mt-0.5">Comma-separated list of states this zone covers</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">Delivery Fee (₦) *</label>
              <input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="3500" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 tracking-wide">Free Delivery Above (₦)</label>
              <input type="number" value={form.freeAbove} onChange={e => setForm(f => ({ ...f, freeAbove: e.target.value }))} placeholder="80000 (leave blank to disable)" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
              <p className="text-xs text-gray-400 mt-0.5">Orders above this amount get free delivery in this zone</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-[#C4A45A] w-4 h-4" />
              <span className="text-sm text-gray-600">Zone is active</span>
            </label>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { if (!form.name || !form.rate || !form.states) { toast.error('Name, states and rate are required.'); return; } save.mutate(); }}
              disabled={save.isPending}
              className="flex-1 bg-[#1A0E00] text-white py-3 text-xs tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all disabled:opacity-50"
            >
              {save.isPending ? 'SAVING...' : (editing ? 'UPDATE ZONE' : 'ADD ZONE')}
            </button>
            {editing && <button onClick={() => { setEditing(null); setForm(BLANK); }} className="px-4 border border-gray-300 text-xs text-gray-500 hover:border-gray-500 font-sans">CANCEL</button>}
          </div>
        </div>

        {/* LIST */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-serif text-lg">All Zones ({zones.length})</h3>
            </div>
            {zones.length === 0 ? (
              <p className="text-center py-12 text-gray-400 italic text-sm">No shipping zones configured.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {zones.map(z => (
                  <div key={z.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-semibold text-sm">{z.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 font-sans ${z.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {z.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                          <span className="font-bold text-[#C4A45A]">₦{parseFloat(z.rate).toLocaleString()} delivery fee</span>
                          {z.freeAbove && <span className="text-green-600">Free above {formatNaira(z.freeAbove)}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {z.states?.slice(0, 6).map(s => (
                            <span key={s} className="text-[10px] bg-[#F5E6C8] text-[#7A6040] px-2 py-0.5 font-sans">{s}</span>
                          ))}
                          {z.states?.length > 6 && <span className="text-[10px] text-gray-400">+{z.states.length - 6} more</span>}
                        </div>
                      </div>
                      <button onClick={() => startEdit(z)} className="text-xs border border-[#C4A45A] text-[#C4A45A] px-3 py-1.5 hover:bg-[#C4A45A] hover:text-white transition-all font-sans flex-shrink-0">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
