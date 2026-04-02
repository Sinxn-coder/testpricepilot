const { signupHandler, recoverHandler } = require("../controllers/authController");

const router = express.Router();

// Public: Create account and receive the ONE-TIME raw API key.
router.post("/signup", signupHandler);

// Public: Request API key recovery via email.
router.post("/recover", recoverHandler);

module.exports = router;
