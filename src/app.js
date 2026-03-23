const express = require("express");
const helmet = require("helmet");
const path = require("path");

const pricingRoutes = require("./routes/pricingRoutes");
const authRoutes = require("./routes/authRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const loggerMiddleware = require("./middleware/loggerMiddleware");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "https://unpkg.com", "'unsafe-inline'"],
        "script-src-elem": ["'self'", "https://unpkg.com", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https://*"],
        "connect-src": ["'self'"],
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
