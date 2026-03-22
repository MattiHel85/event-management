import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import { useEvents } from "../context/EventsContext";

export default function EventsPage() {
  const { events, loading, error } = useEvents();

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto pt-4 pb-24">
        <p className="text-slate-500">Loading events...</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto pt-4 pb-24">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Events</h1>
          <p className="text-slate-500">
            {events.length} upcoming event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/events/new" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm">
          + Create Event
        </Link>
      </div>

      {error && (
        <p className="mb-6 text-sm text-red-500">{error}</p>
      )}

      {events.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <p className="text-lg mb-4">No events yet.</p>
          <Link to="/events/new" className="text-blue-600 hover:text-blue-500 transition-colors">
            Create your first event →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </main>
  );
}
