# 08 — Troubleshooting

Symptom → cause → fix recipes for the most common issues.

## "Custom element not found"

**Symptom:** Card renders as a red error box saying `Custom element doesn't exist: everyday-light-card`.

**Cause:** Resource isn't registered, or the registered URL is wrong, or the JS file isn't where you think it is.

**Fix:**
1. Settings → Dashboards → Resources. Verify there's a row for `/local/everyday-light-card.js` (or the HACS-managed equivalent) and it's `JavaScript module`.
2. Open `https://YOUR-HA/local/everyday-light-card.js` in your browser. You should see minified JS, not a 404.
3. Hard-refresh the dashboard (Ctrl/Cmd+Shift+R). HA caches custom-card JS aggressively.
4. If still broken: check the browser console for a load error.

## Card stays empty / "loading..."

**Symptom:** Card shows the placeholder text indefinitely.

**Cause:** Either `hass` isn't propagating, or `config` is invalid.

**Fix:**
1. Browser DevTools → Console. Look for red errors with `everyday-light-card` in them.
2. Verify the entity exists. `Developer Tools → States → search your entity_id`.
3. Verify the YAML parses. Switch the dashboard to YAML mode — if HA shows a parse error, fix it.

## Slider doesn't drag

**Symptom:** Tap-to-toggle works, but drag does nothing.

**Cause:** Usually a touch-action conflict. The card sets `touch-action: none` on draggable elements, but if a wrapping card (vertical-stack, grid, picture-elements) overrides it, drag events stop propagating.

**Fix:**
1. Try outside any wrapper-card. If it works there, the wrapper is the culprit.
2. card-mod can re-set `touch-action`:
   ```yaml
   card_mod:
     style: |
       :host { touch-action: none; }
   ```

## Long-press doesn't open mode-picker

**Symptom:** You long-press, nothing happens. Tap works fine.

**Cause:** The 200 ms threshold may be too short for your fingertip → release pattern. Or the `gestures.member_icon.long_press` is set to `none`.

**Fix:**
1. Bump `gestures.long_press_ms` to 280-300 ms.
2. Verify `gestures.member_icon.long_press` is set (default `mode_picker`).

## Mindmap dot floats above/below the group-icon

**Symptom:** The mindmap circle doesn't sit on the group-icon — it's offset vertically.

**Cause:** `effectiveSliderHeight` mismatch with the SVG dot calibration. Usually triggered by setting `slider.height` to a non-standard value (not 170 / 220 / 260).

**Fix:**
1. Use one of the standard heights: 170 (very short), 220 (default expanded false), 260 (full_length).
2. If you NEED a custom height: file a bug with the value + screenshot. The mindmap math has known calibration points; new ones can be added.

## Saved colors popup is empty

**Symptom:** Long-press → Saved diamond → popup blooms but with no swatches.

**Cause:** No `saved_colors.static` configured, no `saved_colors.source` helper, AND default palette didn't load (rare).

**Fix:**
1. Configure either `saved_colors.static` or `saved_colors.source`. See [`05-pickers.md`](05-pickers.md).
2. The default palette should always render — if not, hard-refresh. If the bug persists: file an issue.

## "TS1005: ';' expected." during build

**Symptom:** `npm run build` fails with cryptic TypeScript error.

**Cause:** A backtick inside a CSS comment in a `css\`...\`` template literal. The TS parser closes the template early.

**Fix:**
The pre-build lint guard catches this from r30 onward:
```
$ npm run lint:css-comments
check-css-comments: found 1 backtick(s) inside CSS comments:
  src/components/foo.ts:42  /* set --bar-`baz` to ... */
```
Replace the backticks with apostrophes or remove them.

## Console floods with "[everyday-light-card] _onGroupTap → ..."

**Symptom:** Every tap on a group icon prints debug info to console.

**Cause:** You're on a pre-r28 build. The debug log was removed in r28.

**Fix:** Update to v0.9.0-p15-r28 or newer.

## Card is too tall in horizontal-stack rows

**Symptom:** Stack cards next to a tall card (like effects-picker) and the lights cards stretch to match the row height.

**Cause:** Global `ha-card { height: 100% }` rule propagates flex-stretch through stacks.

**Fix:** R167 already addresses this for `.speaker-row-card`. For other cases, use card-mod:
```yaml
card_mod:
  style: |
    ha-card { height: auto; flex: 0 0 auto; }
```

## Color wheel produces wrong color when clicked

**Symptom:** Click on visual green → light goes yellow-green.

**Cause:** Hue gradient stops mismatched the thumb-valid Y range. Fixed in r25.

**Fix:** Update to v0.9.0-p15-r25 or newer.

## Hue slider snaps from top to bottom

**Symptom:** Drag hue slider to the top (red 360°) → it teleports to the bottom (red 0°) on the next state push.

**Cause:** HA normalizes hue=360 → 0. Fixed in r25 by capping outgoing at 359°.

**Fix:** Update to v0.9.0-p15-r25 or newer.

## When in doubt

1. Hard-refresh browser.
2. Check the version: card prints `EVERYDAY-LIGHT-CARD vX.Y.Z` to console on load.
3. Compare your config against the demo cards in `assets/demo/cards/`.
4. File an issue with: HA version, browser, full config YAML, browser-console output. See [`CONTRIBUTING.md`](../CONTRIBUTING.md#bug-reports).
