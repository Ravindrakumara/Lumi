import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  ChevronUpDownIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";
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
  // Below the lg breakpoint the sidebar is an off-canvas drawer (see the
  // aside's translate-x classes below) instead of a permanent column -
  // there's no room for a fixed 256px rail next to content on a phone.
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-30 rounded-lg bg-white p-2 shadow-md dark:bg-ink-800 lg:hidden"
        aria-label="Open menu"
      >
        <Bars3Icon className="h-6 w-6 text-slate-700 dark:text-ink-200" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-slate-200
        bg-white p-4 transition-transform duration-200 ease-in-out dark:border-ink-700 dark:bg-ink-900
        lg:static lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <h1 className="text-lg font-bold text-slate-900 dark:text-ink-100">{title}</h1>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800 lg:hidden"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1" onClick={() => setMobileOpen(false)}>
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
    </>
  );
}
