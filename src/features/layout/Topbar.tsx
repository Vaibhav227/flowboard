import { Menu, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { currentUser, useAppStore } from "../../stores/appStore";

export function Topbar({
  search,
  onSearchChange,
  onMenuOpen,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onMenuOpen: () => void;
}) {
  const state = useAppStore();
  const user = currentUser(state);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-orange-100 bg-white px-4 md:px-6">
      <button className="icon-button md:hidden" aria-label="Open workspace navigation" onClick={onMenuOpen}><Menu size={20}/></button>
      <label className="relative block min-w-0 flex-1 md:w-[320px] md:flex-none">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={17} />
        <input
          ref={searchRef}
          className="field py-2 pl-9"
          placeholder="Search tasks…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <kbd className="pointer-events-none absolute right-3 top-2 hidden rounded border border-orange-100 bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700 sm:block">
          ⌘ K
        </kbd>
      </label>
      <div className="flex items-center gap-2">
        <select
          value={state.currentUserId}
          onChange={(event) => state.setCurrentUser(event.target.value)}
          className="max-w-[125px] rounded-lg border border-orange-100 bg-white py-1.5 pl-2 pr-7 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500 sm:max-w-none"
        >
          {state.users.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} · {member.role}
            </option>
          ))}
        </select>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${user.color}`}
        >
          {user.initials}
        </div>
      </div>
    </header>
  );
}
