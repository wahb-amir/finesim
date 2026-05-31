/**
 * FinSim share cards — public-safe payloads + slug management.
 */

const crypto = require("crypto");
const GameSession = require("../../Models/GameSession");
const { OPTIMAL_CHOICES, normalizeChoice } = require("../debrief");

const SLUG_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
const SLUG_LENGTH = 10;

function generateShareSlug() {
  const bytes = crypto.randomBytes(SLUG_LENGTH);
  let slug = "";
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += SLUG_CHARS[bytes[i] % SLUG_CHARS.length];
  }
  return slug;
}

function computeMatchStats(rounds) {
  const list = rounds || [];
  if (!list.length) return { matchCount: 0, matchRate: 0, totalRounds: 10 };
  const matchCount = list.filter(
    (r) => normalizeChoice(r.choice) === OPTIMAL_CHOICES[r.round],
  ).length;
  return {
    matchCount,
    matchRate: Math.round((matchCount / list.length) * 100),
    totalRounds: list.length,
  };
}

function truncateVerdict(text, max = 140) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

/**
 * Build a client-safe share card from a completed session (no PII beyond player name).
 */
function buildShareCard(session) {
  const report = session.debriefData || {};
  const rounds = session.rounds || [];
  const fm = session.finalMetrics || {};
  const netWorth = fm.netWorth ?? 0;
  const { matchCount, matchRate, totalRounds } = computeMatchStats(rounds);
  const comparison = session.optimalComparison;
  const netWorthRows =
    report.netWorthByRound ||
    comparison?.netWorthByRound ||
    rounds.map((r) => ({
      round: r.round,
      player: r.metricsAfter?.netWorth ?? 0,
    }));

  const verdict =
    session.aiSummary ||
    report?.headline?.verdict ||
    report?.headline?.subverdict ||
    "Completed a 10-year financial life simulation.";

  const score = report?.headline?.score ?? null;
  const scoreLabel = report?.headline?.scoreLabel ?? null;
  const shareText =
    report?.shareText ||
    `FinSim — ${session.playerName || "Player"}: $${netWorth.toLocaleString()} net worth, ${matchCount}/${totalRounds} optimal decisions${score != null ? `, score ${score}/1000` : ""}`;

  return {
    slug: session.shareSlug,
    playerName: session.playerName || "Player",
    career: session.career || null,
    goal: session.goal || null,
    climateLabel: session.climateLabel || null,
    scenarioId: session.scenarioId || null,
    netWorth,
    creditScore: fm.creditScore ?? null,
    totalDebt: fm.totalDebt ?? null,
    retirementBalance: fm.retirementBalance ?? null,
    score,
    scoreLabel,
    verdict: truncateVerdict(verdict, 160),
    shareText,
    matchCount,
    matchRate,
    totalRounds,
    netWorthProgression: netWorthRows.slice(0, 10).map((row) => ({
      round: row.round,
      value: row.player ?? 0,
    })),
    sharedAt:
      session.shareCreatedAt || session.debriefGeneratedAt || session.updatedAt,
    isPositive: netWorth >= 0,
  };
}

async function ensureShareSlug(session) {
  if (session.shareSlug) return session.shareSlug;

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateShareSlug();
    const exists = await GameSession.exists({ shareSlug: slug });
    if (exists) continue;
    session.shareSlug = slug;
    session.shareCreatedAt = new Date();
    await session.save();
    return slug;
  }

  const err = new Error("Could not generate unique share link");
  err.statusCode = 500;
  throw err;
}

function shareUrlForSlug(slug) {
  const base = (process.env.CLIENT_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return `${base}/share/${slug}`;
}

module.exports = {
  generateShareSlug,
  buildShareCard,
  ensureShareSlug,
  shareUrlForSlug,
  computeMatchStats,
};
