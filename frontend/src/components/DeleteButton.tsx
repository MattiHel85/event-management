import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../context/EventsContext";
import ActionButton from "./ActionButton";

export default function DeleteButton({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  const { deleteEvent } = useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");

  const generateDeleteCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleStartDelete = () => {
    const code = generateDeleteCode();
    setDeleteCode(code);
    setEnteredCode("");
    setError("");
    setConfirming(true);
  };

  const handleCancelDelete = () => {
    setConfirming(false);
    setDeleteCode("");
    setEnteredCode("");
  };

  const handleDelete = async () => {
    if (enteredCode.trim().toUpperCase() !== deleteCode) {
      setError("Delete code does not match.");
      return;
    }
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
      {!confirming ? (
        <ActionButton
          label="Delete Event"
          onClick={handleStartDelete}
          disabled={loading}
          variant="danger"
          fullWidth
        />
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-3">
          <p className="text-sm text-red-700">
            Are you sure you want to delete this event? Type <span className="font-semibold">{deleteCode}</span> to confirm.
          </p>
          <input
            type="text"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-slate-900"
            placeholder="Enter delete code"
          />
          <div className="flex items-center gap-2">
            <ActionButton
              label={loading ? "Deleting..." : "Confirm Delete"}
              onClick={handleDelete}
              disabled={loading}
              variant="dangerSoft"
            />
            <ActionButton label="Cancel" onClick={handleCancelDelete} disabled={loading} variant="secondary" />
          </div>
        </div>
      )}
    </div>
  );
}
