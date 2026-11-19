import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cowrite-user")); } catch { return null; }
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("cowrite-token");
    if (!token) { setReady(true); return; }
    api.get("/auth/me").then(({ data }) => setUser(data.user)).catch(() => {
      localStorage.removeItem("cowrite-token"); localStorage.removeItem("cowrite-user"); setUser(null);
    }).finally(() => setReady(true));
  }, []);
  const value = useMemo(() => ({ user, ready, async authenticate(path, fields) {
    const { data } = await api.post(`/auth/${path}`, fields);
    localStorage.setItem("cowrite-token", data.token);
    localStorage.setItem("cowrite-user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, logout() {
    localStorage.removeItem("cowrite-token"); localStorage.removeItem("cowrite-user"); setUser(null);
  } }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
