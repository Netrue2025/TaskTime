import { useEffect, useState, type FormEvent } from "react";
import { Bell, CalendarDays, Search, Trash2, UserRound, X } from "../icons";
import type { TaskDTO, UserSummary } from "@tasklite/shared";
import { api } from "../api";

function localFields(date = new Date(Date.now() + 3600_000)) {
  const offset = date.getTimezoneOffset() * 60_000; const local = new Date(date.getTime() - offset).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

export function TaskSheet({ task, onClose, onSaved, onDeleted }: { task?: TaskDTO | null; onClose: () => void; onSaved: (task: TaskDTO) => void; onDeleted?: () => void }) {
  const initial = task ? localFields(new Date(task.scheduledAt)) : localFields();
  const [query, setQuery] = useState(""); const [users, setUsers] = useState<UserSummary[]>([]); const [assignee, setAssignee] = useState<UserSummary | null>(task?.assignedTo || null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (query.length < 2) return setUsers([]); const timer = setTimeout(() => api<{ users: UserSummary[] }>(`/users/search?q=${encodeURIComponent(query)}`).then(x => setUsers(x.users)), 250); return () => clearTimeout(timer); }, [query]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const values = Object.fromEntries(new FormData(event.currentTarget));
    const scheduledAt = new Date(`${values.date}T${values.time}`).toISOString();
    const payload = { title: values.title, note: values.note, scheduledAt, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, reminderEnabled: values.reminder === "on", ...(assignee ? { assigneeId: assignee.id } : {}) };
    try { const result = await api<{ task: TaskDTO }>(task ? `/tasks/${task.id}` : "/tasks", { method: task ? "PATCH" : "POST", body: JSON.stringify(payload) }); onSaved(result.task); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function remove() { if (!task || !confirm("Delete this task?")) return; await api(`/tasks/${task.id}`, { method: "DELETE" }); onDeleted?.(); }
  return <div className="sheet-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="task-sheet" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title">
      <div className="sheet-handle" /><header><div><span className="eyebrow">{task ? "TASK DETAILS" : "MAKE IT HAPPEN"}</span><h2 id="task-sheet-title">{task ? "Edit task" : "New task"}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></header>
      <form onSubmit={save}>
        <label>What needs doing?<input name="title" defaultValue={task?.title} required autoFocus maxLength={160} placeholder="e.g. Finish presentation" /></label>
        <div className="form-row"><label><span><CalendarDays size={15} /> Date</span><input type="date" name="date" defaultValue={initial.date} required /></label><label>Time<input type="time" name="time" defaultValue={initial.time} required /></label></div>
        <label>Note <small>Optional</small><textarea name="note" defaultValue={task?.note} maxLength={2000} rows={3} placeholder="A little context for later…" /></label>
        {!task && <label><span><UserRound size={15} /> Assign</span><div className="search-box"><Search size={17} /><input value={query} onChange={e => { setQuery(e.target.value); setAssignee(null); }} placeholder={assignee ? assignee.name : "Just me — search username or email"} /></div>{users.length > 0 && <div className="search-results">{users.map(user => <button type="button" key={user.id} onClick={() => { setAssignee(user); setQuery(user.username); setUsers([]); }}><b>{user.name}</b><span>@{user.username}</span></button>)}</div>}</label>}
        <label className="switch-row"><span><Bell size={18} />Remind me at task time</span><input type="checkbox" name="reminder" defaultChecked={task?.reminderEnabled ?? true} /><i /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-btn" disabled={busy}>{busy ? "Saving…" : task ? "Save changes" : "Add to my day"}</button>
        {task && task.owner.id === task.assignedTo.id && <button type="button" className="danger-btn" onClick={remove}><Trash2 size={17} />Delete task</button>}
      </form>
    </section>
  </div>;
}
