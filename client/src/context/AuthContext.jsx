import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken } from '../lib/api.js';

const AuthContext = createContext(null);
const DEFAULT_INSTITUTION_NAME = 'WCEConnect AI';

const normalizeInstitutionName = (institutionName) => {
  const value = (institutionName || '').trim();
  if (!value) return DEFAULT_INSTITUTION_NAME;
  if (/^walchand college of engineering(\s+ai)?$/i.test(value)) return DEFAULT_INSTITUTION_NAME;
  return value;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({ institutionName: DEFAULT_INSTITUTION_NAME, collegeEmailDomain: '' });

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/config').then(({ data }) => setConfig({
      ...data.data,
      institutionName: normalizeInstitutionName(data.data.institutionName),
    })).catch(() => {});
    if (localStorage.getItem('accessToken')) loadMe();
    else setLoading(false);
  }, [loadMe]);

  const applySession = (payload) => {
    if (payload.accessToken) setAccessToken(payload.accessToken);
    setUser(payload.user);
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data.data);
    return data.data.user;
  };

  const register = async (form) => {
    const { data } = await api.post('/auth/register', form);
    applySession(data.data);
    return data.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  };

  const refreshUser = loadMe;

  return (
    <AuthContext.Provider value={{ user, loading, config, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export const hasRole = (user, ...roles) => user && roles.includes(user.role);
