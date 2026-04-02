const express = require("express");
const { signupHandler, resetKeyHandler } = require("../controllers/authController");

const router = express.Router();

// Public: Create account and receive the ONE-TIME raw API key.
router.post("/signup", signupHandler);

// Public: Rotate key for an existing user.
router.post("/reset-key", resetKeyHandler);

module.exports = router;
