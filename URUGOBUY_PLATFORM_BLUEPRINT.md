# UrugoBuy Platform Blueprint

This repository already implements most of the requested UrugoBuy e-commerce scope with a modern React + Express architecture.

## Implemented Now

- Brand palette enforced globally:
- Primary: `#0F6B4B`
- Accent: `#D9A441`
- Background: white
- Modern sans-serif typography and smooth UI transitions
- Premium newsletter section style updated to match the minimal brand direction
- Product image fallback classification (fruit/food) with local fallback assets

## Core Pages Status

- Home page: implemented
- Product listing page: implemented
- Product detail page: implemented
- Cart page: implemented (sheet/cart flow)
- Checkout page: implemented
- User dashboard: implemented (`/account`)
- Admin dashboard: implemented (`/admin`)

## Feature Status

- Smart product search with filters: implemented
- Product reviews and ratings: implemented
- Wishlist system + share/import: implemented
- Cart quantity management: implemented
- Checkout + order creation: implemented
- Order tracking view: implemented
- User accounts: implemented
- Admin product/order management: implemented
- Product recommendations: implemented
- Mobile responsive design: implemented
- SEO pages and metadata: implemented

## Payment Methods Status

- Cash on delivery: implemented in checkout flow
- Mobile Money, Visa/Mastercard, PayPal: UI/payment method scaffolding exists; production gateway wiring should be finalized with provider APIs and webhook confirmation handlers

## Stack Gap vs Your Requested Stack

Requested:
- React Router
- MongoDB
- JWT authentication

Current:
- Wouter routing
- PostgreSQL + Drizzle ORM
- Token/session map + Firebase token support

## Migration Plan To Exact Requested Stack

1. Router migration
- Replace `wouter` with `react-router-dom` route config in `client/src/App.tsx`.
- Update navigation/link hooks in components and pages.

2. Auth migration to JWT
- Add `jsonwebtoken` based access token issuing at login.
- Add refresh-token rotation (HTTP-only cookie) and logout invalidation.
- Replace in-memory `sessions` map in `server/routes.ts`.

3. Database migration to MongoDB
- Introduce Mongoose models for `User`, `Category`, `Product`, `Order`, `Review`, `Wishlist`.
- Port data-access layer from Drizzle queries to repository services.
- Create one migration/import script from existing DB to MongoDB.

4. Payments production hardening
- Integrate provider SDKs (PayPal + card processor + Mobile Money aggregator).
- Add webhook endpoints for payment confirmation and order status sync.

5. Admin analytics
- Keep existing charts and switch data source to Mongo aggregation pipelines.

## Recommended Delivery Strategy

1. Keep current production app running.
2. Migrate auth first, then persistence layer, then router.
3. Run both old/new APIs behind compatibility adapters until parity is complete.
