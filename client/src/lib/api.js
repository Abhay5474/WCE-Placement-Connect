import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({ baseURL, withCredentials: true });

let accessToken = localStorage.getItem('accessToken') || null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (token) localStorage.setItem('accessToken', token);
  else localStorage.removeItem('accessToken');
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Transparent refresh on 401 (once per request).
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        refreshing = refreshing || api.post('/auth/refresh');
        const { data } = await refreshing;
        refreshing = null;
        setAccessToken(data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

/* Unwraps the { success, data, meta } envelope. */
export const unwrap = (promise) => promise.then((r) => r.data);
export const errMessage = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
