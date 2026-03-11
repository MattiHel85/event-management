import EventForm from "@/components/EventForm";

export default function NewEventPage() {
  return (
    <main className="max-w-2xl mx-auto pt-4 pb-24">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">Create Event</h1>
      <p className="text-slate-500 mb-10">Fill in the details for your new event.</p>
      <EventForm />
    </main>
  );
}
