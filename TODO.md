# TODO

## Phase 1–9: Foundation (COMPLETE)
See git history / `PROJECT_PROGRESS.md` for the college-demo stack (mock catalog, screens, Razorpay demo, auth gate, shop polish).

## Live API (Atlas M0) — core done

| Phase | Scope | Status |
|-------|--------|--------|
| 0 | Catalog from Atlas, suggestions + related | **Done** |
| 1 | Auth JWT, OTP SMS (MSG91/Twilio or demo), Keychain | **Done** |
| 2 | Server cart (guest + merge), addresses CRUD | **Done** |
| 3 | Orders + history, strict money paths | **Done** |
| 4 | Pincode serviceability API + seed | **Done** |
| 5 | Wishlist, coupons, reviews, in-app notifications, cancel/return/exchange | **Done** |
| A | Forgot/reset/change password, sessions UI, email verify | **Done** |
| B | Cart coupons UI + Order Details cancel/return/exchange | **Done** |
| C | PDP reviews API, Notifications screen, Resend order emails | **Done** |

**Run live locally:** `npm run dev:api` + `npm run dev`. Atlas URI in `apps/api/.env.development` (gitignored). Seed: `npm run seed --workspace apps/api`.

**SMS:** `SMS_DEMO_MODE=true` logs OTP in API console; paid MSG91/Twilio for real SMS.

**Email:** `EMAIL_DEMO_MODE=true` logs mail; set Resend key + `EMAIL_DEMO_MODE=false` for real inbox mail.

**Cart coupons (seeded):** `FORGE10`, `WELCOME100`.

---

## Explicitly deferred (do not implement until asked)

- [ ] **Shipment tracking** — carrier tracking numbers + timeline beyond status labels.
- [ ] **Invoice / PDF** — downloadable tax invoice for orders.
- [ ] **Payment webhooks** — Razorpay server webhooks (idempotent) beside client `/confirm` (see guide below when building).
- [ ] **Push notifications (FCM / APNs)** — device tokens + backend fan-out (in-app Notifications API already exists).
- [ ] **Automated tests** — Jest + RNTL + Supertest.
- [ ] Coupon admin UI / CMS (API + seed only for now).
- [ ] Serviceability picker UI on checkout (API exists).

---

## HTTPS / production deploy

> Putting API + Mongo + app on real servers (Railway / Render / AWS + Play Store / TestFlight), with real env secrets — **not your laptop.**

- [ ] **HTTPS / production deploy**
  - Host API on Railway, Render, Fly.io, or AWS (HTTPS URL ending in `/api/v1`).
  - Use MongoDB Atlas (or managed Mongo) with IP allowlist / VPC + strong DB user password.
  - Store secrets in the host’s env dashboard only: `MONGODB_URI`, `JWT_*`, `RAZORPAY_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_DEMO_MODE=false`, SMS keys if used. Never commit `.env`.
  - Point mobile `appConfig.apiBaseUrl` at the HTTPS API; `dataSource: 'api'`, `allowMockFallback: false` for store builds.
  - Android: Play Console internal testing → upload release APK/AAB (`npm run gradlew-android`).
  - iOS: Apple Developer + TestFlight (signing, privacy nutrition labels, Razorpay URL schemes if needed).
  - CORS: set `CORS_ORIGINS` appropriately (mobile apps don’t use browser CORS the same way; still lock down if you add a web admin).
  - TLS terminates at the host; do not run plain HTTP in production.

---

## Optional / backlog product ideas

### Discovery & personalization
- [ ] Smart push notifications (interest / cart / drop aware) — needs FCM first.
- [ ] Frictionless visual search.
- [ ] Personalized home feed.
- [ ] Find with character / franchise UI.
- [ ] AI Merch Assistant.

### Merchandising & drops
- [ ] Today’s Niðavellir drop banner.
- [ ] Pre-order products.
- [ ] Bundle products.
- [ ] Mystery boxes.

### Loyalty & profile
- [ ] Loyalty points (XP) + level names / progression UI.

### PDP & community
- [ ] “How they get along” / customer images.
- [ ] Make your own Gaming Setup.
- [ ] Community blog.

### Notes for implementers
- Visual search, AI assistant, and smart pushes need backend + privacy / moderation plans.
- Pre-order, bundles, and mystery boxes need inventory + pricing + cart rules before UI.
