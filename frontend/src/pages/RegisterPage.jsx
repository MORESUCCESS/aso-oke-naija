import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/stores';

export default function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { alert('Passwords do not match.'); return; }
    const res = await register(form);
    if (res.success) navigate('/account');
  };

  const F = ({ label, name, type = 'text' }) => (
    <div>
      <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">{label.toUpperCase()}</label>
      <input type={type} name={name} required value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} className="input-field" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#F5E6C8]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl mb-2">Create <em>Account</em></h1>
          <p className="text-[#9B8B6E] text-sm">Join the Àṣọ Òkè Royale family</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#EDE0C0] p-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <F label="First Name" name="firstName" />
            <F label="Last Name"  name="lastName" />
          </div>
          <F label="Email Address" name="email"    type="email" />
          <F label="Phone Number"  name="phone"    type="tel" />
          <F label="Password"      name="password" type="password" />
          <F label="Confirm Password" name="confirmPassword" type="password" />
          <button type="submit" disabled={isLoading} className="btn-dark w-full justify-center py-4 disabled:opacity-60">
            {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
          <p className="text-center text-sm text-[#9B8B6E]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C4A45A] hover:text-[#1A0E00] transition-colors font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
