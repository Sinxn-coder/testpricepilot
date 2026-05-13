require("dotenv").config();
const express = require("express");
const { shopifyApi, LATEST_API_VERSION } = require("@shopify/shopify-api");
const { restResources } = require("@shopify/shopify-api/rest/resources/2024-04");
const cookieParser = require("cookie-parser");
const path = require("path");

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["unauthenticated_read_product_listings"], // Minimal scopes
  hostName: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  restResources,
});

const app = express();
app.use(cookieParser(shopify.config.apiSecretKey));

// --- OAuth Flow ---

app.get("/api/auth", async (req, res) => {
  const shop = shopify.utils.sanitizeShop(req.query.shop);
  if (!shop) return res.status(400).send("Missing shop parameter");

  return await shopify.auth.begin({
    shop,
    callbackPath: "/api/auth/callback",
    isOnline: false,
    rawRequest: req,
    rawResponse: res,
  });
});

app.get("/api/auth/callback", async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;
    console.log(`App installed on: ${session.shop}`);

    // --- Domain Auto-Registration ---
    // Here we would call the PricePilot backend to register this shop domain
    // fetch(`${process.env.API_BASE_URL}/api/register-shop`, { ... })

    const host = req.query.host;
    res.redirect(`/?shop=${session.shop}&host=${host}`);
  } catch (e) {
    console.error(e);
    res.status(500).send(e.message);
  }
});

// --- Settings API ---

app.get("/api/settings", async (req, res) => {
    // Return stored API key for this shop
    res.json({ api_key: "pp_live_mock_key_from_db" });
});

app.post("/api/settings", express.json(), async (req, res) => {
    const { api_key } = req.body;
    console.log(`Updating key for shop: ${api_key}`);
    res.json({ success: true });
});

// Serve embedded React app
app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Shopify App Server running on port ${PORT}`));
