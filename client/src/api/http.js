import axios from 'axios';
import toast from 'react-hot-toast';

const apiOrigin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API = apiOrigin.endsWith('/api') ? apiOrigin : `${apiOrigin.replace(/\/$/, '')}/api`;
export const API_URL = API;

const http = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/auth')) window.location.href = '/auth';
    } else if (error.response?.status !== 404) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default http;
