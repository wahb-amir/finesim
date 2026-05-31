/**
 * src/ai/debrief.js
 *
 * Final debrief report generator. Runs after round 10.
 * Multi-query RAG → merged context → Groq JSON output → DebriefReport schema.
 */

const Groq = require("groq-sdk");
const { retrieveMulti, formatChunksForPrompt } = require("../rag/retriever");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Multi-query builder ───────────────────────────────────────────────────────

function buildDebriefQueries(session) {
  const m = session.finalMetrics;
  const rounds = session.rounds;

  const firstScore = rounds[0]?.metricsAfter?.creditScore;
  const totalInvested = m.investmentBalance + m.retirementBalance;
  const retirementStartRound =
    rounds.findIndex((r) => r.metricsAfter?.retirementBalance > 0) + 1;

  // Dominant behavioral pattern from wrong choices
  const wrongRounds = rounds.filter(
    (r) => normalizeChoice(r.choice) !== getOptimalChoice(r.round),
  );
  const patterns = wrongRounds
    .map((r) => getBehavioralPattern(r.round))
    .filter(Boolean);
  const dominantPattern = mode(patterns) || "present_bias";

  const midNetWorth = rounds[4]?.metricsAfter?.netWorth ?? 0;

  return [
    {
      query: `credit score journey from ${firstScore ?? "no score"} to ${m.creditScore} over 10 years`,
      opts: { topK: 4, topic: "credit_scores" },
    },
    {
      query: `compound growth investing $${totalInvested} over 10 years retirement`,
      opts: { topK: 4, topic: "investing" },
    },
    {
      query: `total interest paid on debt ${m.totalInterestPaid} debt payoff cost`,
      opts: { topK: 3, topic: "debt" },
    },
    {
      query: `retirement savings gap started round ${retirementStartRound} balance ${m.retirementBalance}`,
      opts: { topK: 3, topic: "investing" },
    },
    {
      query: `behavioral patterns ${dominantPattern} financial decisions`,
      opts: { topK: 4, topic: "behavioral_finance" },
    },
    {
      query: `net worth trajectory midpoint ${midNetWorth} final ${m.netWorth}`,
      opts: { topK: 3 },
    },
  ];
}

// ── Optimal choice map (mirrors finsim-internal.json) ────────────────────────

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

function normalizeChoice(choice) {
  if (choice === "left") return "A";
  if (choice === "right") return "B";
  return choice;
}

