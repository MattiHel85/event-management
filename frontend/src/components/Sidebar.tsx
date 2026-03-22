import { Link, useLocation } from "react-router-dom";

const links = [
  { href: "/events/new", label: "Create Event", icon: "✚" },
  { href: "/events", label: "Events", icon: "📅" },
  { href: "/budget", label: "Budget", icon: "📊" },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const isFeatureRequest = pathname === "/feature-request";

  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-slate-800">
        <span className="text-white font-semibold text-base tracking-tight">Event Management</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            to={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === href
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}
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
