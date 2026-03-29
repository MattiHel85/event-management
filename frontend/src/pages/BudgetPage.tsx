import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useEvents } from "../context/EventsContext";
import { fetchBudgetPlan, updateBudgetPlan, type BudgetPeriod } from "../lib/api/budgets";

const PIE_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

function formatMonth(date: Date) {
  return date.toLocaleString("en-US", { month: "short" });
}

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

export default function BudgetPage() {
  const { events, loading, error } = useEvents();
  const [period, setPeriod] = useState<BudgetPeriod>("YEARLY");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [quarter, setQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3) + 1);
  const [planAmount, setPlanAmount] = useState<number>(0);
  const [planLoading, setPlanLoading] = useState<boolean>(false);
  const [planSaving, setPlanSaving] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string>("");

  const budgetByEvent = useMemo(
    () =>
      events.map((event) => {
        const spent = (event.budgetItems ?? []).reduce((sum, item) => sum + item.amount, 0);
        return {
          id: event._id ?? "",
          event: event.title,
          budget: event.budget ?? 0,
          spent,
          remaining: (event.budget ?? 0) - spent,
          date: event.date,
        };
      }),
    [events]
  );

  const spendingOverTime = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of budgetByEvent) {
      const key = formatMonth(new Date(row.date));
      map.set(key, (map.get(key) ?? 0) + row.spent);
    }
    return Array.from(map.entries()).map(([month, spent]) => ({ month, spent }));
  }, [budgetByEvent]);

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const event of events) {
      for (const item of event.budgetItems ?? []) {
        map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
      }
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [events]);

  const totalBudget = useMemo(() => budgetByEvent.reduce((s, e) => s + e.budget, 0), [budgetByEvent]);
  const totalSpent = useMemo(() => budgetByEvent.reduce((s, e) => s + e.spent, 0), [budgetByEvent]);
  const remaining = totalBudget - totalSpent;

  useEffect(() => {
    const loadPlan = async () => {
      setPlanLoading(true);
      setPlanError("");
      try {
        const plan = await fetchBudgetPlan({ period, year, quarter });
        setPlanAmount(plan.amount);
      } catch (err) {
        setPlanError(err instanceof Error ? err.message : "Failed to load budget plan");
      } finally {
        setPlanLoading(false);
      }
    };

    void loadPlan();
  }, [period, year, quarter]);

  const savePlan = async () => {
    setPlanSaving(true);
    setPlanError("");
    try {
      const saved = await updateBudgetPlan({
        period,
        year,
        quarter: period === "QUARTERLY" ? quarter : undefined,
        amount: planAmount,
      });
      setPlanAmount(saved.amount);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : "Failed to save budget plan");
    } finally {
      setPlanSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-600">Loading budgets...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Budget Plan</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="YEARLY">Yearly</option>
            <option value="QUARTERLY">Quarterly</option>
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={quarter}
            onChange={(e) => setQuarter(Number(e.target.value))}
            disabled={period !== "QUARTERLY"}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value={1}>Q1</option>
            <option value={2}>Q2</option>
            <option value={3}>Q3</option>
            <option value={4}>Q4</option>
          </select>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={planAmount}
              onChange={(e) => setPlanAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={savePlan}
              disabled={planSaving || planLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {planSaving ? "Saving" : "Save"}
            </button>
          </div>
        </div>
        {planError ? <p className="mt-3 text-sm text-red-500">{planError}</p> : null}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Total Budget" value={`$${totalBudget.toLocaleString()}`} sub="Across all events" />
        <StatCard
          label="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          sub={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% of budget`}
          color="text-blue-600"
        />
        <StatCard
          label="Remaining"
          value={`$${remaining.toLocaleString()}`}
          sub={remaining >= 0 ? "Under budget" : "Over budget"}
          color={remaining >= 0 ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-6">Budget vs Spent by Event</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={budgetByEvent} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="event" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="budget" name="Budget" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" name="Spent" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-6">Spending Over Time</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={spendingOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }} />
              <Line
                type="monotone"
                dataKey="spent"
                name="Spent"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ r: 4, fill: "#2563eb" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-6">Spend by Category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={breakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                {breakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Event Budgets</h2>
        {budgetByEvent.length === 0 ? (
          <p className="text-sm text-slate-600">No event budgets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">Event</th>
                  <th className="py-2 pr-4">Budget</th>
                  <th className="py-2 pr-4">Spent</th>
                  <th className="py-2 pr-4">Remaining</th>
                  <th className="py-2 pr-4">Link</th>
                </tr>
              </thead>
              <tbody>
                {budgetByEvent.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 text-slate-800">
                    <td className="py-2 pr-4">{row.event}</td>
                    <td className="py-2 pr-4">${row.budget.toLocaleString()}</td>
                    <td className="py-2 pr-4">${row.spent.toLocaleString()}</td>
                    <td className={`py-2 pr-4 ${row.remaining < 0 ? "text-red-500" : "text-emerald-600"}`}>
                      ${row.remaining.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      <Link className="text-blue-600 hover:text-blue-500" to={`/events/${row.id}/budget`}>
                        View event budget
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
