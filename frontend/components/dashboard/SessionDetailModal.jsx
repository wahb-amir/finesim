"use client";

import { useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { formatCurrency, prettifyLabel } from "@/lib/format";
import {
  debriefSummaryFromSession,
  netWorthProgressionFromSession,
  optimalPathFromSession,
} from "@/lib/debrief-utils";

const NetWorthChart = dynamic(() => import("@/components/ui/NetWorthChart"), {
  ssr: false,
});

const STATUS_CONFIG = {
  completed: {
    label: "Completed",
    color: "#10B981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.25)",
  },
  active: {
    label: "In Progress",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  abandoned: {
    label: "Abandoned",
    color: "#6B6B6B",
    bg: "rgba(107,107,107,0.1)",
    border: "rgba(107,107,107,0.25)",
  },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.abandoned;
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.border,
      }}
    >
      {config.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SessionDetailModal({
  session,
  loading,
  debriefPreview,
  debriefLoading,
  onClose,
  onViewDebrief,
  onContinue,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose],
  );

  useEffect(() => {
    if (!session) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [session, handleKeyDown]);

  const previewDebrief = useMemo(() => {
    if (!session || session.status !== "completed") return null;
    if (debriefPreview) return debriefPreview;

    const summary = debriefSummaryFromSession(session);
    const progression = netWorthProgressionFromSession(session);
    const path = optimalPathFromSession(session);

    return {
      verdict: summary.verdict || "Completed simulation — open full debrief for analysis.",
      score: summary.score,
      scoreLabel: summary.scoreLabel,
      source: summary.source,
      netWorthProgression: progression,
      optimalPath: path,
      netWorthGap: summary.gap,
      optimalNetWorth: summary.finalOptimal,
      playerName: session.playerName,
    };
  }, [session, debriefPreview]);

  if (!session) return null;

  const rounds = session.rounds || [];
  const netWorth = session.finalMetrics?.netWorth;
  const score =
    debriefPreview?.score ??
    session.debriefData?.headline?.score ??
    session.debriefData?.score;
  const scoreLabel =
    debriefPreview?.scoreLabel ??
    session.debriefData?.headline?.scoreLabel ??
    session.debriefData?.scoreLabel;
  const summary = debriefSummaryFromSession(session);
  const matchRate = summary.matchRate;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-0 sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close session details"
      />

      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[#2A2A2A] bg-[#0F0F0F] shadow-2xl sm:rounded-3xl">
        <div className="flex-shrink-0 border-b border-[#1F1F1F] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={session.status} />
                {scoreLabel ? (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#6B6B6B]">
                    {scoreLabel}
                  </span>
                ) : null}
              </div>
              <h2
                id="session-detail-title"
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {session.career || "Simulation Run"}
              </h2>
              <p className="mt-1 text-sm text-[#6B6B6B]">
                {formatDate(session.createdAt)} · Round{" "}
                {Math.min(session.currentRound - 1, 10)}/10
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#2A2A2A] p-2 text-[#6B6B6B] transition hover:border-[#444] hover:text-white"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4l8 8M12 4l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Goal", value: prettifyLabel(session.goal) },
              { label: "Climate", value: session.climateLabel || "—" },
              {
                label: "Start Salary",
                value: session.startSalary
                  ? `$${Number(session.startSalary).toLocaleString()}`
                  : "—",
              },
              {
                label: "Net Worth",
                value:
                  netWorth != null
                    ? `${netWorth >= 0 ? "+" : ""}$${netWorth.toLocaleString()}`
                    : "—",
                highlight: netWorth != null,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3"
              >
                <div className="text-[10px] uppercase tracking-widest text-[#6B6B6B]">
                  {item.label}
                </div>
                <div
                  className="mt-1 text-sm font-semibold"
                  style={{
                    color: item.highlight
                      ? netWorth >= 0
                        ? "#10B981"
                        : "#EF4444"
                      : "#F5F5F5",
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {(debriefPreview?.verdict || session.aiSummary) && (
            <p className="mt-4 rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4 text-sm italic leading-relaxed text-[#A1A1A1]">
              &ldquo;{debriefPreview?.verdict || session.aiSummary}&rdquo;
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {session.status === "completed" && previewDebrief ? (
            <section className="mb-8">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#6B6B6B]">
                Debrief Snapshot
              </h3>

              {debriefLoading ? (
                <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] py-8 text-center text-sm text-[#6B6B6B]">
                  Loading chart & insights…
                </div>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {[
                      {
                        label: "Optimal match",
                        value: `${summary.matches}/${summary.totalRounds}`,
                        sub: `${matchRate}%`,
                        color: "#10B981",
                      },
                      {
                        label: "Path gap",
                        value:
                          summary.gap != null
                            ? formatCurrency(Math.abs(summary.gap))
                            : "—",
                        sub: summary.gap > 0 ? "below optimal" : "on track",
                        color: summary.gap > 0 ? "#F59E0B" : "#10B981",
                      },
                      {
                        label: "Score",
                        value: score != null ? score : "—",
                        sub: scoreLabel || "debrief",
                        color: "#F59E0B",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-3 text-center"
                      >
                        <p className="text-[9px] uppercase tracking-widest text-[#6B6B6B]">
                          {item.label}
                        </p>
                        <p
                          className="mt-1 text-lg font-bold"
                          style={{ color: item.color }}
                        >
                          {item.value}
                        </p>
                        <p className="text-[10px] text-[#6B6B6B]">{item.sub}</p>
                      </div>
                    ))}
                  </div>

                  {previewDebrief.netWorthProgression?.length > 0 ? (
                    <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4">
                      <p className="mb-3 text-[11px] text-[#6B6B6B]">
                        Net worth: your path vs optimal
                      </p>
                      <NetWorthChart
                        data={previewDebrief.netWorthProgression}
                        compact
                      />
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}

          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#6B6B6B]">
            Your Decisions
          </h3>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#6B6B6B]">
              Loading session details…
            </div>
          ) : rounds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2A2A2A] py-12 text-center text-sm text-[#6B6B6B]">
              No decisions recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => {
                const pathRow = previewDebrief?.optimalPath?.find(
                  (p) => p.round === round.round,
                );
                const matched = pathRow?.match;

                return (
                  <div
                    key={round.round}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: matched
                        ? "rgba(16,185,129,0.2)"
                        : matched === false
                          ? "rgba(239,68,68,0.2)"
                          : "#1F1F1F",
                      background: "#0A0A0A",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                        style={{
                          borderColor: matched
                            ? "rgba(16,185,129,0.35)"
                            : matched === false
                              ? "rgba(239,68,68,0.35)"
                              : "#2A2A2A",
                          background: "#161616",
                          color: matched
                            ? "#10B981"
                            : matched === false
                              ? "#EF4444"
                              : "#F59E0B",
                        }}
                      >
                        {round.round}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#F5F5F5]">
                          {round.eventTitle || `Round ${round.round}`}
                        </div>
                        <div
                          className="mt-1 text-sm"
                          style={{
                            color: matched
                              ? "#10B981"
                              : matched === false
                                ? "#EF4444"
                                : "#10B981",
                          }}
                        >
                          Chose:{" "}
                          {round.selectedOptionTitle ||
                            `Option ${round.choice}`}
                        </div>
                        {matched === false && pathRow?.optimal ? (
                          <div className="mt-1 text-[11px] text-[#6B6B6B]">
                            Optimal: {pathRow.optimal}
                          </div>
                        ) : null}
                        {round.metricsAfter?.netWorth != null ? (
                          <div className="mt-2 text-[11px] text-[#6B6B6B]">
                            Net worth after:{" "}
                            {formatCurrency(round.metricsAfter.netWorth)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-[#1F1F1F] p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            {session.status === "completed" ? (
              <button
                type="button"
                onClick={() => onViewDebrief?.(session._id)}
                className="flex-1 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              >
                View Full Debrief
                {score != null ? ` · Score ${score}` : ""}
              </button>
            ) : session.status === "active" ? (
              <button
                type="button"
                onClick={() => onContinue?.(session._id)}
                className="flex-1 rounded-xl bg-[#F59E0B] px-5 py-3 text-sm font-semibold text-black transition hover:opacity-95"
              >
                Continue Game
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#111111] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#444]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
