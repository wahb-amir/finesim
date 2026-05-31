/**
 * Share card API — create links (auth) and public card preview (no auth).
 */

const GameSession = require("../Models/GameSession");
const { generateAndPersistDebrief } = require("../services/debrief");
const {
  buildShareCard,
  ensureShareSlug,
  shareUrlForSlug,
} = require("../services/share");

const createSessionShare = async (req, res) => {
  try {
    const session = await GameSession.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.status !== "completed") {
      return res.status(400).json({
        message: "Only completed runs can be shared",
        status: session.status,
      });
    }

    if (!session.debriefData) {
      await generateAndPersistDebrief(session);
    }

    const slug = await ensureShareSlug(session);
    const card = buildShareCard(session);
    const url = shareUrlForSlug(slug);

    return res.status(200).json({
      success: true,
      slug,
      url,
      card,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("[createSessionShare]", err.message);
    res.status(status).json({
      message: status === 400 ? err.message : "Failed to create share link",
      error: err.message,
    });
  }
};

const getPublicShare = async (req, res) => {
  try {
    const slug = String(req.params.slug || "").toLowerCase();
    if (!slug || slug.length > 32) {
      return res.status(400).json({ message: "Invalid share link" });
    }

    const session = await GameSession.findOne({
      shareSlug: slug,
      status: "completed",
    }).select(
      "playerName career goal climateLabel scenarioId finalMetrics optimalComparison rounds debriefData aiSummary shareSlug shareCreatedAt debriefGeneratedAt updatedAt",
    );

    if (!session) {
      return res.status(404).json({ message: "Share card not found" });
    }

    const card = buildShareCard(session);

    return res.status(200).json({
      success: true,
      card,
      url: shareUrlForSlug(slug),
    });
  } catch (err) {
    console.error("[getPublicShare]", err.message);
    res.status(500).json({
      message: "Failed to load share card",
      error: err.message,
    });
  }
};

module.exports = { createSessionShare, getPublicShare };
