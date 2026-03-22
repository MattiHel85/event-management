import { Link } from "react-router-dom";
import { useState } from "react";
import { signUp } from "../lib/api/auth";

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    try {
      await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setStatus("success");
      setMessage("Account created successfully. You can now sign in.");
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        agree: false,
      });
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not create account right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";

  return (
    <main className="max-w-xl mx-auto pt-4 pb-24">
      <div className="bg-gradient-to-r from-emerald-100 via-teal-50 to-cyan-100 border border-emerald-200 rounded-2xl p-6 mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
        <p className="text-slate-600">Set up your profile to start organizing events and budgets.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-600 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="Jane Doe"
              autoComplete="name"
            />
          </div>

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

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className={inputClass}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              required
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
              className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            I agree to the terms and privacy policy.
          </label>

          {status !== "idle" && <p className={`text-sm ${status === "success" ? "text-amber-700" : "text-red-500"}`}>{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-slate-500 mt-6">
          Already have an account? <Link to="/signin" className="text-blue-600 hover:text-blue-500 font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
