/**
 * Debrief orchestration: RAG retrieval, LLM report, persistence, UI adapter.
 * All debrief data is derived from server-stored session state — never from the client.
 */

const { toUIMetrics } = require("../simulation/metrics");
const { getVisibleMetrics } = require("../simulation/engine");
const { detectMistakePatterns } = require("./mistakes");

const OPTIMAL_CHOICES = {
  1: "A",
  2: "A",
  3: "B",
  4: "B",
  5: "A",
  6: "A",
  7: "B",
  8: "A",
  9: "A",
  10: "A",
};

function normalizeChoice(choice) {
  if (choice === "left") return "A";
  if (choice === "right") return "B";
  return choice;
}

function buildOptimalComparisonFromRounds(rounds) {
  const netWorthByRound = (rounds || []).map((r) => {
    const player = r.metricsAfter?.netWorth ?? 0;
    const optimalRound = r.round;
    const optimalChoice = OPTIMAL_CHOICES[optimalRound];
    const playerMatchesOptimal = normalizeChoice(r.choice) === optimalChoice;
    const optimal = playerMatchesOptimal ? player : Math.round(player * 1.08);
    return {
      round: r.round,
      player,
      optimal,
      delta: optimal - player,
    };
  });

  const last = rounds[rounds.length - 1];
  const finalPlayer = last?.metricsAfter?.netWorth ?? 0;
  const finalOptimal = netWorthByRound.reduce(
    (max, row) => Math.max(max, row.optimal),
    finalPlayer,
  );

  return {
    optimalNetWorth: finalOptimal,
    optimalCredit: 760,
    optimalRetirement: Math.round(
      (last?.metricsAfter?.retirementBalance ?? 0) * 1.35,
    ),
    netWorthByRound,
  };
}

function buildFinalMetrics(storedMetrics, simState) {
  return {
    netWorth: storedMetrics.netWorth,
    creditScore: storedMetrics.creditScore,
    savingsBalance: storedMetrics.savingsBalance,
    investmentBalance: storedMetrics.investmentBalance,
    retirementBalance: storedMetrics.retirementBalance,
    totalDebt: storedMetrics.totalDebt,
    totalInterestPaid: simState?.totalInterestPaid ?? 0,
    stressIndex: storedMetrics.stressIndex,
    debtToIncome: storedMetrics.debtToIncome,
    emergencyFundMonths: storedMetrics.emergencyFundMonths,
  };
}

/**
 * Build client-safe final metrics for debrief UI (no simState).
 */
function finalMetricsToUI(finalMetrics, simState) {
  if (!finalMetrics) return null;
  const visible = simState
    ? getVisibleMetrics(simState)
    : {
        monthlyIncomeNet: 0,
        monthlyExpenses: 0,
        netWorth: finalMetrics.netWorth,
        creditScore: finalMetrics.creditScore,
        stress: finalMetrics.stressIndex,
        dti: (finalMetrics.debtToIncome ?? 0) / 100,
        investments: finalMetrics.investmentBalance ?? 0,
        inflationAnnual: 0.03,
        recessionProbAnnual: 0.14,
        burnout: 0,
        bufferMonths: finalMetrics.emergencyFundMonths ?? 0,
        outcomeScore: { composite: 0 },
      };
  return toUIMetrics(
    visible,
    simState || {
      portfolio: {
        retirement: finalMetrics.retirementBalance ?? 0,
      },
    },
  );
}

/**
 * Map stored debrief report + session into the shape the debrief page expects.
 */
function toDebriefUIPayload(session) {
  const report = session.debriefData;
  const rounds = session.rounds || [];
  const comparison = session.optimalComparison;
  const netWorthRows =
    report?.netWorthByRound ||
    comparison?.netWorthByRound ||
    rounds.map((r) => ({
      round: r.round,
      player: r.metricsAfter?.netWorth ?? 0,
      optimal: r.metricsAfter?.netWorth ?? 0,
    }));

  const optimalPath = rounds.map((r) => {
    const optimalLetter = OPTIMAL_CHOICES[r.round] || "A";
    const choiceLetter = normalizeChoice(r.choice);
    const match = choiceLetter === optimalLetter;
    return {
      round: r.round,
      choice: r.selectedOptionTitle || `Option ${choiceLetter}`,
      optimal: match
        ? r.selectedOptionTitle || `Option ${optimalLetter}`
        : `Optimal: Option ${optimalLetter}`,
      match,
      choiceLetter,
      optimalLetter,
    };
  });

  const verdict =
    session.aiSummary ||
    report?.headline?.verdict ||
    report?.headline?.subverdict ||
    "Your 10-year financial simulation is complete.";

  const finalPlayer = session.finalMetrics?.netWorth ?? 0;
  const finalOptimal =
    comparison?.optimalNetWorth ??
    netWorthRows.reduce(
      (max, row) => Math.max(max, row.optimal ?? row.player),
      finalPlayer,
    );

  return {
    verdict,
    subverdict: report?.headline?.subverdict,
    score: report?.headline?.score,
    scoreLabel: report?.headline?.scoreLabel,
    source: report?.meta?.source || "ai",
    netWorthGap: finalOptimal - finalPlayer,
    optimalNetWorth: finalOptimal,
    behavioralProfile: report?.behavioralProfile || null,
    decisionCosts: report?.decisionCosts || [],
    netWorthBreakdown: report?.netWorthBreakdown || null,
    optimalPath,
    netWorthProgression: netWorthRows.map((row) => ({
      round: row.round,
      player: row.player,
      optimal: row.optimal ?? row.player,
      delta: (row.optimal ?? row.player) - row.player,
    })),
    report,
    sources: session.debriefSources || [],
    advice: session.aiAdvice || report?.realLifeTakeaways || [],
    lessonMistakes:
      report?.lessonMistakes?.length > 0
        ? report.lessonMistakes
        : detectMistakePatterns(session),
    shareText: report?.shareText,
    playerName: session.playerName,
    career: session.career,
    goal: session.goal,
    climateLabel: session.climateLabel,
    scenarioId: session.scenarioId,
    finalMetrics: session.finalMetrics,
    optimalComparison: session.optimalComparison,
    rounds: rounds.map((r) => ({
      round: r.round,
      eventTitle: r.eventTitle,
      choice: r.choice,
      selectedOptionTitle: r.selectedOptionTitle,
      metricsBefore: r.metricsBefore,
      metricsAfter: r.metricsAfter,
    })),
  };
}

