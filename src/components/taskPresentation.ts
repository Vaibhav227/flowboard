import type { Priority } from "../models/types";

export const priorityStyle: Record<Priority, string> = {
  urgent: "bg-rose-50 text-rose-700 ring-rose-200",
  high: "bg-amber-50 text-amber-700 ring-amber-200",
  normal: "bg-blue-50 text-blue-700 ring-blue-200",
  low: "bg-slate-100 text-slate-600 ring-slate-200",
  none: "bg-slate-100 text-slate-500 ring-slate-200",
};
export const statusDot: Record<string, string> = {
  slate: "bg-slate-400",
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
};
export const shortDate = (date: string | null) =>
  date
    ? new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "—";
