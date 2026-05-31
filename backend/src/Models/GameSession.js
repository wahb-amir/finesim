const mongoose = require("mongoose");

/** Snapshot of debrief-oriented metrics at a point in the simulation. */
const metricsSnapshotSchema = new mongoose.Schema(
  {
    netWorth: { type: Number },
    creditScore: { type: Number },
    savingsBalance: { type: Number },
    investmentBalance: { type: Number },
    retirementBalance: { type: Number },
    totalDebt: { type: Number },
    emergencyFundMonths: { type: Number },
    monthlySurplus: { type: Number },
    stressIndex: { type: Number },
    debtToIncome: { type: Number },
    is401kActive: { type: Boolean },
    creditCardDebt: { type: Number },
    salary: { type: Number },
  },
  { _id: false },
);

/**
 * One completed decision round — audit trail for debrief and AI analysis.
 * Captures what the player saw, chose, and how metrics changed.
 */
const roundSchema = new mongoose.Schema(
  {
    round: { type: Number, required: true },
    eventId: { type: String },
    eventTitle: { type: String },
    eventDescription: { type: String },
    choice: { type: String, enum: ["A", "B"], required: true },
    selectedOptionTitle: { type: String },
    selectedOptionDescription: { type: String },
    metricsBefore: { type: metricsSnapshotSchema },
    metricsAfter: { type: metricsSnapshotSchema },
    narrative: {
      headline: { type: String },
      advisorHint: { type: String },
    },
    stateSnapshot: { type: mongoose.Schema.Types.Mixed },
    eventSnapshot: { type: mongoose.Schema.Types.Mixed },
    narrativeSnapshot: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const gameSessionSchema = new mongoose.Schema(
  {
    // ── Ownership & player setup ─────────────────────────────────────────────
    /** Owner of this session; all reads/writes must match authenticated user. */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Display name shown in game UI and debrief. */
    playerName: { type: String },
    /** Career archetype selected at setup (drives scenario modifiers). */
    career: { type: String },
    /** Primary financial goal from onboarding (e.g. build-wealth). */
    goal: { type: String },
    /** Economic climate label chosen at setup (Stable, Volatile, etc.). */
    climateLabel: { type: String },
    /** Annual gross salary at simulation start. */
    startSalary: { type: Number },

    // ── Session lifecycle ────────────────────────────────────────────────────
    /** active = in progress; completed = 10 rounds done; abandoned = exited early. */
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    /** Next round number to play (1–11; 11 means finished). */
    currentRound: { type: Number, default: 1 },

    // ── Replay metadata ──────────────────────────────────────────────────────
    isReplay: { type: Boolean, default: false },
    replayOf: { type: mongoose.Schema.Types.ObjectId, ref: "GameSession", index: true },
    replayFromRound: { type: Number },


    // ── Authoritative simulation (server-only; never sent to clients) ────────
    /** Scenario key derived from goal, climate, and salary. */
    scenarioId: { type: String },
    /** Deterministic PRNG seed for reproducible event rolls. */
    simSeed: { type: Number },
    /** Full internal engine state for replay, resume, and debugging. */
    simState: { type: mongoose.Schema.Types.Mixed, default: null },
    /** Current event card presented to the player (authoritative). */
    currentEvent: { type: mongoose.Schema.Types.Mixed, default: null },
    /** Optional narrative overlay for the current round. */
    currentNarrative: { type: mongoose.Schema.Types.Mixed, default: null },

    // ── Round history (debrief & RAG input) ──────────────────────────────────
    rounds: [roundSchema],

    // ── End-of-game aggregates (server-computed) ─────────────────────────────
    /** Final metric snapshot after round 10; source of truth for debrief. */
    finalMetrics: {
      netWorth: { type: Number },
      creditScore: { type: Number },
      savingsBalance: { type: Number },
      investmentBalance: { type: Number },
      retirementBalance: { type: Number },
      totalDebt: { type: Number },
      totalInterestPaid: { type: Number },
      stressIndex: { type: Number },
      debtToIncome: { type: Number },
      emergencyFundMonths: { type: Number },
      /**
       * Server-computed 0-100 normalized outcome score.
       * Measures decision quality relative to income/time — not influenced by startSalary.
       * Used as the primary leaderboard ranking metric.
       */
      outcomeScore: {
        composite: { type: Number },
        netWorthScore: { type: Number },
        resilienceScore: { type: Number },
        debtHealthScore: { type: Number },
        creditHealthScore: { type: Number },
        stabilityScore: { type: Number },
        trajectoryScore: { type: Number },
      },
    },
    /** Gross annual salary after 10 simulated years. */
    finalSalary: { type: Number },
    /**
     * Benchmark comparison vs heuristic optimal path
     * (populated at completion; refined when debrief is generated).
     */
    optimalComparison: {
      optimalNetWorth: { type: Number },
      optimalCredit: { type: Number },
      optimalRetirement: { type: Number },
      netWorthByRound: [
        {
          round: { type: Number },
          player: { type: Number },
          optimal: { type: Number },
          delta: { type: Number },
        },
      ],
    },

    // ── Debrief & AI outputs (backend-generated only) ─────────────────────────
    /** Full structured debrief report JSON from RAG + LLM pipeline. */
    debriefData: { type: mongoose.Schema.Types.Mixed, default: null },
    /** RAG citation chunks used to build the debrief (audit / transparency). */
    debriefSources: { type: [mongoose.Schema.Types.Mixed], default: [] },
    /** Short LLM-generated summary (e.g. headline verdict). */
    aiSummary: { type: String },
    /** Personalized advice blocks (e.g. realLifeTakeaways from report). */
    aiAdvice: { type: [mongoose.Schema.Types.Mixed], default: [] },
    /** When debrief generation finished (null until generated). */
    debriefGeneratedAt: { type: Date },

    // ── Viral share card (public preview by slug) ─────────────────────────────
    /** Short public id for /share/:slug — no auth required to view card. */
    shareSlug: { type: String, unique: true, sparse: true, index: true },
    /** When the player first generated a share link. */
    shareCreatedAt: { type: Date },

    // ── In-game advisor (server-authoritative, max 4 calls per session) ───────
    /** Number of advisor calls consumed this session (max 4). */
    advisorCallsUsed: { type: Number, default: 0 },
    /** History of advisor responses for this session. */
    advisorMessages: [
      {
        round: { type: Number },
        message: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// List active/completed sessions per user
gameSessionSchema.index({ userId: 1, status: 1 });
// Profile/history sorted by recency
gameSessionSchema.index({ userId: 1, createdAt: -1 });
// Ops: find stale active sessions
gameSessionSchema.index({ status: 1, updatedAt: -1 });
// Secure lookup: session id + owner
gameSessionSchema.index({ _id: 1, userId: 1 });

module.exports = mongoose.model("GameSession", gameSessionSchema);
