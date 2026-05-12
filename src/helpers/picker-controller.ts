/**
 * picker-controller - Phase 14c deliverable.
 *
 * Lit Reactive Controller that owns the picker + wheel + saved-colors
 * popup machinery. Stefan-Direktive 2026-05-09: "1 implementation für
 * alle" — instead of duplicating long-press + press-drag-select +
 * popup-render between group-layout-expanded.ts and everyday-light-
 * card.ts, both hosts instantiate this controller and let it handle:
 *
 *   1. Gesture binding on an icon element (long-press + press-drag-
 *      select via the shared `gesture-detector` helper).
 *   2. Picker overlay rendering (variant-driven mode-picker).
 *   3. Wheel + saved-colors popup rendering (state-machine style).
 *   4. Outside-click handling.
 *   5. Service-call routing for color picks.
 *
 * The host:
 *   - Owns the entity-id + the anchor element (icon).
 *   - Renders the controller's templates inline:
 *     `${pickerCtrl.renderPicker()}${pickerCtrl.renderWheel()}${pickerCtrl.renderSaved()}`
 *   - Calls `pickerCtrl.bindIcon(el, entityId)` from `updated()`.
 *
 * P14c.1 scope: parallel-inline only (everyday-light-card.ts). The
 * group-layout-expanded.ts migration is P14c.2, deferred — current
 * code works there, this is dedup not behaviour change.
 */

import { html, type ReactiveController, type ReactiveControllerHost, type TemplateResult } from 'lit';
import type { HomeAssistant } from 'custom-card-helpers';

import { attachGestures } from './gesture-detector.js';
import { pickerHoverFromPointer, pickerDotPosition } from './picker-geometry.js';
import type { PickerMode, PickerVariant } from '../components/mode-picker.js';
import type { ColorWheelConfig, SavedColorsConfig } from '../types/config.js';
import type { ColorTuple } from '../components/saved-colors-picker.js';

import '../components/mode-picker.js';
import '../components/color-wheel.js';
import '../components/saved-colors-picker.js';

