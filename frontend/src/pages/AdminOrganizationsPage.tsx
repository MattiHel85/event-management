import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import {
  approveOrganizationJoinRequest,
  assignOrganizationMember,
  createOrganization,
  listOrganizationJoinRequests,
  listOrganizations,
  setOrganizationJoinCode,
  type OrganizationJoinRequestItem,
  type OrganizationSummary,
} from "../lib/api/organizations";

export default function AdminOrganizationsPage() {
  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const { user } = useSession();
  const [items, setItems] = useState<OrganizationSummary[]>([]);
  const [joinRequests, setJoinRequests] = useState<OrganizationJoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", ownerEmail: "", joinCode: "", thisIsMyOrganization: false });
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [memberForm, setMemberForm] = useState({ orgId: "", email: "", role: "MEMBER" as "OWNER" | "ADMIN" | "MEMBER" });
  const [joinCodeForm, setJoinCodeForm] = useState({ orgId: "", joinCode: "" });
  const [submitting, setSubmitting] = useState(false);
  const [revealedJoinCodes, setRevealedJoinCodes] = useState<Record<string, boolean>>({});
  const [copiedJoinCodeOrgId, setCopiedJoinCodeOrgId] = useState<string | null>(null);

  const isPlatformAdmin = user?.role === "PLATFORM_ADMIN";

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listOrganizations();
      const requests = await listOrganizationJoinRequests();
      setItems(data);
      setJoinRequests(requests);
      if (!memberForm.orgId && data.length > 0) {
        setMemberForm((prev) => ({ ...prev, orgId: data[0].id }));
      }
      if (!joinCodeForm.orgId && data.length > 0) {
        setJoinCodeForm((prev) => ({ ...prev, orgId: data[0].id }));
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
        joinCode: form.joinCode.trim() || undefined,
        thisIsMyOrganization: form.thisIsMyOrganization,
      });
      setForm({ name: "", slug: "", ownerEmail: "", joinCode: "", thisIsMyOrganization: false });
      setIsSlugManuallyEdited(false);
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

  const onApproveJoinRequest = async (requestId: string) => {
    setSubmitting(true);
    setError("");
    try {
      await approveOrganizationJoinRequest(requestId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve join request");
    } finally {
      setSubmitting(false);
    }
  };

  const onSetJoinCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeForm.orgId) return;
    setSubmitting(true);
    setError("");
    try {
      await setOrganizationJoinCode(joinCodeForm.orgId, joinCodeForm.joinCode);
      setJoinCodeForm((prev) => ({ ...prev, joinCode: "" }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update join code");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleJoinCodeVisibility = (orgId: string) => {
    setRevealedJoinCodes((prev) => ({ ...prev, [orgId]: !prev[orgId] }));
  };

  const copyJoinCode = async (orgId: string, joinCode: string) => {
    if (!joinCode) return;
    try {
      await navigator.clipboard.writeText(joinCode);
      setCopiedJoinCodeOrgId(orgId);
      window.setTimeout(() => {
        setCopiedJoinCodeOrgId((prev) => (prev === orgId ? null : prev));
      }, 1500);
    } catch {
      setError("Failed to copy join code");
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

      <div className="grid gap-6 lg:grid-cols-3">
        <form id="add-organization" onSubmit={onCreate} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 scroll-mt-24">
          <h3 className="text-base font-semibold text-slate-900">Add Organization</h3>
          <p className="text-xs text-slate-500">
            Required: name. Optional: slug, owner email.
          </p>
          <input
            value={form.name}
            onChange={(e) => {
              const nextName = e.target.value;
              setForm((prev) => ({
                ...prev,
                name: nextName,
                slug: isSlugManuallyEdited ? prev.slug : toSlug(nextName),
              }));
            }}
            placeholder="Organization name (required)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            value={form.slug}
            onChange={(e) => {
              const nextSlug = e.target.value;
              setIsSlugManuallyEdited(true);
              setForm((prev) => ({ ...prev, slug: nextSlug }));
            }}
            onBlur={() => {
              if (form.slug.trim() === "") {
                setIsSlugManuallyEdited(false);
                setForm((prev) => ({ ...prev, slug: toSlug(prev.name) }));
              }
            }}
            placeholder="Slug (auto-generated, editable)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={form.ownerEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, ownerEmail: e.target.value }))}
            placeholder="Owner email (optional)"
            type="email"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={form.joinCode}
            onChange={(e) => setForm((prev) => ({ ...prev, joinCode: e.target.value }))}
            placeholder="Join code (optional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.thisIsMyOrganization}
              onChange={(e) => setForm((prev) => ({ ...prev, thisIsMyOrganization: e.target.checked }))}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">This is my organization (join as owner)</span>
          </label>
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
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Assign"}
          </button>
        </form>

        <form onSubmit={onSetJoinCode} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-slate-900">Set Organization Join Code</h3>
          <p className="text-xs text-slate-500">Users can instantly join with this code.</p>
          <select
            value={joinCodeForm.orgId}
            onChange={(e) => setJoinCodeForm((prev) => ({ ...prev, orgId: e.target.value }))}
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
            value={joinCodeForm.joinCode}
            onChange={(e) => setJoinCodeForm((prev) => ({ ...prev, joinCode: e.target.value }))}
            placeholder="Join code (empty to disable)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Join Code"}
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
                  <th className="py-2 pr-4">Join Code</th>
                  <th className="py-2 pr-4">Members</th>
                  <th className="py-2 pr-4">Events</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((org) => (
                  <tr key={org.id} className="border-b border-slate-100 text-slate-800">
                    <td className="py-2 pr-4">{org.name}</td>
                    <td className="py-2 pr-4">{org.slug}</td>
                    <td className="py-2 pr-4">
                      {!org.joinCode ? (
                        "-"
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="min-w-16 font-mono text-slate-700">
                            {revealedJoinCodes[org.id] ? org.joinCode : "******"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleJoinCodeVisibility(org.id)}
                            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            {revealedJoinCodes[org.id] ? "Hide" : "Reveal"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyJoinCode(org.id, org.joinCode ?? "")}
                            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            {copiedJoinCodeOrgId === org.id ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-4">{org.memberCount}</td>
                    <td className="py-2 pr-4">{org.eventCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Pending Join Requests</h3>
        {joinRequests.length === 0 ? <p className="mt-3 text-sm text-slate-600">No pending requests.</p> : null}
        {joinRequests.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">Organization</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Requested</th>
                  <th className="py-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {joinRequests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-100 text-slate-800">
                    <td className="py-2 pr-4">{request.organization?.name ?? "Unknown"}</td>
                    <td className="py-2 pr-4">{request.user?.email ?? "Unknown user"}</td>
                    <td className="py-2 pr-4">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => void onApproveJoinRequest(request.id)}
                        disabled={submitting}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                      >
                        Approve
                      </button>
                    </td>
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
