"use client";

function Sparkline({ points, positive }) {
  if (!points?.length) return null;
  const values = points.map((p) => p.value ?? 0);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const w = 280;
  const h = 48;
  const pad = 4;
  const coords = values.map((v, i) => {
    const x = pad + (i / Math.max(values.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const stroke = positive ? "#10B981" : "#EF4444";
  const fillId = positive ? "spark-green" : "spark-red";

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-12"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${coords[0].split(",")[0]},${h} ${coords.join(" ")} ${coords[coords.length - 1].split(",")[0]},${h}`}
        fill={`url(#${fillId})`}
      />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatPill({ label, value, accent }) {
  return (
    <div className="share-card-stat rounded-xl border border-[#1F1F1F] bg-[#0A0A0A]/80 px-3 py-2.5 text-center min-w-0 flex-1">
      <p className="text-[9px] uppercase tracking-widest text-[#6B6B6B] mb-0.5 truncate">
        {label}
      </p>
      <p
        className="text-sm font-bold truncate"
        style={{
          color: accent || "#F5F5F5",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Viral FinSim result card — used in share sheet, public /share pages, and OG previews.
 */
export default function ShareCard({
  card,
  variant = "default",
  className = "",
}) {
  if (!card) return null;

  const positive = card.isPositive ?? (card.netWorth ?? 0) >= 0;
  const accent = positive ? "#10B981" : "#EF4444";
  const netWorth = card.netWorth ?? 0;
  const isCompact = variant === "compact";

  return (
    <article
      className={`share-card relative overflow-hidden rounded-2xl border ${className}`}
      style={{
        borderColor: positive ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)",
        background:
          "linear-gradient(145deg, #141414 0%, #0A0A0A 45%, #0D0D0D 100%)",
        boxShadow: positive
          ? "0 0 60px rgba(16,185,129,0.12), 0 24px 48px rgba(0,0,0,0.5)"
          : "0 0 60px rgba(239,68,68,0.1), 0 24px 48px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: positive
            ? "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.35), transparent 60%)"
            : "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(239,68,68,0.28), transparent 60%)",
        }}
      />
      <div className="noise-overlay relative z-10 p-5 sm:p-6">
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#F59E0B] font-medium mb-1">
              FinSim · 10-year run
            </p>
            <h2
              className={`font-bold text-[#F5F5F5] truncate ${isCompact ? "text-lg" : "text-xl"}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {card.playerName}
            </h2>
            {(card.career || card.climateLabel) && (
              <p className="text-[11px] text-[#6B6B6B] mt-0.5 truncate">
                {[card.career, card.climateLabel].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {card.scoreLabel || card.score != null ? (
            <div
              className="shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
              style={{
                borderColor: "rgba(245,158,11,0.35)",
                background: "rgba(245,158,11,0.08)",
                color: "#F59E0B",
              }}
            >
              {card.scoreLabel || `${card.score}/1000`}
            </div>
          ) : null}
        </header>

        <div className="mb-1">
          <p className="text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-1">
            Net worth at 31
          </p>
          <p
            className={`font-extrabold tracking-tight leading-none ${isCompact ? "text-4xl" : "text-5xl sm:text-6xl"}`}
            style={{ fontFamily: "var(--font-display)", color: accent }}
          >
            {positive ? "+" : ""}${netWorth.toLocaleString()}
          </p>
        </div>

        {card.verdict ? (
          <p
            className={`text-[#A1A1A1] leading-snug mt-3 ${isCompact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            &ldquo;{card.verdict}&rdquo;
          </p>
        ) : null}

        {card.netWorthProgression?.length > 1 ? (
          <div className="mt-4 mb-1 opacity-90">
            <Sparkline points={card.netWorthProgression} positive={positive} />
          </div>
        ) : null}

        <div className="flex gap-2 mt-4">
          <StatPill
            label="Credit"
            value={card.creditScore ?? "—"}
            accent={
              (card.creditScore ?? 0) >= 700
                ? "#10B981"
                : (card.creditScore ?? 0) >= 600
                  ? "#F59E0B"
                  : "#EF4444"
            }
          />
          <StatPill
            label="Optimal"
            value={`${card.matchCount ?? 0}/${card.totalRounds ?? 10}`}
            accent="#F59E0B"
          />
          <StatPill
            label="Match"
            value={`${card.matchRate ?? 0}%`}
            accent={card.matchRate >= 70 ? "#10B981" : "#A1A1A1"}
          />
        </div>

        <footer className="mt-5 pt-4 border-t border-[#1F1F1F] flex items-center justify-between gap-2">
          <span
            className="text-gradient-amber text-sm font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            FinSim
          </span>
          <span className="text-[10px] text-[#6B6B6B]">
            Live 10 years in 15 min →
          </span>
        </footer>
      </div>
    </article>
  );
}
