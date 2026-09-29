# Developer Guide

A complete map of the Niðavellir codebase for the College Final Semester Project.

## Running on a Fresh Mac (to show the app to anyone)

> Full details in `INSTALLATION.md`. This is the short version.

```bash
# 1. Prerequisites (install once)
brew install node@22 npm
xcode-select --install      # iOS
sudo gem install cocoapods  # iOS

# 2. Clone + install
git clone <your-repo-url> Nidavellir
cd Nidavellir
npm install
npm run setup
cd apps/mobile/ios && pod install && cd ../../../

# 3. Live API path (current appConfig default: dataSource 'api' → Render)
#    Hosted: https://ni-avellir.onrender.com/api/v1 — only Metro needed:
npm run dev
npm run ios   # or: npm run android

# Optional local API instead of Render:
#   Put Atlas/local MONGODB_URI in apps/api/.env.development
#   npm run dev:api && npm run seed --workspace apps/api
#   set apiBaseUrl to http://localhost:4000/api/v1 (iOS) or 10.0.2.2 (Android)
```

**Know it works:** `curl -sS -m 90 https://ni-avellir.onrender.com/health` → `"status":"ok"`.  
Postman live cURLs: `API_DETAILS.live.example.md`. JWT sheet: `python3 scripts/generate-api-details-local.py --live`.

Mock-only (no Mongo/Render): set `appConfig.dataSource` to `'mock'`, then `npm run dev` + device.

## How to Run

### 1. Install dependencies (from repo root)

```bash
npm install
npm run setup
# or: pnpm install && npm run setup
```

`npm install` builds `@nidavellir/shared`. `npm run setup` copies `apps/api/.env.development` from the example (if missing) and restores mobile RN symlinks.

### 2. iOS — CocoaPods + run (macOS + Xcode)

Install CocoaPods once (if needed):

```bash
sudo gem install cocoapods
pod --version   # expect >= 1.16.x
```

Install native pods (Podfile is under `apps/mobile/ios`):

```bash
cd apps/mobile/ios
pod install
```

Then run with two terminals from the **repo root**:

```bash
# Terminal 1 — Metro
npm run --workspace apps/mobile start
# or: pnpm --filter mobile start

# Terminal 2 — iOS Simulator
npm run ios
# or: npm run --workspace apps/mobile ios
# or: pnpm --filter mobile ios
```

### 3. Run the mobile app (Android / general)

The app works in **two data modes** controlled by `apps/mobile/src/config/appConfig.ts`:

- `dataSource: 'mock'` → uses bundled demo data, **no server needed** (perfect for demos).
- `dataSource: 'api'` → requires the API + MongoDB (see below).

Start Metro:

```bash
npm run dev
# or: npm run start --workspace apps/mobile
# or: pnpm --filter mobile start
```

Then run on a device/emulator:

```bash
pnpm --filter mobile android   # Android
pnpm --filter mobile ios       # iOS (after pod install above)
```

### Build Android release APK

From the **repo root** (recommended):

```bash
npm run gradlew-android
# or
npm run android:release
```

Manual equivalent:

```bash
cd apps/mobile/android
./gradlew assembleRelease
```

Do **not** use `/gradlew` (root path). Use `./gradlew` from `apps/mobile/android`.  
APK: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`  
Details: `INSTALLATION.md` → *Build a release APK (Android)*.

### 4. Run the backend API (required when `dataSource: 'api'`)

```bash
# From repo root — three commands that prove the live stack
npm run dev:api
npm run seed --workspace apps/api
npm run dev
```

- `dev:api` — Express + Mongo on `http://localhost:4000` (`/api/v1/...`)
- `seed` — products, coupons (`FORGE10`, `WELCOME100` public; `SUMMER10`, `JUSTFORYOU` assigned to phone `8750996351`), serviceability rules, store locator pins (Bengaluru / Mumbai / Jaipur / Delhi)
- `seed:ops` — coupons + store pins only (does not wipe products): `npm run seed:ops --workspace apps/api`
- `dev` — Metro for the mobile app

Health check: `curl -s http://localhost:4000/health`

