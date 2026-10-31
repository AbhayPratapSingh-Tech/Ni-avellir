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
- [x] **Atomic inventory** — reserve at order create; release on unpaid cancel/expire; no oversell on concurrent last-unit checkout.
- [x] **Checkout Payment summary (step 2)** — product image rows above payment methods; only product cards scroll when **>3**; page/methods do not scroll for ≤3.
- [x] **Buy now UX** — awaits add-to-cart with **no** “Struck the cart” toast; item remains in cart if checkout abandoned. Add to cart keeps the toast.
- [x] **Razorpay cancel copy** — native cancel shows “You have cancelled the Payment” (title stays Payment failed); not `undefined (BAD_REQUEST_ERROR)`.
- [x] **Privacy Policy + Contact + Raise a query** — in-app Privacy Policy; Contact → `Contact Nidavellir`; Support → 3 tabs (`Support Tickets` / `Support Commerce` / `Support Account App`) + local query list + Mark Resolved. Entry points: drawer, Profile, Login/Signup Need Help, Returns, Order Details, FAQ.

> Upgrades for these shipped features are listed under **Upgrade shipped features** below — do not treat v1 as unfinished.
>
> **Branch sync (Oct 2026):** feature work merged **`todo` → `Nidavellir`** (PR #22). Prefer developing against **`Nidavellir`** (or a fresh branch off it). Keep Render dashboard deploy branch **`Nidavellir`** aligned with [`render.yaml`](render.yaml).

---

## Engineering portfolio roadmap (production craft)

> Portfolio-oriented backlog (atomic inventory, idempotent money paths, consistency, observability).  
> **Do not implement until asked.** Prefer depth + proof (tests + docs) over checking every box.  
> Overlaps Phase **10–13** below — when shipping, tick **both** the E-item and the matching Phase 10–13 row.

### Scorecard (25 roadmap items)

| Phase | Done | Partial | Open | Notes |
|-------|------|---------|------|-------|
| **E1** Transaction correctness | 2 | 2 | 1 | Inventory + idempotent pay shipped; pricing/XP/state machine gaps |
| **E2** Security & data integrity | 2 | 2 | 1 | Rate limits + order-history and best-seller indexes shipped; authz tests and coupon atomics open |
| **E3** Reliability engineering | 1 | 2 | 2 | CI gates shipped; reconciler + pino partial; outbox / Jest / backups open |
| **E4** Scale & mobile quality | 0 | 1 | 4 | Local `appConfig` flags only |
| **E5** Advanced product engineering | 0 | 1 | 4 | AI tools v1; visual-search scorecard shipped, photo baseline open; no RAG eval / admin / setup builder |
| **Total** | **~5** | **~8** | **~12** | “Done” = production-shaped + documented; partial still counts as backlog |

**Strongest next bet (portfolio):** close **E1** (server discount + order state machine + XP ledger) → concurrent/idempotency **tests** (CI already runs the suite; today it is a no-op) → then **E3** request IDs. Product wow (setup builder / AI eval) after foundations.

---

### E1 — Transaction correctness

- [x] **Atomic inventory reservation + expiry** — `reserveStock` / `releaseStock` (`orders/inventory.ts`); unpaid cancel + `payment_expired` release; no second decrement on paid. *Still open:* concurrent load proof test (e.g. 100 req / 10 units) + short craft write-up in `PROJECT_INSIGHTS.md`.
- [x] **Idempotent checkout + payment webhooks** — `Idempotency-Key`, unique sparse index, intent reuse, HMAC webhook + `/confirm` atomic claim, `runeXpAwarded` once. *Still open:* automated replay tests (order + webhook).
- [ ] **Server-authoritative checkout (close the gap)** — **Partial today:** line prices/shipping/tax from server (`Product` + serviceability); order lines snapshot `price` / `lineTotal`. **Gap:** `POST /orders` still accepts client `discount` (`order.service.ts`) — must recompute from coupon code server-side only; reject client totals/prices.
- [ ] **Order state machine** — statuses exist (`pending_payment` → `paid`/`confirmed` / `cancelled` / return fields) but transitions are ad hoc. Add explicit allowed-transition map + enforce on cancel / pay / ship / return / refund; reject illegal updates under concurrency.
- [ ] **Immutable Rune XP ledger** — **Partial today:** mutable `user.runeXp` + `order.runeXpAwarded` + profile recompute from orders. Replace/augment with ledger entries (`ORDER_EARN`, refund reversal, admin adjust) unique on business ref; derive balance from ledger.

---

### E2 — Security and data integrity

- [ ] **Resource-level authorization tests** — **Partial today:** orders/list/detail/cancel/return check JWT `userId`; AI order tools documented as ownership-aware. **Open:** automated “user A cannot read/cancel user B” suites for orders, addresses, sessions, wishlist, payments.
- [x] **Rate limiting + OTP abuse protection** — **Done.** In-memory IP limits in `ip-rate-limit.ts`: OTP/reset/verify-email send **5/min** (`error.type`: `otp_limit_per_minute_reached`); login 10/15 min; register + OTP verify + reset confirm 30/15 min; coupon validate and apply-coupon share 20/min; `POST /orders` and `POST /payments/intents` share 10/min; visual search 10/min. Each 429 includes `error.type` and a “limit reached” message. AI chat is not limited. Per phone/email **60s** cooldown before a new code replaces the old one (`auth.service.ts`). Five guesses per challenge unchanged. Razorpay webhook is not limited. *Still open:* Redis (or another shared store) if more than one API instance; automated 429 tests.
- [ ] **Coupon concurrency + duplicate-redemption prevention** — validate path checks `usedCount` but no atomic claim; order create can take a raw `discount`. Need conditional `$inc` / reservation at checkout + unique redemption records per user/order.
- [x] **Database indexes + query profiling** — **Done for this pass.** Orders `{ userId: 1, createdAt: -1 }`; products `{ stock: 1, reviewCount: -1 }` for best sellers. `npm run explain:queries --workspace apps/api` prints local `executionStats` for order history, category list, name regex search, and best sellers, and refuses Atlas. *Still open:* name search is a collection scan until a real search engine; do not seed a huge fake catalog into Atlas. Targets: order history and category list should use an index as those collections grow. Not a CI gate.
- [ ] **Safe session revocation + token handling** — **Partial today:** refresh revoke + Devices UI. **Open:** revoke-other / logout-all polish, rotation guarantees, authz tests on session endpoints (ties Phase 12 Sessions upgrade).

---

### E3 — Reliability engineering

- [ ] **Transactional outbox + background job retries** — emails / notifications / XP side-effects today are best-effort inline. Add outbox (or DB job queue) so order success isn’t blocked by Resend; at-least-once + idempotent consumers. (No Kafka required.)
- [ ] **Payment reconciliation + refund recovery** — **Partial today:** in-process reconciler + Order Details reconcile + 30m expiry. **Open:** refund/return saga (idempotent Razorpay refunds, loyalty reversal retry, incomplete-step recovery).
- [ ] **Structured logs, request IDs, error monitoring** — **Partial today:** `pino` / `pino-http`. **Open:** correlation / request IDs across API + jobs; Sentry (or similar) on API + mobile; payment/webhook error alerts.
- [ ] **Database backup restoration drills** — Atlas M0 has no auto backups; scheduled `mongodump`, restore into a scratch DB, document RPO/RTO (same as Phase 10 Mongo backups).
- [x] **CI/CD quality gates** — **Done.** GitHub Actions `.github/workflows/ci.yml` on every PR and on push to `Nidavellir`: `npm ci`, lint, typecheck, workspace tests, production `tsc` build (`ubuntu-latest`, Node from `.nvmrc`). ESLint parses TypeScript. *Still open:* Jest/Supertest/RNTL (workspace `test` scripts exit 0); branch protection requiring status **check**; Fastlane / native release builds.

---

### E4 — Scale and mobile quality

- [ ] **Load testing + performance budgets** — k6 (or similar) for browse/search/login/checkout against staging; track p95/error rate; never load-test live Razorpay with real charges.
- [ ] **Offline-aware data + cache sync** — safe product/account cache, stale vs fresh, queue **non-money** actions; money paths stay server-idempotent (ties Phase 13 offline banner).
- [ ] **API backward compatibility** — additive changes, deprecation notes, `min-app-version` / force-update (Phase 13). Keep `/api/v1` stable.
- [ ] **Feature flags + controlled rollouts** — **Partial today:** compile-time `appConfig.features.*`. **Open:** remote flags / kill switches without app release (Phase 13).
- [ ] **Real-device release testing + crash monitoring** — Play/TestFlight smoke + Crashlytics/Sentry (Phase 10 crash reporting + Phase 11 store deploy).

---

### E5 — Advanced product engineering

- [ ] **RAG evaluation + AI tool security** — **Partial today:** tools + knowledge search + order ownership notes (`AI_BACKEND_CONTRACT.md`). **Open:** eval set (groundedness, tool choice, latency/cost); prompt-injection / data-leak tests; harden tool arg validation (Phase 12 AI upgrade).
- [ ] **Visual search evaluation** — **Harness shipped, baseline not recorded.** `npm run eval:visual-search --workspace apps/api` checks hint parsing, a missing key (`vision_unavailable`, empty list), and that a fake SKU in the model JSON never becomes a product. Eight seeded Kengan photos plus two blank images print whether the expected slug is in the top 20. A miss does not fail the run; a slug that is not in the database does. Local Mongo only (refuses Atlas). Not a CI gate. *Still open:* run it once on a seeded local DB and keep that hit rate when `OPENAI_VISION_MODEL` or the prompt changes. Phase 12 filters / related matches stay separate.
- [ ] **Gaming Setup Builder + compatibility rules** — Phase 13 standout product piece (loadout, budget, cart).
- [ ] **Product discovery analytics** — zero-result search, click/ATC/checkout funnel (Phase 12 product analytics / search improvements).
- [ ] **Admin audit logs + operational dashboards** — who changed stock/price/coupon/order; pairs with Phase 11 Admin CMS (don’t build dashboards without authz + audit).

---

### Also recommended (beyond the 25 — add when E1–E3 solid)

- [ ] **Optimistic concurrency** — version / `If-Match` on order or address updates so stale writes fail closed.
- [ ] **Inventory movement history** — every stock Δ records reason, source order/payment, actor, timestamp (audit + reconcile).
- [ ] **Refund / return orchestration (saga)** — explicit steps + compensations (overlaps E3 refund recovery).
- [ ] **Delivery promise rules engine** — deepen beyond pincode ETA (processing days, holidays, stock).
- [ ] **Secrets / env separation + incident runbooks** — already listed in Phase 10/13; keep as ops proof for employers.

---

## Phase 10 — Reliability & security

> Prefer this phase before real money / store users. Do not implement until asked.  
> Cross-link: **E2** authz/rate limits, **E3** outbox/logs/backups (CI gates shipped), **E1** money-path tests.

- [ ] **Automated tests** — Jest + Supertest for cart totals, coupons, webhook HMAC, order/payment paths, Rune XP award, **concurrent inventory**, **idempotent replay**, **authz denial**; RNTL for login → cart → checkout. (= **E3** tests + **E1/E2** proof)
- [x] **CI** — **Done.** GitHub Actions `.github/workflows/ci.yml`: lint, typecheck, workspace tests, and production builds on every PR and on push to `Nidavellir` (job `check`, `ubuntu-latest`, Node `.nvmrc`). Root `npm run lint`. ESLint uses `@typescript-eslint/parser`. *Still open:* real Jest/Supertest/RNTL (the test step is a placeholder that exits 0); require status check `check` in branch protection; Android/iOS release builds stay out of this job. (= **E3** CI/CD)
- [x] **Payment / order reconciliation** — **Done.** In-process timer (`PAYMENT_RECONCILE_INTERVAL_MS`, default 5 min) while the dyno is awake + auto-check on `GET /orders/:id` (Order Details). For each `pending_payment`: if Razorpay shows captured → finalize via existing paid path; if still unpaid after **`PENDING_PAYMENT_EXPIRE_MINUTES` (default 30)** → cancel with `cancelReason: payment_expired` and mark Payment `failed`. Does **not** invent paid state without provider capture / verified `/confirm` / webhook. Razorpay `payment.failed` already marks Payment failed; expiry cleans abandoned **Orders**. Demo mode cannot fetch Razorpay — expiry is age-based only. Files: `payment.service.ts` (`reconcileOrderById` / `reconcileStalePending`), `payment-reconciler.ts`, `razorpay.provider.ts` (`findCapturedPayment`), `server.ts`.
- [x] **Idempotent checkout** — **Done.** Client sends `Idempotency-Key` (CheckoutScreen ref + `productRepository.createOrder`); `POST /orders` replays the same order (200 + `replayed: true`) on retry/double-tap. Unique sparse `order.idempotencyKey`. `POST /payments/intents` reuses an open Payment for the order (no second Razorpay order). Confirm/webhook use atomic Payment `paid` claim + Order `pending_payment` → `paid` with `runeXpAwarded` so XP/stock finalize once. Mobile also guards `submitting || paying` on place order.
- [x] **Atomic inventory** — **Done.** `reserveStock` at `POST /orders` (`findOneAndUpdate` with `stock >= qty` then `$inc: -qty`) for COD + Razorpay pending. Concurrent last-unit checkouts: one wins, other **422**. On paid: no second decrement. On unpaid cancel / `payment_expired`: `releaseStock` once after atomic `pending_payment` → `cancelled`. Helpers: `orders/inventory.ts`.
- [x] **Unpaid order expiry** — **Done as part of reconciliation** (30 min default) + **releases reserved stock** on expire.
- [ ] **Authz + rate limits audit** — **Rate limits done** (see E2): OTP/reset/verify-email send **5/min/IP** plus a 60s per-phone/email cooldown; login, register, coupons, checkout, and visual search return `error.type` on 429. AI chat is not limited. **Still open:** refresh-token rotation / revoke / logout-other-devices; authorization on every user-owned resource. (= **E2**)
<!-- - [ ] **Account deletion** — in-app request + confirmation (Play/App Store requirement) + documented retention for legal order records. -->
- [x] **Privacy controls (in-app policy)** — **Done as Privacy Policy screen** (collection / retention / deletion for IP, avatars, visual search, sessions, payments). Contact + Raise a query forms post to Google Sheets (not a GDPR data-export API).
- [ ] **Crash / error reporting** — Sentry or Firebase Crashlytics on mobile; structured API error tracking + latency metrics + alerts (failed payments / webhooks). (= **E3** monitoring + **E4** crash)
- [ ] **Mongo backups** — Atlas M0 has no automated backups; scheduled `mongodump` + restore drill; document recovery for users/orders/catalog. (= **E3** backup drills)
- [ ] **Offline / timeout / duplicate-checkout** — regression tests for flaky network, app kill mid-pay, retry UX. (= **E4** offline + money-path UX)
- [ ] **Seed safety guard** — block `npm run seed` from wiping production Atlas by accident.
- [ ] **Secrets hygiene / env separation** — distinct dev / staging / prod keys; never real Razorpay Live from a test build.
- [ ] **Server-authoritative discount** — stop trusting client `discount` on `POST /orders`; bind coupon redemption atomically (= **E1** pricing gap + **E2** coupons).
- [ ] **Order status transition guard** — central allowed-transition map (= **E1** state machine).
- [ ] **Rune XP ledger collection** — immutable earn/reverse entries; unique business refs (= **E1** ledger + Phase 12 Rune XP upgrade).
- [ ] **Request ID / correlation logging** — propagate across checkout → payment → webhook/reconcile (= **E3** observability).
- [ ] **Transactional outbox (email / notify)** — order commit then reliable side-effects (= **E3** outbox).

---

## Phase 11 — Customer operations & store

> Ops + compliance so the shop can run without a developer reseeding Atlas.

- [ ] **Shipment tracking** — manual timeline first (confirmed → processing → packed → shipped → out for delivery → delivered); carrier + tracking link later.
- [ ] **Invoice / PDF** — GST-ready tax invoice from trusted server order data (not client totals); Order Details download.
- [ ] **Refund status UI** — refund initiated → processed (pairs with existing cancel/return/exchange).
- [ ] **Support tickets (server-backed)** — **Sheets + local case/status v1 done** (`RaiseQuery` / `supportQueryStore`). Still open: API-backed tickets, attachments, staff reply history, FAQ RAG.
- [ ] **Admin / CMS web** — protected admin for products, stock, orders, returns, coupons, Home banners, Drop Zone pool, bundle tags (replaces seed-only ops).
- [ ] **Custom Resend domain** — DNS auth so verify/order mail reaches any address (today limited by `onboarding@resend.dev`).
- [ ] **Push notifications (FCM / APNs)** — device tokens + backend fan-out; user preferences (order vs marketing); token lifecycle. (In-app Notifications API already exists.)
- [ ] **Smart push** — interest / cart / drop aware — needs FCM first.
- [ ] **Legal screens + public URLs** — **Privacy Policy in-app done** (`PrivacyPolicy`). Still open: Terms of Service, public web URLs, Refund/Return Policy page (Returns screen exists; store may still want a dedicated policy URL).
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
- [ ] **Rune XP (upgrade)** — auditable server ledger (= **E1**); no double-award per order; redemption catalogue / tier perks (free shipping, early Drop Zone, exclusive coupons); define economics before redeem.
- [ ] **All Reviews (upgrade)** — verified-purchase badge; helpful votes; customer photo reviews; report / moderation (“How they get along” / customer images).
- [ ] **Character Vault (upgrade)** — licensed idle-loop GLBs; CDN assets; more champions; keep New Arch off until Voice/Razorpay/Reanimated spike passes.
- [ ] **Bundles / Drop Zone / banners (upgrade)** — server CMS for creatives + eligible pool (no app release / re-seed for art changes).
- [ ] **Cart / checkout (upgrade)** — payment retry after failure; clearer discount/shipping breakdown; cold-start **“Waking the forge…”** UX when Render sleeps; preserve draft state safely.
- [ ] **Sessions (upgrade)** — polish logout-all / revoke-other-devices if gaps remain after Devices UI.

---

## Phase 13 — Premium UX & release polish

- [ ] **Gaming setup builder** — interactive loadout (keyboard/mouse/headset/desk/…); combined price; save/share; add available items to cart; optional compatibility + budget (= **E5**; pairs with AI intents).
- [ ] **Accessibility audit** — screen-reader labels, scalable text, contrast, ≥44px targets, reduced motion.
- [ ] **Performance baselines** — cold start, PLP scroll, images, Character Vault on mid-range Android + supported iOS. (= **E4** budgets; measure before/after)
- [ ] **Skeleton loaders** — Home / PLP instead of bare spinners where missing.
- [ ] **Offline banner** + safe cached browse when offline. (= **E4** offline-aware)
- [ ] **Image CDN** — resized WebP/AVIF (Cloudinary / ImageKit).
- [ ] **Force-update / maintenance mode** — block broken old clients. (= **E4** compatibility)
- [ ] **Remote feature flags** — server-driven toggles for visual search / AI / vault (vs rebuild `appConfig.ts`). (= **E4** flags)
- [ ] **Biometric app lock** — Face ID / fingerprint (Keychain already holds tokens).
- [ ] **Localization** — Hindi (optional) + consistent ₹ formatting.
- [ ] **Dark mode toggle** (optional — current brand is light esports).
- [ ] **AR view-in-room** for posters/figures (optional demo piece; heavy).
- [ ] **Staging vs production** app configs + production smoke tests, rollback plan, incident/recovery runbook. (= **E3/E6** ops)
- [ ] **API min-app-version check** — break API safely without bricking old installs. (= **E4** compatibility)
- [ ] **Load testing (staging)** — browse/search/checkout concurrency budgets (= **E4**); never against live Razorpay charges.
- [ ] **Seasonal events** — Comic-Con-style sales driven by server config / admin.

---

### Notes for implementers
- Visual search v1: photos stay in memory on the API. Live Render chat model is `llama-3.3-70b-versatile` (text). `OPENAI_VISION_MODEL` must stay set (`meta-llama/llama-4-scout-17b-16e-instruct`) or camera search falls back to that text model and returns `vision_unavailable`. Score a prompt or model change with `npm run eval:visual-search --workspace apps/api` against seeded local Mongo (the script refuses Atlas). The eight Kengan fixtures are already on the live catalog. Smart pushes still need FCM.
- Anime chip uses `tag=anime` (seed already tags anime franchises). Do not add a fifth product `category` for anime — that would steal items from apparel/collectibles.
- AI assistant: set `AI_ENABLED` + optional `OPENAI_*` on Render; without a key the API uses stub intents + real commerce tools. Do not point chat `OPENAI_MODEL` at the vision model — keep `llama-3.3-70b-versatile` for chat and `OPENAI_VISION_MODEL` for photos.
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
- **Atomic inventory (shipped):** stock is held at order create. Do not `$inc` stock again in `finalizePaidOrder`. Always release via cancel/expire claim on `pending_payment` only (never double-release).
- **CI (shipped):** `.github/workflows/ci.yml` runs on every PR and on push to `Nidavellir` (`npm ci`, `npm run lint`, `npm run typecheck`, `npm run test --workspaces`, `npm run build`). Node is `.nvmrc` (20.20.2). Workspace `test` scripts still echo and exit 0 until Jest lands. Require status check `check` under branch protection so a PR cannot merge while CI is pending or red. Do not put `gradlew-android` in this job.
- **Abuse limits (shipped):** OTP, password-reset, and verify-email sends are **5/min/IP** (`otp_limit_per_minute_reached`) plus a 60s cooldown per phone or email and purpose, enforced before `deleteMany`. Every blocked call returns `429` with `error.type` and a “limit reached” message. Do not add a limiter on AI chat or the Razorpay webhook. Checkout limit is shared by order create and payment intent (10/min/IP) so retries of an idempotent checkout still fit. Limits are in-memory on one dyno.
- **Indexes (shipped):** order history uses `{ userId, createdAt }`. Best sellers use products `{ stock, reviewCount }`. Run `npm run explain:queries --workspace apps/api` against local Mongo only.
- Prefer **Engineering roadmap E1 → E2 → E3**, then product Phase **11 → 12 → 13**, unless the immediate goal is a college demo (then concurrency tests + one standout like setup builder + signed release may be enough).
- **Portfolio proof:** for each E-item you ship, keep (1) code, (2) automated failure/concurrency test, (3) short evidence, (4) craft note in `PROJECT_INSIGHTS.md` — checklist alone is weak.
- **Caveat:** Razorpay capture and inventory are not one Mongo transaction — design for independent failure (already partly handled via reserve → pay → reconcile/expire).
- **Docs / branch:** after PR #22, prefer branch from **`Nidavellir`**, keep `TODO.md` / `PROJECT_PROGRESS.md` updated when shipping.
