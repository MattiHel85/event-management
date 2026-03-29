import { Link, Navigate, useParams } from "react-router-dom";
import { formatAmount, getCurrency } from "../lib/currencies";
import EventForm from "../components/EventForm";
import DeleteButton from "../components/DeleteButton";
import { useEvents } from "../context/EventsContext";
import { useSession } from "../context/SessionContext";

export default function EventDetailPage() {
  const { id = "" } = useParams();
  const { findEventById, loading, error } = useEvents();
  const { user } = useSession();
  const event = findEventById(id);

  if (loading) {
    return <div className="max-w-2xl mx-auto pt-4 pb-24 text-slate-500">Loading event...</div>;
  }

  if (error) {
    return <div className="max-w-2xl mx-auto pt-4 pb-24 text-red-500">{error}</div>;
  }

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const isCreator = Boolean(user?.id && event.createdById && user.id === event.createdById);
  const isOrgMember =
    Boolean(event.organizationId) &&
    Boolean(user?.memberships?.some((membership) => membership.organizationId === event.organizationId));
  const canViewBudget = isCreator || isOrgMember;
  const rsvpHref = event.ticketUrl || `mailto:?subject=RSVP%20${encodeURIComponent(event.title)}`;

  return (
    <div className="max-w-2xl mx-auto pt-4 pb-24">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors">
        ← Back to Events
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{event.title}</h1>
        <p className="text-slate-500 mb-6">{event.description}</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-400 block">Date</span>
            <span className="text-slate-800 font-medium">
              {new Date(event.date).toLocaleDateString("en-SE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Location</span>
            <span className="text-slate-800 font-medium">{event.location}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Capacity</span>
            <span className="text-slate-800 font-medium">{event.capacity} attendees</span>
          </div>
          {event.ticketUrl && (
            <div>
              <span className="text-slate-400 block">Tickets</span>
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                Open ticket page
              </a>
            </div>
          )}
          {canViewBudget && event.budget != null && (
            <div>
              <span className="text-slate-400 block">Budget</span>
              <span className="text-slate-800 font-medium">
                {formatAmount(event.budget, event.currency ?? "USD")}{" "}
                <span className="text-slate-400 text-xs">
                  {getCurrency(event.currency ?? "USD").flag} {event.currency ?? "USD"}
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-4">
          {canViewBudget ? (
            <Link to={`/events/${event._id}/budget`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              📊 View Budget →
            </Link>
          ) : (
            <>
              <span className="text-sm text-slate-500">Budget is visible to organization members only.</span>
              <a
                href={rsvpHref}
                target={event.ticketUrl ? "_blank" : undefined}
                rel={event.ticketUrl ? "noreferrer" : undefined}
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-600 transition-colors"
              >
                RSVP to Event →
              </a>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Edit Event</h2>
        <EventForm initial={event} eventId={event._id} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Danger Zone</h2>
        <DeleteButton eventId={event._id!} />
      </div>
    </div>
  );
}
