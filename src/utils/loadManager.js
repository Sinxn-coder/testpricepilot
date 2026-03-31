/**
 * loadManager.js
 * High-performance singleton to track live API pressure across the platform.
 */
const loadManager = {
  activeRequests: 0,
  
  // Adaptive Load Shedding Thresholds (Concurrent Requests)
  THRESHOLDS: {
    free: 30,
    starter: 100,
    growth: 250,
    pro: 500, // Hard limit for Pro
    system: 600 // Global safety limit
  },

  increment() {
    this.activeRequests++;
  },

  decrement() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  },

  getActiveCount() {
    return this.activeRequests;
  },

  /**
   * isThresholdReached
   * @param {string} plan - The user's current subscription plan
   * @returns {boolean} - True if the plan's threshold is reached
   */
  isThresholdReached(plan) {
    const threshold = this.THRESHOLDS[plan.toLowerCase()] || this.THRESHOLDS.free;
    return this.activeRequests >= threshold;
  }
};

module.exports = loadManager;
