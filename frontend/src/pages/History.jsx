import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock3 } from "lucide-react";
import { api } from "../services/api.js";

export default function History() {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [title, setTitle] = useState("Document history");
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api.get(`/documents/${id}`), api.get(`/documents/${id}/history`)]).then(([doc, log]) => { setTitle(doc.data.document.title); setHistory(log.data.history); }).catch(err => setError(err.response?.data?.message || "Could not load history")); }, [id]);
  return <div className="subpage"><Link to={`/documents/${id}`} className="back-link"><ArrowLeft size={16}/> Back to editor</Link><div className="page-heading compact"><div><div className="eyebrow">DOCUMENT ACTIVITY</div><h1>{title}</h1><p>State transitions and document changes recorded by the backend.</p></div></div>{error && <div className="alert alert-error">{error}</div>}<div className="history-list">{history.map(item => <div className="history-item" key={item._id}><span className="history-marker"><Clock3 size={15}/></span><div><strong>{item.action.replaceAll("_", " ")}</strong><p>{item.previousState} <span>→</span> {item.newState}</p></div><time>{new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.timestamp))}</time><span className="history-user">{item.userId?.username}</span></div>)}{!history.length && <div className="empty-state"><h3>No activity yet</h3><p>Changes and state transitions will appear here.</p></div>}</div></div>;
}
