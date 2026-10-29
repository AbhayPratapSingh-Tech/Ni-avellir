# Project Progress

## Status

The Niðavellir marketplace is **demo-ready on a live hosted API**. Mobile defaults to `dataSource: 'api'` against **Render Free** (`https://ni-avellir.onrender.com/api/v1`) + MongoDB Atlas. Razorpay Test Mode + webhooks are wired. Mock mode remains available for offline college demos. Render deploys from branch **`Nidavellir`**.

The shop opens behind onboarding + login/signup. Commerce screens use a light esports theme.

## Completed

### Phase 1–9 (college demo foundation)
See sections below / git history: architecture, monorepo, Express API, RN shop, auth gate, catalog/PDP/account polish.

### Live API (Atlas) + hosted deploy
- Auth JWT, OTP (demo/SMS), Keychain hydrate, server cart + coupons, addresses, wishlist, reviews, notifications, serviceability, orders, cancel/return/exchange.
- Razorpay: intents, native SDK confirm, webhook idempotency, demo-complete blocked when real keys set.
- **Render Free** deploy (`render.yaml` + dashboard branch **`Nidavellir`**, `build:api` / `start:api`) — health OK at `/health`. Verified `GET /products?tag=anime` returns catalog (~35 tagged SKUs).
- Mobile `apiBaseUrl` → Render; silent `/health` keep-alive on bootstrap + every 20 min (`wakeApiServer.ts`).
- Postman/cURL docs: `API_DETAILS.live.example.md` + `generate-api-details-local.py --live`.
- **Anime bundles** — `bundleTag` / `isBundleMain`, `GET /products/bundles`, PDP complete-the-bundle, Home banner slider.
- **Anime Home facet** — `tag=anime` PLP (not a product-type category).
- **Checkout serviceability** — pincode ETA / shipping / COD gate on Checkout.
- **Resend email (live on Render)** — verify / reset / order templates branded in `email.factory.ts`; `EMAIL_DEMO_MODE=false` + `RESEND_API_KEY`.
- **Sessions** — `deviceLabel` / `os` / `ip` on refresh tokens; Devices & sessions UI.
- **Rune XP** — flat **100**/order, **500** for bundle orders (2+ same `bundleTag`); confirmation shows award.
- **UI polish** — SVG `AppIcon`, `CachedImage` error placeholder, Home YouTube `VideoBanner` autoplay retries, PDP confidence 2×2 + specs/reviews above carousels.
- **Character Vault v1** — Home teaser under Drop Zone → `CharacterVault` (react-native-filament orbit). Roster: Goku/Vegeta + Kid Levi (idle clip 8). Visit CTA → PLP `{name}'s Vault`. Animator gated by `enableIdleAnimation`; Heimdall `openCharacterVault` (`goku` / `vegeta` / `kid-levi`); flag `features.characterVault`. Merged to **`Nidavellir`** (via `todo` / `reviews`; originally `char_valut`).
- **All Reviews** — `ProductReviews` screen, review title + hosted avatar, `DELETE /reviews/:id` for the author, Render `tsc` param cast.
- **Visual search + For you** — `POST /products/visual-search` (vision → catalog), Home For you rail via `GET /products/for-you`; flags `visualSearch` / `personalizedHome`.

### Phase 1: Architecture
- Full architecture plan (monorepo, bare React Native CLI, backend, shared contracts).
- MongoDB schema, auth flow, navigation flow, UI/UX flow, environment separation.
- Push notifications, OTA policy, compliance readiness, testing strategy.
- All required Phase 2 business decisions finalized.

### Phase 2: Project Setup
- npm monorepo with Turborepo (workspaces under `apps/*`, `packages/*`).
- Bare React Native mobile app with committed `ios/` + `android/`.
- Node.js/Express backend API.
- Shared package (`@nidavellir/shared`) for contracts/types/validation.
- TypeScript (strict), ESLint, Prettier configured across workspaces.

### Phase 3: Backend Foundation
- Express app with security middleware (helmet, cors, rate-limit, sanitize, compression).
- Health route, environment config, structured logging, error handler.
- Product model/service/controller/routes (list, detail, categories, featured, limited-drops).
- Cart quote service/controller/routes.
- Order model/service/controller/routes (create, list, getById).
- Payment provider abstraction (Razorpay + COD).
- Email provider abstraction (Resend).
- Seed script + workspace seed.

### Phase 4: Mobile Foundation
- Config layer for mock-to-API switching (`config/appConfig.ts`).
- Data source abstraction (`services/data/productRepository.ts`).
- Redux Toolkit store with cart, wishlist, recent, and auth slices.
- React Navigation (auth stack + bottom tabs + native stack) with fully typed routes.
- Theme tokens + shared UI components.

