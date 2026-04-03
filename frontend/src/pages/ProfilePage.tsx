import { useState } from "react";
import { useSession } from "../context/SessionContext";
import { updateMe } from "../lib/api/auth";
import ActionButton from "../components/ActionButton";

export default function ProfilePage() {
  const { user, refreshSession } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateMe({
        name: name.trim() ? name.trim() : null,
        email: email.trim().toLowerCase(),
      });
      await refreshSession();
      setSuccess("Profile updated successfully.");
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = () => {
    setError("");
    setSuccess("");
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setError("");
    setIsEditing(false);
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <main className="max-w-2xl mx-auto pt-4 pb-24">
      <h1 className="text-4xl font-bold text-slate-900 mb-2">My Profile</h1>
      <p className="text-slate-500 mb-8">Manage your account details.</p>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
          <div className="h-20 w-20 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 text-2xl font-semibold">
            {(user?.name ?? user?.email ?? "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500">Profile picture</p>
            <p className="text-xs text-slate-400">Placeholder</p>
          </div>
          {!isEditing ? <ActionButton label="Edit" variant="primary" onClick={handleStartEdit} /> : null}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

            <div className="flex items-center gap-2">
              <ActionButton
                label={saving ? "Saving..." : "Save"}
                type="submit"
                disabled={saving}
                variant="primary"
              />
              <ActionButton label="Cancel" disabled={saving} onClick={handleCancelEdit} variant="secondary" />
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Name</p>
              <p className="text-sm text-slate-800">{user?.name ?? "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
              <p className="text-sm text-slate-800">{user?.email ?? "-"}</p>
            </div>
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
          </div>
        )}
      </div>
    </main>
  );
}
