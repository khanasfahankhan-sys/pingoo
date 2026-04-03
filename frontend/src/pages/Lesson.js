import CodeMirror from "@uiw/react-codemirror";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Shell from "../components/Shell";
import { useAuth } from "../context/AuthContext";
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
  const { isAuthenticated } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [code, setCode] = useState(
    `// Welcome to Pingoo 🐧\n// Try editing and running this locally (we'll wire a runner next)\n\nfunction greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\ngreet("Arctic Coder");\n`
  );

  const [marking, setMarking] = useState(false);
  const [completionMsg, setCompletionMsg] = useState("");
  const [completionError, setCompletionError] = useState("");

  // Code runner states
  const [running, setRunning] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [nextLessonId, setNextLessonId] = useState(null);

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
        
        // Load next lesson for navigation
        try {
          const lessonsRes = await api.get(`/lessons/?course=${res.data.course.id}`);
          const lessons = lessonsRes.data.sort((a, b) => a.order - b.order);
          const currentIndex = lessons.findIndex(l => l.id === lessonId);
          if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
            setNextLessonId(lessons[currentIndex + 1].id);
          }
        } catch (e) {
          // Ignore error loading next lesson
        }
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

  // Function to execute JavaScript and capture console output
  const executeJavaScript = (code) => {
    return new Promise((resolve) => {
      let capturedOutput = [];
      const originalLog = console.log;
      const originalPrint = window.print;
      
      // Override console.log to capture output
      console.log = (...args) => {
        capturedOutput.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
        originalLog(...args); // Also log to original console for debugging
      };
      
      // Override window.print to prevent browser print dialog
      window.print = () => {
        capturedOutput.push('print() called');
        originalLog('print() called - browser print dialog prevented');
      };
      
      try {
        // Execute the code
        const func = new Function(code);
        func();
        
        // Restore original functions
        console.log = originalLog;
        window.print = originalPrint;
        
        // Return captured output
        resolve(capturedOutput.join('\n'));
      } catch (error) {
        // Restore original functions
        console.log = originalLog;
        window.print = originalPrint;
        resolve(`Error: ${error.message}`);
      }
    });
  };

  const validateCode = async () => {
    if (!code.trim()) {
      setValidationResult({
        success: false,
        message: "Please write some code before validating."
      });
      return;
    }
    
    setRunning(true);
    setValidationResult(null);
    
    try {
      // Get language from lesson API field
      const lessonLanguage = lesson?.language || 'javascript'; // Default to JavaScript if not specified
      console.log(`[DEBUG] Lesson language: ${lessonLanguage}`);
      
      let actualOutput = '';
      let success = true;
      let message = "Code executed successfully!";
      
      // Handle different execution types based on language
      if (lessonLanguage?.toLowerCase() === 'python') {
        // Python: Send to Django backend for execution
        console.log('[DEBUG] Executing Python via Django backend');
        
        const response = await api.post(`/lessons/${lessonId}/validate/`, {
          code: code
        });
        
        const result = response.data;
        if (result.execution_result?.output) {
          actualOutput = result.execution_result.output;
        }
        
        success = result.success;
        message = result.message;
        
      } else if (lessonLanguage?.toLowerCase() === 'javascript') {
        // JavaScript: Execute directly in browser with console override
        console.log('[DEBUG] Executing JavaScript in browser');
        
        actualOutput = await executeJavaScript(code);
        
        // Compare with expected output if it exists
        if (lesson?.expected_output) {
          const normalizedActual = actualOutput.trim();
          const normalizedExpected = lesson.expected_output.trim();
          success = normalizedActual === normalizedExpected;
          
          if (success) {
            message = "Validation successful! Your JavaScript runs perfectly.";
          } else {
            message = "JavaScript output doesn't match expected result. Try again! 🐧";
          }
        }
        
      } else if (lessonLanguage?.toLowerCase() === 'html') {
        // HTML: Render in iframe for live preview
        console.log('[DEBUG] Rendering HTML in iframe');
        
        // For HTML, we don't have "output" to compare, so we just show the preview
        actualOutput = 'HTML Preview Rendered';
        success = true; // HTML always succeeds unless there's a rendering error
        message = "HTML preview rendered successfully!";
        
      } else {
        // Fallback: Try to execute as JavaScript in browser
        console.log('[DEBUG] Fallback: Executing as JavaScript in browser');
        
        actualOutput = await executeJavaScript(code);
        
        // Compare with expected output if it exists
        if (lesson?.expected_output) {
          const normalizedActual = actualOutput.trim();
          const normalizedExpected = lesson.expected_output.trim();
          success = normalizedActual === normalizedExpected;
          
          if (success) {
            message = "Validation successful! Your code runs perfectly.";
          } else {
            message = "Output doesn't match expected result. Try again! 🐧";
          }
        }
      }
      
      // Check if code contains all solution keywords
      let missingKeywords = [];
      if (lesson?.solution_keywords) {
        missingKeywords = lesson.solution_keywords.filter(keyword => !code.includes(keyword));
        if (missingKeywords.length > 0) {
          success = false;
          message = `Missing keywords: ${missingKeywords.join(', ')}`;
        }
      }
      
      const validationResult = {
        success: success,
        message: message,
        execution_result: {
          language: lessonLanguage,
          output: actualOutput,
          expected_output: lesson?.expected_output,
          missing_keywords: missingKeywords,
          output_match: lesson?.expected_output ? actualOutput.trim() === lesson.expected_output.trim() : true
        }
      };
      
      setValidationResult(validationResult);
      
      if (success) {
        setShowSuccess(true);
        
        // Mark lesson as complete and navigate after 2 seconds
        const handleSuccessFlow = async () => {
          // Mark lesson as complete if authenticated
          if (isAuthenticated) {
            try {
              await api.post("/progress/upsert/", {
                lesson: lessonId,
                status: "completed",
                progress_percent: 100,
              });
              console.log("Lesson progress marked as complete");
            } catch (e) {
              console.error("Failed to update progress:", e);
            }
          }
          
          // Navigate to next lesson after 2 seconds
          setTimeout(() => {
            if (nextLessonId) {
              window.location.href = `/lessons/${nextLessonId}`;
            }
            // If no next lesson, stay on success screen with course complete message
          }, 2000);
        };
        
        handleSuccessFlow();
      }

    } catch (error) {
      console.error('Code execution error:', error);
      
      let errorMessage = "Failed to run code. Please check your code and try again.";
      
      if (lesson?.language?.toLowerCase() === 'python' && error?.response?.status === 401) {
        errorMessage = "Python execution service is temporarily unavailable. Please try again. 🐧";
      } else if (error?.name === 'TypeError' && error?.message?.includes('Failed to fetch')) {
        errorMessage = "Network error: Unable to connect to execution service. Please check your internet connection. 🌐";
      }
      
      setValidationResult({
        success: false,
        message: errorMessage
      });

    } finally {
      setRunning(false);
    }
  };

  return (
    <Shell>
      {loading ? (
        <div className="rounded-2xl border border-primary/15 bg-white/70 p-6 shadow-frost backdrop-blur">
          <div className="text-sm font-semibold">Loading lesson…</div>
          <div className="mt-1 text-sm text-navy/70">🐧 Sliding across the ice.</div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-sm font-semibold text-red-900">Couldn't load lesson</div>
          <div className="mt-1 text-sm text-red-800">{error}</div>
        </div>
      ) : showSuccess ? (
        // Arctic-themed success screen with penguin celebration
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-white/90 to-ice/90 p-8 shadow-frost backdrop-blur text-center max-w-md">
            <div className="text-6xl mb-4">🐧</div>
            <div className="text-2xl font-bold text-navy mb-2">Congratulations!</div>
            <div className="text-navy/80 mb-6">You've completed this lesson perfectly! Your code runs like a penguin sliding across ice. ⛸️</div>
            
            {/* Show countdown or course complete message */}
            <div className="mb-6">
              {nextLessonId ? (
                <div className="text-sm text-navy/60">
                  Moving to next lesson in <span className="font-semibold">2 seconds</span>...
                </div>
              ) : (
                <div className="text-lg font-bold text-navy bg-primary/15 rounded-full px-4 py-2">
                  Course Complete! 🐧
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {nextLessonId && (
                <Link
                  to={`/lessons/${nextLessonId}`}
                  className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-navy shadow-frost hover:bg-accent transition-colors"
                >
                  Next Lesson →
                </Link>
              )}
              <button
                onClick={() => setShowSuccess(false)}
                className="rounded-full border border-primary/20 bg-white/70 px-6 py-3 text-sm font-semibold text-navy hover:bg-ice transition-colors"
              >
                Keep Coding
              </button>
            </div>
          </div>
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

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {!isAuthenticated ? (
                <div className="rounded-2xl border border-primary/15 bg-ice px-4 py-3 text-sm text-navy/80">
                  Log in to track your progress.{" "}
                  <Link className="font-semibold underline decoration-primary/60" to="/login">
                    Login
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={marking}
                    onClick={async () => {
                      setCompletionMsg("");
                      setCompletionError("");
                      setMarking(true);
                      try {
                        await api.post("/progress/upsert/", {
                          lesson: lessonId,
                          status: "completed",
                          progress_percent: 100,
                        });
                        setCompletionMsg("Lesson completed! Nice work — keep the streak going. 🐧");
                      } catch (e) {
                        setCompletionError(
                          e?.response?.data?.detail || "Couldn't update progress. Please try again."
                        );
                      } finally {
                        setMarking(false);
                      }
                    }}
                    className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-navy shadow-frost hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {marking ? "Marking…" : "Mark as Complete"}
                  </button>
                  {completionMsg ? (
                    <div className="rounded-2xl border border-primary/20 bg-white/70 px-4 py-3 text-sm text-navy">
                      {completionMsg}
                    </div>
                  ) : null}
                  {completionError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                      {completionError}
                    </div>
                  ) : null}
                </>
              )}
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
            
            {/* Run button */}
            <div className="mt-4">
              <button
                onClick={validateCode}
                disabled={running}
                className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-navy shadow-frost hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
              >
                {running ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⚡</span>
                    Validating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    ▶️ Run Code
                  </span>
                )}
              </button>
            </div>
            
            {/* Validation result */}
            {validationResult && !showSuccess && (
              <div className="mt-4 space-y-4">
                {/* HTML iframe preview */}
                {lesson?.language?.toLowerCase() === 'html' && validationResult.execution_result?.output === 'HTML Preview Rendered' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-sm font-semibold text-navy">Live HTML Preview</div>
                      <div className="text-xs text-navy/60">
                        {validationResult.execution_result.language}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-white overflow-hidden">
                      <iframe
                        srcDoc={code}
                        className="w-full h-96 border-0"
                        title="HTML Preview"
                        sandbox="allow-scripts"
                      />
                    </div>
                  </div>
                )}
                
                {/* Output display for Python/JavaScript */}
                {validationResult.execution_result?.output && validationResult.execution_result?.output !== 'HTML Preview Rendered' && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-sm font-semibold text-navy">Output</div>
                      <div className="text-xs text-navy/60">
                        {validationResult.execution_result.language}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/20 bg-ice p-4 text-sm font-mono text-navy">
                      <pre className="whitespace-pre-wrap">{validationResult.execution_result.output}</pre>
                    </div>
                  </div>
                )}
                
                {/* Validation result */}
                <div className={`rounded-2xl border p-4 text-sm ${
                  validationResult.success
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}>
                  <div className="flex items-start gap-2">
                    <span>{validationResult.success ? '🎉' : '❄️'}</span>
                    <span>{validationResult.message}</span>
                  </div>
                </div>
                
                {/* Expected output comparison (only for Python/JavaScript) */}
                {lesson?.expected_output && validationResult.execution_result && validationResult.execution_result?.output !== 'HTML Preview Rendered' && (
                  <div className="rounded-2xl border border-primary/20 bg-ice p-4 text-sm">
                    <div className="font-semibold text-navy mb-2">Expected Output:</div>
                    <pre className="whitespace-pre-wrap text-navy/80">{lesson.expected_output}</pre>
                    <div className="mt-2 text-xs text-navy/60">
                      {validationResult.execution_result.output_match ? '✅ Output matches' : '❌ Output does not match'}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-navy/70">
                💡 Tip: {lesson?.language?.toLowerCase() === 'html' 
                  ? 'Your HTML will be rendered as a live preview.'
                  : lesson?.language?.toLowerCase() === 'python'
                  ? 'Your Python code will be executed on our server.'
                  : 'Your JavaScript will run directly in the browser.'
                }
              </div>
              <div className="text-sm text-navy/70">🐧</div>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}
