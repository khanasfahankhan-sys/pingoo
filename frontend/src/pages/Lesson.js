import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Shell from "../components/Shell";
import { api } from "../lib/api";
import "./Lesson.css";

function formatLabel(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function Lesson() {
  const { id } = useParams();
  const lessonId = Number(id);

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [code, setCode] = useState(
    `// Welcome to Pingoo 🐧\n// Try editing and running this locally (we’ll wire a runner next)\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\ngreet("Arctic Coder");\n`
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!Number.isFinite(lessonId) || lessonId <= 0) {
        setError("Invalid lesson id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/lessons/${lessonId}/`);
        if (!cancelled) setLesson(res.data);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || "Failed to load lesson.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return (
    <Shell>
      {loading ? (
        <div className="rounded-2xl border border-primary/15 bg-white/70 p-6 shadow-frost backdrop-blur">
          <div className="text-sm font-semibold">Loading lesson…</div>
          <div className="mt-1 text-sm text-navy/70">🐧 Sliding across the ice.</div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-sm font-semibold text-red-900">Couldn’t load lesson</div>
          <div className="mt-1 text-sm text-red-800">{error}</div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-primary/15 bg-white/80 p-6 shadow-frost backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {lesson?.title || "Lesson"} <span className="ml-2 align-middle">🐧</span>
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {lesson?.difficulty ? (
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-navy">
                      {formatLabel(lesson.difficulty)}
                    </span>
                  ) : null}
                  {Number.isFinite(lesson?.estimated_minutes) ? (
                    <span className="rounded-full border border-primary/20 bg-ice px-2.5 py-1 text-xs text-navy/80">
                      {lesson.estimated_minutes} min
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {lesson?.summary ? (
              <p className="mt-4 rounded-2xl border border-primary/15 bg-ice p-4 text-sm text-navy/80">
                {lesson.summary}
              </p>
            ) : null}

            <div className="prose prose-sm mt-5 max-w-none text-navy/85">
              <div className="whitespace-pre-wrap leading-relaxed">
                {lesson?.content || "No lesson content yet. Add `content` in Django admin."}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/15 bg-white/80 p-6 shadow-frost backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Try it</h2>
                <p className="mt-1 text-sm text-navy/70">Edit the code and experiment. 🧊</p>
              </div>
              <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-navy">
                Arctic editor
              </span>
            </div>

            <div
              id="lesson-code-editor"
              className="overflow-hidden rounded-2xl border border-primary/20 shadow-frost"
            >
              <CodeMirror
                value={code}
                height="420px"
                onChange={(v) => setCode(v)}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLine: true,
                  highlightActiveLineGutter: true,
                  foldGutter: false,
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-navy/70">
                Tip: we’ll connect this to lesson progress + a code runner next.
              </div>
              <div className="text-sm text-navy/70">🐧</div>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}