export interface PickerControllerOptions {
  variant: PickerVariant;
  longPressMs?: number;
  hassProvider: () => HomeAssistant | undefined;
  entityIdProvider: () => string | undefined;
  colorWheelConfigProvider?: () => ColorWheelConfig | undefined;
  savedColorsConfigProvider?: () => SavedColorsConfig | undefined;
  /**
   * Optional override for the tap action on the bound icon. When provided,
   * replaces the default `light.toggle` call. Use for group entities that
   * need `groupToggleWithRestore` semantics, or any custom tap behavior.
   * Set to `null` (not `undefined`) to disable tap entirely.
   */
  onTap?: (() => void) | null;
  /**
   * Optional double-tap handler. Default: no double-tap (the second tap
   * fires as a regular tap). Provide to add a double-tap action — typical
   * use is cycling slider modes. Set to `null` (same as undefined here:
   * disabled), included for API symmetry with `onTap`.
   */
  onDoubleTap?: (() => void) | null;
  /**
   * Optional override for what happens when a picker mode is selected.
   * When provided, the controller calls this instead of opening its own
   * wheel/saved popups. Use when the host renders popups itself (e.g. in
   * a body-portal to escape transform-ancestor issues, or when the host
   * coordinates popup state across multiple pickers). The `origin`
   * parameter is the icon-center captured at long-press time, useful for
   * popup-anchoring logic.
   */
  onModePicked?: (mode: PickerMode, origin: { x: number; y: number } | null) => void;
  /**
   * Optional callback fired when the picker overlay opens (long-press
   * detected). Use for cross-controller coordination — e.g. when the host
   * has multiple PickerControllers (one per member tile + group tile),
   * opening one should close any others. The host's onPickerOpen
   * implementation calls `closePicker()` on every other controller.
   */
  onPickerOpen?: () => void;
  /**
   * Saved-colors palette provider. When defined, the controller-rendered
   * saved-colors popup uses this list (matching the host body-portal's
   * `<everyday-saved-colors-picker .colors=...>` wiring). Without it the
   * popup renders empty (Stefan-2026-05-10 R155 — parallel-inline 6b's
   * saved popup was empty before this provider was added).
   */
  savedColorsProvider?: () => ColorTuple[];
  /**
   * Stefan-2026-05-10 P15.6-r35 (R196): supplies the picker's `currentMode`
   * prop. The cycle slot uses this to render the NEXT-mode icon. When
   * omitted, the picker assumes 'brightness' (legacy behavior).
   */
  currentSliderModeProvider?: () => 'brightness' | 'temperature' | 'hue' | 'saturation';
  /**
   * Stefan-2026-05-10 P15.6-r46 (R224): host-supplied handler for the
   * 'effects' picker mode. When defined, picking the effects icon calls
   * this instead of the controller's default no-op. Use this to flip a
   * host-side `_effectsPopupOpen` state (parallel-inline path in
   * everyday-light-card.ts) so the effects-list renders in a body-portal
   * popup rather than firing `hass-more-info`.
   */
  onEffectsPick?: () => void;
  /**
   * Stefan-2026-05-12 R338 (PA-0016): host-supplied handler for the
   * 'mindmap' picker slot when the picker variant is 'parallel-inline'.
   * Stefan-Quote PA-0016: "there is currently no option to expand the
   * paralell sliders. Just add the mindmap icon to the mode picker to
   * control the expansion / contraction of the paralell sliders". The
   * host's implementation should toggle a runtime state that swaps the
   * parallel-inline layout between compact (1 slider, brightness only)
   * and expanded (N axes side-by-side). Default behavior when undefined:
   * the mindmap pick is a no-op.
   */
  onParallelMindmapPick?: () => void;
  /**
   * Stefan-2026-05-10 P15.6-r46 (R223): host-supplied handler for the
   * "save current color" + cell button in saved-colors edit-mode. The
   * host reads the entity's current rgb (and color_temp_kelvin if in
   * temp mode), pushes the new ColorEntry, and persists if a
   * `helper:` source is configured. Without this option the saved-
   * colors picker has no way to mutate the palette — Stefan-Quote:
   * "main cozy (4 axis) edit saved colors doesnt work".
   */
  onSavedAddCurrent?: () => void;
  /**
   * Stefan-2026-05-10 P15.6-r46 (R223): host-supplied handler for the
   * - delete button in saved-colors edit-mode. Index is the position
   * in the palette to remove. Mirror of the group-layout-expanded.ts
   * `_onSavedRemove` flow.
   */
  onSavedRemove?: (index: number) => void;
  /**
   * Stefan-2026-05-11 R238: when the provider returns true, the picker's
   * 'parallel' slot is replaced with 'mindmap' (expand-group action).
   * Used for compact-group pickers on embedded nested-group cards. Flows
   * through to getPickerSlots/getPickerAngleMap/pickerHoverFromPointer
   * so the rendered icon, hit-test, and dispatched mode all agree.
   * Provider pattern (not static boolean) because the host's `embedded`
   * state can change after controller construction.
   */
  useMindmapProvider?: () => boolean;
  /**
   * Stefan-2026-05-11 R290 (PA-14): when the provider returns true, the
   * 'mindmap' slot is APPENDED to the regular slot list (5 or 6 slots
   * total) instead of replacing 'parallel'. Used for standalone-compact
   * group cards where the user wants both parallel-popup AND mindmap-
   * expand as actions. Mutually-exclusive with `useMindmap`; if both
   * providers return true, useMindmap wins (kept for the embedded path).
   */
  additionalMindmapProvider?: () => boolean;
  /**
   * Stefan-2026-05-12 PA-0002 (R1): when defined and returns true, the
   * effects picker slot can show (gated also by the entity actually
   * having a non-empty `effect_list`). Default behaviour without this
   * provider is "off" — the slot stays hidden even if the entity has
   * effects. Stefan-Quote: "by default the effects-list should be disabled
   * in the mode-picker". Opt in per-card via `effects_picker.in_picker:
   * true`. Provider pattern (vs static boolean) so the config flag can
   * be hot-swapped via `hassProvider`-style reactive reads.
   */
  effectsInPickerProvider?: () => boolean;
  /**
   * Stefan-2026-05-12 PA-0002 (R2a): when defined and returns true, the
   * 'collapse' picker slot is appended (group-expanded variant only).
   * Used together with `group.expansion_sticky: true` AND the card
   * being inline-expanded — outside-click is suppressed under sticky
   * expansion, so users need this picker option to fold the topology
   * back. Other variants ignore — collapse has no meaning outside the
   * inline-expanded group view.
   */
  hasCollapseProvider?: () => boolean;
  /**
   * Stefan-2026-05-12 R342 (PA-0017): provider for the parallel-inline
   * expanded-state flag. Drives the mindmap-slot glyph swap — when the
   * parallel layout is currently expanded (multi-axis sliders visible),
   * the mindmap glyph in the picker flips to the inverted/COLLAPSE shape
   * so the action reads as "collapse back to compact". Only meaningful
   * for `variant: 'parallel-inline'`; ignored for other variants.
   * Provider pattern (vs static boolean) so reactive `_parallelInline
   * CompactRuntime` toggles propagate to the picker without needing the
   * controller to be re-instantiated.
   */
  parallelExpandedProvider?: () => boolean;
}

