import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { PageHero } from '../components/common';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm]   = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const { data: settings }    = useQuery({ queryKey: ['public-settings'], queryFn: () => api.get('/settings/public').then(r => r.data.data.settings) });

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('Message sent! We will reply within 24 hours.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch { toast.error('Failed to send message. Please try again.'); }
    finally { setLoading(false); }
  };

  const F = ({ label, name, type = 'text', required }) => (
    <div>
      <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">{label.toUpperCase()}{required && ' *'}</label>
      <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} required={required} className="input-field" />
    </div>
  );

  return (
    <div>
      <PageHero label="GET IN TOUCH" title="We'd Love to Hear From You" subtitle="Questions, custom orders, bulk purchases — our team is here to help." />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div>
            <h2 className="font-serif text-2xl mb-6">Contact Details</h2>
            <div className="space-y-5">
              {settings?.address && <div><p className="font-display text-[10px] tracking-widest text-[#C4A45A] mb-1">ADDRESS</p><p className="text-sm text-[#9B8B6E]">{settings.address}</p></div>}
              {settings?.phone   && <div><p className="font-display text-[10px] tracking-widest text-[#C4A45A] mb-1">PHONE</p><a href={`tel:${settings.phone}`} className="text-sm text-[#9B8B6E] hover:text-[#C4A45A]">{settings.phone}</a></div>}
              {settings?.email   && <div><p className="font-display text-[10px] tracking-widest text-[#C4A45A] mb-1">EMAIL</p><a href={`mailto:${settings.email}`} className="text-sm text-[#9B8B6E] hover:text-[#C4A45A]">{settings.email}</a></div>}
              {settings?.whatsapp && <div className="pt-4"><a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">💬 WHATSAPP US</a></div>}
            </div>
          </div>
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white border border-[#EDE0C0] p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <F label="Full Name" name="name" required />
                <F label="Email"     name="email" type="email" required />
              </div>
              <F label="Phone" name="phone" type="tel" />
              <div>
                <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">SUBJECT *</label>
                <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required className="select-field">
                  <option value="">Select a topic</option>
                  {['Product Enquiry','Custom Order','Bulk / Wholesale','Delivery','Return / Exchange','General Enquiry'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">MESSAGE *</label>
                <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required rows={5} className="input-field resize-none" placeholder="Tell us what you need..." />
              </div>
              <button type="submit" disabled={loading} className="btn-dark w-full justify-center py-4 disabled:opacity-60">
                {loading ? 'SENDING...' : 'SEND MESSAGE ✦'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
