import { X } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import type { Priority } from "../../models/types";
import { useAppStore } from "../../stores/appStore";

export function CreateTaskDialog({ onClose }: { onClose: () => void }) {
  const state = useAppStore();
  const statuses = state.statuses
    .filter((status) => status.listId === state.selectedListId)
    .sort((a, b) => a.position - b.position);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statusId, setStatusId] = useState(statuses[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("none");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const result = state.createTask(state.selectedListId, title, {
      description,
      statusId,
      priority,
      assigneeIds: assigneeId ? [assigneeId] : [],
      dueDate: dueDate || null,
    });
    setBusy(false);
    if (!result.error) onClose();
  };

  return (
    <Modal title="Create task" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="field-label" htmlFor="create-task-title">
            Task title
          </label>
          <input
            id="create-task-title"
            autoFocus
            className="field"
            placeholder="What needs to be done?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={500}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            {title.length}/500 characters
          </p>
        </div>
        <div>
          <label className="field-label" htmlFor="create-task-description">
            Description
          </label>
          <textarea
            id="create-task-description"
            rows={4}
            maxLength={2000}
            className="field max-h-32 resize-none overflow-y-auto"
            placeholder="Add context or acceptance criteria…"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">
            {description.length}/2000 characters
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select
              className="field select-field"
              value={statusId}
              onChange={(event) => setStatusId(event.target.value)}
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
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
            >
              {(["urgent", "high", "normal", "low", "none"] as Priority[]).map(
                (item) => (
                  <option key={item}>{item}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Assignee">
            <select
              className="field select-field"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
            >
              <option value="">Unassigned</option>
              {state.users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Due date">
            <input
              className="field"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || !title.trim()}>
            {busy ? "Creating…" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/30 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
