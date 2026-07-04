# Nidavellir Architecture Plan

Status: Phase 1 revised draft. Implementation must not begin until this architecture is approved and all required decisions in section 16 are answered.

## 1. Project Summary

Nidavellir is a production-oriented cross-platform mobile commerce application for premium gaming merchandise. The first release should support customer shopping flows, authenticated accounts, product discovery, cart, checkout preparation, order history, reviews, notifications, and an admin API foundation for catalog and operations.

The architecture is intentionally split into a React Native mobile app and a Node.js REST API so the business can later connect real infrastructure with minimal redesign: MongoDB Atlas, Cloudinary, payment gateways, domain, CDN, observability, and app-store distribution.

## 2. Architecture Principles

- Build in iterative phases and stop for approval after each phase.
- Do not implement ambiguous requirements without asking.
- Keep customer app concerns separate from backend, admin, infrastructure, and docs.
- Use strict TypeScript across frontend and backend.
- Use feature modules instead of large global folders.
- Validate input at every boundary with Zod or schema-level validation.

- Design APIs as versioned contracts, not temporary handlers.
- Make payments pluggable through a provider interface.
- Make product search and filtering API-first so the mobile UI remains fast.
- Prefer server-side authorization and database constraints over client trust.
- Add tests as features are implemented, not afterward.

## 3. Proposed Monorepo Structure

```text
Nidavellir/
  pnpm-workspace.yaml
    # Declares apps/* and packages/* as pnpm workspaces.
  turbo.json
    # Defines cached build, lint, test, and typecheck task pipeline.
  tsconfig.base.json
    # Shared strict TypeScript compiler options extended by every workspace.
  .gitignore
    # Ignores local/generated artifacts while keeping native source committed.
  .husky/
    # Git hooks for pre-commit quality checks.
  apps/
    mobile/
      package.json
      index.js
      babel.config.js
      metro.config.js
      ios/
        Nidavellir.xcodeproj/
        Nidavellir.xcworkspace/
        Podfile
        Configs/
          Dev.xcconfig
          Staging.xcconfig
          Production.xcconfig
        # First-class committed iOS native project managed with CocoaPods.
        # xcconfig files define per-environment bundle IDs, display names, and API base URLs.
      android/
        settings.gradle
        build.gradle
        app/
          build.gradle
        gradle/
        # First-class committed Android Gradle project.
        # app/build.gradle defines dev, staging, and production product flavors with distinct applicationIdSuffix and app-name resValue overrides.
      src/
        app/
          App.tsx
          providers/
          navigation/
          store/
        assets/
          animations/
          fonts/
          images/
        components/
          ui/
          commerce/
          feedback/
          layout/
        features/
          auth/
          home/
          products/
          search/
          cart/
          checkout/
            PaymentMethodSelector.tsx
            PaymentMethodSelector.ios.tsx
            PaymentMethodSelector.android.tsx
          orders/
          wishlist/
          profile/
          notifications/
        hooks/
        services/
          api/
          storage/
          analytics/
        theme/
        utils/
        types/
        __tests__/
    api/
      package.json
      .env.development.example
      .env.staging.example
      .env.production.example
      src/
        app.ts
        server.ts
        config/
        database/
        modules/
          auth/
          users/
          products/
          categories/
          brands/
          cart/
          wishlist/
          orders/
          checkout/
          payments/
          addresses/
          reviews/
          coupons/
          notifications/
          banners/
          inventory/
          analytics/
          admin/
        common/
          errors/
          middleware/
          validation/
          security/
          pagination/
          logger/
          types/
        integrations/
          cloudinary/
          email/
          payments/
        docs/
          swagger/
        tests/
          unit/
          integration/
  packages/
    shared/
      package.json
        # Package identity, e.g. @nidavellir/shared, consumed through pnpm workspace protocol.
      tsconfig.json
        # Extends ../../tsconfig.base.json for strict shared contracts.
      src/
        contracts/
        constants/
        types/
        validation/
  docs/
    decisions/
    diagrams/
  docker/
    api.Dockerfile
    docker-compose.yml
  scripts/
  .github/
    workflows/
  README.md
  ARCHITECTURE.md
  API.md
  DATABASE.md
  SECURITY.md
  TESTING.md
  DEPLOYMENT.md
  ROADMAP.md
  TODO.md
  PROJECT_PROGRESS.md
  CHANGELOG.md
  KNOWN_BUGS.md
  FEATURE_REQUESTS.md
  PROJECT_INSIGHTS.md
```

