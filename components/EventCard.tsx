import Link from "next/link";
import type { IEvent } from "@/lib/models/Event";

export default function EventCard({ event }: { event: IEvent }) {
  const formatted = new Date(event.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm flex flex-col gap-3 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-slate-900 font-semibold text-lg leading-snug">{event.title}</h2>
        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
          {event.capacity} spots
        </span>
      </div>
      <p className="text-slate-500 text-sm leading-relaxed flex-1 line-clamp-3">
        {event.description}
      </p>
      <div className="flex flex-col gap-1 text-sm text-slate-400">
        <span>📅 {formatted}</span>
        <span>📍 {event.location}</span>
      </div>
      <Link
        href={`/events/${event._id}`}
        className="mt-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
      >
        View details →
      </Link>
    </div>
  );
}
