import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import LandingPage from './pages/LandingPage';
import StorePage from './pages/StorePage';
import AuthPage from './pages/AuthPage';
import VendorPage from './pages/VendorPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from "./pages/ProfilePage"

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/shop" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 2500 }} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/shop" element={<StorePage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/profile" element={
              <ProtectedRoute roles={['customer']}>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/vendor" element={
              <ProtectedRoute roles={['vendor']}>
                <VendorPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
