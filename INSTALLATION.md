# Installation

Status: **Ready.** This guide walks you through getting the Niðavellir app running from a fresh clone.

## Quick Start (tl;dr)

```bash
# 1. Install prerequisites once (see below if you don't have them)
brew install node pnpm
# (macOS only) Xcode + Command Line Tools from the App Store / xcode-select

# 2. Clone the repo
git clone <your-repo-url> Nidavellir
cd Nidavellir

# 3. Install JS dependencies
pnpm install

# 4. (iOS only) Install native pods
cd apps/mobile && pod install && cd ../../

# 5. Run the app — pick one:
pnpm --filter mobile start     # start Metro (keep this terminal open)
pnpm --filter mobile ios       # launch on iOS simulator
# OR
pnpm --filter mobile android   # launch on Android emulator/device
```

> **Demo tip:** Before running, set `dataSource: 'mock'` in `apps/mobile/src/config/appConfig.ts` so the app works fully offline with no server or database needed.

---

## Step 1: Install Prerequisites (macOS)

### Node.js 22 LTS

```bash
brew install node@22
node -v   # should print v22.x.x
```

### pnpm 9

```bash
npm install -g pnpm@9
pnpm -v   # should print 9.x.x
```

### Xcode (required for iOS)

1. Install **Xcode** from the Mac App Store (or download from Apple Developer).
2. Open Xcode once to accept the license and install components.
3. Install the Command Line Tools:

```bash
xcode-select --install
```

4. Install **CocoaPods** (iOS dependency manager):

```bash
sudo gem install cocoapods
pod --version   # should print >= 1.16.x
```

### Java 17 + Android Studio (required for Android)

1. Install **Android Studio** from https://developer.android.com/studio.
2. Inside Android Studio → *Settings → Languages & Frameworks → Android SDK*, install:
   - Android SDK Platform **35**
   - Android SDK Build-Tools **35.0.0**
3. Add the Android SDK to your shell profile (`~/.zshrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

4. Install Java 17:

```bash
brew install --cask temurin@17
java -version   # should print 17.x
```

---

## Step 2: Clone the Repository

```bash
git clone <your-repo-url> Nidavellir
cd Nidavellir
```

---

## Step 3: Install Dependencies

```bash
pnpm install
```

This installs the mobile app, the API, and the shared `@nidavellir/shared` package.

**For iOS only** — install the native pods:

```bash
cd apps/mobile
pod install
cd ../../
```

---

## Step 4: Choose Your Data Mode

Open `apps/mobile/src/config/appConfig.ts` and set:

```ts
export const appConfig = {
  dataSource: 'mock',   // 'mock' = offline demo (recommended for showing)
  apiBaseUrl: 'http://localhost:4000/api/v1',
  ...
};
```

- **`mock`** → bundled demo products, no server or database. Best for demos.
- **`api`** → needs the backend + MongoDB running (see Step 6).

---

## Step 5: Run the App

### Option A — iOS Simulator (easiest on a Mac)

Terminal 1 — start Metro:

```bash
pnpm --filter mobile start
```

Terminal 2 — launch the app:

```bash
pnpm --filter mobile ios
```

The app opens in the iOS Simulator.

### Option B — Android Emulator

Terminal 1 — start Metro:

```bash
pnpm --filter mobile start
```

Terminal 2 — launch the app:

```bash
pnpm --filter mobile android
# or from repo root:
npm run android
```

Make sure an Android emulator (AVD) is running first, or a physical device is connected with USB debugging on.

`npm run android` waits until the emulator’s **package manager** is up before installing. That avoids:

`InstallException: Can't find service: package`

which happens when Gradle installs while the AVD is still booting. If it still fails, open **Device Manager → Cold Boot Now**, wait for the home screen, then run again.

### Workspace hoist / missing `react-native` under mobile

npm workspaces often hoist `react-native` to the **repo root**. Android Gradle and the Metro launch script expect packages under `apps/mobile/node_modules`.

If you see:

`Included build '.../apps/mobile/node_modules/@react-native/gradle-plugin' does not exist`

or

`.../apps/mobile/node_modules/react-native/cli.js: No such file or directory`

run from repo root:

```bash
npm install
node apps/mobile/scripts/ensure-mobile-node-modules.js
```

`preandroid` / `postinstall` on the mobile workspace already run that script.

Profile photo picking needs a native rebuild after installing `react-native-image-picker` (Android camera/gallery permissions are in the manifest; iOS usage strings are in `Info.plist`).

---

## Step 6: Run the Backend + Database (only for `api` mode)

Requires **Docker** (or a local MongoDB).

```bash
# Start MongoDB (if using Docker)
docker run -d --name nidavellir-mongo -p 27017:27017 mongo:7

# Start the API
pnpm --filter api dev

# Seed demo data (first time only)
pnpm --filter api seed
```

The API runs at `http://localhost:4000`.

---

## Native Tooling Reference

Bare React Native Community CLI (no Expo). Minimum targets:

- **OS:** Android 10 (API 29), iOS 16.0
- **Node.js:** 22 LTS
- **pnpm:** 9.x
- **CocoaPods:** >= 1.16
- **JDK:** 17
- **Android SDK Platform / Build-Tools:** 35 / 35.0.0
- **Xcode:** 16.2 minimum

> If you hit "command not found" for any tool, re-run the matching install step above and restart your terminal.
