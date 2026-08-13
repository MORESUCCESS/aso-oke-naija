import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

const BLANK = { name: '', description: '', color: '#1a0e00', sortOrder: '0', isActive: true };

export default function AdminCategories() {
  const qc              = useQueryClient();
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn:  () => api.get('/categories/admin/all').then(r => r.data.data.categories),
  });

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('image', file);
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } };
      return editing
        ? api.put(`/categories/${editing.id}`, fd, opts)
        : api.post('/categories', fd, opts);
    },
    onSuccess: () => {
      qc.invalidateQueries(['admin-categories']);
      toast.success(editing ? 'Category updated!' : 'Category created!');
      setForm(BLANK); setEditing(null); setFile(null); setPreview(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed.'),
  });

  const del = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess:  () => { qc.invalidateQueries(['admin-categories']); toast.success('Category deleted.'); },
    onError:    (err) => toast.error(err.response?.data?.message || 'Cannot delete — may have products.'),
  });

  const startEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '', color: cat.color || '#1a0e00', sortOrder: cat.sortOrder || '0', isActive: cat.isActive });
    setFile(null); setPreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  if (isLoading) return <PageSpinner />;
  const cats = data || [];

  return (
    <div>
      <h1 className="font-serif text-3xl mb-6">Categories</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* FORM */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-5 sticky top-6">
          <h3 className="font-serif text-xl mb-4 pb-3 border-b border-gray-100">
            {editing ? `Edit: ${editing.name}` : 'Add New Category'}
          </h3>

          {/* Image preview */}
          {(preview || (editing?.image)) && (
            <div className="mb-4">
              <img src={preview || editing?.image} alt="" className="w-full h-36 object-cover border border-gray-200" />
              {preview && <p className="text-xs text-[#C4A45A] mt-1 font-sans">New image selected</p>}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">NAME *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Gele" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">DESCRIPTION</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description..." className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">CATEGORY IMAGE</label>
              <input type="file" accept="image/*" onChange={handleFile} className="text-xs font-sans text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:border-0 file:bg-[#1A0E00] file:text-white file:text-xs file:cursor-pointer" />
              <p className="text-xs text-gray-400 mt-1">Best size: 600×800px (portrait)</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">FALLBACK COLOR</label>
                <div className="flex gap-2">
                  <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 border border-gray-200 cursor-pointer p-0.5" />
                  <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="flex-1 px-2 py-2 border border-gray-200 text-xs outline-none font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">SORT ORDER</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} min="0" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-[#C4A45A] w-4 h-4" />
              <span className="text-sm text-gray-600">Active (visible on website)</span>
            </label>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => save.mutate()} disabled={save.isPending || !form.name} className="flex-1 bg-[#1A0E00] text-white py-3 text-xs tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all disabled:opacity-50">
              {save.isPending ? 'SAVING...' : (editing ? 'UPDATE' : 'ADD CATEGORY')}
            </button>
            {editing && (
              <button onClick={() => { setEditing(null); setForm(BLANK); setFile(null); setPreview(null); }} className="px-4 py-3 border border-gray-300 text-xs text-gray-500 hover:border-gray-500 transition-colors font-sans">
                CANCEL
              </button>
            )}
          </div>
        </div>

        {/* LIST */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-serif text-lg">All Categories ({cats.length})</h3>
            </div>
            {cats.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm italic">No categories yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {cats.map(cat => (
                  <div key={cat.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    {/* Image / color */}
                    <div className="w-12 h-16 flex-shrink-0 overflow-hidden border border-gray-100">
                      {cat.image
                        ? <img src={cat.image} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xl text-white" style={{ background: cat.color }}>✦</div>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{cat.name}</p>
                      {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 font-sans ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {cat.isActive ? 'ACTIVE' : 'HIDDEN'}
                        </span>
                        {cat._count && <span className="text-[10px] text-gray-400">{cat._count.products} products</span>}
                        <span className="text-[10px] text-gray-400">Order: {cat.sortOrder}</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(cat)} className="text-xs border border-[#C4A45A] text-[#C4A45A] px-3 py-1.5 hover:bg-[#C4A45A] hover:text-white transition-all font-sans">Edit</button>
                      {cat._count?.products === 0 && (
                        <button onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) del.mutate(cat.id); }} className="text-xs border border-red-300 text-red-400 px-3 py-1.5 hover:bg-red-500 hover:text-white transition-all font-sans">Del</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 font-sans">💡 Tip: Upload category images here — they appear as card backgrounds on the homepage and shop page.</p>
        </div>
      </div>
    </div>
  );
}
