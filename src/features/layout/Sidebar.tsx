import {
  Archive,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Container, ContainerType } from "../../models/types";
import { canAccess, currentUser, useAppStore } from "../../stores/appStore";

type Editor =
  | {
      mode: "create";
      parent: Container;
      type: Exclude<ContainerType, "workspace">;
    }
  | { mode: "rename"; container: Container }
  | null;

export function Sidebar({
  visibleListIds,
  mobileOpen,
  onClose,
}: {
  visibleListIds: Set<string>;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const state = useAppStore();
  const [expanded, setExpanded] = useState(true);
  const [editor, setEditor] = useState<Editor>(null);

  const spaces = state.containers.filter(
    (item) =>
      item.type === "space" && !item.archivedAt && canAccess(state, item.id),
  ).sort((a, b) => a.position - b.position);

  const admin = currentUser(state).role === "admin";
  const workspace = state.containers.find((item) => item.type === "workspace")!;

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/25 transition-opacity md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] shrink-0 flex-col border-r border-orange-100 bg-white shadow-xl transition-transform md:relative md:z-auto md:translate-x-0 md:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-orange-100 px-5">
          <img
            src="/flowboard-logo.png"
            alt="Flowboard"
            className="h-16 w-auto max-w-[180px] object-contain object-left"
          />
          <button
            className="icon-button ml-auto md:hidden"
            aria-label="Close workspace navigation"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Workspace
          </div>
          <div className="group flex items-center">
            <button
              className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-orange-50"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}{" "}
              {workspace.name}
            </button>
            {admin && (
              <button
                title="Add space"
                className="icon-button h-7 w-7 opacity-0 group-hover:opacity-100"
                onClick={() =>
                  setEditor({
                    mode: "create",
                    parent: workspace,
                    type: "space",
                  })
                }
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          {expanded && (
            <div className="ml-2 border-l border-orange-100 pl-2">
              {spaces.map((space) => (
                <TreeSpace
                  key={space.id}
                  spaceId={space.id}
                  visibleListIds={visibleListIds}
                  onEdit={setEditor}
                  admin={admin}
                />
              ))}
            </div>
          )}
        </nav>
      </aside>
      {editor && (
        <ContainerEditor editor={editor} onClose={() => setEditor(null)} />
      )}
    </>
  );
}

function TreeSpace({
  spaceId,
  visibleListIds,
  onEdit,
  admin,
}: {
  spaceId: string;
  visibleListIds: Set<string>;
  onEdit: (editor: Editor) => void;
  admin: boolean;
}) {
  const state = useAppStore();
  const space = state.containers.find((item) => item.id === spaceId)!;

  const folders = state.containers.filter(
    (item) =>
      item.parentId === spaceId &&
      item.type === "folder" &&
      !item.archivedAt &&
      canAccess(state, item.id),
  ).sort((a, b) => a.position - b.position);

  return (
    <div className="py-1">
      <TreeLabel container={space} icon="space" admin={admin} onEdit={onEdit} />
      {folders.map((folder) => (
        <div key={folder.id} className="ml-3 py-1">
          <TreeLabel
            container={folder}
            icon="folder"
            admin={admin}
            onEdit={onEdit}
          />
          {state.containers
            .filter(
              (item) =>
                item.parentId === folder.id &&
                item.type === "list" &&
                visibleListIds.has(item.id),
            )
            .sort((a, b) => a.position - b.position)
            .map((list) => (
              <TreeList
                key={list.id}
                list={list}
                admin={admin}
                onEdit={onEdit}
              />
            ))}
        </div>
      ))}
    </div>
  );
}

function TreeLabel({
  container,
  icon,
  admin,
  onEdit,
}: {
  container: Container;
  icon: "space" | "folder";
  admin: boolean;
  onEdit: (editor: Editor) => void;
}) {
  const addType = container.type === "space" ? "folder" : "list";
  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-orange-50">
      <span
        className={
          icon === "space"
            ? "h-2 w-2 rounded-full bg-orange-400"
            : "text-xs text-slate-400"
        }
      >
        {icon === "folder" ? "▣" : ""}
      </span>
      <span className="min-w-0 flex-1 truncate">{container.name}</span>
      {admin && (
        <>
          <button
            title={`Add ${addType}`}
            className="icon-button h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={() =>
              onEdit({ mode: "create", parent: container, type: addType })
            }
          >
            <Plus size={14} />
          </button>
          <ContainerMenu container={container} onEdit={onEdit} />
        </>
      )}
    </div>
  );
}

function TreeList({
  list,
  admin,
  onEdit,
}: {
  list: Container;
  admin: boolean;
  onEdit: (editor: Editor) => void;
}) {
  const state = useAppStore();
  return (
    <div
      className={`group flex items-center rounded-lg ${state.selectedListId === list.id ? "bg-orange-50 text-orange-700" : "text-slate-600 hover:bg-orange-50"}`}
    >
      <button
        onClick={() => state.setSelectedList(list.id)}
        className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm ${state.selectedListId === list.id ? "font-semibold" : ""}`}
      >
        <FileText size={14} />
        <span className="truncate">{list.name}</span>
      </button>
      {admin && <ContainerMenu container={list} onEdit={onEdit} />}
    </div>
  );
}

function ContainerMenu({
  container,
  onEdit,
}: {
  container: Container;
  onEdit: (editor: Editor) => void;
}) {
  const state = useAppStore();
  const [open, setOpen] = useState(false);

  const archive = () => {
    if (window.confirm(`Archive “${container.name}” and its contents?`))
      state.archiveContainer(container.id);
    setOpen(false);
  };

  const move = (direction: "up" | "down") => {
    state.moveContainer(container.id, direction);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        title={`${container.name} actions`}
        className="icon-button h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={() => setOpen(!open)}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-50"
            onClick={() => move("up")}
          >
            <ArrowUp size={13} /> Move up
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-50"
            onClick={() => move("down")}
          >
            <ArrowDown size={13} /> Move down
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-50"
            onClick={() => {
              onEdit({ mode: "rename", container });
              setOpen(false);
            }}
          >
            <Pencil size={13} /> Rename
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50"
            onClick={archive}
          >
            <Archive size={13} /> Archive
          </button>
        </div>
      )}
    </div>
  );
}

function ContainerEditor({
  editor,
  onClose,
}: {
  editor: Exclude<Editor, null>;
  onClose: () => void;
}) {
  const state = useAppStore();
  const initialName = editor.mode === "rename" ? editor.container.name : "";
  const [name, setName] = useState(initialName);

  const title =
    editor.mode === "rename"
      ? `Rename ${editor.container.type}`
      : `Create ${editor.type}`;

  useEffect(() => {
    const listener = (event: KeyboardEvent) =>
      event.key === "Escape" && onClose();

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const result =
      editor.mode === "rename"
        ? state.updateContainer(editor.container.id, { name })
        : state.createContainer(editor.parent.id, editor.type, name);

    if (!result.error) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
      onMouseDown={onClose}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{title}</p>
            <p className="mt-1 text-xs text-slate-500">
              {editor.mode === "create"
                ? `Inside ${editor.parent.name}`
                : "Update this workspace item."}
            </p>
          </div>
          <button
            type="button"
            className="icon-button h-8 w-8"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={17} />
          </button>
        </div>
        <label className="field-label" htmlFor="container-name">
          Name
        </label>
        <input
          id="container-name"
          autoFocus
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          placeholder="Name"
        />
        <p className="mt-1.5 text-xs text-slate-400">
          {name.length}/100 characters
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!name.trim()}>
            {editor.mode === "rename" ? "Save changes" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
