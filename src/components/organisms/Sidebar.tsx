import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ArrowRightStartOnRectangleIcon, ChevronUpDownIcon, MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import Avatar from "../atoms/Avatar";
import NavItem from "../molecules/NavItem";
import { useAuth } from "../../hooks/useAuth";
import { useSettingsStore } from "../../store/settingsStore";
import type { ComponentType, SVGProps } from "react";

export interface NavItemConfig {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface SidebarProps {
  title: string;
  items: NavItemConfig[];
  tone?: "brand" | "admin";
}

export default function Sidebar({ title, items, tone = "brand" }: SidebarProps) {
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useSettingsStore();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
      <h1 className="mb-6 px-2 text-lg font-bold text-slate-900 dark:text-ink-100">{title}</h1>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <NavItem key={item.to} {...item} tone={tone} />
        ))}
      </nav>

      <button
        onClick={() => setDarkMode(!darkMode)}
        className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-ink-400 dark:hover:bg-ink-800"
      >
        {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        {darkMode ? "Light mode" : "Dark mode"}
      </button>

      {user ? (
        <Menu as="div" className="relative border-t border-slate-100 pt-4 dark:border-ink-800">
          <MenuButton className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-slate-50 dark:hover:bg-ink-800">
            <Avatar name={user.name} tone={tone} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-ink-100">{user.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-ink-400">{user.email}</p>
            </div>
            <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-slate-400" />
          </MenuButton>
          <MenuItems
            transition
            anchor="top start"
            className="w-56 origin-bottom rounded-lg bg-white p-1 text-sm shadow-lg ring-1 ring-black/5 transition duration-100 ease-in data-closed:opacity-0 focus:outline-none dark:bg-ink-800 dark:ring-white/10"
          >
            <MenuItem>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-600 data-focus:bg-red-50 dark:data-focus:bg-red-500/10"
              >
                <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
                Log out
              </button>
            </MenuItem>
          </MenuItems>
        </Menu>
      ) : null}
    </aside>
  );
}
