import { ChevronDown, FileText } from "lucide-react";
import { useState } from "react";
import type { Task } from "../../models/types";
import {
  priorityStyle,
  shortDate,
  statusDot,
} from "../../components/taskPresentation";
import { useAppStore } from "../../stores/appStore";

export function TaskList({ tasks }: { tasks: Task[] }) {
  const state = useAppStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sort, setSort] = useState<"due-asc" | "due-desc" | "priority-desc" | "priority-asc">("due-asc");

  const priorityRank = { urgent: 5, high: 4, normal: 3, low: 2, none: 1 } as const;

  const sorted = [...tasks].sort((a, b) => {
    if (sort.startsWith("priority")) {
      const result = priorityRank[a.priority] - priorityRank[b.priority];
      return sort === "priority-desc" ? -result : result;
    }

    const result = (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    return sort === "due-desc" ? -result : result;
  });

  const statuses = state.statuses.filter((status) => status.listId === state.selectedListId).sort((a, b) => a.position - b.position);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const toggle = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const allSelected = tasks.length > 0 && tasks.every((task) => selectedIds.includes(task.id));

  const applyBulk = () => { const result = state.bulkUpdateTasks(selectedIds, { ...(bulkStatus ? { statusId: bulkStatus } : {}), ...(bulkAssignee ? { assigneeIds: [bulkAssignee] } : {}) });

 if (!result.error) { setSelectedIds([]); setBulkStatus(""); setBulkAssignee(""); } };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold text-slate-700">{tasks.length} tasks</p>
        <label className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sort by
          <span className="relative block max-w-full"><select aria-label="Sort tasks" className="select-field min-w-0 max-w-full bg-none rounded-lg border border-orange-100 bg-white px-2.5 py-1.5 pr-12 text-sm font-medium normal-case tracking-normal text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="due-asc">Due date · soonest</option>
            <option value="due-desc">Due date · latest</option>
            <option value="priority-desc">Priority · highest</option>
            <option value="priority-asc">Priority · lowest</option>
          </select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-700" size={16}/></span>
        </label>
      </div>
      {selectedIds.length > 0 && <div className="flex flex-wrap items-center gap-2 border-b border-orange-100 bg-orange-50 px-5 py-3"><span className="mr-2 text-sm font-semibold text-orange-900">{selectedIds.length} selected</span><select aria-label="Bulk status" className="field select-field w-auto py-1.5" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}><option value="">Change status…</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}</select><select aria-label="Bulk assignee" className="field select-field w-auto py-1.5" value={bulkAssignee} onChange={(event) => setBulkAssignee(event.target.value)}><option value="">Change assignee…</option><option value="">Unassigned</option>{state.users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select><button className="btn-primary py-1.5" disabled={!bulkStatus && !bulkAssignee} onClick={applyBulk}>Apply changes</button><button className="btn-secondary py-1.5" onClick={() => setSelectedIds([])}>Clear</button></div>}
      <table className="min-w-[720px] w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="w-10 px-5 py-3 font-semibold"><input type="checkbox" aria-label="Select all tasks" className="accent-orange-600" checked={allSelected} onChange={() => setSelectedIds(allSelected ? [] : tasks.map((task) => task.id))}/></th><th className="px-2 py-3 font-semibold">Task</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Assignees</th>
            <th className="px-5 py-3 font-semibold">Due</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((task) => {
            const status = state.statuses.find(
              (item) => item.id === task.statusId,
            );

            return (
              <tr
                key={task.id}
                onClick={() => state.setOpenTask(task.id)}
                className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-orange-50/60"
              >
                <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${task.title}`} className="accent-orange-600" checked={selectedIds.includes(task.id)} onChange={() => toggle(task.id)}/></td><td className="px-2 py-4 font-semibold text-slate-800">
                  {task.title}
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-2 text-slate-600">
                    <i
                      className={`h-2 w-2 rounded-full ${status ? statusDot[status.color] : ""}`}
                    />
                    {status?.name}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-xs font-semibold capitalize ${priorityStyle[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-500">
                  {task.assigneeIds.length || "Unassigned"}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {shortDate(task.dueDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!tasks.length && <Empty />}
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-3 rounded-full bg-orange-50 p-3 text-orange-600">
        <FileText size={22} />
      </div>
      <p className="font-semibold text-slate-700">No tasks found</p>
      <p className="mt-1 text-sm text-slate-500">
        Try a different search or create a new task.
      </p>
    </div>
  );
}
