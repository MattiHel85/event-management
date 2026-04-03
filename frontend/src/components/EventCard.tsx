import { Link } from "react-router-dom";
import { useState } from "react";
import type { IEvent } from "../lib/models/Event";
import { useEvents } from "../context/EventsContext";
import { useSession } from "../context/SessionContext";

export default function EventCard({ event }: { event: IEvent }) {
  const [shareLabel, setShareLabel] = useState("Share");
  const [updatingParticipation, setUpdatingParticipation] = useState(false);
  const [pendingAction, setPendingAction] = useState<"INTERESTED" | "CLEAR" | null>(null);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const { setEventParticipation } = useEvents();
  const { user } = useSession();

  const formatted = new Date(event.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event._id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title}`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareLabel("Copied");
      window.setTimeout(() => setShareLabel("Share"), 2000);
    } catch {
      setShareLabel("Failed");
      window.setTimeout(() => setShareLabel("Share"), 2000);
    }
  };

  const handleParticipation = async (status: "INTERESTED" | "ATTENDING" | null) => {
    if (!event._id) return;

    if (!user) {
      setShowSignUpPrompt(true);
      return;
    }

    // Show confirmation if switching from ATTENDING to INTERESTED or CLEAR
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

  const cancelPendingAction = () => {
    setPendingAction(null);
  };

  const attendingCount = event.attendingCount ?? 0;
  const isFull = attendingCount >= event.capacity && event.participationStatus !== "ATTENDING";
  const capacityPercentage = (attendingCount / event.capacity) * 100;
  const isHighCapacity = capacityPercentage >= 80;

  return (
    <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-3 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/events/${event._id}`} className="text-slate-900 font-semibold text-lg leading-snug">
            {event.title}
        </Link>
        {/* <h2 className="text-slate-900 font-semibold text-lg leading-snug">{event.title}</h2> */}
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
          {event.capacity} {event.capacity === 1 ? "spot" : "spots"}
        </span>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3">{event.description}</p>
      <div className="flex flex-col gap-1 text-sm text-slate-400">
        <span>📅 {formatted}</span>
        <span>📍 {event.location}</span>
        <span className={attendingCount > 0 ? "" : "invisible"}>
          ✅ {attendingCount}/{event.capacity} attending
        </span>
        {isHighCapacity && attendingCount > 0 && (
          <span className="text-orange-600 text-xs font-medium">🔥 Places are going fast</span>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
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
              onClick={cancelPendingAction}
              className="text-xs font-medium px-2 py-1 rounded border border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
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
              disabled={updatingParticipation || isFull}
              onClick={() => void handleParticipation("ATTENDING")}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                event.participationStatus === "ATTENDING"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-600 hover:border-slate-400"
              }`}
            >
              {isFull ? "Full" : "Attending"}
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
          </>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          {shareLabel}
        </button>
        <div className="flex items-center gap-3">
          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Buy tickets
            </a>
          )}
          <Link to={`/events/${event._id}`} className="text-sm text-blue-600 hover:text-blue-500 transition-colors">
            View details →
          </Link>
        </div>
      </div>
    </div>
  );
}
