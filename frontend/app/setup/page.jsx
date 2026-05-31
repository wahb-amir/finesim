"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const GOALS = [
  {
    id: "avoid-debt",
    title: "Avoid Debt",
    description: "Learn to stay out of the debt trap and protect your income",
    icon: "🛡️",
  },
  {
    id: "build-wealth",
    title: "Build Wealth",
    description: "Grow assets, invest smart, and build long-term net worth",
    icon: "📈",
  },
  {
    id: "understand-basics",
    title: "Understand the Basics",
    description: "Get fluent in credit, budgeting, and how money works",
    icon: "💡",
  },
];

const CLIMATE_OPTIONS = [
  {
    id: "Stable",
    title: "Stable",
    description: "Predictable income, normal costs, low turbulence",
    icon: "🌤️",
  },
  {
    id: "Inflation",
    title: "Inflationary",
    description: "Prices rise faster than your paycheck",
    icon: "📈",
  },
  {
    id: "Recession",
    title: "Recession",
    description: "Tighter job market and tougher decisions",
    icon: "🌧️",
  },
  {
    id: "Volatile",
    title: "Volatile",
    description: "High upside, high risk, sharp swings",
    icon: "⚡",
  },
];

const PROFESSIONS = [
  "Software Engineer",
  "Doctor",
  "Nurse",
  "Teacher",
  "Accountant",
  "Electrician",
  "Lawyer",
  "Pilot",
  "Business Owner",
  "Designer",
  "Sales Representative",
  "Project Manager",
  "Entrepreneur",
  "Other",
];

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [loading, setLoading] = useState(true);
  const [checkingSessions, setCheckingSessions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(1);

  const [userName, setUserName] = useState("");
  const [profession, setProfession] = useState("");
  const [customProfession, setCustomProfession] = useState("");
  const [startSalary, setStartSalary] = useState("");
  const [goal, setGoal] = useState("build-wealth");
  const [climateLabel, setClimateLabel] = useState("Stable");

  const [activeSession, setActiveSession] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const [toast, setToast] = useState(null);
  const [replayContext, setReplayContext] = useState(null);

  const replayRound =
    searchParams.get("replayRound") || replayContext?.round || null;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("finsimReplay");
      if (raw) setReplayContext(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const selectedProfessionLabel =
    profession === "Other" ? customProfession.trim() : profession.trim();

  const canProceedStep1 =
    selectedProfessionLabel.length >= 2 && Number(startSalary) > 0;
  const canProceedStep2 = goal !== "";
  const canProceedStep3 = climateLabel !== "";

  const formattedSalary = useMemo(() => {
    const value = Number(startSalary);
    if (!Number.isFinite(value) || value <= 0) return "";
    return new Intl.NumberFormat().format(value);
  }, [startSalary]);

  useEffect(() => {
    const loadUserAndSession = async () => {
      try {
        const userRes = await fetch(`${API}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        const userData = await userRes.json();

        if (!userData?.success || !userData?.user) {
          router.push("/auth");
          return;
        }

        setUserName(userData.user.name || "Player");

        const sessionsRes = await fetch(`${API}/game/sessions`, {
          method: "GET",
          credentials: "include",
        });

        const sessionsData = await sessionsRes.json();

        if (sessionsData?.success && Array.isArray(sessionsData.sessions)) {
          const unfinished = sessionsData.sessions.find(
            (s) => s.status === "active",
          );

          let isReplayFlow = Boolean(searchParams.get("replayRound"));
          if (!isReplayFlow && typeof window !== "undefined") {
            try {
              const raw = sessionStorage.getItem("finsimReplay");
              isReplayFlow = Boolean(JSON.parse(raw || "null")?.fromSessionId);
            } catch {
              /* ignore */
            }
          }

          if (unfinished && !isReplayFlow) {
            setActiveSession(unfinished);
            setShowResumePrompt(true);
          }
        }
      } catch (err) {
        router.push("/auth");
      } finally {
        setLoading(false);
        setCheckingSessions(false);
      }
    };

    if (API) loadUserAndSession();
  }, [API, router, searchParams]);

  const handleContinueSession = () => {
    if (!activeSession?._id) return;

    localStorage.setItem("gameSessionId", activeSession._id);
    router.push(`/game?sessionId=${activeSession._id}`);
  };

  const handleStartFresh = () => {
    setShowResumePrompt(false);
    setActiveSession(null);
    setStep(1);
  };

  const handleReplayNow = async () => {
    if (!replayContext?.fromSessionId || !replayRound || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/game/session/replay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fromSessionId: replayContext.fromSessionId,
          targetRound: Number(replayRound),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        showToast("error", data?.message || "Failed to start replay");
        return;
      }

      const sessionId = data.sessionId;
      if (!sessionId) {
        showToast("error", "Replay started, but no session ID was returned");
        return;
      }

      localStorage.setItem("gameSessionId", sessionId);
      showToast("success", `Replay ready at round ${replayRound}`);
      router.push(`/game?sessionId=${sessionId}`);
    } catch {
      showToast("error", "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBegin = async () => {
    if (!canProceedStep1 || !canProceedStep2 || !canProceedStep3) return;

    setSubmitting(true);

    try {
      const payload = {
        career: selectedProfessionLabel,
        startSalary: Number(startSalary),
        goal,
        climateLabel,
      };

      const res = await fetch(`${API}/game/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.success) {
        showToast("error", data?.message || "Failed to create game session");
        return;
      }

      const sessionId = data.sessionId || data.session?._id;

      if (!sessionId) {
        showToast("error", "Session created, but no session ID was returned");
        return;
      }

      localStorage.setItem("gameSessionId", sessionId);
      sessionStorage.removeItem("finsimReplay");
      showToast("success", "Game session created");

      setTimeout(() => {
        router.push(`/game?sessionId=${sessionId}`);
      }, 900);
    } catch (err) {
      showToast("error", "Server error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingSessions) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#F59E0B]">
        <div className="text-center">
          <div className="mb-3 text-2xl">Loading...</div>
          <div className="text-sm text-[#6B6B6B]">
            Preparing your simulation
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm font-medium backdrop-blur-xl border transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.35)] ${
            toast.type === "success"
              ? "bg-[#0F172A]/90 border-[#10B981]/30 text-[#10B981]"
              : "bg-[#0F172A]/90 border-red-500/30 text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      {showResumePrompt && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#2A2A2A] bg-[#0F0F0F] p-6 shadow-2xl">
            <div className="mb-4 text-3xl">⏳</div>

            <h2 className="text-2xl font-bold text-white">
              You already have an active game
            </h2>

            <p className="mt-2 text-sm text-[#A1A1A1]">
              Round {activeSession.currentRound} of 10 ·{" "}
              {activeSession.career || "Career not set"}
            </p>

            <p className="mt-4 text-sm leading-6 text-[#6B6B6B]">
              Do you want to continue where you left off, or start a new
              simulation?
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleContinueSession}
                className="flex-1 rounded-xl bg-[#F59E0B] px-5 py-3 font-semibold text-black transition hover:opacity-95"
              >
                Continue game
              </button>

              <button
                onClick={handleStartFresh}
                className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#111111] px-5 py-3 font-semibold text-white transition hover:border-[#444]"
              >
                Start new game
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen overflow-hidden bg-[#0A0A0A] px-4 py-10 text-white">
        {replayRound ? (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#F59E0B]">
              Try again
            </p>
            <p className="mt-1 text-sm font-semibold text-[#F5F5F5]">
              Replay the moment from round {replayRound}
              {replayContext?.eventTitle
                ? `: ${replayContext.eventTitle}`
                : replayContext?.label
                  ? ` — ${replayContext.label}`
                  : ""}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#A1A1A1]">
              We&apos;ll restore your run up to this decision so you can try
              the other choice.
            </p>
            {replayContext?.fromSessionId ? (
              <button
                type="button"
                onClick={handleReplayNow}
                disabled={submitting}
                className="mt-4 rounded-xl bg-[#F59E0B] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Starting replay…" : `Replay round ${replayRound} now →`}
              </button>
            ) : null}
          </div>
        ) : null}
        <div
          className="fixed left-1/2 top-1/4 h-[300px] w-[700px] -translate-x-1/2 opacity-[0.06] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, #F59E0B, transparent 70%)",
          }}
        />

        <div className="mx-auto w-full max-w-3xl relative z-10">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-[11px] text-[#6B6B6B] transition hover:text-[#F59E0B]"
              >
                ← Back to Dashboard
              </button>
            </div>
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#6B6B6B]">
              Financial Life Simulation
            </p>
            <h1 className="mt-3 text-4xl font-bold text-[#F5F5F5]">
              Welcome, {userName}
            </h1>
            <p className="mt-3 text-sm text-[#A1A1A1]">
              Set up your run, then jump into the game with a live backend
              session.
            </p>
          </div>

          <div className="mb-10 flex items-center justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    s === step
                      ? "bg-[#F59E0B] text-black scale-110"
                      : s < step
                        ? "border border-[#10B981]/40 bg-[#161616] text-[#10B981]"
                        : "border border-[#2A2A2A] bg-[#161616] text-[#4A4A4A]"
                  }`}
                >
                  {s < step ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5L4.5 7.5L8 3"
                        stroke="#10B981"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    s
                  )}
                </div>

                {s < 3 && (
                  <div
                    className="h-px w-16"
                    style={{
                      background: s < step ? "rgba(16,185,129,0.3)" : "#1F1F1F",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-2xl rounded-[28px] border border-[#242424] bg-[#101010]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8">
            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#6B6B6B]">
                Step {step} of 3
              </p>
            </div>

            {step === 1 && (
              <div className="mt-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-[#F5F5F5]">
                    Your starting setup
                  </h2>
                  <p className="mt-2 text-sm text-[#A1A1A1]">
                    Choose a profession and set your starting salary.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#242424] bg-[#0D0D0D] p-4">
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-[#6B6B6B]">
                      Profession
                    </label>

                    <div className="relative">
                      <select
                        value={profession}
                        onChange={(e) => {
                          setProfession(e.target.value);
                          if (e.target.value !== "Other") {
                            setCustomProfession("");
                          }
                        }}
                        className="w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 pr-10 text-base text-white outline-none transition focus:border-[#F59E0B]/60"
                      >
                        <option value="" disabled>
                          Select a profession
                        </option>
                        {PROFESSIONS.map((job) => (
                          <option key={job} value={job}>
                            {job}
                          </option>
                        ))}
                      </select>

                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#6B6B6B]">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M5 8L10 13L15 8"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>

                    {profession === "Other" && (
                      <div className="mt-4">
                        <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-[#6B6B6B]">
                          Custom profession
                        </label>
                        <input
                          type="text"
                          value={customProfession}
                          onChange={(e) => setCustomProfession(e.target.value)}
                          placeholder="e.g. Product Designer"
                          className="w-full rounded-xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-base text-white placeholder:text-[#3A3A3A] outline-none transition focus:border-[#F59E0B]/60"
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#242424] bg-[#0D0D0D] p-4">
                    <label className="mb-2 block text-[11px] font-medium uppercase tracking-widest text-[#6B6B6B]">
                      Starting salary
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={startSalary}
                      onChange={(e) => setStartSalary(e.target.value)}
                      placeholder="50000"
                      className="w-full rounded-xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-base text-white placeholder:text-[#3A3A3A] outline-none transition focus:border-[#F59E0B]/60"
                    />
                  </div>
                </div>

                {formattedSalary && (
                  <p className="text-sm text-[#6B6B6B]">
                    Starting salary preview:{" "}
                    <span className="text-white">${formattedSalary}</span>
                  </p>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-[#F5F5F5]">
                    What matters most?
                  </h2>
                  <p className="mt-2 text-sm text-[#A1A1A1]">
                    This helps frame the decisions during the simulation.
                  </p>
                </div>

                <div className="space-y-3">
                  {GOALS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGoal(g.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                        goal === g.id
                          ? "border-[#F59E0B] bg-[#151515] shadow-[0_0_0_1px_rgba(245,158,11,0.2)]"
                          : "border-[#242424] bg-[#111111] hover:border-[#363636]"
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <div>
                        <div className="font-semibold text-white">
                          {g.title}
                        </div>
                        <div className="text-[12px] leading-5 text-[#6B6B6B]">
                          {g.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-[#F5F5F5]">
                    Choose the climate
                  </h2>
                  <p className="mt-2 text-sm text-[#A1A1A1]">
                    This is saved with the session and used to shape the run.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {CLIMATE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setClimateLabel(option.id)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                        climateLabel === option.id
                          ? "border-[#F59E0B] bg-[#151515]"
                          : "border-[#242424] bg-[#111111] hover:border-[#363636]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{option.icon}</span>
                        <div>
                          <div className="font-semibold text-white">
                            {option.title}
                          </div>
                          <div className="mt-1 text-[12px] leading-5 text-[#6B6B6B]">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex-1 rounded-xl border border-[#2A2A2A] px-6 py-3.5 text-[#A1A1A1] transition hover:border-[#3A3A3A]"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                  className="flex-1 rounded-xl bg-[#F59E0B] px-6 py-3.5 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleBegin}
                  disabled={
                    !canProceedStep1 ||
                    !canProceedStep2 ||
                    !canProceedStep3 ||
                    submitting
                  }
                  className="flex-1 rounded-xl bg-[#F59E0B] px-6 py-3.5 text-sm font-semibold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? "Creating session..." : "Begin my life →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SetupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-[#F59E0B]">
          Loading...
        </div>
      }
    >
      <SetupContent />
    </Suspense>
  );
}
