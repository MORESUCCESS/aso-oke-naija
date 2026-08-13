import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/stores';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';

const NAV = [
  { label: 'Dashboard',  href: '/admin',            icon: '📊' },
  { label: 'Products',   href: '/admin/products',   icon: '🛍' },
  { label: 'Categories', href: '/admin/categories', icon: '🗂' },
  { label: 'Orders',     href: '/admin/orders',     icon: '📦' },
  { label: 'Customers',  href: '/admin/customers',  icon: '👥' },
  { label: 'Coupons',    href: '/admin/coupons',    icon: '🎟' },
  { label: 'Shipping',   href: '/admin/shipping',   icon: '🚚' },
  { label: 'Messages',   href: '/admin/messages',   icon: '💬' },
  { label: 'Settings',   href: '/admin/settings',   icon: '⚙️' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout }              = useAuthStore();
  const navigate                      = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['admin-sidebar-stats'],
    queryFn:  () => api.get('/admin/dashboard').then(r => r.data.data),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = () => (
    <aside className="flex flex-col h-full bg-[#1A0E00] w-60 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/10">
        <Link to="/" className="block">
          <span className="font-serif text-[#FDFBF7] text-lg font-bold tracking-widest block">Àṣọ Òkè Royale</span>
          <span className="font-display text-[#C4A45A] text-[10px] tracking-[0.3em]">ADMIN PANEL</span>
        </Link>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="px-5 py-4 border-b border-white/10 grid grid-cols-2 gap-2">
          <div className="bg-white/5 rounded px-3 py-2 text-center">
            <div className="font-display text-[#C4A45A] text-xl">{stats.pendingOrders}</div>
            <div className="text-white/40 text-[10px] tracking-wide">PENDING</div>
          </div>
          <div className="bg-white/5 rounded px-3 py-2 text-center">
            <div className="font-display text-green-400 text-xl">{stats.totalOrders}</div>
            <div className="text-white/40 text-[10px] tracking-wide">ORDERS</div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV.map(({ label, href, icon }) => (
          <NavLink
            key={href}
            to={href}
            end={href === '/admin'}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            <span>{label}</span>
            {label === 'Messages' && stats?.pendingOrders > 0 && (
              <span className="ml-auto bg-[#C4A45A] text-[#1A0E00] text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-sans">
                {stats.pendingOrders}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#C4A45A] flex items-center justify-center text-[#1A0E00] font-bold text-sm font-sans">
            {user?.firstName?.[0]}
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-white/40 text-[10px] tracking-wide">{user?.role}</p>
          </div>
        </div>
        <Link to="/" className="nav-link text-xs py-2" target="_blank">
          <span>🌐</span> View Store
        </Link>
        <button onClick={handleLogout} className="nav-link text-xs py-2 w-full text-left text-red-400/70 hover:text-red-400">
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <>
        <div onClick={() => setSidebarOpen(false)} className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
        <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
      </>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-gray-900 mr-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div>
            <p className="text-xs text-gray-400 tracking-widest font-display">ADMIN PANEL</p>
          </div>
          <div className="flex items-center gap-4">
            {stats?.pendingOrders > 0 && (
              <Link to="/admin/orders" className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {stats.pendingOrders} pending order{stats.pendingOrders !== 1 ? 's' : ''}
              </Link>
            )}
            <span className="text-sm text-gray-500">{user?.firstName} {user?.lastName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
