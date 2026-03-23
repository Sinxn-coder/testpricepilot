const express = require("express");
const { signupHandler } = require("../controllers/authController");

const router = express.Router();

// Public: Create account and receive the ONE-TIME raw API key.
router.post("/signup", signupHandler);

module.exports = router;
