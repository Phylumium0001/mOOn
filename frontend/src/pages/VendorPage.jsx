import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getMyShop, getMyProducts, getOrders, updateOrderStatus, createShop, createProduct, updateProduct, deleteProduct } from '../api';
import { useAuth, CAMPUSES } from '../context/AuthContext';

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'products', label: 'Products', icon: '📦' },
  { key: 'orders', label: 'Orders', icon: '🛒' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function VendorPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showShopSetup, setShowShopSetup] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'vendor') { navigate('/login'); return; }
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [shopRes, prodRes, ordRes] = await Promise.all([
        getMyShop().catch(() => ({ data: { shop: null } })),
        getMyProducts().catch(() => ({ data: { products: [] } })),
        getOrders().catch(() => ({ data: { orders: [] } }))
      ]);
      setShop(shopRes.data.shop);
      setProducts(prodRes.data.products || []);
      setOrders(ordRes.data.orders || []);
      if (!shopRes.data.shop) setShowShopSetup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success('Order updated!');
    } catch { toast.error('Failed to update order.'); }
  };

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
    activeProducts: products.filter(p => p.isAvailable).length,
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#2E8B57] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2E8B57] rounded-full flex items-center justify-center">
            <div className="w-5 h-5 bg-white rounded-sm" />
          </div>
          <div>
            <p className="font-bold">mOOn</p>
            <p className="text-xs text-gray-500">Vendor Portal</p>
          </div>
        </div>

        {shop && (
          <div className="p-4 border-b bg-green-50">
            <p className="font-semibold text-sm">{shop.name}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${shop.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {shop.isVerified ? '✓ Verified' : '⏳ Pending approval'}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              {shop.scope === 'campus' ? `🏫 ${shop.campus?.split(',')[0]}` : shop.scope === 'nationwide' ? '🌍 Nationwide' : '📍 Regional'}
            </p>
          </div>
        )}

        <nav className="flex-1 py-4">
          {NAV.map(item => (
            <button key={item.key} onClick={() => setActiveNav(item.key)}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                activeNav === item.key
                  ? 'bg-green-50 text-[#2E8B57] border-r-4 border-[#2E8B57]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <span>{item.icon}</span>
              {item.label}
              {item.key === 'orders' && stats.pendingOrders > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.pendingOrders}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          <button onClick={() => { logout(); navigate('/'); }} className="text-xs text-red-500 hover:text-red-700 mt-1">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {NAV.find(n => n.key === activeNav)?.label}
          </h1>
          <button onClick={() => navigate('/shop')} className="text-sm text-[#2E8B57] hover:underline">
            ← View Store
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Shop Setup Banner */}
          {showShopSetup && <ShopSetupForm onCreated={(s) => { setShop(s); setShowShopSetup(false); }} />}

          {/* Dashboard */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'text-blue-600' },
                  { label: 'Pending', value: stats.pendingOrders, icon: '⏳', color: 'text-yellow-600' },
                  { label: 'Revenue (GHS)', value: `₵${stats.revenue.toFixed(2)}`, icon: '💰', color: 'text-green-600' },
                  { label: 'Active Products', value: stats.activeProducts, icon: '🛍️', color: 'text-purple-600' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border">
                    <p className="text-2xl mb-1">{stat.icon}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="font-semibold mb-4">Recent Orders</h3>
                {orders.slice(0, 5).map(order => (
                  <OrderRow key={order._id} order={order} onStatusChange={handleStatusUpdate} />
                ))}
                {orders.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No orders yet</p>}
              </div>
            </div>
          )}

          {/* Products */}
          {activeNav === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-700">{products.length} products</h2>
                <button onClick={() => { setEditProduct(null); setShowProductModal(true); }}
                  className="bg-[#2E8B57] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#267a4d]">
                  + Add Product
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <img src={p.images?.[0] || `https://via.placeholder.com/200x120?text=${encodeURIComponent(p.name)}`}
                      alt={p.name} className="w-full h-32 object-cover" />
                    <div className="p-4">
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <p className="text-[#2E8B57] font-bold">₵{p.price?.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Stock: {p.stock}</p>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { setEditProduct(p); setShowProductModal(true); }}
                          className="flex-1 border border-[#2E8B57] text-[#2E8B57] text-xs py-1.5 rounded-lg">
                          Edit
                        </button>
                        <button onClick={async () => {
                          if (!window.confirm('Delete this product?')) return;
                          await deleteProduct(p._id);
                          setProducts(prev => prev.filter(x => x._id !== p._id));
                          toast.success('Product deleted.');
                        }} className="flex-1 border border-red-300 text-red-500 text-xs py-1.5 rounded-lg">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {products.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-5xl mb-3">📦</p>
                  <p>No products yet. Add your first product!</p>
                </div>
              )}
            </div>
          )}

          {/* Orders */}
          {activeNav === 'orders' && (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderRow key={order._id} order={order} onStatusChange={handleStatusUpdate} expanded />
              ))}
              {orders.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-5xl mb-3">🛒</p>
                  <p>No orders received yet</p>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeNav === 'settings' && shop && (
            <ShopSettingsForm shop={shop} onSaved={setShop} />
          )}
        </main>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editProduct}
          onClose={() => setShowProductModal(false)}
          onSaved={(p) => {
            if (editProduct) {
              setProducts(prev => prev.map(x => x._id === p._id ? p : x));
            } else {
              setProducts(prev => [p, ...prev]);
            }
            setShowProductModal(false);
          }}
        />
      )}
    </div>
  );
}

