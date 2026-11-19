import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, FileText, Gauge, LogOut, Plus, UserRound, UsersRound, Waypoints } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Overview", icon: Gauge },
  { to: "/?scope=mine", label: "My documents", icon: FileText },
  { to: "/?scope=shared", label: "Shared with me", icon: UsersRound },
  { to: "/dfa", label: "DFA simulator", icon: Waypoints },
  { to: "/network", label: "Network monitor", icon: Activity },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return <div className="app-shell">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark">c</span><span>cowrite<span className="brand-dot">.</span></span></NavLink>
      <button className="button button-primary sidebar-create" onClick={() => navigate("/?create=1")}><Plus size={17} /> New document</button>
      <div className="nav-label">WORKSPACE</div>
      <nav>{links.map(({ to, label, icon: Icon }, i) => <NavLink key={label} to={to} end={i === 0} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Icon size={18} strokeWidth={1.8} />{label}{i === 2 && <span className="nav-spacer" />}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="profile-mini"><div className="avatar">{user?.username?.slice(0, 1).toUpperCase()}</div><div className="profile-name"><strong>{user?.username}</strong><span>Personal workspace</span></div><button className="icon-button" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={17} /></button></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="crumb">Workspace <span>/</span> <strong>Documents</strong></div><div className="topbar-right"><span className="network-indicator"><i /> All systems operational</span><div className="avatar avatar-small">{user?.username?.slice(0, 1).toUpperCase()}</div></div></header><div className="page-content"><Outlet /></div></main>
  </div>;
}
