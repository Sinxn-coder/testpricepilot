const express = require("express");
const { getAnalyticsHandler } = require("../controllers/analyticsController");
const firebaseAuthMiddleware = require("../middleware/firebaseAuthMiddleware");

const router = express.Router();

router.use(firebaseAuthMiddleware);

// Protected: Get user-specific usage and pricing analytics.
router.get("/", getAnalyticsHandler);

module.exports = router;
