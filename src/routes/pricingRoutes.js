const express = require("express");
const {
  optimizePriceHandler,
  trackConversionHandler
} = require("../controllers/pricingController");
const { calculatePriceHandler } = require("../controllers/calculatePriceController");
const { taxRatesHandler } = require("../controllers/taxRatesController");
const authMiddleware = require("../middleware/authMiddleware");
const rateLimitMiddleware = require("../middleware/rateLimitMiddleware");

const router = express.Router();

// Existing endpoints (unchanged)
router.post("/optimize-price", authMiddleware, rateLimitMiddleware, optimizePriceHandler);
router.post("/track-conversion", authMiddleware, rateLimitMiddleware, trackConversionHandler);

// Spec-required: tax-aware pricing with margin protection
router.post("/calculate-price", authMiddleware, rateLimitMiddleware, calculatePriceHandler);

// Public: list all supported country tax rates (no auth)
router.get("/tax-rates", taxRatesHandler);

module.exports = router;
