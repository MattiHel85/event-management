"use client";

import { useState, SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import type { IEvent } from "@/lib/models/Event";
import { CURRENCIES, getCurrency } from "@/lib/currencies";

interface EventFormProps {
  initial?: Partial<IEvent>;
  eventId?: string;
}

export default function EventForm({ initial, eventId }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial?.date ? initial.date.slice(0, 10) : "",
    location: initial?.location ?? "",
    capacity: initial?.capacity ?? "",
    budget: initial?.budget ?? "",
    currency: initial?.currency ?? "USD",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = eventId ? `/api/events/${eventId}` : "/api/events";
    const method = eventId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity),
          budget: form.budget !== "" ? Number(form.budget) : undefined,
          currency: form.currency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      const event = await res.json();
      router.push(`/events/${event._id}`);
      router.refresh();
    } catch {
      setError("Failed to save event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="block text-sm text-slate-600 mb-1.5">Title</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputClass}
          placeholder="Event title"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1.5">Description</label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={`${inputClass} resize-none`}
          placeholder="What is this event about?"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">Date</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">Capacity</label>
          <input
            type="number"
            required
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            className={inputClass}
            placeholder="Max attendees"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1.5">
          Total Budget{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Currency picker */}
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag}\u2002{c.code} — {c.name}
              </option>
            ))}
          </select>
          {/* Amount input */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
              {getCurrency(form.currency).symbol}
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className={`${inputClass} pl-8`}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1.5">Location</label>
        <input
          type="text"
          required
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className={inputClass}
          placeholder="Venue or address"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition-colors"
      >
        {loading ? "Saving..." : eventId ? "Update Event" : "Create Event"}
      </button>
    </form>
  );
}
