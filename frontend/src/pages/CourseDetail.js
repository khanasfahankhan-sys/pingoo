import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Shell from "../components/Shell";
import { api } from "../lib/api";

function formatLabel(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function CourseDetail() {
  const { slug } = useParams();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) {
        setError("Missing course.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [courseRes, lessonsRes] = await Promise.all([
          api.get(`/courses/${slug}/`),
          api.get("/lessons/", { params: { course: slug } }),
        ]);
        if (!cancelled) {
          setCourse(courseRes.data);
          setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.detail || "Failed to load course or lessons.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <Shell>
      <div className="mb-6">
        <Link
          to="/courses"
          className="text-sm font-semibold text-navy/80 underline decoration-primary/50 transition hover:text-navy"
        >
          ← All courses
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-primary/15 bg-white/70 p-6 shadow-frost backdrop-blur">
          <div className="text-sm font-semibold">Loading course…</div>
          <div className="mt-1 text-sm text-navy/70">🐧 Fetching lessons from the iceberg.</div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-sm font-semibold text-red-900">Couldn’t load this course</div>
          <div className="mt-1 text-sm text-red-800">{error}</div>
        </div>
      ) : (
        <>
          <header className="mb-8 rounded-2xl border border-primary/15 bg-white/80 p-6 shadow-frost backdrop-blur">
            <h1 className="text-2xl font-semibold tracking-tight">
              {course?.title || "Course"} <span className="ml-2 align-middle">🐧</span>
            </h1>
            {course?.description ? (
              <p className="mt-3 max-w-3xl text-sm text-navy/75">{course.description}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {course?.level ? (
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-navy">
                  {formatLabel(course.level)}
                </span>
              ) : null}
              {course?.language ? (
                <span className="rounded-full border border-primary/20 bg-ice px-2.5 py-1 text-xs font-semibold text-navy">
                  {course.language}
                </span>
              ) : null}
            </div>
          </header>

          <section className="rounded-2xl border border-primary/15 bg-white/80 p-6 shadow-frost backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight">Lessons</h2>
            <p className="mt-1 text-sm text-navy/70">Tap a lesson to open it.</p>

            {lessons.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-primary/20 bg-ice p-4 text-sm text-navy/75">
                No lessons published yet. Check back soon.
              </p>
            ) : (
              <ul className="mt-6 grid gap-3">
                {lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-primary/15 bg-ice/60 px-4 py-4 shadow-frost transition hover:border-primary/30 hover:bg-white hover:shadow-md"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-navy">
                            {lesson.order != null ? `#${lesson.order}` : "—"}
                          </span>
                          <span className="font-semibold text-navy">{lesson.title}</span>
                        </div>
                        {lesson.summary ? (
                          <p className="mt-1 line-clamp-2 text-sm text-navy/70">{lesson.summary}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-lg text-navy/50" aria-hidden>
                        🐧
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}
