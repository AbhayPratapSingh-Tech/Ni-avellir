# Niðavellir

Premium gaming merchandise marketplace — a full-stack mobile commerce app.

**Status: Demo-ready.** The mobile app and backend are implemented, wired, and typecheck cleanly. Cold start is onboarding → login/signup, then the shop.

## What's Included

- **Mobile app** (bare React Native CLI, no Expo): Onboarding, Login, Signup, OTP, Forge (Home), Categories, Search, Products, Product Detail, Cart, Checkout, Order Confirmation, Orders, Wishlist, Account, and Edit Profile.
- **Backend API** (Node.js + Express + MongoDB): products, cart quotes, orders, payment provider abstraction (Razorpay + COD), email provider abstraction (Resend), health, seed script.
- **Shared package** (`@nidavellir/shared`): contracts, types, constants, Zod validation, and expanded mock catalog (~28 products).
- **Shop UI**: light esports theme; daily sale window 09:00–16:00; You may also like shelf; image galleries, MRP / % off, sticky cart and PDP bars; write-review modal.
- **Account**: edit name / email / phone and profile photo (library, camera, or preset avatars).
- **Innovative features**: animated hero carousel (Reanimated), sale countdown, Rune XP loyalty widget, mock/live data switching.

## Quick Start

```bash
# 1. From repo root, install dependencies (npm workspaces)
npm install
# or: pnpm install

# 2. Run the mobile app (zero-setup demo mode)
npm run start --workspace apps/mobile
npm run android   # or: npm run ios

# 3. (Optional) Run the backend + seed demo data
npm run dev --workspace apps/api
npm run seed --workspace apps/api
```

> Set `dataSource: 'mock'` in `apps/mobile/src/config/appConfig.ts` for a fully offline demo. Flip it to `'api'` to use the live backend.

> After `npm install`, mobile runs `ensure-mobile-node-modules.js` so React Native stays linked under `apps/mobile/node_modules` for Android Gradle and Metro (workspace hoist otherwise breaks those paths).

## Documentation

- `DEVELOPER_GUIDE.md` — feature→file map and run instructions.
- `ARCHITECTURE.md` — full architecture plan.
- `INSTALLATION.md` — native tooling prerequisites.
- `TODO.md` / `PROJECT_PROGRESS.md` — project status and roadmap.

## Tech Stack

- **Mobile:** React Native, React Navigation, Redux Toolkit, TanStack Query, Reanimated, Gesture Handler, FlashList, react-native-image-picker.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Zod, JWT, Helmet.
- **Tooling:** npm/pnpm workspaces, Turborepo, strict TypeScript, ESLint, Prettier.

## Native Tooling

Bare React Native Community CLI (not Expo). Targets Android 10 (API 29) and iOS 16.0+. See `INSTALLATION.md` for the full prerequisite list (Xcode 16.2, JDK 17, Android SDK 35, etc.).
