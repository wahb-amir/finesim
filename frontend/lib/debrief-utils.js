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

/** Build chart rows from a session document (dashboard preview). */
export function netWorthProgressionFromSession(session) {
  const rows = session?.optimalComparison?.netWorthByRound;
  if (rows?.length) {
    return rows.map((row) => ({
      round: row.round,
      player: row.player,
      optimal: row.optimal ?? row.player,
      delta: (row.optimal ?? row.player) - row.player,
    }));
  }

  const rounds = session?.rounds || [];
  return rounds.map((r) => {
    const player = r.metricsAfter?.netWorth ?? 0;
    const optimalLetter = OPTIMAL_CHOICES[r.round];
    const match = normalizeChoice(r.choice) === optimalLetter;
    const optimal = match ? player : Math.round(player * 1.08);
    return { round: r.round, player, optimal, delta: optimal - player };
  });
}

export function optimalPathFromSession(session) {
  const rounds = session?.rounds || [];
  return rounds.map((r) => {
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
      eventTitle: r.eventTitle,
    };
  });
}

export function debriefSummaryFromSession(session) {
  const path = optimalPathFromSession(session);
  const matches = path.filter((x) => x.match).length;
  const progression = netWorthProgressionFromSession(session);
  const finalPlayer = session?.finalMetrics?.netWorth ?? 0;
  const finalOptimal =
    session?.optimalComparison?.optimalNetWorth ??
    progression.reduce((max, row) => Math.max(max, row.optimal), finalPlayer);
  const gap = finalOptimal - finalPlayer;

  return {
    matchRate: path.length ? Math.round((matches / path.length) * 100) : 0,
    matches,
    totalRounds: path.length,
    finalPlayer,
    finalOptimal,
    gap,
    score: session?.debriefData?.headline?.score,
    scoreLabel:
      session?.debriefData?.headline?.scoreLabel ??
      session?.debriefData?.scoreLabel,
    verdict: session?.aiSummary || session?.debriefData?.headline?.verdict,
    source: session?.debriefData?.meta?.source || (session?.debriefGeneratedAt ? "ai" : null),
  };
}