export class PickerController implements ReactiveController {
  private host: ReactiveControllerHost;
  private opts: PickerControllerOptions;

  pickerOpen = false;
  pickerHover: PickerMode | null = null;
  wheelOpen = false;
  savedOpen = false;
  // Stefan-2026-05-10 P15.6-r46 (R223): saved-colors edit-mode flag.
  // Long-press on a swatch flips this true (via `enter-edit` event the
  // controller catches in renderSaved). Edit-mode shows the - button on
  // each swatch + the trailing + cell. Outside-click or `done-editing`
  // resets to false (mirrors group-layout-expanded.ts behaviour).
  savedEditMode = false;

  private _origin: { x: number; y: number } | null = null;
  /**
   * Stefan-2026-05-12 R326 (PA-0007 deep-dive): public read of the icon-
   * center captured before tap/long-press/double-tap fires. Used by host
   * onDoubleTap callbacks (group-layout-expanded.ts._runDoubleTapAction) to
   * anchor popups (wheel/saved) opened via double-tap to the icon — without
   * this, _applyPickerMode receives null and the popup's _popupOrigin stays
   * stale or unset, hiding the popup entirely.
   */
  get origin(): { x: number; y: number } | null { return this._origin; }
  private _gestureDispose: (() => void) | null = null;
  private _outsideClickHandler: ((ev: MouseEvent) => void) | null = null;
  /**
   * The element currently bound by `bindIcon`. Used to skip a dispose+rebind
   * cycle when the same element is passed in again — Lit's `updated()` fires
   * on every render, and the controller's own `host.requestUpdate()` (called
   * from `onLongPress`) triggers a re-render mid-gesture. Without this guard,
   * everyday-light-card.ts's `updated()` would dispose the gesture-detector
   * listeners while the user is still press-dragging, killing the selection
   * (Stefan-2026-05-10 R145b — Card 6b regression).
   */
  private _boundEl: HTMLElement | null = null;
  /**
   * Timestamp (epoch ms) when picker/wheel/saved last transitioned to open.
   * The browser dispatches a synthetic click event after pointerup that
   * targets the bound icon (NOT the picker/popup), which the document-level
   * outside-click handler would otherwise interpret as "click outside" and
   * close the just-opened popup. The 300 ms suppression window catches this
   * phantom click reliably across mouse and touch (Stefan-2026-05-10 R139).
   */
  private _lastOpenedAt = 0;
  /**
   * Stefan-2026-05-12 R323 (PA-0004): true while THIS controller holds the
   * global scroll-lock. When the picker overlay is open we set
   * `documentElement.style.touchAction = 'none'` so the browser's touch-scroll
   * engine never claims a touch mid-drag (the per-element touch-action on the
   * picker dots is a first line of defense; the global lock catches the case
   * where the finger drifts off the picker bounds onto an ancestor with
   * default touch-action). Tracked per-controller so cross-controller
   * coordination (one picker closes when another opens — see onPickerOpen)
   * releases-then-acquires cleanly without dropping the lock between.
   */
  private _scrollLockSnapshot: string | null = null;

  constructor(host: ReactiveControllerHost, opts: PickerControllerOptions) {
    this.host = host;
    this.opts = opts;
    host.addController(this);
  }

  /**
   * Stefan-2026-05-12 R323 (PA-0004): central pickerOpen setter so the
   * scroll-lock side-effect can never go out of sync with the state. Every
   * spot in this file that flips the picker open/closed must route through
   * here (not write `this.pickerOpen = ...` directly).
   */
  private _setPickerOpen(value: boolean): void {
    const wasOpen = this.pickerOpen;
    this.pickerOpen = value;
    if (value && !wasOpen) this._acquireScrollLock();
    else if (!value && wasOpen) this._releaseScrollLock();
  }

  /**
   * Stefan-2026-05-12 R323 (PA-0004): freeze the page's `touch-action` while
   * the press-drag-select picker is active. Stefan-Quote PA-0004: "the moving
   * of the finger to the mode picker item triggers scrolling instead.
   * Scrolling should be locked when our menu is active (kinda?)". Idempotent:
   * a second acquire while already locked is a no-op (snapshot is non-null).
   */
  private _acquireScrollLock(): void {
    if (this._scrollLockSnapshot !== null) return;
    const root = document.documentElement;
    this._scrollLockSnapshot = root.style.touchAction;
    root.style.touchAction = 'none';
  }

