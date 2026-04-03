import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import { useEvents } from "../context/EventsContext";
import { useSession } from "../context/SessionContext";

export default function MyEventsPage() {
  const { events, loading, error } = useEvents();
  const { user } = useSession();

  const byNearestDate = (a: { date: string }, b: { date: string }) =>
    new Date(a.date).getTime() - new Date(b.date).getTime();

  const myOrgIds = new Set((user?.memberships ?? []).map((membership) => membership.organizationId));

  const createdByMe = events
    .filter((event) => Boolean(user?.id) && event.createdById === user?.id)
    .sort(byNearestDate);

  const attendingEvents = events
    .filter((event) => event.participationStatus === "ATTENDING")
    .sort(byNearestDate);

  const sameOrgByOthers = events
    .filter((event) => {
      if (!event.organizationId) return false;
      if (!myOrgIds.has(event.organizationId)) return false;
      return !user?.id || event.createdById !== user.id;
    })
    .sort(byNearestDate);

  const hasAny = attendingEvents.length > 0 || createdByMe.length > 0 || sameOrgByOthers.length > 0;

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto pt-4 pb-24">
        <p className="text-slate-500">Loading your events...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto pt-4 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">My Events</h1>
          <p className="text-slate-500">
            {attendingEvents.length + createdByMe.length + sameOrgByOthers.length} event
            {attendingEvents.length + createdByMe.length + sameOrgByOthers.length !== 1 ? "s" : ""} in your personal event feed
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

      {!hasAny ? (
        <div className="text-center py-24 text-slate-400">
          <p className="text-lg mb-4">No events yet in your scope.</p>
          <Link to="/events/new" className="text-blue-600 hover:text-blue-500 transition-colors">Create your first event →</Link>
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">You're Attending</h2>
            {attendingEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No events marked as attending yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {attendingEvents.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Events You Created</h2>
            {createdByMe.length === 0 ? (
              <p className="text-sm text-slate-500">No events created by you yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdByMe.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Events From Your Organizations</h2>
            {sameOrgByOthers.length === 0 ? (
              <p className="text-sm text-slate-500">No other events from your organizations yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sameOrgByOthers.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
