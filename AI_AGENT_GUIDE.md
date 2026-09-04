# AI Agent Guide — Nidavellir

**Read this before adding or changing app features.** Keep mock demo, live API, payments, navigation, and docs aligned so the college demo stays stable and the live switch stays one config flip away.

Related: `PROJECT_INSIGHTS.md`, `ARCHITECTURE.md`, `apps/mobile/src/config/appConfig.ts`.

---

## Non‑negotiables

1. **No Expo** — bare React Native Community CLI only (`apps/mobile/ios`, `apps/mobile/android`).
2. **No secrets in git** — no real JWT, Razorpay live keys, Mongo URIs, or Keychain dumps.
3. **Money paths are critical** — orders + payments must not silently invent “paid” results when `dataSource === 'api'`.
4. **Branch on `intent.demoMode`** for Razorpay UI (demo sheet vs `react-native-razorpay` + `/confirm`).
5. **New Architecture stays off** until libs are stable (see Podfile / `gradle.properties`).
6. **Prefer repository + Redux patterns already in the app** — do not invent parallel data layers.
7. **Never create a git commit unless the user explicitly asks** in that message. Draft commit message lines / `git status` summaries are fine; do **not** run `git commit` (or `git push`) on your own. If unclear, ask first. Same rule applies after “give me commit lines” — lines only, no commit.

---

## Live API switch (single source of truth)

File: `apps/mobile/src/config/appConfig.ts`

| Setting | College demo | Live / staging |
|---------|--------------|----------------|
| `dataSource` | `'mock'` | `'api'` |
| `allowMockFallback` | `true` | `false` |
| `apiBaseUrl` | emulator host `:4000/api/v1` | `https://ni-avellir.onrender.com/api/v1` (Render) |
| `apiKeepAliveIntervalMs` | n/a | `20 * 60 * 1000` — silent `/health` while app is foregrounded |

**Render Free cold starts:** `AppBootstrap` awaits `pingApiHealth()` then starts `startApiKeepAlive()` (`wakeApiServer.ts`). That reduces sleep mid-demo; it is not a substitute for a paid always-on plan.

Also required on the server: Mongo, JWT secrets, Razorpay Test then Live keys (`apps/api/.env.*`).

### Fresh clone must run

```bash
npm install
npm run setup
```

**Live stack (current default — `appConfig.dataSource: 'api'`):**

```bash
npm run dev:api
npm run seed --workspace apps/api
npm run dev          # Metro
npm run android      # or ios (+ pod install first time)
```

Confirm API: `curl -sS -m 90 https://ni-avellir.onrender.com/health` (live) or `curl -s http://localhost:4000/health` (local)  
Postman: `API_DETAILS.live.example.md` · `python3 scripts/generate-api-details-local.py --live`  
Local JWT/cURLs (gitignored): `python3 scripts/generate-api-details-local.py`

**College mock (no Mongo):** set `dataSource: 'mock'`, then `npm run dev` + device only.

Do not invent alternate entrypoints. Root `dev` = mobile Metro. Root `dev:api` = Express (needs Mongo).

### Navigation rules (shop / auth)

- Prefer `goBackOrHome` / `resetToMainTabs` / `resetToOrders` from `lib/navigation.ts` over bare `goBack` or `navigate('MainTabs')` after checkout.
- Guest “Login / Signup” uses `openLogin`; signed-out users return via Login back → `enterGuest` (do not leave the app).
- Logout uses `signOutAndClearSession` → guest shop (not Onboarding).
- Order confirmation must reset the stack (no back into Checkout/PDP).
- **Guest may browse + cart.** Checkout and wishlist require login (`lib/authGates.ts` / `lib/wishlistActions.ts` → `openLogin`).

Checklist when flipping live:

1. API running + seeded products (serviceability + coupons via seed).
2. Mobile `dataSource: 'api'`, `allowMockFallback: false`.
3. Auth tokens via `sessionTokens` + Keychain hydrate in `AppBootstrap`.
4. Guest cart: `X-Guest-Session` header; `POST /cart/merge` after login.
5. SMS: `SMS_PROVIDER` + MSG91/Twilio keys, or `SMS_DEMO_MODE=true` for dev.
6. Razorpay: real keys → `demoMode: false` → native Checkout → `/confirm`.
7. Rebuild native app after native dependency changes; run `ensure-mobile-node-modules.js` + `pod install` when needed.

---

## Alignment checklist (every change)

When you **add or change** a screen, feature, API, or payment path, complete the matching rows:

### A. New mobile screen / flow

- [ ] Add route to `apps/mobile/src/app/navigation/types.ts` (`RootStackParamList` or tabs).
- [ ] Register screen in `RootNavigator.tsx` with title / header options.
- [ ] Wire entry points (Profile menu, Cart, deep links, confirmation CTAs).
- [ ] Use `colors` / `spacing` / `typography` from `theme/tokens.ts` (no one-off design systems).
- [ ] Forms: shared validators (`lib/addressValidation.ts` or same pattern) + inline errors.
- [ ] Empty + error + loading states.