  /**
   * Stefan-2026-05-12 R323 (PA-0004): restore the page's `touch-action` to
   * whatever it was before this controller acquired the lock. Reads from the
   * snapshot (not `''`) so we don't clobber a host-page-level rule that
   * intentionally set touchAction for unrelated reasons.
   */
  private _releaseScrollLock(): void {
    if (this._scrollLockSnapshot === null) return;
    document.documentElement.style.touchAction = this._scrollLockSnapshot;
    this._scrollLockSnapshot = null;
  }

  hostConnected(): void {
    this._outsideClickHandler = (ev: MouseEvent) => {
      if (!this.pickerOpen && !this.wheelOpen && !this.savedOpen) return;
      // Phantom-click suppression: a synthetic click fires after pointerup
      // when long-press / double-tap opens the picker or wheel/saved popup.
      // The click target is the bound icon, NOT the popup, so the path-check
      // below would close the just-opened popup. 300 ms covers the
      // browser-level click-after-pointerup window across mouse + touch.
      if (Date.now() - this._lastOpenedAt < 300) return;
      const path = ev.composedPath();
      const insidePicker = path.some(
        (n) => (n as Element)?.classList?.contains?.('everyday-picker-host'),
      );
      if (insidePicker) return;
      this._setPickerOpen(false);
      this.pickerHover = null;
      this.wheelOpen = false;
      this.savedOpen = false;
      this.host.requestUpdate();
    };
    document.addEventListener('click', this._outsideClickHandler, true);
  }

  hostDisconnected(): void {
    if (this._outsideClickHandler) {
      document.removeEventListener('click', this._outsideClickHandler, true);
      this._outsideClickHandler = null;
    }
    this._gestureDispose?.();
    this._gestureDispose = null;
    // Stefan-2026-05-12 R323 (PA-0004): release the global scroll-lock if we
    // were holding it. HA view-switches disconnect cards mid-gesture; without
    // this the documentElement's touchAction would stay frozen on `none` after
    // the card vanishes, breaking page scrolling until the user reloads.
    this._releaseScrollLock();
    // Stefan-2026-05-11 P15.6-r63h (R306 / PA-0038): clear `_boundEl` AFTER
    // disposing the gesture listeners. Order matters — dispose first so any
    // in-flight gesture-detector teardown completes against the real element,
    // THEN forget the reference so the next `bindIcon(sameEl)` after a
    // reconnect doesn't short-circuit on the idempotency guard
    // (`if (el === this._boundEl) return;` at line 224).
    //
    // Bug discovered live (Chrome-MCP) after r63g: HA dashboard view-switches
    // disconnect the cards, fire `hostDisconnected` which DID dispose the
    // gesture listeners, but `_boundEl` retained the (now-detached-but-
    // reattachable) reference. When HA reconnected the SAME element on
    // view-switch-back, Lit's `updated()` triggered the host's rebind logic,
    // which called `bindIcon(tile)` — but the idempotency check saw
    // `tile === _boundEl` and bailed early, so the disposed listeners were
    // NEVER re-attached. Visible symptom: cursor:pointer present (inline
    // style from initial bind survives the disconnect because we set it on
    // the element directly), but tap/long-press fire no handlers because
    // the gesture-detector pointerdown listener is gone. Stefan PA-0038
    // verbatim: "on every parent icon the hand appears now - but no click
    // action with the bug active".
    //
    // This fix complements r63g's unconditional `_bindCompactGestures()` /
    // `_bindExpandedGroupGestures()` calls in group-layout-expanded.ts's
    // `updated()`. r63g ensures the rebind ATTEMPT happens on every render;
    // r63h ensures the rebind ACTUALLY re-attaches listeners after a
    // disconnect cycle. Both are needed.
    this._boundEl = null;
  }

