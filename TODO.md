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

**Email (Render live):** `EMAIL_DEMO_MODE=false` + real `RESEND_API_KEY` + `EMAIL_FROM=Niðavellir <onboarding@resend.dev>` — verify / reset / order mail send via Resend. Free onboarding sender only delivers to the Resend account email until a domain is verified. Branded HTML in `integrations/email/email.factory.ts`. Smoke: `npm run test:email --workspace apps/api -- you@example.com`. Local default remains `EMAIL_DEMO_MODE=true` (console only).

**Rune XP:** **100** per completed order; **500** if the order includes **2+ products** with the same `bundleTag`. Confirmation screen shows awarded XP.

**Sessions:** login/register/OTP send `deviceId` / `deviceLabel` / `os`; API stores client IP (`trust proxy`). Devices & sessions UI shows label + OS + IP.

**Cart coupons (seeded):** `FORGE10`, `WELCOME100`.

**Postman / cURL:** [`API_DETAILS.live.example.md`](API_DETAILS.live.example.md) · `python3 scripts/generate-api-details-local.py --live`

---

## Shipped product extras (COMPLETE — do not re-open as new work)

- [x] **Payment webhooks** — Razorpay `POST /payments/razorpay/webhook` (idempotent, raw-body HMAC verify) beside client `/confirm`.
- [x] **Serviceability picker UI on checkout** — pincode ETA / shipping / COD gate (`serviceabilityRepository` + Checkout).
- [x] **API on Render Free** — `https://ni-avellir.onrender.com` (`render.yaml` + dashboard branch **`Nidavellir`**, `build:api` / `start:api`, Atlas, Razorpay Test, Resend live). Mobile `apiBaseUrl` + `/health` keep-alive (`wakeApiServer.ts`).
- [x] **Frictionless visual search (v1)** — Search/Home camera → `POST /products/visual-search`. Flag `features.visualSearch`.
- [x] **Personalized home feed (v1)** — Home **For you** + `GET /products/for-you`. Flag `features.personalizedHome`.
- [x] **Character Vault (v1)** — Filament lobby; Goku/Vegeta + Kid Levi (idle clip **8**). Flag `features.characterVault`.
- [x] **AI Merch Assistant** — `POST /api/v1/ai/chat` + mobile hub/mic; stub without LLM key.
- [x] **Drop Zone** — daily rotation via `drop-zone-eligible` + Asia/Kolkata date hash (no daily re-seed).
- [x] **Bundle products** — `bundleTag` / `isBundleMain` + `GET /products/bundles`; PDP complete-the-bundle; Home banner slider.
- [x] **Rune XP (loyalty)** — 100 / 500; Profile tiers; confirmation award.
- [x] **Devices & sessions** — device / OS / IP.
- [x] **Email verify (Resend)** — branded templates; Account `emailVerified`. **Register resilience:** verify-email send failure after user create still returns **201** + tokens (`emailVerification: { sent: false, reason: 'send_failed' }`) — does not 500 signup.
- [x] SVG `AppIcon`, `CachedImage` fallback, Home `VideoBanner` retries, PDP confidence 2×2 + specs/reviews above carousels.
- [x] **All Reviews** — teaser + `ProductReviews`; write modal; author Remove; hosted avatar; outline Add to cart.
- [x] **Anime facet** — `GET /products?tag=anime` (not name search / not a fifth category enum).
- [x] **Idempotent checkout + payment reconcile** — `Idempotency-Key`, intent reuse, 30m unpaid expiry, Order Details reconcile (see Phase 10 checked items).
- [x] **Checkout Payment summary (step 2)** — product image rows above payment methods; only product cards scroll when **>3**; page/methods do not scroll for ≤3.
- [x] **Buy now UX** — awaits add-to-cart with **no** “Struck the cart” toast; item remains in cart if checkout abandoned. Add to cart keeps the toast.
- [x] **Razorpay cancel copy** — native cancel shows “You have cancelled the Payment” (title stays Payment failed); not `undefined (BAD_REQUEST_ERROR)`.

