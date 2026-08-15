import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getProducts } from '../api';
import { useAuth, CAMPUSES } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CATEGORIES = [
  { key: 'all', label: 'All Products' },
  { key: 'textbooks', label: 'Textbooks', icon: '📚', color: 'bg-blue-500' },
  { key: 'snacks', label: 'Food & Snacks', icon: '🍔', color: 'bg-orange-500' },
  { key: 'fashion', label: 'Campus Fashion', icon: '👕', color: 'bg-purple-500' },
  { key: 'stationery', label: 'Stationery', icon: '✏️', color: 'bg-green-500' },
  { key: 'electronics', label: 'Electronics', icon: '💻', color: 'bg-indigo-500' },
  { key: 'services', label: 'Services', icon: '🛠️', color: 'bg-red-500' },
];

export default function StorePage() {
  const { user, updatePreferences } = useAuth();
  const { cart, addItem, removeItem, updateQty, clearCart, total, itemCount } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [scopeDropOpen, setScopeDropOpen] = useState(false);
  const [campusDropOpen, setCampusDropOpen] = useState(false);

  // Scope/campus state — driven by user prefs if logged in, else local
  const [scope, setScope] = useState(user?.shopScope || 'campus');
  const [campus, setCampus] = useState(user?.campus || CAMPUSES[0]);

  const cartRef = useRef();

  useEffect(() => {
    fetchProducts();
  }, [category, campus, scope]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { scope, campus };
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const res = await getProducts(params);
      setProducts(res.data.products);
    } catch {
      // Use mock data for demo when backend not connected
      setProducts(MOCK_PRODUCTS.filter(p => category === 'all' || p.category === category));
    } finally {
      setLoading(false);
    }
  };

  const handleScopeChange = async (newScope) => {
    setScope(newScope);
    setScopeDropOpen(false);
    if (user) {
      try { await updatePreferences({ shopScope: newScope }); } catch {}
    }
  };

  const handleCampusChange = async (newCampus) => {
    setCampus(newCampus);
    setCampusDropOpen(false);
    if (user) {
      try { await updatePreferences({ campus: newCampus }); } catch {}
    }
  };

  const handleAddToCart = (product) => {
    const shopId = product.shop?._id || product.shopId || 'mock-shop';
    const result = addItem(product, shopId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-8 h-8 bg-[#2E8B57] rounded-full flex items-center justify-center mr-2">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
              <span className="text-xl font-bold text-gray-900">mOOn</span>
              <span className="text-xs text-gray-500">.com</span>
            </div>

            {/* Scope Toggle */}
            <div className="relative">
              <button
                onClick={() => setScopeDropOpen(!scopeDropOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50"
              >
                <span>{scope === 'campus' ? '🏫 Campus' : '🌍 Nationwide'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {scopeDropOpen && (
                <div className="absolute left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-48">
                  <button onClick={() => handleScopeChange('campus')}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${scope === 'campus' ? 'text-[#2E8B57] font-semibold' : ''}`}>
                    🏫 Campus only <span className="text-xs text-gray-400 ml-auto">Shops on your campus</span>
                  </button>
                  <button onClick={() => handleScopeChange('nationwide')}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${scope === 'nationwide' ? 'text-[#2E8B57] font-semibold' : ''}`}>
                    🌍 Nationwide <span className="text-xs text-gray-400 ml-auto">All shops in Ghana</span>
                  </button>
                </div>
              )}
            </div>

            {/* Campus selector */}
            {scope === 'campus' && (
              <div className="relative">
                <button onClick={() => setCampusDropOpen(!campusDropOpen)}
                  className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 max-w-48">
                  <span className="truncate text-gray-700">📍 {campus.split(',')[0]}</span>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {campusDropOpen && (
                  <div className="absolute left-0 mt-1 bg-white border rounded-lg shadow-lg z-10 w-72">
                    {CAMPUSES.map(c => (
                      <button key={c} onClick={() => handleCampusChange(c)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${campus === c ? 'text-[#2E8B57] font-semibold bg-green-50' : 'text-gray-700'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search textbooks, snacks, essentials..."
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <button onClick={() => navigate(user.role === 'vendor' ? '/vendor' : user.role === 'admin' ? '/admin' : '/profile')}
                  className="text-sm font-medium text-gray-700 hover:text-[#2E8B57]">
                  👤 {user.name.split(' ')[0]}
                </button>
              ) : (
                <button onClick={() => navigate('/login')}
                  className="text-sm font-medium text-gray-700 hover:text-[#2E8B57]">
                  Sign In
                </button>
              )}

              <button onClick={() => setCartOpen(true)} className="relative p-2 hover:text-[#2E8B57]">
                🛒
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#2E8B57] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Category Nav */}
          <nav className="flex gap-6 py-3 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button key={cat.key} onClick={() => setCategory(cat.key)}
                className={`flex-shrink-0 text-sm font-medium pb-1 transition-colors ${
                  category === cat.key
                    ? 'text-[#2E8B57] border-b-2 border-[#2E8B57]'
                    : 'text-gray-600 hover:text-[#2E8B57]'
                }`}>
                {cat.icon} {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-[#2E8B57] to-[#3DA56B] text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Everything Campus.<br />One Store.
          </h1>
          <p className="text-lg opacity-90 mb-6 max-w-xl">
            {scope === 'campus'
              ? `Get campus essentials delivered anywhere on ${campus.split(',')[0]}.`
              : 'Shop from verified vendors across all Ghanaian universities.'}
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
              className="bg-white text-[#2E8B57] px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Shopping
            </button>
            <button
              onClick={() => handleScopeChange(scope === 'campus' ? 'nationwide' : 'campus')}
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#2E8B57] transition-colors">
              {scope === 'campus' ? '🌍 Switch to Nationwide' : '🏫 Switch to Campus'}
            </button>
          </div>
        </div>
      </section>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {category === 'all' ? 'All Products' : CATEGORIES.find(c => c.key === category)?.label}
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({scope === 'campus' ? campus.split(',')[0] : 'Nationwide'})
            </span>
          </h2>
          <span className="text-sm text-gray-500">{products.length} items</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-4">🛍️</p>
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm mt-1">Try switching to Nationwide view or a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard key={product._id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div ref={cartRef} className="relative bg-white w-full max-w-sm h-full shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Your Cart ({itemCount})</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-5xl mb-3">🛒</p>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item._id} className="flex items-center gap-3 mb-4 bg-gray-50 rounded-lg p-3">
                    <img src={item.images?.[0] || `https://via.placeholder.com/48?text=${item.name[0]}`}
                      alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">₵{item.price.toFixed(2)} × {item.qty}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item._id, item.qty - 1)}
                        className="w-6 h-6 bg-gray-200 rounded-full text-xs flex items-center justify-center">−</button>
                      <span className="text-sm w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, item.qty + 1)}
                        className="w-6 h-6 bg-gray-200 rounded-full text-xs flex items-center justify-center">+</button>
                    </div>
                    <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600 ml-1">🗑</button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-4">
                <div className="flex justify-between font-semibold mb-4">
                  <span>Total</span>
                  <span className="text-[#2E8B57]">₵{total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); navigate('/checkout'); }}
                  className="w-full bg-[#2E8B57] text-white py-3 rounded-lg font-semibold hover:bg-[#267a4d] transition-colors">
                  Proceed to Checkout
                </button>
                <button onClick={clearCart} className="w-full mt-2 text-sm text-gray-500 hover:text-red-500">
                  Clear cart
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:-translate-y-1 transition-transform overflow-hidden">
      <div className="relative">
        <img
          src={product.images?.[0] || `https://via.placeholder.com/200x150?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          className="w-full h-40 object-cover"
        />
        {discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.shop?.scope === 'nationwide' && (
          <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
            🌍 National
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1 truncate">{product.shop?.name || 'Campus Shop'}</p>
        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        <div className="flex items-center gap-1 mb-2">
          {'⭐'.repeat(Math.round(product.rating || 4))}
          <span className="text-xs text-gray-400">({product.reviewCount || 0})</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-[#2E8B57]">₵{product.price?.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-1">₵{product.originalPrice.toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-[#2E8B57] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#267a4d] transition-colors">
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Fallback mock data for when backend is not connected
const MOCK_PRODUCTS = [
  { _id: '1', name: 'Biochemistry Textbook', price: 45, originalPrice: 60, category: 'textbooks', rating: 4, reviewCount: 12, shop: { name: 'Campus Bookstore', scope: 'campus' }, images: [] },
  { _id: '2', name: 'Jollof Rice Meal Deal', price: 25, category: 'snacks', rating: 5, reviewCount: 89, shop: { name: 'Mama Grace Kitchen', scope: 'campus' }, images: [] },
  { _id: '3', name: 'UG Branded Hoodie', price: 120, category: 'fashion', rating: 4, reviewCount: 34, shop: { name: 'Campus Merch', scope: 'campus' }, images: [] },
  { _id: '4', name: 'Scientific Calculator', price: 85, originalPrice: 110, category: 'electronics', rating: 4, reviewCount: 22, shop: { name: 'TechZone', scope: 'nationwide' }, images: [] },
  { _id: '5', name: 'Lecture Note Pad (A4)', price: 8, category: 'stationery', rating: 4, reviewCount: 45, shop: { name: 'Campus Bookstore', scope: 'campus' }, images: [] },
  { _id: '6', name: 'Laptop Repair Service', price: 50, category: 'services', rating: 5, reviewCount: 17, shop: { name: 'FixIt Tech', scope: 'region' }, images: [] },
  { _id: '7', name: 'Kelewele Pack', price: 15, category: 'snacks', rating: 5, reviewCount: 63, shop: { name: 'Night Market', scope: 'campus' }, images: [] },
  { _id: '8', name: 'Engineering Drawing Set', price: 35, category: 'stationery', rating: 4, reviewCount: 8, shop: { name: 'Campus Bookstore', scope: 'campus' }, images: [] },
];
