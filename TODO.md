# TODO

## Phase 1: Architecture (COMPLETE)
- [x] Analyze repository state, read product brief, architecture revision brief.
- [x] Revise architecture to bare React Native CLI (no Expo).
- [x] Create planning documents, roadmap, folder structure, required APIs.
- [x] Design MongoDB schema, auth flow, navigation flow, UI/UX flow.
- [x] Add push notifications, env separation, OTA policy, compliance readiness.
- [x] Receive Phase 2 decisions list and architecture approval.

## Phase 2: Project Setup (COMPLETE)
- [x] Initialize pnpm monorepo with Turborepo.
- [x] Create shared package for contracts.
- [x] Configure TypeScript, ESLint, Prettier across workspaces.
- [x] Initialize bare React Native mobile app (ios/ + android/ committed).
- [x] Initialize Node.js/Express backend API.
- [x] Add `.env` handling, Docker plan, INSTALLATION draft.

## Phase 3: Backend Foundation (COMPLETE)
- [x] Express app, health route, config, logging, errors, security middleware.
- [x] Mongoose connection (connect.ts).
- [x] Product model + service + controller + routes (list, detail, categories, franchises, featured, limited-drops).
- [x] Cart quote service + controller + routes.
- [x] Order model + service + controller + routes (create, list, getById).
- [x] Payment provider abstraction (Razorpay + COD).
- [x] Email provider abstraction (Resend).
- [x] Seed script + `pnpm --filter api seed`.

## Phase 4: Mobile App - Foundation (COMPLETE)
- [x] Config layer for easy mock-to-API switching (`src/config/appConfig.ts`).
- [x] Data source abstraction (mock + live API) with `productRepository`.
- [x] Redux Toolkit store + cart/wishlist slices.
- [x] React Navigation (bottom tabs + native stack) with typed routes.
- [x] Theme tokens + shared UI components (ProductCard).

## Phase 5: Mobile App - Commerce Screens (COMPLETE)
- [x] Home screen (hero carousel, categories, featured grid, countdown).
- [x] Product list + product detail screens (search, sort, filter).
- [x] Cart screen (quantity controls, summary).
- [x] Checkout flow + order confirmation.
- [x] Orders + Profile screens.

## Phase 6: Interactive & Innovative Features (COMPLETE)
- [x] Animated hero carousel + product glow effects (Reanimated).
- [x] Flash-sale drop countdown timer (`useCountdown`).
- [x] "Forge Studio" product customizer concept (feature flag in `appConfig`).
- [x] Rune XP / loyalty gamification widget (embedded in Profile).
- [x] Navigation refactor: flattened stack + tab param lists, typecheck clean.

## Phase 7: Shipping Guide (COMPLETE)
- [x] `DEVELOPER_GUIDE.md` mapping every feature to its file location.
- [x] Update PROJECT_PROGRESS + README.
- [x] Final typecheck (full monorepo: shared + mobile + API pass cleanly).
