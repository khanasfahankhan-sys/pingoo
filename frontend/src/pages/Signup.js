import Shell from "../components/Shell";

export default function Signup() {
  return (
    <Shell>
      <div className="mx-auto max-w-md rounded-2xl bg-white/80 p-6 shadow-frost backdrop-blur">
        <h1 className="text-2xl font-semibold tracking-tight">Signup</h1>
        <p className="mt-1 text-sm text-navy/75">Create your Pingoo account.</p>

        <form className="mt-6 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Username</span>
            <input
              className="rounded-xl border border-primary/20 bg-white px-3 py-2 outline-none focus:border-accent"
              placeholder="penguin123"
              autoComplete="username"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              className="rounded-xl border border-primary/20 bg-white px-3 py-2 outline-none focus:border-accent"
              placeholder="you@pingoo.dev"
              autoComplete="email"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              className="rounded-xl border border-primary/20 bg-white px-3 py-2 outline-none focus:border-accent"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>

          <button
            type="button"
            className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-navy shadow-frost hover:bg-accent"
          >
            Create account
          </button>
        </form>
      </div>
    </Shell>
  );
}

