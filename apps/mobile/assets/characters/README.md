# Character Vault models

**Status:** v1 shipped — local Metro assets for the Filament lobby (`CharacterVault`).

Current roster:

- `goku.glb` — no clips (`enableIdleAnimation: false`)
- `vegeta.glb` — no clips (`enableIdleAnimation: false`)
- `kid_levi_ackerman.glb` — 11 clips; idle is index **8** (`lwer_anim_idle`) → `enableIdleAnimation: true`

Rules:

- Prefer skinned meshes with an **idle** animation clip when available.
- Set `idleAnimationIndex` to the real idle clip (not always 0). Kid Levi idle is **8**.
- After adding idle clips, set `enableIdleAnimation: true` on that character in `characterRoster.ts`.
- Never enable Animator on 0-clip GLBs — Filament fatals with `Animation index out of range`.
- Keep each file under ~15MB after compression.
- Viewer uses `transformToUnitCube` + `displayScale` (~1.12) so T-pose arms/legs stay in frame.
- Visit CTA opens Products PLP titled `{displayName}'s Vault` with roster `franchise`.
- Do **not** commit scraped official anime/game character meshes without a license for production store builds.

Optional next: licensed idle-loop exports, more champions, CDN-hosted GLBs.
