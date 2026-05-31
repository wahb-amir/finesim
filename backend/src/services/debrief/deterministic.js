/**
 * Deterministic debrief pipeline — used when RAG/LLM generation fails.
 * Produces the same JSON shape the UI expects, derived only from session data.
 */

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

const BEHAVIORAL_PATTERNS = {
  1: "present_bias",
  2: "availability_heuristic",
  3: "lifestyle_inflation",
  4: "loss_aversion",
  5: "availability_heuristic",
  6: "present_bias",
  7: "loss_aversion",
  8: "present_bias",
  9: "present_bias",
  10: "mental_accounting",
};

const PATTERN_LABELS = {
  present_bias: "Present Bias",
  availability_heuristic: "Recency Bias",
  lifestyle_inflation: "Lifestyle Inflation",
  loss_aversion: "Loss Aversion",
  mental_accounting: "Mental Accounting",
  sunk_cost: "Sunk Cost Fallacy",
};

function normalizeChoice(choice) {
  if (choice === "left") return "A";
  if (choice === "right") return "B";
  return choice;
}

function mode(arr) {
  if (!arr.length) return null;
  const freq = arr.reduce((a, v) => ({ ...a, [v]: (a[v] || 0) + 1 }), {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

function project30yr(amount) {
  return Math.round(amount * Math.pow(1.07, 30));
}

function computeScore(session, matchRate, gap) {
  const m = session.finalMetrics || {};
  let score = Math.round(matchRate * 4);
  if (m.netWorth > 0) score += Math.min(300, Math.round(m.netWorth / 200));
  if (m.creditScore >= 700) score += 150;
  else if (m.creditScore >= 650) score += 80;
  if ((m.totalDebt ?? 0) === 0) score += 120;
  if ((m.retirementBalance ?? 0) > 10000) score += 100;
  score -= Math.min(200, Math.round(Math.abs(gap) / 500));
  return Math.max(120, Math.min(1000, score));
}

function scoreLabel(score, matchRate, netWorth) {
  if (matchRate >= 80 && netWorth > 15000) return "Wealth Architect";
  if (matchRate >= 70) return "Cautious Builder";
  if (netWorth < 0) return "Debt Survivor";
  if (matchRate < 40) return "Risk Avoider";
  return "Late Starter";
}

function buildVerdict(session, matchRate, gap, optimalNetWorth) {
  const m = session.finalMetrics || {};
  const nw = m.netWorth ?? 0;
  const matches = Math.round((matchRate / 100) * 10);
  const gapAbs = Math.abs(gap);
  if (matchRate >= 80 && nw > 0) {
    return `Strong finish: $${nw.toLocaleString()} net worth with ${matches}/10 optimal-aligned decisions.`;
  }
  if (gapAbs > 5000) {
    return `You finished at $${nw.toLocaleString()}, about $${gapAbs.toLocaleString()} below the heuristic optimal path ($${optimalNetWorth.toLocaleString()}).`;
  }
  if (nw < 0) {
    return `You ended underwater at $${Math.abs(nw).toLocaleString()} in debt — ${matches}/10 decisions matched the optimal playbook.`;
  }
  return `Your 10-year path landed at $${nw.toLocaleString()} net worth with ${matches}/10 decisions matching the optimal path.`;
}

function buildSubverdict(session, dominantPattern) {
  const label = PATTERN_LABELS[dominantPattern] || "decision patterns";
  return `Analysis highlights ${label.toLowerCase()} as the dominant theme in suboptimal rounds — review the chart and round breakdown to see where compounding diverged.`;
}

function buildTakeaways(session, wrongRounds, gap) {
  const m = session.finalMetrics || {};
  const items = [];

  if ((m.totalDebt ?? 0) > 0) {
    items.push({
      title: "Attack high-interest debt first",
      body: `You finished with $${(m.totalDebt ?? 0).toLocaleString()} in total debt. Prioritize the highest APR balance before increasing discretionary spending.`,
      urgency: "immediate",
      estimatedImpact: `Could save $${Math.round((m.totalInterestPaid ?? 0) * 0.3).toLocaleString()}+ in interest over time`,
    });
  }

  if ((m.retirementBalance ?? 0) < 8000) {
    items.push({
      title: "Start retirement contributions early",
      body: `Retirement balance ended at $${(m.retirementBalance ?? 0).toLocaleString()}. Even small automatic contributions in your 20s compound dramatically by 31.`,
      urgency: "this-month",
      estimatedImpact: "10+ years of tax-advantaged growth",
    });
  }

  if (wrongRounds.length >= 3) {
    items.push({
      title: "Replay your highest-cost rounds",
      body: `You missed the optimal choice in ${wrongRounds.length} rounds. Focus on rounds ${wrongRounds
        .slice(0, 3)
        .map((r) => r.round)
        .join(", ")} where the path gap widened.`,
      urgency: "this-year",
      estimatedImpact:
        gap > 0
          ? `Closing the gap could add ~$${project30yr(gap).toLocaleString()} over 30 years at 7% growth`
          : "Sharper alignment on the next run",
    });
  }

  if (items.length === 0) {
    items.push({
      title: "Keep your momentum",
      body: "Your decisions stayed close to the optimal path. Try a harder economic climate next run to stress-test your plan.",
      urgency: "this-year",
      estimatedImpact: "Builds resilience for real-world volatility",
    });
  }

  return items.slice(0, 3);
}

/**
 * Build a full DebriefReport-shaped object without LLM/RAG.
 */
function buildComparisonFromRounds(rounds) {
  const netWorthByRound = (rounds || []).map((r) => {
    const player = r.metricsAfter?.netWorth ?? 0;
    const optimalChoice = OPTIMAL_CHOICES[r.round];
    const playerMatchesOptimal = normalizeChoice(r.choice) === optimalChoice;
    const optimal = playerMatchesOptimal ? player : Math.round(player * 1.08);
    return { round: r.round, player, optimal, delta: optimal - player };
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

function buildDeterministicDebrief(session) {
  const rounds = session.rounds || [];
  const comparison =
    session.optimalComparison || buildComparisonFromRounds(rounds);

  const netWorthByRound =
    comparison.netWorthByRound ||
    rounds.map((r) => ({
      round: r.round,
      player: r.metricsAfter?.netWorth ?? 0,
      optimal: r.metricsAfter?.netWorth ?? 0,
      delta: 0,
    }));

  const finalPlayer = session.finalMetrics?.netWorth ?? 0;
  const finalOptimal =
    comparison.optimalNetWorth ??
    netWorthByRound.reduce(
      (max, row) => Math.max(max, row.optimal),
      finalPlayer,
    );
  const gap = finalOptimal - finalPlayer;

  const wrongRounds = rounds.filter(
    (r) => normalizeChoice(r.choice) !== OPTIMAL_CHOICES[r.round],
  );
  const patterns = wrongRounds
    .map((r) => BEHAVIORAL_PATTERNS[r.round])
    .filter(Boolean);
  const dominantPattern = mode(patterns) || "present_bias";
  const secondaryPattern =
    patterns.filter((p) => p !== dominantPattern)[0] || null;

  const matchCount = rounds.length - wrongRounds.length;
  const matchRate =
    rounds.length > 0 ? Math.round((matchCount / rounds.length) * 100) : 0;
  const score = computeScore(session, matchRate, gap);
  const label = scoreLabel(score, matchRate, finalPlayer);

  const decisionCosts = wrongRounds.map((r) => {
    const row = netWorthByRound.find((n) => n.round === r.round);
    const delta =
      row?.delta ?? Math.max(0, (row?.optimal ?? 0) - (row?.player ?? 0));
    const choiceLetter = normalizeChoice(r.choice);
    return {
      round: r.round,
      title: r.eventTitle || `Round ${r.round}`,
      choiceMade: choiceLetter,
      optimalChoice: OPTIMAL_CHOICES[r.round],
      immediateImpact: r.selectedOptionTitle || `Option ${choiceLetter}`,
      projectedCost30yr: project30yr(Math.max(500, delta)),
      projectedCost30yrExplained: `Estimated from ~$${Math.max(0, delta).toLocaleString()} path gap at round ${r.round}, compounded at 7% over 30 years.`,
      behavioralPattern: BEHAVIORAL_PATTERNS[r.round] || "present_bias",
    };
  });

  const firstCredit = rounds[0]?.metricsAfter?.creditScore;
  const endCredit = session.finalMetrics?.creditScore ?? 0;

  return {
    meta: { source: "deterministic" },
    headline: {
      verdict: buildVerdict(session, matchRate, gap, finalOptimal),
      subverdict: buildSubverdict(session, dominantPattern),
      score,
      scoreLabel: label,
    },
    netWorthBreakdown: {
      final: finalPlayer,
      optimal: finalOptimal,
      gap,
      gapExplanation:
        wrongRounds.length > 0
          ? `Largest divergence in rounds ${wrongRounds.map((r) => r.round).join(", ")}.`
          : "Your path tracked the heuristic optimal closely across all rounds.",
    },
    decisionCosts,
    behavioralProfile: {
      dominantPattern,
      dominantPatternLabel: PATTERN_LABELS[dominantPattern] || dominantPattern,
      dominantPatternDescription: `This pattern showed up in ${wrongRounds.length} suboptimal decision${wrongRounds.length === 1 ? "" : "s"} across your simulation.`,
      secondaryPattern,
      secondaryPatternLabel: secondaryPattern
        ? PATTERN_LABELS[secondaryPattern]
        : null,
      secondaryPatternDescription: secondaryPattern
        ? "A secondary theme in other missed rounds."
        : null,
      strengths: [
        matchCount > 0
          ? `Matched optimal play in ${matchCount} round${matchCount === 1 ? "" : "s"}.`
          : "Completed the full 10-year simulation.",
        endCredit >= 680
          ? `Credit score finished at ${endCredit}.`
          : `Maintained play through to age 31 with $${finalPlayer.toLocaleString()} net worth.`,
      ].slice(0, 2),
      blindspots: wrongRounds.length
        ? [
            `Missed optimal choices in rounds ${wrongRounds.map((r) => r.round).join(", ")}.`,
          ]
        : ["None significant — strong alignment with the optimal path."],
    },
    compoundOpportunityCost: {
      totalMissedInvestment: Math.max(0, gap),
      projectedValue30yr: project30yr(Math.max(0, gap)),
      projectedValue30yrExplained: `$${Math.max(0, gap).toLocaleString()} gap × (1.07)^30 ≈ $${project30yr(Math.max(0, gap)).toLocaleString()}`,
      retirementGap: Math.max(
        0,
        Math.round(
          (comparison.optimalRetirement ?? 0) -
            (session.finalMetrics?.retirementBalance ?? 0),
        ),
      ),
      retirementGapExplained:
        "Compared to heuristic optimal retirement balance at finish.",
    },
    creditJourney: {
      startScore: firstCredit ?? null,
      endScore: endCredit,
      trajectory:
        !firstCredit && endCredit < 600
          ? "never-started"
          : endCredit > (firstCredit ?? 0)
            ? "built"
            : endCredit < (firstCredit ?? endCredit)
              ? "damaged"
              : "recovered",
      keyMoment: wrongRounds[0]
        ? `Round ${wrongRounds[0].round}: ${wrongRounds[0].eventTitle || "decision"}`
        : "Steady trajectory across rounds",
      realWorldImpact:
        endCredit >= 740
          ? "Strong credit — competitive mortgage rates likely available."
          : endCredit >= 680
            ? "Good credit — small APR improvements available vs top tier."
            : "Building credit could save tens of thousands on a future mortgage.",
    },
    optimalComparison: {
      optimalNetWorth: finalOptimal,
      optimalCredit: comparison.optimalCredit ?? 760,
      optimalRetirement:
        comparison.optimalRetirement ??
        Math.round((session.finalMetrics?.retirementBalance ?? 0) * 1.35),
      keyDifferences: wrongRounds.slice(0, 5).map((r) => {
        const row = netWorthByRound.find((n) => n.round === r.round);
        return {
          round: r.round,
          playerChoice: normalizeChoice(r.choice),
          optimalChoice: OPTIMAL_CHOICES[r.round],
          netWorthDelta: row?.delta ?? 0,
        };
      }),
    },
    netWorthByRound,
    realLifeTakeaways: buildTakeaways(session, wrongRounds, gap),
    shareText: `FinSim — ${session.playerName || "Player"}: $${finalPlayer.toLocaleString()} net worth, ${matchCount}/10 optimal decisions, score ${score}/1000`,
    lessonMistakes: detectMistakePatterns(session),
  };
}

module.exports = {
  buildDeterministicDebrief,
  OPTIMAL_CHOICES,
  BEHAVIORAL_PATTERNS,
  PATTERN_LABELS,
};
