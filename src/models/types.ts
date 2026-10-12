export type ContainerType = "workspace" | "space" | "folder" | "list";
export type Priority = "urgent" | "high" | "normal" | "low" | "none";
export type Role = "admin" | "member";
export type Mode = "allow" | "deny";
export type StatusCategory = "not_started" | "active" | "completed";

export interface User {
  id: string;
  name: string;
  initials: string;
  role: Role;
  color: string;
}
export interface Container {
  id: string;
  name: string;
  type: ContainerType;
  parentId: string | null;
  position: number;
  visibility: "public" | "private";
  archivedAt: string | null;
}
export interface Status {
  id: string;
  listId: string;
  name: string;
  category: StatusCategory;
  color: string;
  position: number;
}
export interface Task {
  id: string;
  primaryListId: string;
  title: string;
  description: string;
  statusId: string;
  priority: Priority;
  assigneeIds: string[];
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
export interface Grant {
  id: string;
  resourceId: string;
  userId: string;
  mode: Mode;
}
export interface Activity {
  id: string;
  taskId: string;
  message: string;
  createdAt: string;
}
export interface AppError {
  code: number;
  message: string;
}
export type Result<T = void> =
  { data: T; error?: never } | { data?: never; error: AppError };
