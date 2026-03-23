const express = require("express");
const { getAnalyticsHandler } = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Protected: Get user-specific usage and pricing analytics.
router.get("/", authMiddleware, getAnalyticsHandler);

module.exports = router;
