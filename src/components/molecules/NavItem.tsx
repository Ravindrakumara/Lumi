import type { ComponentType, SVGProps } from "react";
import { NavLink } from "react-router-dom";

interface NavItemProps {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "brand" | "admin";
}

export default function NavItem({ to, label, icon: Icon, tone = "brand" }: NavItemProps) {
  // "brand" sits on the redesign's gradient sidebar (see Sidebar.tsx), so
  // it needs light-on-dark styling throughout, not just for the active
  // state - "admin" still sits on a plain white rail.
  const isBrand = tone === "brand";
  const activeClass = isBrand ? "bg-white/20 text-white font-semibold" : "bg-admin-500 text-white shadow-sm";
  const inactiveClass = isBrand ? "text-white/72 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100";

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${isActive ? activeClass : inactiveClass}`
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  );
}