function mergeReportWithSessionComparison(session, report) {
  const fallback = buildOptimalComparisonFromRounds(session.rounds || []);
  const existing = session.optimalComparison?.toObject?.()
    ? session.optimalComparison.toObject()
    : session.optimalComparison || {};

  if (!report.netWorthByRound?.length) {
    report.netWorthByRound = fallback.netWorthByRound;
  }

  if (!report.optimalComparison) {
    report.optimalComparison = {
      optimalNetWorth: fallback.optimalNetWorth,
      optimalCredit: fallback.optimalCredit,
      optimalRetirement: fallback.optimalRetirement,
      keyDifferences: [],
    };
  }

  session.optimalComparison = {
    ...existing,
    optimalNetWorth:
      report.optimalComparison?.optimalNetWorth ?? fallback.optimalNetWorth,
    optimalCredit:
      report.optimalComparison?.optimalCredit ?? fallback.optimalCredit,
    optimalRetirement:
      report.optimalComparison?.optimalRetirement ?? fallback.optimalRetirement,
    netWorthByRound: report.netWorthByRound,
  };
}

function attachLessonMistakes(session, report) {
  const lessonMistakes = detectMistakePatterns(session);
  report.lessonMistakes = lessonMistakes;
  return lessonMistakes;
}

function persistDebriefOnSession(session, report, sources) {
  attachLessonMistakes(session, report);
  session.debriefData = report;
  session.debriefSources = sources || [];
  session.aiSummary =
    report?.headline?.verdict || report?.headline?.subverdict || null;
  session.aiAdvice = report?.realLifeTakeaways || [];
  session.debriefGeneratedAt = new Date();
  mergeReportWithSessionComparison(session, report);
}

/**
 * Run RAG + LLM debrief and persist on the session document.
 * Falls back to deterministic analysis if AI/RAG fails.
 */
async function generateAndPersistDebrief(session) {
  if (session.debriefData) {
    if (!session.debriefData.lessonMistakes?.length) {
      attachLessonMistakes(session, session.debriefData);
      await session.save();
    }
    return {
      cached: true,
      report: session.debriefData,
      sources: session.debriefSources,
      source: session.debriefData?.meta?.source || "ai",
    };
  }

  if (session.status !== "completed" || (session.rounds?.length || 0) < 10) {
    const err = new Error(
      "Game must be completed with 10 rounds before debrief",
    );
    err.statusCode = 400;
    throw err;
  }

  const { buildDeterministicDebrief } = require("./deterministic");
  let report;
  let sources = [];
  let source = "ai";

  try {
    const { generateDebriefReport } = require("../../ai/debrief");
    const result = await generateDebriefReport(session);
    report = result.report;
    sources = result.sources;
    mergeReportWithSessionComparison(session, report);
  } catch (aiErr) {
    console.error(
      "[debrief] AI pipeline failed, using deterministic fallback:",
      aiErr.message,
    );
    report = buildDeterministicDebrief(session);
    source = "deterministic";
  }

  persistDebriefOnSession(session, report, sources);

  await session.save();

  return { cached: false, report, sources, source };
}

/**
 * Strip server-only fields before sending session to the client.
 */
function toPublicSession(session) {
  const doc = session.toObject ? session.toObject() : { ...session };
  delete doc.simState;
  delete doc.simSeed;
  doc.advisorCallsUsed = doc.advisorCallsUsed || 0;
  doc.advisorRemainingUses = Math.max(0, 4 - doc.advisorCallsUsed);
  doc.advisorMessages = doc.advisorMessages || [];
  return doc;
}

module.exports = {
  normalizeChoice,
  buildOptimalComparisonFromRounds,
  buildFinalMetrics,
  finalMetricsToUI,
  toDebriefUIPayload,
  generateAndPersistDebrief,
  persistDebriefOnSession,
  attachLessonMistakes,
  mergeReportWithSessionComparison,
  toPublicSession,
  detectMistakePatterns,
  OPTIMAL_CHOICES,
};
