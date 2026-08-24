#!/usr/bin/env bash
# Wait until an Android device/emulator is fully booted and the package
# manager is available before installing. Fixes:
#   InstallException: Can't find service: package
set -euo pipefail

ADB="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}/platform-tools/adb"
if [[ ! -x "$ADB" ]]; then
  if command -v adb >/dev/null 2>&1; then
    ADB="$(command -v adb)"
  else
    echo "adb not found. Set ANDROID_HOME or install Android platform-tools." >&2
    exit 1
  fi
fi

MAX_WAIT_SEC="${ANDROID_BOOT_WAIT_SEC:-180}"
SLEEP_SEC=2
elapsed=0

echo "Waiting for an Android device/emulator..."
until "$ADB" get-state 2>/dev/null | grep -q device; do
  if (( elapsed >= MAX_WAIT_SEC )); then
    echo "Timed out waiting for a device after ${MAX_WAIT_SEC}s." >&2
    echo "Start an AVD in Android Studio, wait for the home screen, then retry." >&2
    exit 1
  fi
  sleep "$SLEEP_SEC"
  elapsed=$((elapsed + SLEEP_SEC))
done

echo "Device connected. Waiting for boot + package manager..."
elapsed=0
while true; do
  boot="$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  pkg="$("$ADB" shell service check package 2>/dev/null | tr -d '\r' || true)"
  if [[ "$boot" == "1" && "$pkg" == *"found"* ]]; then
    echo "Emulator is ready (boot_completed=1, package service found)."
    exit 0
  fi
  if (( elapsed >= MAX_WAIT_SEC )); then
    echo "Timed out waiting for package service after ${MAX_WAIT_SEC}s." >&2
    echo "Cold Boot the AVD from Android Studio Device Manager, then retry." >&2
    exit 1
  fi
  sleep "$SLEEP_SEC"
  elapsed=$((elapsed + SLEEP_SEC))
done