### Phase 5: Commerce Screens
- Home (Forge): brand mark, search, hero banners, live drop / daily sale window (09:00–16:00), video banner slot, circular category slider, deals grid, best-seller slider, **You may also like** 3×2 grid.
- Categories tab and dedicated Search screen.
- Product listing (PLP) with collection/category/franchise params and floating cart button.
- Product detail (PDP): image pager, wishlist, share, price + MRP + % off, bank offers, sticky outline add-to-cart / buy now, similar/recent sliders, accordions, reviews teaser + **View all** → All Reviews, centered write-review modal (title, experience, stars), author can remove their review.
- Cart: My Cart header, deliver-to address card, line items with offer/MRP/price, in/out-of-stock chips, qty + wishlist + delete, sticky Your Total / Hit the Anvil bar.
- Checkout flow + order confirmation.
- Orders (Redux session list) + Profile / Edit profile (avatar, name, email, phone).

### Phase 6: Interactive & Innovative Features
- Animated hero carousel (Reanimated).
- Daily sale countdown (`useCountdown` + `lib/saleWindow.ts`).
- Rune XP loyalty gamification widget (Profile).
- "Forge Studio" customizer feature flag.
- Navigation: auth gate, then Forge / Categories / Cart / Account tabs.

### Phase 7: Developer Guide
- `DEVELOPER_GUIDE.md` created mapping every feature to its file location.
- Updated tracking docs (this file, TODO, README).
- Final typecheck passes for both mobile and API.

### Phase 8: Auth gate + shop UI polish
- Three full-screen onboarding slides (controller/headset imagery, overlay, dots, Skip, Login/Signup CTA).
- Login first, with link to Sign up; sign up fields + 4-digit OTP demo; auth session in Redux.
- Shop is unreachable until login/OTP succeeds; Account logout returns to onboarding.
- Light esports theme (not dark/neon).
- Cart layout aligned to address card + line-item + sticky total bar.

### Phase 9: Catalog, PDP, and Account polish
- Expanded mock catalog (~28 products, 6 franchises, richer specs, `you-may-also-like` tag).
- Home **You may also like** 3×2 grid + arrow to also-like PLP (`collection: 'also-like'`).
- PDP write-review is a centered modal (title / experience / stars); All Reviews screen from **View all**; authors can delete their own reviews.
- Orders list reads Redux `ordersSlice` (session-only until persist).
- **Edit profile** (name / email / phone) + editable avatar (library, camera, presets) via `react-native-image-picker`.
- Removed duplicate in-body titles when the nav header already names the screen.
- Monorepo hoist fix: `scripts/ensure-mobile-node-modules.js` restores RN symlinks for Android/Metro after npm installs.

## Next Step

Core app + hosted API on **`Nidavellir`** + live verify email + vault + All Reviews + visual search + For you + Anime tag facet are **demo-ready**.

Backlog is tracked in **`TODO.md` Phases 10–13** (not started — plan before implementing):

- **10** Reliability & security (tests, CI, inventory, account deletion, monitoring, backups)
- **11** Customer operations & store (tracking, invoices, admin, legal, FCM, Play/TestFlight)
- **12** Discovery / retention + **upgrade shipped features** (AI, visual search, XP redemption, reviews, etc.)
- **13** Premium UX & release polish (setup builder, a11y, remote flags, staging)

## Approval Log

- Phase 1 architecture: **Approved**.
- Phase 2 project setup: **Complete**.
- Phase 3 backend foundation: **Complete**.
- Phase 4 mobile foundation: **Complete**.
- Phase 5 commerce screens: **Complete**.
- Phase 6 interactive features: **Complete**.
- Phase 7 developer guide: **Complete**.
- Phase 8 auth gate + shop UI polish: **Complete**.
- Phase 9 catalog / PDP / Account polish: **Complete**.
- Live API + Render hosting: **Complete** (Free tier; store deploy remaining).
- Resend verify + branded templates + session labels + Rune XP 100/500: **Complete**.
- Character Vault v1 (Filament lobby + Heimdall navigate): **Complete**.
- PDP All Reviews + author delete + hosted review avatar: **Complete**.
- Visual search + For you Home rail: **Complete**.
- Anime `tag` facet + Render on **`Nidavellir`**: **Complete**.
- Phase 10 reliability & security: Partial — idempotent checkout + payment reconcile/30m expiry **Complete**; other Phase 10 items still open (see `TODO.md`).
- Phase 11 customer ops & store: Not started (see `TODO.md`).
- Phase 12 discovery / upgrades: Not started (see `TODO.md`).
- Phase 13 premium UX & release polish: Not started (see `TODO.md`).
