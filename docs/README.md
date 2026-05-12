# Documentation

This directory contains everything beyond the top-level `README.md`.

## Top-level

- [`INSTALLATION.md`](INSTALLATION.md) — HACS + manual install.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — bug reports, feature requests, PR conventions.
- [`AUDIT-REFACTOR-PLAN.md`](AUDIT-REFACTOR-PLAN.md) — P12-P20 release roadmap.
- [`BACKLOG.md`](BACKLOG.md) — deferred items + status.

## `wiki/` — feature-by-feature reference

- [`01-quick-start.md`](wiki/01-quick-start.md) — 5-minute onboarding.
- [`02-config-reference.md`](wiki/02-config-reference.md) — every config option.
- [`03-view-modes.md`](wiki/03-view-modes.md) — slider / parallel / effects-picker.
- [`04-group-layouts.md`](wiki/04-group-layouts.md) — compact vs expanded.
- [`05-pickers.md`](wiki/05-pickers.md) — mode-picker, color-wheel, saved, effects-list.
- [`06-gestures.md`](wiki/06-gestures.md) — tap / long-press / double-tap / press-drag-select.
- [`07-theming.md`](wiki/07-theming.md) — CSS-vars + theme integration.
- [`08-troubleshooting.md`](wiki/08-troubleshooting.md) — symptom → cause → fix.

## `howto/` — apartment scenarios as recipes

- [`01-install-via-hacs.md`](howto/01-install-via-hacs.md)
- [`02-bedside-dimmer.md`](howto/02-bedside-dimmer.md)
- [`03-hall-group-tile.md`](howto/03-hall-group-tile.md)
- [`04-movie-mode-speaker.md`](howto/04-movie-mode-speaker.md)
- [`05-gradient-mood.md`](howto/05-gradient-mood.md)
- [`06-house-off-shortcut.md`](howto/06-house-off-shortcut.md)
- [`07-saved-colors-helper.md`](howto/07-saved-colors-helper.md)
- [`08-night-mode-routine.md`](howto/08-night-mode-routine.md)

## `adr/` — architecture decision records

- [`0001-popup-portal-pattern.md`](adr/0001-popup-portal-pattern.md)
- [`0002-mindmap-svg-component.md`](adr/0002-mindmap-svg-component.md)
- [`0003-gesture-detector-design.md`](adr/0003-gesture-detector-design.md)

`0004-everyday-rebrand.md` deferred until Stefan-Decision §8.2 + §8.3 (alias-vs-hard-cut + GitHub repo creation) lands.

## What's NOT in this directory

- The `CHANGELOG.md` lives at repo root (project convention — not buried in docs).
- The card's `README.md` lives at repo root (HACS reads it).
- `CONCEPT.md` + `PHASE-PLAN.md` live at repo root (legacy locations from early phases; will move here in P18 cleanup pass).

## Reading order for new contributors

1. Repo root `README.md` (what is this).
2. `INSTALLATION.md` (get it running).
3. `wiki/01-quick-start.md` (configure your first card).
4. `wiki/02-config-reference.md` (everything else).
5. Browse `howto/` for your scenario.
6. ADRs only if you're working on internals.
