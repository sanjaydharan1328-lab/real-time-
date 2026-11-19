import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="loading-screen">Loading your workspace…</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