> Upgrades for these shipped features are listed under **Upgrade shipped features** below — do not treat v1 as unfinished.
>
> **Branch sync (Oct 2026):** feature work merged **`todo` → `Nidavellir`** (PR #22). Prefer developing against **`Nidavellir`** (or a fresh branch off it). Keep Render dashboard deploy branch **`Nidavellir`** aligned with [`render.yaml`](render.yaml).

---

## Phase 10 — Reliability & security

> Prefer this phase before real money / store users. Do not implement until asked.

- [ ] **Automated tests** — Jest + Supertest for cart totals, coupons, webhook HMAC, order/payment paths, Rune XP award; RNTL for login → cart → checkout critical flows.
- [ ] **CI** — GitHub Actions: lint, typecheck, tests, and production builds on every PR.
- [x] **Payment / order reconciliation** — **Done.** In-process timer (`PAYMENT_RECONCILE_INTERVAL_MS`, default 5 min) while the dyno is awake + auto-check on `GET /orders/:id` (Order Details). For each `pending_payment`: if Razorpay shows captured → finalize via existing paid path; if still unpaid after **`PENDING_PAYMENT_EXPIRE_MINUTES` (default 30)** → cancel with `cancelReason: payment_expired` and mark Payment `failed`. Does **not** invent paid state without provider capture / verified `/confirm` / webhook. Razorpay `payment.failed` already marks Payment failed; expiry cleans abandoned **Orders**. Demo mode cannot fetch Razorpay — expiry is age-based only. Files: `payment.service.ts` (`reconcileOrderById` / `reconcileStalePending`), `payment-reconciler.ts`, `razorpay.provider.ts` (`findCapturedPayment`), `server.ts`.
- [x] **Idempotent checkout** — **Done.** Client sends `Idempotency-Key` (CheckoutScreen ref + `productRepository.createOrder`); `POST /orders` replays the same order (200 + `replayed: true`) on retry/double-tap. Unique sparse `order.idempotencyKey`. `POST /payments/intents` reuses an open Payment for the order (no second Razorpay order). Confirm/webhook use atomic Payment `paid` claim + Order `pending_payment` → `paid` with `runeXpAwarded` so XP/stock finalize once. Mobile also guards `submitting || paying` on place order.
- [ ] **Atomic inventory** — reserve stock on checkout; release on expiry/failure; `findOneAndUpdate` stock check so last unit cannot oversell. (Today stock decrements only on paid/COD; expiry does not need restore yet.)
- [x] **Unpaid order expiry** — **Done as part of reconciliation** (30 min default). Stock release on expiry still N/A until atomic inventory reservation lands.
- [ ] **Authz + rate limits audit** — OTP/login per phone + IP (SMS-bombing); refresh-token rotation / revoke / logout-other-devices; authorization on every user-owned resource.
- [ ] **Account deletion** — in-app request + confirmation (Play/App Store requirement) + documented retention for legal order records.
- [ ] **Data export / privacy controls** — user request for account data; document what is collected, retained, deleted (IP, avatars, visual-search policy).
- [ ] **Crash / error reporting** — Sentry or Firebase Crashlytics on mobile; structured API error tracking + latency metrics + alerts (failed payments / webhooks).
- [ ] **Mongo backups** — Atlas M0 has no automated backups; scheduled `mongodump` + restore drill; document recovery for users/orders/catalog.
- [ ] **Offline / timeout / duplicate-checkout** — regression tests for flaky network, app kill mid-pay, retry UX.
- [ ] **Seed safety guard** — block `npm run seed` from wiping production Atlas by accident.
- [ ] **Secrets hygiene / env separation** — distinct dev / staging / prod keys; never real Razorpay Live from a test build.

---

## Phase 11 — Customer operations & store

> Ops + compliance so the shop can run without a developer reseeding Atlas.

- [ ] **Shipment tracking** — manual timeline first (confirmed → processing → packed → shipped → out for delivery → delivered); carrier + tracking link later.
- [ ] **Invoice / PDF** — GST-ready tax invoice from trusted server order data (not client totals); Order Details download.
- [ ] **Refund status UI** — refund initiated → processed (pairs with existing cancel/return/exchange).
- [ ] **Support tickets** — order-linked Help & Support form (case number, status, attachments, response history); reuse FAQ RAG where useful.
- [ ] **Admin / CMS web** — protected admin for products, stock, orders, returns, coupons, Home banners, Drop Zone pool, bundle tags (replaces seed-only ops).
- [ ] **Custom Resend domain** — DNS auth so verify/order mail reaches any address (today limited by `onboarding@resend.dev`).
- [ ] **Push notifications (FCM / APNs)** — device tokens + backend fan-out; user preferences (order vs marketing); token lifecycle. (In-app Notifications API already exists.)
- [ ] **Smart push** — interest / cart / drop aware — needs FCM first.
- [ ] **Legal screens + public URLs** — Privacy Policy, Terms of Service, Refund/Return Policy (store rejection without these).
- [ ] **Consent copy** — camera / mic / photo upload; note that visual-search photos are not stored.
- [ ] **HTTPS / store deploy (remaining)**
  - Paid always-on host if Free cold starts are unacceptable.
  - Production builds: `dataSource: 'api'`, `allowMockFallback: false`, HTTPS API only.
  - Android: Play Console internal testing → release APK/AAB (`npm run gradlew-android`).
  - iOS: Apple Developer + TestFlight (signing, privacy nutrition labels, Razorpay URL schemes if needed).
  - CORS / TLS at host; Razorpay **Live** keys + webhook secret only when charging real money.
- [ ] **Uptime monitor** — external ping of `/health` (helps notice Render sleep / outages).

---

## Phase 12 — Discovery, retention & merchandising

### New product capabilities
- [ ] **Back-in-stock alerts** — wishlist / PDP subscribe; in-app notification now, push later; dedupe.
- [ ] **Price-drop alerts** — threshold or any drop; preferences + dedupe.
- [ ] **Product comparison** — 2–4 SKUs side-by-side (price, rating, specs, stock, discount).
- [ ] **PLP filters upgrade** — price range, franchise, rating, in-stock, size (beyond current sort).
- [ ] **Product variants** — size / color with per-variant stock (apparel without sizes is weak).
- [ ] **Search improvements** — recent + trending, typo tolerance / synonyms, autocomplete, zero-result analytics (Atlas Search if Mongo text is weak).
- [ ] **Reorder** — one-tap from past Order Details.
- [ ] **Deep links** — `nidavellir://product/:id` (+ web fallback) for share, push, marketing.
- [ ] **Gift options** — gift wrap / message / ship-to-someone-else.
- [ ] **Low-stock urgency** — “Only N left” on PDP/PLP.
- [ ] **COD safeguards** — COD limits / confirmation to cut fake COD and RTO.
- [ ] **Multiple Razorpay methods** — confirm UPI / wallets / EMI-Pay Later enabled and tested (India).
- [ ] **Referral program** — invite friend → XP + coupon (fits Rune XP).
- [ ] **Abandoned cart reminders** — Resend email now; push later.
- [ ] **Product analytics** — views, search, ATC, checkout start, payment outcome, orders (PostHog / Firebase / Mixpanel); avoid unnecessary PII.
- [ ] **App rating prompt** — after successful delivery.
- [ ] **Wishlist sharing** + move wishlist → cart.
- [ ] **Limited-drop waitlist** — notify-me / queue for hot Drop Zone SKUs.
- [ ] **Franchise hubs / collector showcase** — lore or “shelf” of purchased items (brand differentiator).
- [ ] **Pre-order products** — inventory + pricing + cart rules before UI.
- [ ] **Mystery boxes** — inventory + pricing + cart rules before UI.
- [ ] **Community blog**.

### Upgrade shipped features
- [ ] **AI Merch Assistant (upgrade)** — budget / franchise / “setup under ₹X” intents; product cards with live price/stock/PDP links; confirm before cart mutations; tool-level authz (never leak other users’ data); rate / cost / timeout limits + safe fallbacks.
- [ ] **Visual search (upgrade)** — optional budget/category/franchise/availability filters; related matches when no exact hit; never invent SKUs; track view/purchase conversion.
- [ ] **For you (upgrade)** — stronger signals / feedback loop (optional); keep guests → bestsellers fallback.
- [ ] **Rune XP (upgrade)** — auditable server ledger; no double-award per order; redemption catalogue / tier perks (free shipping, early Drop Zone, exclusive coupons); define economics before redeem.
- [ ] **All Reviews (upgrade)** — verified-purchase badge; helpful votes; customer photo reviews; report / moderation (“How they get along” / customer images).
- [ ] **Character Vault (upgrade)** — licensed idle-loop GLBs; CDN assets; more champions; keep New Arch off until Voice/Razorpay/Reanimated spike passes.
- [ ] **Bundles / Drop Zone / banners (upgrade)** — server CMS for creatives + eligible pool (no app release / re-seed for art changes).
- [ ] **Cart / checkout (upgrade)** — payment retry after failure; clearer discount/shipping breakdown; cold-start **“Waking the forge…”** UX when Render sleeps; preserve draft state safely.
- [ ] **Sessions (upgrade)** — polish logout-all / revoke-other-devices if gaps remain after Devices UI.

---

## Phase 13 — Premium UX & release polish

- [ ] **Gaming setup builder** — interactive loadout (keyboard/mouse/headset/desk/…); combined price; save/share; add available items to cart; optional compatibility + budget (expands “Make your own Gaming Setup”; can pair with AI intents).
- [ ] **Accessibility audit** — screen-reader labels, scalable text, contrast, ≥44px targets, reduced motion.
- [ ] **Performance baselines** — cold start, PLP scroll, images, Character Vault on mid-range Android + supported iOS.
- [ ] **Skeleton loaders** — Home / PLP instead of bare spinners where missing.
- [ ] **Offline banner** + safe cached browse when offline.
- [ ] **Image CDN** — resized WebP/AVIF (Cloudinary / ImageKit).
- [ ] **Force-update / maintenance mode** — block broken old clients.
- [ ] **Remote feature flags** — server-driven toggles for visual search / AI / vault (vs rebuild `appConfig.ts`).
- [ ] **Biometric app lock** — Face ID / fingerprint (Keychain already holds tokens).
- [ ] **Localization** — Hindi (optional) + consistent ₹ formatting.
- [ ] **Dark mode toggle** (optional — current brand is light esports).
- [ ] **AR view-in-room** for posters/figures (optional demo piece; heavy).
- [ ] **Staging vs production** app configs + production smoke tests, rollback plan, incident/recovery runbook.
- [ ] **API min-app-version check** — break API safely without bricking old installs.
- [ ] **Seasonal events** — Comic-Con-style sales driven by server config / admin.

---

### Notes for implementers
- Visual search v1: photos stay in memory on the API; set a vision-capable `OPENAI_VISION_MODEL` if `OPENAI_MODEL` is text-only (e.g. some Groq chat models). Smart pushes still need FCM.
- Anime chip uses `tag=anime` (seed already tags anime franchises). Do not add a fifth product `category` for anime — that would steal items from apparel/collectibles.
- AI assistant: set `AI_ENABLED` + optional `OPENAI_*` on Render; without a key the API uses stub intents + real commerce tools.
- Pre-order and mystery boxes need inventory + pricing + cart rules before UI.
- After bundle seed changes on Render, run seed against Atlas (or redeploy with seed job) so live API gets `bundleTag` products.
- Drop Zone: do **not** re-seed daily — only re-seed when changing the `drop-zone-eligible` pool. Cart tab has no stack back chevron (avoids unhandled `GO_BACK`).
- Character Vault (v1 shipped): dedicated stack screen (not mid-Home Filament); one `FilamentScene`, `addToScene` per character; Kid Levi idle is clip **8** (not 0); Goku/Vegeta stay `enableIdleAnimation: false`; loader clears ~1.2s after decode; CTA press + hover fill; warm GLBs from Home teaser (`preloadVaultModels`); metro `assetExts: glb`; CDN/licensed GLBs before store ship; don’t flip New Arch until Voice/Razorpay/Reanimated pass on spike.
- Email template edits: `apps/api/src/integrations/email/email.factory.ts` → push → redeploy Render.
- **Account deletion** is a store requirement (Google Play / Apple), not a nice-to-have — schedule with Phase 10/11 legal screens.
- **Atlas M0** has no automatic backups — treat Phase 10 mongodump as mandatory before real orders.
- **Variants** before scaling apparel; **admin CMS** before relying on seed for day-to-day ops.
- Payment webhook + client `/confirm` are complementary: reconcile from trusted provider data; every money transition must be safe to retry.
- **Idempotent checkout / reconcile (shipped):** always send a fresh `Idempotency-Key` per checkout attempt (CheckoutScreen regenerates after success). Replays return the same order — do not treat 200+`replayed` as a new purchase. Tune `PENDING_PAYMENT_EXPIRE_MINUTES` / `PAYMENT_RECONCILE_INTERVAL_MS` in API env. Reconciler only runs while Render dyno is awake; Order Details `GET /orders/:id` also reconciles that order.
- Prefer Phase **10 → 11 → 12 → 13** unless the immediate goal is a college demo (then tests + one standout like setup builder + signed release may be enough).
- **Docs / branch:** after PR #22, `origin/todo` and `origin/Nidavellir` share the payment + register/checkout UX commits. Next work: branch from **`Nidavellir`**, keep `TODO.md` / `PROJECT_PROGRESS.md` updated when shipping.
