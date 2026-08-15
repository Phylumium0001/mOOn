import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAdminStats, getAdminUsers, getAdminShops, verifyShop, deleteUser } from '../api';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'shops', label: 'Shops', icon: '🏪' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'orders', label: 'Orders', icon: '📦' },
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('overview');
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/login'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, shopsRes, usersRes] = await Promise.all([
        getAdminStats(),
        getAdminShops(),
        getAdminUsers()
      ]);
      setStats(statsRes.data.stats);
      setShops(shopsRes.data.shops);
      setUsers(usersRes.data.users);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyShop = async (shopId, isVerified) => {
    try {
      await verifyShop(shopId, isVerified);
      setShops(prev => prev.map(s => s._id === shopId ? { ...s, isVerified } : s));
      toast.success(isVerified ? 'Shop verified!' : 'Shop unverified.');
    } catch { toast.error('Failed to update shop.'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      toast.success('User deleted.');
    } catch { toast.error('Failed to delete user.'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    </div>
  );

  const pendingShops = shops.filter(s => !s.isVerified);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2E8B57] rounded-full flex items-center justify-center">
            <div className="w-5 h-5 bg-white rounded-sm" />
          </div>
          <div>
            <p className="font-bold">mOOn Admin</p>
            <p className="text-xs text-gray-500">Management Portal</p>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {NAV.map(item => (
            <button key={item.key} onClick={() => setActive(item.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                active === item.key
                  ? 'bg-green-50 text-[#2E8B57] border-r-4 border-[#2E8B57]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <span>{item.icon}</span>
              {item.label}
              {item.key === 'shops' && pendingShops.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingShops.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Admin</span>
          <button onClick={() => { logout(); navigate('/'); }} className="block text-xs text-red-500 hover:text-red-700 mt-2">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{NAV.find(n => n.key === active)?.label}</h1>
          <button onClick={() => navigate('/shop')} className="text-sm text-[#2E8B57] hover:underline">
            ← View Store
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Overview */}
          {active === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Students', value: stats.totalUsers, icon: '🎓', color: 'text-blue-600' },
                  { label: 'Vendors', value: stats.totalVendors, icon: '🏪', color: 'text-purple-600' },
                  { label: 'Shops', value: stats.totalShops, icon: '🏬', color: 'text-indigo-600' },
                  { label: 'Products', value: stats.totalProducts, icon: '📦', color: 'text-orange-600' },
                  { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'text-teal-600' },
                  { label: 'Revenue (GHS)', value: `₵${(stats.totalRevenue || 0).toFixed(2)}`, icon: '💰', color: 'text-green-600' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border">
                    <p className="text-2xl mb-1">{stat.icon}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Campus breakdown */}
              {stats.ordersByCampus?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h3 className="font-semibold mb-4">Orders by Campus</h3>
                  <div className="space-y-3">
                    {stats.ordersByCampus.map(c => (
                      <div key={c._id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{c._id || 'Unknown'}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div className="bg-[#2E8B57] h-2 rounded-full"
                              style={{ width: `${Math.min(100, (c.count / stats.totalOrders) * 100)}%` }} />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{c.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending shops */}
              {pendingShops.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                  <h3 className="font-semibold mb-3 text-yellow-800">⏳ Shops Pending Verification ({pendingShops.length})</h3>
                  <div className="space-y-2">
                    {pendingShops.map(shop => (
                      <div key={shop.id} className="bg-white rounded-lg p-3 flex items-center justify-between border">
                        {console.log(shop)}
                        <div>
                          <p className="font-semibold text-sm">{shop.name}</p>
                          <p className="text-xs text-gray-500">{shop.campus} · {shop.category} · {shop.scope}</p>
                          <p className="text-xs text-gray-400">Owner: {shop.owner?.name} ({shop.owner?.email})</p>
                        </div>
                        <button onClick={() => handleVerifyShop(shop.id, true)}
                          className="bg-[#2E8B57] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#267a4d]">
                          Verify ✓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shops */}
          {active === 'shops' && (
            <div className="space-y-3">
              <div className="flex gap-2 mb-4">
                <span className="text-sm text-gray-500">{shops.length} total shops</span>
                <span className="text-sm text-yellow-600 font-medium">· {pendingShops.length} pending</span>
              </div>
              {shops.map(shop => (
                <div key={shop._id} className="bg-white rounded-xl shadow-sm border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{shop.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${shop.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {shop.isVerified ? 'Verified' : 'Pending'}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {shop.scope}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{shop.campus} · {shop.category}</p>
                      <p className="text-xs text-gray-400">Owner: {shop.owner?.name} · {shop.owner?.email}</p>
                    </div>
                    <button
                      onClick={() => handleVerifyShop(shop._id, !shop.isVerified)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                        shop.isVerified
                          ? 'border border-red-300 text-red-500 hover:bg-red-50'
                          : 'bg-[#2E8B57] text-white hover:bg-[#267a4d]'
                      }`}>
                      {shop.isVerified ? 'Unverify' : 'Verify ✓'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Users */}
          {active === 'users' && (
            <div className="space-y-2">
              <div className="text-sm text-gray-500 mb-4">{users.length} total users</div>
              {users.map(u => (
                <div key={u._id} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{u.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'vendor' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{u.role}</span>
                    </div>
                    <p className="text-xs text-gray-500">{u.email} · {u.campus?.split(',')[0]}</p>
                    <p className="text-xs text-gray-400">
                      Scope: {u.shopScope} · Joined: {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleDeleteUser(u._id)}
                      className="text-xs border border-red-300 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
