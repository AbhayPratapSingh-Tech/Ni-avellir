# Developer Guide

A complete map of the Niðavellir codebase for the College Final Semester Project.

## Running on a Fresh Mac (to show the app to anyone)

> Full details in `INSTALLATION.md`. This is the short version.

```bash
# 1. Prerequisites (install once)
brew install node@22 npm   # then: npm install -g pnpm@9
xcode-select --install      # iOS
sudo gem install cocoapods  # iOS

# 2. Clone + install
git clone <your-repo-url> Nidavellir
cd Nidavellir
pnpm install
cd apps/mobile && pod install && cd ../../

# 3. Set offline demo mode (recommended — no server needed)
#    In apps/mobile/src/config/appConfig.ts set: dataSource: 'mock'

# 4. Run — two terminals
pnpm --filter mobile start   # terminal 1: Metro
pnpm --filter mobile ios     # terminal 2: iOS simulator (or: mobile android)
```

The app then opens in the iOS Simulator / Android emulator and works fully offline with bundled demo data.

## How to Run

### 1. Install dependencies (from repo root)

```bash
pnpm install
```

### 2. Run the mobile app (bare React Native)

The app works in **two data modes** controlled by `apps/mobile/src/config/appConfig.ts`:

- `dataSource: 'mock'` → uses bundled demo data, **no server needed** (perfect for demos).
- `dataSource: 'api'` → requires the API + MongoDB (see below).

Start Metro:

```bash
pnpm --filter mobile start
```

Then run on a device/emulator:

```bash
pnpm --filter mobile android   # Android
pnpm --filter mobile ios       # iOS (macOS + Xcode required)
```

### 3. Run the backend API (optional, for `api` mode)

```bash
# From repo root
pnpm --filter api dev
```

Seed the database with demo products:

```bash
pnpm --filter api seed
```

Requires a local MongoDB (default `mongodb://localhost:27017/nidavellir_dev`).

---

## Project Structure

```text
Nidavellir/
├── apps/
│   ├── mobile/                 # React Native app
│   │   └── src/
│   │       ├── app/            # App entry, providers, store, navigation
│   │       ├── components/     # Reusable UI components
│   │       ├── config/         # App-wide config + feature flags
│   │       ├── features/       # Feature-specific screens & logic
│   │       ├── hooks/          # Shared hooks
│   │       ├── services/       # API client + data source abstraction
│   │       └── theme/          # Design tokens
│   └── api/                    # Node.js + Express + MongoDB backend
├── packages/
│   └── shared/                 # Shared contracts, types, constants, validation
└── docs/                       # Architecture, roadmap, progress docs
```

---

## Feature → File Map

### Mobile App (`apps/mobile/src`)

| Feature | File |
|---|---|
| **App entry / root provider wiring** | `app/App.tsx` |
| **Providers (Redux, Query, Gesture, SafeArea)** | `app/providers/AppProviders.tsx` |
| **Redux store (cart + wishlist)** | `app/store/index.ts` |
| **Navigation (stack + tabs)** | `app/navigation/RootNavigator.tsx` |
| **Navigation Types** | `app/navigation/types.ts` |
| **Theme tokens (colors, spacing, typography)** | `theme/tokens.ts` |
| **App config + feature flags** | `config/appConfig.ts` |
| **API client** | `services/api/apiClient.ts` |
| **Data source abstraction (mock/API)** | `services/data/productRepository.ts` |
| **Home screen** | `features/home/HomeScreen.tsx` |
| **Hero carousel + glow animation** | `features/home/HomeScreen.tsx` |
| **Flash-sale countdown** | `hooks/useCountdown.ts` |
| **Product card component** | `components/commerce/ProductCard.tsx` |
| **Product list (search/sort/filter)** | `features/products/ProductsScreen.tsx` |
| **Product detail** | `features/products/ProductDetailScreen.tsx` |
| **Cart screen** | `features/cart/CartScreen.tsx` |
| **Cart state (Redux slice)** | `features/cart/cartSlice.ts` |
| **Checkout flow** | `features/checkout/CheckoutScreen.tsx` |
| **Order confirmation** | `features/orders/OrderConfirmationScreen.tsx` |
| **Orders list** | `features/orders/OrdersScreen.tsx` |
| **Wishlist screen** | `features/wishlist/WishlistScreen.tsx` |
| **Wishlist state (Redux slice)** | `features/wishlist/wishlistSlice.ts` |
| **Profile + Rune XP gamification** | `features/profile/ProfileScreen.tsx` |

### Backend API (`apps/api/src`)

| Feature | File |
|---|---|
| **Express app (middleware wiring)** | `app.ts` |
| **Server entry** | `server.ts` |
| **Environment config** | `config/env.ts` |
| **Health route** | `modules/health/health.routes.ts` |
| **Product model / controller / routes** | `modules/products/` |
| **Cart quote service/controller/routes** | `modules/cart/` |
| **Order model / service / controller / routes** | `modules/orders/` |
| **Payment provider abstraction** | `modules/payments/` |
| **Razorpay provider** | `modules/payments/providers/razorpay.provider.ts` |
| **COD provider** | `modules/payments/providers/cod.provider.ts` |
| **Email abstraction** | `integrations/email/` |
| **Resend provider** | `integrations/email/providers/resend.provider.ts` |
| **Error handler** | `common/middleware/error-handler.ts` |
| **App errors** | `common/errors/app-error.ts` |
| **Logger** | `common/logger/logger.ts` |
| **Seed script** | `scripts/seed.ts` |

### Shared Package (`packages/shared/src`)

| Item | File |
|---|---|
| **Product types** | `types/product.ts` |
| **Money type** | `types/money.ts` |
| **Cart / order types** | `types/cart.ts`, `types/order.ts` |
| **Product constants** | `constants/product-types.ts` |
| **Contracts** | `contracts/` |
| **Zod validation** | `validation/` |
| **Demo/mock data** | `mock-data.ts` |

---

## Key Configuration

### Switch between mock and live data

Edit `apps/mobile/src/config/appConfig.ts`:

```ts
export const appConfig = {
  dataSource: 'mock', // change to 'api' for the live backend
  apiBaseUrl: 'http://localhost:4000/api/v1',
  ...
};
```

### Enable/disable innovative features

The same file has feature flags:

```ts
features: {
  forgeStudio: true,   // Forge customizer (experimental)
  runeXp: true,        // Rune XP loyalty widget
  heroCarousel: true,  // animated hero carousel
  flashSale: true,     // flash-sale countdown
}
```

---

## Typechecking

Both the mobile app and the API typecheck cleanly:

```bash
# From repo root
npx tsc --noEmit -p apps/mobile/tsconfig.json
npx tsc --noEmit -p apps/api/tsconfig.json
```

---

## Notes for the College Demo

- Set `dataSource: 'mock'` in `appConfig.ts` for a **zero-setup** demo that works entirely offline with bundled data.
- The app ships with a dark, premium gaming theme, animated hero carousel, flash-sale countdown, and a Rune XP loyalty widget — great talking points.
- Full commerce flow is wired: Home → Products → Product Detail → Cart → Checkout → Order Confirmation.
