import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import {
  assignOrganizationMember,
  createOrganization,
  listOrganizations,
  type OrganizationSummary,
} from "../lib/api/organizations";

export default function AdminOrganizationsPage() {
  const { user } = useSession();
  const [items, setItems] = useState<OrganizationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", ownerEmail: "" });
  const [memberForm, setMemberForm] = useState({ orgId: "", email: "", role: "MEMBER" as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" });
  const [submitting, setSubmitting] = useState(false);

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listOrganizations();
      setItems(data);
      if (!memberForm.orgId && data.length > 0) {
        setMemberForm((prev) => ({ ...prev, orgId: data[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPlatformAdmin) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [isPlatformAdmin]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items]
  );

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createOrganization({
        name: form.name,
        slug: form.slug || undefined,
        ownerEmail: form.ownerEmail || undefined,
      });
      setForm({ name: "", slug: "", ownerEmail: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setSubmitting(false);
    }
  };

  const onAssignMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.orgId) return;
    setSubmitting(true);
    setError("");
    try {
      await assignOrganizationMember(memberForm.orgId, {
        email: memberForm.email,
        role: memberForm.role,
      });
      setMemberForm((prev) => ({ ...prev, email: "" }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign member");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Organization Admin</h2>
        <p className="mt-1 text-sm text-slate-600">Create organizations and assign organization admins.</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form id="add-organization" onSubmit={onCreate} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 scroll-mt-24">
          <h3 className="text-base font-semibold text-slate-900">Add Organization</h3>
          <p className="text-xs text-slate-500">
            Required: name. Optional: slug, owner email.
          </p>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Organization name (required)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
            placeholder="Slug (optional, 2-80 chars)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={form.ownerEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, ownerEmail: e.target.value }))}
            placeholder="Owner email (optional)"
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create"}
          </button>
        </form>

        <form onSubmit={onAssignMember} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Assign Member To Organization</h3>
          <select
            value={memberForm.orgId}
            onChange={(e) => setMemberForm((prev) => ({ ...prev, orgId: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Choose organization</option>
            {sortedItems.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <input
            value={memberForm.email}
            onChange={(e) => setMemberForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="User email"
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <select
            value={memberForm.role}
            onChange={(e) => setMemberForm((prev) => ({ ...prev, role: e.target.value as typeof memberForm.role }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="MEMBER">MEMBER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Assign"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Organizations</h3>
        {loading ? <p className="mt-3 text-sm text-slate-600">Loading...</p> : null}
        {!loading && sortedItems.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No organizations yet.</p>
        ) : null}
        {!loading && sortedItems.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Slug</th>
                  <th className="py-2 pr-4">Members</th>
                  <th className="py-2 pr-4">Events</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((org) => (
                  <tr key={org.id} className="border-b border-slate-100 text-slate-800">
                    <td className="py-2 pr-4">{org.name}</td>
                    <td className="py-2 pr-4">{org.slug}</td>
                    <td className="py-2 pr-4">{org.memberCount}</td>
                    <td className="py-2 pr-4">{org.eventCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
