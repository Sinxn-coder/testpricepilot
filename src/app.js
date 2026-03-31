const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const pricingRoutes = require("./routes/pricingRoutes");
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const loadManager = require("./utils/loadManager");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// --- Tracking Active Requests for Prioritization ---
app.use((req, res, next) => {
  loadManager.increment();
  res.on("finish", () => loadManager.decrement());
  next();
});

// --- Connectivity & Security Configuration ---

// Enable CORS for frontend on GitHub Pages
const allowedOrigin = "https://sinxn-coder.github.io";
app.use(cors({
  origin: function (origin, callback) {
    // Allow local development and specific GitHub Pages domain
    if (!origin || origin.startsWith(allowedOrigin) || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        "script-src-elem": ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'", "https://formspree.io", "https://unpkg.com", "https://*.supabase.co", "https://*.onrender.com", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(loggerMiddleware);
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

app.get("/preview", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/preview.html"));
});

app.use("/auth", authRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/", pricingRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
