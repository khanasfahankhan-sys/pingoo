import Shell from "../components/Shell";

const demoCourses = [
  { title: "JavaScript Basics", level: "Beginner", lessons: 12 },
  { title: "Python for Problem Solving", level: "Beginner", lessons: 10 },
  { title: "React Fundamentals", level: "Intermediate", lessons: 14 },
];

export default function Courses() {
  return (
    <Shell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-1 text-sm text-navy/75">Pick a path and start learning.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demoCourses.map((c) => (
          <article
            key={c.title}
            className="rounded-2xl border border-primary/15 bg-white/80 p-5 shadow-frost backdrop-blur"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{c.title}</h2>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-navy">
                {c.level}
              </span>
            </div>
            <div className="mt-2 text-sm text-navy/75">{c.lessons} lessons</div>

            <button
              type="button"
              className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-ice hover:bg-navy/90"
            >
              View course
            </button>
          </article>
        ))}
      </div>
    </Shell>
  );
}

