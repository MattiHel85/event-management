"use client";

import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/events": "Events",
  "/events/new": "Create Event",
  "/budget": "Budget",
  "/feature-request": "Feature Request",
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/events/")) return "Event Details";
  return "Event Management";
}

export default function Header() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-8 z-20">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
    </header>
  );
}
