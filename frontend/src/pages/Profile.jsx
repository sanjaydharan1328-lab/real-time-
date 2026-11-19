import { useAuth } from "../context/AuthContext.jsx";
import { UserRound } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  return <div className="subpage"><div className="page-heading compact"><div><div className="eyebrow">ACCOUNT</div><h1>Your profile</h1><p>Account details used across your workspace.</p></div></div><div className="profile-card"><div className="profile-large">{user?.username?.[0]?.toUpperCase()}<span><UserRound size={15}/></span></div><div><h2>{user?.username}</h2><p>{user?.email}</p></div><div className="profile-detail"><span>Username</span><strong>{user?.username}</strong></div><div className="profile-detail"><span>Email</span><strong>{user?.email}</strong></div><div className="profile-note">Your password is stored as a secure hash and is never returned to the browser.</div></div></div>;
}
