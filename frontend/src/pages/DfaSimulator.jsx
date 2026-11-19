import { useEffect, useState } from "react";
import { Activity, Check, CircleHelp, RotateCcw, Waypoints, X } from "lucide-react";
import { api } from "../services/api.js";

const STATES = ["Idle", "Editing", "Saving", "Saved", "Locked"];
const EVENTS = ["START_EDIT", "SAVE", "SAVE_SUCCESS", "SAVE_FAILURE", "LOCK", "UNLOCK", "STOP_EDIT"];
const INITIAL = { Idle: "Ready", Editing: "Changes in progress", Saving: "Writing to MongoDB", Saved: "Persisted successfully", Locked: "Editing paused" };
const DEMO = { Idle: ["START_EDIT"], Editing: ["SAVE", "LOCK", "STOP_EDIT"], Saving: ["SAVE_SUCCESS", "SAVE_FAILURE"], Saved: ["START_EDIT", "LOCK", "STOP_EDIT"], Locked: ["UNLOCK"] };

export default function DfaSimulator() {
  const [state, setState] = useState("Idle");
  const [history, setHistory] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [event, setEvent] = useState("START_EDIT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [backend, setBackend] = useState(true);
  async function transition() {
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/automata/transition", { state, input: event, history, rejected });
      setState(data.currentState); setHistory(data.history); setRejected(data.rejected);
    } catch (err) {
      const result = err.response?.data;
      if (result?.rejected) setRejected(list => [...list, ...result.rejected].slice(-20));
      setBackend(Boolean(err.response)); setError(result?.message || "The backend DFA is unavailable");
    } finally { setBusy(false); }
  }
  function reset() { setState("Idle"); setHistory([]); setRejected([]); setError(""); setBackend(true); }
  useEffect(() => { setEvent(DEMO[state][0]); }, [state]);
  return <div className="dfa-page"><div className="page-heading"><div><div className="eyebrow">FORMAL LANGUAGES & AUTOMATA</div><h1>DFA simulator<span className="heading-period">.</span></h1><p>Explore the deterministic state machine used by the document workflow.</p></div><button className="button button-outline" onClick={reset}><RotateCcw size={15}/> Reset</button></div><div className="alert alert-info"><CircleHelp size={17}/><span>This simulator calls the same backend <code>DocumentDfa</code> transition function used to validate real document edits, saves and locks. The session below is an isolated learning trace, so it does not change a stored document.</span></div><section className="dfa-panel"><div className="dfa-panel-head"><div><h2>State transition diagram</h2><p>Select an event to apply it through the backend automaton.</p></div><span className={`backend-pill ${backend ? "connected" : "disconnected"}`}><i/>{backend ? "Backend DFA" : "Backend unavailable"}</span></div><div className="dfa-diagram"><svg className="dfa-arrows" viewBox="0 0 850 220" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#a6b2c5" strokeWidth="1.5"/></marker></defs><path d="M120 98 H265" markerEnd="url(#arrow)"/><path d="M325 98 H455" markerEnd="url(#arrow)"/><path d="M515 98 H650" markerEnd="url(#arrow)"/><path d="M490 70 Q410 5 300 70" markerEnd="url(#arrow)"/><path d="M300 130 Q200 210 155 130" markerEnd="url(#arrow)"/><path d="M300 55 Q480 5 670 65" markerEnd="url(#arrow)"/><path d="M680 135 Q510 210 325 138" markerEnd="url(#arrow)"/><text x="160" y="85">START_EDIT</text><text x="360" y="85">SAVE</text><text x="560" y="85">SAVE_SUCCESS</text><text x="376" y="30">SAVE_FAILURE</text><text x="205" y="193">STOP_EDIT</text><text x="476" y="26">LOCK</text><text x="500" y="195">UNLOCK</text></svg>{STATES.map((name, index) => <div key={name} className={`dfa-state-node node-${index} ${state === name ? "current" : ""}`}><span>{`S${index}`}</span><strong>{name}</strong>{state === name && <small>ACTIVE</small>}</div>)}</div><div className="dfa-controls"><div><label htmlFor="event-select">Input event</label><select id="event-select" value={event} onChange={e => setEvent(e.target.value)}>{EVENTS.map(item => <option key={item} value={item}>{item}</option>)}</select></div><button className="button button-primary" onClick={transition} disabled={busy}><Waypoints size={16}/>{busy ? "Checking…" : "Apply transition"}</button></div>{error && <div className="alert alert-error">{error}</div>}<div className="dfa-state-legend">{STATES.map((name, index) => <div key={name} className={state === name ? "active" : ""}><span>S{index}</span><strong>{name}</strong><small>{INITIAL[name]}</small></div>)}</div></section><div className="dfa-bottom-grid"><section className="panel trace-panel"><div className="panel-heading"><div><h2>Accepted transitions</h2><p>Transitions in the current session.</p></div><span className="trace-count accepted-count">{history.length}</span></div>{history.length ? <div className="trace-list">{[...history].reverse().map((item, i) => <div className="trace-row" key={`${item.timestamp}-${i}`}><span className="trace-check"><Check size={14}/></span><span className="trace-from">{item.from}</span><code>{item.input}</code><span className="trace-arrow">→</span><strong>{item.to}</strong></div>)}</div> : <div className="trace-empty">Apply a valid event to start the trace.</div>}</section><section className="panel trace-panel"><div className="panel-heading"><div><h2>Rejected transitions</h2><p>Events the DFA refused in this session.</p></div><span className="trace-count rejected-count">{rejected.length}</span></div>{rejected.length ? <div className="trace-list">{rejected.map((item, i) => <div className="trace-row rejected-row" key={`${item.timestamp}-${i}`}><span className="trace-cross"><X size={14}/></span><span className="trace-from">{item.from}</span><code>{item.input}</code><span className="trace-blocked">blocked</span></div>)}</div> : <div className="trace-empty">Invalid events are recorded here when rejected.</div>}</section></div><p className="dfa-source-note"><Activity size={14}/> Backend implementation: <code>backend/automata/documentDfa.js</code> · Real workflow validation: <code>backend/services/documentService.js</code></p></div>;
}
