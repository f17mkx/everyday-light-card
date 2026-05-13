# Installation

`everyday-light-card` is a Lovelace custom-card. Two install paths: HACS (recommended) and manual.

## Via HACS

> Status: pending HACS-Default review ([PR tracker](https://github.com/hacs/default/pulls)). Until then, add as a **custom repository**.

1. Open HACS → ⋮ menu → Custom repositories.
2. Add `https://github.com/f17mkx/everyday-light-card` as type `Lovelace`.
3. Search "Everyday Light Card" → install.
4. Refresh your browser (Ctrl/Cmd+R).
5. Edit a dashboard → "+" → Search "Everyday Light Card" → done.

HACS handles the resource registration automatically. Once the card is in HACS-Default, step 1 disappears (it'll show up in the default Frontend list).

## Manual install

1. Download `everyday-light-card.js` from the [Releases page](https://github.com/f17mkx/everyday-light-card/releases) (latest tag).
2. Copy to `<config>/www/everyday-light-card.js`.
3. Settings → Dashboards → Resources → ADD RESOURCE:
   - URL: `/local/everyday-light-card.js`
   - Resource type: `JavaScript module`
4. Refresh your browser (hard-refresh: Ctrl/Cmd+Shift+R).
5. In a dashboard's edit-mode, switch to YAML and add a card:
   ```yaml
   type: custom:everyday-light-card
   entity: light.your_light
   ```

## First-run check

Open the dashboard and confirm:

- Card renders without a red error border.
- The entity name appears in the caption.
- Dragging the slider changes brightness.
- Long-press the icon: mode-picker appears with 4 diamond options.

If the card shows "Custom element not found", the resource isn't registered. Re-check step 3.

## Updating

**HACS:** HACS prompts when a new release is tagged. Click Update.

**Manual:** Replace `/config/www/everyday-light-card.js` with the new file. Append `?v=<version>` to the resource URL each time you update. HA caches custom-card JS aggressively, so this forces a reload:

```yaml
url: /local/everyday-light-card.js?v=1.0.0
```

## Uninstall

**HACS:** Frontend → Everyday Light Card → ⋮ → Remove.

**Manual:** Delete `/config/www/everyday-light-card.js` and remove the resource from Settings → Dashboards → Resources.

In both cases also remove every `type: custom:everyday-light-card` block from your dashboard YAML before deleting the resource. Otherwise the dashboards will show "Custom element not found" until you do.

## Compatibility

Tested on:

- Home Assistant `2024.6` and newer.
- Modern browsers (Chrome, Safari, Firefox latest).
- HA mobile app (iOS + Android), tablets.

Requires:

- `light.*` or `media_player.*` entity.
- For groups: a `light` group entity (HA's standard `group` integration), or set `group.manual_members` in card config.

## Troubleshooting

See `docs/wiki/08-troubleshooting.md` for symptom → cause → fix recipes. The most common culprit is browser-cache: hard-refresh first.
