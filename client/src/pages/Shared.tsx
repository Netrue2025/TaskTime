import { useEffect, useState } from "react";
import { UsersRound } from "../icons";
import type { TaskDTO } from "@tasklite/shared";
import { api } from "../api";
import { TaskCard } from "../components/TaskCard";
import { TaskDetail } from "../components/TaskDetail";

export function Shared({ user }: { user: any }) {
  const [tab, setTab] = useState<"assigned-to-me" | "assigned-by-me">("assigned-to-me"); const [tasks, setTasks] = useState<TaskDTO[]>([]); const [selected, setSelected] = useState<TaskDTO | null>(null); const [loading, setLoading] = useState(true);
  async function load() { setLoading(true); const data = await api<{ tasks: TaskDTO[] }>(`/tasks?view=${tab}`); setTasks(data.tasks); setLoading(false); }
  useEffect(() => { void load(); }, [tab]);
  async function toggle(task: TaskDTO) { await api(`/tasks/${task.id}/${task.status === "completed" ? "uncomplete" : "complete"}`, { method: "POST" }); void load(); }
  return <div className="page"><header className="page-header compact"><div><span className="eyebrow">BETTER TOGETHER</span><h1>Shared,<br /><em>made simple.</em></h1></div></header>
    <div className="segmented"><button className={tab === "assigned-to-me" ? "active" : ""} onClick={() => setTab("assigned-to-me")}>To me</button><button className={tab === "assigned-by-me" ? "active" : ""} onClick={() => setTab("assigned-by-me")}>By me</button></div>
    {loading ? <div className="skeleton-list"><i /><i /></div> : tasks.length === 0 ? <div className="empty-state"><div><UsersRound /></div><h3>{tab === "assigned-to-me" ? "Nothing assigned to you" : "Nothing delegated yet"}</h3><p>{tab === "assigned-to-me" ? "When someone shares a task, it’ll appear here." : "Assign a new task to keep work moving together."}</p></div> : <div className="task-list shared-list">{tasks.map(task => <TaskCard key={task.id} task={task} currentUserId={user.id} onToggle={() => toggle(task)} onOpen={() => setSelected(task)} />)}</div>}
    {selected && <TaskDetail task={selected} onClose={() => setSelected(null)} onCompleted={task => { setSelected(task); void load(); }} />}
  </div>;
}
