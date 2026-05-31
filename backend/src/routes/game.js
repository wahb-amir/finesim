const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  createSession,
  submitRound,
  abandonSession,
  getSessionDebrief,
  getSession,
  listSessions,
  getLeaderboard,
  userData,
} = require("../controller/game");
const { requestAdvisor } = require("../controller/advisor");
const { createSessionShare } = require("../controller/share");

// POST /api/game/session          — start a new game session
router.post("/session", authMiddleware, createSession);

// POST /api/game/session/round    — submit a round choice
router.post("/session/round", authMiddleware, submitRound);

// POST /api/game/session/:id/abandon — exit game; preserves session data
router.post("/session/:id/abandon", authMiddleware, abandonSession);

// POST /api/game/session/:id/advisor — on-demand Socratic advisor (max 4/game)
router.post("/session/:id/advisor", authMiddleware, requestAdvisor);

// GET  /api/game/session/:id/debrief — lazy-generate + return debrief payload
router.get("/session/:id/debrief", authMiddleware, getSessionDebrief);

// POST /api/game/session/:id/share — create public share card + link
router.post("/session/:id/share", authMiddleware, createSessionShare);

// GET  /api/game/session/:id      — get session by id
router.get("/session/:id", authMiddleware, getSession);

// GET  /api/game/sessions         — list user's past sessions
router.get("/sessions", authMiddleware, listSessions);

// GET  /api/game/leaderboard      — top players by best completed run
router.get("/leaderboard", authMiddleware, getLeaderboard);

router.get("/sessions/userData", authMiddleware, userData);

module.exports = router;
