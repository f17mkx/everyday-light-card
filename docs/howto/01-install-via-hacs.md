# Howto — Install via HACS

The recommended path. HACS handles resource registration, updates, and uninstall.

## Prerequisites

- HACS installed (https://hacs.xyz/docs/use/download/download).
- HA `2024.6` or newer.

## Steps

1. HACS → Frontend → ⋮ menu (top-right) → "Custom repositories".
2. Add `https://github.com/f17mkx/everyday-light-card` as type `Lovelace`. Click "Add".
3. Search "Everyday" in HACS → "Everyday Light Card" → click → click "Download" (bottom-right).
4. Pick the latest tagged release.
5. Hard-refresh the browser (Ctrl/Cmd+Shift+R). HA caches custom-card JS aggressively.
6. Edit a dashboard → "+" → search "Everyday Slider" → done.

## Verify install

1. Console (DevTools → Console) should show:
   ```
   EVERYDAY-LIGHT-CARD v0.9.0
   ```
2. The card preview-tile in the card-picker shows "Everyday Slider".
3. Adding it to a dashboard with a real `light.*` entity renders without errors.

## Updates

When a new release is tagged, HACS shows an update notification. Click → Update → hard-refresh.

If you want to force-update before HACS notices: HACS → Everyday Light Card → ⋮ → Redownload.

## Uninstall

HACS → Everyday Light Card → ⋮ → Remove.

Then remove every `type: custom:everyday-light-card` block from your dashboard YAMLs — otherwise those cards show "Custom element not found" until you do.

## Manual install fallback

If HACS isn't an option, see [`INSTALLATION.md`](../INSTALLATION.md) for the manual path.
