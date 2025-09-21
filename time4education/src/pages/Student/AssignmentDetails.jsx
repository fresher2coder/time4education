// src/pages/student/AssignmentDetails.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "@/api/axios";
import { useFullscreen } from "@/context/FullScreenContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";

// -------- utils --------
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

// -------- component --------
export default function AssignmentDetails() {
  const { id } = useParams(); // assignmentId
  const navigate = useNavigate();

  // data
  const [assignment, setAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);

  // exam state
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({}); // { [qId]: [selected] }
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remaining, setRemaining] = useState(0); // seconds
  const [submitFullScreen, setSubmitFullScreen] = useState(false);

  // ui
  const [loading, setLoading] = useState(true);
  const [violationCount, setViolationCount] = useState(0);
  const [message, setMessage] = useState("");
  const { setHideSidebar } = useFullscreen();

  // refs
  const timerRef = useRef(null);
  const startedRef = useRef(false);
  const guardRef = useRef(false); // to avoid duplicate penalties
  const wasFullscreenRef = useRef(false);
  const submittingRef = useRef(false); // prevents double submit

  // refs to hold latest state for autosave
  const answersRef = useRef(answers);
  const currentIdxRef = useRef(currentIdx);
  const remainingRef = useRef(remaining);

  // update refs whenever state changes
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);
  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  // localStorage key
  const LS_KEY = `t4e_attempt_${id}`;

  // ------------- fetch assignment -------------
  useEffect(() => {
    const run = async () => {
      try {
        const res = await axios.get(`/assignments/${id}`, {
          withCredentials: true,
        });
        // shuffle options once
        const shuffled = (res.data.questions || []).map((q) => ({
          ...q,
          options: shuffle(q.options || []),
        }));
        setAssignment(res.data);

        setQuestions(shuffled);
      } catch (e) {
        console.error("Error fetching assignment:", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // ------------- can start? (time-gated) -------------
  const canStartInfo = useMemo(() => {
    if (!assignment?.test) return { canStart: false, reason: "Loading…" };
    const now = new Date();
    const { startTime, endTime, status, duration } = assignment.test;

    if (status !== "active")
      return { canStart: false, reason: "Test inactive" };

    if (startTime) {
      const s = new Date(startTime);
      if (now < s) return { canStart: false, reason: "Test not started yet" };
    }
    if (endTime) {
      const e = new Date(endTime);
      if (now > e) return { canStart: false, reason: "Test window ended" };
    }
    if (!duration || duration <= 0)
      return { canStart: false, reason: "Invalid duration" };

    return { canStart: true, reason: "" };
  }, [assignment]);

  // ------------- restore draft (localStorage) -------------
  useEffect(() => {
    if (!assignment || submitted || started) return;

    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed.assignmentId === id &&
        parsed.answers &&
        Array.isArray(parsed.qOrder)
      ) {
        setAnswers(parsed.answers);
        setCurrentIdx(parsed.currentIdx ?? 0);
        if (typeof parsed.remaining === "number" && parsed.remaining > 0) {
          setRemaining(parsed.remaining);
        }
      }
    } catch {}
  }, [assignment, id, started, submitted]);

  // ------------- auto-save (localStorage) -------------
  const saveDraft = useCallback(() => {
    try {
      const payload = {
        assignmentId: id,
        answers: answersRef.current,
        currentIdx: currentIdxRef.current,
        qOrder: questions.map((q) => q._id),
        remaining: remainingRef.current,
        ts: Date.now(),
        violationCount, // store violation count as well
      };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error("Autosave error:", err);
    }
  }, [id, questions, violationCount]);

  useEffect(() => {
    if (!started || submitted) return;
    const interval = setInterval(saveDraft, 5000);
    return () => clearInterval(interval);
  }, [started, submitted, saveDraft]);

  useEffect(() => {
    if (!started || submitted) return;
    saveDraft();
  }, [answers, currentIdx, remaining, started, submitted, saveDraft]);

  // ------------- block right-click / copy / etc. -------------
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    ["contextmenu", "dragstart", "cut", "copy", "paste", "selectstart"].forEach(
      (evt) =>
        document.addEventListener(evt, evt === "contextmenu" ? prevent : stop)
    );

    return () => {
      [
        "contextmenu",
        "dragstart",
        "cut",
        "copy",
        "paste",
        "selectstart",
      ].forEach((evt) =>
        document.removeEventListener(
          evt,
          evt === "contextmenu" ? prevent : stop
        )
      );
    };
  }, []);

  // ------------- tab switch / visibility penalties -------------
  useEffect(() => {
    const onVis = () => {
      if (!startedRef.current || submitted) return;

      if (document.hidden) {
        if (guardRef.current) return;
        guardRef.current = true;
        setTimeout(() => (guardRef.current = false), 800);

        setViolationCount((prev) => {
          const next = prev + 1;

          if (next === 1) {
            setMessage(
              "⚠️ Warning: Do not switch tabs/windows during the test."
            );
          } else if (next === 2) {
            setRemaining((r) => Math.max(15, Math.floor(r / 2)));
            setMessage("⏳ Time penalty applied: remaining time halved.");
          } else if (next >= 3) {
            setMessage("❌ Test terminated due to repeated tab switching.");
            handleSubmit(true);
          }

          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [submitted]);

  // ------------- start test -------------
  const enterFullscreen = async () => {
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  };

  const startTest = async () => {
    if (!canStartInfo.canStart) return;
    try {
      await enterFullscreen();
      setHideSidebar(true);
    } catch {}
    wasFullscreenRef.current = true;

    const durationMin = assignment.test.duration || 15;
    const testEnd = assignment.test.endTime
      ? new Date(assignment.test.endTime)
      : null;

    setRemaining((prev) => (prev && prev > 0 ? prev : durationMin * 60));
    setStarted(true);
    startedRef.current = true;

    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    // ✅ force auto-submit at endTime, even if remaining > 0
    if (testEnd) {
      const now = new Date();
      const msUntilEnd = testEnd.getTime() - now.getTime();
      if (msUntilEnd > 0) {
        setTimeout(() => {
          if (!submitted) {
            clearInterval(timerRef.current);
            handleSubmit(true);
          }
        }, msUntilEnd);
      }
    }
  };

  // ------------- navigation -------------
  const goTo = (idx) => {
    if (!started) return;
    if (idx >= 0 && idx < questions.length) setCurrentIdx(idx);
  };
  const nextQ = () => goTo(currentIdx + 1);
  const prevQ = () => goTo(currentIdx - 1);

  // ------------- answer select (single) -------------
  const selectOption = (qid, opt) => {
    if (!started) return;
    setAnswers((p) => ({ ...p, [qid]: [opt] }));
  };

  // ------------- submit -------------
  const handleSubmit = async (auto = false) => {
    if (submittingRef.current || submitted) return;
    submittingRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const snapshotAnswers = auto ? { ...answersRef.current } : { ...answers };
      const payload = {
        assignmentId: id,
        answers: Object.entries(snapshotAnswers).map(
          ([question, selectedOptions]) => ({
            question,
            selectedOptions,
          })
        ),
        autoSubmitted: auto,
      };

      const res = await axios.post(`/submissions`, payload, {
        withCredentials: true,
      });

      if (res.status >= 200 && res.status < 300) {
        localStorage.removeItem(LS_KEY);
        setSubmitted(true);
        setHideSidebar(false);

        try {
          if (document.fullscreenElement) await document.exitFullscreen();
        } catch {}

        navigate("/student/test/completed", {
          state: {
            title: assignment?.test?.title || "Test",
            autoSubmitted: auto,
          },
        });
        setHideSidebar(false);
        wasFullscreenRef.current = false;
      } else {
        throw new Error(res.data?.message || "Unexpected server response");
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      setMessage(
        err.response?.data?.message || err.message || "❌ Error submitting test"
      );
      submittingRef.current = false;
    }
  };

  // ------------- fullscreen / violation watcher -------------
  const goFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {}
  };

  useEffect(() => {
    const onFsChange = () => {
      const fsElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;

      const nowInFullscreen = !!fsElement;
      wasFullscreenRef.current = nowInFullscreen;
      // setHideSidebar(true);

      if (submittingRef.current || submitFullScreen) {
        return;
      }

      if (!nowInFullscreen) {
        if (guardRef.current) return;
        guardRef.current = true;
        setTimeout(() => (guardRef.current = false), 800);

        setViolationCount((c) => {
          const next = c + 1;
          if (!submittingRef.current && next === 1)
            alert("⚠️ Warning: Do not exit fullscreen during the test.");
          else if (!submittingRef.current && next === 2) {
            alert("⏳ Time penalty applied: remaining time halved.");
            setRemaining((r) => Math.max(15, Math.floor(r / 2)));
          } else if (!submittingRef.current && next >= 3) {
            alert("❌ Test terminated due to repeated fullscreen exits.");
            handleSubmit(true);
          }
          return next;
        });
      }
    };

    [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ].forEach((evt) => document.addEventListener(evt, onFsChange));

    return () =>
      [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "MSFullscreenChange",
      ].forEach((evt) => document.removeEventListener(evt, onFsChange));
  }, [setViolationCount, setRemaining, handleSubmit]);

  // beforeunload guard
  useEffect(() => {
    const handler = (e) => {
      if (!started || submitted) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [started, submitted]);

  // ------------- computed -------------
  const current = questions[currentIdx];
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((qid) => answers[qid]?.length).length,
    [answers]
  );
  const pct = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  // ------------- render -------------
  if (loading)
    return (
      <div className="p-6 text-center text-gray-500">Loading assignment…</div>
    );
  if (!assignment)
    return (
      <div className="p-6 text-center text-red-500">
        ❌ Assignment not found
      </div>
    );

  // Not started screen
  if (!started && !submitted) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-blue-700">
          {assignment.test?.title}
        </h1>
        <p className="text-gray-600">{assignment.test?.description}</p>
        {assignment.instructions && (
          <p className="text-gray-500 italic mt-2">{assignment.instructions}</p>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h2 className="font-semibold mb-2">Anti-Cheating Rules</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Test opens in fullscreen; don’t exit.</li>
            <li>
              Right-click, copy/paste, drag, and text selection are disabled.
            </li>
            <li>
              Switching tabs/windows:
              <br />• 1st time: warning
              <br />• 2nd time: remaining time halved
              <br />• 3rd time: test auto-submitted
            </li>
            <li>Do not refresh or close this tab while the test is active.</li>
          </ul>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Duration: {assignment.test.duration} min
          {assignment.test.startTime && (
            <>
              {" "}
              • Starts: {new Date(assignment.test.startTime).toLocaleString()}
            </>
          )}
          {assignment.test.endTime && (
            <> • Ends: {new Date(assignment.test.endTime).toLocaleString()}</>
          )}
        </div>

        <button
          onClick={startTest}
          disabled={!canStartInfo.canStart}
          className={`mt-6 px-6 py-3 rounded font-semibold ${
            canStartInfo.canStart
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {canStartInfo.canStart ? "Start Test" : canStartInfo.reason}
        </button>
      </div>
    );
  }

  // Active test UI
  return (
    <div className="relative">
      {!wasFullscreenRef.current && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 text-yellow-800 p-4 flex justify-between items-center z-50">
          <span>
            ⚠️ You exited fullscreen — please return to fullscreen to continue
            the test.
          </span>
          <button
            onClick={goFullscreen}
            className="ml-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Return to Fullscreen
          </button>
        </div>
      )}

      <div
        className={
          wasFullscreenRef.current ? "" : "pointer-events-none opacity-50"
        }
      >
        <div style={{ userSelect: "none", WebkitUserSelect: "none" }}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold">{assignment.test?.title}</h1>
              <div className="w-64 h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${pct}%` }}
                  title={`${answeredCount}/${questions.length} answered`}
                />
              </div>
              <span className="text-sm text-gray-600">
                {answeredCount}/{questions.length} answered
              </span>
            </div>
            <div className="text-lg font-mono">⏳ {fmtTime(remaining)}</div>
          </div>

          {/* Body */}
          <div className="flex">
            {/* Main question */}
            <div className="flex-1 p-6">
              {current && (
                <div className="border rounded-2xl p-5 shadow-sm">
                  <div className="mb-4 text-sm text-gray-500">
                    Question {currentIdx + 1} of {questions.length}
                  </div>
                  {/* Render pseudocode / code if category is pseudo or code */}
                  {current.type === "coding-mcqs" ||
                  current.type === "coding" ? (
                    <SyntaxHighlighter
                      language={current.lang || "java"}
                      style={okaidia}
                      showLineNumbers
                      wrapLongLines
                    >
                      {current.questionText
                        .replace(/\\n/g, "\n")
                        .replace(/\\t/g, "    ") // 4 spaces for tabs
                        .replace(/\\"/g, '"')}
                    </SyntaxHighlighter>
                  ) : (
                    <h2 className="font-semibold mb-4">
                      {current.questionText}
                    </h2>
                  )}

                  {/* Sample input/output */}
                  {current.sampleInput && (
                    <div className="my-2 p-2 bg-gray-100 rounded">
                      <strong>Sample Input:</strong>
                      <pre>{current.sampleInput}</pre>
                    </div>
                  )}
                  {current.sampleOutput && (
                    <div className="my-2 p-2 bg-gray-100 rounded">
                      <strong>Sample Output:</strong>
                      <pre>{current.sampleOutput}</pre>
                    </div>
                  )}

                  {/* MCQ options */}
                  <div className="mt-4 flex flex-col gap-2">
                    {current.options.map((opt, i) => {
                      const selected = answers[current._id]?.includes(opt);
                      return (
                        <button
                          key={i}
                          onClick={() => selectOption(current._id, opt)}
                          className={`text-left px-4 py-2 border rounded-lg hover:border-blue-500 transition-all ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-800"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                <button
                  onClick={prevQ}
                  disabled={currentIdx === 0}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={nextQ}
                  disabled={currentIdx === questions.length - 1}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              {message && (
                <div className="mt-4 text-red-600 font-medium">{message}</div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-60 border-l bg-gray-50 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-3">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const answered = answers[q._id]?.length;
                  return (
                    <button
                      key={q._id}
                      onClick={() => goTo(idx)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        idx === currentIdx
                          ? "bg-blue-600 text-white"
                          : answered
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-700"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <div>Violations: {violationCount}/3</div>
                <div>Autosaves every 5s</div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setSubmitFullScreen(true);
                    handleSubmit(false);
                  }}
                  className="px-6 py-3 rounded bg-green-600 text-white hover:bg-green-700 font-semibold"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
