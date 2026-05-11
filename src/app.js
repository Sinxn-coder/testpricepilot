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

const app = express();

// --- Tracking Active Requests for Prioritization ---
app.use((req, res, next) => {
  loadManager.increment();
  res.on("finish", () => loadManager.decrement());
  next();
});

// --- Connectivity & Security Configuration ---

// Enable Dynamic CORS
const allowedOrigins = env.corsAllowedOrigins.split(",").map(o => o.trim());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
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

// Serve Dynamic Config for Frontend
app.get("/config.js", (req, res) => {
  res.type("application/javascript");
  const firebaseConfig = {
  const firebaseConfig = env.firebaseClientConfig;
  res.send(`
    window.API_BASE_URL = "${env.apiBaseUrl || ''}";
    window.FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig)};
  `);
});

// Ensure /js/pricepilot.js and others are served before catch-all routes
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (req, res) => {
  if (req.accepts("html")) {
    return res.sendFile(path.join(__dirname, "../public/health.html"));
  }
  res.status(200).json({ status: "ok" });
});

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/terms.html"));
});

app.get("/auth", (req, res) => res.sendFile(path.join(__dirname, "../public/auth.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(__dirname, "../public/contact.html")));
app.get("/about", (req, res) => res.sendFile(path.join(__dirname, "../public/about.html")));
app.get("/plans", (req, res) => res.sendFile(path.join(__dirname, "../public/plans.html")));
app.get("/privacy", (req, res) => res.sendFile(path.join(__dirname, "../public/privacy.html")));
app.get("/terms", (req, res) => res.sendFile(path.join(__dirname, "../public/terms.html")));
app.get("/preview", (req, res) => res.sendFile(path.join(__dirname, "../public/preview.html")));

app.get("/auth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/auth.html"));
});

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

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
