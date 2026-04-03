import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CURRENCIES, getCurrency } from "../lib/currencies";
import type { IEvent } from "../lib/models/Event";
import { useEvents } from "../context/EventsContext";
import { useSession } from "../context/SessionContext";

interface EventFormProps {
  initial?: Partial<IEvent>;
  eventId?: string;
  redirectOnCreateToMyEvents?: boolean;
  onSaved?: (event: IEvent) => void;
}

export default function EventForm({ initial, eventId, redirectOnCreateToMyEvents = false, onSaved }: EventFormProps) {
  const navigate = useNavigate();
  const { createEvent, updateEvent } = useEvents();
  const { user } = useSession();

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial?.date ? initial.date.slice(0, 10) : "",
    location: initial?.location ?? "",
    capacity: initial?.capacity ?? "",
    ticketUrl: initial?.ticketUrl ?? "",
    budget: initial?.budget ?? "",
    currency: initial?.currency ?? "USD",
    visibility: (initial?.visibility ?? "public") as "public" | "internal",
    organizationId: initial?.organizationId ?? "",
    noOrganization: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        title: String(form.title).trim(),
        description: String(form.description).trim(),
        date: String(form.date),
        location: String(form.location).trim(),
        capacity: Number(form.capacity),
        ticketUrl: String(form.ticketUrl).trim(),
        budget: form.budget !== "" ? Number(form.budget) : undefined,
        currency: String(form.currency),
        visibility: form.visibility,
        noOrganization: form.noOrganization,
        organizationId: !form.noOrganization && form.organizationId ? form.organizationId : undefined,
      };

      if (!payload.title || !payload.description || !payload.date || !payload.location || payload.capacity < 1) {
        setError("Please fill in all required fields.");
        return;
      }

      if (payload.visibility === "internal" && !payload.organizationId) {
        setError("Internal events must belong to an organization.");
        return;
      }

      if (eventId) {
        const updated = await updateEvent(eventId, payload);
        if (!updated?._id) {
          setError("Could not update event.");
          return;
        }
        onSaved?.(updated);
        if (onSaved) return;
        navigate(`/events/${updated._id}`);
        return;
      }

      const event = await createEvent(payload);
      navigate(redirectOnCreateToMyEvents ? "/my-events" : `/events/${event._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event. Please try again.");
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
          Total Budget <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className={inputClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.code} - {c.name}
              </option>
            ))}
          </select>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none">
              {getCurrency(String(form.currency)).symbol}
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
      <div>
        <label className="block text-sm text-slate-600 mb-1.5">
          Ticket URL <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={form.ticketUrl}
          onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })}
          className={inputClass}
          placeholder="https://example.com/tickets"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1.5">Visibility</label>
        <div className="flex gap-4">
          {(["public", "internal"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value={v}
                checked={form.visibility === v}
                disabled={form.noOrganization && v === "internal"}
                onChange={() => setForm({ ...form, visibility: v, organizationId: "" })}
              />
              <span className="text-sm text-slate-700 capitalize">{v}</span>
              {v === "internal" && (
                <span className="text-xs text-slate-400">(org members only)</span>
              )}
            </label>
          ))}
        </div>
      </div>
      {!eventId && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.noOrganization}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                noOrganization: e.target.checked,
                visibility: e.target.checked ? "public" : prev.visibility,
                organizationId: e.target.checked ? "" : prev.organizationId,
              }))
            }
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">This event is not part of any organization</span>
        </label>
      )}
      {!form.noOrganization && (
        <div>
          <label className="block text-sm text-slate-600 mb-1.5">Organization</label>
          {user?.memberships && user.memberships.length > 0 ? (
            <select
              value={form.organizationId}
              onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
              className={inputClass}
              required={form.visibility === "internal"}
            >
              <option value="">No organization</option>
              {user.memberships.map((m) =>
                m.organization ? (
                  <option key={m.organizationId} value={m.organizationId}>
                    {m.organization.name}
                  </option>
                ) : null
              )}
            </select>
          ) : (
            <p className="text-sm text-slate-400">You are not a member of any organization.</p>
          )}
        </div>
      )}
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
