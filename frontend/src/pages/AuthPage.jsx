import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, CAMPUSES } from '../context/AuthContext';

export default function AuthPage({ mode = 'login' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    campus: CAMPUSES[0], shopScope: 'campus', role: 'customer'
  });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = isLogin
        ? await login({ email: form.email, password: form.password })
        : await register(form);

      toast.success(`Welcome${user.name ? ', ' + user.name.split(' ')[0] : ''}! 🎉`);

      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'vendor') navigate('/vendor');
      else navigate('/shop');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2E8B57] to-[#1a5c3a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E8B57] to-[#3DA56B] p-8 text-white text-center">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
            <div className="w-7 h-7 bg-[#2E8B57] rounded-sm" />
          </div>
          <h1 className="text-2xl font-bold">mOOn.com</h1>
          <p className="text-sm opacity-80 mt-1">Your campus life, delivered</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${isLogin ? 'text-[#2E8B57] border-b-2 border-[#2E8B57]' : 'text-gray-500'}`}>
            Sign In
          </button>
          <button onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${!isLogin ? 'text-[#2E8B57] border-b-2 border-[#2E8B57]' : 'text-gray-500'}`}>
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required
                placeholder="Kwame Mensah"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required
              placeholder="you@ug.edu.gh"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} required
              placeholder="••••••••"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input name="phone" value={form.phone} onChange={handleChange}
                  placeholder="0244 000 000"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Campus</label>
                <select name="campus" value={form.campus} onChange={handleChange} required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]">
                  {CAMPUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                  {/* <select name="campus" value={form.campus} onChange={handleChange} required
                     className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E8B57]">
                     {CAMPUSES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)} 
                   </select>  */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shop Preference</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'campus', label: '🏫 Campus Only', desc: 'Shops on my campus' },
                    { value: 'nationwide', label: '🌍 Nationwide', desc: 'All shops in Ghana' }
                  ].map(opt => (
                    <label key={opt.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${form.shopScope === opt.value ? 'border-[#2E8B57] bg-green-50' : 'hover:bg-gray-50'}`}>
                      <input type="radio" name="shopScope" value={opt.value}
                        checked={form.shopScope === opt.value} onChange={handleChange} className="sr-only" />
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'customer', label: '🛍️ Student / Buyer' },
                    { value: 'vendor', label: '🏪 Vendor / Seller' }
                  ].map(opt => (
                    <label key={opt.value}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors text-sm font-medium text-center ${form.role === opt.value ? 'border-[#2E8B57] bg-green-50 text-[#2E8B57]' : 'hover:bg-gray-50'}`}>
                      <input type="radio" name="role" value={opt.value}
                        checked={form.role === opt.value} onChange={handleChange} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#2E8B57] text-white py-3 rounded-lg font-semibold hover:bg-[#267a4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '⏳ Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-[#2E8B57] font-semibold">
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
