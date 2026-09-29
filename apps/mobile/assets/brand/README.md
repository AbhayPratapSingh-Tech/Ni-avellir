# Brand assets

## In-app wordmark

- [`wordmark/`](wordmark/) — stacked logo (icon + NIDAVELLIR + tagline), 3:1.
- Rendered by `components/ui/BrandMark.tsx` (`height`, `tone: 'light' | 'dark'`).
- Used in ShopHeader, splash, Login, Profile, Onboarding.

## App launcher icon

- Masters / Play Store upload: [`app-icon/`](app-icon/) (SVG + 512/1024 PNGs).
- Android home-screen icons are in `android/app/src/main/res/mipmap-*` (adaptive XML under `mipmap-anydpi-v26`).
- iOS home-screen icons are in `ios/Nidavellir/Images.xcassets/AppIcon.appiconset`.
- After changing launcher assets, uninstall/reinstall the app — OS icon caches are sticky.

## Legacy

- `logo.png` — unused square placeholder (kept so old requires do not break). Prefer `wordmark/` + `BrandMark`.
