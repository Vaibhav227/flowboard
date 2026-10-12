import { create } from "zustand";
import {
  activities as seededActivities,
  containers as seededContainers,
  grants,
  statuses as seededStatuses,
  tasks as seededTasks,
  users,
} from "../models/fixtures";
import type {
  Activity,
  AppError,
  Container,
  Result,
  Status,
  Task,
  User,
} from "../models/types";
import { canAccessContainer, isValidChild } from "../services/access";

type View = "board" | "list";
type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "priority"
    | "assigneeIds"
    | "dueDate"
    | "statusId"
  >
>;
type ContainerPatch = Partial<Pick<Container, "name" | "visibility">>;
type CreateTaskOptions = Partial<Pick<Task, "description" | "priority" | "assigneeIds" | "dueDate" | "statusId">>;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const now = () => new Date().toISOString();

interface AppState {
  users: User[];
  containers: Container[];
  statuses: Status[];
  tasks: Task[];
  grants: typeof grants;
  activities: Activity[];
  currentUserId: string;
  selectedListId: string;
  view: View;
  openTaskId: string | null;
  simulateFailures: boolean;
  lastError: AppError | null;
  notice: string | null;
  setCurrentUser: (id: string) => void;
  setSelectedList: (id: string) => Result;
  setView: (view: View) => void;
  setOpenTask: (id: string | null) => void;
  setSimulateFailures: (value: boolean) => void;
  clearNotice: () => void;
  reset: () => void;
  createTask: (listId: string, title: string, options?: CreateTaskOptions) => Result<Task>;
  updateTask: (id: string, patch: TaskPatch) => Result<Task>;
  archiveTask: (id: string) => Result;
  moveTask: (id: string, statusId: string, position: number) => Result;
  bulkUpdateTasks: (ids: string[], patch: Pick<TaskPatch, "statusId" | "assigneeIds">) => Result;
  createContainer: (
    parentId: string,
    type: Exclude<Container["type"], "workspace">,
    name: string,
  ) => Result<Container>;
  updateContainer: (id: string, patch: ContainerPatch) => Result<Container>;
  archiveContainer: (id: string) => Result;
  moveContainer: (id: string, direction: "up" | "down") => Result;
}

const initial = () => ({
  users: clone(users),
  containers: clone(seededContainers),
  statuses: clone(seededStatuses),
  tasks: clone(seededTasks),
  grants: clone(grants),
  activities: clone(seededActivities),
  currentUserId: "alice",
  selectedListId: "launch",
  view: "board" as View,
  openTaskId: null,
  simulateFailures: false,
  lastError: null,
  notice: null,
});

const persistKey = "flowboard-state-v1";

const saved =
  typeof window !== "undefined"
    ? window.localStorage.getItem(persistKey)
    : null;

const fromStorage = saved
  ? (() => {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    })()
  : null;

const save = (state: AppState) => {
  if (typeof window !== "undefined")
    window.localStorage.setItem(
      persistKey,
      JSON.stringify({
        tasks: state.tasks,
        containers: state.containers,
        activities: state.activities,
      }),
    );
};