### B. New or changed data (products, orders, addresses, cart)

- [ ] Extend **shared** types in `packages/shared` if the contract is cross-app.
- [ ] Mobile: go through `productRepository` (or a dedicated repository), not raw `axios` in screens.
- [ ] Implement **mock fallback** for catalog reads; mark **`critical: true`** for create order / payment confirm.
- [ ] Redux slice: shape complete enough for UI (e.g. orders need line items + address for Order Details).
- [ ] Persist locally only what UX needs until API exists; document “live: sync to `/api/v1/...`”.
- [ ] Checkout / finishOrder: keep Redux + Address book + API payload in sync.

### C. New or changed API endpoint

- [ ] Route under `/api/v1/...`, mounted in `apps/api/src/app.ts`.
- [ ] Controller → service → model; use `AppError` + envelope `{ data }` / `{ error }`.
- [ ] Update mobile repository method + types.
- [ ] Env vars in `.env.*.example` (never commit real values).
- [ ] Note auth requirement (JWT) when auth module lands — client already sends Bearer if token set.

### D. Payments

- [ ] Provider implements `PaymentProvider`; Razorpay keeps HMAC verify.
- [ ] Mobile: `intent.demoMode === true` → demo sheet + `/demo-complete`; `false` → SDK + `/confirm`.
- [ ] Never put `RAZORPAY_KEY_SECRET` in the app.
- [ ] Update `PROJECT_INSIGHTS.md` Razorpay section if behavior changes.

### E. Native modules

- [ ] Add to `apps/mobile/package.json`.
- [ ] Symlink in `scripts/ensure-mobile-node-modules.js` if autolinking needs the mobile `node_modules` path.
- [ ] `pod install` (UTF-8 locale) + Android rebuild.
- [ ] Document rebuild requirement in `PROJECT_INSIGHTS.md` or this file.

### F. Docs agents must keep current

- [ ] Meaningful behavior → update `PROJECT_INSIGHTS.md` and/or this guide.
- [ ] Phase / TODO changes → `PROJECT_PROGRESS.md`, `TODO.md`, `CHANGELOG.md` when the user expects tracking.

---

## Where things live

| Concern | Path |
|---------|------|
| Mock vs API switch | `apps/mobile/src/config/appConfig.ts` |
| HTTP client + Bearer | `apps/mobile/src/services/api/apiClient.ts` |
| Token stubs / Keychain hook | `apps/mobile/src/services/api/sessionTokens.ts` |
| Catalog / orders / payments repository | `apps/mobile/src/services/data/productRepository.ts` |
| Auth / cart / addresses / orders / reviews repos | `apps/mobile/src/services/data/*Repository.ts` |
| Auth API | `apps/api/src/modules/auth/*` |
| Cart + coupons + serviceability | `cart/*`, `coupons/*`, `serviceability/*` |
| Reviews / notifications | `reviews/*`, `notifications/*` |
| Order emails (Resend / console) | `orders/order-email.ts`, `integrations/email/*` |
| Razorpay native open | `apps/mobile/src/services/payments/openRazorpayCheckout.ts` |
| Orders list / details | `features/orders/*` |
| Addresses | `features/addresses/*` |
| Address validation | `lib/addressValidation.ts` |
| Navigation | `app/navigation/*` |
| Express app | `apps/api/src/app.ts` |
| Payments API | `apps/api/src/modules/payments/*` |

---

## Do / Don’t

**Do**

- Prefer small, production-shaped changes over throwaway demos when the user wants “real app” quality.
- Reuse checkout address validation for any address form.
- Prefill checkout from saved default address + signed-in profile when possible.
- Surface API errors with `getApiErrorMessage` in checkout/payment alerts.

**Don’t**

- Hard-code always-demo payment UI.
- Soft-fallback paid orders when `dataSource === 'api'`.
- Add Expo, EAS, or App Center CodePush.
- Commit `.env` with real secrets.
- Leave Profile menu rows without navigation when the screen exists.

---

## Quick “future live” backlog (do not block college demo)

Most auth/cart/orders live paths are implemented. Still deferred (see `TODO.md`):

- Razorpay **webhooks** implemented (`POST /payments/razorpay/webhook`, idempotent) beside client `/confirm`.
- **FCM / APNs** push (in-app notifications inbox already works).
- Shipment tracking, invoice PDF, automated tests.
- **HTTPS / production deploy** (Railway/Render/AWS + store builds) with real secrets. Render: `render.yaml` + `npm run build:api` / `npm run start:api` (not Metro).
- Strict `allowMockFallback: false` on staging/prod store builds.
