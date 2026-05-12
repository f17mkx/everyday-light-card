# Tuesday launch checklist

Working backwards from Tuesday morning launch. Stefan = the person doing each item, unless noted "Claude can do".

## Sunday evening (today)

- [ x] **Verify r34/r35/r36** on hassio dashboard `?v=0.9.0-p15-r36`:
  - [x ] Color-thumb fills the pill exactly (no gap top + right) on temp/hue/sat sliders
  - [x ] Hue 360° sticky: drag to top, release, slider stays at top with "360°" label across hass-pushes
  - [x ] Saturation doesn't drift when toggling hue 359° ↔ 360° repeatedly
  - [x ] Hue + saturation sliders blank-thumb when light is in `color_temp` mode
  - [x ] Double-tap on member-tile cycles slider mode (no longer opens wheel)
  - [x ] Long-press → mode picker → left-slot icon shows NEXT mode (sun/thermometer/spectrum/saturation), not always thermometer
  - [x ] On a light with `effect_list`: 5th picker slot at top-right shows effects icon
  - [x ] Mindmap arms on `light.main` (6+ members): bezier curves consistent with `light.hall_spots` (3 members), no comb-fallback verticals

## Monday morning

- [ ] **Take 3 screenshots** for reddit teaser:
  - Hero shot: `assets/demo/dashboard.yaml` rendered, all 8 cards visible
  - Close-up: 4-diamond mode picker in action (long-press a tile + screenshot before release)
  - GIF (optional): press-drag-select gesture from icon to wheel diamond
- [ ] **Save screenshots** to `assets/demo/screenshots/` so they end up in the public repo
- [ ] **Voice-check the reddit-teaser draft** at `assets/demo/reddit-teaser.md` — re-read for AI-tells per the checklist at the bottom

## Monday evening

- [ ] **Create public GitHub repos**:
  ```
  gh repo create f17mkx/everyday-light-card-dev --private --description "Dev source for everyday-light-card"
  gh repo create f17mkx/everyday-light-card --public --description "Group-aware Lovelace light card with mindmap topology, in-place mode picker, saved-colors edit mode. HACS."
  ```
- [ ] **Local clone of the public repo**:
  ```
  gh repo clone f17mkx/everyday-light-card ~/conductor/repos/everyday-light-card
  ```
- [ ] **First sync to public**:
  ```
  cd ~/conductor/workspaces/superpro-light-card-dev/cairo-v1
  npm run release:sync
  cd ~/conductor/repos/everyday-light-card
  git push origin main
  ```
- [ ] **Tag v0.9.0-rc1 on public**:
  ```
  git tag -a v0.9.0-rc1 -m "Pre-launch release candidate"
  git push origin v0.9.0-rc1
  ```
  Verify `manifest.json`, `hacs.json`, `README.md` are correct in the public repo.

## Tuesday morning

- [ ] **HACS test-install** on a fresh HA instance (or your existing setup):
  - HACS → Frontend → Custom repositories → add `https://github.com/f17mkx/everyday-light-card` as Lovelace
  - Search "Everyday" → install → hard-refresh → add card to dashboard with `light.your_light` → confirm renders

- [ ] **Post reddit teaser** to r/homeassistant
  - Best time: 9-11am CEST (= US morning + EU mid-day)
  - Use the draft at `assets/demo/reddit-teaser.md`
  - First comment in thread: install URL + dashboard.yaml gist
  - Stay around for 30-60 min to reply to early comments

- [ ] **Tag v1.0.0** on the public repo (after reddit traction looks OK):
  ```
  git tag -a v1.0.0 -m "First HACS release"
  git push origin v1.0.0
  ```

- [ ] **HACS-Default submission PR**:
  - Fork https://github.com/hacs/default
  - Add `everyday-light-card` to the `lovelace` list (alphabetical)
  - PR with brief description + repo URL + screenshot

## Post-launch (this week)

- [ ] Monitor reddit replies + GitHub issues
- [ ] R177-2 mindmap breathing verify (probably moot post-r27, but worth a look on a real screen)
- [ ] Speaker-card step-3 (source picker, queue indicators)
- [ ] Visual editor (P19) — start in earnest now that demo + launch is out
- [ ] More P16 tests for Lit components (mode-picker, vertical-pill-slider, mindmap-path)
- [ ] CONCEPT.md / PHASE-PLAN.md / HANDOFF.md sunset (rebrand-substitution + maybe just delete legacy fully)

## Risks / contingencies

- **R200a hue sticky doesn't work in some integration**: if `light.turn_on hs_color: [360, 100]` causes weird behavior in a non-Hue integration, the `_pinnedAtTop` flag clears on first divergent state-push. Worst case: same as current behavior (snap back to 0). Stefan can disable via cap re-introduction.
- **Mode-picker effects icon position (315°)**: at slider-width 47, the orbit r=64 might overlap with parallel slot at 270°. If visually crowded, move effects to ~300° or replace `parallel` slot for entities with effects.
- **Mindmap arms for very-large N (10+)**: bezier curves may get noisy. `fallback-at` attribute available for users to opt back to comb. Not a bug, a knob.
- **HACS submission rejection**: if HACS-Default reviews fail (e.g. no semver tag, README issues), iterate based on their feedback. v1.0.0 tag + clean README from `docs/INSTALLATION.md` should pass.

## Stefan-Decision still pending

- §8.2 alias-vs-hard-cut — already implicit-greenlit hard-cut.
- §8.3 GitHub repos — Stefan creates Mon evening per checklist above.
- §8.4 vitest vs jest — vitest already in.
- §8.5 effects-picker MVP-ship-without-persistence — already shipped with optional helper-source persistence.
