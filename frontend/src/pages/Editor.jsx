import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock3, LockKeyhole, LockKeyholeOpen, Save, UsersRound } from "lucide-react";
import { io } from "socket.io-client";
import { api, socketUrl } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Editor() {
  const { id } = useParams();
  const { user } = useAuth();
  const socketRef = useRef(null);
  const saveTimer = useRef(null);
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [status, setStatus] = useState("Loading");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const currentUserId = user?.id;

  useEffect(() => {
    let alive = true;
    const socket = io(socketUrl(), { auth: { token: localStorage.getItem("cowrite-token") }, autoConnect: false });
    socketRef.current = socket;
    api.get(`/documents/${id}`).then(({ data }) => {
      if (!alive) return;
      setDocument(data.document); setContent(data.document.content); setStatus(data.document.currentState || "Saved");
      setLastSaved(data.document.updatedAt);
      socket.connect();
      socket.emit("join-document", { documentId: id }, (result) => {
        if (!result?.ok) { setError(result?.message || "Could not join this document"); return; }
        setCollaborators(result.collaborators || []);
      });
    }).catch(err => setError(err.response?.data?.message || "Could not load document"));
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", err => setError(err.message));
    socket.on("user-joined", ({ user: joined }) => setCollaborators(list => list.some(u => u.id === joined.id) ? list : [...list, joined]));
    socket.on("user-left", ({ userId: leftId }) => setCollaborators(list => list.filter(u => u.id !== leftId)));
    socket.on("document-update", update => { if (update.user?.id !== currentUserId) setContent(update.content); });
    socket.on("document-saved", event => { setLastSaved(event.savedAt); if (event.user?.id !== currentUserId) setStatus("Saved"); });
    socket.on("document-locked", event => { setDocument(prev => prev && ({ ...prev, isLocked: true, lockedBy: event.lockedBy })); setStatus("Locked"); });
    socket.on("document-unlocked", () => { setDocument(prev => prev && ({ ...prev, isLocked: false, lockedBy: null })); setStatus("Saved"); });
    socket.on("state-updated", event => { if (event.state) setStatus(event.state); });
    return () => { alive = false; clearTimeout(saveTimer.current); socket.emit("leave-document", { documentId: id }); socket.disconnect(); };
  }, [id, currentUserId]);

  const save = useCallback((value) => {
    clearTimeout(saveTimer.current);
    setStatus("Saving");
    saveTimer.current = setTimeout(() => {
      const socket = socketRef.current;
      if (!socket?.connected) { setStatus("Unsaved"); setError("Connection lost. Your latest changes are not saved yet."); return; }
      socket.emit("document-update", { documentId: id, content: value }, result => {
        if (!result?.ok) { setStatus("Editing"); setError(result?.message || "Save failed"); return; }
        setStatus("Saved"); setLastSaved(result.savedAt); setError("");
      });
    }, 650);
  }, [id]);

  function edit(value) {
    if (document?.isLocked && String(document.lockedBy?._id || document.lockedBy) !== String(currentUserId)) return;
    setContent(value); setStatus("Editing"); save(value);
  }
  function toggleLock() {
    const event = document?.isLocked ? "document-unlocked" : "document-locked";
    socketRef.current?.emit(event, { documentId: id }, result => {
      if (!result?.ok) { setError(result?.message || "Could not change lock state"); return; }
      const locked = result.state === "Locked";
      setDocument(prev => ({ ...prev, isLocked: locked, lockedBy: locked ? result.lockedBy : null }));
      setStatus(result.state || (locked ? "Locked" : "Saved")); setError("");
    });
  }
  const lockOwner = document?.lockedBy?.username || (String(document?.lockedBy?._id || document?.lockedBy) === String(currentUserId) ? user?.username : null);
  const readOnly = Boolean(document?.isLocked);
  const ownLock = document?.isLocked && String(document.lockedBy?._id || document.lockedBy) === String(currentUserId);

  return <div className="editor-page"><div className="editor-toolbar"><Link to="/" className="back-link"><ArrowLeft size={17}/><span>All documents</span></Link><div className="editor-title-area"><span className="doc-file-icon"><Save size={16}/></span><strong>{document?.title || "Loading document…"}</strong><span className={`save-label ${status.toLowerCase()}`}><i/>{status === "Saved" ? "All changes saved" : status === "Saving" ? "Saving changes…" : status}</span></div><div className="editor-tools"><div className="collaborator-stack" title="Active collaborators">{collaborators.slice(0, 4).map((person, index) => <span key={person.id} className={`avatar avatar-collab collab-${index}`}>{person.username?.[0]?.toUpperCase()}</span>)}{collaborators.length > 4 && <span className="avatar avatar-extra">+{collaborators.length - 4}</span>}</div><span className="collab-count"><UsersRound size={15}/>{collaborators.length}</span><span className={`connection-dot ${connected ? "online" : "offline"}`} title={connected ? "Connected" : "Disconnected"}/><button className={`button ${document?.isLocked ? "button-soft" : "button-outline"}`} onClick={toggleLock} disabled={!connected || (document?.isLocked && !ownLock)}>{document?.isLocked ? <LockKeyholeOpen size={15}/> : <LockKeyhole size={15}/>} {document?.isLocked ? ownLock ? "Unlock" : `Locked by ${lockOwner || "collaborator"}` : "Lock document"}</button></div></div>
    <div className="editor-meta"><span className={`state-badge state-${status.toLowerCase()}`}><i/>{status}</span><span className="meta-separator"/><span><Clock3 size={14}/>{lastSaved ? `Last saved ${new Intl.DateTimeFormat(undefined, {hour:"numeric",minute:"2-digit"}).format(new Date(lastSaved))}` : "Not saved yet"}</span>{readOnly && <span className="lock-notice"><LockKeyhole size={14}/> Editing is paused while {lockOwner || "a collaborator"} holds the lock.</span>}</div>
    {error && <div className="alert alert-error editor-alert">{error}</div>}
    <div className="editor-canvas"><div className="editor-paper"><div className="paper-topline"><span>DOCUMENT</span><span>{document?.title}</span></div><textarea className="document-textarea" value={content} onChange={e => edit(e.target.value)} readOnly={readOnly} placeholder="Start writing something great…" aria-label="Document content"/><div className="paper-footer"><span>{content.length.toLocaleString()} characters</span><span>{readOnly ? "Read only" : "Changes save automatically"}</span></div></div><aside className="editor-sidecard"><div className="sidecard-icon"><UsersRound size={17}/></div><h3>Working together</h3><p>Changes are shared live with everyone who has access to this document.</p><div className="sidecard-stat"><span>Document state</span><strong>{status}</strong></div><div className="sidecard-stat"><span>Connection</span><strong className={connected ? "text-green" : "text-red"}>{connected ? "Connected" : "Offline"}</strong></div><div className="sidecard-stat"><span>Access</span><strong>{document?.collaborators?.length ? "Shared" : "Private"}</strong></div><Link to={`/documents/${id}/history`} className="history-link">View document history <ArrowLeft size={14}/></Link></aside></div>
  </div>;
}
