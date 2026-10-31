# Project Insights

This file is a guide for future AI assistants and contributors working on Nidavellir.

## Operating Rules

- Do not write implementation code until Phase 1 is explicitly approved.
- Phase 2 cannot begin until every required decision in `ARCHITECTURE.md` section 16 is answered.
- Ask when requirements are ambiguous.
- Keep changes production-oriented and scoped.
- Maintain documentation as the project evolves.
- Preserve the phase-based process in `PROJECT_PROGRESS.md`.
- Run required checks after implementation phases once scripts exist: lint, typecheck, tests, and build.
- Never add secrets, real credentials, private keys, or provider tokens to the repository.
- Prefer explicit architecture and contracts over hidden assumptions.
- **Never run `git commit` or `git push` unless the user explicitly asks to commit/push in that turn.** Offering commit message lines is OK; committing is not. See `AI_AGENT_GUIDE.md` non‑negotiable #7.

## Product Intent

Nidavellir is intended to become a real premium gaming merchandise marketplace, not a demo app. Design decisions should support real users, real inventory, real payments, real media hosting, native app-store releases, and real operations.

## Current Stack Direction

- Mobile: bare React Native Community CLI with permanently committed `ios/` and `android/` native projects.
- Language: TypeScript with `"strict": true` from day one.
- Backend: Node.js, Express.js, TypeScript.
- Database: MongoDB with Mongoose.
- API style: REST, versioned under `/api/v1`.
- Auth: JWT access tokens, rotating refresh tokens, RBAC.
- Secure mobile token storage: `react-native-keychain`.
- Media: Cloudinary.
- Push notifications: **planned** FCM (Android) + APNs (iOS) via backend; **today** in-app Notifications inbox only (`/api/v1/notifications`). See `TODO.md`.
- CI: GitHub Actions (`.github/workflows/ci.yml`) on every pull request and on push to `Nidavellir` — lint, typecheck, workspace tests, production build. Fastlane native release builds are still planned.
- Monorepo tooling: Turborepo.
- Documentation: Swagger/OpenAPI plus repository markdown docs.

## Important Architecture Corrections

- Do not add Expo, EAS Build, EAS Update, `expo-dev-client`, `expo-secure-store`, `expo-image`, or Expo config-plugin workflows.
- Do not plan Microsoft App Center CodePush. It was retired on March 31, 2025.
- Do not add OTA update dependencies for MVP. JS and native changes ship together through store releases.
- Use `.tsx` for React components and `.ts` for non-component TypeScript files.
- Avoid `.jsx` and `.js` in `apps/mobile` and `apps/api` except where tooling strictly forces plain JavaScript config files.
- Do not install `xss-clean`; it is deprecated/unmaintained. Select a maintained sanitizer during Phase 4.
- Testing coverage target is not universal 100%. Use 80-90% as a health metric, with near-100% coverage for money/security-critical logic.

## How AI Assistants Should Work Here

1. Read `AI_AGENT_GUIDE.md` first (alignment checklist), then `ARCHITECTURE.md`, `PROJECT_PROGRESS.md`, `TODO.md`, and this file before editing.
2. Check the current phase and approval status.
3. Inspect the repository before changing files.
4. If the user asks for implementation before Phase 1 approval, remind them of the gate and ask for explicit approval.
5. Keep explanations educational because the project is also meant to teach backend, database, native mobile, and production architecture.
6. Avoid placeholder code unless the user explicitly accepts a temporary scaffold.
7. Update `CHANGELOG.md` for meaningful documentation or code changes.
8. Update `TODO.md` when tasks are added, completed, or deferred.
9. Use `LOCAL_COMMANDS.md` as a machine-local command notebook when present, but never commit it.
10. Keep mock and live API paths aligned (repository + `appConfig`); never break `intent.demoMode` payment branching.

## Local-Only Files

