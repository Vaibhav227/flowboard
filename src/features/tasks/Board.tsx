import { useDroppable } from "@dnd-kit/core";
import type { Status, Task } from "../../models/types";
import { statusDot } from "../../components/taskPresentation";
import { TaskCard } from "./TaskCard";

export function Board({
  statuses,
  tasks,
}: {
  statuses: Status[];
  tasks: Task[];
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto md:grid-cols-3 md:overflow-x-auto md:overflow-y-visible">
      {statuses.map((status) => (
        <KanbanColumn
          key={status.id}
          status={status}
          tasks={tasks.filter((task) => task.statusId === status.id)}
        />
      ))}
    </div>
  );
}

function KanbanColumn({ status, tasks }: { status: Status; tasks: Task[] }) {
  return (
    <section className="min-w-[260px] rounded-xl bg-orange-50/70 p-3">
      <header className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span
            className={`h-2.5 w-2.5 rounded-full ${statusDot[status.color]}`}
          />
          {status.name}
          <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-medium text-slate-500">
            {tasks.length}
          </span>
        </div>
      </header>
      <div className="min-h-28 space-y-1 rounded-lg">
        {tasks.map((task, index) => (
          <div key={task.id}>
            <DropSlot id={`${status.id}:${index}`} />
            <TaskCard task={task} />
          </div>
        ))}
        <DropSlot id={`${status.id}:${tasks.length}`} />
        {tasks.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">
            Drop a task here
          </div>
        )}
      </div>
    </section>
  );
}

function DropSlot({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`h-2 rounded-md transition ${isOver ? "h-10 bg-orange-100 ring-2 ring-inset ring-orange-300" : ""}`}
      aria-label="Drop task here"
    />
  );
}