  bindIcon(el: HTMLElement | null): void {
    // Idempotent: rebinding to the same element is a no-op. This is critical
    // because Lit's `updated()` fires on every render, including the re-render
    // triggered by `host.requestUpdate()` inside `onLongPress`. Without this
    // guard the gesture-detector listeners would be disposed mid-gesture and
    // the press-drag-select would silently break (Stefan-2026-05-10 R145b
    // Card 6b parallel-inline regression).
    if (el === this._boundEl) return;
    this._gestureDispose?.();
    this._gestureDispose = null;
    this._boundEl = el;
    if (!el) return;
    // Force the hand cursor on the bound element. Some shadow-DOM trees
    // (parallel-mindmap-icon = ha-icon, SVG glyphs inside .tile.group) don't
    // reliably inherit `cursor: pointer` from CSS-defined ancestors, so we
    // pin it imperatively here. Stefan-2026-05-10 R145a.
    el.style.cursor = 'pointer';
    // Origin element resolution: prefer the `.ic` child (the actual icon
    // circle) over the bound tile when present. Tiles include the `.ic`
    // (icon) PLUS a `.lbl` (text label) underneath, so the tile-center sits
    // ~10 px below the icon-center. Press-drag-select uses `_origin` as the
    // angular reference for `pickerHoverFromPointer` — using tile-center
    // skews the angle by enough to flip quadrants in the 4-option pickers
    // (Stefan-2026-05-10 R145b Cards 2/3 root cause). Fallback to the bound
    // element when there's no `.ic` child (e.g. parallel-mindmap-icon is
    // already the icon itself).
    const originEl = (el.querySelector('.ic') as HTMLElement | null) ?? el;
    const captureOrigin = (): void => {
      const r = originEl.getBoundingClientRect();
      this._origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    // onTap resolution: explicit null = disable tap entirely; explicit fn =
    // use it; undefined (default) = light.toggle on the resolved entity.
    const tapOpt = this.opts.onTap;
    const onTap = tapOpt === null
      ? undefined
      : tapOpt ?? (() => {
          const hass = this.opts.hassProvider();
          const entityId = this.opts.entityIdProvider();
          if (!hass || !entityId) return;
          void hass.callService('light', 'toggle', { entity_id: entityId });
        });
    // onDoubleTap: optional, no default action. Wrapper captures icon-center
    // into `_origin` BEFORE calling host's handler, so popups opened from
    // double-tap (e.g. host calls `openWheel()`) anchor to the icon instead
    // of viewport-center. Stefan-2026-05-10 R143.
    const doubleTapOpt = this.opts.onDoubleTap;
    const onDoubleTap = doubleTapOpt
      ? () => {
          captureOrigin();
          doubleTapOpt();
        }
      : undefined;
    this._gestureDispose = attachGestures(el, {
      longPressMs: this.opts.longPressMs ?? 200,
      doubleTapMs: 500,
      onTap,
      onDoubleTap,
      // Stefan-2026-05-12 R326 (PA-0007 deep-dive): acquire scroll-lock at
      // pointerdown (NOT in onLongPress) so `documentElement.style.touchAction
      // = 'none'` reaches the browser's gesture classifier BEFORE the first
      // pointermove. Pre-R326 the lock fired ~200ms after pointerdown, by
      // which time iOS Safari + Android Chromium had already committed to a
      // scroll-pan. The classifier ignores late mutations per W3C
      // pointer-events-3 (touch-action chain frozen at gesture start).
      onPointerDownLock: () => this._acquireScrollLock(),
      onPointerDownRelease: () => {
        // Only release if the picker did NOT open. When long-press fires,
        // _setPickerOpen(true) is a no-op for the lock (it's already held);
        // the close path releases via _setPickerOpen(false).
        if (!this.pickerOpen) this._releaseScrollLock();
      },
      onLongPress: () => {
        captureOrigin();
        this.pickerHover = null;
        this._setPickerOpen(true);
        this._lastOpenedAt = Date.now();
        // Cross-controller coordination hook — host can use this to close
        // other PickerControllers (member-tile-A's picker should close
        // when member-tile-B opens, etc).
        this.opts.onPickerOpen?.();
        this.host.requestUpdate();
      },
      onLongPressMove: (ev) => {
        if (!this._origin || !this.pickerOpen) return;
        // Stefan-2026-05-10 P15.6-r38 (R203): pass hasEffects so the
        // hit-detection uses the same angle map the picker renders with —
        // slot 'effects' (when present) gets a band, otherwise it's
        // skipped. Without this, dragging onto effects diamond returned
        // the nearest cardinal instead.
        const stateObj = this.opts.entityIdProvider() && this.opts.hassProvider()
          ? this.opts.hassProvider()!.states[this.opts.entityIdProvider()!]
          : undefined;
        const effectList = stateObj?.attributes?.effect_list as string[] | undefined;
        // Stefan-2026-05-12 PA-0002 (R1): gate effects slot on opt-in flag.
        // Pre-PA-0002 any entity reporting effect_list got the slot for free
        // — most modern bulbs do, so every card showed effects by default.
        // Now requires `effects_picker.in_picker: true` via provider.
        const hasEffects = Array.isArray(effectList) && effectList.length > 0
          && this.opts.effectsInPickerProvider?.() === true;
        this.pickerHover = pickerHoverFromPointer(
          ev.clientX - this._origin.x,
          ev.clientY - this._origin.y,
          this.opts.variant,
          {
            hasEffects,
            useMindmap: this.opts.useMindmapProvider?.() ?? false,
            additionalMindmap: this.opts.additionalMindmapProvider?.() ?? false,
            hasCollapse: this.opts.hasCollapseProvider?.() ?? false,
          },
        );
        this.host.requestUpdate();
      },
      onLongPressEnd: () => {
        const hovered = this.pickerHover;
        this.pickerHover = null;
        if (hovered) {
          this._setPickerOpen(false);
          this._applyMode(hovered);
        } else {
          // Stefan-2026-05-12 R323 (PA-0004): finger released without landing
          // on a dot (pointercancel or drag-then-let-go). Pre-R323 the picker
          // stayed `pickerOpen=true` until outside-click; that's intentional
          // (gives the user a second tap-chance), so we keep that behaviour
          // — but ALSO keep the scroll-lock held until the user dismisses.
          // No state change needed here; the lock release happens in the
          // outside-click path or hostDisconnected.
        }
        // Keep _origin alive across the long-press → wheel/saved transition
        // so renderWheel/renderSaved can still anchor at the icon. _origin is
        // refreshed on the next long-press / double-tap (captureOrigin) and
        // gets cleared when the wheel/saved popup closes via outside-click.
        this.host.requestUpdate();
      },
    });
  }

  private _applyMode(mode: PickerMode): void {
    // Host-level override: bypass internal wheel/saved popup state and
    // delegate the result back to the host (e.g. for body-portal popups
    // or multi-picker coordination — see group-layout-expanded P15.5).
    // Host receives icon-center; it offsets to dot via pickerDotPosition.
    if (this.opts.onModePicked) {
      this.opts.onModePicked(mode, this._origin);
      return;
    }
    // Controller-managed popup (parallel-inline 6b). Stefan-2026-05-10 R156:
    // when mode-pick comes from press-drag-select, anchor the popup at the
    // PICKER DOT position (not the icon-center) so the wheel blooms from
    // the dot the user just released on. Same dot-anchor pattern that
    // group-layout-expanded._applyPickerMode uses for its body-portal
    // popups. Without this offset the popup looked centered on the icon
    // even though the user picked a left/right dot ("color wheel
    // erscheint mittig über dem lampen icon").
    if (this._origin) {
      // Stefan-2026-05-10 P15.6-r38 (R203 + R204): pass hasEffects/omitTemp
      // so the dot-anchor matches the actual rendered slot position.
      // pentagon layout (5 items) puts dots at non-cardinal angles.
      const stateObj = this.opts.entityIdProvider() && this.opts.hassProvider()
        ? this.opts.hassProvider()!.states[this.opts.entityIdProvider()!]
        : undefined;
      const effectList = stateObj?.attributes?.effect_list as string[] | undefined;
      // Stefan-2026-05-12 PA-0002 (R1): effects slot gated on opt-in.
      const hasEffects = Array.isArray(effectList) && effectList.length > 0
        && this.opts.effectsInPickerProvider?.() === true;
      this._origin = pickerDotPosition(mode, this._origin, this.opts.variant, {
        hasEffects,
        useMindmap: this.opts.useMindmapProvider?.() ?? false,
        additionalMindmap: this.opts.additionalMindmapProvider?.() ?? false,
        hasCollapse: this.opts.hasCollapseProvider?.() ?? false,
      });
    }
    if (mode === 'wheel') {
      this.wheelOpen = true;
      this._lastOpenedAt = Date.now();
    } else if (mode === 'saved') {
      this.savedOpen = true;
      this._lastOpenedAt = Date.now();
      // Stefan-2026-05-10 P15.6-r46 (R223): always reset edit-mode when
      // opening the saved popup. Re-enter via long-press on a swatch.
      this.savedEditMode = false;
    } else if (mode === 'effects') {
      // Stefan-2026-05-10 P15.6-r46 (R224): forward to host. Internal popup
      // would conflict with the host's existing effects-list rendering
      // (parallel-inline path keeps `_effectsPopupOpen` state). When the
      // host doesn't provide a handler, this is a no-op (visible failure
      // is preferable to a wrong default).
      if (this.opts.onEffectsPick) {
        this.opts.onEffectsPick();
        this._lastOpenedAt = Date.now();
      }
    } else if (mode === 'mindmap') {
      // Stefan-2026-05-12 R338 (PA-0016): parallel-inline mindmap toggles
      // the compact/expanded parallel layout via a host callback. Default
      // (no callback): no-op. The parallel-inline variant always has this
      // slot — see getPickerSlots in picker-geometry.ts.
      if (this.opts.onParallelMindmapPick) {
        this.opts.onParallelMindmapPick();
        this._lastOpenedAt = Date.now();
      }
    }
  }

  private _onModePick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const mode = (ev.detail?.mode as PickerMode) ?? null;
    this._setPickerOpen(false);
    if (mode) this._applyMode(mode);
    this.host.requestUpdate();
  };