export const useAppStore = create<AppState>((set, get) => ({
  ...initial(),
  ...(fromStorage
    ? {
        tasks: fromStorage.tasks ?? seededTasks,
        containers: fromStorage.containers ?? seededContainers,
        activities: fromStorage.activities ?? seededActivities,
      }
    : {}),
  setCurrentUser: (currentUserId) => {
    const state = get();

    const nextList =
      selectVisibleLists({ ...state, currentUserId })[0]?.id ?? "";

    set({
      currentUserId,
      selectedListId: nextList,
      openTaskId: null,
      lastError: null,
    });
  },
  setSelectedList: (id) => {
    const state = get();
    if (!canAccess(state, id))
      return fail(set, "You do not have access to this list.");
    set({ selectedListId: id, lastError: null });
    return { data: undefined };
  },
  setView: (view) => set({ view }),
  setOpenTask: (openTaskId) => set({ openTaskId }),
  setSimulateFailures: (simulateFailures) => set({ simulateFailures }),
  clearNotice: () => set({ notice: null, lastError: null }),
  reset: () => {
    window.localStorage.removeItem(persistKey);
    set(initial());
  },
  createTask: (listId, title, options = {}) => {
    const state = get();
    if (!canAccess(state, listId))
      return fail(set, "You cannot create tasks in this list.");
    if (!title.trim() || title.length > 500)
      return fail(set, "Task title must be between 1 and 500 characters.", 422);
    if (shouldFail(state))
      return fail(set, "Simulated network failure. Please retry.", 503);

    const status = state.statuses
      .filter((item) => item.listId === listId)
      .sort((a, b) => a.position - b.position)[0];

    if (!status) return fail(set, "This list has no statuses.", 422);
    if (options.statusId && !state.statuses.some((item) => item.id === options.statusId && item.listId === listId)) return fail(set, "A task may only use a status defined on its list.", 422);

    const task: Task = {
      id: crypto.randomUUID(),
      primaryListId: listId,
      title: title.trim(),
      description: options.description ?? "",
      statusId: options.statusId ?? status.id,
      priority: options.priority ?? "none",
      assigneeIds: options.assigneeIds ?? [],
      dueDate: options.dueDate ?? null,
      position: state.tasks.filter((item) => item.statusId === status.id)
        .length,
      createdAt: now(),
      updatedAt: now(),
      deletedAt: null,
    };

    const next = {
      tasks: [...state.tasks, task],
      notice: "Task created",
      lastError: null,
    };

    set(next);
    save(get());
    return { data: task };
  },
  updateTask: (id, patch) => {
    const state = get();
    const current = state.tasks.find((item) => item.id === id);
    if (!current) return fail(set, "Task not found.", 404);
    if (!canAccess(state, current.primaryListId))
      return fail(set, "You cannot update this task.");
    if (
      patch.title !== undefined &&
      (!patch.title.trim() || patch.title.length > 500)
    )
      return fail(set, "Task title must be between 1 and 500 characters.", 422);
    if (
      patch.statusId &&
      !state.statuses.some(
        (item) =>
          item.id === patch.statusId && item.listId === current.primaryListId,
      )
    )
      return fail(
        set,
        "A task may only use a status defined on its list.",
        422,
      );
    if (shouldFail(state))
      return fail(
        set,
        "Simulated network failure. Changes were not saved.",
        503,
      );

    const updated = {
      ...current,
      ...patch,
      title: patch.title?.trim() ?? current.title,
      updatedAt: now(),
    };

    set({
      tasks: state.tasks.map((item) => (item.id === id ? updated : item)),
      notice: "Task updated",
      lastError: null,
    });

    save(get());
    return { data: updated };
  },
  archiveTask: (id) => {
    const state = get();
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return fail(set, "Task not found.", 404);
    if (!canAccess(state, task.primaryListId))
      return fail(set, "You cannot archive this task.");

    set({
      tasks: state.tasks.map((item) =>
        item.id === id ? { ...item, deletedAt: now() } : item,
      ),
      openTaskId: null,
      notice: "Task archived",
      lastError: null,
    });

    save(get());
    return { data: undefined };
  },
  moveTask: (id, statusId, position) => {
    const state = get();
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return fail(set, "Task not found.", 404);
    if (!canAccess(state, task.primaryListId))
      return fail(set, "You cannot move this task.");
    if (
      !state.statuses.some(
        (item) => item.id === statusId && item.listId === task.primaryListId,
      )
    )
      return fail(set, "Invalid status for this list.", 422);
    if (shouldFail(state))
      return fail(
        set,
        "Simulated move failure. The task was returned to its original place.",
        503,
      );
    const without = state.tasks.filter((item) => item.id !== id);

    const inTarget = without
      .filter((item) => item.statusId === statusId && !item.deletedAt)
      .sort((a, b) => a.position - b.position);

    inTarget.splice(Math.min(position, inTarget.length), 0, {
      ...task,
      statusId,
      position,
      updatedAt: now(),
    });

    const ids = new Map(inTarget.map((item, index) => [item.id, index]));

    const tasks = without
      .map((item) =>
        ids.has(item.id) ? { ...item, position: ids.get(item.id)! } : item,
      )
      .concat(
        inTarget
          .filter((item) => item.id === id)
          .map((item) => ({ ...item, position: ids.get(item.id)! })),
      );

    const activity: Activity = {
      id: crypto.randomUUID(),
      taskId: id,
      message: `${state.users.find((u) => u.id === state.currentUserId)?.name.split(" ")[0]} moved this task`,
      createdAt: now(),
    };

    set({
      tasks,
      activities: [activity, ...state.activities],
      notice: "Task moved",
      lastError: null,
    });

    save(get());
    return { data: undefined };
  },
  bulkUpdateTasks: (ids, patch) => {
    const state = get();
    const selected = state.tasks.filter((task) => ids.includes(task.id) && !task.deletedAt);
    if (!selected.length) return fail(set, "Select at least one task.", 422);
    if (selected.some((task) => !canAccess(state, task.primaryListId))) return fail(set, "You cannot update one or more selected tasks.");
    if (patch.statusId && selected.some((task) => !state.statuses.some((status) => status.id === patch.statusId && status.listId === task.primaryListId))) return fail(set, "The selected tasks must belong to the same list to change status.", 422);
    if (shouldFail(state)) return fail(set, "Simulated network failure. Changes were not saved.", 503);
    const updatedAt = now();
    set({ tasks: state.tasks.map((task) => ids.includes(task.id) ? { ...task, ...patch, updatedAt } : task), notice: `${selected.length} tasks updated`, lastError: null });
    save(get());
    return { data: undefined };
  },
  createContainer: (parentId, type, name) => {
    const state = get();
    const parent = state.containers.find((item) => item.id === parentId);
    if (currentUser(state).role !== "admin")
      return fail(set, "Only workspace admins can manage containers.");
    if (!isValidChild(parent, type))
      return fail(set, `A ${type} cannot be created in this location.`, 422);
    if (!name.trim() || name.trim().length > 100)
      return fail(set, "Container name must be between 1 and 100 characters.", 422);
    if (shouldFail(state))
      return fail(set, "Simulated network failure. Container was not created.", 503);

    const container: Container = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      parentId,
      position: state.containers.filter((item) => item.parentId === parentId && !item.archivedAt).length,
      visibility: "public",
      archivedAt: null,
    };

    const statuses = type === "list" ? [
      { id: `${container.id}-todo`, listId: container.id, name: "To do", category: "not_started" as const, color: "slate", position: 0 },
      { id: `${container.id}-progress`, listId: container.id, name: "In progress", category: "active" as const, color: "orange", position: 1 },
      { id: `${container.id}-done`, listId: container.id, name: "Done", category: "completed" as const, color: "emerald", position: 2 },
    ] : [];

    set({ containers: [...state.containers, container], statuses: [...state.statuses, ...statuses], selectedListId: type === "list" ? container.id : state.selectedListId, notice: `${type[0].toUpperCase() + type.slice(1)} created`, lastError: null });
    save(get());
    return { data: container };
  },
  updateContainer: (id, patch) => {
    const state = get(); const container = state.containers.find((item) => item.id === id);
    if (!container) return fail(set, "Container not found.", 404);
    if (container.type === "workspace") return fail(set, "The workspace name is fixed for this demo.", 422);
    if (currentUser(state).role !== "admin") return fail(set, "Only workspace admins can manage containers.");
    if (patch.name !== undefined && (!patch.name.trim() || patch.name.trim().length > 100)) return fail(set, "Container name must be between 1 and 100 characters.", 422);
    if (shouldFail(state)) return fail(set, "Simulated network failure. Changes were not saved.", 503);
    const updated = { ...container, ...patch, name: patch.name?.trim() ?? container.name };
    set({ containers: state.containers.map((item) => item.id === id ? updated : item), notice: "Container updated", lastError: null }); save(get()); return { data: updated };
  },
  archiveContainer: (id) => {
    const state = get(); const container = state.containers.find((item) => item.id === id);
    if (!container) return fail(set, "Container not found.", 404);
    if (container.type === "workspace") return fail(set, "The workspace cannot be archived.", 422);
    if (currentUser(state).role !== "admin") return fail(set, "Only workspace admins can manage containers.");
    const descendants = new Set<string>([id]); let changed = true;

    while (changed) { changed = false; state.containers.forEach((item) => { if (item.parentId && descendants.has(item.parentId) && !descendants.has(item.id)) { descendants.add(item.id); changed = true } }) }

    const nextVisibleList = state.containers.find((item) => item.type === "list" && !descendants.has(item.id) && !item.archivedAt && canAccess(state, item.id));
    set({ containers: state.containers.map((item) => descendants.has(item.id) ? { ...item, archivedAt: now() } : item), selectedListId: descendants.has(state.selectedListId) ? nextVisibleList?.id ?? "" : state.selectedListId, openTaskId: null, notice: "Container archived", lastError: null }); save(get()); return { data: undefined };
  },
  moveContainer: (id, direction) => {
    const state = get(); const container = state.containers.find((item) => item.id === id);
    if (!container) return fail(set, "Container not found.", 404);
    if (container.type === "workspace") return fail(set, "The workspace cannot be reordered.", 422);
    if (currentUser(state).role !== "admin") return fail(set, "Only workspace admins can manage containers.");
    const siblings = state.containers.filter((item) => item.parentId === container.parentId && !item.archivedAt).sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((item) => item.id === id); const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= siblings.length) return { data: undefined };
    [siblings[index], siblings[target]] = [siblings[target], siblings[index]];
    const positions = new Map(siblings.map((item, position) => [item.id, position]));
    set({ containers: state.containers.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id)! } : item), notice: "Container reordered", lastError: null }); save(get()); return { data: undefined };
  },
}));

const shouldFail = (state: AppState) => state.simulateFailures;

const fail = (
  set: (partial: Partial<AppState>) => void,
  message: string,
  code = 403,
): Result<never> => {
  const e = { code, message };
  set({ lastError: e, notice: null });
  return { error: e };
};

export const currentUser = (state: AppState) =>
  state.users.find((item) => item.id === state.currentUserId)!;
export const canAccess = (state: AppState, id: string) =>
  canAccessContainer(currentUser(state), id, state.containers, state.grants);
export const selectVisibleLists = (state: AppState) =>
  state.containers
    .filter(
      (item) =>
        item.type === "list" && !item.archivedAt && canAccess(state, item.id),
    )
    .sort((a, b) => a.position - b.position);
export const selectTasks = (state: AppState, listId = state.selectedListId) =>
  canAccess(state, listId)
    ? state.tasks
        .filter((item) => item.primaryListId === listId && !item.deletedAt)
        .sort((a, b) => a.position - b.position)
    : [];

export const selectContainerPath = (state: AppState, id: string) => {
  const byId = new Map(state.containers.map((item) => [item.id, item]));
  const path: Container[] = [];
  let current = byId.get(id);

  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
};
