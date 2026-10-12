import { X } from "lucide-react";
import { useAppStore } from "../stores/appStore";

export function Toasts() {
  const state = useAppStore();
  const message = state.lastError?.message ?? state.notice;
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${state.lastError ? "bg-rose-600 text-white" : "bg-slate-900 text-white"}`}
    >
      <span>{message}</span>
      <button
        onClick={state.clearNotice}
        className="rounded p-0.5 hover:bg-white/15"
      >
        <X size={15} />
      </button>
    </div>
  );
}
