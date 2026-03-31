# Implementation Plan: Split-Screen Auth Redesign

Transform the current centered-card authentication page into a professional, full-screen split layout.

## User Review Required

> [!IMPORTANT]
> - **Split Concept**: On desktop, the page will be split 60/40. The left side is for branding/trust, and the right side is for the form.
> - **Mobile Behavior**: The branding side will hide on mobile devices (screens < 1024px) to ensure a fast, focused sign-up experience on phones.

## Proposed Changes

### [MODIFY] [auth.html](file:///c:/Users/SINAN/OneDrive/Documents/1st%20work/saas%20finance/public/auth.html)

#### 1. Layout Refactor
- Update `.auth-page` to `display: flex; height: 100vh; overflow: hidden;`.
- Add `.auth-aside`: The left-side marketing area with a premium background.
- Add `.auth-main`: The right-side form container.

#### 2. Marketing Content (Left Side)
- **Heading**: "The engine behind the world's highest-converting SaaS."
- **Key Metric**: "+18.4% Average Revenue Growth"
- **Features List**:
    - Real-time rounding and psychology engine.
    - Automated global tax calculation.
    - Enterprise-grade API reliability.

#### 3. Form Refinement (Right Side)
- Center the existing `auth-card` content but remove the card's literal border/shadow on desktop to make it feel integrated into the "split" surface.
- Improve input field focus states for a premium "glow" effect.

## Verification Plan

- **Visual Check**: Open `auth.html` in the browser across Desktop, Tablet, and Mobile sizes.
- **Functional Check**: Verify the tab switching (Login/Signup) still works correctly in the new layout.
- **Navigation Check**: Ensure the PricePilot logo still links back to `index.html`.
