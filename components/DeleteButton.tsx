"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/events");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="w-full border border-red-200 hover:border-red-400 text-red-500 hover:text-red-600 bg-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 text-sm"
    >
      {loading ? "Deleting..." : "Delete Event"}
    </button>
  );
}
