# Niðavellir

Premium gaming merchandise marketplace — a full-stack mobile commerce app.

**Status: Demo-ready.** The mobile app and backend are implemented, wired, and typecheck cleanly.

## What's Included

- **Mobile app** (bare React Native CLI, no Expo): Home, Products, Product Detail, Cart, Checkout, Order Confirmation, Orders, Wishlist, and Profile screens.
- **Backend API** (Node.js + Express + MongoDB): products, cart quotes, orders, payment provider abstraction (Razorpay + COD), email provider abstraction (Resend), health, seed script.
- **Shared package** (`@nidavellir/shared`): contracts, types, constants, and Zod validation shared across mobile and API.
- **Innovative features**: animated hero carousel (Reanimated), flash-sale countdown, Rune XP loyalty widget, mock/live data switching.

## Quick Start

```bash
# 1. From repo root, install dependencies
pnpm install

# 2. Run the mobile app (zero-setup demo mode)
pnpm --filter mobile start
pnpm --filter mobile android   # or: pnpm --filter mobile ios

# 3. (Optional) Run the backend + seed demo data
pnpm --filter api dev
pnpm --filter api seed
```

> Set `dataSource: 'mock'` in `apps/mobile/src/config/appConfig.ts` for a fully offline demo. Flip it to `'api'` to use the live backend.

## Documentation

- `DEVELOPER_GUIDE.md` — feature→file map and run instructions.
- `ARCHITECTURE.md` — full architecture plan.
- `INSTALLATION.md` — native tooling prerequisites.
- `TODO.md` / `PROJECT_PROGRESS.md` — project status and roadmap.

## Tech Stack

- **Mobile:** React Native, React Navigation, Redux Toolkit, TanStack Query, Reanimated, Gesture Handler, FlashList.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Zod, JWT, Helmet.
- **Tooling:** pnpm workspaces, Turborepo, strict TypeScript, ESLint, Prettier.

## Native Tooling

Bare React Native Community CLI (not Expo). Targets Android 10 (API 29) and iOS 16.0+. See `INSTALLATION.md` for the full prerequisite list (Xcode 16.2, JDK 17, Android SDK 35, etc.).