  private _onWheelPick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const hass = this.opts.hassProvider();
    const entityId = this.opts.entityIdProvider();
    if (!hass || !entityId) return;
    const { r, g, b } = ev.detail;
    void hass.callService('light', 'turn_on', {
      entity_id: entityId,
      rgb_color: [r, g, b],
    });
    if (this.opts.colorWheelConfigProvider?.()?.persistent === false) {
      this.wheelOpen = false;
      this.host.requestUpdate();
    }
  };

  private _onSavedPick = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const hass = this.opts.hassProvider();
    const entityId = this.opts.entityIdProvider();
    if (!hass || !entityId) return;
    // Stefan-2026-05-10 R159: saved-colors-picker dispatches `{ r, g, b }`
    // (matches the wheel's color-pick shape), NOT `{ rgb: [r,g,b] }`. The
    // pre-r14 code read `ev.detail.rgb` which was always undefined, so
    // every saved-color tap was silently dropped. Mirrors the host's
    // _onSavedColorPick implementation in group-layout-expanded.ts.
    const detail = ev.detail as { r?: number; g?: number; b?: number } | undefined;
    if (
      typeof detail?.r !== 'number'
      || typeof detail?.g !== 'number'
      || typeof detail?.b !== 'number'
    ) {
      return;
    }
    void hass.callService('light', 'turn_on', {
      entity_id: entityId,
      rgb_color: [detail.r, detail.g, detail.b],
    });
    if (this.opts.savedColorsConfigProvider?.()?.persistent === false) {
      this.savedOpen = false;
      this.host.requestUpdate();
    }
  };

  closeWheel = (): void => {
    this.wheelOpen = false;
    this.host.requestUpdate();
  };
  closeSaved = (): void => {
    this.savedOpen = false;
    this.host.requestUpdate();
  };
  closePicker = (): void => {
    this._setPickerOpen(false);
    this.pickerHover = null;
    this.host.requestUpdate();
  };
  /**
   * Open the wheel popup programmatically (e.g. from a host-level
   * onDoubleTap handler). Records the open-timestamp so the controller's
   * outside-click handler can suppress the phantom synthetic-click that
   * fires after the gesture's pointerup. Stefan-2026-05-10 R139.
   */
  openWheel = (): void => {
    this.wheelOpen = true;
    this._lastOpenedAt = Date.now();
    this.host.requestUpdate();
  };
  openSaved = (): void => {
    this.savedOpen = true;
    this._lastOpenedAt = Date.now();
    this.host.requestUpdate();
  };

  renderPicker(): TemplateResult | null {
    if (!this.pickerOpen) return null;
    // Stefan-2026-05-10 P15.6-r35 (R196 + R197): wire current slider mode +
    // light's color_mode + has-effects so the picker can render the
    // dynamic cycle-icon AND conditionally show the effects slot.
    const hass = this.opts.hassProvider();
    const id = this.opts.entityIdProvider();
    const stateObj = (hass && id) ? hass.states[id] : undefined;
    const colorMode = stateObj?.attributes?.color_mode as string | undefined;
    const effectList = stateObj?.attributes?.effect_list as string[] | undefined;
    // Stefan-2026-05-12 PA-0002 (R1): effects slot gated on opt-in flag.
    const hasEffects = Array.isArray(effectList) && effectList.length > 0
      && this.opts.effectsInPickerProvider?.() === true;
    const currentMode = this.opts.currentSliderModeProvider?.() ?? 'brightness';
    return html`
      <everyday-mode-picker
        class="everyday-picker-host"
        .variant=${this.opts.variant}
        .selected=${this.pickerHover ?? undefined}
        .currentMode=${currentMode}
        .colorMode=${colorMode}
        .hasEffects=${hasEffects}
        .useMindmap=${this.opts.useMindmapProvider?.() === true}
        .additionalMindmap=${this.opts.additionalMindmapProvider?.() === true}
        .hasCollapse=${this.opts.hasCollapseProvider?.() === true}
        .parallelExpanded=${this.opts.parallelExpandedProvider?.() === true}
        @mode-pick=${this._onModePick}
        @click=${(ev: Event) => ev.stopPropagation()}
      ></everyday-mode-picker>
    `;
  }

  renderWheel(): TemplateResult | null {
    if (!this.wheelOpen) return null;
    const cfg = this.opts.colorWheelConfigProvider?.();
    // Stefan-2026-05-10 R143+R157: anchor at `_origin` AND use the shared
    // `.inplace-popup wheel` class from popup-portal-styles.ts so the
    // controller-rendered popup looks identical to the host's body-portal
    // popups (same width, transparent background, bloom animation). The
    // `everyday-picker-host` class is preserved so the controller's outside-
    // click handler still recognises the popup and skips closing it. Inline
    // style carries ONLY position; visuals come from the CSS class.
    const o = this._origin;
    const popupStyle = o
      ? `left: ${o.x}px; top: ${o.y}px;`
      : '';
    return html`
      <div
        class="everyday-picker-host inplace-popup wheel"
        style=${popupStyle}
        @click=${(ev: Event) => ev.stopPropagation()}
      >
        <everyday-color-wheel
          .type=${cfg?.type === 'smooth' ? 'smooth' : 'stepped'}
          .hueSegments=${cfg?.hue_segments ?? 21}
          .saturationRings=${cfg?.saturation_rings ?? 6}
          @color-pick=${this._onWheelPick}
          @click=${(ev: Event) => ev.stopPropagation()}
        ></everyday-color-wheel>
      </div>
    `;
  }

  renderSaved(): TemplateResult | null {
    if (!this.savedOpen) return null;
    // Stefan-2026-05-10 R155+R157: read saved-colors palette from the
    // host-provided list (was empty before this provider was added) and
    // use the shared `.inplace-popup saved` styling class.
    const o = this._origin;
    const popupStyle = o
      ? `left: ${o.x}px; top: ${o.y}px;`
      : '';
    const colors = this.opts.savedColorsProvider?.() ?? [];
    return html`
      <div
        class="everyday-picker-host inplace-popup saved"
        style=${popupStyle}
        @click=${(ev: Event) => ev.stopPropagation()}
      >
        <everyday-saved-colors-picker
          .colors=${colors}
          .editMode=${this.savedEditMode}
          @color-pick=${this._onSavedPick}
          @enter-edit=${this._onSavedEnterEdit}
          @add-current=${this._onSavedAddCurrent}
          @remove-color=${this._onSavedRemove}
          @click=${(ev: Event) => ev.stopPropagation()}
        ></everyday-saved-colors-picker>
      </div>
    `;
  }

  // Stefan-2026-05-10 P15.6-r46 (R223): edit-mode handlers for the
  // parallel-inline saved-colors picker. Mirror the group-layout-
  // expanded.ts flow: long-press a swatch → flip editMode → user sees
  // - on each swatch + a trailing + cell. Tap - → host removes index.
  // Tap + → host saves current rgb (and kelvin if in temp mode). Both
  // routes go through host callbacks because the host owns the source-
  // of-truth (in-memory state + optional helper:input_text persistence).
  private _onSavedEnterEdit = (ev: Event): void => {
    ev.stopPropagation();
    this.savedEditMode = true;
    this.host.requestUpdate();
  };

  private _onSavedAddCurrent = (ev: Event): void => {
    ev.stopPropagation();
    if (this.opts.onSavedAddCurrent) this.opts.onSavedAddCurrent();
    // Stefan-ADR 2026-05-08: only one color can be added per edit session,
    // so auto-exit edit-mode after a successful save. Re-enter via
    // long-press (matches group-layout-expanded.ts behaviour).
    this.savedEditMode = false;
    this.host.requestUpdate();
  };

  private _onSavedRemove = (ev: CustomEvent): void => {
    ev.stopPropagation();
    const idx = ev.detail?.index as number | undefined;
    if (typeof idx !== 'number') return;
    if (this.opts.onSavedRemove) this.opts.onSavedRemove(idx);
    this.host.requestUpdate();
  };
}
