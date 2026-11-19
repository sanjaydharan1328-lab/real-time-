import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, LockKeyhole, UsersRound, Waypoints } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const register = mode === "register";
  const { authenticate } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(""); setBusy(true);
    try { await authenticate(register ? "register" : "login", form); navigate("/"); }
    catch (err) { setError(err.response?.data?.message || "Could not connect to the server. Check that the backend is running."); }
    finally { setBusy(false); }
  }
  return <div className="auth-screen"><section className="auth-aside"><Link to="/login" className="brand auth-brand"><span className="brand-mark">c</span><span>cowrite<span className="brand-dot">.</span></span></Link><div className="auth-pitch"><div className="eyebrow">A better way to work together</div><h1>Ideas move<br />better <em>together.</em></h1><p>A shared space for your team to write, think and build in real time.</p><div className="auth-feature"><span><UsersRound size={18}/></span><div><b>Work in sync</b><small>See your collaborators as ideas unfold</small></div></div><div className="auth-feature"><span><LockKeyhole size={18}/></span><div><b>Stay in control</b><small>Clear permissions and document locking</small></div></div><div className="auth-feature"><span><Waypoints size={18}/></span><div><b>Built on reliable state</b><small>Every edit follows a verified workflow</small></div></div></div><div className="auth-aside-foot">Real-time collaboration, thoughtfully designed.</div></section><section className="auth-main"><div className="auth-card"><div className="auth-card-icon"><FileText size={21}/></div><div className="eyebrow">YOUR WORKSPACE</div><h2>{register ? "Create your account" : "Welcome back"}</h2><p className="muted">{register ? "Start collaborating on your next great idea." : "Sign in to pick up where you left off."}</p><form onSubmit={submit} className="auth-form">{register && <label>Your name<input required minLength="3" maxLength="24" pattern="[A-Za-z0-9_]+" autoComplete="username" placeholder="e.g. alex_morgan" value={form.username} onChange={e => setForm({...form,username:e.target.value})}/></label>}<label>Email address<input required type="email" autoComplete="email" placeholder="you@university.edu" value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label><label>Password<input required type="password" minLength="8" maxLength="128" autoComplete={register ? "new-password" : "current-password"} placeholder="At least 8 characters" value={form.password} onChange={e => setForm({...form,password:e.target.value})}/></label>{error && <div className="alert alert-error">{error}</div>}<button disabled={busy} className="button button-primary auth-submit">{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button></form><div className="auth-switch">{register ? "Already have an account?" : "New to Cowrite?"} <Link to={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></div><div className="auth-legal">Your documents are stored securely and only shared with people you invite.</div></div></section></div>;
}
