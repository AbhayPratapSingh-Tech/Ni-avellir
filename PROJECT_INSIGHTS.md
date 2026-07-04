# Project Insights

This file is a guide for future AI assistants and contributors working on Nidavellir.

## Operating Rules

- Do not write implementation code until Phase 1 is explicitly approved.
- Phase 2 cannot begin until every required decision in `ARCHITECTURE.md` section 16 is answered.
- Ask when requirements are ambiguous.
- Keep changes production-oriented and scoped.
- Maintain documentation as the project evolves.
- Preserve the phase-based process in `PROJECT_PROGRESS.md`.
- Run required checks after implementation phases once scripts exist: lint, typecheck, tests, and build.
- Never add secrets, real credentials, private keys, or provider tokens to the repository.
- Prefer explicit architecture and contracts over hidden assumptions.

## Product Intent

Nidavellir is intended to become a real premium gaming merchandise marketplace, not a demo app. Design decisions should support real users, real inventory, real payments, real media hosting, native app-store releases, and real operations.

## Current Stack Direction

- Mobile: bare React Native Community CLI with permanently committed `ios/` and `android/` native projects.
- Language: TypeScript with `"strict": true` from day one.
- Backend: Node.js, Express.js, TypeScript.
- Database: MongoDB with Mongoose.
- API style: REST, versioned under `/api/v1`.
- Auth: JWT access tokens, rotating refresh tokens, RBAC.
- Secure mobile token storage: `react-native-keychain`.
- Media: Cloudinary.
- Push notifications: FCM for Android and APNs for iOS, routed through the backend notifications module.
- CI/CD: GitHub Actions plus Fastlane for native builds.
- Monorepo tooling: Turborepo.
- Documentation: Swagger/OpenAPI plus repository markdown docs.

## Important Architecture Corrections

- Do not add Expo, EAS Build, EAS Update, `expo-dev-client`, `expo-secure-store`, `expo-image`, or Expo config-plugin workflows.
- Do not plan Microsoft App Center CodePush. It was retired on March 31, 2025.
- Do not add OTA update dependencies for MVP. JS and native changes ship together through store releases.
- Use `.tsx` for React components and `.ts` for non-component TypeScript files.
- Avoid `.jsx` and `.js` in `apps/mobile` and `apps/api` except where tooling strictly forces plain JavaScript config files.
- Do not install `xss-clean`; it is deprecated/unmaintained. Select a maintained sanitizer during Phase 4.
- Testing coverage target is not universal 100%. Use 80-90% as a health metric, with near-100% coverage for money/security-critical logic.

## How AI Assistants Should Work Here

1. Read `ARCHITECTURE.md`, `PROJECT_PROGRESS.md`, `TODO.md`, and this file before editing.
2. Check the current phase and approval status.
3. Inspect the repository before changing files.
4. If the user asks for implementation before Phase 1 approval, remind them of the gate and ask for explicit approval.
5. Keep explanations educational because the project is also meant to teach backend, database, native mobile, and production architecture.
6. Avoid placeholder code unless the user explicitly accepts a temporary scaffold.
7. Update `CHANGELOG.md` for meaningful documentation or code changes.
8. Update `TODO.md` when tasks are added, completed, or deferred.
9. Use `LOCAL_COMMANDS.md` as a machine-local command notebook when present, but never commit it.

## Local-Only Files

- `LOCAL_COMMANDS.md` is intentionally ignored by git. It is for this machine's command cheat sheet: installs, Android/iOS runs, debug builds, release builds, APK/AAB commands, backend commands, Docker, and quality gates.
- Do not put secrets in local command docs.
- If a command becomes part of the official workflow, promote it into committed documentation after user approval.

## Engineering Standards

- Strict TypeScript.
- Feature-first organization.
- Shared validation where contracts cross app/API boundaries.
- Centralized error handling.
- Consistent API response envelopes.
- Secure auth and token storage.
- Indexed database queries.
- Automated tests for every implemented feature.
- Small reusable UI components.
- Performance checks for product lists and animation-heavy screens.
- Native iOS and Android projects treated as real source code, not generated throwaway output.

## Architecture Reminders

- Cart and checkout require careful guest/auth merge rules.
- Inventory must be atomic to prevent overselling.
- Payment provider code must be replaceable.
- Payment webhooks must be idempotent.
- Product images should be optimized at the Cloudinary layer.
- Search may need a dedicated engine after MVP.
- Admin APIs should not leak into customer mobile flows.
- Orders should store snapshots, not only references.
- Environment-specific bundle IDs/application IDs are required so dev, staging, and production builds can coexist on one device.

## Definition of Done For Future Code Phases

- Requirement clarified.
- Implementation completed.
- Tests added or consciously documented as not applicable.
- Lint passes.
- Typecheck passes.
- Tests pass.
- Build passes where applicable.
- Docs updated.
- Progress tracking updated.

## Current Status

Phase 1 architecture draft has been revised for bare React Native CLI and is awaiting user decisions plus explicit approval before Phase 2.
