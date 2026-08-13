import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api, { formatNaira } from '../../utils/api';
import { StatCard, StatusBadge, PageSpinner } from '../../components/common';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get('/admin/dashboard').then(r => r.data.data) });
  if (isLoading) return <PageSpinner />;
  const d = data || {};
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="font-serif text-3xl">Dashboard</h1><p className="text-gray-500 text-sm mt-1">Welcome back to Àṣọ Òkè Royale Admin</p></div>
        <Link to="/admin/products/new" className="btn-dark text-xs px-6 py-3">+ ADD PRODUCT</Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard label="TOTAL REVENUE" value={formatNaira(d.totalRevenue || 0)} icon="💰" color="gold" />
        <StatCard label="TOTAL ORDERS"  value={d.totalOrders  || 0} icon="📦" color="blue" />
        <StatCard label="PENDING ORDERS" value={d.pendingOrders || 0} icon="⏳" color="red" />
        <StatCard label="CUSTOMERS"     value={d.totalCustomers || 0} icon="👥" color="green" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-[#C4A45A] hover:text-[#1A0E00] transition-colors font-sans">View All →</Link>
          </div>
          <div className="space-y-3">
            {d.recentOrders?.length === 0 ? <p className="text-gray-400 text-sm italic">No orders yet.</p>
            : d.recentOrders?.map(o => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between py-2.5 border-b border-gray-100 hover:text-[#C4A45A] transition-colors">
                <div><p className="text-sm font-medium font-display tracking-widest">{o.orderRef}</p><p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-3"><StatusBadge status={o.status} /><span className="font-display text-sm">{formatNaira(o.total)}</span></div>
              </Link>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <h3 className="font-serif text-lg mb-4">Low Stock Alert</h3>
          {d.lowStock?.length === 0 ? <p className="text-gray-400 text-sm italic">All products have sufficient stock.</p>
          : d.lowStock?.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <p className="text-sm font-medium">{p.name}</p>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1">{p.stock} left</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
