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

**Run against hosted API:** mobile already uses `https://ni-avellir.onrender.com/api/v1` — only Metro + device (`npm run dev` / `android`). No laptop API required.

**SMS:** `SMS_DEMO_MODE=true` logs OTP in API console; paid MSG91/Twilio for real SMS.

**Email:** `EMAIL_DEMO_MODE=true` logs mail; set Resend key + `EMAIL_DEMO_MODE=false` for real inbox mail. Smoke: `npm run test:email --workspace apps/api -- you@example.com`.

**Rune XP:** 100 per completed order; 500 if the order includes 2+ products with the same `bundleTag`.

**Cart coupons (seeded):** `FORGE10`, `WELCOME100`.

**Postman / cURL:** [`API_DETAILS.live.example.md`](API_DETAILS.live.example.md) · `python3 scripts/generate-api-details-local.py --live`

---

## Explicitly deferred (do not implement until asked)

- [ ] **Shipment tracking** — carrier tracking numbers + timeline beyond status labels.
- [ ] **Invoice / PDF** — downloadable tax invoice for orders.
- [x] **Payment webhooks** — Razorpay `POST /payments/razorpay/webhook` (idempotent, raw-body HMAC verify) beside client `/confirm`.
- [ ] **Push notifications (FCM / APNs)** — device tokens + backend fan-out (in-app Notifications API already exists).
- [ ] **Automated tests** — Jest + RNTL + Supertest.
- [ ] Coupon admin UI / CMS (API + seed only for now).
- [x] **Serviceability picker UI on checkout** — checks pincode from selected/entered address; shows ETA / shipping / COD; hides COD when unavailable (`serviceabilityRepository` + Checkout).

---

## HTTPS / production deploy

> Putting API + Mongo + app on real servers (Railway / Render / AWS + Play Store / TestFlight), with real env secrets — **not your laptop.**

- [x] **API on Render Free** — `https://ni-avellir.onrender.com` (`render.yaml`, `npm run build:api` / `start:api`, Atlas Mongo, Razorpay Test keys). Mobile `apiBaseUrl` + `/health` keep-alive (`wakeApiServer.ts`).
- [ ] **HTTPS / store deploy (remaining)**
  - Paid always-on host if cold starts are unacceptable for store users.
  - Point production builds at HTTPS API; `dataSource: 'api'`, `allowMockFallback: false`.
  - Android: Play Console internal testing → upload release APK/AAB (`npm run gradlew-android`).
  - iOS: Apple Developer + TestFlight (signing, privacy nutrition labels, Razorpay URL schemes if needed).
  - CORS: set `CORS_ORIGINS` appropriately (mobile apps don’t use browser CORS the same way; still lock down if you add a web admin).
  - TLS terminates at the host; do not run plain HTTP in production.
  - Razorpay Live keys + webhook secret only when charging real money.
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
- [x] **Bundle products** — driven by live product `bundleTag` / `isBundleMain` + `GET /products/bundles` (not mock membership). PDP “Complete the bundle”; Home banner slider after bestsellers. Re-seed after catalog changes. Banner art hints are placeholders until creatives land.
- [ ] Mystery boxes.

### Loyalty & profile
- [x] **Rune XP (loyalty)** — **100 XP per normal order**, **500 XP when the order has 2+ products sharing a `bundleTag`**. Profile bar + Apprentice→Master tiers. Confirmation screen shows awarded amount.

### Active polish backlog
- [x] **Session device labels** — mobile sends `deviceId` / `deviceLabel` / `os`; API stores client IP; Sessions UI shows name + OS + IP (not “This device”). Re-login to label sessions.
- [x] **Verification email plumbing** — Resend errors logged; `npm run test:email --workspace apps/api -- you@example.com`. Real inbox still needs Render env: `EMAIL_DEMO_MODE=false`, real `RESEND_API_KEY`, verified `EMAIL_FROM`.
- [x] **Blank Unicode icons** — PDP confidence + Account menu use SVG `AppIcon` (Android-safe).
- [x] **Broken product images** — `CachedImage` placeholder + `onError` fallback.
- [x] **Home video autoplay** — muted autoplay retries on load / Home focus / AppState active.

### PDP & community
- [ ] “How they get along” / customer images.
- [ ] Make your own Gaming Setup.
- [ ] Community blog.

### Notes for implementers
- Visual search, AI assistant, and smart pushes need backend + privacy / moderation plans.
- Pre-order and mystery boxes need inventory + pricing + cart rules before UI.
- After bundle seed changes on Render, run seed against Atlas (or redeploy with seed job) so live API gets `bundleTag` products.