Shared package consumption:

- `packages/shared/package.json` exposes the package as `@nidavellir/shared`.
- `apps/mobile/package.json` and `apps/api/package.json` consume it with `"@nidavellir/shared": "workspace:*"`.
- Import path convention should stay stable and explicit, for example `import { OrderSchema } from '@nidavellir/shared/validation'` or `import type { ProductSummary } from '@nidavellir/shared/types'`.
- Shared code is for contracts, constants, types, and validation that must be identical across mobile and API. It must not import React Native, Express, Mongoose, or other app-specific runtime dependencies.

## 4. Frontend Architecture

Required choice: bare React Native Community CLI, not Expo.

Reasoning:

- The project must own real native source from day one through committed `ios/` and `android/` folders.
- Native payment SDKs, push notification setup, app-store build signing, Android Gradle configuration, CocoaPods, and future native debugging should be explicit and hand-maintained.
- The app will be initialized with `npx @react-native-community/cli init`.
- Xcode and Android Studio are local prerequisites for native build/run/debug work.

Frontend layers:

- `app`: root providers, navigation, store setup, error boundaries.
- `features`: screen-specific business modules.
- `components`: reusable visual components with no feature ownership.
- `services`: API clients, token refresh logic, storage adapters, analytics.
- `theme`: dark default theme, spacing, color tokens, typography.
- `packages/shared`: API contracts and shared validation where useful.

State strategy:

- Server state: TanStack Query for products, orders, banners, reviews, search, user profile.
- Client state: Redux Toolkit for auth session, cart UI state, global preferences, checkout draft.
- Persistence: Redux Persist for durable non-sensitive state; MMKV for fast local key-value storage; secure storage for tokens if the chosen runtime supports it.
- Forms: React Hook Form with Zod validation.
- Secure token storage: `react-native-keychain` using iOS Keychain and Android Keystore.

Performance strategy:

- FlashList for product grids and large lists.
- Image optimization from Cloudinary transformations.
- Pagination and infinite queries for listings.
- Memoized selectors for Redux.
- Debounced search.
- Skeleton and shimmer states for perceived speed.
- Reanimated for purposeful transitions only.

Native project policy:

- `ios/` contains the Xcode project/workspace and CocoaPods-managed native dependencies.
- `android/` contains the Gradle project, app module, and native Android build configuration.
- These folders are source code and must be committed to git.
- They are not treated as disposable generated output.

Language and file convention:

- React component files use `.tsx`.
- Non-component TypeScript files use `.ts`.
- No `.jsx` files are allowed in `apps/mobile` or `apps/api`.
- No `.js` files are allowed where a `.ts`, `.tsx`, `.cts`, or `.mts` variant is supported.
- Required JavaScript exceptions must be listed explicitly when Phase 2 scaffolds the project:
  - `apps/mobile/index.js`: React Native's default native entry file may be required by Metro/AppRegistry.
  - `apps/mobile/babel.config.js`: Babel config commonly requires CommonJS JavaScript.
  - `apps/mobile/metro.config.js`: Metro config commonly requires CommonJS JavaScript.
  - Other `.js` files need a documented tooling reason before being added.
- `tsconfig.json` must set `"strict": true` in `apps/mobile`, `apps/api`, and `packages/shared` from day one.

Platform-specific files:

- Use React Native Metro extension resolution only when behavior genuinely diverges by platform.
- Supported examples: `ComponentName.ios.tsx`, `ComponentName.android.tsx`, `ComponentName.native.tsx`, and fallback `ComponentName.tsx`.
- Do not split files preemptively when the UI and behavior are identical.
- Likely platform-specific areas: payment sheet integration, push notification registration, native share sheets, permissions prompts, safe-area/notch handling, and in-app review prompts.

## 5. Backend Architecture

Recommended backend: Node.js, Express.js, TypeScript, MongoDB, Mongoose, REST API.

Backend layers per module:

- `*.routes.ts`: versioned route definitions.
- `*.controller.ts`: HTTP request/response mapping only.
- `*.service.ts`: business logic and orchestration.
- `*.repository.ts`: database access.
- `*.model.ts`: Mongoose schema.
- `*.validation.ts`: Zod/Joi-compatible request validation.
- `*.types.ts`: module-specific types.
- `*.test.ts`: unit or integration tests.

Cross-cutting services:

- Central error handler with typed application errors.
- Request validation middleware.
- Authentication and role authorization middleware.
- Pagination/filter/sort helper.
- Rate limiting by route sensitivity.
- Swagger/OpenAPI documentation.
- Structured logging.
- Cloudinary upload/delete service.
- Email service abstraction for verification and password reset.
- Payment provider abstraction.

## 6. Dependency Plan

Frontend dependencies:

- `react-native`: mobile runtime.
- `typescript`: static typing.
- `@react-navigation/native`: navigation foundation.
- `@react-navigation/native-stack`: stack navigation.
- `@react-navigation/bottom-tabs`: customer app tab navigation.
- `@reduxjs/toolkit`: predictable client state management.
- `react-redux`: React bindings for Redux.
- `redux-persist`: persistence for selected Redux slices.
- `@tanstack/react-query`: server-state caching, retries, pagination.
- `axios`: HTTP client with interceptors for auth refresh.
- `react-hook-form`: performant form state.
- `zod`: runtime validation and typed schemas.
- `react-native-reanimated`: smooth native-thread animations.
- `react-native-gesture-handler`: gesture primitives needed by navigation and interactions.
- `@shopify/flash-list`: high-performance product lists.
- `react-native-svg`: icons, gradients, vector UI assets.
- `@react-native-async-storage/async-storage`: basic persisted storage support.
- `react-native-mmkv`: fast local persistence for selected app state.
- `react-native-keychain`: secure token storage through iOS Keychain and Android Keystore.
- `react-native-fast-image`: candidate for performant remote image rendering and caching. At implementation time, verify maintenance status; if it is not suitable, document a plain React Native `Image` plus Cloudinary caching strategy instead.
- `lottie-react-native`: limited use for loading, empty states, and success states.
- `date-fns`: date formatting for orders and countdowns.
- `react-native-safe-area-context`: safe-area layout.
- `react-native-screens`: native navigation screen optimization.
- `@react-native-firebase/app`: Firebase native foundation if Firebase Messaging is selected.
- `@react-native-firebase/messaging`: FCM push notifications for Android and iOS APNs token integration where appropriate.

Expo-only packages are not allowed. Before Phase 7 begins, any desired mobile capability must be mapped to a bare React Native equivalent module by module instead of silently dropping functionality.

Backend dependencies:

- `express`: REST server.
- `typescript`: static typing.
- `mongoose`: MongoDB modeling and indexes.
- `zod`: request validation.
- `jsonwebtoken`: access and refresh token signing.
- `bcrypt`: password hashing.
- `helmet`: secure HTTP headers.
- `cors`: controlled cross-origin access.
- `express-rate-limit`: brute-force and abuse protection.
- `express-mongo-sanitize`: MongoDB operator injection protection.
- Maintained sanitization approach: selected during Phase 4 after evaluating currently maintained packages and field-level sanitization needs. Do not install `xss-clean` because it is deprecated/unmaintained.
- `dotenv`: environment configuration.
- `cloudinary`: image upload, transformation, and deletion.
- `multer`: multipart upload handling before Cloudinary.
- `swagger-jsdoc`: OpenAPI generation.
- `swagger-ui-express`: hosted API documentation.
- `cookie-parser`: optional refresh-token cookie support.
- `nodemailer` or email provider SDK: email verification and password reset.
- `morgan` or `pino-http`: request logging.
- `pino`: structured application logging.
- `compression`: response compression.
- `http-status`: readable status-code constants.
- `nanoid`: public-safe IDs where useful.

