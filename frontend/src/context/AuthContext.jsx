import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as apiLogin, register as apiRegister, updatePreferences as apiUpdatePrefs } from '../api';

const AuthContext = createContext(null);

export const CAMPUSES = [
  'University of Ghana, Legon',
  'KNUST, Kumasi',
  'University of Cape Coast',
  'University of Professional Studies',
  'University of Energy and Natural Resources',
  'Ghana Institute of Management and Public Administration',
  'University of Health and Allied Sciences'
];

export const REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern',
  'Volta', 'Northern', 'Upper East', 'Upper West', 'Brong-Ahafo',
  'Savannah', 'Bono East', 'Ahafo', 'Western North', 'Oti', 'North East'
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('moon_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('moon_token');
    if (token) {
      getMe()
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('moon_token'); localStorage.removeItem('moon_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    const { token, user } = res.data;
    localStorage.setItem('moon_token', token);
    localStorage.setItem('moon_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await apiRegister(data);
    const { token, user } = res.data;
    localStorage.setItem('moon_token', token);
    localStorage.setItem('moon_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('moon_token');
    localStorage.removeItem('moon_user');
    setUser(null);
  };

  const updatePreferences = async (prefs) => {
    const res = await apiUpdatePrefs(prefs);
    const updated = res.data.user;
    localStorage.setItem('moon_user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updatePreferences, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
