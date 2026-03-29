import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn } from "../lib/api/auth";

export default function SignInPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setMessage("");

    if (!form.email || !form.password) {
      setStatus("error");
      setMessage("Email and password are required.");
      setSubmitting(false);
      return;
    }

    try {
      const data = await signIn({
        email: form.email,
        password: form.password,
      });

      setStatus("success");
      setMessage(data.message ?? "Sign in successful.");
      window.setTimeout(() => navigate("/dashboard"), 300);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not sign in right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <main className="max-w-xl mx-auto pt-4 pb-24">
      <div className="bg-gradient-to-r from-sky-100 via-blue-50 to-cyan-100 border border-sky-200 rounded-2xl p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
        <p className="text-slate-600">Access your dashboard and keep planning your next event.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm({ ...form, remember: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>

          {status !== "idle" && <p className={`text-sm ${status === "success" ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {submitting ? "Checking..." : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6">
          Need an account? <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-medium">Create one</Link>
        </p>
      </div>
    </main>
  );
}
