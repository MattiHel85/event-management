import Link from "next/link";

const features = [
  {
    icon: "📅",
    title: "Plan Events",
    description:
      "Create and manage events from start to finish. Track dates, locations, and capacity all in one place.",
  },
  {
    icon: "📊",
    title: "Budget",
    description:
      "Set budgets per event, track spending by category, and visualise your financials with clear charts.",
  },
  {
    icon: "👥",
    title: "Guest List",
    description:
      "Manage attendees, send invitations, and track RSVPs so you always know who's coming.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8">
        <span className="font-semibold text-slate-900 tracking-tight">
          Event Management
        </span>
        <Link
          href="/events"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight max-w-3xl">
          Everything you need to{" "}
          <span className="text-blue-600">run great events</span>
        </h1>
        <p className="text-slate-500 text-xl max-w-xl mb-12 leading-relaxed">
          Plan, budget, and manage your guests in one clean dashboard. Built for
          teams who care about the details.
        </p>
        <Link
          href="/events"
          className="bg-blue-600 hover:bg-blue-500 text-white text-base font-medium px-8 py-4 rounded-xl transition-colors shadow-sm"
        >
          Get Started →
        </Link>
      </main>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto w-full px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon, title, description }) => (
            <div
              key={title}
              className="border border-slate-200 rounded-xl p-6 bg-slate-50"
            >
              <span className="text-3xl mb-4 block">{icon}</span>
              <h3 className="text-slate-900 font-semibold text-lg mb-2">
                {title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
