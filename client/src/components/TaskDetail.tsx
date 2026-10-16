import { useEffect, useState, type FormEvent } from "react";
import { Check, MessageCircle, Send, X } from "../icons";
import type { TaskDTO, UserSummary } from "@tasklite/shared";
import { api } from "../api";

type Remark = { id: string; user?: UserSummary; message: string; createdAt: string };
export function TaskDetail({ task, onClose, onCompleted }: { task: TaskDTO; onClose: () => void; onCompleted: (task: TaskDTO) => void }) {
  const [remarks, setRemarks] = useState<Remark[]>([]); const [error, setError] = useState("");
  useEffect(() => { api<{ remarks: Remark[] }>(`/tasks/${task.id}/remarks`).then(x => setRemarks(x.remarks)).catch(e => setError(e.message)); }, [task.id]);
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const message = String(new FormData(form).get("message") || ""); try { const { remark } = await api<{ remark: Remark }>(`/tasks/${task.id}/remarks`, { method: "POST", body: JSON.stringify({ message }) }); setRemarks([...remarks, remark]); form.reset(); } catch (e: any) { setError(e.message); } }
  async function complete() { const { task: updated } = await api<{ task: TaskDTO }>(`/tasks/${task.id}/${task.status === "completed" ? "uncomplete" : "complete"}`, { method: "POST" }); onCompleted(updated); }
  return <div className="sheet-backdrop"><section className="task-sheet detail-sheet" role="dialog" aria-modal="true"><div className="sheet-handle" /><header><div><span className="eyebrow">SHARED TASK</span><h2>{task.title}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></header>
    <div className="detail-time">{new Intl.DateTimeFormat([], { weekday: "long", month: "long", day: "numeric" }).format(new Date(task.scheduledAt))} · {new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(task.scheduledAt))}–{new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(task.endsAt))}</div>
    <div className="people-row"><div><span>From</span><b>{task.owner.name}</b></div><div><span>Responsible</span><b>{task.assignedTo.name}</b></div></div>
    {task.status === "completed" && task.completedByUser && <div className="completion-banner"><Check size={16} />Completed by {task.completedByUser.name}</div>}
    {task.note && <div className="note-panel">{task.note}</div>}
    <button className="primary-btn" onClick={complete}><Check size={18} />{task.status === "completed" ? "Mark incomplete" : task.owner.id !== task.assignedTo.id ? "Complete task" : "Mark complete"}</button>
    <div className="remarks"><h3><MessageCircle size={18} /> Remarks <span>{remarks.length}</span></h3>{remarks.length === 0 ? <p className="empty-small">No remarks yet. Add context or a quick update.</p> : remarks.map(r => <div className="remark" key={r.id}><b>{r.user?.name || "You"}</b><p>{r.message}</p><time>{new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(r.createdAt))}</time></div>)}</div>
    <form className="remark-form" onSubmit={send}><input name="message" required maxLength={600} placeholder="Add a remark…" /><button aria-label="Send remark"><Send size={18} /></button></form>{error && <p className="form-error">{error}</p>}
  </section></div>;
}
