<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="apps/mobile/assets/brand/wordmark/nidavellir-stacked-transparent-for-dark-600w.png">
    <img alt="Niðavellir" width="360" src="apps/mobile/assets/brand/wordmark/nidavellir-stacked-transparent-for-light-600w.png">
  </picture>
</p>

<p align="center">Premium gaming merchandise, mobile shop plus live API.</p>

<p align="center">
  <img alt="React Native bare CLI" src="https://img.shields.io/badge/React_Native-bare%20CLI-20232A?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <a href="https://ni-avellir.onrender.com/health"><img alt="Live API" src="https://img.shields.io/badge/API-live%20on%20Render-FF7A1A?style=flat-square"></a>
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white">
</p>

## Project Breakdown

Niðavellir is a premium gaming merchandise marketplace: a bare React Native mobile app and a Node.js API on MongoDB. The default build talks to the live Render API.

## What's included

| Shop | Checkout | Account |
|------|----------|---------|
| Forge (Home, YouTube banner, Drop Zone, For you, Character Vault teaser)<br>Categories<br>Search and visual search camera<br>Products, including Anime `tag` PLP and Sort & filter modal (API-driven options)<br>Product detail (reviews, All Reviews, write-review modal, bundles, SVG confidence icons, Buy now → Checkout)<br>Wishlist<br>Store locator | Cart and coupons<br>Checkout (serviceability, Payment summary, Razorpay / COD)<br>Order confirmation (Rune XP)<br>Orders<br>Order details (cancel, return, exchange)<br>Addresses | Onboarding, Login, Signup, OTP<br>Forgot, Reset, and Change password<br>Devices and sessions (device, OS, IP)<br>Email verify<br>Notifications<br>Account and Edit Profile<br>Ask Niðavellir |

- **Backend API** (Node.js + Express + MongoDB Atlas): auth/JWT (register resilient to verify-email send failure), products + bundles + visual-search + for-you + `tag` / price / franchise / `minRating` / `inStockOnly` filters, server cart, addresses, wishlist, coupons, reviews, notifications, serviceability, orders (`Idempotency-Key`), Razorpay Test + COD + reconcile/expiry, webhooks, Resend, AI chat, loyalty, health, seed. Production on **Render Free** (`ni-avellir.onrender.com`, deploy branch **`todo`**). UAT on `nidavellir-api-uat.onrender.com` (branch `uat`, database `nidavellir_uat`) with the same routes.
- **Shared package** (`@nidavellir/shared`): contracts, types, constants, Zod validation, mock catalog, bundle display hints.
- **Loyalty:** Rune XP is 1 per ₹10 of goods (minimum 10, maximum 500, +25 for a bundle). Account → Rune rewards spends it (₹50 off, free shipping, early Drop Zone). A refund before ship takes those points back.
- **Payments**: native `react-native-razorpay` when live Test keys return `intent.demoMode === false` (demo sheet only without keys).
- **Keep-alive**: app silently pings `/health` on load + every 20 min while open (Render Free cold starts).

## Quick Start (clone → run)

```bash
git clone <url> Ni-avellir
cd Ni-avellir
git checkout Nidavellir      # production / default remote HEAD

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
#   set appConfig appEnvironment to 'local' (Android 10.0.2.2, iOS localhost)
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

Mobile: `dataSource: 'api'`, `allowMockFallback: false`, `appEnvironment: 'production'` (`https://ni-avellir.onrender.com/api/v1`). Use `'uat'` for the UAT host. Reload after the change. Account shows the active name.

**College mock-only demo** (no Mongo/Render): set `dataSource: 'mock'`, then only `npm run dev` + device.

### API cURLs + JWT (Postman)

| Target | Doc |
|--------|-----|
| Live templates (no secrets) | [`API_DETAILS.live.example.md`](API_DETAILS.live.example.md) |
| Live JWT sheet (gitignored) | `python3 scripts/generate-api-details-local.py --live` |
| Local JWT sheet (gitignored) | `python3 scripts/generate-api-details-local.py` |

See also `API_DETAILS.example.md`, `DEVELOPER_GUIDE.md`, `AI_AGENT_GUIDE.md`.

> After `npm install`, root `postinstall` builds `@nidavellir/shared`, and mobile `ensure-mobile-node-modules.js` restores RN symlinks for Android Gradle / Metro.

<details>
<summary><strong>Environments and what’s live</strong></summary>

**Status: Live API on Render + mobile wired.** Default `dataSource: 'api'` and `appEnvironment: 'production'` → `https://ni-avellir.onrender.com/api/v1`. Set `appEnvironment` to `'uat'` for `https://nidavellir-api-uat.onrender.com` (database `nidavellir_uat`). Render production deploys from branch **`todo`**. UAT deploys from **`uat`**. Resend verify email live; register still succeeds if verify-mail send fails. Character Vault, All Reviews, visual search, For you, Anime facet, PLP filters upgrade 1, idempotent checkout + reconcile shipped. GitHub Actions CI (lint, typecheck, tests, production build) runs on every pull request. OTP, password-reset, and verify-email sends are 5 per minute per IP (typed 429 when blocked); AI chat is not rate limited. Local API via `npm run dev:api` and `appEnvironment: 'local'`. Mock via `appConfig.dataSource: 'mock'`.

</details>

## Documentation (read these)

| Priority | File | Why |
|----------|------|-----|
| 1 | `AI_AGENT_GUIDE.md` | How to change the app without breaking mock/live/payments |
| 2 | `PROJECT_PROGRESS.md` | What’s done / next |
| 3 | `TODO.md` | Done vs deferred backlog |
| 4 | `PROJECT_INSIGHTS.md` | Live switch, Razorpay, Render, vault / reviews / visual search notes |
| 5 | `DEVELOPER_GUIDE.md` | Feature → file map + run commands |
| 6 | `README.md` | This file — clone / smoke / stack |
| — | `API_DETAILS.live.example.md` | Live Render cURLs for Postman |
| — | `API_DETAILS.example.md` | How to generate JWT sheets (local + `--live`) |
| — | `ARCHITECTURE.md` | Full architecture plan |
| — | `INSTALLATION.md` | Native tooling prerequisites |
| — | `CHANGELOG.md` | Notable shipped changes |
| — | `render.yaml` | Production Render blueprint only (branch **`Nidavellir`**). UAT is the separate service `nidavellir-api-uat`. |

## Tech Stack

- **Mobile:** React Native, React Navigation, Redux Toolkit, TanStack Query, Reanimated, Gesture Handler, FlashList, react-native-image-picker, react-native-razorpay.
- **Backend:** Node.js, Express, TypeScript, MongoDB (Mongoose), Zod, JWT, Helmet. Deployed on Render.
- **Tooling:** npm workspaces, Turborepo, strict TypeScript, ESLint, Prettier.

## Native Tooling

Bare React Native Community CLI (not Expo). Targets Android 10 (API 29) and iOS 16.0+. See `INSTALLATION.md` for the full prerequisite list (Xcode 16.2, JDK 17, Android SDK 35, etc.).
