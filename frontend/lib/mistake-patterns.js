/**
 * Client-side mirror of backend mistake detection for cached debriefs / dashboard.
 */

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

const ROUND_MISTAKES = {
  1: {
    id: "SKIPPED_EMERGENCY_FUND",
    label: "Invested before building a safety net",
    lesson:
      "Without 3 months of expenses in cash, any shock forces you to sell investments or take expensive debt. Build the buffer first.",
    severity: 72,
  },
  2: {
    id: "AVOIDED_CREDIT_HISTORY",
    label: "Passed on building credit early",
    lesson:
      "A card paid in full each month costs nothing and builds payment history — the foundation for mortgages and better rates later.",
    severity: 68,
  },
  3: {
    id: "LIFESTYLE_INFLATION_CAR",
    label: "Financed lifestyle over reliable transport",
    lesson:
      "New cars depreciate fast; financing amplifies the loss. A reliable used purchase keeps compounding dollars invested.",
    severity: 70,
  },
  4: {
    id: "DEPLETED_SAVINGS_FOR_MEDICAL",
    label: "Paid medical debt from savings instead of 0% plan",
    lesson:
      "A 0% payment plan preserves your emergency fund and opportunity cost. Paying in full trades math for psychological comfort.",
    severity: 78,
  },
  5: {
    id: "DELAYED_INVESTING",
    label: "Kept too much in cash when ready to invest",
    lesson:
      "Once your buffer exists, tax-advantaged index investing historically outpaces HYSA returns over decades.",
    severity: 74,
  },
  6: {
    id: "SKIPPED_401K_MATCH",
    label: "Left employer 401(k) match on the table",
    lesson:
      "The match is a guaranteed 50–100% instant return. Capture it before accelerating low-rate student loan paydown.",
    severity: 88,
  },
  7: {
    id: "PANIC_SOLD_IN_CRASH",
    label: "Moved to cash during a market downturn",
    lesson:
      "Selling locks in losses; recoveries often arrive quickly. Staying invested through volatility is the dominant long-term strategy.",
    severity: 82,
  },
  8: {
    id: "IGNORED_QUARTERLY_TAXES",
    label: "Deferred side-income taxes to April",
    lesson:
      "1099 income needs quarterly estimated payments. Waiting triggers penalties and a painful lump-sum crunch.",
    severity: 76,
  },
  9: {
    id: "UNDER_INSURED",
    label: "Skimped on coverage to save monthly cash",
    lesson:
      "One uninsured incident can erase years of progress. Coverage is risk transfer, not optional spending.",
    severity: 65,
  },
  10: {
    id: "TAXABLE_BEFORE_TAX_ADVANTAGED",
    label: "Prioritized taxable investing over tax-advantaged space",
    lesson:
      "401(k), IRA, and HSA room is use-it-or-lose-it each year. Fill tax-advantaged buckets before taxable brokerage.",
    severity: 71,
  },
};

const CROSS_CUTTING = {
  NO_EMERGENCY_FUND_BEFORE_CRISIS: {
    id: "NO_EMERGENCY_FUND_BEFORE_CRISIS",
    label: "Entered a crisis round without a real buffer",
    lesson:
      "Rounds 4 and 8 are designed stress tests. Under 2 months of expenses saved, shocks become debt spirals instead of inconveniences.",
    severity: 90,
  },
  CARRIED_CC_BALANCE: {
    id: "CARRIED_CC_BALANCE",
    label: "Carried high-interest credit card balance",
    lesson:
      "Revolving balances at 20%+ APR are a guaranteed negative return. Pay avalanche-style before discretionary spending.",
    severity: 86,
  },
  UNDER_NEGOTIATED_SALARY: {
    id: "UNDER_NEGOTIATED_SALARY",
    label: "Under-negotiated when income was on the table",
    lesson:
      "Staying put without a market benchmark often caps raises. Job switches and prepared counters reset your compounding base.",
    severity: 80,
  },
  HIGH_DTI_STRESS: {
    id: "HIGH_DTI_STRESS",
    label: "Let debt payments crowd out flexibility",
    lesson:
      "When debt-to-income stays high, new credit and crisis options shrink. Attack highest APR debt aggressively.",
    severity: 75,
  },
  LOW_RETIREMENT_SAVINGS: {
    id: "LOW_RETIREMENT_SAVINGS",
    label: "Finished the decade light on retirement savings",
    lesson:
      "Money in your 20s has the longest runway. Even small automatic contributions beat catching up in your 40s.",
    severity: 73,
  },
};

function normalizeChoice(choice) {
  if (choice === "left") return "A";
  if (choice === "right") return "B";
  return choice;
}

function isSuboptimal(roundNum, choice) {
  const optimal = OPTIMAL_CHOICES[roundNum];
  if (!optimal) return false;
  return normalizeChoice(choice) !== optimal;
}

function roundByNumber(rounds, n) {
  return rounds.find((r) => r.round === n);
}

