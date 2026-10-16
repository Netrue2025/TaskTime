export function userDTO(user: any) {
  return { id: String(user._id), name: user.name, username: user.username, email: user.email };
}

export function taskDTO(task: any) {
  const owner = task.ownerId?._id ? userDTO(task.ownerId) : { id: String(task.ownerId) };
  const assignedTo = task.assignedTo?._id ? userDTO(task.assignedTo) : { id: String(task.assignedTo) };
  return {
    id: String(task._id), owner, assignedTo, title: task.title, note: task.note,
    scheduledAt: task.scheduledAt.toISOString(), timezone: task.timezone, status: task.status,
    reminderEnabled: task.reminderEnabled, completedAt: task.completedAt?.toISOString() ?? null,
    completedBy: task.completedBy ? String(task.completedBy) : null, completionMode: task.completionMode,
    createdAt: task.createdAt.toISOString()
  };
}
