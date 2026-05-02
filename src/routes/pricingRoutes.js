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

const router = express.Router();

router.use(firebaseAuthMiddleware);

// Existing endpoints (unchanged)
router.post("/optimize-price", usageMiddleware, priorityMiddleware, rateLimitMiddleware, optimizePriceHandler);
router.post("/track-conversion", usageMiddleware, priorityMiddleware, rateLimitMiddleware, trackConversionHandler);

// Spec-required: tax-aware pricing with margin protection
router.post("/calculate-price", usageMiddleware, priorityMiddleware, rateLimitMiddleware, calculatePriceHandler);

// List all supported country tax rates.
router.get("/tax-rates", taxRatesHandler);

module.exports = router;
