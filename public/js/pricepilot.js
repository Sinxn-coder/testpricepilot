(function() {
  /**
   * PricePilot Client-Side Connector (MVP)
   * A lightweight script to detect and optimize storefront prices.
   */

  // --- Configuration ---
  // These are usually injected by the Shopify/WooCommerce plugin wrapper
  const CONFIG = {
    apiKey: window.PricePilotKey || null,
    apiBaseUrl: window.PricePilotBaseUrl || 'https://api.pricepilot.site',
    selectors: [
      '.price-item--regular', // Shopify
      '.product__price',      // Shopify
      '.price',               // WooCommerce
      '.woocommerce-Price-amount', // WooCommerce
      '[data-price-pilot="true"]' // Universal
    ]
  };

  if (!CONFIG.apiKey) {
    console.warn('[PricePilot] API Key missing. Skipping optimization.');
    return;
  }

  /**
   * Main Execution
   */
  async function init() {
    // 1. Detect Price Elements
    const elements = findPriceElements();
    if (elements.length === 0) return;

    // 2. Extract Data
    for (const el of elements) {
      const rawText = el.innerText.trim();
      const { amount, currencySymbol } = parsePrice(rawText);

      if (!amount) continue;

      try {
        // 3. Request Optimization
        const optimized = await fetchOptimizedPrice(amount, currencySymbol);
        
        if (optimized && optimized.optimized_final_price) {
          // 4. Update DOM
          updatePriceDisplay(el, optimized.optimized_final_price, currencySymbol);
        }
      } catch (err) {
        console.error('[PricePilot] Optimization failed:', err.message);
        // Fail gracefully: Original price remains on screen
      }
    }
  }

  /**
   * Finds all price elements based on known platform selectors.
   */
  function findPriceElements() {
    const found = [];
    CONFIG.selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!found.includes(el)) found.push(el);
      });
    });
    return found;
  }

  /**
   * Parses price text into a numeric amount and symbol.
   * Simple implementation for MVP.
   */
  function parsePrice(text) {
    // Remove everything except numbers and dots
    const amount = parseFloat(text.replace(/[^-0-9.]/g, ""));
    const currencySymbol = text.replace(/[0-9.,\s]/g, "");
    return { amount, currencySymbol };
  }

  /**
   * Calls the PricePilot SaaS Backend.
   */
  async function fetchOptimizedPrice(basePrice, currencySymbol) {
    const response = await fetch(`${CONFIG.apiBaseUrl}/v1/optimize-price`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base_price: basePrice,
        currency: currencySymbol || 'USD',
        country: 'DETECT', // Backend can detect via IP if preferred
        shop_domain: window.location.hostname
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }

  /**
   * Updates the UI with the new price.
   */
  function updatePriceDisplay(el, newPrice, symbol) {
    // Basic formatting for MVP
    const formatted = `${symbol}${newPrice.toFixed(2)}`;
    
    // Add subtle animation or class
    el.style.transition = 'opacity 0.2s';
    el.style.opacity = '0';
    
    setTimeout(() => {
      el.innerText = formatted;
      el.style.opacity = '1';
      el.setAttribute('data-pp-optimized', 'true');
    }, 200);
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