- `LOCAL_COMMANDS.md` is intentionally ignored by git. It is for this machine's command cheat sheet: installs, Android/iOS runs, debug builds, release builds, APK/AAB commands, backend commands, Docker, and quality gates.
- Do not put secrets in local command docs.
- If a command becomes part of the official workflow, promote it into committed documentation after user approval.

## Engineering Standards

- Strict TypeScript.
- Feature-first organization.
- Shared validation where contracts cross app/API boundaries.
- Centralized error handling.
- Consistent API response envelopes.
- Secure auth and token storage.
- Indexed database queries.
- Automated tests for every implemented feature.
- Small reusable UI components.
- Performance checks for product lists and animation-heavy screens.
- Native iOS and Android projects treated as real source code, not generated throwaway output.

## Craft patterns — skills worth knowing

Patterns that solid commerce / API projects get right. Knowing *why* these exist is more valuable than memorizing our file names. When we ship another one, **add it here** (short: problem → approach → where). Do not decorate these with branch/PR/git status — the pattern is the point.

### Atomic inventory (reserve / release)

- **Problem:** Two checkouts racing the last unit can both “succeed” if stock is read then written separately (oversell).
- **Approach:** Hold stock with a conditional update (`stock >= qty` then `$inc: -qty`) at order create; release only when an unpaid order is cancelled or expired; never decrement again on paid finalize.
- **Where:** `apps/api/src/modules/orders/inventory.ts`, order create + unpaid cancel / `payment_expired`.
- **Live check:** concurrent last-unit → one `201` / one `422`; cancel restores catalog stock.

### Idempotent checkout

- **Problem:** Double-tap / retry on place-order creates duplicate orders or duplicate Razorpay intents.
- **Approach:** Client `Idempotency-Key` on `POST /orders`; server replays the same order; payment intents reuse an open Payment row; paid claim is atomic (`runeXpAwarded` once).
- **Where:** order create + payments intents/confirm/webhook; mobile Checkout key + submit guard.

### Payment reconciliation + unpaid expiry

- **Problem:** Client dies after pay, or abandons `pending_payment` forever — money and inventory drift.
- **Approach:** Reconcile against provider capture; expire unpaid after a TTL and release held stock. Never invent “paid” without capture / verified confirm / webhook.
- **Where:** `payment.service.ts` reconcile paths, `payment-reconciler.ts`, Order Details auto-check.

### Critical money paths (no silent fake paid)

- **Problem:** Mock fallbacks that invent paid orders in live API mode corrupt trust and ops.
- **Approach:** Repository `critical: true` for create order / payment confirm when `dataSource === 'api'`; branch Razorpay UI on `intent.demoMode`.
- **Where:** `productRepository`, `appConfig`, Checkout.

### Side-effect resilience (register vs email)

- **Problem:** Signup fails with 500 because a verify-email send failed after the user was already created.
- **Approach:** Persist the primary action first; return success with a soft flag if a non-critical side effect fails (`emailVerification.sent: false`).
- **Where:** `POST /auth/register`.

### Webhook idempotency

- **Problem:** Payment providers retry webhooks; naive handlers double-apply paid / stock / XP.
- **Approach:** Record processed event ids; claim payment/order state atomically before side effects.
- **Where:** Razorpay webhook + `PaymentWebhookEvent`.

### CI quality gates

- **Problem:** A pull request can merge broken TypeScript, lint, or a production compile if those checks only run on one laptop.
- **Approach:** One GitHub Actions job (`ubuntu-latest`) runs `npm ci`, lint, typecheck, workspace tests, and `npm run build` on every pull request and on every push to `Nidavellir`. Node comes from `.nvmrc`. ESLint uses `@typescript-eslint/parser` so `.ts` / `.tsx` parse. The job does not build an Android APK or iOS app.
- **Where:** `.github/workflows/ci.yml`, root `package.json` `lint` script, `.eslintrc.cjs`.
- **Live check:** Actions run **CI / check** goes green on the pull request and again on the merge push. Workspace `test` scripts still exit 0 with no Jest suite — that gate is the workflow, not proof of cart or payment behavior. Require the `check` status in branch protection so a pending or red run blocks merge.

