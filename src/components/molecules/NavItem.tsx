import type { ComponentType, SVGProps } from "react";
import { NavLink } from "react-router-dom";

interface NavItemProps {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone?: "brand" | "admin";
}

export default function NavItem({ to, label, icon: Icon, tone = "brand" }: NavItemProps) {
  const activeClass = tone === "admin" ? "bg-admin-500 text-white" : "bg-brand-500 text-white";

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
        ${isActive ? activeClass + " shadow-sm" : "text-slate-600 hover:bg-slate-100"}`
      }
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {label}
    </NavLink>
  );
}
