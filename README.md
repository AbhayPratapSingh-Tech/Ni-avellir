# Niðavellir

Premium gaming merchandise marketplace — a full-stack mobile commerce app.

**Status: Demo-ready.** The mobile app and backend are implemented, wired, and typecheck cleanly. Cold start is onboarding → login/signup, then the shop.

## What's Included

- **Mobile app** (bare React Native CLI, no Expo): Onboarding, Login, Signup, OTP, Forge (Home), Categories, Search, Products, Product Detail, Cart, Checkout, Order Confirmation, Orders, Order Details, Addresses, Wishlist, Account, and Edit Profile.
- **Backend API** (Node.js + Express + MongoDB): products, cart quotes, orders, Razorpay + COD payments, health, seed script.
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

# 3. Start Metro (mock catalog — no Mongo/API required)
npm run dev

# 4. In another terminal, launch a device/simulator
npm run android
# or (macOS + Xcode; first time run pods):
#   cd apps/mobile/ios && pod install && cd -
npm run ios
```

`npm run dev` starts the **React Native Metro bundler** for the mobile app in **mock** mode (`apps/mobile/src/config/appConfig.ts` → `dataSource: 'mock'`). You do **not** need MongoDB for the college demo.

### Optional: live API

```bash
# Needs MongoDB on mongodb://localhost:27017
npm run setup                 # creates apps/api/.env.development if missing
npm run dev:api
npm run seed --workspace apps/api
# then set appConfig.dataSource to 'api' and restart Metro
```

> After `npm install`, root `postinstall` builds `@nidavellir/shared`, and mobile `ensure-mobile-node-modules.js` restores RN symlinks for Android Gradle / Metro.

## Documentation

- `AI_AGENT_GUIDE.md` — **required for AI agents**: keep mock/live API, payments, nav, and docs aligned on every change.
- `PROJECT_INSIGHTS.md` — operating rules + live API / Razorpay switch notes.
- `DEVELOPER_GUIDE.md` — feature→file map and run instructions.
- `ARCHITECTURE.md` — full architecture plan.
- `INSTALLATION.md` — native tooling prerequisites.
- `TODO.md` / `PROJECT_PROGRESS.md` — project status and roadmap.

## Tech Stack

- **Mobile:** React Native, React Navigation, Redux Toolkit, TanStack Query, Reanimated, Gesture Handler, FlashList, react-native-image-picker, react-native-razorpay.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Zod, JWT, Helmet.
- **Tooling:** npm workspaces, Turborepo, strict TypeScript, ESLint, Prettier.

## Native Tooling

Bare React Native Community CLI (not Expo). Targets Android 10 (API 29) and iOS 16.0+. See `INSTALLATION.md` for the full prerequisite list (Xcode 16.2, JDK 17, Android SDK 35, etc.).
