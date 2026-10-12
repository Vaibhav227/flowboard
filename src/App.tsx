import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ChevronRight, LayoutGrid, List, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Toasts } from "./components/Toasts";
import { LoadingState } from "./components/LoadingState";
import { Sidebar } from "./features/layout/Sidebar";
import { Topbar } from "./features/layout/Topbar";
import { Board } from "./features/tasks/Board";
import { CreateTaskDialog } from "./features/tasks/CreateTaskDialog";
import { TaskCard } from "./features/tasks/TaskCard";
import { TaskDrawer } from "./features/tasks/TaskDrawer";
import { TaskList } from "./features/tasks/TaskList";
import {
  selectContainerPath,
  selectTasks,
  selectVisibleLists,
  useAppStore,
} from "./stores/appStore";

export function App() {
  const state = useAppStore();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const lists = selectVisibleLists(state);

  const activeList = state.containers.find(
    (item) => item.id === state.selectedListId,
  );

  const breadcrumb = selectContainerPath(state, state.selectedListId).filter(
    (item) => item.type !== "workspace" && item.type !== "list",
  );

  const tasks = useMemo(
    () =>
      selectTasks(state).filter((task) =>
        `${task.title} ${task.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [state, search],
  );

  const statuses = state.statuses
    .filter((status) => status.listId === state.selectedListId)
    .sort((a, b) => a.position - b.position);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [state.selectedListId, state.view]);

  useEffect(() => {
    if (!state.notice && !state.lastError) return;
    const timer = window.setTimeout(state.clearNotice, 3500);
    return () => window.clearTimeout(timer);
  }, [state.notice, state.lastError]);

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedTaskId(null);
    const target = String(event.over?.id ?? "");
    if (!target) return;
    const [statusId, position] = target.split(":");
    state.moveTask(String(event.active.id), statusId, Number(position));
  };

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          visibleListIds={new Set(lists.map((list) => list.id))}
          mobileOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <Topbar
            search={search}
            onSearchChange={setSearch}
            onMenuOpen={() => setMobileSidebarOpen(true)}
          />
          <section className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5">
            <header className="mb-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
                  {breadcrumb.map((container, index) => (
                    <div className="flex items-center gap-2" key={container.id}>
                      {index > 0 && <ChevronRight size={14} />}
                      <span>{container.name}</span>
                    </div>
                  ))}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {activeList?.name ?? "No accessible list"}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {tasks.length} tasks · Keep your launch moving.
                </p>
              </div>
              <button
                className="btn-primary self-start sm:self-auto"
                onClick={() => setCreateOpen(true)}
                disabled={!activeList}
              >
                <Plus size={16} /> Add task
              </button>
            </header>
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => state.setView("board")}
                  className={`focus:ring-0 btn py-1.5 ${state.view === "board" ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}
                >
                  <LayoutGrid size={15} /> Board
                </button>
                <button
                  onClick={() => state.setView("list")}
                  className={`focus:ring-0 btn py-1.5 ${state.view === "list" ? "bg-slate-100 text-slate-900" : "text-slate-500"}`}
                >
                  <List size={15} /> List
                </button>
              </div>
            </div>
            {isLoading ? (
              <LoadingState label="Loading tasks" />
            ) : state.view === "board" ? (
              <DndContext
                sensors={sensors}
                onDragStart={(event) =>
                  setDraggedTaskId(String(event.active.id))
                }
                onDragEnd={handleDragEnd}
              >
                <Board statuses={statuses} tasks={tasks} />
                <DragOverlay>
                  {draggedTaskId && (
                    <TaskCard
                      task={tasks.find((task) => task.id === draggedTaskId)!}
                      overlay
                    />
                  )}
                </DragOverlay>
              </DndContext>
            ) : (
              <TaskList tasks={tasks} />
            )}
          </section>
        </main>
      </div>
      {isCreateOpen && (
        <CreateTaskDialog onClose={() => setCreateOpen(false)} />
      )}
      <TaskDrawer
        task={state.tasks.find((task) => task.id === state.openTaskId) ?? null}
      />
      <Toasts />
    </div>
  );
}
