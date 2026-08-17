import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('moon_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — log out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('moon_token');
      localStorage.removeItem('moon_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updatePreferences = (data) => api.patch('/auth/preferences', data);

// ── Shops ─────────────────────────────────────────────
export const getShops = (params) => api.get('/shops', { params });
export const getShop = (id) => api.get(`/shops/${id}`);
export const createShop = (data) => api.post('/shops', data);
export const updateShop = (id, data) => api.patch(`/shops/${id}`, data);
export const getMyShop = () => api.get('/shops/vendor/mine');

// ── Products ──────────────────────────────────────────
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const getMyProducts = () => api.get('/products/vendor/mine');

// ── Orders ────────────────────────────────────────────
export const placeOrder = (data) => api.post('/orders', data);
export const getOrders = () => api.get('/orders');
export const getOrder = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);

// ── Admin ─────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const getAdminShops = (params) => api.get('/admin/shops', { params });
export const verifyShop = (id, isVerified) => api.patch(`/admin/shops/${id}/verify`, { isVerified });
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export default api;

