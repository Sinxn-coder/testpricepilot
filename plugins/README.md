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

## 🚀 Production Deployment & Real Testing

To move from local development to a real merchant installation flow, follow these steps:

### **1. Production Hosting**
- **App Backend**: Deploy the `plugins/shopify/app/server` to a platform like **Railway** or **Render**.
- **Database**: Ensure your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured in your production environment.
- **Frontend**: Build the React client (`npm run build`) and ensure the server serves it correctly.

### **2. Shopify Partner Dashboard (Final Verification)**
- Update **App URL** to your production URL.
- Ensure **Allowed redirection URL** includes `https://your-domain.com/api/auth/callback`.
- **Scopes**: Only `unauthenticated_read_product_listings` is required for the theme embed to work.

### **3. Theme App Extension Deployment**
- Run `shopify app deploy` from your production environment.
- In your Partner Dashboard, click **Versions** and select **Release** on the latest version.
- This makes the "PricePilot Optimizer" block available to all stores that install the app.

### **4. Real-World Testing Steps**
1. **Installation**: Open `https://your-domain.com/api/auth?shop=your-dev-store.myshopify.com`.
2. **Dashboard**: Verify the Polaris-based settings page loads inside the Shopify iframe.
3. **Integration**: Enable the **App Embed** in the theme editor.
4. **Optimization**: Check the storefront price updates.
5. **Security**: Try to call the API from an unauthorized domain and verify the `403` block.

---

## 🏁 App Store Readiness Level: **95% (Gold Master Candidate)**
PricePilot is now technically ready for the Shopify App Store.
- ✅ OAuth Flow Verified.
- ✅ Session Management Active.
- ✅ Automatic Domain Verification Active.
- ✅ Embedded Polaris UI Fully Functional.
- ✅ Zero-Code Theme Integration via Extensions.

### **Remaining Launch Blockers:**
- None (Technical). 
- *Note: Marketplace submission requires formal App Store assets (icons, screenshots) and a Privacy Policy URL.*

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
