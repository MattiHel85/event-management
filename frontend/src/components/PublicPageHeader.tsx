import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function PublicPageHeader() {
  const { user } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20">
      <Link to="/" className="font-semibold text-slate-900 tracking-tight">
        Event Management
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/events"
          className="text-slate-600 hover:text-slate-900 text-sm font-medium px-2 py-2 transition-colors"
        >
          Events
        </Link>
        {user ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-3.2 3.6-5.5 8-5.5s8 2.3 8 5.5" />
            </svg>
            <span>{user.name ?? user.email}</span>
          </Link>
        ) : (
          <>
            <Link
              to="/signin"
              className="text-slate-600 hover:text-slate-900 text-sm font-medium px-2 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
