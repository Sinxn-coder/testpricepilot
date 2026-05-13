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

### **Shopify App Setup (Developer):**
To run this app properly, you need a **Shopify Partner Account**.

1. **Partner Dashboard**:
   - Create a new App in your Partner Dashboard.
   - Set **App URL** to your hosted URL (or ngrok URL).
   - Set **Allowed Redirection URL** to `[App URL]/api/auth/callback`.

2. **Environment Variables (.env)**:
   ```env
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SHOPIFY_APP_URL=https://your-app-url.com
   API_BASE_URL=https://api.pricepilot.site
   ```

3. **Running Locally**:
   - Navigate to `plugins/shopify/app`.
   - Run `node server/server.js`.
   - Use the Shopify CLI to tunnel: `shopify app dev`.

4. **Deploying the Extension**:
   - Run `shopify app deploy`.
   - This pushes the **Theme App Extension** (the liquid block) to your app.

### **Installation Flow:**
1. Merchant clicks "Install" from your App URL.
2. OAuth flow authorizes the app with minimal scopes.
3. Merchant is redirected to the **Embedded Settings Page**.
4. Merchant enters their PricePilot API Key.
5. Merchant enables the **App Embed** in the Shopify Theme Editor.

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
