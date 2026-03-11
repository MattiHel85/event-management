"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/events/new", label: "Create Event", icon: "✚" },
  { href: "/events", label: "Events", icon: "📅" },
  { href: "/budget", label: "Budget", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-slate-900 flex flex-col z-10">
      <div className="px-6 py-5 border-b border-slate-800">
        <span className="text-white font-semibold text-base tracking-tight">
          Event Management
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
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
      <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-600">
        v0.1.0
      </div>
    </aside>
  );
}
