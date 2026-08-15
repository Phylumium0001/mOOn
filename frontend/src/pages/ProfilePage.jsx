import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, CAMPUSES, REGIONS } from '../context/AuthContext';
import { getOrders } from '../api';

const NAV = [
  { key: 'orders',    label: 'My Orders',    icon: '📦' },
  { key: 'addresses', label: 'Addresses',    icon: '📍' },
  { key: 'account',   label: 'Account',      icon: '👤' },
];

const STATUS_META = {
  pending:          { label: 'Pending',          color: 'bg-yellow-100 text-yellow-800' },
  confirmed:        { label: 'Confirmed',         color: 'bg-blue-100 text-blue-800' },
  preparing:        { label: 'Preparing',         color: 'bg-indigo-100 text-indigo-800' },
  out_for_delivery: { label: 'Out for Delivery',  color: 'bg-purple-100 text-purple-800' },
  delivered:        { label: 'Delivered',         color: 'bg-green-100 text-green-800' },
  cancelled:        { label: 'Cancelled',         color: 'bg-red-100 text-red-800' },
};

const PROGRESS_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

export default function ProfilePage() {
  const { user, logout, updatePreferences } = useAuth();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Address state
  const [addresses, setAddresses] = useState(
    Array.isArray(user?.deliveryAddresses) ? user.deliveryAddresses : []
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIdx, setEditingAddressIdx] = useState(null);
  const [addressForm, setAddressForm] = useState({ label: '', hostel: '', roomNumber: '', landmark: '', isDefault: false });

  // Account state
  const [accountForm, setAccountForm] = useState({
    campus: user?.campus || '',
    shopScope: user?.shopScope || 'campus',
    region: user?.region || '',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'customer') { navigate(user.role === 'vendor' ? '/vendor' : '/admin'); return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await getOrders();
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // ── Address handlers ──────────────────────────────────────────────────────

  const openNewAddress = () => {
    setAddressForm({ label: '', hostel: '', roomNumber: '', landmark: '', isDefault: false });
    setEditingAddressIdx(null);
    setShowAddressForm(true);
  };

  const openEditAddress = (idx) => {
    setAddressForm({ ...addresses[idx] });
    setEditingAddressIdx(idx);
    setShowAddressForm(true);
  };

  const saveAddress = async () => {
    if (!addressForm.label || !addressForm.hostel) {
      toast.error('Label and hostel are required.');
      return;
    }
    let updated;
    if (editingAddressIdx !== null) {
      updated = addresses.map((a, i) => i === editingAddressIdx ? addressForm : a);
    } else {
      updated = [...addresses, addressForm];
    }
    // If this one is default, clear others
    if (addressForm.isDefault) {
      updated = updated.map((a, i) => ({
        ...a,
        isDefault: editingAddressIdx !== null ? i === editingAddressIdx : i === updated.length - 1
      }));
    }
    try {
      await updatePreferences({ deliveryAddresses: updated });
      setAddresses(updated);
      setShowAddressForm(false);
      toast.success('Address saved!');
    } catch {
      toast.error('Failed to save address.');
    }
  };

  const deleteAddress = async (idx) => {
    const updated = addresses.filter((_, i) => i !== idx);
    try {
      await updatePreferences({ deliveryAddresses: updated });
      setAddresses(updated);
      toast.success('Address removed.');
    } catch {
      toast.error('Failed to remove address.');
    }
  };

  const setDefaultAddress = async (idx) => {
    const updated = addresses.map((a, i) => ({ ...a, isDefault: i === idx }));
    try {
      await updatePreferences({ deliveryAddresses: updated });
      setAddresses(updated);
      toast.success('Default address updated.');
    } catch {
      toast.error('Failed to update default.');
    }
  };

  // ── Account handlers ──────────────────────────────────────────────────────

  const saveAccount = async () => {
    setSavingAccount(true);
    try {
      await updatePreferences(accountForm);
      toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/shop')}>
            <div className="w-8 h-8 bg-[#2E8B57] rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <span className="font-bold text-gray-900">mOOn<span className="text-gray-400 text-sm font-normal">.com</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/shop')} className="text-sm text-[#2E8B57] hover:underline">
              ← Back to Store
            </button>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile hero */}
        <div className="bg-gradient-to-r from-[#2E8B57] to-[#3DA56B] rounded-2xl p-6 mb-6 text-white flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-sm opacity-80">{user.email}</p>
            <p className="text-sm opacity-70 mt-0.5">
              🏫 {user.campus?.replace(/_/g, ' ')} &nbsp;·&nbsp;
              {user.shopScope === 'campus' ? '🏫 Campus mode' : '🌍 Nationwide mode'}
            </p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-2xl font-bold">{orders.length}</p>
            <p className="text-xs opacity-70">Total orders</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav */}
          <aside className="w-48 flex-shrink-0 hidden md:block">
            <nav className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {NAV.map(item => (
                <button key={item.key} onClick={() => setActiveNav(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b last:border-b-0 ${
                    activeNav === item.key
                      ? 'bg-green-50 text-[#2E8B57] border-l-4 border-l-[#2E8B57]'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile nav */}
          <div className="flex gap-2 mb-4 md:hidden w-full overflow-x-auto">
            {NAV.map(item => (
              <button key={item.key} onClick={() => setActiveNav(item.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeNav === item.key
                    ? 'bg-[#2E8B57] text-white'
                    : 'bg-white border text-gray-600 hover:bg-gray-50'
                }`}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── ORDERS ──────────────────────────────────────────────── */}
            {activeNav === 'orders' && (
              <div className="space-y-4">
                <h2 className="font-bold text-lg text-gray-900">Order History</h2>

                {ordersLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
                    <p className="text-5xl mb-3">📦</p>
                    <p className="font-medium">No orders yet</p>
                    <p className="text-sm mt-1">Start shopping to see your orders here.</p>
                    <button onClick={() => navigate('/shop')}
                      className="mt-4 bg-[#2E8B57] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#267a4d]">
                      Browse Store
                    </button>
                  </div>
                ) : (
                  orders.map(order => (
                    <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      {/* Order header */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">
                              Order #{order.id?.slice(-6).toUpperCase()}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_META[order.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_META[order.status]?.label || order.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {order.shop?.name} &nbsp;·&nbsp;
                            {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#2E8B57]">₵{order.total?.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expandedOrder === order.id && (
                        <div className="border-t px-4 pb-4 pt-3 space-y-4">
                          {/* Progress tracker */}
                          {order.status !== 'cancelled' && (
                            <div className="flex items-center gap-1">
                              {PROGRESS_STEPS.map((step, i) => {
                                const currentIdx = PROGRESS_STEPS.indexOf(order.status);
                                const done = i <= currentIdx;
                                const isLast = i === PROGRESS_STEPS.length - 1;
                                return (
                                  <div key={step} className="flex items-center flex-1">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                                      done ? 'bg-[#2E8B57] text-white' : 'bg-gray-200 text-gray-400'
                                    }`}>
                                      {done ? '✓' : i + 1}
                                    </div>
                                    {!isLast && (
                                      <div className={`flex-1 h-1 mx-1 rounded ${done && i < currentIdx ? 'bg-[#2E8B57]' : 'bg-gray-200'}`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {order.status === 'cancelled' && (
                            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">
                              ❌ This order was cancelled.
                            </div>
                          )}

                          {/* Items */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
                            <div className="space-y-2">
                              {order.items?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <img
                                    src={item.image || `https://via.placeholder.com/40?text=${item.name?.[0]}`}
                                    alt={item.name}
                                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">₵{item.price?.toFixed(2)} × {item.quantity}</p>
                                  </div>
                                  <p className="text-sm font-semibold">₵{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Totals */}
                          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                            <div className="flex justify-between text-gray-600">
                              <span>Subtotal</span><span>₵{order.subtotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                              <span>Delivery fee</span><span>₵{order.deliveryFee?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-gray-900 border-t pt-1 mt-1">
                              <span>Total</span><span className="text-[#2E8B57]">₵{order.total?.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Delivery address */}
                          {order.deliveryAddress && Object.keys(order.deliveryAddress).length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Delivery Address</p>
                              <p className="text-sm text-gray-700">
                                {[order.deliveryAddress.hostel, order.deliveryAddress.roomNumber, order.deliveryAddress.landmark]
                                  .filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Status history */}
                          {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Timeline</p>
                              <div className="space-y-1.5">
                                {order.statusHistory.map((h, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-[#2E8B57] mt-1 flex-shrink-0" />
                                    <span className="font-medium capitalize">{h.status?.replace(/_/g, ' ')}</span>
                                    {h.note && <span className="text-gray-400">— {h.note}</span>}
                                    <span className="ml-auto text-gray-400 flex-shrink-0">
                                      {h.timestamp ? new Date(h.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── ADDRESSES ────────────────────────────────────────────── */}
            {activeNav === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg text-gray-900">Delivery Addresses</h2>
                  <button onClick={openNewAddress}
                    className="bg-[#2E8B57] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#267a4d]">
                    + Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
                    <p className="text-5xl mb-3">📍</p>
                    <p className="font-medium">No saved addresses</p>
                    <p className="text-sm mt-1">Add a hostel or room address for faster checkout.</p>
                    <button onClick={openNewAddress}
                      className="mt-4 bg-[#2E8B57] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#267a4d]">
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {addresses.map((addr, idx) => (
                      <div key={idx} className={`bg-white rounded-xl shadow-sm border p-4 relative ${addr.isDefault ? 'ring-2 ring-[#2E8B57]' : ''}`}>
                        {addr.isDefault && (
                          <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                        <p className="font-semibold text-sm mb-1">{addr.label}</p>
                        <p className="text-sm text-gray-600">{addr.hostel}</p>
                        {addr.roomNumber && <p className="text-xs text-gray-500">Room: {addr.roomNumber}</p>}
                        {addr.landmark && <p className="text-xs text-gray-400 mt-0.5">Near: {addr.landmark}</p>}
                        <div className="flex gap-2 mt-3">
                          {!addr.isDefault && (
                            <button onClick={() => setDefaultAddress(idx)}
                              className="text-xs text-[#2E8B57] border border-[#2E8B57] px-2 py-1 rounded-lg hover:bg-green-50">
                              Set default
                            </button>
                          )}
                          <button onClick={() => openEditAddress(idx)}
                            className="text-xs text-gray-600 border px-2 py-1 rounded-lg hover:bg-gray-50">
                            Edit
                          </button>
                          <button onClick={() => deleteAddress(idx)}
                            className="text-xs text-red-500 border border-red-200 px-2 py-1 rounded-lg hover:bg-red-50">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Address form modal */}
                {showAddressForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddressForm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                      <h3 className="font-bold text-lg mb-4">{editingAddressIdx !== null ? 'Edit Address' : 'New Address'}</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'label', label: 'Label (e.g. "Mensah Sarbah Hall")', placeholder: 'My Hostel' },
                          { key: 'hostel', label: 'Hostel / Building', placeholder: 'Mensah Sarbah Hall' },
                          { key: 'roomNumber', label: 'Room Number', placeholder: 'A204' },
                          { key: 'landmark', label: 'Nearest Landmark', placeholder: 'Near the roundabout' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key}>
                            <label className="text-xs font-medium text-gray-600">{label}</label>
                            <input
                              value={addressForm[key]}
                              onChange={e => setAddressForm(f => ({ ...f, [key]: e.target.value }))}
                              placeholder={placeholder}
                              className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-[#2E8B57]"
                            />
                          </div>
                        ))}
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={e => setAddressForm(f => ({ ...f, isDefault: e.target.checked }))}
                            className="accent-[#2E8B57]"
                          />
                          Set as default delivery address
                        </label>
                      </div>
                      <div className="flex gap-3 mt-5">
                        <button onClick={() => setShowAddressForm(false)}
                          className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                          Cancel
                        </button>
                        <button onClick={saveAddress}
                          className="flex-1 bg-[#2E8B57] text-white rounded-lg py-2 text-sm font-semibold hover:bg-[#267a4d]">
                          Save Address
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ACCOUNT ──────────────────────────────────────────────── */}
            {activeNav === 'account' && (
              <div className="space-y-5">
                <h2 className="font-bold text-lg text-gray-900">Account Settings</h2>

                {/* Read-only info */}
                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h3 className="font-semibold text-sm text-gray-700 mb-4">Profile Info</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', value: user.name },
                      { label: 'Email', value: user.email },
                      { label: 'Phone', value: user.phone || '—' },
                      { label: 'Account Type', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-gray-800">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-4">To update your name, email, or password, contact support.</p>
                </div>

                {/* Editable preferences */}
                <div className="bg-white rounded-xl shadow-sm border p-5">
                  <h3 className="font-semibold text-sm text-gray-700 mb-4">Shopping Preferences</h3>
                  <div className="space-y-4">

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Your Campus</label>
                      <select
                        value={accountForm.campus}
                        onChange={e => setAccountForm(f => ({ ...f, campus: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]">
                        {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-2">Shop Preference</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'campus', icon: '🏫', label: 'Campus Only', desc: 'Shops on my campus' },
                          { value: 'nationwide', icon: '🌍', label: 'Nationwide', desc: 'All shops in Ghana' },
                        ].map(opt => (
                          <label key={opt.value}
                            className={`border rounded-xl p-3 cursor-pointer transition-colors ${accountForm.shopScope === opt.value ? 'border-[#2E8B57] bg-green-50' : 'hover:bg-gray-50'}`}>
                            <input type="radio" name="shopScope" value={opt.value}
                              checked={accountForm.shopScope === opt.value}
                              onChange={e => setAccountForm(f => ({ ...f, shopScope: e.target.value }))}
                              className="sr-only" />
                            <p className="text-sm font-semibold">{opt.icon} {opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.desc}</p>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Region (optional)</label>
                      <select
                        value={accountForm.region}
                        onChange={e => setAccountForm(f => ({ ...f, region: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]">
                        <option value="">— Select region —</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <button onClick={saveAccount} disabled={savingAccount}
                      className="w-full bg-[#2E8B57] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#267a4d] disabled:opacity-50 transition-colors">
                      {savingAccount ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>

                {/* Danger zone */}
                <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
                  <h3 className="font-semibold text-sm text-red-600 mb-3">Sign Out</h3>
                  <p className="text-xs text-gray-500 mb-3">You'll need to log back in to access your account.</p>
                  <button onClick={handleLogout}
                    className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
                    Sign out of mOOn
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
