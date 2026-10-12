import { useDraggable } from "@dnd-kit/core";
import { GripVertical, MoreHorizontal } from "lucide-react";
import type { Task } from "../../models/types";
import { useAppStore } from "../../stores/appStore";
import { priorityStyle, shortDate } from "../../components/taskPresentation";

export function TaskCard({
  task,
  overlay = false,
}: {
  task: Task;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  const state = useAppStore();

  const assignees = state.users.filter((user) =>
    task.assigneeIds.includes(user.id),
  );

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={() => state.setOpenTask(task.id)}
      className={`group rounded-xl border border-orange-100 bg-white p-3 shadow-card transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md ${isDragging ? "opacity-35" : ""} ${overlay ? "rotate-2 shadow-xl" : ""}`}
    >
      <div className="mb-2 flex items-start gap-1">
        <button
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          className="mt-0.5 cursor-grab text-slate-300 opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <h3 className="flex-1 text-sm font-semibold leading-5 text-slate-800">
          {task.title}
        </h3>
        <button
          onClick={(event) => {
            event.stopPropagation();
            state.setOpenTask(task.id);
          }}
          className="text-slate-300 opacity-0 transition hover:text-slate-700 group-hover:opacity-100"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ${priorityStyle[task.priority]}`}
        >
          {task.priority}
        </span>
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="text-[11px] font-medium text-slate-500">
              {shortDate(task.dueDate)}
            </span>
          )}
          <div className="flex -space-x-1.5">
            {assignees.map((user) => (
              <span
                key={user.id}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-white ${user.color}`}
              >
                {user.initials}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