Local JWT + full cURL list (gitignored): `python3 scripts/generate-api-details-local.py` → `API_DETAILS.local.md`

Copy env from `apps/api/.env.development.example` if needed (`npm run setup`). Atlas URI or local Mongo both work.
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
│   │       ├── lib/            # Sale window, categories, product media helpers
│   │       ├── services/       # API client + data source abstraction
│   │       └── theme/          # Design tokens
│   └── api/                    # Node.js + Express + MongoDB backend
├── packages/
│   └── shared/                 # Shared contracts, types, constants, validation
├── PROJECT_PROGRESS.md         # Live phase status
├── TODO.md                     # Checklist
├── DEVELOPER_GUIDE.md          # Feature → file map
└── ARCHITECTURE.md             # Original architecture plan
```

---

## Feature → File Map

### Mobile App (`apps/mobile/src`)

| Feature | File |
|---|---|
| **App entry / root provider wiring** | `app/App.tsx` |
| **Providers (Redux, Query, Gesture, SafeArea, Toast)** | `app/providers/AppProviders.tsx` |
| **Redux store (auth + cart + wishlist + recent)** | `app/store/index.ts` |
| **Navigation (auth stack, then shop stack + tabs)** | `app/navigation/RootNavigator.tsx` |
| **Navigation Types** | `app/navigation/types.ts` |
| **Theme tokens (light esports: mist / ink / cobalt)** | `theme/tokens.ts` |
| **App config + feature flags** | `config/appConfig.ts` |
| **API client** | `services/api/apiClient.ts` |
| **Data source abstraction (mock/API)** | `services/data/productRepository.ts` |
| **Demo reviews** | `services/data/reviews.ts` |
| **Onboarding (3 full-screen slides)** | `features/auth/OnboardingScreen.tsx` |
| **Login** | `features/auth/LoginScreen.tsx` |
| **Sign up** | `features/auth/SignupScreen.tsx` |
| **OTP** | `features/auth/OtpScreen.tsx` |
| **Auth session (Redux)** | `features/auth/authSlice.ts` |
| **Home / Forge** | `features/home/HomeScreen.tsx` |
| **Hero + categories + deals + bestsellers + You may also like** | `features/home/HomeScreen.tsx` |
| **Daily sale window (09:00–16:00)** | `lib/saleWindow.ts` + `hooks/useCountdown.ts` |
| **Shop category list** | `lib/shopCategories.ts` |
| **Product images / INR / % off helpers** | `lib/productMedia.ts` |
| **Categories tab** | `features/categories/CategoriesScreen.tsx` |
| **Search screen** | `features/search/SearchScreen.tsx` |
| **Product card** | `components/commerce/ProductCard.tsx` |
| **Square / slider / price / gallery pieces** | `components/commerce/` |
| **Product list (PLP)** | `features/products/ProductsScreen.tsx` |
| **Product detail (PDP) + review modal** | `features/products/ProductDetailScreen.tsx` |
| **Cart (address card, stock chips, Hit the Anvil)** | `features/cart/CartScreen.tsx` |
| **Coupon offers modal (empty Apply)** | `features/cart/CouponOffersModal.tsx` — `GET /coupons` filtered by public or `userIds` (Mongo id / phone) |
| **Cart state (Redux slice)** | `features/cart/cartSlice.ts` |
| **Checkout flow** | `features/checkout/CheckoutScreen.tsx` |
| **Order confirmation** | `features/orders/OrderConfirmationScreen.tsx` |
| **Orders list** | `features/orders/OrdersScreen.tsx` |
| **Orders state (Redux)** | `features/orders/ordersSlice.ts` |
| **Wishlist screen** | `features/wishlist/WishlistScreen.tsx` |
| **Wishlist state (Redux slice)** | `features/wishlist/wishlistSlice.ts` |
| **Recently viewed** | `features/recent/recentSlice.ts` |
| **Account + Rune XP + logout** | `features/profile/ProfileScreen.tsx` |
| **AI Merch Assistant** | `features/ai/AIAssistantScreen.tsx` |
| **AI API client** | `services/ai/aiApi.ts` |
| **Voice STT hook** | `hooks/useSpeechToText.ts` |
| **Edit profile + avatar** | `features/profile/EditProfileScreen.tsx` |
| **Devices & sessions** | `features/profile/SessionsScreen.tsx` |
| **Verify email** | `features/profile/VerifyEmailScreen.tsx` |
| **Device label for sessions** | `services/session/deviceLabel.ts` |
| **Home YouTube video banner** | `components/commerce/VideoBanner.tsx` |
| **SVG icons (PDP / Account)** | `components/ui/AppIcon.tsx` |
| **Cached images + placeholder** | `components/ui/CachedImage.tsx` |
| **Restore RN symlinks after npm hoist** | `scripts/ensure-mobile-node-modules.js` |
| **Wait for Android package manager** | `scripts/wait-for-android-device.sh` |
| **Toasts / safe screen / stars / brand mark** | `components/ui/` |

### Backend API (`apps/api/src`)

| Feature | File |
|---|---|
| **Express app (middleware wiring)** | `app.ts` |
| **AI Merch Assistant** | `modules/ai/` (`POST /api/v1/ai/chat`) |
| **Server entry** | `server.ts` |
| **Environment config** | `config/env.ts` |
| **Health route** | `modules/health/health.routes.ts` |
| **Product model / controller / routes** | `modules/products/` |
| **Cart quote service/controller/routes** | `modules/cart/` |
| **Order model / service / controller / routes** | `modules/orders/` |
| **Payment provider abstraction** | `modules/payments/` |
| **Razorpay provider** | `modules/payments/providers/razorpay.provider.ts` |
| **COD provider** | `modules/payments/providers/cod.provider.ts` |
| **Email abstraction + branded HTML** | `integrations/email/email.factory.ts` |
| **Resend provider** | `integrations/email/providers/resend.provider.ts` |
| **Email smoke test** | `scripts/test-email.ts` (`npm run test:email --workspace apps/api`) |
| **Rune XP (100 / 500 bundle)** | `modules/orders/rune-xp.ts` |
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
| **Demo/mock data (~28 products)** | `mock-data.ts` |
| **Also-like collection tag constant** | `ALSO_LIKE_TAG` in `mock-data.ts` |

---

## Key Configuration

### Switch between mock and live data

Edit `apps/mobile/src/config/appConfig.ts`:

```ts
export const appConfig = {
  dataSource: 'api', // 'mock' for offline college demo
  allowMockFallback: false,
  apiBaseUrl: 'https://ni-avellir.onrender.com/api/v1',
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
  aiAssistant: true,   // Heimdall chat
  voiceInput: true,    // mic on Search / Heimdall
  storeLocator: true,  // header pin → StoreLocator (OSM WebView map)
}
```

**Store locator:** `ShopHeader` location icon → `StoreLocator` route. Area search uses `GET /api/v1/stores/geocode` with a **free** provider chain (Open-Meteo → Photon → builtin city centroids → Nominatim). The app also geocodes via Open-Meteo on-device if the API fails. Store cards come from `GET /api/v1/stores` (seeded via `npm run seed --workspace apps/api`). Map: `react-native-webview` + Leaflet/OSM tiles (no Google/Mapbox key). Replace `apps/mobile/assets/brand/logo.png` and set `USE_BRAND_LOGO_PNG` in `BrandMark` for a real header mark.

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

- **Live (default):** `dataSource: 'api'` against Render — no local Mongo required. Free-tier cold starts are normal; keep-alive helps.
- **Offline mock:** set `dataSource: 'mock'` for a zero-setup demo with bundled catalog.
- Guest may browse + cart; checkout / wishlist need login.
- The shop uses a **light esports** theme (mist background, ink type, cobalt accent), not a dark neon look. Onboarding slides stay dark/full-bleed.
- Tabs: **Forge**, **Categories**, **Cart**, **Account**.
- Talking points: live Resend verify email, Rune XP (100 / 500 bundle), anime bundles, Razorpay Test, Devices & sessions, Home video banner.
- Full commerce flow: Onboarding → Login → Home → Products → Product Detail → Cart → Checkout → Order Confirmation → Orders / Edit Profile.
