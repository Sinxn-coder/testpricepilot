# PricePilot: Stripe Payment Integration Guide

This guide outlines how to transform the current "Pro" plan UI into a live, revenue-generating subscription system using **Stripe**.

## 1. Stripe Account Setup
1.  **Create a Stripe Account**: Sign up at [stripe.com](https://stripe.com).
2.  **Get API Keys**: Obtain your `Publishable key` and `Secret key` from the Developers Dashboard.
3.  **Add to .env**:
    ```env
    STRIPE_SECRET_KEY=sk_test_...
    STRIPE_WEBHOOK_SECRET=whsec_...
    ```

## 2. Define Products
In your Stripe Dashboard, create two Products:
- **PricePilot Pro**: Recurring monthly price of $49.00.
- **Note the Price ID**: (e.g., `price_1Pabc1...`) — you will need this for the checkout session.

## 3. Implementation Flow

### A. Create Checkout Session (Backend)
When a user clicks "Upgrade to Pro", your backend should create a session:
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/billing/create-checkout', authMiddleware, async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    customer_email: req.authUser.email,
    line_items: [{ price: 'price_PRO_ID', quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.APP_URL}/preview.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/preview.html`,
    metadata: { user_id: req.authUser.id }
  });
  res.json({ url: session.url });
});
```

### B. Handle Webhooks (Backend)
Listen for the `checkout.session.completed` event to update the user's plan in Supabase:
```javascript
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.user_id;

    await supabase.from('users').update({ 
      plan: 'pro',
      stripe_customer_id: session.customer 
    }).eq('id', userId);
  }
  res.json({ received: true });
});
```

## 4. Why Stripe?
- **Security**: You never handle credit card data.
- **Compliance**: Automatic handling of global sales taxes (matching PricePilot's mission!).
- **Scalability**: Handles recurring billing, upgrades, and cancellations out of the box.