### Abuse limits (IP + OTP cooldown)

- **Problem:** An IP-only cap does not stop many addresses from texting one phone, and a dyno restart clears the in-memory counter. Coupon guessing and checkout spam can reserve stock or probe codes.
- **Approach:** Keep `express-rate-limit` in process memory (no Redis). OTP, reset, and verify-email **sends** are **5/minute/IP**, and the same phone or email cannot get another code for that purpose for **60 seconds** (checked before the old challenge is deleted). A blocked call returns `429` with `error.type` (for example `otp_limit_per_minute_reached`) and a “limit reached” message. Login is its own bucket: **10 / 15 minutes / IP**. Register, OTP verify, and reset confirm stay **30 / 15 minutes / IP**. AI chat is not limited. Coupon validate and cart apply-coupon **share 20/minute**. `POST /orders` and `POST /payments/intents` **share 10/minute** so idempotent retries still fit. Visual search stays **10/minute**. Wrong OTP is still **5 guesses** on that challenge. The Razorpay webhook is not limited. `trust proxy` is 1 so Render’s limiter sees the client IP, not the proxy. A second API instance needs a shared store later.
- **Where:** `apps/api/src/common/middleware/ip-rate-limit.ts`; cooldown in `auth.service.ts` (`sendOtp`, forgot-password, verify-email send).

### Query indexes and explain

- **Problem:** “My orders, newest first” can find a user’s rows and then sort them in memory. Best sellers (`stock > 0`, sort by review count) had no matching index, so they scanned the catalog. A case-insensitive regex on product `name` cannot use a normal index.
- **Approach:** Compound `{ userId: 1, createdAt: -1 }` on orders, and `{ stock: 1, reviewCount: -1 }` on products. Leave name search as a collection scan until a real search engine exists. `npm run explain:queries --workspace apps/api` prints `executionStats` for order history, category list, name search, and best sellers. It refuses an Atlas URI.
- **Targets:** order history and category list should show an index seek (not a collection scan) once those collections grow. Name search may scan. This is not a GitHub Actions gate — CI has no Mongo.
- **Where:** `order.model.ts`, `product.model.ts`, `apps/api/src/scripts/explain-queries.ts`.

### Visual search evaluation

- **Problem:** A new vision model or prompt can stop a photo from finding the right product. A model reply must not be treated as a SKU that is not already in the catalog.
- **Approach:** `npm run eval:visual-search --workspace apps/api` checks hint parsing, a missing key (empty list + `vision_unavailable`), and a fake SKU that must not come back as a product. It then scores eight seeded Kengan photos (expected slug in the top 20) and two blank images. Hit rate is printed and does not fail the run. An unknown slug does. Local Mongo only; refuses Atlas. This is not a GitHub Actions gate. The prompt and the name search are unchanged — the first local run is the baseline to compare later.
- **Where:** `apps/api/src/scripts/eval-visual-search.ts`, `apps/api/src/scripts/fixtures/visual-search.json`, `parseHints` in `visual-search.ts`.

## Architecture Reminders

- Cart and checkout require careful guest/auth merge rules.
- Inventory must be atomic to prevent overselling.
- Payment provider code must be replaceable.
- Payment webhooks must be idempotent.
- Product images should be optimized at the Cloudinary layer.
- Search may need a dedicated engine after MVP.
- Admin APIs should not leak into customer mobile flows.
- Orders should store snapshots, not only references.
- Environment-specific bundle IDs/application IDs are required so dev, staging, and production builds can coexist on one device.

## Definition of Done For Future Code Phases

- Requirement clarified.
- Implementation completed.
- Tests added or consciously documented as not applicable.
- Lint passes.
- Typecheck passes.
- Tests pass.
- Build passes where applicable.
- Docs updated.
- Progress tracking updated.

## Current Status

