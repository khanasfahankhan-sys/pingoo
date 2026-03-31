import { Link } from "react-router-dom";

import Shell from "../components/Shell";

export default function Home() {
  return (
    <Shell>
      <section className="grid gap-6 rounded-2xl bg-white/80 p-6 shadow-frost backdrop-blur sm:p-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome to <span className="text-primary">Pingoo</span>
            </h1>
            <p className="mt-3 max-w-2xl text-navy/80">
              An arctic-themed coding journey inspired by bite-sized learning. Follow the penguin,
              keep your streak warm, and ship real skills.
            </p>
          </div>

          <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-3xl text-navy sm:flex">
            🐧
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-navy shadow-frost hover:bg-accent"
          >
            Create an account
          </Link>
          <Link
            to="/courses"
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-ice hover:bg-navy/90"
          >
            Browse courses
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Tiny lessons", body: "Short, focused steps that fit into any day." },
            { title: "Practice-first", body: "Learn by doing with interactive challenges." },
            { title: "Track progress", body: "See exactly what you’ve completed and what’s next." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-primary/20 bg-ice p-4">
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="mt-1 text-sm text-navy/75">{c.body}</div>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}
