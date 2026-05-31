const API = process.env.NEXT_PUBLIC_API_URL;

export function getSiteOrigin() {
  if (typeof window !== "undefined") return window.location.origin;
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_CLIENT_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function sharePageUrl(slug) {
  return `${getSiteOrigin()}/share/${slug}`;
}

/** Client-side preview before the server returns the canonical card. */
export function buildPreviewCard({ debrief, displayMetrics, playerName }) {
  if (!debrief) return null;
  const netWorth =
    displayMetrics?.netWorth ?? debrief?.finalMetrics?.netWorth ?? 0;
  const optimalPath = debrief.optimalPath || [];
  const matchCount = optimalPath.filter((x) => x.match).length;
  const totalRounds = optimalPath.length || 10;
  const matchRate =
    totalRounds > 0 ? Math.round((matchCount / totalRounds) * 100) : 0;

  return {
    playerName: debrief.playerName || playerName || "Player",
    career: debrief.career,
    goal: debrief.goal,
    climateLabel: debrief.climateLabel,
    netWorth,
    creditScore: displayMetrics?.creditScore ?? debrief.finalMetrics?.creditScore,
    totalDebt: displayMetrics?.totalDebt ?? debrief.finalMetrics?.totalDebt,
    retirementBalance:
      displayMetrics?.retirementBalance ??
      debrief.finalMetrics?.retirementBalance,
    score: debrief.score,
    scoreLabel: debrief.scoreLabel,
    verdict: debrief.verdict,
    shareText: debrief.shareText,
    matchCount,
    matchRate,
    totalRounds,
    netWorthProgression: (debrief.netWorthProgression || []).map((row) => ({
      round: row.round,
      value: row.player ?? 0,
    })),
    isPositive: netWorth >= 0,
  };
}

export async function createSessionShare(sessionId) {
  const res = await fetch(`${API}/game/session/${sessionId}/share`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Could not create share link");
  }
  return data;
}

export async function fetchPublicShare(slug) {
  const res = await fetch(`${API}/share/${slug}`, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Share card not found");
  }
  return data;
}
