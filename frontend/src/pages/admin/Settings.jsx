import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../utils/api';
import { PageSpinner } from '../../components/common';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [form, setForm] = useState({});
  const [pw, setPw]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn:  () => api.get('/settings').then(r => r.data.data.settings),
  });

  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: () => api.put('/settings', form),
    onSuccess:  () => toast.success('Settings saved!'),
    onError:    () => toast.error('Save failed.'),
  });

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) { toast.error('Passwords do not match.'); return; }
    if (pw.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    try {
      await api.put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed!');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed.'); }
  };

  const F = ({ label, k, type = 'text', hint, textarea }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">{label}</label>
      {textarea
        ? <textarea value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} rows={3} className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] resize-none font-sans" />
        : <input type={type} value={form[k] || ''} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
      }
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  if (isLoading) return <PageSpinner />;

  const sections = [
    { title: '🏪 Business Information', fields: [
      { label: 'Store Name', k: 'site_name' },
      { label: 'Tagline', k: 'tagline' },
      { label: 'Phone Number', k: 'phone' },
      { label: 'WhatsApp (digits only, e.g. 2348167435681)', k: 'whatsapp' },
      { label: 'Email Address', k: 'email', type: 'email' },
      { label: 'Physical Address', k: 'address' },
    ]},
    { title: '🏠 Homepage Content', fields: [
      { label: 'Hero Title', k: 'hero_title' },
      { label: 'Hero Subtitle', k: 'hero_subtitle', textarea: true },
      { label: 'About Text', k: 'about_text', textarea: true },
    ]},
    { title: '📱 Social Media', fields: [
      { label: 'Instagram URL', k: 'instagram', type: 'url' },
      { label: 'Facebook URL',  k: 'facebook',  type: 'url' },
      { label: 'Twitter URL',   k: 'twitter',   type: 'url' },
    ]},
    { title: '🚚 Delivery & Coupons', fields: [
      { label: 'Default Delivery Fee (₦)', k: 'delivery_fee', type: 'number' },
      { label: 'Free Delivery Above (₦)',  k: 'free_delivery_above', type: 'number', hint: 'Orders above this amount get free delivery' },
    ]},
    { title: '🎨 Theme Colors', fields: [
      { label: 'Primary Color (Gold)', k: 'primary_color', type: 'color' },
      { label: 'Accent Color',         k: 'accent_color',  type: 'color' },
    ]},
    { title: '💳 Payment Keys (Public)', fields: [
      { label: 'Paystack Public Key',    k: 'paystack_public_key',    hint: 'pk_live_... or pk_test_...' },
      { label: 'Flutterwave Public Key', k: 'flutterwave_public_key', hint: 'FLWPUBK_...' },
    ]},
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl">Site Settings</h1>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#1A0E00] text-white px-8 py-3 text-xs tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all disabled:opacity-60">
          {save.isPending ? 'SAVING...' : '💾 SAVE ALL SETTINGS'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {sections.map(sec => (
          <div key={sec.title} className="bg-white border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans text-sm">{sec.title}</h3>
            <div className="space-y-3">
              {sec.fields.map(field => <F key={field.k} {...field} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-200 p-5 max-w-md">
        <h3 className="font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100 font-sans text-sm">🔐 Change Admin Password</h3>
        <form onSubmit={changePw} className="space-y-3">
          {[['Current Password','currentPassword'],['New Password','newPassword'],['Confirm New Password','confirmPassword']].map(([label, name]) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide">{label.toUpperCase()}</label>
              <input type="password" value={pw[name]} onChange={e => setPw(p => ({ ...p, [name]: e.target.value }))} required className="w-full px-3 py-2.5 border border-gray-200 text-sm outline-none focus:border-[#C4A45A] font-sans" />
            </div>
          ))}
          <button type="submit" className="bg-[#1A0E00] text-white px-6 py-2.5 text-xs tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all mt-2">UPDATE PASSWORD</button>
        </form>
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#1A0E00] text-white px-10 py-4 text-sm tracking-widest font-display hover:bg-[#C4A45A] hover:text-[#1A0E00] transition-all disabled:opacity-60">
          {save.isPending ? 'SAVING...' : '💾 SAVE ALL SETTINGS'}
        </button>
      </div>
    </div>
  );
}
