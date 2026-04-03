import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/admin/organizations": "Organization Admin",
  "/organizations": "Organizations",
  "/my-organizations": "My Organizations",
  "/events": "Browse Events",
  "/my-events": "My Events",
  "/admin-events": "Admin Events",
  "/events/new": "Create Event",
  "/budgets": "Budgets",
  "/profile": "My Profile",
  "/feature-request": "Feature Request",
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith("/events/")) return "Event Details";
  return "Event Management";
}

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const title = getTitle(pathname);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/signin", { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-8 z-20">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      {user ? (
        <button
          type="button"
          onClick={() => void handleSignOut()}
          disabled={isSigningOut}
          className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      ) : null}
    </header>
  );
}
