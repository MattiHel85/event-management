import { useState, useEffect } from "react";
import { useSession } from "../context/SessionContext";
import {
  getMyOrganizations,
  getOrganizationMembers,
  updateOrganizationMember,
  type MyOrganization,
  type OrganizationMember,
} from "../lib/api/organizations";
import ActionButton from "../components/ActionButton";

export default function MyOrganizationsPage() {
  const { user } = useSession();
  const [organizations, setOrganizations] = useState<MyOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<MyOrganization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [userRole, setUserRole] = useState<"OWNER" | "ADMIN" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    role: "OWNER" | "ADMIN" | "MEMBER";
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const orgs = await getMyOrganizations();
      setOrganizations(orgs);
      if (orgs.length > 0) {
        loadMembers(orgs[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (org: MyOrganization) => {
    setSelectedOrg(org);
    setMembers([]);
    setUserRole(null);
    try {
      const response = await getOrganizationMembers(org.id);
      setMembers(response.members);
      setUserRole(response.userRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    }
  };

  const handleEditStart = (member: OrganizationMember) => {
    setEditingMember(member.id);
    setEditValues({
      role: member.role,
    });
  };

  const handleEditCancel = () => {
    setEditingMember(null);
    setEditValues(null);
  };

  const handleSaveMember = async () => {
    if (!selectedOrg || !editingMember || !editValues) return;
    setSaving(true);

    try {
      const updated = await updateOrganizationMember(selectedOrg.id, editingMember, editValues);
      setMembers(members.map((m) => (m.id === editingMember ? updated : m)));
      setEditingMember(null);
      setEditValues(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const canEditRole = userRole === "OWNER";
  const canEditMember = (_member: OrganizationMember) => userRole === "OWNER";

  if (loading) {
    return <div className="max-w-4xl mx-auto pt-4 pb-24 text-slate-500">Loading organizations...</div>;
  }

  if (organizations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto pt-4 pb-24">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">My Organizations</h1>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">You are not an admin of any organizations yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Organizations</h1>
      <p className="mb-4 text-sm text-slate-500">
        You can change member roles here. Name and email updates are handled in My Profile.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {organizations.map((org) => (
          <button
            key={org.id}
            onClick={() => loadMembers(org)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedOrg?.id === org.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <h3 className="font-semibold text-slate-900 mb-1">{org.name}</h3>
            <p className="text-xs text-slate-500 capitalize">{org.userRole}</p>
          </button>
        ))}
      </div>

      {selectedOrg && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">{selectedOrg.name} - Members</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                    {editingMember === member.id ? (
                      <>
                        <td className="px-6 py-4 text-sm text-slate-900">{member.user?.name || "—"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{member.user?.email}</td>
                        <td className="px-6 py-4">
                          {canEditRole && member.user?.id !== user?.id ? (
                            <select
                              value={editValues?.role ?? "MEMBER"}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues!,
                                  role: e.target.value as
                                    | "OWNER"
                                    | "ADMIN"
                                    | "MEMBER",
                                })
                              }
                              className="px-2 py-1 border border-slate-300 rounded text-sm"
                            >
                              <option value="OWNER">Owner</option>
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                          ) : (
                            <span className="text-sm text-slate-600 capitalize">
                              {editValues?.role}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <ActionButton
                            label="Save"
                            onClick={handleSaveMember}
                            disabled={saving}
                            variant="primary"
                            size="sm"
                          />
                          <ActionButton
                            label="Cancel"
                            onClick={handleEditCancel}
                            disabled={saving}
                            variant="secondary"
                            size="sm"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {member.user?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{member.user?.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {canEditMember(member) && member.user?.id !== user?.id ? (
                            <ActionButton
                              label="Edit"
                              onClick={() => handleEditStart(member)}
                              variant="primary"
                              size="sm"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
