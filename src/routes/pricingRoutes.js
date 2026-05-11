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

const router = express.Router();

// router.use(firebaseAuthMiddleware); // Removed global auth to prevent interference with root-mounted routing
router.use(domainAbuseMiddleware);

// Existing endpoints (unchanged)
router.post("/optimize-price", firebaseAuthMiddleware, usageMiddleware, priorityMiddleware, rateLimitMiddleware, optimizePriceHandler);
router.post("/track-conversion", firebaseAuthMiddleware, usageMiddleware, priorityMiddleware, rateLimitMiddleware, trackConversionHandler);

// Spec-required: tax-aware pricing with margin protection
router.post("/calculate-price", firebaseAuthMiddleware, usageMiddleware, priorityMiddleware, rateLimitMiddleware, calculatePriceHandler);

// List all supported country tax rates.
router.get("/tax-rates", firebaseAuthMiddleware, taxRatesHandler);

module.exports = router;
