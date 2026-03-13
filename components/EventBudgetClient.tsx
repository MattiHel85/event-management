"use client";

import { useState } from "react";
import { IBudgetItem } from "@/lib/models/Event";
import { formatAmount } from "@/lib/currencies";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PIE_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"];

const CATEGORIES = ["Venue", "Catering", "Marketing", "Equipment", "Staff", "Other"];

function StatCard({
  label,
  value,
  sub,
  color = "text-slate-900",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

interface Props {
  eventId: string;
  totalBudget: number | undefined;
  currency: string;
  initialItems: IBudgetItem[];
}

export default function EventBudgetClient({ eventId, totalBudget, currency, initialItems }: Props) {
  const [items, setItems] = useState<IBudgetItem[]>(initialItems);
  const [form, setForm] = useState({ category: CATEGORIES[0], description: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalSpent = items.reduce((s, i) => s + i.amount, 0);
  const budget = totalBudget ?? 0;
  const remaining = budget - totalSpent;

  // Aggregate by category for pie chart
  const breakdown = Object.entries(
    items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + item.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const handleAdd = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          description: form.description.trim(),
          amount: Number(form.amount),
        }),
      });

      if (!res.ok) {
        setError("Failed to add item. Please try again.");
        return;
      }

      const newItem: IBudgetItem = await res.json();
      setItems((prev) => [...prev, newItem]);
      setForm({ category: CATEGORIES[0], description: "", amount: "" });
    } catch {
      setError("Failed to add item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const inputClass =
    "bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm";

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          label="Total Budget"
          value={budget > 0 ? formatAmount(budget, currency) : "Not set"}
          sub="Set when creating the event"
        />
        <StatCard
          label="Total Spent"
          value={formatAmount(totalSpent, currency)}
          sub={budget > 0 ? `${Math.round((totalSpent / budget) * 100)}% of budget` : undefined}
          color="text-blue-600"
        />
        <StatCard
          label="Remaining"
          value={budget > 0 ? formatAmount(remaining, currency) : "—"}
          sub={budget > 0 ? (remaining >= 0 ? "Under budget" : "Over budget") : "No budget set"}
          color={budget === 0 ? "text-slate-400" : remaining >= 0 ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      {/* Add item form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-5">Add Budget Item</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-48">
            <label className="text-xs text-slate-500">Description</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${inputClass} w-full`}
              placeholder="What is this for?"
            />
          </div>
          <div className="flex flex-col gap-1.5 w-36">
            <label className="text-xs text-slate-500">Amount</label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`${inputClass} w-full`}
              placeholder="0.00"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors h-[38px]"
          >
            {saving ? "Adding..." : "+ Add"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Items</h2>
          </div>
          {items.length === 0 ? (
            <p className="px-6 py-8 text-slate-400 text-sm">No items yet. Add one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-6 py-3">
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{item.description}</td>
                    <td className="px-6 py-3 text-right font-medium text-slate-900">
                      {formatAmount(item.amount, currency)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-slate-700">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-slate-900">
                    {formatAmount(totalSpent, currency)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-6">Spend by Category</h2>
          {breakdown.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-300 text-sm">
              No data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                  formatter={(value) => [formatAmount(Number(value), currency), ""]}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
