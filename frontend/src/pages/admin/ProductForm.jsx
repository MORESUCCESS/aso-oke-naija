import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../utils/api';
import { PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function AdminProductForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const isEdit   = !!id;

  const [form, setForm] = useState({
    name: '', categoryId: '', description: '', fabric: '', technique: '',
    origin: 'Iseyin, Oyo State', price: '', comparePrice: '', costPrice: '',
    sku: '', stock: '0', yards: '', badge: '', isFeatured: false,
    isBestseller: false, isActive: true, metaTitle: '', metaDesc: '', sortOrder: '0',
  });
  const [variants, setVariants] = useState([]);
  const [images,   setImages]   = useState([]);
  const [files,    setFiles]    = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [newVar,   setNewVar]   = useState({ name: '', type: 'color', value: '', stock: '0', price: '' });

  const { data: catsData } = useQuery({ queryKey: ['categories-admin'], queryFn: () => api.get('/categories/admin/all').then(r => r.data.data) });
  const { data: prodData, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn:  () => api.get(`/products/${id}`).then(r => r.data.data.product),
    enabled:  isEdit,
  });

  useEffect(() => {
    if (prodData) {
      const p = prodData;
      setForm({
        name: p.name || '', categoryId: p.categoryId || '', description: p.description || '',
        fabric: p.fabric || '', technique: p.technique || '', origin: p.origin || 'Iseyin, Oyo State',
        price: p.price || '', comparePrice: p.comparePrice || '', costPrice: p.costPrice || '',
        sku: p.sku || '', stock: p.stock || '0', yards: p.yards || '', badge: p.badge || '',
        isFeatured: p.isFeatured || false, isBestseller: p.isBestseller || false,
        isActive: p.isActive ?? true, metaTitle: p.metaTitle || '', metaDesc: p.metaDesc || '',
        sortOrder: p.sortOrder || '0',
      });
      setVariants(p.variants || []);
      setImages(p.images || []);
    }
  }, [prodData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId || !form.description) {
      toast.error('Name, category, description and price are required.'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (variants.length) fd.append('variants', JSON.stringify(variants));
      files.forEach(f => fd.append('images', f));

      if (isEdit) {
        await api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created!');
      }
      qc.invalidateQueries(['admin-products']);
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const addVariant = () => {
    if (!newVar.name || !newVar.value) { toast.error('Variant name and value are required.'); return; }
    setVariants(v => [...v, { ...newVar, id: Date.now().toString() }]);
    setNewVar({ name: '', type: 'color', value: '', stock: '0', price: '' });
  };

  const deleteImage = async (imgId) => {
    try { await api.delete(`/products/images/${imgId}`); setImages(i => i.filter(x => x.id !== imgId)); toast.success('Image removed.'); }
    catch { toast.error('Could not remove image.'); }
  };

  const setPrimary = async (imgId) => {
    try { await api.put(`/products/images/${imgId}/primary`); setImages(imgs => imgs.map(i => ({ ...i, isPrimary: i.id === imgId }))); toast.success('Primary image set.'); }
    catch { toast.error('Could not set primary image.'); }
  };

  const F = ({ label, name, type = 'text', required, half, textarea, hint }) => (
    <div className={half ? '' : 'md:col-span-2'}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {textarea
        ? <textarea name={name} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} rows={4} required={required} className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] resize-none font-sans" />
        : <input type={type} name={name} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} required={required} className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
      }
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  if (isEdit && isLoading) return <PageSpinner />;
  const cats = catsData?.categories || [];

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          {isEdit && prodData && <p className="text-gray-400 text-sm mt-1">Editing: {prodData.name}</p>}
        </div>
        <Link to="/admin/products" className="text-sm text-gray-500 hover:text-gray-800 transition-colors font-sans">← Back to Products</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">

            {/* Basic Info */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <F label="Product Name" name="name" required />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Category<span className="text-red-500 ml-0.5">*</span></label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans bg-white">
                    <option value="">Select category...</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">Description<span className="text-red-500 ml-0.5">*</span></label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} required className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] resize-none font-sans" />
                </div>
                <F label="Fabric Type" name="fabric" half hint="e.g. Etu, Sanyan, Alaari" />
                <F label="Weaving Technique" name="technique" half hint="e.g. Strip Loom, Hand-woven" />
                <F label="Origin" name="origin" half />
                <F label="Fabric Length (Yards)" name="yards" half hint="e.g. 5 yards" />
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans">Pricing & Stock</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Selling Price (₦)<span className="text-red-500 ml-0.5">*</span></label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required placeholder="45000" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Compare Price (₦)</label>
                  <input type="number" value={form.comparePrice} onChange={e => setForm(f => ({ ...f, comparePrice: e.target.value }))} placeholder="55000" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cost Price (₦)</label>
                  <input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))} placeholder="20000" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock Quantity</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} min="0" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">SKU</label>
                  <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="AOR-001" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))} min="0" className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans">Product Images</h3>
              {/* Existing images */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {images.map(img => (
                    <div key={img.id} className="relative group">
                      <img src={img.url} alt="" className={`w-20 h-24 object-cover border-2 ${img.isPrimary ? 'border-[#C4A45A]' : 'border-gray-200'}`} />
                      {img.isPrimary && <span className="absolute top-1 left-1 bg-[#C4A45A] text-white text-[9px] px-1 font-sans">PRIMARY</span>}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        {!img.isPrimary && <button type="button" onClick={() => setPrimary(img.id)} className="text-white text-[10px] bg-[#C4A45A] px-2 py-0.5 font-sans">Set Primary</button>}
                        <button type="button" onClick={() => deleteImage(img.id)} className="text-white text-[10px] bg-red-600 px-2 py-0.5 font-sans">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-2 border-dashed border-gray-200 p-6 text-center">
                <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => setFiles(Array.from(e.target.files))} className="hidden" id="imgUpload" />
                <label htmlFor="imgUpload" className="cursor-pointer">
                  <p className="text-gray-400 text-sm mb-2">📷 Click to upload images</p>
                  <p className="text-gray-300 text-xs">JPG, PNG or WEBP — max 5MB each</p>
                  {files.length > 0 && <p className="text-[#C4A45A] text-xs mt-2 font-medium">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>}
                </label>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans">Colour Variants</h3>
              {variants.length > 0 && (
                <div className="space-y-2 mb-4">
                  {variants.map((v, i) => (
                    <div key={v.id || i} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100">
                      {v.type === 'color' && <div className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0" style={{ background: v.value }} />}
                      <span className="text-sm font-medium flex-1">{v.name}</span>
                      <span className="text-xs text-gray-400">{v.value}</span>
                      <span className="text-xs text-gray-400">Stock: {v.stock}</span>
                      {v.price && <span className="text-xs text-gray-400">₦{parseFloat(v.price).toLocaleString()}</span>}
                      <button type="button" onClick={() => setVariants(vv => vv.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-xs font-sans">✕</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-5 gap-2 items-end">
                <div><label className="block text-xs text-gray-500 mb-1">Name</label><input value={newVar.name} onChange={e => setNewVar(v => ({ ...v, name: e.target.value }))} placeholder="Gold" className="w-full px-2 py-2 border border-gray-200 text-sm outline-none font-sans" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select value={newVar.type} onChange={e => setNewVar(v => ({ ...v, type: e.target.value }))} className="w-full px-2 py-2 border border-gray-200 text-sm outline-none font-sans bg-white">
                    <option value="color">Color</option><option value="size">Size</option><option value="yards">Yards</option>
                  </select>
                </div>
                <div><label className="block text-xs text-gray-500 mb-1">Value</label><input value={newVar.value} onChange={e => setNewVar(v => ({ ...v, value: e.target.value }))} placeholder={newVar.type === 'color' ? '#C4A45A' : 'XL'} className="w-full px-2 py-2 border border-gray-200 text-sm outline-none font-sans" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Stock</label><input type="number" value={newVar.stock} onChange={e => setNewVar(v => ({ ...v, stock: e.target.value }))} min="0" className="w-full px-2 py-2 border border-gray-200 text-sm outline-none font-sans" /></div>
                <button type="button" onClick={addVariant} className="bg-[#1A0E00] text-white text-xs px-3 py-2 hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all font-sans h-[38px]">+ ADD</button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Status */}
            <div className="bg-white border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans">Status & Visibility</h3>
              <div className="space-y-3">
                {[['isActive','Active (visible in store)'],['isFeatured','Featured on homepage'],['isBestseller','Mark as bestseller']].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} className="accent-[#C4A45A] w-4 h-4" />
                    <span className="text-sm text-gray-600">{label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Badge Label</label>
                <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans bg-white">
                  <option value="">None</option>
                  {['New','Sale','Bestseller','Premium','Bridal','Limited','Package'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-white border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans">SEO (Optional)</h3>
              <div className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Meta Title</label><input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 text-sm outline-none font-sans" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Meta Description</label><textarea value={form.metaDesc} onChange={e => setForm(f => ({ ...f, metaDesc: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-200 text-sm outline-none resize-none font-sans" /></div>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={saving} className="w-full bg-[#1A0E00] text-white py-4 text-sm tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all duration-300 disabled:opacity-60">
              {saving ? '⏳ SAVING...' : (isEdit ? '💾 UPDATE PRODUCT' : '✦ CREATE PRODUCT')}
            </button>
            <Link to="/admin/products" className="block text-center text-sm text-gray-400 hover:text-gray-600 transition-colors font-sans">Cancel</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
