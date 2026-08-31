# Niðavellir

Premium gaming merchandise marketplace — a full-stack mobile commerce app.

**Status: Live-API ready locally.** Mobile defaults to `dataSource: 'api'`. Run API + seed + Metro (see Quick Start). Mock mode still available by flipping `appConfig`.

## What's Included

- **Mobile app** (bare React Native CLI, no Expo): Onboarding, Login, Signup, OTP, Forgot/Reset/Change password, Sessions, Email verify, Forge (Home), Categories, Search, Products, Product Detail (+ reviews), Cart (+ coupons), Checkout, Order Confirmation, Orders, Order Details (cancel/return/exchange), Addresses, Wishlist, Notifications, Account, Edit Profile.
- **Backend API** (Node.js + Express + MongoDB): auth/JWT, products, server cart, addresses, wishlist, coupons, reviews, notifications, serviceability, orders, Razorpay + COD payments, health, seed script.
- **Shared package** (`@nidavellir/shared`): contracts, types, constants, Zod validation, and expanded mock catalog (~28 products).
- **Payments**: demo sheet + `react-native-razorpay` when live keys return `intent.demoMode === false`.
- **Account**: addresses CRUD, edit profile, orders with product images and details.

## Quick Start (clone → run)

```bash
git clone <your-repo-url> Ni-avellir
cd Ni-avellir
git checkout <your-branch>   # if not main

# 1. Install (also builds @nidavellir/shared via postinstall)
npm install

# 2. Copy API env example + link RN modules under apps/mobile
npm run setup

# 3. Live stack (current default in appConfig: dataSource 'api')
#    Needs MongoDB Atlas URI (or local) in apps/api/.env.development
npm run dev:api
npm run seed --workspace apps/api
npm run dev

# 4. In another terminal, launch a device/simulator
npm run android
# or (macOS + Xcode; first time run pods):
#   cd apps/mobile/ios && pod install && cd -
npm run ios
```

### Know the project is working

With API + Mongo up:

```bash
npm run dev:api                          # Terminal 1 — Express on :4000
npm run seed --workspace apps/api        # once (products, coupons, serviceability)
npm run dev                              # Terminal 2 — Metro (mobile)
curl -s http://localhost:4000/health     # expect {"service":"nidavellir-api","status":"ok"}
```

Mobile `apps/mobile/src/config/appConfig.ts` should have `dataSource: 'api'` and `allowMockFallback: false` for the live path. Android emulator uses `10.0.2.2:4000`; iOS simulator uses `localhost:4000`.

**College mock-only demo** (no Mongo): set `dataSource: 'mock'`, then only `npm run dev` + `npm run android` / `ios`.

### Local API cURLs + JWT

```bash
# API must be listening — writes gitignored API_DETAILS.local.md
python3 scripts/generate-api-details-local.py
```

That file is **gitignored** (contains live JWT). See also `DEVELOPER_GUIDE.md` / `AI_AGENT_GUIDE.md`.

> After `npm install`, root `postinstall` builds `@nidavellir/shared`, and mobile `ensure-mobile-node-modules.js` restores RN symlinks for Android Gradle / Metro.

## Documentation

- `AI_AGENT_GUIDE.md` — **required for AI agents**: keep mock/live API, payments, nav, and docs aligned on every change.
- `PROJECT_INSIGHTS.md` — operating rules + live API / Razorpay switch notes.
- `DEVELOPER_GUIDE.md` — feature→file map and run instructions.
- `API_DETAILS.example.md` — how to generate local JWT/cURL sheet (`API_DETAILS.local.md`, gitignored).
- `ARCHITECTURE.md` — full architecture plan.
- `INSTALLATION.md` — native tooling prerequisites.
- `TODO.md` / `PROJECT_PROGRESS.md` — project status and roadmap.

## Tech Stack

- **Mobile:** React Native, React Navigation, Redux Toolkit, TanStack Query, Reanimated, Gesture Handler, FlashList, react-native-image-picker, react-native-razorpay.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Zod, JWT, Helmet.
- **Tooling:** npm workspaces, Turborepo, strict TypeScript, ESLint, Prettier.

## Native Tooling

Bare React Native Community CLI (not Expo). Targets Android 10 (API 29) and iOS 16.0+. See `INSTALLATION.md` for the full prerequisite list (Xcode 16.2, JDK 17, Android SDK 35, etc.).
