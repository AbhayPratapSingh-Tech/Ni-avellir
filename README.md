# Niðavellir

Premium gaming merchandise marketplace — a full-stack mobile commerce app.

**Status: Live API on Render + mobile wired.** Default `dataSource: 'api'` → `https://ni-avellir.onrender.com/api/v1`. Local API still available via `npm run dev:api`. Mock mode via `appConfig.dataSource: 'mock'`.

## What's Included

- **Mobile app** (bare React Native CLI, no Expo): Onboarding, Login, Signup, OTP, Forgot/Reset/Change password, Sessions, Email verify, Forge (Home), Categories, Search, Products, Product Detail (+ reviews), Cart (+ coupons), Checkout, Order Confirmation, Orders, Order Details (cancel/return/exchange), Addresses, Wishlist, Notifications, Account, Edit Profile.
- **Backend API** (Node.js + Express + MongoDB Atlas): auth/JWT, products, server cart, addresses, wishlist, coupons, reviews, notifications, serviceability, orders, Razorpay Test + COD, webhooks, health, seed script. Hosted on **Render Free** (`ni-avellir.onrender.com`).
- **Shared package** (`@nidavellir/shared`): contracts, types, constants, Zod validation, and expanded mock catalog (~28 products).
- **Payments**: native `react-native-razorpay` when live Test keys return `intent.demoMode === false` (demo sheet only without keys).
- **Account**: addresses CRUD, edit profile, orders with product images and details.
- **Keep-alive**: app silently pings `/health` on load + every 20 min while open (Render Free cold starts).

## Quick Start (clone → run)

```bash
git clone <your-repo-url> Ni-avellir
cd Ni-avellir
git checkout <your-branch>   # if not main

# 1. Install (also builds @nidavellir/shared via postinstall)
npm install

# 2. Copy API env example + link RN modules under apps/mobile
npm run setup

# 3. Mobile against live Render (current appConfig default)
npm run dev
npm run android   # or ios

# Optional — local API instead of Render:
#   put Atlas URI in apps/api/.env.development
#   npm run dev:api && npm run seed --workspace apps/api
#   point appConfig.apiBaseUrl back to http://10.0.2.2:4000/api/v1 (Android)
```

### Know the project is working

**Live (Render):**

```bash
curl -sS -m 90 https://ni-avellir.onrender.com/health
# expect {"service":"nidavellir-api","status":"ok"}
```

**Local API:**

```bash
npm run dev:api
npm run seed --workspace apps/api
curl -s http://localhost:4000/health
```

Mobile: `dataSource: 'api'`, `allowMockFallback: false`, `apiBaseUrl: 'https://ni-avellir.onrender.com/api/v1'`.

**College mock-only demo** (no Mongo/Render): set `dataSource: 'mock'`, then only `npm run dev` + device.

### API cURLs + JWT (Postman)

| Target | Doc |
|--------|-----|
| Live templates (no secrets) | [`API_DETAILS.live.example.md`](API_DETAILS.live.example.md) |
| Live JWT sheet (gitignored) | `python3 scripts/generate-api-details-local.py --live` |
| Local JWT sheet (gitignored) | `python3 scripts/generate-api-details-local.py` |

See also `API_DETAILS.example.md`, `DEVELOPER_GUIDE.md`, `AI_AGENT_GUIDE.md`.

> After `npm install`, root `postinstall` builds `@nidavellir/shared`, and mobile `ensure-mobile-node-modules.js` restores RN symlinks for Android Gradle / Metro.

## Documentation

- `AI_AGENT_GUIDE.md` — **required for AI agents**: keep mock/live API, payments, nav, and docs aligned on every change.
- `PROJECT_INSIGHTS.md` — operating rules + live API / Razorpay / Render notes.
- `DEVELOPER_GUIDE.md` — feature→file map and run instructions.
- `API_DETAILS.live.example.md` — **live Render cURLs for Postman**.
- `API_DETAILS.example.md` — how to generate JWT sheets (local + `--live`).
- `ARCHITECTURE.md` — full architecture plan.
- `INSTALLATION.md` — native tooling prerequisites.
- `TODO.md` / `PROJECT_PROGRESS.md` — project status and roadmap.
- `render.yaml` — Render Blueprint (build/start API only, not Metro).

## Tech Stack

- **Mobile:** React Native, React Navigation, Redux Toolkit, TanStack Query, Reanimated, Gesture Handler, FlashList, react-native-image-picker, react-native-razorpay.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Zod, JWT, Helmet. Deployed on Render.
- **Tooling:** npm workspaces, Turborepo, strict TypeScript, ESLint, Prettier.

## Native Tooling

Bare React Native Community CLI (not Expo). Targets Android 10 (API 29) and iOS 16.0+. See `INSTALLATION.md` for the full prerequisite list (Xcode 16.2, JDK 17, Android SDK 35, etc.).