Testing and quality dependencies:

- `jest`: unit and integration test runner.
- `ts-jest` or `swc/jest`: TypeScript test transformation.
- `supertest`: backend HTTP integration tests.
- `mongodb-memory-server`: isolated backend database tests.
- `@testing-library/react-native`: component tests.
- `msw`: API mocking for frontend tests.
- `eslint`: linting.
- `prettier`: formatting.
- `husky`: git hooks.
- `lint-staged`: pre-commit checks.
- `turbo`: monorepo task orchestration and caching across mobile, API, and shared packages.

Infrastructure dependencies:

- `docker`: reproducible API and MongoDB local development.
- `docker-compose`: local multi-service environment.
- GitHub Actions: CI for lint, typecheck, tests, build.
- `fastlane`: native iOS and Android build/release automation from GitHub Actions.

Proposed native tooling pins for Phase 2:

- Xcode: 16.2 minimum.
- CocoaPods: 1.16.2.
- JDK: 17.0.12.
- Android SDK Platform: 35.
- Android SDK Build Tools: 35.0.0.
- Android Gradle Plugin: 8.7.3.
- Gradle: 8.10.2.
- Node.js: 22.11.0 LTS.
- Package manager: pnpm 9.15.4.

These pins must be rechecked against the final React Native version selected in Phase 2 after the minimum supported Android/iOS versions are answered.

## 7. MongoDB Schema Design

Collections:

- `users`: account, role, auth status, profile summary.
- `refreshTokens`: hashed refresh tokens, rotation metadata, device info.
- `products`: product catalog, SEO slug, price, media, status.
- `productVariants`: SKU-level options, price overrides, inventory link.
- `categories`: hierarchical product grouping.
- `brands`: brand metadata.
- `inventory`: stock by SKU/variant, reserved quantity, low-stock threshold.
- `carts`: active cart by user or guest session.
- `wishlists`: saved products per user.
- `addresses`: shipping and billing addresses.
- `orders`: immutable order snapshot after placement.
- `payments`: provider transaction state and audit metadata.
- `reviews`: ratings and moderated review content.
- `coupons`: discount rules, validity windows, usage limits.
- `notifications`: user notifications and read state.
- `banners`: home carousel and campaign content.
- `analyticsEvents`: coarse server-side business events.

Core schema notes:

- Products reference categories, brands, and variants.
- Orders embed product snapshots to preserve historical price/name/media.
- Cart items reference product and variant, but totals are recalculated server-side.
- Reviews reference user and product; enforce one review per purchased product per user if required.
- Refresh tokens are stored hashed, not as raw tokens.
- Payment records are separate from orders to support retries and provider webhooks.

Important indexes:

- `users.email` unique.
- `products.slug` unique.
- `products.status`, `products.categoryIds`, `products.brandId`.
- `products.name` text or future external search index.
- `productVariants.sku` unique.
- `orders.userId + createdAt`.
- `reviews.productId + createdAt`.
- `reviews.userId + productId` unique if one-review policy is approved.
- `coupons.code` unique.
- `refreshTokens.userId + tokenFamily`.
- TTL indexes for email verification and password reset tokens if stored separately.

Scalability risks:

- MongoDB text search may be acceptable for MVP, but advanced search should move to Meilisearch, Typesense, Elasticsearch, or Atlas Search.
- Inventory changes need atomic updates or transactions to prevent overselling.
- Orders and payments need idempotency keys.
- Analytics events can grow quickly and may need retention policies or a separate analytics store.

## 8. API Surface

