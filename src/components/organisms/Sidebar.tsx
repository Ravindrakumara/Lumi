import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BoltIcon,
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

  // The redesign's gradient sidebar (see index.css's mockup-matched
  // palette) is only for the learner-facing "brand" tone - the admin
  // console wasn't part of that design and keeps its plain white rail.
  const isBrand = tone === "brand";

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
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col p-4 transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        ${
          isBrand
            ? "bg-gradient-to-br from-[#4a7cf0] to-[#2748a8] text-white"
            : "border-r border-slate-200 bg-white dark:border-ink-700 dark:bg-ink-900"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          {isBrand ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-live-500">
                <BoltIcon className="h-4.5 w-4.5 text-white" />
              </span>
              <h1 className="font-display text-lg font-extrabold text-white">{title}</h1>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-slate-900 dark:text-ink-100">{title}</h1>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className={`rounded-lg p-1 lg:hidden ${
              isBrand ? "text-white/70 hover:bg-white/10" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-ink-800"
            }`}
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" onClick={() => setMobileOpen(false)}>
          {items.map((item) => (
            <NavItem key={item.to} {...item} tone={tone} />
          ))}
        </nav>

      <button
        onClick={() => setDarkMode(!darkMode)}
        role="switch"
        aria-checked={darkMode}
        className={`mb-3 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isBrand
            ? "text-white/85 hover:bg-white/10"
            : "text-slate-600 hover:bg-slate-100 dark:text-ink-400 dark:hover:bg-ink-800"
        }`}
      >
        {darkMode ? <SunIcon className="h-[17px] w-[17px]" /> : <MoonIcon className="h-[17px] w-[17px]" />}
        <span className="flex-1 text-left text-[13.5px]">Dark mode</span>
        <span
          className={`relative h-[18px] w-8 shrink-0 rounded-full transition-colors ${
            darkMode ? (isBrand ? "bg-white/60" : "bg-brand-500") : isBrand ? "bg-white/20" : "bg-slate-200"
          }`}
        >
          <span
            className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-[left] ${
              darkMode ? "left-[16px]" : "left-0.5"
            }`}
          />
        </span>
      </button>

      {user ? (
        <Menu
          as="div"
          className={`relative border-t pt-4 ${isBrand ? "border-white/20" : "border-slate-100 dark:border-ink-800"}`}
        >
          <MenuButton
            className={`flex w-full items-center gap-2.5 rounded-[10px] p-2 text-left transition-colors ${
              isBrand ? "bg-white/12 hover:bg-white/20" : "hover:bg-slate-50 dark:hover:bg-ink-800"
            }`}
          >
            <Avatar name={user.name} tone={isBrand ? "accent" : tone} size={32} />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-[13px] font-semibold ${isBrand ? "text-white" : "text-slate-900 dark:text-ink-100"}`}
              >
                {user.name}
              </p>
              <p className={`truncate text-[11.5px] ${isBrand ? "text-white/65" : "text-slate-500 dark:text-ink-400"}`}>
                {user.email}
              </p>
            </div>
            {/* The mockup has no chevron here, but this is the only
                affordance that says "there's a log out inside" - kept
                deliberately faint so the block still reads as designed. */}
            <ChevronUpDownIcon className={`h-3.5 w-3.5 shrink-0 ${isBrand ? "text-white/45" : "text-slate-400"}`} />
          </MenuButton>
          <MenuItems
            transition
            anchor="top start"
            // z-[60] beats the sidebar's own z-50: the aside is a
            // transformed element (the mobile drawer slide), so it forms a
            // stacking context that would otherwise paint straight over
            // this portalled popup and make "Log out" invisible.
            className="z-[60] w-56 origin-bottom rounded-lg bg-white p-1 text-sm shadow-lg ring-1 ring-black/5 transition duration-100 ease-in data-closed:opacity-0 focus:outline-none dark:bg-ink-800 dark:ring-white/10"
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
