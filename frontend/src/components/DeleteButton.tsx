import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../context/EventsContext";

export default function DeleteButton({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  const { deleteEvent } = useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setLoading(true);
    setError("");

    try {
      await deleteEvent(eventId);
      navigate("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="w-full border border-red-200 hover:border-red-400 text-red-500 hover:text-red-600 bg-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? "Deleting..." : "Delete Event"}
      </button>
    </div>
  );
}
