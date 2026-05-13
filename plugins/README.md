# PricePilot Plugin Wrappers (MVP)

These lightweight connectors allow you to integrate PricePilot with your Shopify or WooCommerce store in minutes.

---

## 🛒 WooCommerce Integration
**Status:** Stable / Downloadable

### **Installation:**
1. Download the `plugins/woocommerce` folder as a ZIP file.
2. Go to your WordPress Admin > **Plugins** > **Add New** > **Upload Plugin**.
3. Upload and activate `pricepilot-woo.php`.
4. Go to **Settings** > **PricePilot**.
5. Paste your API Key from the [PricePilot Dashboard](https://pricepilot.site/dashboard).
6. Click **Save Connection**.

### **Verification:**
- Visit your storefront.
- Open Chrome DevTools (F12) > Console.
- You should see `[PricePilot] Client-Side Connector (MVP)` logs if elements are detected.

---

## 🛍️ Shopify Integration
**Status:** Build-Ready (Theme App Extension)

### **Setup (for Store Owners):**
1. Install the PricePilot App (via Custom App or App Store).
2. Go to your **Online Store** > **Themes** > **Customize**.
3. Click **App Embeds** on the left sidebar.
4. Enable **PricePilot Optimizer**.
5. Enter your API Key in the settings field.
6. Click **Save**.

### **Developer Setup (CLI):**
1. Navigate to `plugins/shopify`.
2. Run `shopify app deploy`.
3. The Theme App Extension will be pushed to your Shopify Partner dashboard.

---

## 🛡️ Security & Enforcement
Both plugins leverage the **Domain Abuse Middleware**.
- If a user tries to use their API Key on a domain that they do not own (or that is already registered to another user), the API will return `403 Forbidden`.
- The `pricepilot.js` script automatically detects the `window.location.hostname` and sends it to the backend for verification.

## 🛠️ Local Testing
To test the plugins locally:
1. Ensure your PricePilot backend is running (`npm run start`).
2. Use a tool like **ngrok** to tunnel your local port 8080 to a public URL.
3. Update the `API Base URL` in the plugin settings to your ngrok URL.
4. Verify that prices are being optimized on your local WooCommerce/Shopify dev store.