API version prefix: `/api/v1`.

Public:

- `GET /health`
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `GET /api/v1/categories`
- `GET /api/v1/brands`
- `GET /api/v1/banners`
- `GET /api/v1/search`

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

Customer:

- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `GET /api/v1/addresses`
- `POST /api/v1/addresses`
- `PATCH /api/v1/addresses/:id`
- `DELETE /api/v1/addresses/:id`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:itemId`
- `DELETE /api/v1/cart/items/:itemId`
- `POST /api/v1/cart/apply-coupon`
- `DELETE /api/v1/cart/coupon`
- `GET /api/v1/wishlist`
- `POST /api/v1/wishlist/items`
- `DELETE /api/v1/wishlist/items/:productId`
- `POST /api/v1/checkout/quote`
- `POST /api/v1/orders`
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `POST /api/v1/reviews`
- `PATCH /api/v1/reviews/:id`
- `DELETE /api/v1/reviews/:id`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

Payments:

- `POST /api/v1/payments/intents`
- `POST /api/v1/payments/:provider/webhook`
- `GET /api/v1/payments/:id`

Admin:

- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id`
- `POST /api/v1/admin/products/:id/images`
- `PATCH /api/v1/admin/inventory/:sku`
- `GET /api/v1/admin/orders`
- `PATCH /api/v1/admin/orders/:id/status`
- `POST /api/v1/admin/coupons`
- `PATCH /api/v1/admin/coupons/:id`
- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/role`
- `POST /api/v1/admin/banners`
- `PATCH /api/v1/admin/banners/:id`
- `GET /api/v1/admin/analytics/overview`

All list endpoints must support pagination. Product list and search endpoints must support filtering, sorting, and availability controls.

## 9. Authentication Flow

Registration:

1. User submits name, email, password.
2. API validates request and checks unique email.
3. Password is hashed with bcrypt.
4. User is created with `emailVerified: false`.
5. Verification token is generated and emailed.
6. API returns a safe user summary.

Login:

1. User submits email and password.
2. API validates credentials and account status.
3. API creates a short-lived access token and a long-lived refresh token.
4. Refresh token is stored hashed with device metadata.
5. Mobile stores access token in memory where possible and refresh token in secure storage.

Refresh:

1. Mobile calls refresh endpoint when access token expires.
2. API verifies refresh token hash and token family.
3. API rotates refresh token.
4. Reuse of an old refresh token revokes the token family.

Logout:

1. Mobile calls logout.
2. API revokes current refresh token.
3. Mobile clears auth state and sensitive storage.

Password reset:

1. User requests reset by email.
2. API sends a time-limited token.
3. User submits token and new password.
4. API hashes new password and revokes existing refresh tokens.

Authorization:

- Customer role can access personal resources.
- Admin role can access admin APIs.
- Server checks ownership on every user-owned resource.

## 10. Environment Separation

The system must support `development`, `staging`, and `production` environments as separate deployable targets.

API:

- Separate environment variable files/templates per environment.
- Separate MongoDB connection strings per environment.
- Separate Cloudinary folders or accounts per environment.
- Separate JWT secrets and token rotation settings per environment.
- Separate CORS allowlists per environment.

Mobile:

- Android uses distinct application IDs, such as `com.nidavellir.app.dev`, `com.nidavellir.app.staging`, and `com.nidavellir.app`.
- iOS uses distinct bundle IDs, such as `com.nidavellir.app.dev`, `com.nidavellir.app.staging`, and `com.nidavellir.app`.
- Dev, staging, and production builds must be installable on the same physical device at the same time.
- Environment-specific display names should make non-production builds obvious.

## 11. Push Notifications

Push notifications are planned through native infrastructure, not Expo Push Service.

- Android: Firebase Cloud Messaging through `@react-native-firebase/messaging`.
- iOS: APNs setup through Firebase Messaging or direct APNs certificates, to be decided when push implementation begins.
- Backend: notifications are routed through the existing `notifications` module.
- Notification records remain in MongoDB for in-app notification history and read state.
- Device tokens are stored per user/device with revocation support.
- Transactional notifications include order updates, payment state changes, security events, and promotional campaigns if the user opts in.

## 12. OTA Update Policy

No OTA JavaScript update dependency is planned for MVP.

- Microsoft App Center CodePush was retired on March 31, 2025, so it is not viable.
- JS and native changes ship together through normal App Store and Play Store releases.
- If OTA becomes a real business need later, evaluate a self-hosted/open-source option such as `hot-updater` as a separate explicitly approved architecture decision.

## 13. Navigation Flow

Root decision:

- Splash/bootstrap checks persisted state and refreshes auth if needed.
- Unauthenticated users enter `AuthStack`.
- Authenticated customers enter `CustomerTabs`.
- Admin functions should be web-dashboard first in a future phase, but admin APIs are backend-ready.

AuthStack:

- Welcome or Login
- Register
- Forgot Password
- Reset Password
- Email Verification

CustomerTabs:

- Home
- Search
- Cart
- Wishlist
- Profile

Nested product flow:

- Home/Search -> Product Listing -> Product Details -> Image Gallery -> Reviews -> Related Products

Checkout flow:

- Cart -> Address Selection -> Delivery Options -> Payment Method -> Order Review -> Order Confirmation

Profile flow:

- Profile -> Orders -> Order Details
- Profile -> Addresses
- Profile -> Notifications
- Profile -> Settings
- Profile -> Support

## 14. UI/UX Flow

Visual direction:

- Dark mode by default.
- Premium gaming feel inspired by modern hardware brands while remaining original.
- Use high contrast, sharp layout, subtle glow accents, and polished motion.
- Avoid animation overload; animations should clarify state, feedback, hierarchy, or progress.

Home:

- Animated hero campaign carousel.
- Category rail with icon/image cards.
- Featured collections.
- Flash sale countdown.
- Product sections with FlashList.
- Pull-to-refresh.
- Search bar entry point.
- Notification icon with unread state.

Product listing:

- Sort/filter sheet.
- Price slider.
- Brand/category/rating/availability filters.
- Product cards with price, badge, rating, wishlist, and add-to-cart affordance.
- Skeleton loading and empty states.

Product detail:

- Image gallery with zoom.
- Variant selector.
- Stock and delivery hints.
- Add to cart.
- Wishlist.
- Reviews and related products.

Cart:

- Persistent item list.
- Quantity controls.
- Coupon input.
- Shipping/tax estimate.
- Order summary.
- Checkout CTA.

Checkout:

- Step-based flow with clear progress.
- Address, coupon, payment, review.
- Payment layer starts with abstract provider support and can add Stripe/Razorpay/PayPal/UPI/COD later.

Error states:

- Offline banner.
- Retry actions for network failures.
- Specific screens for 401, 403, 404, 422, 429, 500.
- Graceful empty states for cart, wishlist, search, and orders.

## 15. Future Scalability Issues

- Search: product search can outgrow MongoDB text search.
- Inventory: concurrent purchases need atomic reservations and possibly order expiry jobs.
- Payments: webhooks must be idempotent and audited.
- Media: Cloudinary folder strategy and deletion lifecycle must be planned early.
- Cart: guest cart merge during login can create duplicate variants without deterministic merge rules.
- Admin: mobile-only admin is not ideal; plan a separate web admin later.
- Notifications: in-app notifications are simple, but push notifications need provider-specific setup.
- Analytics: raw event volume can grow quickly and needs retention.
- Testing: 100% coverage is expensive; enforce high coverage while prioritizing critical flows.
- App performance: heavy animation and large imagery can hurt mid-range Android devices.
- Secrets: never ship API secrets in the mobile app.
- Native build ownership: bare React Native gives control, but native dependency upgrades require more discipline.
- Push notifications: APNs certificates, FCM config, and token lifecycle can become operationally complex.
- Environment separation: misconfigured bundle IDs or application IDs can accidentally point test apps at production APIs.

## 16. Required Decisions Before Phase 2

Phase 2 cannot begin until the user explicitly answers each decision below.

1. Target region/market and primary currency.
2. Guest checkout allowed, or registration required before checkout.
3. First payment provider to implement, and whether Cash on Delivery is in MVP.
4. Real email provider for verification and reset emails.
5. Admin plan: API-only for now, or web dashboard planned in this repository later.
6. Digital gift cards: MVP product type or later product type.
7. Minimum supported Android and iOS versions.
8. App display name: `Nidavellir` ASCII or `Niðavellir` with eth for user-facing branding, App Store/Play Store listing, and display name. Special characters must not appear in the actual bundle identifier or Android package name regardless of display-name choice.

## 17. Testing Strategy

Coverage target:

- Overall coverage target is 80-90% as a health metric, not a hard universal gate.
- Near-100% coverage is mandatory for authentication flows, payment intent creation, payment webhook handling, cart total calculation, coupon application, and inventory reservation/decrement logic.
- Do not waste effort chasing universal 100% coverage on trivial glue code.

Test categories:

- Unit tests for pure business logic and validation.
- Integration tests for API modules with an isolated MongoDB test database.
- Supertest API tests for route behavior, status codes, auth, authorization, and error envelopes.
- React Native Testing Library tests for components and flows.
- MSW-powered API mocks for frontend tests.
- Regression tests for money, inventory, auth, and checkout edge cases.

## 18. Legal And Compliance Readiness

Documentation-only for now, but required before real store submission:

- Privacy Policy page/URL.
- Terms of Service page/URL.
- Refund Policy page/URL.
- iOS App Tracking Transparency prompt copy if tracking is introduced.
- Google Play Data Safety form answers.
- Data retention policy for accounts, orders, payments, notifications, and analytics.

## 19. Project Roadmap

Phase 1: Architecture

- Produce planning docs.
- Confirm stack and folder structure.
- Confirm unknown business rules.

Phase 2: Project setup

- Initialize monorepo.
- Initialize bare React Native CLI mobile app with committed `ios/` and `android/`.
- Pin native prerequisites and document them in `README.md` and `INSTALLATION.md`.
- Configure TypeScript strict mode, linting, formatting, test runners, env examples.
- Configure Turborepo.
- Add Docker Compose for API and MongoDB.

Phase 3: Folder structure

- Create app and API scaffolds.
- Add shared package.
- Add empty feature/module boundaries.

Phase 4: Backend foundation

- Express app, health route, config, logging, errors, validation, security middleware.
- Swagger setup.

Phase 5: Database foundation

- Mongoose connection.
- Core schemas and indexes.
- Seed strategy for development only.

Phase 6: Authentication

- Register, login, refresh, logout, email verification, password reset, RBAC.
- Auth tests.

Phase 7: Mobile foundation and navigation

- Bare React Native native build setup.
- Root providers, theme, navigation, API client, auth bootstrap.

Phase 8: Home screen

- Banners, categories, featured products, skeleton states, controlled animations.

Phase 9: Product module

- Listing, filtering, sorting, details, variants, reviews, recently viewed.

Phase 10: Cart

- Guest cart, authenticated cart, merge rules, coupons, totals.

Phase 11: Checkout

- Address, shipping, payment abstraction, order review.

Phase 12: Orders

- Order placement, order history, order details, admin order status.

Phase 13: Testing hardening

- Unit, integration, component, navigation, API, database, regression tests.

Phase 14: Deployment readiness

- Docker production profile, environment docs, CI, Fastlane build docs, security review.
- Legal/compliance readiness docs: Privacy Policy, Terms of Service, Refund Policy, iOS ATT copy if needed, Google Play Data Safety answers.

## 20. Approval Gate

Implementation is blocked until:

1. All required decisions in section 16 are answered.
2. The revised architecture is explicitly approved.
3. The user explicitly authorizes Phase 2 project setup.
