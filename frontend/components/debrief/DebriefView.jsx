"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Share2 } from "lucide-react";
import DecisionBreakdown from "./DecisionBreakdown";
import LessonCards from "./LessonCards";
import ShareSheet from "@/components/share/ShareSheet";
import { lessonMistakesFromDebrief } from "@/lib/mistake-patterns";

const NetWorthChart = dynamic(() => import("@/components/ui/NetWorthChart"), {
  ssr: false,
});

function SourceBadge({ source }) {
  if (!source) return null;
  const isAi = source === "ai";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-medium"
      style={{
        borderColor: isAi ? "rgba(245,158,11,0.25)" : "rgba(107,107,107,0.35)",
        background: isAi ? "rgba(245,158,11,0.06)" : "rgba(107,107,107,0.08)",
        color: isAi ? "#F59E0B" : "#A1A1A1",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: isAi ? "#F59E0B" : "#6B6B6B" }}
      />
      {isAi ? "AI-enhanced analysis" : "Simulation-based analysis"}
    </span>
  );
}

function BehavioralCard({ profile }) {
  if (!profile?.dominantPatternLabel) return null;
  return (
    <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-6 mb-8">
      <h2
        className="font-bold text-[#F5F5F5] mb-1"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Behavioral Profile
      </h2>
      <p className="text-[11px] text-[#6B6B6B] mb-5">
        Patterns inferred from your decision history
      </p>
      <div className="rounded-xl border border-[#F59E0B]/20 bg-[#0D0D0D] p-4 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-[#F59E0B] mb-1">
          Dominant pattern
        </p>
        <p className="text-lg font-semibold text-[#F5F5F5] mb-2">
          {profile.dominantPatternLabel}
        </p>
        <p className="text-[12px] text-[#A1A1A1] leading-relaxed">
          {profile.dominantPatternDescription}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {profile.strengths?.length ? (
          <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#10B981] mb-2">
              Strengths
            </p>
            <ul className="space-y-1.5">
              {profile.strengths.map((s) => (
                <li key={s} className="text-[12px] text-[#A1A1A1]">
                  · {s}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {profile.blindspots?.length ? (
          <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <p className="text-[10px] uppercase tracking-widest text-[#EF4444] mb-2">
              Blind spots
            </p>
            <ul className="space-y-1.5">
              {profile.blindspots.map((s) => (
                <li key={s} className="text-[12px] text-[#A1A1A1]">
                  · {s}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function DebriefView({
  debrief,
  displayMetrics,
  playerName,
  scenarioId,
  compact = false,
  showActions = false,
  shareSessionId = null,
  onPlayAgain,
  onDashboard,
  onReplayMoment,
  replayLoading = false,
}) {
  const [highlightRound, setHighlightRound] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  if (!debrief) return null;

  const netWorth =
    displayMetrics?.netWorth ?? debrief?.finalMetrics?.netWorth ?? 0;
  const isPositive = netWorth >= 0;
  const optimalPath = debrief.optimalPath || [];
  const optimalMatches = optimalPath.filter((x) => x.match).length;
  const matchRate =
    optimalPath.length > 0
      ? Math.round((optimalMatches / optimalPath.length) * 100)
      : 0;

  const macroRiskLabel =
    (displayMetrics?.recessionProbAnnual ?? 0) > 0.26
      ? "High"
      : (displayMetrics?.recessionProbAnnual ?? 0) > 0.18
        ? "Medium"
        : "Low";

  const gap =
    debrief.netWorthGap ??
    (debrief.optimalNetWorth != null ? debrief.optimalNetWorth - netWorth : null);

  const lessonMistakes = lessonMistakesFromDebrief(debrief);

  return (
    <div className={compact ? "" : "pb-8"}>
      <div className={`text-center ${compact ? "mb-6" : "mb-12"} animate-fade-in-up`}>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-medium"
            style={{
              background: "rgba(245,158,11,0.05)",
              borderColor: "rgba(245,158,11,0.2)",
              color: "#F59E0B",
            }}
          >
            {compact ? "SESSION DEBRIEF" : "SIMULATION COMPLETE · 10 ROUNDS"}
            {debrief.scoreLabel ? ` · ${debrief.scoreLabel}` : ""}
          </div>
          <SourceBadge source={debrief.source} />
        </div>

        <div
          className={`font-extrabold tracking-tight mb-3 ${compact ? "text-4xl" : "text-6xl md:text-8xl"}`}
          style={{
            fontFamily: "var(--font-display)",
            color: isPositive ? "#10B981" : "#EF4444",
          }}
        >
          {isPositive ? "+" : ""}${netWorth.toLocaleString()}
        </div>
        <p className={`text-[#A1A1A1] ${compact ? "text-sm" : "text-lg"} mb-2`}>
          {debrief.playerName || playerName || "Your"} net worth at age 31
          {debrief.score != null ? (
            <span className="text-[#6B6B6B]"> · Score {debrief.score}/1000</span>
          ) : null}
        </p>
        <p
          className={`text-[#F5F5F5] mx-auto leading-relaxed ${compact ? "text-sm max-w-sm" : "max-w-md"}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          &ldquo;{debrief.verdict}&rdquo;
        </p>
        {debrief.subverdict ? (
          <p
            className={`text-[#6B6B6B] mt-3 mx-auto leading-relaxed ${compact ? "text-xs max-w-sm" : "text-sm max-w-lg"}`}
          >
            {debrief.subverdict}
          </p>
        ) : null}
      </div>

      {!compact ? (
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up"
          style={{ animationDelay: "0.08s", animationFillMode: "both" }}
        >
          {[
            {
              label: "Net Worth",
              value: `${isPositive ? "+" : ""}$${netWorth.toLocaleString()}`,
              color: isPositive ? "#10B981" : "#EF4444",
            },
            {
              label: "Credit Score",
              value: displayMetrics?.creditScore ?? "—",
              color:
                (displayMetrics?.creditScore ?? 0) >= 700
                  ? "#10B981"
                  : (displayMetrics?.creditScore ?? 0) >= 600
                    ? "#F59E0B"
                    : "#EF4444",
            },
            {
              label: "Total Debt",
              value: `$${(displayMetrics?.totalDebt ?? 0).toLocaleString()}`,
              color:
                (displayMetrics?.totalDebt ?? 0) === 0
                  ? "#10B981"
                  : (displayMetrics?.totalDebt ?? 0) < 20000
                    ? "#F59E0B"
                    : "#EF4444",
            },
            {
              label: "Retirement",
              value: `$${(displayMetrics?.retirementBalance ?? 0).toLocaleString()}`,
              color:
                (displayMetrics?.retirementBalance ?? 0) > 5000
                  ? "#10B981"
                  : "#F59E0B",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-5 relative overflow-hidden"
            >
              <div
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-5"
                style={{ background: stat.color }}
              />
              <div
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-display)", color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {debrief.netWorthProgression?.length > 0 ? (
        <div
          className={`rounded-2xl bg-[#111111] border border-[#1F1F1F] ${compact ? "p-4 mb-4" : "p-6 mb-8"}`}
        >
          <h2
            className="font-bold text-[#F5F5F5] mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Your Path vs Optimal Path
          </h2>
          <p className="text-[11px] text-[#6B6B6B] mb-4">
            Net worth progression across 10 rounds
            {gap != null && !compact ? (
              <span className="text-[#F59E0B]">
                {" "}
                · Gap ${Math.abs(gap).toLocaleString()}
              </span>
            ) : null}
          </p>
          <NetWorthChart
            data={debrief.netWorthProgression}
            compact={compact}
            highlightRound={highlightRound}
            onRoundHover={setHighlightRound}
          />
        </div>
      ) : null}

      <LessonCards
        mistakes={lessonMistakes}
        compact={compact}
        onReplayMoment={onReplayMoment}
        replayLoading={replayLoading}
        onHighlightRound={setHighlightRound}
      />

      {optimalPath.length > 0 ? (
        <div
          className={`rounded-2xl bg-[#111111] border border-[#1F1F1F] ${compact ? "p-4 mb-4" : "p-6 mb-8"}`}
        >
          <h2
            className="font-bold text-[#F5F5F5] mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Decision Breakdown
          </h2>
          <p className="text-[11px] text-[#6B6B6B] mb-4">
            Tap a round to compare choices — chart highlights the same round
          </p>
          <DecisionBreakdown
            optimalPath={optimalPath}
            decisionCosts={debrief.decisionCosts}
            highlightRound={highlightRound}
            onRoundSelect={setHighlightRound}
            compact={compact}
          />
        </div>
      ) : null}

      <BehavioralCard profile={debrief.behavioralProfile} />

      {debrief.advice?.length > 0 ? (
        <div
          className={`rounded-2xl bg-[#111111] border border-[#1F1F1F] ${compact ? "p-4 mb-4" : "p-6 mb-8"}`}
        >
          <h2
            className="font-bold text-[#F5F5F5] mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Personalized Takeaways
          </h2>
          <p className="text-[11px] text-[#6B6B6B] mb-5">
            Actionable next steps from your simulation
          </p>
          <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2"}`}>
            {debrief.advice.map((item, i) => (
              <div
                key={item.title || i}
                className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="text-sm font-semibold text-[#F5F5F5]">
                    {item.title}
                  </div>
                  {item.urgency ? (
                    <span className="text-[9px] uppercase tracking-wider text-[#6B6B6B] flex-shrink-0">
                      {item.urgency.replace(/-/g, " ")}
                    </span>
                  ) : null}
                </div>
                <p className="text-[12px] text-[#A1A1A1] leading-relaxed">
                  {item.body}
                </p>
                {item.estimatedImpact ? (
                  <p className="text-[11px] text-[#F59E0B] mt-2">
                    {item.estimatedImpact}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!compact ? (
        <div className="rounded-2xl bg-[#111111] border border-[#1F1F1F] p-6 mb-8">
          <h2
            className="font-bold text-[#F5F5F5] mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Financial Report Card
          </h2>
          <p className="text-[11px] text-[#6B6B6B] mb-6">
            Scenario: {scenarioId || debrief.scenarioId} · Server-authoritative
            metrics
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-2">
                Resilience
              </div>
              <div className="text-2xl font-bold text-[#F5F5F5] mb-1">
                {Math.round(100 - (displayMetrics?.stressIndex ?? 0))}/100
              </div>
              <div className="h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10B981]"
                  style={{
                    width: `${Math.round(100 - (displayMetrics?.stressIndex ?? 0))}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-2">
                Debt Fitness
              </div>
              <div className="text-2xl font-bold text-[#F5F5F5] mb-1">
                {Math.max(
                  0,
                  100 - Math.round(displayMetrics?.debtToIncome ?? 0),
                )}
                /100
              </div>
              <div className="h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F59E0B]"
                  style={{
                    width: `${Math.max(0, 100 - Math.round(displayMetrics?.debtToIncome ?? 0))}%`,
                  }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-2">
                Decision Quality
              </div>
              <div className="text-2xl font-bold text-[#F5F5F5] mb-1">
                {matchRate}/100
              </div>
              <div className="h-1.5 rounded-full bg-[#1F1F1F] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#10B981]"
                  style={{ width: `${matchRate}%` }}
                />
              </div>
            </div>
          </div>
          {displayMetrics?.inflationAnnual != null ? (
            <div className="mt-4 rounded-xl border border-[#1F1F1F] bg-[#0D0D0D] p-4">
              <div className="text-[11px] text-[#6B6B6B] uppercase tracking-widest mb-1">
                Macro Conditions At Finish
              </div>
              <div className="text-sm text-[#D1D1D1]">
                Inflation: {(displayMetrics.inflationAnnual * 100).toFixed(1)}%
                · Recession risk:{" "}
                {(displayMetrics.recessionProbAnnual * 100).toFixed(1)}% (
                {macroRiskLabel})
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {showActions ? (
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            type="button"
            onClick={onPlayAgain}
            className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            style={{
              background: "#F59E0B",
              color: "#0A0A0A",
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 30px rgba(245,158,11,0.15)",
            }}
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onDashboard}
            className="px-8 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
            style={{
              borderColor: "#2A2A2A",
              color: "#A1A1A1",
              background: "#111111",
              fontFamily: "var(--font-display)",
            }}
          >
            Dashboard
          </button>
          {shareSessionId ? (
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="px-8 py-3.5 rounded-xl font-semibold text-sm border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] flex items-center gap-2"
              style={{
                borderColor: "#2A2A2A",
                color: "#A1A1A1",
                background: "#111111",
                fontFamily: "var(--font-display)",
              }}
            >
              <Share2 className="w-4 h-4" aria-hidden />
              Share Result
            </button>
          ) : null}
        </div>
      ) : null}

      {shareSessionId ? (
        <ShareSheet
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          sessionId={shareSessionId}
          debrief={debrief}
          displayMetrics={displayMetrics}
          playerName={playerName}
        />
      ) : null}
    </div>
  );
}
