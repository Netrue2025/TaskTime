import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  timezone: { type: String, required: true, default: "UTC" },
  notificationEnabled: { type: Boolean, default: false }
}, { timestamps: true });

const taskSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  note: { type: String, default: "", trim: true, maxlength: 2000 },
  scheduledAt: { type: Date, required: true, index: true },
  timezone: { type: String, required: true },
  status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending", index: true },
  reminderEnabled: { type: Boolean, default: true },
  reminderJobId: { type: String, default: null },
  completedAt: { type: Date, default: null },
  completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  completionMode: { type: String, enum: ["assignee", "owner", "owner_on_behalf", null], default: null }
}, { timestamps: true });

const remarkSchema = new Schema({
  taskId: { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true, trim: true, maxlength: 600 }
}, { timestamps: true });

const subscriptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
  userAgent: { type: String, default: "" }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Task = mongoose.model("Task", taskSchema);
export const TaskRemark = mongoose.model("TaskRemark", remarkSchema);
export const PushSubscription = mongoose.model("PushSubscription", subscriptionSchema);
