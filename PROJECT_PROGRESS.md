# Project Progress

## Status

The Niðavellir marketplace is **functionally complete** for a college final-semester demo. The mobile app (React Native) and backend API (Node.js/Express/MongoDB) are implemented, typecheck cleanly, and are wired with a data-source abstraction that supports both zero-setup mock mode and a live API mode.

The shop now opens behind an onboarding + login/signup gate. Commerce screens use a light esports theme (mist background, ink type, cobalt accent).

## Completed

### Phase 1: Architecture
- Full architecture plan (monorepo, bare React Native CLI, backend, shared contracts).
- MongoDB schema, auth flow, navigation flow, UI/UX flow, environment separation.
- Push notifications, OTA policy, compliance readiness, testing strategy.
- All required Phase 2 business decisions finalized.

### Phase 2: Project Setup
- pnpm monorepo with Turborepo.
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
- Seed script + `pnpm --filter api seed`.

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
- Product detail (PDP): image pager, wishlist, share, price + MRP + % off, bank offers, sticky add-to-cart / buy now, similar/recent sliders, accordions, reviews + write-review modal.
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
- PDP write-review is a bottom-sheet modal (fixed oversized submit); more space under Similar brands.
- Orders list reads Redux `ordersSlice` (session-only until persist).
- **Edit profile** (name / email / phone) + editable avatar (library, camera, presets) via `react-native-image-picker`.
- Removed duplicate in-body titles when the nav header already names the screen.
- Monorepo hoist fix: `scripts/ensure-mobile-node-modules.js` restores RN symlinks for Android/Metro after npm installs.

## Next Step

Optional hardening: persist auth + orders + avatar across reloads, write automated tests (Jest + React Native Testing Library + Supertest), and full deployment docs. The core app is complete and demo-ready.

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
- Phase 10 testing hardening: Not started (optional).
- Phase 11 deployment: Not started (optional).
