const express = require("express");
const router = express.Router();
const { getPublicShare } = require("../controller/share");

// GET /api/share/:slug — public share card (no auth)
router.get("/:slug", getPublicShare);

module.exports = router;
