#!/usr/bin/env bash
# Build the Android release APK for the mobile app.
# Preferred entry points (from repo root):
#   npm run gradlew-android
#   pnpm --filter mobile gradlew-android
#
# Or invoke this script directly from anywhere:
#   bash apps/mobile/scripts/gradlew-android.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MOBILE_DIR/../.." && pwd)"
ANDROID_DIR="$MOBILE_DIR/android"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"

echo "→ Repo: $REPO_ROOT"
echo "→ Ensuring shared package + mobile node_modules…"
cd "$REPO_ROOT"
npm run build -w @nidavellir/shared
node "$MOBILE_DIR/scripts/ensure-mobile-node-modules.js"

if [[ ! -x "$ANDROID_DIR/gradlew" ]]; then
  echo "error: gradlew not found or not executable at $ANDROID_DIR/gradlew" >&2
  echo "hint: use ./gradlew (current dir), not /gradlew (filesystem root)" >&2
  exit 1
fi

echo "→ Running ./gradlew assembleRelease…"
cd "$ANDROID_DIR"
./gradlew assembleRelease

echo ""
echo "✓ Release APK ready:"
echo "  $APK_PATH"
if [[ -f "$APK_PATH" ]]; then
  ls -lh "$APK_PATH"
fi
