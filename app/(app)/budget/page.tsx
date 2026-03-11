"use client";

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

const budgetByEvent = [
  { event: "Next.js Conf", budget: 5000, spent: 3800 },
  { event: "TS Workshop", budget: 1500, spent: 1500 },
  { event: "MongoDB Meetup", budget: 800, spent: 420 },
];

const spendingOverTime = [
  { month: "Jan", spent: 1200 },
  { month: "Feb", spent: 2100 },
  { month: "Mar", spent: 1800 },
  { month: "Apr", spent: 3400 },
  { month: "May", spent: 2900 },
  { month: "Jun", spent: 4200 },
];

const breakdown = [
  { name: "Venue", value: 4200 },
  { name: "Catering", value: 2800 },
  { name: "Marketing", value: 1400 },
  { name: "Equipment", value: 900 },
  { name: "Other", value: 420 },
];

const PIE_COLORS = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

const totalBudget = budgetByEvent.reduce((s, e) => s + e.budget, 0);
const totalSpent = budgetByEvent.reduce((s, e) => s + e.spent, 0);
const remaining = totalBudget - totalSpent;

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
  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard
          label="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          sub="Across all events"
        />
        <StatCard
          label="Total Spent"
          value={`$${totalSpent.toLocaleString()}`}
          sub={`${Math.round((totalSpent / totalBudget) * 100)}% of budget`}
          color="text-blue-600"
        />
        <StatCard
          label="Remaining"
          value={`$${remaining.toLocaleString()}`}
          sub={remaining >= 0 ? "Under budget" : "Over budget"}
          color={remaining >= 0 ? "text-emerald-600" : "text-red-500"}
        />
      </div>

      {/* Bar chart — budget vs spent per event */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-6">
          Budget vs Spent by Event
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={budgetByEvent} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="event" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Bar dataKey="budget" name="Budget" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
            <Bar dataKey="spent" name="Spent" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Line chart — spending over time */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-6">
            Spending Over Time
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={spendingOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
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

        {/* Pie chart — spend breakdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-6">
            Spend by Category
          </h2>
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
                formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
