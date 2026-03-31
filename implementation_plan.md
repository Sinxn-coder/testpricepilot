# Project-Level Implementation Plan: Priority API Handling

This plan details the technical changes to implement plan-aware priority handling in the PricePilot API.

## Core Priority Logic

### 1. Load Manager Utility
- Tracks current active requests in-memory for the Node.js process.
- Thresholds: 
    - `MAX_FREE_LOAD = 50` 
    - `MAX_TOTAL_LOAD = 200`

### 2. Rate Limit & Priority Middleware
- **Monthly Limit Update**:
    - Free: 1,500
    - Starter: 15,000
    - Growth: 50,000
    - Pro: 1,000,000
- **Prioritization Logic**:
    - Check active requests before DB lookup.
    - If user is `Free` and concurrent load > 50: **Reject with 503**.
    - If user is `Paid` and concurrent load < 200: **Allow**.

### 3. Global Integration
- Middleware in `app.js` will increment the load counter on every request start and decrement it on `finish`.

## Questions for User
- Is the **50 concurrent request** limit for Free users acceptable for your current growth?
- Should we provide a custom error message for Free users telling them that the system is prioritized for Pro members?
