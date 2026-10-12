import { Archive, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { Priority, Task } from "../../models/types";
import { statusDot } from "../../components/taskPresentation";
import { useAppStore } from "../../stores/appStore";

export function TaskDrawer({ task }: { task: Task | null }) {
  const state = useAppStore();
  const [draft, setDraft] = useState<Task | null>(task);
  const [confirmArchive, setConfirmArchive] = useState(false);
  useEffect(() => setDraft(task), [task]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) =>
      event.key === "Escape" && state.setOpenTask(null);

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [state]);

  if (!task || !draft) return null;

  const statuses = state.statuses.filter(
    (status) => status.listId === task.primaryListId,
  );

  const activity = state.activities.filter((item) => item.taskId === task.id);

  const update = <K extends keyof Task>(key: K, value: Task[K]) =>
    setDraft({ ...draft, [key]: value });

  const save = () =>
    state.updateTask(task.id, {
      title: draft.title,
      description: draft.description,
      priority: draft.priority,
      assigneeIds: draft.assigneeIds,
      dueDate: draft.dueDate,
      statusId: draft.statusId,
    });

  return (
    <div className="fixed inset-0 z-30">
      <div
        className="absolute inset-0 bg-slate-900/25"
        onClick={() => state.setOpenTask(null)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
        className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <span
              className={`h-2.5 w-2.5 rounded-full ${statusDot[statuses.find((status) => status.id === draft.statusId)?.color ?? "slate"]}`}
            />
            {
              state.containers.find((list) => list.id === task.primaryListId)
                ?.name
            }
          </div>
          <div className="flex items-center gap-1">
            <button
              className="icon-button"
              onClick={() => state.setOpenTask(null)}
              aria-label="Close task drawer"
            >
              <X size={19} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-6">
            <label className="field-label">Title</label>
            <input
              className="w-full border-0 p-0 text-2xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-xs text-slate-400">
              {draft.title.length}/500 characters
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 border-y border-slate-100 py-5 sm:grid-cols-2">
            <Field label="Status">
              <select
                className="field select-field"
                value={draft.statusId}
                onChange={(event) => update("statusId", event.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                className="field select-field"
                value={draft.priority}
                onChange={(event) =>
                  update("priority", event.target.value as Priority)
                }
              >
                {(
                  ["urgent", "high", "normal", "low", "none"] as Priority[]
                ).map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </Field>
            <Field label="Due date">
              <input
                className="field select-field"
                type="date"
                value={draft.dueDate ?? ""}
                onChange={(event) =>
                  update("dueDate", event.target.value || null)
                }
              />
            </Field>
            <Field label="Assignees">
              <select
                className="field"
                value={draft.assigneeIds[0] ?? ""}
                onChange={(event) =>
                  update(
                    "assigneeIds",
                    event.target.value ? [event.target.value] : [],
                  )
                }
              >
                <option value="">Unassigned</option>
                {state.users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-6">
            <label className="field-label">Description</label>
            <textarea
              rows={5}
              maxLength={2000}
              className="field h-32 max-h-40 resize-none overflow-y-auto leading-6"
              placeholder="Add context, links, or acceptance criteria…"
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">{draft.description.length}/2000 characters</p>
          </div>
          <section className="mt-7">
            <h3 className="mb-3 text-sm font-bold text-slate-800">Activity</h3>
            {activity.length ? (
              <ol className="space-y-3 border-l border-slate-200 pl-4">
                {activity.map((item) => (
                  <li
                    key={item.id}
                    className="relative text-sm text-slate-600 before:absolute before:-left-[19px] before:top-1.5 before:h-2 before:w-2 before:rounded-full before:bg-orange-400"
                  >
                    {item.message}
                    <span className="ml-1 text-xs text-slate-400">
                      just now
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400">No activity yet.</p>
            )}
          </section>
        </div>
        <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            onClick={() => setConfirmArchive(true)}
            className="btn text-rose-600 hover:bg-rose-50"
          >
            <Archive size={16} /> Archive
          </button>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => state.setOpenTask(null)}
            >
              Close
            </button>
            <button className="btn-primary" onClick={save}>
              Save changes
            </button>
          </div>
        </footer>
        {confirmArchive && (
          <ArchiveConfirmation
            onCancel={() => setConfirmArchive(false)}
            onConfirm={() => state.archiveTask(task.id)}
          />
        )}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function ArchiveConfirmation({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 border-t border-rose-100 bg-rose-50 px-6 py-4">
      <p className="mb-3 text-sm text-rose-800">
        Archive this task? It will be removed from the active board and list.
      </p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn bg-rose-600 text-white hover:bg-rose-700"
          onClick={onConfirm}
        >
          Archive task
        </button>
      </div>
    </div>
  );
}
