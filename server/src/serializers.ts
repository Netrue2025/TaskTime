export function userDTO(user: any) {
  return { id: String(user._id), name: user.name, username: user.username, email: user.email };
}

export function taskDTO(task: any) {
  const owner = task.ownerId?._id ? userDTO(task.ownerId) : { id: String(task.ownerId) };
  const assignedTo = task.assignedTo?._id ? userDTO(task.assignedTo) : { id: String(task.assignedTo) };
  const completedByUser = task.completedBy?._id ? userDTO(task.completedBy) : null;
  const completedBy = task.completedBy?._id ? String(task.completedBy._id) : task.completedBy ? String(task.completedBy) : null;
  const endsAt = task.endsAt instanceof Date ? task.endsAt : new Date(task.scheduledAt.getTime() + 60 * 60 * 1000);
  return {
    id: String(task._id), owner, assignedTo, title: task.title, note: task.note,
    scheduledAt: task.scheduledAt.toISOString(), endsAt: endsAt.toISOString(), timezone: task.timezone, status: task.status,
    reminderEnabled: task.reminderEnabled, completedAt: task.completedAt?.toISOString() ?? null,
    completedBy, completedByUser, completionMode: task.completionMode,
    createdAt: task.createdAt.toISOString()
  };
}