function thinEmergencyFund(metrics) {
  if (!metrics) return true;
  const months = metrics.emergencyFundMonths ?? 0;
  const savings = metrics.savingsBalance ?? 0;
  return months < 2 || savings < 1500;
}

function enrichMistake(base, roundRow, extra = {}) {
  return {
    ...base,
    round: roundRow?.round ?? extra.round ?? null,
    eventTitle: roundRow?.eventTitle || extra.eventTitle || null,
    choiceMade: roundRow ? normalizeChoice(roundRow.choice) : extra.choiceMade,
    ...extra,
  };
}

export function detectMistakePatterns(sessionOrRounds) {
  const rounds = Array.isArray(sessionOrRounds)
    ? sessionOrRounds
    : sessionOrRounds?.rounds || [];
  const final = sessionOrRounds?.finalMetrics || {};
  const found = [];

  for (const r of rounds) {
    if (!isSuboptimal(r.round, r.choice)) continue;
    const template = ROUND_MISTAKES[r.round];
    if (template) found.push(enrichMistake(template, r));
  }

  const r4 = roundByNumber(rounds, 4);
  const r8 = roundByNumber(rounds, 8);
  if (
    (r4 && thinEmergencyFund(r4.metricsBefore)) ||
    (r8 && thinEmergencyFund(r8.metricsBefore))
  ) {
    const anchor = r4 && thinEmergencyFund(r4.metricsBefore) ? r4 : r8;
    if (
      !found.some(
        (m) => m.id === CROSS_CUTTING.NO_EMERGENCY_FUND_BEFORE_CRISIS.id,
      )
    ) {
      found.push(
        enrichMistake(CROSS_CUTTING.NO_EMERGENCY_FUND_BEFORE_CRISIS, anchor),
      );
    }
  }

  const maxCc = rounds.reduce(
    (max, r) => Math.max(max, r.metricsAfter?.creditCardDebt ?? 0),
    0,
  );
  const ccGrew = rounds.some((r) => {
    const before = r.metricsBefore?.creditCardDebt ?? 0;
    const after = r.metricsAfter?.creditCardDebt ?? 0;
    return after > before + 200;
  });
  if (maxCc > 400 || ccGrew) {
    const anchor =
      rounds.find((r) => (r.metricsAfter?.creditCardDebt ?? 0) === maxCc) ||
      rounds[rounds.length - 1];
    if (!found.some((m) => m.id === CROSS_CUTTING.CARRIED_CC_BALANCE.id)) {
      found.push(
        enrichMistake(CROSS_CUTTING.CARRIED_CC_BALANCE, anchor, {
          severity:
            maxCc > 2000 ? 92 : CROSS_CUTTING.CARRIED_CC_BALANCE.severity,
        }),
      );
    }
  }

  for (const r of rounds) {
    const title = (r.eventTitle || "").toLowerCase();
    const id = (r.eventId || "").toLowerCase();
    const isCareer =
      id.startsWith("career:") || /offer|salary|job|raise|negotiat/.test(title);
    if (isCareer && normalizeChoice(r.choice) === "B") {
      if (
        !found.some((m) => m.id === CROSS_CUTTING.UNDER_NEGOTIATED_SALARY.id)
      ) {
        found.push(enrichMistake(CROSS_CUTTING.UNDER_NEGOTIATED_SALARY, r));
      }
    }
  }

  if ((final.debtToIncome ?? 0) > 35 || (final.totalDebt ?? 0) > 8000) {
    const anchor =
      rounds.find((r) => (r.metricsAfter?.totalDebt ?? 0) > 5000) ||
      rounds[rounds.length - 1];
    if (!found.some((m) => m.id === CROSS_CUTTING.HIGH_DTI_STRESS.id)) {
      found.push(enrichMistake(CROSS_CUTTING.HIGH_DTI_STRESS, anchor));
    }
  }

  if ((final.retirementBalance ?? 0) < 5000) {
    const r6 = roundByNumber(rounds, 6);
    if (
      !found.some((m) => m.id === "SKIPPED_401K_MATCH") &&
      !found.some((m) => m.id === CROSS_CUTTING.LOW_RETIREMENT_SAVINGS.id)
    ) {
      found.push(
        enrichMistake(
          CROSS_CUTTING.LOW_RETIREMENT_SAVINGS,
          r6 || rounds[rounds.length - 1],
        ),
      );
    }
  }

  const byId = new Map();
  for (const m of found) {
    const prev = byId.get(m.id);
    if (!prev || (m.severity ?? 0) > (prev.severity ?? 0)) {
      byId.set(m.id, m);
    }
  }

  return [...byId.values()]
    .sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0))
    .slice(0, 5);
}

export function lessonMistakesFromDebrief(debrief) {
  if (debrief?.lessonMistakes?.length) return debrief.lessonMistakes;
  if (debrief?.rounds?.length) {
    return detectMistakePatterns({
      rounds: debrief.rounds,
      finalMetrics: debrief.finalMetrics,
    });
  }
  return [];
}
