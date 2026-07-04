# Changelog

All notable changes to this project will be documented here.

## Unreleased

- Added Phase 1 architecture plan.
- Added project guidance for future AI assistants.
- Added initial TODO and progress tracking documents.
- Revised the architecture to use bare React Native Community CLI instead of Expo.
- Renamed `Project Insights.md` to `PROJECT_INSIGHTS.md`.
- Added native `ios/` and `android/` as first-class committed project directories in the architecture.
- Added strict `.tsx`/`.ts` file convention and documented required JavaScript tooling exceptions.
- Added push notification architecture with FCM/APNs.
- Added OTA update policy noting App Center CodePush retirement and no OTA dependency for MVP.
- Added environment separation requirements for dev, staging, and production.
- Selected Turborepo for monorepo task orchestration.
- Removed `xss-clean` from the dependency plan and flagged maintained sanitization evaluation for Phase 4.
- Corrected testing coverage targets to 80-90% overall with near-100% for critical money/security logic.
- Added monorepo root config entries to the architecture tree: `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.gitignore`, and `.husky/`.
- Added shared package identity and workspace consumption guidance for `@nidavellir/shared`.
- Reflected API environment templates and mobile native dev/staging/production config locations in the architecture tree.
- Added `.gitignore` to protect generated, secret, editor, and local-only files while keeping native source committed.
- Hardened `.gitignore` to block signing credentials, provisioning profiles, Fastlane output, APK, AAB, and IPA artifacts.
- Removed redundant native build-output ignore entries now covered by broad patterns.
- Added a local-only command reference file ignored by git.
- Clarified backend test location strategy in `TESTING.md`.
