// import { connectDB } from "@/lib/mongodb";
// import Event from "@/lib/models/Event";
import { IEvent } from "@/lib/models/Event";
import { MOCK_EVENTS } from "@/lib/mockData";
import { formatAmount, getCurrency } from "@/lib/currencies";
import EventForm from "@/components/EventForm";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function getEvent(id: string): Promise<IEvent | null> {
  // TODO: restore when MongoDB is connected
  // await connectDB();
  // const event = await Event.findById(id).lean();
  // return event ? JSON.parse(JSON.stringify(event)) : null;
  return MOCK_EVENTS.find((e) => e._id === id) ?? null;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) return notFound();

  return (
    <div className="max-w-2xl mx-auto pt-4 pb-24">
      {/* Back link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-8 transition-colors"
      >
        ← Back to Events
      </Link>

      {/* Event summary */}
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
              {event.capacity} attendees
            </span>
          </div>
          {event.budget != null && (
            <div>
              <span className="text-slate-400 block">Budget</span>
              <span className="text-slate-800 font-medium">
                {formatAmount(event.budget, event.currency ?? "USD")}
                {" "}
                <span className="text-slate-400 text-xs">
                  {getCurrency(event.currency ?? "USD").flag} {event.currency ?? "USD"}
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100">
          <Link
            href={`/events/${event._id}/budget`}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            📊 View Budget →
          </Link>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-4">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Edit Event</h2>
        <EventForm initial={event} eventId={event._id} />
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Danger Zone
        </h2>
        <DeleteButton eventId={event._id!} />
      </div>
    </div>
  );
}
