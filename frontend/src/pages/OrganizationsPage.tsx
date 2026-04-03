import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import {
  joinOrganizationWithCode,
  listDiscoverOrganizations,
  requestJoinOrganization,
  type OrganizationDiscoverItem,
} from "../lib/api/organizations";

export default function OrganizationsPage() {
  const { user, refreshSession } = useSession();
  const [items, setItems] = useState<OrganizationDiscoverItem[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyOrgId, setBusyOrgId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listDiscoverOrganizations();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || isPlatformAdmin) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [user, isPlatformAdmin]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const onRequestJoin = async (orgId: string) => {
    setBusyOrgId(orgId);
    setError("");
    try {
      await requestJoinOrganization(orgId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setBusyOrgId(null);
    }
  };

  const onJoinWithCode = async (orgId: string) => {
    const code = (codes[orgId] ?? "").trim();
    if (!code) {
      setError("Please enter a join code.");
      return;
    }

    setBusyOrgId(orgId);
    setError("");
    try {
      await joinOrganizationWithCode(orgId, code);
      await Promise.all([refresh(), refreshSession()]);
      setCodes((prev) => ({ ...prev, [orgId]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join organization");
    } finally {
      setBusyOrgId(null);
    }
  };

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (isPlatformAdmin) {
    return <Navigate to="/admin/organizations" replace />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Organizations</h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse organizations, request access, or join instantly with an organization code.
        </p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading ? <p className="text-sm text-slate-600">Loading organizations...</p> : null}

      {!loading && sortedItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-sm text-slate-600">
          No organizations found.
        </div>
      ) : null}

      {!loading && sortedItems.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedItems.map((org) => {
            const isBusy = busyOrgId === org.id;
            return (
              <article key={org.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{org.name}</h3>
                  <p className="text-xs text-slate-500">/{org.slug}</p>
                </div>

                {org.isMember ? (
                  <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
                    Member ({org.memberRole})
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <input
                        value={codes[org.id] ?? ""}
                        onChange={(e) => setCodes((prev) => ({ ...prev, [org.id]: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Enter join code"
                      />
                      <button
                        type="button"
                        onClick={() => void onJoinWithCode(org.id)}
                        disabled={isBusy}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                      >
                        {isBusy ? "Joining..." : "Join With Code"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => void onRequestJoin(org.id)}
                      disabled={isBusy || org.hasPendingRequest}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {org.hasPendingRequest ? "Request Pending" : "Request To Join"}
                    </button>
                  </>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
