import { MOCK_EVENTS } from "@/lib/mockData";
import EventBudgetClient from "@/components/EventBudgetClient";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EventBudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: replace with Prisma lookup when Event model/table is implemented.
  const event = MOCK_EVENTS.find((e) => e._id === id);
  if (!event) return notFound();

  return (
    <div className="max-w-5xl mx-auto pt-4 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link href="/events" className="hover:text-slate-700 transition-colors">
          Events
        </Link>
        <span>/</span>
        <Link href={`/events/${id}`} className="hover:text-slate-700 transition-colors">
          {event.title}
        </Link>
        <span>/</span>
        <span className="text-slate-600">Budget</span>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-1">Budget</h1>
        <p className="text-slate-500">{event.title}</p>
      </div>

      <EventBudgetClient
        eventId={id}
        totalBudget={event.budget}
        currency={event.currency ?? "USD"}
        initialItems={event.budgetItems ?? []}
      />
    </div>
  );
}