function getOptimalChoice(round) {
  return OPTIMAL_CHOICES[round];
}
function getBehavioralPattern(round) {
  return BEHAVIORAL_PATTERNS[round];
}
function mode(arr) {
  if (!arr.length) return null;
  const freq = arr.reduce((a, v) => ({ ...a, [v]: (a[v] || 0) + 1 }), {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildDebriefPrompt(session, chunks) {
  const roundHistory = session.rounds.map((r) => ({
    round: r.round,
    eventTitle: r.eventTitle || r.title,
    eventDescription: r.eventDescription,
    choice: r.choice,
    selectedOptionTitle: r.selectedOptionTitle,
    selectedOptionDescription: r.selectedOptionDescription,
    optimal: getOptimalChoice(r.round),
    isOptimal: normalizeChoice(r.choice) === getOptimalChoice(r.round),
    metricsBefore: r.metricsBefore,
    metricsAfter: r.metricsAfter,
    narrative: r.narrative,
  }));

  return `You are generating a FinSim debrief report. Output ONLY valid JSON matching the schema below.
No preamble. No explanation. No markdown fences. Pure JSON only.

CALCULATION RULES:
1. Every number must be derivable from the player data provided.
2. 30-year projections: A = P * (1.07)^30
3. Mortgage credit score cost: 1.5% APR difference on $300,000 over 30 years ≈ $48,000
4. Behavioral patterns: analyze ALL 10 choices — identify the pattern that appears most across wrong decisions.
5. Verdict: honest, specific, data-grounded. Never generic.

REQUIRED JSON SCHEMA:
{
  "headline": {
    "verdict": "1 honest sentence with real numbers",
    "subverdict": "1 sentence expanding on verdict",
    "score": <0-1000 number>,
    "scoreLabel": "<Cautious Builder|Debt Survivor|Wealth Architect|Risk Avoider|Late Starter>"
  },
  "netWorthBreakdown": {
    "final": <number>,
    "optimal": <number>,
    "gap": <number>,
    "gapExplanation": "<which specific rounds caused the gap>"
  },
  "decisionCosts": [
    // ONLY include rounds where suboptimal choice was made
    {
      "round": <number>,
      "title": "<round title>",
      "choiceMade": "<A or B>",
      "optimalChoice": "<A or B>",
      "immediateImpact": "<e.g. $415/month added to expenses>",
      "projectedCost30yr": <number — compound math at 7%>,
      "projectedCost30yrExplained": "<show the math clearly>",
      "behavioralPattern": "<loss_aversion|present_bias|lifestyle_inflation|mental_accounting|availability_heuristic|sunk_cost>"
    }
  ],
  "behavioralProfile": {
    "dominantPattern": "<pattern key>",
    "dominantPatternLabel": "<human label>",
    "dominantPatternDescription": "<2-3 sentences on how it appeared in this player's specific choices>",
    "secondaryPattern": "<pattern key or null>",
    "secondaryPatternLabel": "<label or null>",
    "secondaryPatternDescription": "<description or null>",
    "strengths": ["<1-3 things they genuinely did well with data>"],
    "blindspots": ["<1-3 things the data revealed they consistently avoided>"]
  },
  "compoundOpportunityCost": {
    "totalMissedInvestment": <number>,
    "projectedValue30yr": <number at 7%>,
    "projectedValue30yrExplained": "<show the math>",
    "retirementGap": <number>,
    "retirementGapExplained": "<explanation>"
  },
  "creditJourney": {
    "startScore": <number or null>,
    "endScore": <number>,
    "trajectory": "<built|damaged|never-started|recovered>",
    "keyMoment": "<the single round that most affected their score>",
    "realWorldImpact": "<mortgage cost difference based on final score vs 760+>"
  },
  "optimalComparison": {
    "optimalNetWorth": <number>,
    "optimalCredit": <number>,
    "optimalRetirement": <number>,
    "keyDifferences": [
      {
        "round": <number>,
        "playerChoice": "<A or B>",
        "optimalChoice": "<A or B>",
        "netWorthDelta": <number>
      }
    ]
  },
  "netWorthByRound": [
    { "round": <1-10>, "player": <number>, "optimal": <number>, "delta": <number> }
  ],
  "realLifeTakeaways": [
    {
      "title": "<short sharp action>",
      "body": "<2-3 specific sentences — real apps, real numbers, real actions>",
      "urgency": "<immediate|this-month|this-year>",
      "estimatedImpact": "<dollar amount or time saved>"
    }
  ],
  "shareText": "<1 sentence for social sharing with their actual numbers>"
}

[PLAYER DATA]
Name: ${session.playerName || "Player"}
Career: ${session.career} | Start salary: $${session.startSalary?.toLocaleString()} | Final salary: $${session.finalSalary?.toLocaleString()}
Goal: ${session.goal}
Economic climate: ${session.climateLabel}

[ROUND HISTORY]
${JSON.stringify(roundHistory, null, 2)}

[FINAL METRICS]
${JSON.stringify(session.finalMetrics, null, 2)}

[OPTIMAL COMPARISON]
${JSON.stringify(session.optimalComparison, null, 2)}

[RETRIEVED FINANCIAL CONTEXT]
${formatChunksForPrompt(chunks)}

Output the JSON now:`;
}

// ── Main export ───────────────────────────────────────────────────────────────

async function generateDebriefReport(session) {
  const { detectMistakePatterns } = require("../services/debrief/mistakes");
  const lessonMistakes = detectMistakePatterns(session);

  const queries = buildDebriefQueries(session);
  const chunks = await retrieveMulti(queries, 8);
  const prompt = buildDebriefPrompt(session, chunks);

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4000,
    temperature: 0.3,
    stream: false,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are a financial analysis engine. Output only valid JSON.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = response.choices[0]?.message?.content || "";
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let report;
  try {
    report = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Debrief JSON parse failed: ${err.message}\nRaw: ${cleaned.slice(0, 200)}`,
    );
  }

  report.meta = { ...(report.meta || {}), source: "ai" };
  report.lessonMistakes = lessonMistakes;

  const sources = (chunks || []).map((c) => ({
    id: c.id,
    source: c.source,
    topic: c.topic,
    subtopic: c.subtopic,
    similarity: c.similarity,
    excerpt: typeof c.content === "string" ? c.content.slice(0, 400) : "",
  }));

  return { report, sources };
}

module.exports = { generateDebriefReport, buildDebriefQueries };
