import { Link, Navigate, useParams } from "react-router-dom";
import EventBudgetClient from "../components/EventBudgetClient";
import { useEvents } from "../context/EventsContext";

export default function EventBudgetPage() {
  const { id = "" } = useParams();
  const { findEventById, loading, error } = useEvents();
  const event = findEventById(id);

  if (loading) {
    return <div className="max-w-5xl mx-auto pt-4 pb-24 text-slate-500">Loading budget...</div>;
  }

  if (error) {
    return <div className="max-w-5xl mx-auto pt-4 pb-24 text-red-500">{error}</div>;
  }

  if (!event) {
    return <Navigate to="/events" replace />;
  }

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
