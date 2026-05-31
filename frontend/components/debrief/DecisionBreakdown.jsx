"use client";

import { useMemo, useState } from "react";

const FILTERS = [
  { id: "all", label: "All rounds" },
  { id: "missed", label: "Missed optimal" },
  { id: "matched", label: "Matched" },
];

export default function DecisionBreakdown({
  optimalPath = [],
  decisionCosts = [],
  highlightRound,
  onRoundSelect,
  compact = false,
}) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "missed") return optimalPath.filter((x) => !x.match);
    if (filter === "matched") return optimalPath.filter((x) => x.match);
    return optimalPath;
  }, [optimalPath, filter]);

  const matches = optimalPath.filter((x) => x.match).length;
  const matchRate =
    optimalPath.length > 0
      ? Math.round((matches / optimalPath.length) * 100)
      : 0;

  const costByRound = useMemo(
    () =>
      Object.fromEntries(
        (decisionCosts || []).map((c) => [c.round, c]),
      ),
    [decisionCosts],
  );

  if (!optimalPath.length) return null;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="rounded-full border px-3 py-1 text-[11px] font-medium transition"
              style={{
                borderColor: filter === f.id ? "#F59E0B" : "#2A2A2A",
                background:
                  filter === f.id ? "rgba(245,158,11,0.1)" : "transparent",
                color: filter === f.id ? "#F59E0B" : "#6B6B6B",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div
            className="relative flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#10B981 ${matchRate}%, #1F1F1F 0)`,
            }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111111] text-[11px] font-bold text-[#10B981]">
              {matchRate}%
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-[#F5F5F5]">
              {matches}/{optimalPath.length} optimal
            </p>
            <p className="text-[10px] text-[#6B6B6B]">Decision alignment</p>
          </div>
        </div>
      </div>

      <div className={`space-y-2 ${compact ? "max-h-48 overflow-y-auto pr-1" : ""}`}>
        {filtered.map((item) => {
          const isOpen = expanded === item.round;
          const isHighlighted = highlightRound === item.round;
          const cost = costByRound[item.round];

          return (
            <div
              key={item.round}
              className="rounded-xl border transition-all duration-200"
              style={{
                borderColor: isHighlighted
                  ? "rgba(245,158,11,0.5)"
                  : item.match
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(239,68,68,0.15)",
                background: item.match
                  ? "rgba(16,185,129,0.04)"
                  : "rgba(239,68,68,0.04)",
              }}
            >
              <button
                type="button"
                className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-3 px-3 py-3 text-left"
                onClick={() => {
                  const next = isOpen ? null : item.round;
                  setExpanded(next);
                  onRoundSelect?.(next);
                }}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{
                    background: item.match
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(239,68,68,0.15)",
                    color: item.match ? "#10B981" : "#EF4444",
                  }}
                >
                  {item.round}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#F5F5F5]">
                    {item.eventTitle || `Round ${item.round}`}
                  </p>
                  <p
                    className="truncate text-[11px]"
                    style={{ color: item.match ? "#10B981" : "#EF4444" }}
                  >
                    {item.choice}
                  </p>
                </div>
                <span className="text-[#6B6B6B] text-lg leading-none">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen ? (
                <div className="border-t border-[#1F1F1F] px-3 pb-3 pt-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-[#0A0A0A] p-3">
                      <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">
                        You chose
                      </p>
                      <p
                        className="text-[12px] font-medium"
                        style={{ color: item.match ? "#10B981" : "#EF4444" }}
                      >
                        {item.choice}
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#0A0A0A] p-3">
                      <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">
                        Optimal
                      </p>
                      <p className="text-[12px] font-medium text-[#A1A1A1]">
                        {item.optimal}
                      </p>
                    </div>
                  </div>
                  {cost?.projectedCost30yrExplained ? (
                    <p className="mt-2 text-[11px] text-[#6B6B6B] leading-relaxed">
                      {cost.projectedCost30yrExplained}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
