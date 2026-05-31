"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const PLAYER_COLOR = "#F59E0B";
const OPTIMAL_COLOR = "#10B981";

function formatMoney(v) {
  if (v == null) return "—";
  const abs = Math.abs(v);
  if (abs >= 1000) return `${v < 0 ? "-" : ""}$${(abs / 1000).toFixed(1)}k`;
  return `$${v.toLocaleString()}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const delta = row?.delta ?? (row?.optimal ?? 0) - (row?.player ?? 0);

  return (
    <div
      className="rounded-xl border p-3 text-[12px] min-w-[160px]"
      style={{
        background: "#121212",
        borderColor: "#2A2A2A",
        boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
      }}
    >
      <div className="font-bold text-[#F5F5F5] mb-2">Round {label}</div>
      {payload.map((entry, index) => (
  <div key={`${entry.dataKey}-${index}`} className="flex items-center gap-2 mb-1">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-[#A1A1A1]">
            {entry.dataKey === "player" ? "Your path" : "Optimal"}:
          </span>
          <span className="text-[#F5F5F5] font-semibold ml-auto">
            {formatMoney(entry.value)}
          </span>
        </div>
      ))}
      {delta !== 0 ? (
        <div
          className="mt-2 pt-2 border-t border-[#2A2A2A] text-[11px]"
          style={{ color: delta > 0 ? "#10B981" : "#EF4444" }}
        >
          Gap: {delta > 0 ? "+" : ""}
          {formatMoney(delta)}
        </div>
      ) : null}
    </div>
  );
}

function ChartLegend({ compact }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 ${compact ? "gap-3" : "justify-center sm:justify-start"}`}
    >
      {[
        { label: "Your path", color: PLAYER_COLOR },
        { label: "Optimal path", color: OPTIMAL_COLOR },
      ].map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span
            className="inline-block rounded-full"
            style={{
              width: compact ? 8 : 10,
              height: compact ? 8 : 10,
              background: item.color,
              boxShadow: `0 0 8px ${item.color}55`,
            }}
          />
          <span className="text-[11px] text-[#A1A1A1]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function NetWorthChart({
  data,
  compact = false,
  highlightRound = null,
  onRoundHover,
}) {
  const [activeRound, setActiveRound] = useState(null);
  const focusedRound = highlightRound ?? activeRound;

  const { chartData, gap, finalPlayer, finalOptimal } = useMemo(() => {
    const rows = (data || []).map((row) => ({
      ...row,
      delta: row.delta ?? (row.optimal ?? 0) - (row.player ?? 0),
    }));
    const last = rows[rows.length - 1];
    const fp = last?.player ?? 0;
    const fo = last?.optimal ?? fp;
    return { chartData: rows, gap: fo - fp, finalPlayer: fp, finalOptimal: fo };
  }, [data]);

  const height = compact ? 160 : 300;

  return (
    <div>
      {!compact && gap !== 0 ? (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">
              Final gap vs optimal
            </p>
            <p
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: gap >= 0 ? "#10B981" : "#EF4444",
              }}
            >
              {gap >= 0 ? "+" : ""}
              {formatMoney(gap)}
            </p>
          </div>
          <div className="flex gap-6 text-right sm:text-left">
            <div>
              <p className="text-[10px] text-[#6B6B6B] uppercase tracking-widest">
                You
              </p>
              <p className="text-sm font-semibold text-[#F59E0B]">
                {formatMoney(finalPlayer)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#6B6B6B] uppercase tracking-widest">
                Optimal
              </p>
              <p className="text-sm font-semibold text-[#10B981]">
                {formatMoney(finalOptimal)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, rgba(245,158,11,0.03) 0%, transparent 40%, rgba(16,185,129,0.02) 100%)",
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart
            data={chartData}
            margin={{
              top: 8,
              right: 8,
              bottom: compact ? 0 : 4,
              left: 0,
            }}
            onMouseMove={(state) => {
              const round = state?.activeLabel;
              setActiveRound(round ?? null);
              onRoundHover?.(round ?? null);
            }}
            onMouseLeave={() => {
              setActiveRound(null);
              onRoundHover?.(null);
            }}
          >
            <defs>
              <linearGradient id="playerArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PLAYER_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={PLAYER_COLOR} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="optimalArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={OPTIMAL_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={OPTIMAL_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#1A1A1A"
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="round"
              tick={{ fill: "#6B6B6B", fontSize: compact ? 10 : 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#6B6B6B", fontSize: compact ? 10 : 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatMoney(v)}
              width={compact ? 44 : 52}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#3A3A3A",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            {focusedRound != null ? (
              <ReferenceLine
                x={focusedRound}
                stroke="#F59E0B"
                strokeOpacity={0.45}
                strokeDasharray="3 3"
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="optimal"
              stroke="none"
              fill="url(#optimalArea)"
              isAnimationActive
            />
            <Area
              type="monotone"
              dataKey="player"
              stroke="none"
              fill="url(#playerArea)"
              isAnimationActive
            />
            <Line
              type="monotone"
              dataKey="optimal"
              stroke={OPTIMAL_COLOR}
              strokeWidth={compact ? 2 : 2.5}
              dot={false}
              activeDot={{
                r: compact ? 4 : 5,
                fill: OPTIMAL_COLOR,
                stroke: "#0A0A0A",
                strokeWidth: 2,
              }}
            />
            <Line
              type="monotone"
              dataKey="player"
              stroke={PLAYER_COLOR}
              strokeWidth={compact ? 2.5 : 3}
              dot={{
                r: compact ? 3 : 4,
                fill: PLAYER_COLOR,
                stroke: "#0A0A0A",
                strokeWidth: 2,
              }}
              activeDot={{
                r: compact ? 5 : 6,
                fill: PLAYER_COLOR,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className={`mt-3 ${compact ? "" : "mt-4"}`}>
        <ChartLegend compact={compact} />
      </div>
    </div>
  );
}
