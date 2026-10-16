import { useEffect, useMemo, useState } from "react";
import { Bell, Plus, Share2, Sparkles } from "../icons";
import type { ProgressResponse, TaskDTO } from "@tasklite/shared";
import { api } from "../api";
import { TaskCard } from "../components/TaskCard";
import { TaskSheet } from "../components/TaskSheet";
import { TaskDetail } from "../components/TaskDetail";
import { progressCardCopy } from "../progressCard";

export function Today({ user }: { user: any }) {
  const [tasks, setTasks] = useState<TaskDTO[]>([]); const [progress, setProgress] = useState<ProgressResponse | null>(null); const [sheet, setSheet] = useState<false | null | TaskDTO>(false); const [detail, setDetail] = useState<TaskDTO | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const bounds = useMemo(() => { const now = new Date(); return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, -1).toISOString() }; }, []);
  async function load() { try { const [t, p] = await Promise.all([api<{ tasks: TaskDTO[] }>(`/tasks?view=today&start=${bounds.start}&end=${bounds.end}`), api<ProgressResponse>("/progress/daily")]); setTasks(t.tasks); setProgress(p); } catch (e: any) { setError(e.message); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function toggle(task: TaskDTO) { const old = tasks; setTasks(tasks.map(t => t.id === task.id ? { ...t, status: task.status === "completed" ? "pending" : "completed" } : t)); try { await api(`/tasks/${task.id}/${task.status === "completed" ? "uncomplete" : "complete"}`, { method: "POST" }); await load(); } catch { setTasks(old); } }
  async function share() {
    if (!progress) return; const copy = progressCardCopy(progress, new Date()); const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1080; const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1f4b3f"; ctx.fillRect(0, 0, 1080, 1080); ctx.fillStyle = "#d8f56a"; ctx.beginPath(); ctx.arc(900, 130, 260, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "700 46px system-ui"; ctx.fillText("TASKLITE", 90, 120); ctx.font = "600 56px system-ui"; ctx.fillText(copy.headline, 90, 360); ctx.font = "800 210px system-ui"; ctx.fillText(copy.percentage, 80, 590); ctx.font = "500 42px system-ui"; ctx.fillText(copy.count, 90, 700); ctx.font = "400 34px system-ui"; ctx.fillStyle = "#c9d8d1"; ctx.fillText(copy.date, 90, 950);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png")); if (!blob) return; const file = new File([blob], "tasklite-progress.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "My TaskLite progress" }); else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); URL.revokeObjectURL(a.href); }
  }
  return <div className="page today-page"><header className="page-header"><div><span className="eyebrow">{new Intl.DateTimeFormat([], { weekday: "long" }).format(new Date()).toUpperCase()}</span><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},<br /><em>{user.name.split(" ")[0]}.</em></h1></div><button className="icon-btn notification-dot" aria-label="Notifications"><Bell /></button></header>
    <section className={`progress-hero ${progress?.status || ""}`}><div><span className="eyebrow">TODAY’S RHYTHM</span><strong>{progress?.percentage == null ? "—" : `${progress.percentage}%`}</strong><p>{progress?.total ? `${progress.completed} of ${progress.total} done` : "Your day is wide open"}</p></div><div className="status-pill"><Sparkles size={15} />{progress?.status === "passed" ? "Passed" : progress?.status === "keep-going" ? "Keep going" : "No score yet"}</div><button onClick={share} aria-label="Share progress"><Share2 size={19} /></button></section>
    <div className="section-heading"><div><span className="eyebrow">YOUR DAY</span><h2>{tasks.length ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}` : "Ready when you are"}</h2></div></div>
    {loading ? <div className="skeleton-list"><i /><i /><i /></div> : error ? <p className="form-error">{error}</p> : tasks.length === 0 ? <div className="empty-state"><div>✓</div><h3>Nothing on the list</h3><p>Add one meaningful thing. That’s enough to begin.</p><button className="secondary-btn" onClick={() => setSheet(null)}><Plus size={18} />Add a task</button></div> : <div className="task-list">{tasks.map(task => <TaskCard key={task.id} task={task} currentUserId={user.id} onToggle={() => toggle(task)} onOpen={() => task.owner.id === user.id ? setSheet(task) : setDetail(task)} />)}</div>}
    <button className="fab" onClick={() => setSheet(null)} aria-label="Add task"><Plus /></button>
    {sheet !== false && <TaskSheet task={sheet} currentUserId={user.id} onClose={() => setSheet(false)} onSaved={() => { setSheet(false); void load(); }} onDeleted={() => { setSheet(false); void load(); }} />}
    {detail && <TaskDetail task={detail} onClose={() => setDetail(null)} onCompleted={() => { setDetail(null); void load(); }} />}
  </div>;
}
