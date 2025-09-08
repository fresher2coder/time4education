// src/pages/student/AssignmentDetails.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "@/api/axios";
import { useFullscreen } from "@/context/FullScreenContext";

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
  const submittingRef = useRef(false); // NEW: prevents double submit

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
      // basic safety check
      if (
        parsed.assignmentId === id &&
        parsed.answers &&
        Array.isArray(parsed.qOrder)
      ) {
        setAnswers(parsed.answers);
        setCurrentIdx(parsed.currentIdx ?? 0);
        // Remaining time only restored if within window (optional)
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
        answers: answersRef.current, // always fresh
        currentIdx: currentIdxRef.current, // always fresh
        qOrder: questions.map((q) => q._id), // fixed question order
        remaining: remainingRef.current, // always fresh
        ts: Date.now(),
      };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
      // console.log("Autosaved", payload);
    } catch (err) {
      console.error("Autosave error:", err);
    }
  }, [id, questions, LS_KEY]);

  useEffect(() => {
    if (!started || submitted) return;

    const interval = setInterval(saveDraft, 5000); // every 5s
    return () => clearInterval(interval);
  }, [started, submitted, saveDraft]);

  useEffect(() => {
    if (!started || submitted) return;
    saveDraft(); // save instantly on answers/currentIdx/remaining change
  }, [answers, currentIdx, remaining, started, submitted, saveDraft]);

  // ------------- block right-click / copy / etc. -------------
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.addEventListener("contextmenu", prevent);
    document.addEventListener("dragstart", stop);
    document.addEventListener("cut", stop);
    document.addEventListener("copy", stop);
    document.addEventListener("paste", stop);
    document.addEventListener("selectstart", stop);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("dragstart", stop);
      document.removeEventListener("cut", stop);
      document.removeEventListener("copy", stop);
      document.removeEventListener("paste", stop);
      document.removeEventListener("selectstart", stop);
    };
  }, []);

  // ------------- tab switch / visibility penalties -------------

  useEffect(() => {
    const onVis = () => {
      if (!startedRef.current || submitted) return;

      if (document.hidden) {
        // de-dupe rapid toggles
        if (guardRef.current) return;
        guardRef.current = true;
        setTimeout(() => (guardRef.current = false), 800);

        // update violation count safely
        setViolationCount((prev) => {
          const next = prev + 1;

          if (next === 1) {
            setMessage(
              "⚠️ Warning: Do not switch tabs/windows during the test."
            );
          } else if (next === 2) {
            setRemaining((r) => {
              const safe = Math.max(15, Math.floor(r / 2));

              setMessage("⏳ Time penalty applied: remaining time halved.");
              return safe;
            });
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

  //-------------- handly exit fullscreen ---------------
  // 👇 Call this when we need to go fullscreen
  const goFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.error("Failed to enter fullscreen:", err);
    }
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
      setHideSidebar(true); // hide sidebar

      if (!nowInFullscreen) {
        // ✅ Consider as a tab switch / violation
        if (guardRef.current) return;
        guardRef.current = true;
        setTimeout(() => (guardRef.current = false), 800);

        setViolationCount((c) => {
          const next = c + 1;
          if (!submittingRef.current && next === 1) {
            alert("⚠️ Warning: Do not exit fullscreen during the test.");
          } else if (!submittingRef.current && next === 2) {
            alert("⏳ Time penalty applied: remaining time halved.");
            // halve your remaining time here if you already have a timer state
            setRemaining((r) => Math.max(15, Math.floor(r / 2)));
          } else if (!submittingRef.current && next >= 3) {
            alert("❌ Test terminated due to repeated fullscreen exits.");
            handleSubmit(true); // auto submit
          }
          return next;
        });
      }
    };

    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    document.addEventListener("mozfullscreenchange", onFsChange);
    document.addEventListener("MSFullscreenChange", onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
      document.removeEventListener("mozfullscreenchange", onFsChange);
      document.removeEventListener("MSFullscreenChange", onFsChange);
    };
  }, []);

  // ------------- fullscreen change watcher -------------
  useEffect(() => {
    const onFs = () => {
      const isFs =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      if (startedRef.current) {
        if (!isFs && wasFullscreenRef.current) {
          setMessage("⚠️ You exited fullscreen. Please return to fullscreen.");
        }
      }
      wasFullscreenRef.current = !!isFs;
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    document.addEventListener("mozfullscreenchange", onFs);
    document.addEventListener("MSFullscreenChange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
      document.removeEventListener("mozfullscreenchange", onFs);
      document.removeEventListener("MSFullscreenChange", onFs);
    };
  }, []);

  // ------------- start test (request fullscreen + start timer) -------------
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
      setHideSidebar(true); // hide sidebar
    } catch {}
    wasFullscreenRef.current = true;

    // set time from duration unless restored
    const durationMin = assignment.test.duration || 15;
    setRemaining((prev) => (prev && prev > 0 ? prev : durationMin * 60));
    setStarted(true);
    startedRef.current = true;

    // tick timer
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true); // time up -> submit
          return 0;
        }
        return r - 1;
      });
    }, 1000);
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
    wasFullscreenRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      // ✅ pick answers depending on auto/manual
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
        setHideSidebar(false); // hide sidebar

        try {
          if (document.fullscreenElement) {
            await document.exitFullscreen();
          }
        } catch (fsErr) {
          console.warn("Fullscreen exit failed:", fsErr);
        }

        navigate("/student/test/completed", {
          state: {
            title: assignment?.test?.title || "Test",
            autoSubmitted: auto,
          },
        });
      } else {
        throw new Error(res.data?.message || "Unexpected server response");
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      setMessage(
        err.response?.data?.message || err.message || "❌ Error submitting test"
      );
      submittingRef.current = false; // allow retry
    }
  };

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
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading assignment…</div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6 text-center text-red-500">
        ❌ Assignment not found
      </div>
    );
  }

  // Not started screen (with gating)
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

  // active test UI
  return (
    <div className="relative">
      {/* 🔸 Banner if student exits fullscreen */}
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

      {/* 🔹 Example: Hide drawer / disable UI when not in fullscreen */}
      <div
        className={
          wasFullscreenRef.current ? "" : "pointer-events-none opacity-50"
        }
      >
        <div
          className="p-0 m-0"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          {/* Header bar */}
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
            {/* Main Q pane */}
            <div className="flex-1 p-6">
              {current && (
                <div className="border rounded-2xl p-5 shadow-sm">
                  <div className="mb-4 text-sm text-gray-500">
                    Question {currentIdx + 1} of {questions.length}
                  </div>
                  <h2 className="font-semibold mb-4">{current.questionText}</h2>

                  <div className="space-y-2">
                    {current.options.map((opt, idx) => {
                      const chosen = answers[current._id]?.[0];
                      const selected = chosen === opt;
                      return (
                        <button
                          key={idx}
                          onClick={() => selectOption(current._id, opt)}
                          className={`w-full text-left px-4 py-2 rounded border ${
                            selected
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-gray-100 hover:bg-gray-200 border-transparent"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {/* Question navigation */}
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={prevQ}
                      disabled={currentIdx === 0}
                      className={`px-4 py-2 rounded ${
                        currentIdx === 0
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      ← Previous
                    </button>

                    <button
                      onClick={nextQ}
                      disabled={currentIdx === questions.length - 1}
                      className={`px-4 py-2 rounded ${
                        currentIdx === questions.length - 1
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      Next →
                    </button>
                  </div>

                  {/* Submit button separate below */}
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(
                          "Are you sure you want to end and submit the test? You cannot return after submitting."
                        );
                        if (confirmed) {
                          handleSubmit(false);
                        }
                      }}
                      className="px-6 py-3 rounded bg-red-600 text-white hover:bg-red-700 font-semibold shadow"
                    >
                      End Test
                    </button>
                  </div>

                  {!!message && (
                    <div className="mt-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right nav pane */}
            <aside className="w-64 border-l p-4 sticky top-[49px] h-[calc(100vh-49px)] overflow-auto bg-white">
              <div className="font-semibold mb-2">Questions</div>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const done = !!answers[q._id]?.length;
                  const isCur = i === currentIdx;
                  return (
                    <button
                      key={q._id}
                      onClick={() => goTo(i)}
                      className={`h-9 rounded text-sm font-medium border ${
                        isCur
                          ? "bg-blue-600 text-white border-blue-600"
                          : done
                            ? "bg-green-100 border-green-300"
                            : "bg-gray-100 hover:bg-gray-200 border-gray-200"
                      }`}
                      title={done ? "Answered" : "Not answered"}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 text-xs text-gray-500 space-y-1">
                <div>Violations: {violationCount}/3</div>
                <div>Autosaves every 5s</div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
