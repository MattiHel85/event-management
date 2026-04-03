import { Link, Navigate, useParams } from "react-router-dom";
import { useState } from "react";
import { formatAmount, getCurrency } from "../lib/currencies";
import EventForm from "../components/EventForm";
import DeleteButton from "../components/DeleteButton";
import ActionButton from "../components/ActionButton";
import { useEvents } from "../context/EventsContext";
import { useSession } from "../context/SessionContext";

export default function EventDetailPage() {
  const [showEditForm, setShowEditForm] = useState(false);
  const [editSuccess, setEditSuccess] = useState("");
  const [updatingParticipation, setUpdatingParticipation] = useState(false);
  const [pendingAction, setPendingAction] = useState<"INTERESTED" | "CLEAR" | null>(null);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const { id = "" } = useParams();
  const { findEventById, loading, error, setEventParticipation } = useEvents();
  const { user } = useSession();
  const event = findEventById(id);

  const isCreator = Boolean(user?.id && event?.createdById && user.id === event.createdById);
  const isOrgMember =
    Boolean(event?.organizationId) &&
    Boolean(user?.memberships?.some((membership) => membership.organizationId === event?.organizationId));
  const hasOrgAdminRights =
    Boolean(event?.organizationId) &&
    Boolean(
      user?.memberships?.some(
        (membership) =>
          membership.organizationId === event?.organizationId &&
          (membership.role === "OWNER" || membership.role === "ADMIN")
      )
    );
  const canEditEvent = isCreator || hasOrgAdminRights;
  const canSeeAttendees = canEditEvent;

  if (loading) {
    return <div className="max-w-2xl mx-auto pt-4 pb-24 text-slate-500">Loading event...</div>;
  }

  if (error) {
    return <div className="max-w-2xl mx-auto pt-4 pb-24 text-red-500">{error}</div>;
  }

  if (!event) {
    return <Navigate to="/events" replace />;
  }

  const canViewBudget = isCreator || isOrgMember;
  const attendingCount = event.attendingCount ?? 0;
  const isEventFull = attendingCount >= event.capacity;
  const capacityPercentage = (attendingCount / event.capacity) * 100;
  const isHighCapacity = capacityPercentage >= 80;
  const isFullForAction = attendingCount >= event.capacity && event.participationStatus !== "ATTENDING";

  const handleParticipation = async (status: "INTERESTED" | "ATTENDING" | null) => {
    if (!event._id) return;

    if (!user) {
      setShowSignUpPrompt(true);
      return;
    }

    if (event.participationStatus === "ATTENDING" && (status === "INTERESTED" || status === null)) {
      setPendingAction(status === "INTERESTED" ? "INTERESTED" : "CLEAR");
      return;
    }

    setUpdatingParticipation(true);
    try {
      await setEventParticipation(event._id, status);
    } finally {
      setUpdatingParticipation(false);
      setPendingAction(null);
    }
  };

  const confirmPendingAction = async () => {
    if (!event._id || !pendingAction) return;
    const status = pendingAction === "CLEAR" ? null : "INTERESTED";
    setUpdatingParticipation(true);
    try {
      await setEventParticipation(event._id, status);
    } finally {
      setUpdatingParticipation(false);
      setPendingAction(null);
    }
  };

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
            <span className="text-slate-800 font-medium">
              {attendingCount > 0 ? `${attendingCount}/${event.capacity} attending` : `${event.capacity} ${event.capacity === 1 ? "attendee" : "attendees"}`}
            </span>
            <div className="mt-2 flex flex-wrap gap-2 items-start">
              {attendingCount > 0 && isEventFull ? (
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                  Event Full
                </span>
              ) : null}
              {isHighCapacity && attendingCount > 0 ? (
                <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                  🔥 Places are going fast
                </span>
              ) : null}
            </div>
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
        <div className="mt-5 pt-5 border-t border-slate-100">
          {showSignUpPrompt ? (
            <div className="w-full flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-xs text-blue-700 flex-1">
                <Link to="/signup" className="font-medium underline">Sign up for free</Link> to RSVP for events.
              </span>
              <button
                type="button"
                onClick={() => setShowSignUpPrompt(false)}
                className="text-slate-400 hover:text-slate-600 text-sm leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ) : pendingAction ? (
            <div className="w-full flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-xs text-red-700 font-medium flex-1">
                {pendingAction === "CLEAR" ? "You'll lose your spot. Confirm?" : "You'll lose your spot if you switch. Confirm?"}
              </span>
              <button
                type="button"
                disabled={updatingParticipation}
                onClick={confirmPendingAction}
                className="text-xs font-medium px-2 py-1 rounded border border-red-300 bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                disabled={updatingParticipation}
                onClick={() => setPendingAction(null)}
                className="text-xs font-medium px-2 py-1 rounded border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={updatingParticipation}
                onClick={() => void handleParticipation("INTERESTED")}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  event.participationStatus === "INTERESTED"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                Interested
              </button>
              <button
                type="button"
                disabled={updatingParticipation || isFullForAction}
                onClick={() => void handleParticipation("ATTENDING")}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  event.participationStatus === "ATTENDING"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-300 text-slate-600 hover:border-slate-400"
                }`}
              >
                {isFullForAction ? "Full" : "Attending"}
              </button>
              {event.participationStatus ? (
                <button
                  type="button"
                  disabled={updatingParticipation}
                  onClick={() => void handleParticipation(null)}
                  className="rounded-full px-3 py-1 text-xs font-medium border border-slate-300 text-slate-600 hover:border-slate-400"
                >
                  Clear
                </button>
              ) : null}
            </div>
          )}
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100 flex items-center gap-4">
          {canEditEvent ? (
            <ActionButton
              label={showEditForm ? "Close Edit" : "Edit Event"}
              onClick={() => {
                setShowEditForm((prev) => !prev);
                setEditSuccess("");
              }}
              variant="primary"
              size="sm"
            />
          ) : null}
          {canViewBudget ? (
            <Link to={`/events/${event._id}/budget`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              📊 View Budget →
            </Link>
          ) : null}
          {canSeeAttendees ? (
            <Link to={`/events/${event._id}/attendees`} className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
              👥 View Attendees →
            </Link>
          ) : null}
        </div>
      </div>

      {showEditForm && canEditEvent ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Edit Event</h2>
          {editSuccess ? (
            <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {editSuccess}
            </div>
          ) : null}
          <EventForm
            initial={event}
            eventId={event._id}
            onSaved={() => {
              setEditSuccess("Event updated successfully.");
              setShowEditForm(false);
            }}
          />
          <div className="mt-6 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Danger Zone</h3>
            <DeleteButton eventId={event._id!} />
          </div>
        </div>
      ) : null}

    </div>
  );
}
