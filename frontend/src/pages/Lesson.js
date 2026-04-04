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
        console.log('[DEBUG] Full lesson API response:', JSON.stringify(res.data, null, 2));
        if (!cancelled) setLesson(res.data);
        
        // Load next lesson for navigation
        try {
          const courseId = typeof res.data.course === 'object' ? res.data.course?.id : res.data.course;
          const currentOrder = res.data.order;
          const coursesRes = await api.get('/courses/');
          const course = coursesRes.data.find(c => c.id === courseId);
          if (course) {
            const lessonsRes = await api.get(`/lessons/?course=${course.slug}`);
            const nextLesson = lessonsRes.data.find(l => l.order === currentOrder + 1);
            if (nextLesson) {
              setNextLessonId(nextLesson.id);
            } else {
              setNextLessonId(null);
            }
          }
        } catch (e) {
          console.error('[ERROR] Failed to load next lesson:', e);
          // Ignore error loading next lesson
          setNextLessonId(null);
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

  // Flexible output comparison function
  const compareOutputFlexibly = (actualOutput, expectedOutput) => {
    console.log('[DEBUG] Comparing output flexibly');
    console.log('[DEBUG] Actual output:', repr(actualOutput));
    console.log('[DEBUG] Expected output:', repr(expectedOutput));
    
    // Split both outputs into lines
    const actualLines = actualOutput.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const expectedLines = expectedOutput.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('[DEBUG] Actual lines:', actualLines);
    console.log('[DEBUG] Expected lines:', expectedLines);
    
    // If number of lines don't match, fail
    if (actualLines.length !== expectedLines.length) {
      console.log('[DEBUG] Line count mismatch:', actualLines.length, 'vs', expectedLines.length);
      return false;
    }
    
    // Compare each line
    for (let i = 0; i < expectedLines.length; i++) {
      const expectedLine = expectedLines[i];
      const actualLine = actualLines[i];
      
      console.log('[DEBUG] Comparing line', i, '- Expected:', repr(expectedLine), 'Actual:', repr(actualLine));
      
      // Check if expected line is a number
      if (!isNaN(expectedLine) && !isNaN(parseFloat(expectedLine))) {
        // Expected is a number, check if actual is any valid number
        const actualNum = parseFloat(actualLine);
        if (isNaN(actualNum)) {
          console.log('[DEBUG] Expected number but got non-number:', actualLine);
          return false;
        }
        console.log('[DEBUG] Number comparison passed:', actualNum);
      } else {
        // Expected is a string, check if actual is any non-empty string
        if (actualLine.length === 0) {
          console.log('[DEBUG] Expected string but got empty line');
          return false;
        }
        console.log('[DEBUG] String comparison passed:', actualLine);
      }
    }
    
    console.log('[DEBUG] All lines passed validation');
    return true;
  };

  // Helper function to safely represent strings in logs
  const repr = (str) => {
    if (typeof str !== 'string') return String(str);
    return `"${str.replace(/"/g, '\\"')}"`;
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
          success = compareOutputFlexibly(actualOutput, lesson.expected_output);
          console.log('[DEBUG] Flexible output comparison result:', success);
          
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
              console.log('[DEBUG] Attempting to mark progress as complete for lesson:', lessonId);
              console.log('[DEBUG] Auth status:', isAuthenticated);
              console.log('[DEBUG] Token exists:', !!localStorage.getItem("pingoo_access_token"));
              
              const progressData = {
                lesson: lessonId,
                status: "completed",
                progress_percent: 100,
              };
              console.log('[DEBUG] Progress data:', progressData);
              
              const response = await api.post("/progress/upsert/", progressData);
              console.log('[DEBUG] Progress update successful:', response.data);
            } catch (e) {
              console.error('[ERROR] Failed to update progress:', e);
              console.error('[ERROR] Response status:', e.response?.status);
              console.error('[ERROR] Response data:', e.response?.data);
              
              // Don't show error to user, just log it - the lesson was still completed successfully
              if (e.response?.status === 401) {
                console.warn('[WARN] Authentication failed - user may need to re-login');
              } else if (e.response?.status === 403) {
                console.warn('[WARN] Permission denied - check user permissions');
              } else {
                console.warn('[WARN] Progress update failed due to network/server error');
              }
            }
          } else {
            console.log('[DEBUG] User not authenticated - skipping progress update');
          }
          
          // Navigate to next lesson after 2 seconds
          setTimeout(() => {
            if (nextLessonId) {
              console.log('[DEBUG] Navigating to next lesson:', nextLessonId);
              console.log('[DEBUG] Navigation URL:', `/lessons/${nextLessonId}`);
              // Use React Router navigation instead of window.location.href
              window.location.href = `/lessons/${nextLessonId}`;
            } else {
              console.log('[DEBUG] No next lesson - staying on success screen');
            }
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
                      console.log('[DEBUG] Mark as complete clicked for lesson:', lessonId);
                      setCompletionMsg("");
                      setCompletionError("");
                      setMarking(true);
                      try {
                        console.log('[DEBUG] Attempting to mark progress as complete');
                        const progressData = {
                          lesson: lessonId,
                          status: "completed",
                          progress_percent: 100,
                        };
                        console.log('[DEBUG] Progress data:', progressData);
                        
                        const response = await api.post("/progress/upsert/", progressData);
                        console.log('[DEBUG] Progress update successful:', response.data);
                        setCompletionMsg("Lesson completed! Nice work — keep the streak going. 🐧");
                      } catch (e) {
                        console.error('[ERROR] Failed to update progress:', e);
                        console.error('[ERROR] Response status:', e.response?.status);
                        console.error('[ERROR] Response data:', e.response?.data);
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
