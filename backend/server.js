require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { connectDB } = require("./src/utils/dbConnection");

// ── Route imports ─────────────────────────────────────────────────────────────
const Setup = require("./src/routes/setup");
const Auth = require("./src/routes/auth");
const AI = require("./src/routes/ai");
const Game = require("./src/routes/game");
const Share = require("./src/routes/share");
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// ── Rate limiters ─────────────────────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });

// Tighter limit for AI endpoints — Groq is fast but debrief is expensive
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 advisor calls/min per IP
  message: { message: "Too many AI requests, slow down" },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", limiter, Auth);
app.use("/api", limiter, Setup);
app.use("/api/ai", aiLimiter, AI);
app.use("/api/game", limiter, Game);
app.use("/api/share", limiter, Share);

app.use("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[GlobalError]", err.message);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`🚀 FinSim server running on port ${PORT}`),
  );
});

module.exports = app;
