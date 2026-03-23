# PricePilot API (MVP)

PricePilot is a pricing optimization API that returns conversion-friendly prices based on country and traffic source.

## Features

- API key authentication (`Authorization: Bearer <API_KEY>`)
- Monthly usage limits by plan
  - `free`: 200 requests/month
  - `paid`: 10000 requests/month (change as needed)
- `POST /optimize-price` pricing optimization
- `POST /track-conversion` conversion tracking
- Supabase/PostgreSQL persistence
- Input validation, secure defaults, and basic request logging
- In-memory response cache for repeated optimize requests
- Docker image compatible with Google Cloud Run

## Project Structure

```text
src/
  app.js
  index.js
  config/
    env.js
    supabase.js
  routes/
    pricingRoutes.js
  controllers/
    pricingController.js
  middleware/
    authMiddleware.js
    rateLimitMiddleware.js
    loggerMiddleware.js
    errorHandler.js
  services/
    pricingService.js
    cacheService.js
  utils/
    apiKey.js
    validation.js
sql/
  schema.sql
Dockerfile
```

## Prerequisites

- Node.js 18+
- Supabase project

## 1) Setup

```bash
npm install
cp .env.example .env
```

Update `.env`:

```env
PORT=8080
NODE_ENV=development
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CACHE_TTL_SECONDS=120
```

## 2) Create Supabase Tables

Run `sql/schema.sql` in Supabase SQL editor.

## 3) Create API Key + User Row

Generate a raw API key:

```bash
npm run gen:key
```

Hash that raw key with SHA-256 and insert the hash into `users.api_key`.

Example (Node one-liner):

```bash
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('PASTE_RAW_KEY').digest('hex'))"
```

Then insert into `users`:

```sql
insert into public.users (email, plan, api_key)
values ('owner@company.com', 'free', 'SHA256_HASH_HERE');
```

## 4) Run Locally

```bash
npm run dev
```

Health check:

```bash
curl http://localhost:8080/health
```

## API Endpoints

### POST `/calculate-price` ⭐ (spec endpoint)

Applies country VAT/GST, adjusts to psychological pricing (.99/.95), and guards your minimum margin.

Headers:

```http
Authorization: Bearer <RAW_API_KEY>
Content-Type: application/json
```

Body:

```json
{
  "base_price": 10,
  "country": "US",
  "currency": "USD",
  "min_margin": 10
}
```

Response:

```json
{
  "base_price": 10,
  "tax_rate_pct": 8,
  "tax_amount": 0.80,
  "original_final_price": 10.80,
  "optimized_final_price": 10.99,
  "currency": "USD"
}
```

> `min_margin` is a percentage (0–100). If `.99` rounding would eat into it, the engine rounds **up** instead of down.

---

### GET `/tax-rates` (no auth)

Returns all supported country VAT/GST rates. No API key required (transparency).

```bash
curl http://localhost:8080/tax-rates
```

Response:

```json
{
  "tax_rates": [
    { "country": "AE", "tax_percentage": 5 },
    { "country": "AU", "tax_percentage": 10 },
    { "country": "GB", "tax_percentage": 20 },
    { "country": "IN", "tax_percentage": 18 },
    { "country": "US", "tax_percentage": 8 }
  ]
}
```

---

### POST `/optimize-price`

Legacy endpoint — country/source multiplier-based pricing (no tax calculation).

Headers:

```http
Authorization: Bearer <RAW_API_KEY>
Content-Type: application/json
```

Body:

```json
{
  "base_price": 12.5,
  "country": "US",
  "currency": "USD",
  "source": "facebook",
  "user_id": "optional-client-id"
}
```

Response:

```json
{
  "final_price": 11.95,
  "original_price": 12.5,
  "adjustments": {
    "country_adjustment": 0,
    "source_adjustment": -0.63
  },
  "currency": "USD"
}
```

### POST `/track-conversion`

Headers:

```http
Authorization: Bearer <RAW_API_KEY>
Content-Type: application/json
```

Body:

```json
{
  "price_shown": 11.95,
  "converted": true,
  "source": "facebook",
  "country": "US"
}
```

Response:

```json
{
  "success": true,
  "message": "Conversion tracked"
}
```

## cURL Examples

Optimize price:

```bash
curl -X POST http://localhost:8080/optimize-price \
  -H "Authorization: Bearer YOUR_RAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"base_price\":1200,\"country\":\"IN\",\"currency\":\"INR\",\"source\":\"facebook\"}"
```

Track conversion:

```bash
curl -X POST http://localhost:8080/track-conversion \
  -H "Authorization: Bearer YOUR_RAW_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"price_shown\":999,\"converted\":true,\"source\":\"facebook\",\"country\":\"IN\"}"
```

## Pricing Logic (MVP)

- Country multiplier:
  - `IN`: 0.90
  - `US`: 1.00
  - Others: fallback values/default 1.00
- Source multiplier:
  - `facebook`: 0.95
  - `google`: 1.01
- Rounding:
  - `IN`: 499/999 style (`-1` endings)
  - `US`: `.99` / `.95` style
  - default: `.99`

## Deploy to Google Cloud Run

Build container:

```bash
docker build -t gcr.io/YOUR_PROJECT_ID/pricepilot-api .
```

Push + deploy:

```bash
docker push gcr.io/YOUR_PROJECT_ID/pricepilot-api
gcloud run deploy pricepilot-api \
  --image gcr.io/YOUR_PROJECT_ID/pricepilot-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=...,SUPABASE_SERVICE_ROLE_KEY=...,NODE_ENV=production
```

Cloud Run injects `PORT`; app is already `PORT`-compatible.
