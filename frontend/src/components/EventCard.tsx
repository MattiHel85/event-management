import { Link } from "react-router-dom";
import { useState } from "react";
import type { IEvent } from "../lib/models/Event";

export default function EventCard({ event }: { event: IEvent }) {
  const [shareLabel, setShareLabel] = useState("Share");

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

  return (
    <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-3 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <Link to={`/events/${event._id}`} className="text-slate-900 font-semibold text-lg leading-snug">
            {event.title}
        </Link>
        {/* <h2 className="text-slate-900 font-semibold text-lg leading-snug">{event.title}</h2> */}
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
          {event.capacity} spots
        </span>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3">{event.description}</p>
      <div className="flex flex-col gap-1 text-sm text-slate-400">
        <span>📅 {formatted}</span>
        <span>📍 {event.location}</span>
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
