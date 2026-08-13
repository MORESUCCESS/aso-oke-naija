import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../context/stores';

export default function LoginPage() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const { login, isLoading } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/account';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form.email, form.password);
    if (res.success) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#F5E6C8]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl mb-2">Welcome <em>Back</em></h1>
          <p className="text-[#9B8B6E] text-sm">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border border-[#EDE0C0] p-8 space-y-5">
          <div>
            <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">EMAIL ADDRESS</label>
            <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" placeholder="your@email.com" />
          </div>
          <div>
            <label className="font-display text-[10px] tracking-[0.2em] text-[#9B8B6E] block mb-1.5">PASSWORD</label>
            <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={isLoading} className="btn-dark w-full justify-center py-4 disabled:opacity-60">
            {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
          <p className="text-center text-sm text-[#9B8B6E]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#C4A45A] hover:text-[#1A0E00] transition-colors font-medium">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
