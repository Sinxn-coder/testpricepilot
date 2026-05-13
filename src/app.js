const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const pricingRoutes = require("./routes/pricingRoutes");
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const firebaseAuthMiddleware = require("./middleware/firebaseAuthMiddleware");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const loadManager = require("./utils/loadManager");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const env = require("./config/env");
const Sentry = require("@sentry/node");

const app = express();

// Initialize Sentry
if (env.sentryDsn) {
  Sentry.init({ dsn: env.sentryDsn });
  app.use(Sentry.Handlers.requestHandler());
}

// --- Tracking Active Requests for Prioritization ---
app.use((req, res, next) => {
  loadManager.increment();
  res.on("finish", () => loadManager.decrement());
  next();
});

// --- Connectivity & Security Configuration ---

// Enable Dynamic CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow if no origin (mobile apps, curl), or if it matches our list, or for the public optimization endpoint
    if (!origin || origin.includes("pricepilot.site") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      callback(null, true);
    } else {
      // We allow external origins for the plugin endpoints, which handle their own domain-based validation
      callback(null, true); 
    }
  },
  credentials: true
}));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "default-src": ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com"],
        "script-src": ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://www.gstatic.com", "https://*.firebaseapp.com", "'unsafe-inline'"],
        "script-src-elem": ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net", "https://www.gstatic.com", "https://*.firebaseapp.com", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https://*", "blob:"],
        "connect-src": ["'self'", "https://formspree.io", "https://unpkg.com", "https://*.supabase.co", "https://*.onrender.com", "https://cdn.jsdelivr.net", "https://*.googleapis.com", "https://*.firebaseio.com", "https://*.firebaseauth.com"],
        "frame-src": ["'self'", "https://*.firebaseapp.com", "https://*.firebaseauth.com"],
        "style-src": ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(loggerMiddleware);

// Serve the React frontend for all non-API routes
app.use(express.static(path.join(__dirname, "../dist")));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", environment: env.nodeEnv });
});

// Redirect legacy routes to the React hash router
app.get(["/auth", "/auth.html"], (req, res) => res.redirect("/#/auth"));
app.get(["/preview", "/preview.html"], (req, res) => res.redirect("/#/preview"));

app.get("/protected-test", firebaseAuthMiddleware, (req, res) => {
  res.status(200).json({ user: req.user, dbUser: req.dbUser });
});

app.use("/auth", authRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/api/v1", pricingRoutes);
app.use("/api", pricingRoutes);

// Catch-all for API endpoints under root (must be after all static and specific routes)
// Removing app.use("/", pricingRoutes) to prevent interference with static files.
// Use explicit routes for root if needed.
app.post("/calculate-price", pricingRoutes);
app.get("/tax-rates", pricingRoutes);
app.post("/optimize-price", pricingRoutes);
app.post("/track-conversion", pricingRoutes);

if (env.sentryDsn) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
