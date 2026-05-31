"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var engine_exports = {};
__export(engine_exports, {
  applyChoice: () => applyChoice,
  computeOutcomeScore: () => computeOutcomeScore,
  createNewGame: () => createNewGame,
  getVisibleMetrics: () => getVisibleMetrics,
  nextEvent: () => nextEvent,
});
module.exports = __toCommonJS(engine_exports);
var import_math = require("./math");
var import_events = require("./events");
var import_prng = require("./prng");
var import_scenarios = require("./scenarios");
var import_setupProfile = require("./setupProfile");
const DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX = [
  { upTo: 11950, rate: 0.1 },
  { upTo: 48500, rate: 0.12 },
  { upTo: 103500, rate: 0.22 },
  { upTo: 197e3, rate: 0.24 },
  { upTo: 25e4, rate: 0.32 },
  { upTo: 609350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];
function sumDebt(debts) {
  return debts.reduce((s, d) => s + d.balance, 0);
}
function sumDebtPayments(debts) {
  return debts.reduce((s, d) => s + d.minPaymentMonthly, 0);
}
function computeNetWorth(state) {
  const investments = state.portfolio.taxable + state.portfolio.retirement;
  return state.cash + investments - sumDebt(state.debts);
}
function computeDTI(state) {
  const grossMonthly = state.grossIncomeAnnual / 12;
  if (grossMonthly <= 1e-6) return sumDebtPayments(state.debts) > 0 ? 1 : 0;
  return (0, import_math.clamp)(
    sumDebtPayments(state.debts) / grossMonthly,
    0,
    2,
  );
}
function computeNetMonthlyIncome({ grossIncomeAnnual, annualTax }) {
  return (grossIncomeAnnual - annualTax) / 12;
}
function stressFromBuffer({ cash, expenses }) {
  const months = expenses > 0 ? cash / expenses : 6;
  const normalized = (0, import_math.clamp)((6 - months) / 6, 0, 1);
  return normalized * normalized * 65;
}
function stressFromDTI(dti) {
  const x = (0, import_math.clamp)((dti - 0.15) / 0.55, 0, 1);
  return x * 30;
}
function bumpCreditScore({
  creditScore,
  onTime,
  utilization,
  newCreditLine,
  restrictedCredit,
}) {
  let score = creditScore;
  if (onTime) score += 2;
  else score -= 18;
  if (utilization < 0.1) score += 2;
  else if (utilization < 0.3) score -= 1;
  else score -= 6;
  if (newCreditLine) score += restrictedCredit ? 3 : 6;
  return (0, import_math.clamp)(Math.round(score), 300, 850);
}
function computeOutcomeScore(state) {
  const netWorth = computeNetWorth(state);
  const dti = computeDTI(state);
  const bufferMonths =
    state.baseExpensesMonthly > 0 ? state.cash / state.baseExpensesMonthly : 0;
  const scenario = (0, import_scenarios.getScenario)(state.scenarioId);
  const startingIncome = scenario.start.grossSalaryAnnual || 1;
  const incomeGrowth =
    (state.grossIncomeAnnual - startingIncome) / Math.max(startingIncome, 1);
  const monthsElapsed = Math.max(1, state.monthIndex);
  const annualTax = (0, import_math.taxAnnual)({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9),
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const netMonthly = computeNetMonthlyIncome({
    grossIncomeAnnual: state.grossIncomeAnnual,
    annualTax,
  });
  const benchmarkNetWorth = netMonthly * monthsElapsed * 0.1;
  const netWorthScore = (0, import_math.clamp)(
    benchmarkNetWorth > 0 ? (netWorth / benchmarkNetWorth) * 50 : 50,
    0,
    100,
  );
  const resilienceScore = (0, import_math.clamp)(
    (bufferMonths / 6) * 100,
    0,
    100,
  );
  const debtHealthScore = (0, import_math.clamp)((1 - dti / 0.5) * 100, 0, 100);
  const creditHealthScore = (0, import_math.clamp)(
    ((state.creditScore - 300) / 550) * 100,
    0,
    100,
  );
  const stabilityScore = (0, import_math.clamp)(
    (1 - state.stress / 100) * 100,
    0,
    100,
  );
  const trajectoryScore = (0, import_math.clamp)(
    (incomeGrowth / 0.3) * 100,
    0,
    100,
  );
  const composite = (0, import_math.round2)(
    netWorthScore * 0.2 +
      resilienceScore * 0.2 +
      debtHealthScore * 0.15 +
      creditHealthScore * 0.15 +
      stabilityScore * 0.15 +
      trajectoryScore * 0.15,
  );
  return {
    netWorthScore: (0, import_math.round2)(netWorthScore),
    resilienceScore: (0, import_math.round2)(resilienceScore),
    debtHealthScore: (0, import_math.round2)(debtHealthScore),
    creditHealthScore: (0, import_math.round2)(creditHealthScore),
    stabilityScore: (0, import_math.round2)(stabilityScore),
    trajectoryScore: (0, import_math.round2)(trajectoryScore),
    composite,
  };
}
function socraticAdvisorQuestion(state, event) {
  const dti = computeDTI(state);
  const bufferMonths =
    state.baseExpensesMonthly > 0 ? state.cash / state.baseExpensesMonthly : 6;
  if (event.crisis && state.cash < state.baseExpensesMonthly * 1.5) {
    return "You chose short-term relief. What happens if a second shock lands in the next 60 days?";
  }
  if (dti > 0.4) {
    return "Your DTI is high enough to block new credit. What would you have to give up to pay down one debt completely?";
  }
  if (
    state.portfolio.taxable + state.portfolio.retirement < 500 &&
    state.monthIndex > 6
  ) {
    return "Six months in with no investments started. What single monthly expense could you automate into an index fund instead?";
  }
  if (bufferMonths < 1) {
    return "Your cash buffer is under one month. If you lost income today, what would you cut first?";
  }
  if (state.burnout > 70) {
    return "Burnout is high. Are the decisions you are making right now ones you would make at 50% of this stress level?";
  }
  return "Ask: does this choice reduce fragility, or increase optionality? The best move is usually one of those two things.";
}
function advisorForState(state, event) {
  const dti = computeDTI(state);
  if (event.crisis && state.cash < state.baseExpensesMonthly * 1.2) {
    return "In a crisis, cash runway is oxygen. Protect your next 90 days first.";
  }
  if (dti > 0.4)
    return "High DTI is a gatekeeper. Attack APR and monthly obligations before chasing upside.";
  if (
    state.portfolio.taxable + state.portfolio.retirement < 500 &&
    state.monthIndex > 6
  ) {
    return "Consistency beats intensity. Automate a small investment you can maintain through stress.";
  }
  return "Ask: does this choice reduce fragility, or increase optionality?";
}
function fireDelayedEffects({
  state,
  nextDebts,
  cash,
  creditScore,
  stress,
  grossIncomeAnnual,
  baseExpensesMonthly,
}) {
  const due = state.pendingEffects.filter(
    (e) => e.triggerMonth <= state.monthIndex,
  );
  const firedLabels = [];
  let c = cash,
    cs = creditScore,
    st = stress,
    gi = grossIncomeAnnual,
    be = baseExpensesMonthly;
  const debts = [...nextDebts];
  for (const eff of due) {
    firedLabels.push(eff.label);
    if (eff.cashDelta) c = Math.max(0, c + eff.cashDelta);
    if (eff.stressDelta)
      st = (0, import_math.clamp)(st + eff.stressDelta, 0, 100);
    if (eff.creditDelta)
      cs = (0, import_math.clamp)(cs + eff.creditDelta, 300, 850);
    if (eff.expenseMultiplier)
      be = (0, import_math.round2)(be * eff.expenseMultiplier);
    if (eff.incomeMultiplier != null)
      gi = (0, import_math.round2)(gi * eff.incomeMultiplier);
    if (eff.debtAdd) {
      debts.push({
        id: `delayed:${state.monthIndex}:${eff.sourceEventId}`,
        kind: eff.debtAdd.kind,
        balance: eff.debtAdd.balance,
        apr: eff.debtAdd.apr,
        minPaymentMonthly:
          eff.debtAdd.kind === "medical"
            ? 50
            : (0, import_math.round2)(Math.max(35, eff.debtAdd.balance * 0.03)),
      });
    }
  }
  return {
    cash: c,
    creditScore: cs,
    stress: st,
    grossIncomeAnnual: gi,
    baseExpensesMonthly: be,
    debts,
    firedLabels,
  };
}
function createNewGame({
  scenarioId,
  seed,
  startSalary,
  climateLabel,
  career,
}) {
  const scenario = (0, import_scenarios.getScenario)(scenarioId);
  const profile = (0, import_setupProfile.buildSetupProfile)(scenario, {
    startSalary,
    climateLabel,
    career,
  });
  const { modifiers, start } = profile;
  const actualSeed =
    (seed ?? (0, import_prng.hashSeed)(`${scenarioId}:seedless`)) >>> 0;
  const rng = (0, import_prng.createRng)(actualSeed);
  const macro = (0, import_events.rollMacro)({
    rng,
    baseInflationAnnual: modifiers.inflationAnnual,
    baseRecessionProbAnnual: modifiers.recessionProbAnnual,
    stressIndex: 25,
  });
  const debts = [];
  if (start.debt.kind !== "none" && start.debt.balance > 0) {
    const kindMap = start.debt.kind === "student" ? "student" : "credit-card";
    const term = start.debt.termMonths;
    const min =
      kindMap === "student" && term
        ? (0, import_math.paymentAmortized)({
            principal: start.debt.balance,
            annualRate: start.debt.apr,
            termMonths: term,
          })
        : Math.max(35, start.debt.balance * 0.03);
    debts.push({
      id: `d0`,
      kind: kindMap,
      balance: start.debt.balance,
      apr: start.debt.apr,
      minPaymentMonthly: (0, import_math.round2)(min),
      termMonths: term,
    });
  }
  const state = {
    seed: actualSeed,
    scenarioId,
    step: "month",
    monthIndex: 0,
    ageYears: start.ageYears,
    cash: start.cash,
    grossIncomeAnnual: start.grossSalaryAnnual,
    baseExpensesMonthly:
      start.baseExpensesMonthly +
      modifiers.childcareMonthly +
      modifiers.remittanceMonthly,
    creditScore: start.creditScore,
    burnout: (0, import_math.clamp)(
      15 + modifiers.burnoutDriftMonthly * 2,
      0,
      100,
    ),
    stress: 20,
    debts,
    portfolio: { ...start.investments },
    macro,
    pendingEffects: [],
    history: [],
    setupModifiers: modifiers,
  };
  return nextEvent({ state });
}
function nextEvent({ state }) {
  const rng = (0, import_prng.createRng)(
    (state.seed + state.monthIndex * 2654435761) >>> 0,
  );
  const scenario = (0, import_scenarios.getScenario)(state.scenarioId);
  const modifiers = state.setupModifiers || scenario.modifiers;
  const dti = computeDTI(state);
  const event = (0, import_events.generateEvent)({
    rng,
    monthIndex: state.monthIndex,
    cash: state.cash,
    creditScore: state.creditScore,
    dti,
    stress: state.stress,
    burnout: state.burnout,
    ageYears: state.ageYears,
    grossIncomeAnnual: state.grossIncomeAnnual,
    pendingDelayedEffects: state.pendingEffects,
    scenarioFlags: {
      restrictedCredit: modifiers.restrictedCredit,
      remittanceMonthly: modifiers.remittanceMonthly,
      childcareMonthly: modifiers.childcareMonthly,
      healthcareRiskAnnual: modifiers.healthcareRiskAnnual,
      // fix #2
      layoffProbAnnual: modifiers.layoffProbAnnual,
      // fix #2
      burnoutDriftMonthly: modifiers.burnoutDriftMonthly,
      hasEquity: scenario.start.investments.equity > 0,
      // fix #2
    },
    macro: state.macro,
  });
  const metrics = getVisibleMetrics(state);
  return {
    state: { ...state, lastEvent: event },
    event,
    metrics,
    narrative: {
      headline: event.crisis ? "Pressure spikes." : "A lever appears.",
      advisorHint: advisorForState(state, event),
    },
  };
}
function applyChoice({ state, choice }) {
  const scenario = (0, import_scenarios.getScenario)(state.scenarioId);
  const modifiers = state.setupModifiers || scenario.modifiers;
  const rng = (0, import_prng.createRng)(
    (state.seed ^ ((state.monthIndex + 1) * 2246822519)) >>> 0,
  );
  const annualTax = (0, import_math.taxAnnual)({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9),
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const netIncomeMonthly = computeNetMonthlyIncome({
    grossIncomeAnnual: state.grossIncomeAnnual,
    annualTax,
  });
  const nextMacro = (0, import_events.rollMacro)({
    rng,
    baseInflationAnnual: modifiers.inflationAnnual,
    baseRecessionProbAnnual: modifiers.recessionProbAnnual,
    stressIndex: state.stress,
  });
  const inflationMonthly = Math.pow(1 + nextMacro.inflationAnnual, 1 / 12) - 1;
  let expenses = state.baseExpensesMonthly * (1 + inflationMonthly);
  let investMonthly = 0;
  let extraDebtPayment = 0;
  let newCreditLine = false;
  let utilizationTarget = 0.08;
  const last = state.lastEvent;
  if (last?.tag === "budget") {
    if (choice === "left") {
      expenses *= 0.995;
    } else {
      expenses *= 1.03;
      utilizationTarget = 0.25;
    }
  }
  if (last?.tag === "credit") {
    if (choice === "left") {
      newCreditLine = true;
      utilizationTarget = 0.06;
    } else {
      utilizationTarget = 0;
    }
  }
  if (last?.tag === "investing") {
    if (choice === "left") {
      investMonthly = Math.max(0, (netIncomeMonthly - expenses) * 0.35);
    }
  }
  if (last?.tag === "retirement") {
    if (choice === "left") {
      investMonthly = Math.max(0, (netIncomeMonthly - expenses) * 0.06);
      expenses -= (0, import_math.round2)(investMonthly * 0.22);
    }
  }
  if (last?.tag === "behavioral" && choice === "right") {
    expenses *= 1.04;
  }
  if (last?.tag === "tax" && choice === "left") {
    expenses -= 18;
  }
  if (last?.id?.startsWith("dti:")) {
    if (choice === "left") {
      extraDebtPayment = Math.max(0, (netIncomeMonthly - expenses) * 0.5);
    }
  }
  if (last?.tag === "career" && choice === "left") {
    expenses *= 1.01;
  }
  if (last?.tag === "insurance" && choice === "left") {
    expenses += 18;
  }
  const choiceEffects =
    choice === "left" ? last?.leftEffects : last?.rightEffects;
  const newPendingEffects = [
    ...state.pendingEffects,
    ...(choiceEffects ?? []).map((eff) => ({
      ...eff,
      triggerMonth: state.monthIndex + eff.triggerMonthOffset,
      sourceEventId: last?.id ?? "unknown",
      choiceId: choice,
    })),
  ];
  let cash = state.cash + netIncomeMonthly;
  cash -= expenses;
  const restrictedCredit = modifiers.restrictedCredit;
  if (cash < 0) {
    const spill = -cash;
    cash = 0;
    const existingCC = state.debts.find((d) => d.kind === "credit-card");
    if (existingCC && !restrictedCredit) {
      existingCC.balance += spill;
      existingCC.apr = Math.max(existingCC.apr, 0.219);
      existingCC.minPaymentMonthly = (0, import_math.round2)(
        Math.max(35, existingCC.balance * 0.03),
      );
    } else {
      state.debts.push({
        id: `spill:${state.monthIndex}`,
        kind: restrictedCredit ? "medical" : "credit-card",
        balance: spill,
        apr: restrictedCredit ? 0 : 0.249,
        minPaymentMonthly: restrictedCredit
          ? 50
          : (0, import_math.round2)(Math.max(35, spill * 0.03)),
      });
    }
  }
  let onTime = true;
  const nextDebts = state.debts
    .map((d) => ({ ...d }))
    .map((d) => {
      if (d.balance <= 0) return d;
      const pay = Math.min(d.minPaymentMonthly, cash);
      if (pay + 1e-6 < d.minPaymentMonthly) onTime = false;
      cash -= pay;
      const stepped = (0, import_math.stepAmortization)({
        balance: d.balance,
        annualRate: d.apr,
        payment: pay,
      });
      return {
        ...d,
        balance: stepped.nextBalance,
        minPaymentMonthly:
          d.termMonths && d.kind !== "credit-card"
            ? (0, import_math.round2)(
                (0, import_math.paymentAmortized)({
                  principal: stepped.nextBalance,
                  annualRate: d.apr,
                  termMonths: Math.max(1, d.termMonths - 1),
                }),
              )
            : (0, import_math.round2)(Math.max(35, stepped.nextBalance * 0.03)),
        termMonths: d.termMonths ? Math.max(0, d.termMonths - 1) : void 0,
      };
    })
    .filter((d) => d.balance > 0.01);
  if (extraDebtPayment > 0 && cash > 0 && nextDebts.length > 0) {
    let extra = Math.min(extraDebtPayment, cash);
    cash -= extra;
    const sorted = [...nextDebts].sort((a, b) => b.apr - a.apr);
    for (const d of sorted) {
      if (extra <= 0) break;
      const pay = Math.min(extra, d.balance);
      d.balance -= pay;
      extra -= pay;
    }
  }
  const marketMonthly = Math.pow(1 + nextMacro.marketReturnAnnual, 1 / 12) - 1;
  const invest = Math.min(investMonthly, Math.max(0, cash));
  cash -= invest;
  const taxable = (state.portfolio.taxable + invest) * (1 + marketMonthly);
  const retirement = state.portfolio.retirement * (1 + marketMonthly);
  const revolving = nextDebts
    .filter((d) => d.kind === "credit-card")
    .reduce((s, d) => s + d.balance, 0);
  const pseudoLimit = restrictedCredit ? 1500 : 6e3;
  const utilization = pseudoLimit > 0 ? revolving / pseudoLimit : 0;
  let creditScore = bumpCreditScore({
    creditScore: state.creditScore,
    onTime,
    utilization: Math.max(utilizationTarget, utilization),
    newCreditLine,
    restrictedCredit,
  });
  const nextMonthIndex = state.monthIndex + 1;
  const effResult = fireDelayedEffects({
    state: {
      ...state,
      monthIndex: nextMonthIndex,
      pendingEffects: newPendingEffects,
    },
    nextDebts,
    cash,
    creditScore,
    stress: state.stress,
    grossIncomeAnnual: state.grossIncomeAnnual,
    baseExpensesMonthly: expenses,
  });
  cash = effResult.cash;
  creditScore = effResult.creditScore;
  let grossIncomeAnnual = effResult.grossIncomeAnnual;
  expenses = effResult.baseExpensesMonthly;
  const remainingPendingEffects = newPendingEffects.filter(
    (e) => e.triggerMonth >= nextMonthIndex,
  );
  const dtiNext = (() => {
    const grossMonthly = grossIncomeAnnual / 12;
    const debtPay = sumDebtPayments(effResult.debts);
    return grossMonthly <= 1e-6
      ? debtPay > 0
        ? 1
        : 0
      : (0, import_math.clamp)(debtPay / grossMonthly, 0, 2);
  })();
  const bufferStress = stressFromBuffer({ cash, expenses });
  const dtiStress = stressFromDTI(dtiNext);
  const macroStress = (0, import_math.clamp)(
    nextMacro.recessionProbAnnual * 35 + nextMacro.inflationAnnual * 120,
    0,
    35,
  );
  const burnout = (0, import_math.clamp)(
    state.burnout +
      modifiers.burnoutDriftMonthly +
      (choice === "right" ? 0.3 : -0.1),
    0,
    100,
  );
  const stressBase =
    5 + bufferStress + dtiStress + macroStress + burnout * 0.15;
  const stress = (0, import_math.clamp)(
    (0, import_math.round2)(effResult.stress * 0.25 + stressBase * 0.75),
    0,
    100,
  );
  const wageMonthly = Math.pow(1 + modifiers.wageGrowthAnnual, 1 / 12) - 1;
  grossIncomeAnnual = grossIncomeAnnual * (1 + wageMonthly);
  if (
    nextMacro.recessionProbAnnual > 0.25 &&
    rng.next() < modifiers.layoffProbAnnual / 12
  ) {
    grossIncomeAnnual = Math.max(0, grossIncomeAnnual * 0.5);
  }
  const nextState = {
    ...state,
    monthIndex: state.monthIndex + 1,
    ageYears: state.ageYears + 1 / 12,
    cash: (0, import_math.round2)(cash),
    baseExpensesMonthly: (0, import_math.round2)(expenses),
    grossIncomeAnnual: (0, import_math.round2)(grossIncomeAnnual),
    creditScore,
    burnout: (0, import_math.round2)(burnout),
    stress: (0, import_math.round2)(stress),
    debts: effResult.debts
      .map((d) => ({
        ...d,
        balance: (0, import_math.round2)(d.balance),
        minPaymentMonthly: (0, import_math.round2)(d.minPaymentMonthly),
      }))
      .filter((d) => d.balance > 0.01),
    portfolio: {
      ...state.portfolio,
      taxable: (0, import_math.round2)(taxable),
      retirement: (0, import_math.round2)(retirement),
    },
    macro: nextMacro,
    lastChoice: choice,
    pendingEffects: remainingPendingEffects,
    history: [
      ...state.history,
      {
        monthIndex: state.monthIndex,
        cash: (0, import_math.round2)(state.cash),
        netWorth: (0, import_math.round2)(computeNetWorth(state)),
        creditScore: state.creditScore,
        stress: (0, import_math.round2)(state.stress),
        inflationAnnual: (0, import_math.round2)(state.macro.inflationAnnual),
        recessionProbAnnual: (0, import_math.round2)(
          state.macro.recessionProbAnnual,
        ),
        grossIncomeAnnual: (0, import_math.round2)(state.grossIncomeAnnual),
      },
    ],
  };
  const debrief = last
    ? {
        principle: last.debrief.principle,
        whyItHappened: last.debrief.whyItHappened,
        counterfactual: last.debrief.counterfactual,
        ruleOfThumb: last.debrief.ruleOfThumb,
        advisorQuestion: socraticAdvisorQuestion(state, last),
        firedEffects: effResult.firedLabels,
      }
    : {
        principle: "",
        whyItHappened: "",
        counterfactual: "",
        ruleOfThumb: "",
        advisorQuestion: "",
        firedEffects: [],
      };
  const result = nextEvent({ state: nextState });
  return { ...result, debrief };
}
function getVisibleMetrics(state) {
  const annualTax = (0, import_math.taxAnnual)({
    taxableIncome: Math.max(0, state.grossIncomeAnnual * 0.9),
    brackets: DEFAULT_TAX_BRACKETS_US_SINGLE_2026_APPROX,
  });
  const monthlyIncomeNet = computeNetMonthlyIncome({
    grossIncomeAnnual: state.grossIncomeAnnual,
    annualTax,
  });
  const investments = state.portfolio.taxable + state.portfolio.retirement;
  const totalDebt = sumDebt(state.debts);
  const dti = computeDTI(state);
  const bufferMonths =
    state.baseExpensesMonthly > 0 ? state.cash / state.baseExpensesMonthly : 0;
  return {
    netWorth: (0, import_math.round2)(computeNetWorth(state)),
    cash: (0, import_math.round2)(state.cash),
    stress: (0, import_math.round2)(state.stress),
    burnout: (0, import_math.round2)(state.burnout),
    creditScore: state.creditScore,
    dti: (0, import_math.round2)(dti),
    monthlyIncomeNet: (0, import_math.round2)(monthlyIncomeNet),
    monthlyExpenses: (0, import_math.round2)(
      state.baseExpensesMonthly + sumDebtPayments(state.debts),
    ),
    totalDebt: (0, import_math.round2)(totalDebt),
    investments: (0, import_math.round2)(investments),
    inflationAnnual: (0, import_math.round2)(state.macro.inflationAnnual),
    recessionProbAnnual: (0, import_math.round2)(
      state.macro.recessionProbAnnual,
    ),
    bufferMonths: (0, import_math.round2)(bufferMonths),
    outcomeScore: computeOutcomeScore(state),
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    applyChoice,
    computeOutcomeScore,
    createNewGame,
    getVisibleMetrics,
    nextEvent,
  });
