import { Router } from "express";
import mongoose from "mongoose";
import { Project, User } from "../models.js";
import { projectMemberSchema, projectSchema, projectSectionSchema, projectUpdateSchema } from "../validation.js";
import { userDTO } from "../serializers.js";

export const projectRouter = Router();
const idIsValid = (id: string) => mongoose.isValidObjectId(id);
const projectDTO = (project: any) => ({
  id: String(project._id), owner: project.ownerId?._id ? userDTO(project.ownerId) : { id: String(project.ownerId) },
  members: (project.memberIds || []).filter((member: any) => member && typeof member === "object" && member._id).map(userDTO),
  title: project.title, description: project.description, sections: project.sections.map((section: any) => ({ id: String(section._id), title: section.title, completed: section.completed, completedAt: section.completedAt?.toISOString() ?? null })),
  createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString()
});
const populate = [
  { path: "ownerId", select: "name username email" },
  { path: "memberIds", select: "name username email" }
];
const accessible = (userId: string) => ({ $or: [{ ownerId: userId }, { memberIds: userId }] });

projectRouter.get("/", async (req, res) => {
  const projects = await Project.find(accessible(req.userId)).populate(populate).sort({ updatedAt: -1 }).limit(200);
  res.json({ projects: projects.map(projectDTO) });
});

projectRouter.post("/", async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  const project = await Project.create({ ...parsed.data, ownerId: req.userId });
  await project.populate(populate);
  res.status(201).json({ project: projectDTO(project) });
});

projectRouter.get("/:id", async (req, res) => {
  if (!idIsValid(req.params.id)) return res.status(404).json({ error: "Project not found" });
  const project = await Project.findOne({ _id: req.params.id, ...accessible(req.userId) }).populate(populate);
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json({ project: projectDTO(project) });
});

projectRouter.patch("/:id", async (req, res) => {
  const parsed = projectUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  if (!idIsValid(req.params.id)) return res.status(404).json({ error: "Project not found" });
  const project = await Project.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $set: parsed.data }, { new: true, runValidators: true }).populate(populate);
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" });
  res.json({ project: projectDTO(project) });
});

projectRouter.delete("/:id", async (req, res) => {
  if (!idIsValid(req.params.id)) return res.status(404).json({ error: "Project not found" });
  const project = await Project.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" });
  res.status(204).end();
});

projectRouter.post("/:id/members", async (req, res) => {
  const parsed = projectMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid project member" });
  if (parsed.data.userId === req.userId) return res.status(400).json({ error: "You already own this project" });
  if (!idIsValid(req.params.id)) return res.status(404).json({ error: "Project not found" });
  if (!await User.exists({ _id: parsed.data.userId })) return res.status(404).json({ error: "User not found" });
  const project = await Project.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $addToSet: { memberIds: parsed.data.userId } }, { new: true }).populate(populate);
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" });
  res.json({ project: projectDTO(project) });
});

projectRouter.delete("/:id/members/:userId", async (req, res) => {
  if (!idIsValid(req.params.id) || !idIsValid(req.params.userId)) return res.status(404).json({ error: "Project or member not found" });
  const project = await Project.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $pull: { memberIds: req.params.userId } }, { new: true }).populate(populate);
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" });
  res.json({ project: projectDTO(project) });
});

projectRouter.post("/:id/sections", async (req, res) => {
  const parsed = projectSectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message });
  if (!idIsValid(req.params.id)) return res.status(404).json({ error: "Project not found" });
  const project = await Project.findOneAndUpdate({ _id: req.params.id, ownerId: req.userId }, { $push: { sections: parsed.data } }, { new: true, runValidators: true }).populate(populate);
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" });
  res.json({ project: projectDTO(project) });
});

projectRouter.patch("/:id/sections/:sectionId", async (req, res) => {
  if (!idIsValid(req.params.id) || !idIsValid(req.params.sectionId)) return res.status(404).json({ error: "Project section not found" });
  if (typeof req.body?.completed !== "boolean") return res.status(400).json({ error: "Completion status is required" });
  const project = await Project.findOne({ _id: req.params.id, ...accessible(req.userId) });
  const section = project?.sections.id(req.params.sectionId);
  if (!project || !section) return res.status(404).json({ error: "Project section not found" });
  section.completed = req.body.completed;
  section.completedAt = section.completed ? new Date() : null;
  await project.save(); await project.populate(populate);
  res.json({ project: projectDTO(project) });
});

projectRouter.delete("/:id/sections/:sectionId", async (req, res) => {
  if (!idIsValid(req.params.id) || !idIsValid(req.params.sectionId)) return res.status(404).json({ error: "Project section not found" });
  const project = await Project.findOne({ _id: req.params.id, ownerId: req.userId });
  if (!project) return res.status(404).json({ error: "Project not found or not owned by you" });
  project.sections.pull({ _id: req.params.sectionId });
  await project.save(); await project.populate(populate);
  res.json({ project: projectDTO(project) });
});
