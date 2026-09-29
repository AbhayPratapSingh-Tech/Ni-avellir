# App icon masters

Source vectors / store assets for the Nidavellir launcher mark.

- `nidavellir-icon.svg` — master vector (re-export any size from this).
- `android-adaptive-*.svg` — adaptive icon layers (reference).
- `icon-512.png` / `play-store/icon-512.png` — Play Console listing icon (upload manually).
- `icon-1024.png` — App Store marketing size (also wired into the iOS asset catalog).

**Do not pre-round** these squares. Apple and Google apply their own masks.

Wired copies live in:

- Android: `apps/mobile/android/app/src/main/res/mipmap-*` (+ `mipmap-anydpi-v26`)
- iOS: `apps/mobile/ios/Nidavellir/Images.xcassets/AppIcon.appiconset`

A full export pack may also exist at `apps/nidavellir-icons/` as an offline reference; platform builds use the paths above.
