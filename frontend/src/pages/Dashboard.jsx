import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Clock3, FilePlus2, FileText, MoreHorizontal, Search, Share2, Trash2, UsersRound } from "lucide-react";
import { api } from "../services/api.js";

function dateLabel(date) { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)); }
export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  async function reload() { const { data } = await api.get("/documents"); setDocuments(data.documents); }
  useEffect(() => { reload().catch(err => setError(err.response?.data?.message || "Could not load documents")); }, []);
  useEffect(() => { if (params.get("create") === "1") { setParams({}); create(); } }, [params]);
  async function create() {
    const title = window.prompt("Give your new document a title", "Untitled document");
    if (!title?.trim()) return;
    setBusy(true); setError("");
    try { const { data } = await api.post("/documents", { title }); window.location.href = `/documents/${data.document._id}`; }
    catch (err) { setError(err.response?.data?.message || "Could not create document"); }
    finally { setBusy(false); }
  }
  async function remove(doc) {
    if (!window.confirm(`Delete “${doc.title}”? This also removes its history.`)) return;
    try { await api.delete(`/documents/${doc._id}`); setDocuments(list => list.filter(item => item._id !== doc._id)); }
    catch (err) { setError(err.response?.data?.message || "Could not delete document"); }
  }
  async function share(doc) {
    const email = window.prompt(`Invite a registered collaborator to “${doc.title}”. Enter their account email:`);
    if (!email) return;
    try { await api.post(`/documents/${doc._id}/share`, { email }); await reload(); }
    catch (err) { setError(err.response?.data?.message || "Could not share document"); }
  }
  const currentUser = JSON.parse(localStorage.getItem("cowrite-user") || "{}");
  const scope = params.get("scope");
  const mine = documents.filter(doc => String(doc.owner?._id || doc.owner) === String(currentUser.id));
  const shared = documents.filter(doc => !mine.includes(doc));
  const visible = useMemo(() => documents.filter(doc => {
    const matchesSearch = `${doc.title} ${doc.owner?.username || ""}`.toLowerCase().includes(query.toLowerCase());
    const isMine = String(doc.owner?._id || doc.owner) === String(currentUser.id);
    return matchesSearch && (scope === "mine" ? isMine : scope === "shared" ? !isMine : true);
  }), [documents, query, scope, currentUser.id]);
  const metricCards = [{ label: "Total documents", value: documents.length, icon: FileText, tone: "blue" }, { label: "Created by you", value: mine.length, icon: FilePlus2, tone: "violet" }, { label: "Shared with you", value: shared.length, icon: UsersRound, tone: "green" }];
  return <div className="dashboard-page"><div className="page-heading"><div><div className="eyebrow">YOUR WORKSPACE</div><h1>Good work starts here<span className="heading-period">.</span></h1><p>Pick up where you left off, or start something new.</p></div><button className="button button-primary" onClick={create} disabled={busy}><FilePlus2 size={17}/> New document</button></div>{error && <div className="alert alert-error">{error}</div>}<section className="metrics-grid">{metricCards.map(({label,value,icon:Icon,tone}) => <div className="metric-card" key={label}><span className={`metric-icon ${tone}`}><Icon size={19}/></span><div><span>{label}</span><strong>{value}</strong></div><span className="metric-decor">↗</span></div>)}</section><section className="documents-section"><div className="section-header"><div><h2>{scope === "mine" ? "My documents" : scope === "shared" ? "Shared with me" : "Recent documents"}</h2><p>Your team’s latest work, all in one place.</p></div><div className="search-box"><Search size={17}/><input placeholder="Search documents…" value={query} onChange={e => setQuery(e.target.value)}/><kbd>⌘ K</kbd></div></div>{visible.length ? <div className="document-table"><div className="table-head"><span>DOCUMENT</span><span>ACCESS</span><span>LAST MODIFIED</span><span>STATUS</span><span></span></div>{visible.map(doc => <div className="document-row" key={doc._id}><div className="doc-name-cell"><span className="doc-file-icon"><FileText size={18}/></span><div><Link to={`/documents/${doc._id}`} className="doc-title">{doc.title}</Link><small>Owned by {doc.owner?.username || "you"}</small></div></div><div>{doc.collaborators?.length ? <span className="access-pill"><UsersRound size={13}/> {doc.collaborators.length + 1} people</span> : <span className="access-muted">Private</span>}</div><div className="modified-cell"><Clock3 size={14}/>{dateLabel(doc.updatedAt)}</div><div><span className={`status-pill ${doc.isLocked ? "locked" : doc.currentState === "Editing" ? "editing" : "saved"}`}><i/>{doc.isLocked ? "Locked" : doc.currentState || "Saved"}</span></div><div className="row-actions"><Link to={`/documents/${doc._id}`} className="icon-button" title="Open"><ArrowUpRight size={16}/></Link>{doc.owner?.username === currentUser.username && <div className="row-menu"><button className="icon-button" title="More actions"><MoreHorizontal size={17}/></button><div className="row-menu-pop"><button onClick={() => share(doc)}><Share2 size={14}/> Share</button><button onClick={() => remove(doc)}><Trash2 size={14}/> Delete</button></div></div>}</div></div>)}</div> : <div className="empty-state"><div className="empty-icon"><FileText size={24}/></div><h3>{query ? "No matching documents" : "Your workspace is ready"}</h3><p>{query ? "Try another title or search term." : "Create a document and invite your teammates to collaborate."}</p>{!query && scope !== "shared" && <button className="button button-primary" onClick={create}><FilePlus2 size={16}/> Create your first document</button>}</div>}</section></div>;
}
