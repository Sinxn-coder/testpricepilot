require("dotenv").config();
const { shopifyApi, LATEST_API_VERSION } = require("@shopify/shopify-api");
const { restResources } = require("@shopify/shopify-api/rest/resources/2024-04");

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES ? process.env.SHOPIFY_SCOPES.split(",") : ["unauthenticated_read_product_listings"],
  hostName: process.env.SHOPIFY_APP_URL.replace(/https:\/\//, ""),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  restResources,
});

module.exports = shopify;
