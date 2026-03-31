import Shell from "../components/Shell";

import { useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";

function formatLabel(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/courses/");
        if (!cancelled) setCourses(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || "Failed to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasCourses = useMemo(() => courses.length > 0, [courses.length]);

  return (
    <Shell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Courses <span className="ml-2 align-middle">🐧</span>
          </h1>
          <p className="mt-1 text-sm text-navy/75">Pick a path and start learning.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-primary/15 bg-white/70 p-6 shadow-frost backdrop-blur">
          <div className="text-sm font-semibold">Loading courses…</div>
          <div className="mt-1 text-sm text-navy/70">The penguins are sliding them over.</div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-sm font-semibold text-red-900">Couldn’t load courses</div>
          <div className="mt-1 text-sm text-red-800">{error}</div>
        </div>
      ) : !hasCourses ? (
        <div className="rounded-2xl border border-primary/15 bg-white/70 p-6 shadow-frost backdrop-blur">
          <div className="text-sm font-semibold">No courses yet</div>
          <div className="mt-1 text-sm text-navy/70">Create a course in Django admin to see it here.</div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <article
              key={c.id ?? c.slug ?? c.title}
              className="group relative overflow-hidden rounded-2xl border border-primary/15 bg-white/80 p-5 shadow-frost backdrop-blur transition hover:-translate-y-0.5"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold leading-snug">{c.title}</h2>
                  <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-navy">
                    {formatLabel(c.level) || "Course"}
                  </span>
                </div>

                <p className="mt-2 line-clamp-3 text-sm text-navy/75">
                  {c.description || "No description yet. Add one to help learners pick the right path."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {c.language ? (
                    <span className="rounded-full border border-primary/20 bg-ice px-2.5 py-1 text-xs font-semibold text-navy">
                      {c.language}
                    </span>
                  ) : null}
                  <span className="rounded-full border border-primary/20 bg-ice px-2.5 py-1 text-xs text-navy/80">
                    Arctic mode
                  </span>
                  <span className="ml-auto text-sm text-navy/70">🐧</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      )}
    </Shell>
  );
}

