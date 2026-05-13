const express = require("express");
const {
  optimizePriceHandler,
  trackConversionHandler
} = require("../controllers/pricingController");
const { calculatePriceHandler } = require("../controllers/calculatePriceController");
const { taxRatesHandler } = require("../controllers/taxRatesController");
const firebaseAuthMiddleware = require("../middleware/firebaseAuthMiddleware");
const usageMiddleware = require("../middleware/usageMiddleware");
const priorityMiddleware = require("../middleware/priorityMiddleware");
const rateLimitMiddleware = require("../middleware/rateLimitMiddleware");
const domainAbuseMiddleware = require("../middleware/domainAbuseMiddleware");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(domainAbuseMiddleware);

// --- Plugin Endpoints (Uses API Key) ---
router.post("/optimize-price", authMiddleware, usageMiddleware, priorityMiddleware, rateLimitMiddleware, optimizePriceHandler);
router.post("/track-conversion", authMiddleware, usageMiddleware, priorityMiddleware, rateLimitMiddleware, trackConversionHandler);

// --- Dashboard Endpoints (Uses Firebase Auth) ---
router.post("/calculate-price", firebaseAuthMiddleware, usageMiddleware, priorityMiddleware, rateLimitMiddleware, calculatePriceHandler);
router.get("/tax-rates", firebaseAuthMiddleware, taxRatesHandler);

module.exports = router;
