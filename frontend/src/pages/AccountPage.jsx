import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/stores';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm]   = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.put('/auth/me', form);
      updateUser(data.data.user); toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Password change failed.'); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-serif text-4xl mb-8">My <em>Account</em></h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar links */}
        <div className="space-y-1">
          {[['My Account', '/account'], ['My Orders', '/account/orders'], ['Wishlist', '/account/wishlist']].map(([label, href]) => (
            <Link key={href} to={href} className="block px-4 py-3 text-sm border border-[#EDE0C0] hover:border-[#C4A45A] hover:text-[#C4A45A] transition-all duration-200">{label}</Link>
          ))}
        </div>
        {/* Forms */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleProfile} className="bg-white border border-[#EDE0C0] p-6">
            <h2 className="font-serif text-xl mb-5 pb-4 border-b border-[#EDE0C0]">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[['First Name','firstName'],['Last Name','lastName']].map(([l,n]) => (
                <div key={n}>
                  <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">{l.toUpperCase()}</label>
                  <input type="text" value={form[n]} onChange={e => setForm(f => ({ ...f, [n]: e.target.value }))} className="input-field" />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">EMAIL</label>
              <input type="email" value={user?.email} disabled className="input-field opacity-60 cursor-not-allowed" />
            </div>
            <div className="mb-5">
              <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">PHONE</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field" />
            </div>
            <button type="submit" disabled={saving} className="btn-dark text-xs px-8 py-3">{saving ? 'SAVING...' : 'SAVE CHANGES'}</button>
          </form>
          <form onSubmit={handlePassword} className="bg-white border border-[#EDE0C0] p-6">
            <h2 className="font-serif text-xl mb-5 pb-4 border-b border-[#EDE0C0]">Change Password</h2>
            <div className="space-y-4 mb-5">
              {[['Current Password','currentPassword'],['New Password','newPassword'],['Confirm New Password','confirmPassword']].map(([l,n]) => (
                <div key={n}>
                  <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">{l.toUpperCase()}</label>
                  <input type="password" value={pwForm[n]} onChange={e => setPwForm(f => ({ ...f, [n]: e.target.value }))} className="input-field" />
                </div>
              ))}
            </div>
            <button type="submit" className="btn-dark text-xs px-8 py-3">UPDATE PASSWORD</button>
          </form>
        </div>
      </div>
    </div>
  );
}
