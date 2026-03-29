import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

function ActionCard({ to, title, description }: { to: string; title: string; description: string }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow"
    >
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useSession();

  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Session missing. Please sign in again.
      </div>
    );
  }

  const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">
          Signed in as {user.name ?? user.email} ({isPlatformAdmin ? "Platform Admin" : "User"})
        </p>
      </div>

      {isPlatformAdmin ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Platform Admin Tools</h3>
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Quick action:{" "}
            <Link to="/admin/organizations#add-organization" className="font-semibold text-blue-700 hover:text-blue-600">
              Add Organization
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ActionCard
              to="/events"
              title="Admin Events"
              description="Manage platform-wide event data and review event operations."
            />
            <ActionCard
              to="/admin/organizations#add-organization"
              title="Organization Admin"
              description="Create organizations and assign organization admins."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Your Organization</h3>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {user.memberships.length === 0 ? (
              <p className="text-sm text-slate-600">You do not belong to an organization yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700">
                {user.memberships.map((membership) => (
                  <li key={membership.id}>
                    <span className="font-medium text-slate-900">
                      {membership.organization?.name ?? "Unknown organization"}
                    </span>{" "}
                    · Role: {membership.role}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ActionCard
              to="/events"
              title="Manage Events"
              description="View and manage events available to your organization."
            />
            <ActionCard
              to="/budget"
              title="Manage Budgets"
              description="Administer budget lines and reporting for your event work."
            />
          </div>
        </div>
      )}
    </section>
  );
}
