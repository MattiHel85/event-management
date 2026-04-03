import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useEvents } from "../context/EventsContext";
import { useSession } from "../context/SessionContext";
import { fetchEventAttendees, type EventAttendee } from "../lib/api/events";

export default function EventAttendeesPage() {
  const { id = "" } = useParams();
  const { findEventById, loading, error } = useEvents();
  const { user } = useSession();
  const event = findEventById(id);

  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(true);
  const [attendeesError, setAttendeesError] = useState("");

  if (loading) {
    return <div className="max-w-5xl mx-auto pt-4 pb-24 text-slate-500">Loading attendees...</div>;
  }

  if (error) {
    return <div className="max-w-5xl mx-auto pt-4 pb-24 text-red-500">{error}</div>;
  }

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const isCreator = Boolean(user?.id && event.createdById && user.id === event.createdById);
  const hasOrgAdminRights =
    Boolean(event.organizationId) &&
    Boolean(
      user?.memberships?.some(
        (membership) =>
          membership.organizationId === event.organizationId &&
          (membership.role === "OWNER" || membership.role === "ADMIN")
      )
    );
  const canSeeAttendees = isCreator || hasOrgAdminRights;

  useEffect(() => {
    if (!canSeeAttendees || !event._id) return;

    setLoadingAttendees(true);
    setAttendeesError("");

    fetchEventAttendees(event._id)
      .then((data) => {
        setAttendees(data.attendees);
      })
      .catch((err) => {
        setAttendeesError(err instanceof Error ? err.message : "Failed to load attendees.");
      })
      .finally(() => {
        setLoadingAttendees(false);
      });
  }, [canSeeAttendees, event._id]);

  if (!canSeeAttendees) {
    return <Navigate to={`/events/${id}`} replace />;
  }

  const attending = attendees.filter((a) => a.status === "ATTENDING");
  const interested = attendees.filter((a) => a.status === "INTERESTED");

  return (
    <div className="max-w-5xl mx-auto pt-4 pb-24">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link to="/events" className="hover:text-slate-700 transition-colors">
          Events
        </Link>
        <span>/</span>
        <Link to={`/events/${id}`} className="hover:text-slate-700 transition-colors">
          {event.title}
        </Link>
        <span>/</span>
        <span className="text-slate-600">Attendees</span>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-1">Attendees</h1>
        <p className="text-slate-500">{event.title}</p>
      </div>

      {loadingAttendees ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-slate-500">
          Loading attendee list...
        </div>
      ) : attendeesError ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 shadow-sm text-red-600">
          {attendeesError}
        </div>
      ) : attendees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm text-slate-500">
          No one has RSVP'd yet.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Attending ({attending.length})</h2>
              <button
                type="button"
                disabled
                title="CSV export coming soon"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500"
              >
                Export CSV
              </button>
            </div>
            {attending.length === 0 ? (
              <p className="text-sm text-slate-400">No attendees marked as attending.</p>
            ) : (
              <ul className="space-y-2">
                {attending.map((a) => (
                  <li key={a.userId} className="flex items-center gap-2 text-sm">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                      {(a.name ?? a.email).charAt(0).toUpperCase()}
                    </span>
                    <span className="text-slate-800">{a.name ?? a.email}</span>
                    {a.name ? <span className="text-slate-400 text-xs">{a.email}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Interested ({interested.length})</h2>
              <button
                type="button"
                disabled
                title="CSV export coming soon"
                className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500"
              >
                Export CSV
              </button>
            </div>
            {interested.length === 0 ? (
              <p className="text-sm text-slate-400">No attendees marked as interested.</p>
            ) : (
              <ul className="space-y-2">
                {interested.map((a) => (
                  <li key={a.userId} className="flex items-center gap-2 text-sm">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
                      {(a.name ?? a.email).charAt(0).toUpperCase()}
                    </span>
                    <span className="text-slate-800">{a.name ?? a.email}</span>
                    {a.name ? <span className="text-slate-400 text-xs">{a.email}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
