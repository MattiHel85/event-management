"use client";

import { FormEvent, useState } from "react";

const CATEGORIES = [
  "Event Planning",
  "Budget",
  "Guest Management",
  "Integrations",
  "Reports",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High"];

export default function FeatureRequestPage() {
  const [form, setForm] = useState({
    title: "",
    category: CATEGORIES[0],
    priority: PRIORITIES[1],
    details: "",
    contact: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm({
        title: "",
        category: CATEGORIES[0],
        priority: PRIORITIES[1],
        details: "",
        contact: "",
      });
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <main className="max-w-3xl mx-auto pt-4 pb-24">
      <div className="bg-gradient-to-r from-amber-100 via-yellow-50 to-orange-100 border border-amber-200 rounded-2xl p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Feature Request</h1>
        <p className="text-slate-600">
          Tell us what you want next. Share your idea and we will prioritize it for upcoming releases.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Feature Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="Example: Export budget report to PDF"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className={inputClass}
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Details</label>
            <textarea
              required
              rows={6}
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
              className={`${inputClass} resize-y`}
              placeholder="Describe the problem and the ideal solution..."
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1.5">
              Contact (optional)
            </label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className={inputClass}
              placeholder="Email or username"
            />
          </div>

          {status === "success" && (
            <p className="text-emerald-600 text-sm">Thanks! Your feature request was submitted.</p>
          )}
          {status === "error" && (
            <p className="text-red-500 text-sm">Could not submit right now. Please try again.</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Feature Request"}
          </button>
        </form>
      </div>
    </main>
  );
}
