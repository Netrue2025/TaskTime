import { Check, Clock3, MoreHorizontal, UserRound } from "../icons";
import type { TaskDTO } from "@tasklite/shared";

export function TaskCard({ task, currentUserId, onToggle, onOpen }: { task: TaskDTO; currentUserId: string; onToggle: () => void; onOpen: () => void }) {
  const done = task.status === "completed"; const overdue = !done && new Date(task.scheduledAt) < new Date();
  const delegated = task.owner.id !== task.assignedTo.id;
  return <article className={`task-card ${done ? "done" : ""}`}>
    <button className="check-button" onClick={onToggle} aria-label={done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`} aria-pressed={done}>{done && <Check size={17} strokeWidth={3} />}</button>
    <button className="task-content" onClick={onOpen}>
      <span className="task-title">{task.title}</span>
      <span className="task-meta"><Clock3 size={14} />{new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(task.scheduledAt))}{overdue && <b className="overdue">Overdue</b>}</span>
      {delegated && <span className="task-meta"><UserRound size={14} />{task.owner.id === currentUserId ? `For ${task.assignedTo.name}` : `From ${task.owner.name}`}</span>}
      {task.note && <span className="task-note">{task.note}</span>}
    </button>
    <button className="icon-btn" onClick={onOpen} aria-label={`Open ${task.title}`}><MoreHorizontal size={20} /></button>
  </article>;
}