function OrderRow({ order, onStatusChange, expanded }) {
  const NEXT_STATUS = {
    pending: 'confirmed', confirmed: 'preparing',
    preparing: 'out_for_delivery', out_for_delivery: 'delivered'
  };
  const next = NEXT_STATUS[order.status];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">Order #{order._id?.slice(-6).toUpperCase()}</p>
          <p className="text-xs text-gray-500">{order.customer?.name} · {order.items?.length} items · ₵{order.total?.toFixed(2)}</p>
          {expanded && (
            <ul className="mt-2 text-xs text-gray-600 space-y-0.5">
              {order.items?.map(i => <li key={i._id || i.name}>• {i.name} × {i.quantity}</li>)}
            </ul>
          )}
        </div>
        <div className="text-right space-y-2">
          <span className={`inline-block text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
            {order.status?.replace(/_/g, ' ')}
          </span>
          {next && (
            <button onClick={() => onStatusChange(order._id, next)}
              className="block text-xs bg-[#2E8B57] text-white px-3 py-1 rounded-lg hover:bg-[#267a4d] ml-auto">
              Mark {next.replace(/_/g, ' ')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }) {
  const CATEGORIES = ['textbooks', 'stationery', 'electronics', 'snacks', 'fashion', 'services', 'general'];
  const [form, setForm] = useState({
    name: product?.name || '', description: product?.description || '',
    price: product?.price || '', originalPrice: product?.originalPrice || '',
    category: product?.category || 'general', stock: product?.stock || 0,
  });

  const handleSave = async () => {
    try {
      const res = product
        ? await updateProduct(product.id, form)
        : await createProduct(form);
      onSaved(res.data.product);
      toast.success(product ? 'Product updated!' : 'Product created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="font-bold text-lg mb-4">{product ? 'Edit Product' : 'Add New Product'}</h2>
        <div className="space-y-3">
          {[['name', 'Product Name'], ['description', 'Description']].map(([key, label]) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-600">{label}</label>
              <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {[['price', 'Price (₵)'], ['originalPrice', 'Original Price (₵)'], ['stock', 'Stock']].map(([key, label]) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600">{label}</label>
                <input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium text-gray-600">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm">Cancel</button>
          <button onClick={handleSave} className="flex-1 bg-[#2E8B57] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#267a4d]">
            {product ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopSetupForm({ onCreated }) {
  const { user } = useAuth();
  const CATEGORIES = ['textbooks', 'stationery', 'electronics', 'snacks', 'fashion', 'services', 'general'];
  const [form, setForm] = useState({
    name: '', description: '', category: 'general',
    scope: 'campus', campus: user?.campus || CAMPUSES[0],
    contactPhone: '', deliveryFee: 0, estimatedDeliveryTime: '30-45 mins'
  });

  const handleCreate = async () => {
    try {
      const res = await createShop(form);
      onCreated(res.data.shop);
      toast.success('Shop created! Pending admin verification.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shop.');
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
      <h2 className="font-bold text-lg mb-1">Set Up Your Shop</h2>
      <p className="text-sm text-gray-600 mb-4">You need a shop to start selling. Fill in the details below.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Shop Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Category</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Delivery Scope</label>
          <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
            <option value="campus">Campus Only</option>
            <option value="region">Region-wide</option>
            <option value="nationwide">Nationwide</option>
          </select>
        </div>
        {form.scope === 'campus' && (
          <div>
            <label className="text-xs font-medium text-gray-600">Campus</label>
            <select value={form.campus} onChange={e => setForm(f => ({ ...f, campus: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
              {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-600">Delivery Fee (₵)</label>
          <input type="number" value={form.deliveryFee} onChange={e => setForm(f => ({ ...f, deliveryFee: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-600">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
        </div>
      </div>
      <button onClick={handleCreate}
        className="mt-4 bg-[#2E8B57] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#267a4d]">
        Create Shop
      </button>
    </div>
  );
}

function ShopSettingsForm({ shop, onSaved }) {
  const [form, setForm] = useState({
    name: shop.name, description: shop.description || '',
    scope: shop.scope, campus: shop.campus,
    contactPhone: shop.contactPhone || '', deliveryFee: shop.deliveryFee || 0,
    estimatedDeliveryTime: shop.estimatedDeliveryTime || '30-45 mins'
  });

  const handleSave = async () => {
    try {
      const { updateShop } = await import('../api');
      const res = await updateShop(shop._id, form);
      onSaved(res.data.shop);
      toast.success('Shop settings saved!');
    } catch { toast.error('Failed to save settings.'); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 max-w-xl">
      <h2 className="font-bold text-lg mb-4">Shop Settings</h2>
      <div className="space-y-3">
        {[['name', 'Shop Name'], ['description', 'Description'], ['contactPhone', 'Contact Phone'], ['estimatedDeliveryTime', 'Estimated Delivery Time']].map(([key, label]) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-600">Delivery Fee (₵)</label>
          <input type="number" value={form.deliveryFee} onChange={e => setForm(f => ({ ...f, deliveryFee: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Scope</label>
          <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
            <option value="campus">Campus Only</option>
            <option value="region">Region-wide</option>
            <option value="nationwide">Nationwide</option>
          </select>
        </div>
        {form.scope === 'campus' && (
          <div>
            <label className="text-xs font-medium text-gray-600">Campus</label>
            <select value={form.campus} onChange={e => setForm(f => ({ ...f, campus: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm mt-1">
              {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>
      <button onClick={handleSave} className="mt-5 bg-[#2E8B57] text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#267a4d]">
        Save Settings
      </button>
    </div>
  );
}
