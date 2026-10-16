import { useEffect, useState, type FormEvent } from "react";
import { Bell, CalendarDays, Search, Trash2, UserRound, X } from "../icons";
import type { TaskDTO, UserSummary } from "@tasklite/shared";
import { api } from "../api";

function localParts(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString();
}

function localFields(task?: TaskDTO | null) {
  const start = task ? new Date(task.scheduledAt) : new Date(Date.now() + 3600_000);
  const end = task ? new Date(task.endsAt) : new Date(start.getTime() + 3600_000);
  const startLocal = localParts(start); const endLocal = localParts(end);
  return { date: startLocal.slice(0, 10), startTime: startLocal.slice(11, 16), endTime: endLocal.slice(11, 16) };
}

type Props = { task?: TaskDTO | null; currentUserId: string; onClose: () => void; onSaved: (task: TaskDTO) => void; onDeleted?: () => void };

export function TaskSheet({ task, currentUserId, onClose, onSaved, onDeleted }: Props) {
  const initial = localFields(task);
  const initialAssignee = task && task.assignedTo.id !== currentUserId ? task.assignedTo : null;
  const [query, setQuery] = useState(initialAssignee?.username || ""); const [users, setUsers] = useState<UserSummary[]>([]); const [assignee, setAssignee] = useState<UserSummary | null>(initialAssignee);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (query.length < 2 || query === assignee?.username) return setUsers([]);
    const timer = setTimeout(() => api<{ users: UserSummary[] }>(`/users/search?q=${encodeURIComponent(query)}`).then(x => setUsers(x.users)), 250);
    return () => clearTimeout(timer);
  }, [query, assignee?.username]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); const values = Object.fromEntries(new FormData(event.currentTarget));
    const scheduledAt = new Date(`${values.date}T${values.startTime}`); const endsAt = new Date(`${values.date}T${values.endTime}`);
    if (endsAt <= scheduledAt) { setError("End time must be after start time"); return; }
    setBusy(true);
    const payload = { title: values.title, note: values.note, scheduledAt: scheduledAt.toISOString(), endsAt: endsAt.toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, reminderEnabled: values.reminder === "on", assigneeId: assignee?.id || currentUserId };
    try { const result = await api<{ task: TaskDTO }>(task ? `/tasks/${task.id}` : "/tasks", { method: task ? "PATCH" : "POST", body: JSON.stringify(payload) }); onSaved(result.task); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function remove() { if (!task || !confirm("Delete this task?")) return; await api(`/tasks/${task.id}`, { method: "DELETE" }); onDeleted?.(); }

  return <div className="sheet-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="task-sheet" role="dialog" aria-modal="true" aria-labelledby="task-sheet-title">
      <div className="sheet-handle" /><header><div><span className="eyebrow">{task ? "TASK DETAILS" : "MAKE IT HAPPEN"}</span><h2 id="task-sheet-title">{task ? "Edit task" : "New task"}</h2></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X /></button></header>
      <form onSubmit={save}>
        <label>What needs doing?<input name="title" defaultValue={task?.title} required autoFocus maxLength={160} placeholder="e.g. Finish presentation" /></label>
        <label><span><CalendarDays size={15} /> Date</span><input type="date" name="date" defaultValue={initial.date} required /></label>
        <div className="form-row time-row"><label>Start time<input type="time" name="startTime" defaultValue={initial.startTime} required /></label><label>End time<input type="time" name="endTime" defaultValue={initial.endTime} required /></label></div>
        <label>Note <small>Optional</small><textarea name="note" defaultValue={task?.note} maxLength={2000} rows={3} placeholder="A little context for later…" /></label>
        <label><span><UserRound size={15} /> Share with</span><div className="search-box"><Search size={17} /><input value={query} onChange={e => { setQuery(e.target.value); setAssignee(null); }} placeholder="Just me — search username or email" /></div>{users.length > 0 && <div className="search-results">{users.map(user => <button type="button" key={user.id} onClick={() => { setAssignee(user); setQuery(user.username); setUsers([]); }}><b>{user.name}</b><span>@{user.username}</span></button>)}</div>}{assignee && <button type="button" className="self-assign-btn" onClick={() => { setAssignee(null); setQuery(""); }}>Remove sharing · assign to me</button>}</label>
        <label className="switch-row"><span><Bell size={18} />Start and overdue reminders</span><input type="checkbox" name="reminder" defaultChecked={task?.reminderEnabled ?? true} /><i /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-btn" disabled={busy}>{busy ? "Saving…" : task ? "Save changes" : "Add to my day"}</button>
        {task && task.owner.id === currentUserId && <button type="button" className="danger-btn" onClick={remove}><Trash2 size={17} />Delete task</button>}
      </form>
    </section>
  </div>;
}