Phases 1–9 + live API features are complete for the college/demo ship. **Live default:** mobile `dataSource: 'api'` → Render Free + Atlas (`ni-avellir.onrender.com`). Git + Render deploy branch **`Nidavellir`** (PR #22 merged latest `todo`). Resend verify email live (`EMAIL_DEMO_MODE=false`); register returns tokens even if verify-email send fails. Also shipped: Character Vault v1, All Reviews, visual search, For you, Anime `tag` facet, Drop Zone, bundles, AI assistant, store locator, idempotent checkout + 30m payment reconcile, Checkout Payment summary / Buy now / Razorpay cancel UX, GitHub Actions CI (lint / typecheck / test / build), abuse limits (OTP send 5/min with typed 429s; AI chat unlimited), order-history and best-seller indexes. Optional next: Jest/Supertest, custom email domain, FCM, store builds, licensed vault GLBs. Tracking: `PROJECT_PROGRESS.md` and `TODO.md`.

## Live Database + API (how to go beyond mock)

Mobile defaults to **`api`** via `apps/mobile/src/config/appConfig.ts` (set `'mock'` for offline college demos).

**Flip to live**

1. `dataSource: 'api'`
2. `allowMockFallback: false` (strict — no silent demo catalog/order fakes for critical paths)
3. `apiBaseUrl` → live Render `https://ni-avellir.onrender.com/api/v1` (local laptop API was `http://10.0.2.2:4000/api/v1` on Android / `localhost` on iOS)
4. Follow the agent checklist in **`AI_AGENT_GUIDE.md`**
5. Render Free: app fires `GET /api/v1/health` on bootstrap **without blocking** the splash, then pings every 20 minutes while foregrounded (`wakeApiServer.ts`) so cold starts are less likely mid-session — not a paid always-on substitute. Home also re-pings `/health` when focused if the last success is older than ~60s. Empty Home shelves on first open usually mean a cold Render wake — not a missing seed. Product shelves use a short in-memory TTL cache (`productRepository`) so revisit paints instantly while a background refresh runs. Deals API uses a Mongo aggregation (no full-collection scan).
5b. **Drop Zone:** Home countdown bar opens PLP `collection=drop-zone`. Catalog tag `drop-zone-eligible` marks a fixed eligible pool (seed once). API/mock pick today’s SKUs via Asia/Kolkata date hash (`packages/shared/src/dropZone.ts`) — do **not** re-seed daily. Cart tab omits stack back chevron to avoid unhandled `GO_BACK` after PLP/PDP.
5c. **Character Vault v1 (done)** (on **`Nidavellir`**; originally `char_valut`): Home teaser under Drop Zone → `CharacterVault` (react-native-filament orbit, unit-cube + `displayScale` ~1.12, taller flex stage). Roster: Goku/Vegeta (`Dragon Ball`, no clips) + Kid Levi (`Attack on Titan`, idle clip index **8**, `enableIdleAnimation: true`). Visit CTA → PLP `{name}'s Vault`. Animator only if `enableIdleAnimation` (0-clip GLBs crash Filament). Loader stays ~1.2s after decode; CTA press/hover fill; `preloadVaultModels` from Home teaser. Heimdall `openCharacterVault` (`goku` / `vegeta` / `kid-levi`). Flag `appConfig.features.characterVault`. New Arch stays off.
5d. **All Reviews:** PDP shows two review rows + **View all** → `ProductReviews`. Write review is a centered modal (title max 70, experience max 1500, stars). API stores `title` / `avatarUrl`; create uploads a local profile photo so other shoppers see it. Authors can `DELETE /reviews/:id`.
5e. **Visual search (v1):** Search/Home camera → `POST /api/v1/products/visual-search` (multer memory, 10/minute/IP). The vision call uses `OPENAI_VISION_MODEL`, or `OPENAI_MODEL` when that is unset, then keywords hit the existing catalog. Photos are not stored. Live Render: chat `OPENAI_MODEL` is `llama-3.3-70b-versatile` (text only); `OPENAI_VISION_MODEL` is set (`meta-llama/llama-4-scout-17b-16e-instruct`) so camera search does not reuse the chat model. No key, or a text-only model, returns an empty list and `vision_unavailable`. Flag `features.visualSearch`. Rebuild native after Info.plist string updates. Local scorecard: `npm run eval:visual-search --workspace apps/api` (refuses Atlas; hit rate is not a CI gate). The eight Kengan fixtures are on the live catalog; a photo hit rate still needs a vision key on local Mongo.
5f. **For you (v1):** Home rail + PLP via `GET /api/v1/products/for-you?recentIds=` (optional JWT adds wishlist + recent order lines). Score franchise/category/tags; pad with bestsellers. Flag `features.personalizedHome`. Other Home shelves unchanged.
5g. **Anime facet:** Home / Categories / drawer use `GET /products?tag=anime` (seed tags). Do **not** treat anime as a `ProductCategory` enum value — that would pull items out of apparel/collectibles/desk-gear. Live smoke: `curl '…/products?tag=anime&limit=3'` → `pagination.total` ~35.
5h. **Render deploy:** Blueprint + dashboard branch **`Nidavellir`**. Keep them aligned or auto-sync builds the wrong git ref.
5i. **Idempotent checkout + reconcile:** `Idempotency-Key` on `POST /orders`; intent reuse; atomic paid + `runeXpAwarded`. In-process reconciler + Order Details: Razorpay capture → paid; unpaid after `PENDING_PAYMENT_EXPIRE_MINUTES` (30) → `payment_expired`. Webhook `payment.failed` ≠ order cancel — expiry cleans abandoned orders.
5j. **Register + checkout UX:** `POST /auth/register` must not 500 when Resend rejects the verify email — return `emailVerification: { sent: false, reason: 'send_failed' }`. PDP Buy now: await cart add, **no** success toast; Payment step: summary above methods, scroll product cards only if **>3**; Razorpay cancel → “You have cancelled the Payment”.
5k. **Atomic inventory:** `reserveStock` at order create; `releaseStock` on unpaid cancel/expire only; never decrement again on Razorpay paid (`finalizePaidOrder`). Catalog `stock` drops while payment is pending.
5l. **Privacy / Contact / Support (Sheets v1):** in-app Privacy Policy; Contact → tab `Contact Nidavellir`; Raise a query → 3-tab Support workbook (`Support Tickets` core + `Support Commerce` + `Support Account App` extras keyed by `CaseNumber`). URLs in `appConfig` (`contactFormWebhookUrl`, `supportFormWebhookUrl`). Mobile keeps query cards / Pending→Resolved in AsyncStorage; Mark Resolved POSTs `action: resolve`. Comments column = typed text only. Apps Script: `apps/api/docs/support-nidavellir-apps-script.js` (Deploy Me + Anyone; POST returns 302 echo — RN uses `redirect: 'manual'`).
5m. **CI quality gates:** `.github/workflows/ci.yml` on every PR and on push to `Nidavellir` (`npm ci`, lint, typecheck, `npm run test --workspaces`, `npm run build`). Node `.nvmrc` 20.20.2. Jest is not in that job yet — workspace `test` scripts print and exit 0. Native release builds stay out of this workflow.
5n. **Abuse limits + indexes:** OTP/reset/verify-email sends **5/minute/IP** plus a 60s per-phone/email cooldown. A blocked call returns `429` with `error.type` (example `otp_limit_per_minute_reached`). AI chat is not limited. Orders `{ userId, createdAt }`; products `{ stock, reviewCount }`. Name search stays a regex scan. Local only: `npm run explain:queries --workspace apps/api` (refuses Atlas).
6. Rune XP is **flat per order** (100 / 500 bundle), not per-SKU sum. Product `sku` / `runeXp` fields remain for display / backfill (`npm run seed:sku --workspace apps/api`).

**Backend path**

1. Install MongoDB locally (or Atlas) and set `MONGODB_URI` in `apps/api/.env.development`.
2. Copy `apps/api/.env.development.example` → `.env.development`, set JWT secrets.
3. From repo root: start API (`npm run dev:api`).
4. Seed: `npm run seed --workspace apps/api`.
5. Auth: register/login → `setSessionTokens` → Bearer on `apiClient` (Keychain hydrate in `AppBootstrap`).

**Core collections (Mongoose)**

- Users, OtpChallenges (TTL), RefreshTokens (optional `deviceLabel` / `os` / `ip`), Products, Carts, Addresses, Orders, Payments, Wishlists, Coupons, Reviews, Notifications, ServiceabilityRules, Stores (optional — empty until seeded; `GET /stores` + Nominatim geocode proxy).

**Auth + cart (live)**

- `POST /api/v1/auth/*` — register, login, OTP, refresh, profile, sessions, forgot/reset/change password, email verify.
- `GET/POST/PATCH/DELETE /api/v1/cart/*` — persisted cart, guest `X-Guest-Session`, merge on login, coupons (`FORGE10` / `WELCOME100`).
- `GET /api/v1/serviceability?pincode=` — COD, shipping, ETA by pincode prefix.
- `GET/POST /api/v1/reviews`, `DELETE /api/v1/reviews/:id` (author), `GET /api/v1/notifications` — All Reviews + in-app inbox (FCM still deferred).
- Order / verify / reset emails via Resend — branded HTML in `integrations/email/email.factory.ts`. Test: `npm run test:email --workspace apps/api -- you@example.com`. Live inbox: `EMAIL_DEMO_MODE=false` + real `RESEND_API_KEY` + `EMAIL_FROM` (onboarding sender → Resend account email only).
- Rune XP: **100** per completed order, **500** when 2+ line products share a `bundleTag`.
- Auth sessions store `deviceLabel` / `os` / `ip` (mobile `deviceLabel.ts` on login/register/OTP).
- Mobile: `dataSource: 'api'`, `allowMockFallback: false`; repositories in `services/data/*`.
- Guest may browse + cart; checkout / wishlist / write-review require login.
- **AI Merch Assistant:** `POST /api/v1/ai/chat` — LLM optional (`OPENAI_API_KEY` / Groq `OPENAI_BASE_URL`); tools always use live Mongo services. Mobile `AIAssistant` screen + Search mic. Never put LLM keys in RN. Rebuild native after voice/TTS deps (`pod install`). `useSpeechToText` only loads `@react-native-voice/voice` when `NativeModules.Voice` exists — otherwise Heimdall stays text-only (avoids iOS `NativeEventEmitter(null)` crash when the pod is missing). After adding the Voice pod, run `pod install` in `apps/mobile/ios` and rebuild.
**Orders + payments flow**

- `POST /api/v1/orders` — COD → `confirmed` + stock decrement; Razorpay (`razorpay_demo`) → `pending_payment` (stock held until pay).
- `POST /api/v1/orders/:id/cancel|return|exchange` — authenticated post-purchase actions.
- `POST /api/v1/payments/intents` — creates Razorpay order (or demo intent).
- `POST /api/v1/payments/razorpay/confirm` — HMAC verify → mark payment + order `paid` + decrement stock.
- `POST /api/v1/payments/razorpay/webhook` — Razorpay server webhook (raw body + `X-Razorpay-Signature`); idempotent via `PaymentWebhookEvent`; handles `payment.captured` / `payment.failed`.
- `POST /api/v1/payments/razorpay/demo-complete` — college/test path without charging (blocked in production when real keys are set).

**Mobile sync**

- Orders / addresses / cart / wishlist sync from API in live mode. Checkout prefills default address + profile.

## Razorpay test / dummy checkout

- Provider: `apps/api/src/modules/payments/providers/razorpay.provider.ts`.
- Leave `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` as `replace-with-*` → **demo mode** (signed dummy intents, same HMAC verify path).
- Or paste Dashboard **Test Mode** keys (`rzp_test_…`) → real Razorpay Orders API create + verify.
- Mobile: Checkout branches on `intent.demoMode` — demo sheet + `/demo-complete`, or `react-native-razorpay` + `/confirm`.
- Never commit real keys. Prefer Test Mode until production go-live; set `RAZORPAY_WEBHOOK_SECRET` for webhooks (ngrok URL locally).
- Agent rules for future edits: **`AI_AGENT_GUIDE.md`** + `.cursor/rules/nidavellir-agent-alignment.mdc`.

## `intent.demoMode` — how to branch checkout (college demo → live)

After `POST /api/v1/payments/intents`, the response includes `intent.demoMode`. **Always branch on this flag** (and persist it on the pending checkout state). Do not hard-code “always demo sheet” or “always native SDK.”

### When is `demoMode` true vs false?

| Condition | `intent.demoMode` | What the API did |
|-----------|-------------------|------------------|
| Env keys missing, empty, or still `replace-with-*` | `true` | Fake `order_demo_*` intent; no Razorpay network call |
| Real Test/Live keys set (`rzp_test_…` / `rzp_live_…`) | `false` | Real `razorpay.orders.create`; public `keyId` is your Dashboard key |

Mobile mock fallback in `productRepository.createPaymentIntent` also returns `demoMode: true` when the API is unreachable / `dataSource: 'mock'`.

### Checkout branching (required for go-live)

```text
createOrder (razorpay) → createPaymentIntent → read intent.demoMode

if (intent.demoMode === true):
  → show RazorpayTestCheckout (in-app sheet)
  → on Pay: POST /payments/razorpay/demo-complete
  → finish order (paid)

if (intent.demoMode === false):
  → open react-native-razorpay Checkout with:
       key: intent.keyId
       order_id: intent.providerIntentId
       amount: intent.amountMinor
       currency: intent.currency
  → on success: POST /payments/razorpay/confirm
       { orderId, providerIntentId, providerPaymentId, signature }
  → finish order (paid)
  → on cancel/failure: leave order pending_payment; do not call demo-complete
```

Today the app branches on `intent.demoMode` in `CheckoutScreen`: demo sheet + `/demo-complete` when `true`; `react-native-razorpay` (`openRazorpayCheckout`) + `/confirm` when `false`.

### Native SDK install notes

- Dependency: `react-native-razorpay@^3.0.0` in `apps/mobile`.
- After install / pull: `node apps/mobile/scripts/ensure-mobile-node-modules.js`, then `cd apps/mobile/ios && pod install`.
- Rebuild the native app (Metro reload is not enough). New Architecture stays **off** for this project.
- Placeholder/mock path never opens the native SDK (`demoMode: true`).

### Checklist when making the app live

1. Set `appConfig.dataSource` to `'api'` and a real `apiBaseUrl` (staging/production host, HTTPS).
2. Set **real** Razorpay keys in the API env (start with Test Mode `rzp_test_…`, then Live `rzp_live_…` for store builds). Never ship the **key secret** in the mobile app — only `intent.keyId` is public.
3. Confirm `POST /payments/intents` returns `demoMode: false`. If it is still `true`, keys are wrong/placeholder — fix API env before expecting Checkout to work.
4. Mobile must call **`/razorpay/confirm`** after native Checkout success — **not** `/razorpay/demo-complete`.
5. Ensure production blocks demo-complete when real keys are configured (`PaymentService.completeDemoRazorpayPayment` already rejects demo in `NODE_ENV=production` when not in provider demo mode).
6. Rebuild native apps after adding `react-native-razorpay` (pods / Gradle); New Architecture is currently off, which is preferred for this SDK.
7. Razorpay webhooks: `POST /api/v1/payments/razorpay/webhook` + `RAZORPAY_WEBHOOK_SECRET` (backup to client `/confirm`; requires Test/Live keys + public HTTPS or ngrok).

### Quick sanity check

- Placeholder keys + mock app → `demoMode: true` → sheet + demo-complete (expected for demos).
- Live API + Test keys → `demoMode: false` → native Checkout + confirm (path for staging).
- Live API + Live keys + production → `demoMode: false` + demo-complete disabled → store-ready payments.
