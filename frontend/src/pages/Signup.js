import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Shell from "../components/Shell";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const res = await signup({ username, email, password });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || "Signup failed.");
      return;
    }
    navigate("/courses");
  }

  return (
    <Shell>
      <div className="mx-auto max-w-md rounded-2xl bg-white/80 p-6 shadow-frost backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">Signup</h1>
        <p className="mt-1 text-sm text-navy/75">Create your Pingoo account.</p>

        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Username</span>
            <input
              className="rounded-xl border border-primary/20 bg-white px-3 py-2 outline-none focus:border-accent"
              placeholder="penguin123"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              className="rounded-xl border border-primary/20 bg-white px-3 py-2 outline-none focus:border-accent"
              placeholder="you@pingoo.dev"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              className="rounded-xl border border-primary/20 bg-white px-3 py-2 outline-none focus:border-accent"
              placeholder="••••••••"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-navy shadow-frost hover:bg-accent"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>

          <div className="text-sm text-navy/75">
            Already have an account?{" "}
            <Link className="font-semibold text-navy underline decoration-primary/60" to="/login">
              Login
            </Link>
          </div>
        </form>
      </div>
    </Shell>
  );
}

