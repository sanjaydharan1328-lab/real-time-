import axios from "axios";

// Production defaults prevent a missing Vercel variable from sending requests
// to localhost in the visitor's browser.
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://real-time-1-sv6v.onrender.com/api";
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cowrite-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function socketUrl() {
  return SOCKET_BASE_URL;
}
