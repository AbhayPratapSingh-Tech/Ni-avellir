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
- [x] Redux Toolkit store + cart/wishlist/recent/auth slices.
- [x] React Navigation (auth stack + bottom tabs + native stack) with typed routes.
- [x] Theme tokens + shared UI components (ProductCard).

## Phase 5: Mobile App - Commerce Screens (COMPLETE)
- [x] Home / Forge (banners, categories, deals, bestsellers, daily sale window).
- [x] Categories tab + Search screen.
- [x] Product list + product detail screens (gallery, price/MRP/% off, reviews, similar).
- [x] Cart screen (address card, stock chips, wishlist/delete, Hit the Anvil bar).
- [x] Checkout flow + order confirmation.
- [x] Orders + Profile screens (logout).

## Phase 6: Interactive & Innovative Features (COMPLETE)
- [x] Animated hero carousel + product glow effects (Reanimated).
- [x] Daily sale countdown (`useCountdown` + `lib/saleWindow.ts`, 09:00–16:00).
- [x] "Forge Studio" product customizer concept (feature flag in `appConfig`).
- [x] Rune XP / loyalty gamification widget (embedded in Profile).
- [x] Navigation: Forge / Categories / Cart / Account tabs after auth.

## Phase 7: Shipping Guide (COMPLETE)
- [x] `DEVELOPER_GUIDE.md` mapping every feature to its file location.
- [x] Update PROJECT_PROGRESS + README.
- [x] Final typecheck (full monorepo: shared + mobile + API pass cleanly).

## Phase 8: Auth gate + shop UI polish (COMPLETE)
- [x] 3 full-screen onboarding slides (Skip + Login/Signup CTA).
- [x] Login first, Sign up, OTP demo, Redux auth session.
- [x] Gate shop until authenticated; logout returns to onboarding.
- [x] Light esports theme (mist / ink / cobalt).
- [x] Cart: My Cart header, deliver-to card, line items, sticky total bar.

## Phase 9: Catalog, PDP, Account polish (COMPLETE)
- [x] Expand mock catalog (~28 SKUs, tags, franchises, richer specs).
- [x] Home “You may also like” shelf + also-like PLP collection.
- [x] PDP review bottom-sheet modal; brand section spacing.
- [x] Orders from Redux `ordersSlice`.
- [x] Edit profile + avatar (library / camera / presets).
- [x] Drop duplicate body titles under nav headers.
- [x] Restore mobile RN node_modules symlinks after workspace hoist (`ensure-mobile-node-modules.js`).

## Optional next
- [ ] Persist auth / orders / avatar across app reloads (MMKV or redux-persist).
- [ ] Automated tests (Jest + RNTL + Supertest).
- [ ] Deployment docs / store listing copy.

## Future product features (backlog)

> Ideas queued for after the core app is solid. Placement / copy / XP level names / mystery-box rules will be filled in when each feature is picked up.

### Discovery & personalization
- [ ] **Smart push notifications** — interest / cart / drop / restock aware pushes (not blast-only).
- [ ] **Frictionless search (visual)** — upload a photo of an item and find similar products.
- [ ] **Personalized home feed** — rank shelves by reach, affinity, and past interest.
- [ ] **Find with character / franchise** — e.g. “find items with Eren Yeager”, “find items with God of War” (UI placement TBD).
- [ ] **AI Merch Assistant (chat + search)** — in-app chat that understands budget + fandom queries (e.g. “I have ₹3000, huge Demon Slayer fan — what should I buy?”) and returns guided product results / deep-links into search & PDP.

### Merchandising & drops
- [ ] **Today’s Niðavellir drop banner** — name the limited-edition drop of the day with % off and/or price (“Limited edition · {item} · X% off / at ₹Y”).
- [ ] **Pre-order products** — PDP + details visible now; ship-in-near-future badge / CTA; checkout rules TBD.
- [ ] **Bundle products** — curated multi-SKU packs with combined pricing.
- [ ] **Mystery boxes** — on specific products and/or when cart total exceeds a threshold (rules & copy TBD when building).

### Loyalty & profile
- [ ] **Loyalty points (XP)** — extend existing Rune XP; profile **level names** TBD later.
- [ ] Profile level progression UI tied to XP.

### PDP & community
- [ ] **PDP “How they get along” / customer images** — large buyer photos of the product in use, with short custom moment captions; upload own image(s) from PDP; distinct / polished section animation.
- [ ] **Make your own Gaming Setup** — dedicated section (add when the main app experience is complete).
- [ ] **Community blog** — verified users share posts about specific products / brands.

### Notes for implementers
- Visual search, AI assistant, and smart pushes likely need backend + privacy / moderation plans.
- Pre-order, bundles, and mystery boxes need inventory + pricing + cart rules before UI.
- Character / franchise find can reuse existing `franchise` / tag search once the entry UI is decided.
