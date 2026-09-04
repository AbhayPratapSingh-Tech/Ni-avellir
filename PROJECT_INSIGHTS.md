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
- CI/CD: GitHub Actions plus Fastlane for native builds.
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

Phases 1–9 are complete for the college demo (architecture through catalog / PDP / Account polish). Optional next work is session persistence, automated tests, and store deployment. Live tracking: `PROJECT_PROGRESS.md` and `TODO.md`.

## Live Database + API (how to go beyond mock)

Mobile defaults to **mock** via `apps/mobile/src/config/appConfig.ts`.

**Flip to live**

1. `dataSource: 'api'`
2. `allowMockFallback: false` (strict — no silent demo catalog/order fakes for critical paths)
3. `apiBaseUrl` → live Render `https://ni-avellir.onrender.com/api/v1` (local laptop API was `http://10.0.2.2:4000/api/v1` on Android / `localhost` on iOS)
4. Follow the agent checklist in **`AI_AGENT_GUIDE.md`**
5. Render Free: app silently pings `GET /api/v1/health` on bootstrap and every 20 minutes while foregrounded (`wakeApiServer.ts`) so cold starts are less likely mid-session — not a paid always-on substitute.

**Backend path**

1. Install MongoDB locally (or Atlas) and set `MONGODB_URI` in `apps/api/.env.development`.
2. Copy `apps/api/.env.development.example` → `.env.development`, set JWT secrets.
3. From repo root: start API (`npm run dev --workspace apps/api` or the package script in docs).
4. Seed products if a seed script exists; otherwise create catalog via admin/product routes.
5. Auth (next): register/login → `setSessionTokens` → Bearer on `apiClient` (Keychain hydrate stub in `sessionTokens.ts`).

**Core collections (Mongoose)**

- Users, OtpChallenges (TTL), RefreshTokens, Products, Carts, Addresses, Orders, Payments, Wishlists, Coupons, Reviews, Notifications, ServiceabilityRules.

**Auth + cart (live)**

- `POST /api/v1/auth/*` — register, login, OTP, refresh, profile, sessions, forgot/reset/change password, email verify.
- `GET/POST/PATCH/DELETE /api/v1/cart/*` — persisted cart, guest `X-Guest-Session`, merge on login, coupons (`FORGE10` / `WELCOME100`).
- `GET /api/v1/serviceability?pincode=` — COD, shipping, ETA by pincode prefix.
- `GET/POST /api/v1/reviews`, `GET /api/v1/notifications` — PDP reviews + in-app inbox (FCM still deferred).
- Order status emails via Resend (`EMAIL_DEMO_MODE` / console fallback).
- Mobile: `dataSource: 'api'`, `allowMockFallback: false`; repositories in `services/data/*`.
- Guest may browse + cart; checkout / wishlist / write-review require login.

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
