import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import { useEvents } from "../context/EventsContext";
import { useSession } from "../context/SessionContext";

export default function AdminEventsPage() {
  const { events, loading, error } = useEvents();
  const { user } = useSession();

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";
  const adminOrgIds = new Set(
    (user?.memberships ?? [])
      .filter((membership) => membership.role === "OWNER" || membership.role === "ADMIN")
      .map((membership) => membership.organizationId)
  );

  const adminEvents = events.filter((event) => {
    if (!user?.id) return false;
    if (isPlatformAdmin) return true;
    if (event.createdById === user.id) return true;
    if (!event.organizationId) return false;
    return adminOrgIds.has(event.organizationId);
  });

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto pt-4 pb-24">
        <p className="text-slate-500">Loading admin events...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto pt-4 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Events</h1>
          <p className="text-slate-500">
            {adminEvents.length} event{adminEvents.length !== 1 ? "s" : ""} where you have admin access
          </p>
        </div>
        <Link
          to="/events"
          className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          Browse Events
        </Link>
      </div>

      {error && <p className="mb-6 text-sm text-red-500">{error}</p>}

      {adminEvents.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <p className="text-lg mb-4">No admin events available.</p>
          <Link to="/events" className="text-blue-600 hover:text-blue-500 transition-colors">
            Browse events →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminEvents.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}
