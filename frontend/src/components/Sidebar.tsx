import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useEvents } from "../context/EventsContext";

type NavLink = { 
  href?: string; 
  label: string; 
  icon: string;
  children?: NavLink[];
};

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useSession();
  const { events } = useEvents();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const isFeatureRequest = pathname === "/feature-request";
  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const hasCreatedEvent = Boolean(user?.id) && events.some((event) => event.createdById === user?.id);
  const hasPrivilegedOrgRole =
    user?.memberships?.some((membership) => membership.role === "OWNER" || membership.role === "ADMIN") ?? false;
  const canAccessAdminEvents = isPlatformAdmin || hasCreatedEvent || hasPrivilegedOrgRole;
  const canAccessBudgets = isPlatformAdmin || hasCreatedEvent || hasPrivilegedOrgRole;

  const toggleMenu = (label: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedMenus(newExpanded);
  };

  const links: NavLink[] = isPlatformAdmin
    ? [
        { href: "/dashboard", label: "Dashboard", icon: "🏢" },
        { href: "/events", label: "Browse Events", icon: "🧭" },
        { href: "/my-events", label: "My Events", icon: "📅" },
        ...(canAccessAdminEvents ? [{ href: "/admin-events", label: "Admin Events", icon: "🛠" }] : []),
        { href: "/events/new", label: "Create Event", icon: "✚" },
        ...(canAccessBudgets
          ? [
              {
                href: "/budgets",
                label: "Budgets",
                icon: "📊",
              },
            ]
          : []),
        ...(hasPrivilegedOrgRole ? [{ href: "/my-organizations", label: "My Organizations", icon: "⚙️" }] : []),
        { href: "/admin/organizations", label: "Organizations", icon: "🛠" },
        { href: "/profile", label: "My Profile", icon: "👤" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: "🏠" },
        { href: "/organizations", label: "Organizations", icon: "👥" },
        ...(hasPrivilegedOrgRole ? [{ href: "/my-organizations", label: "My Organizations", icon: "⚙️" }] : []),
        { href: "/events", label: "Browse Events", icon: "🧭" },
        { href: "/my-events", label: "My Events", icon: "📅" },
        ...(canAccessAdminEvents ? [{ href: "/admin-events", label: "Admin Events", icon: "🛠" }] : []),
        { href: "/events/new", label: "Create Event", icon: "✚" },
        ...(canAccessBudgets
          ? [
              {
                href: "/budgets",
                label: "Budgets",
                icon: "📊",
              },
            ]
          : []),
        { href: "/profile", label: "My Profile", icon: "👤" },
      ];

  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-slate-800">
        <span className="text-white font-semibold text-base tracking-tight">Event Management</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon, children }) => {
          const isExpanded = expandedMenus.has(label);
          const isActive = href ? pathname === href : children?.some((child) => child.href && pathname === child.href);

          return (
            <div key={label}>
              {children ? (
                <>
                  <button
                    onClick={() => toggleMenu(label)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white font-medium"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">{icon}</span>
                      {label}
                    </div>
                    <span
                      className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 space-y-1 mt-1">
                      {children.map(({ href: childHref, label: childLabel, icon: childIcon }) => (
                        <Link
                          key={childHref}
                          to={childHref!}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            pathname === childHref
                              ? "bg-blue-500 text-white font-medium"
                              : "text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                          }`}
                        >
                          <span className="text-sm">{childIcon}</span>
                          {childLabel}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={href!}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === href
                      ? "bg-blue-600 text-white font-medium"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <Link
          to="/feature-request"
          className={`w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 shadow-sm ${
            isFeatureRequest
              ? "bg-amber-400 text-slate-900 shadow-amber-500/40"
              : "bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300 text-slate-900 hover:brightness-105 hover:shadow-amber-400/40"
          }`}
        >
          <span>💡</span>
          Feature Request
        </Link>

        <div className="px-2 pt-3 text-xs text-slate-600">v0.1.0</div>
      </div>
    </aside>
  );
}
