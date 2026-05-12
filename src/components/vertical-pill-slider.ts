/**
 * vertical-pill-slider - Phase 3 deliverable.
 *
 * Drop-in light slider that replaces the my-slider-v2 + card-mod stack from the
 * v4 PoC (`~/conductor/workspaces/ha-playground/beirut-v1/my-home/custom-cards/lighting-control-v2/test_view.yaml`).
 *
 * Geometry (matches Stefan's my-slider-v2 + card-mod baseline)
 *   --pill-width             slider width (default 60px)
 *   --pill-height            slider height (default 270px - Stefan 2026-05-12 PA-0002)
 *   --pill-half              = pill-width / 2
 *   --thumb-size             = pill-width * 0.8
 *   --range                  = pill-height - pill-width   (thumb-center travel distance)
 *
 *   thumb_center_y           = pill-half + fraction * range            (from bottom)
 *   thumb_bottom             = thumb_center_y - thumb-size / 2
 *   fill_height              = thumb_center_y + pill-half              = pill-width + fraction * range
 *
 *   .fill has `border-radius: pill-half pill-half 0 0`, so the colored top
 *   sticks up half-a-pill-width above the thumb center as a domed cap. That
 *   is the "missing element above the thumb" Stefan reported - it replicates
 *   the my-slider PoC's `border-top-width: halfWidth` trick.
 *
 * Modes
 *   'brightness'   .fill rendered with rgb_color, label = brightness 0-100.
 *   'temperature'  no .fill (track has kelvin gradient bg). Thumb is colored
 *                  with current rgb_color and rimmed white, label = mireds.
 *
 * Interaction
 *   - pointerdown anywhere on the slider begins a drag; visual updates 1:1 with the cursor.
 *   - service calls are debounced 50 ms during the drag, then flushed on pointerup.
 *   - pointer capture is taken on the HOST element so re-renders of inner DOM
 *     during the drag don't drop the pointer stream (the previous bug where a
 *     quick tap would lose capture and produce visual jitter).
 *   - after commit, the optimistic _dragValue is kept alive until hass actually
 *     reports the new state (or 1.5 s fallback). This kills the "thumb snaps
 *     to click → snaps back → snaps to click" jitter Stefan reported.
 */

import { LitElement, html, css, type CSSResult, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';

export type SliderMode = 'brightness' | 'temperature' | 'hue' | 'saturation' | 'volume';
export type SliderOrientation = 'vertical' | 'horizontal';
export type SliderStyleVariant = 'pill' | 'mixer';

/**
 * HSV → RGB. h, s, v all in 0..1. Returns 0..255 integer triple.
 * Used by _fillColor to simulate the theoretical "on-state" colour for the
 * colour-thumb when the light is off (Stefan-2026-05-09 P42 R17).
 */
function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const TEMP_DEFAULT_MIN_K = 2000;
const TEMP_DEFAULT_MAX_K = 6500;
const DRAG_SERVICE_DEBOUNCE_MS = 50;
const COMMIT_FALLBACK_TIMEOUT_MS = 1500;
// 0.02 ≈ 5 brightness steps (out of 255) or ~90 K of the 4500 K temp range -
// well above HA rounding noise. Below that we treat the value as confirmed.
const COMMIT_TOLERANCE = 0.02;

@customElement('everyday-vertical-pill-slider')
export class EverydayVerticalPillSlider extends LitElement {
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ type: String }) entity = '';
  @property({ type: String }) mode: SliderMode = 'brightness';
  @property({ type: Number, attribute: 'min-kelvin' }) minKelvin = TEMP_DEFAULT_MIN_K;
  @property({ type: Number, attribute: 'max-kelvin' }) maxKelvin = TEMP_DEFAULT_MAX_K;
  /**
   * Orientation. Default 'vertical' (the original design-mock pill, tall +
   * narrow). 'horizontal' swaps the dimensions so the pill lies flat,
   * suitable for media-player volume controls. Reflected as a host
   * attribute (`orientation`) so CSS `:host([orientation='horizontal'])`
   * selectors fire (Stefan-2026-05-09).
   */
  @property({ type: String, reflect: true }) orientation: SliderOrientation = 'vertical';

  /**
   * Visual style variant. 'pill' (default) is the original full-width pill
   * with gradient track + thumb-inside-pill. 'mixer' is the DJ-mixer-fader
   * look — thin centred track + portrait rectangular pill thumb that
   * extends past the track top + bottom. Currently only meaningful in
   * horizontal orientation. Reflected as `style-variant` host attribute so
   * CSS selectors fire.
   */
  @property({ type: String, reflect: true, attribute: 'style-variant' }) styleVariant: SliderStyleVariant = 'pill';

  /**
   * @deprecated 2026-05-09 P41-R8-revert. Stefan asked to drop the slider-
   * bottom hint icon ("dass es so wie jetzt im mode picker drin ist, ist
   * genug"). Property kept for one cycle for backwards-compat with any
   * in-flight callers. Render path is removed.
   */
  @property({ type: Boolean, reflect: true, attribute: 'mindmap-hint' }) showMindmapHint = false;

  // Optimistic value during drag and post-commit (until hass confirms).
  // When null we read straight from hass state.
  @state() private _dragValue: number | null = null;
  // Stefan-2026-05-10 P15.6-r34 (R200a): sticky-at-top flag for hue-mode.
  // When the user drags hue to the slider top (fraction ≥ 0.999), HA
  // stores `hue=0` (it normalises 360 → 0 internally). On the next
  // hass-push the natural fraction from `cur?.[0] / 360` would be 0 →
  // the slider snaps from top to bottom, visually a "teleport". This
  // flag overrides the rendered fraction back to 1.0 (= 360° label,
  // thumb at top) until the user drags below 0.999. Cleared when the
  // user drags hue away from the top OR switches modes.
  private _pinnedAtTop = false;
  @state() private _isDragging = false;

  private _serviceDebounceTimer: number | null = null;
  private _pendingValue: number | null = null;

  // Last fraction we actually sent to HA. Cleared once hass reports a matching
  // state (in updated()) OR after the fallback timeout fires.
  private _committedValue: number | null = null;
  private _commitTimeoutId: number | null = null;

  /**
   * Per-mode last-known fraction. Snapshotted on every hass push when the
   * light is on. Used for two purposes (Stefan-2026-05-09 P41 R9):
   *   1. _hassFraction returns the last snapshot for non-brightness modes
   *      when the light is OFF, so the slider visualises "where this axis
   *      last was" instead of collapsing to 0.
   *   2. _callService uses the stored brightness + the OTHER axis (sat for
   *      hue-mode, hue for sat-mode) to build a complete `light.turn_on`
   *      payload, so the user's drag turns the light on AT the previous
   *      brightness instead of HA's default ramp.
   *
   * The snapshot keeps `brightness` as a 0..1 fraction, `hue` as 0..1 (i.e.
   * normalised hueDeg / 360), `saturation` as 0..1, `temperature` as the
   * inverted-kelvin fraction the slider uses internally. Volume is read
   * directly from hass and doesn't need this.
   */
  private _lastSnapshots: Partial<Record<SliderMode, number>> = {};

  // ---------- lifecycle ----------

  override connectedCallback(): void {
    super.connectedCallback();
    // Bind to the host so setPointerCapture(this) keeps the pointer stream
    // alive even when shadow-DOM children re-render mid-drag.
    this.addEventListener('pointerdown', this._onPointerDown);
    this.addEventListener('pointermove', this._onPointerMove);
    this.addEventListener('pointerup', this._onPointerUp);
    this.addEventListener('pointercancel', this._onPointerUp);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('pointerdown', this._onPointerDown);
    this.removeEventListener('pointermove', this._onPointerMove);
    this.removeEventListener('pointerup', this._onPointerUp);
    this.removeEventListener('pointercancel', this._onPointerUp);
    if (this._serviceDebounceTimer !== null) {
      clearTimeout(this._serviceDebounceTimer);
      this._serviceDebounceTimer = null;
    }
    if (this._commitTimeoutId !== null) {
      clearTimeout(this._commitTimeoutId);
      this._commitTimeoutId = null;
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);

    // Mode change → drop any pending optimistic state since the brightness
    // fraction is meaningless for a temperature slider (and vice versa).
    if (changed.has('mode')) {
      this._dragValue = null;
      this._committedValue = null;
      if (this._commitTimeoutId !== null) {
        clearTimeout(this._commitTimeoutId);
        this._commitTimeoutId = null;
      }
    }

    // P41 R9: snapshot per-axis values whenever the light is on, so we have
    // them available for off-state recall + off-state pre-apply.
    if (changed.has('hass')) {
      const s = this.stateObj;
      if (s && s.state === 'on') {
        const bri = s.attributes.brightness as number | undefined;
        if (typeof bri === 'number') {
          this._lastSnapshots.brightness = Math.max(0, Math.min(1, bri / 255));
        }
        const hs = s.attributes.hs_color as [number, number] | undefined;
        if (hs && hs.length === 2) {
          const wrapped = ((hs[0] % 360) + 360) % 360;
          this._lastSnapshots.hue = Math.max(0, Math.min(1, wrapped / 360));
          this._lastSnapshots.saturation = Math.max(0, Math.min(1, hs[1] / 100));
        }
        const k = s.attributes.color_temp_kelvin as number | undefined;
        if (typeof k === 'number' && k > 0) {
          const range = this.maxKelvin - this.minKelvin;
          if (range > 0) {
            this._lastSnapshots.temperature = 1 - Math.max(0, Math.min(1, (k - this.minKelvin) / range));
          }
        }
      }
    }

    // Hass updated → if it confirms our committed value, drop the optimistic state.
    if (
      this._committedValue !== null &&
      !this._isDragging &&
      changed.has('hass')
    ) {
      const fresh = this._hassFraction();
      const offMatch = this._committedValue <= 0.005 && this.stateObj?.state !== 'on';
      if (offMatch || Math.abs(fresh - this._committedValue) <= COMMIT_TOLERANCE) {
        this._dragValue = null;
        this._committedValue = null;
        if (this._commitTimeoutId !== null) {
          clearTimeout(this._commitTimeoutId);
          this._commitTimeoutId = null;
        }
      }
    }
  }

  // ---------- state derivation ----------

  private get stateObj(): HassEntity | undefined {
    return this.entity && this.hass ? this.hass.states[this.entity] : undefined;
  }

  private _hassFraction(): number {
    const s = this.stateObj;
    if (!s) return 0;
    // Volume mode: media_player entities. Read volume_level (0-1 already)
    // regardless of state - HA reports volume even when paused/off.
    if (this.mode === 'volume') {
      const v = (s.attributes.volume_level as number | undefined) ?? 0;
      return Math.max(0, Math.min(1, v));
    }
    // Light is OFF: brightness collapses to 0; non-brightness modes show
    // their last snapshotted value so the slider tells the user "this is
    // where the axis was last set" (Stefan-2026-05-09 P41 R9). Falling
    // back to 0 if no snapshot exists yet (first-load / cold-start).
    if (s.state !== 'on') {
      if (this.mode === 'brightness') return 0;
      return this._lastSnapshots[this.mode] ?? 0;
    }
    if (this.mode === 'brightness') {
      const b = (s.attributes.brightness as number | undefined) ?? 0;
      return Math.max(0, Math.min(1, b / 255));
    }
    if (this.mode === 'hue') {
      const hs = s.attributes.hs_color as [number, number] | undefined;
      const h = hs?.[0] ?? 0;
      // Stefan-2026-05-09: HA / many integrations normalize hue 0 → 360.
      // Without the modulo, sending hue=0 round-trips back as 360 and the
      // slider jumps from bottom to top. (h % 360) collapses both extremes
      // to 0 so the slider stays where the user put it.
      const wrapped = ((h % 360) + 360) % 360;
      return Math.max(0, Math.min(1, wrapped / 360));
    }
    if (this.mode === 'saturation') {
      const hs = s.attributes.hs_color as [number, number] | undefined;
      const sat = hs?.[1] ?? 0;
      return Math.max(0, Math.min(1, sat / 100));
    }
    // Temperature: invert so the slider visual matches its kelvin gradient
    // (`to top, cool 0%, warm 100%`). Top of slider (fraction=1) = warm =
    // low K. Bottom (fraction=0) = cool = high K.
    const k = (s.attributes.color_temp_kelvin as number | undefined) ?? this.minKelvin;
    const range = this.maxKelvin - this.minKelvin;
    if (range <= 0) return 0;
    return 1 - Math.max(0, Math.min(1, (k - this.minKelvin) / range));
  }

  private _currentFraction(): number {
    if (this._dragValue !== null) return this._dragValue;
    // Stefan-2026-05-10 P15.6-r34 (R200a): hue-mode "pinned at top" sticky.
    // When the user dragged hue to fraction=1 (= 360°), HA normalises
    // hue → 0 and the natural read-back maps to fraction=0 (slider at
    // bottom). The flag overrides to 1 so the thumb stays at top. The
    // flag clears the moment the user drags below 0.999 (in onPointerMove).
    if (this.mode === 'hue' && this._pinnedAtTop) return 1;
    return this._hassFraction();
  }

  private _fillColor(): string {
    const s = this.stateObj;
    // Volume mode: always show progress (no on/off state to gate). Use HA
    // active accent so the fill reads as a "level indicator" rather than
    // tied to a light's colour. Stefan-2026-05-09: volume slider should look
    // like brightness with --paper-item-icon-active-color as progress.
    if (this.mode === 'volume') {
      return 'var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a))';
    }
    if (!s) return 'rgba(0,0,0,0)';
    if (s.state === 'on') {
      const rgb = s.attributes.rgb_color as [number, number, number] | undefined;
      if (rgb && rgb.length === 3) return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
      return 'var(--primary-color)';
    }
    // Stefan-2026-05-09 P42 R17: light is OFF — simulate the THEORETICAL
    // active-state colour so the colour-thumb is filled instead of empty.
    // The user's mental model is "this is the colour the bulb will turn on
    // with when I tap the slider". Brightness mode: empty (level IS the data).
    if (this.mode === 'brightness') return 'rgba(0,0,0,0)';

    // P43 R19: layered fallback for the off-state colour. The first attempt
    // (P42) only used in-memory snapshots, which are EMPTY on a fresh page
    // load if the light has been off the whole time — that's why Stefan saw
    // a grey thumb. Now we try, in order:
    //   1. In-memory snapshots (warm path: lit captured them while on).
    //   2. Live HA attributes (`hs_color`, `rgb_color`) — many integrations
    //      preserve these even when the light reports state==='off'.
    //   3. Brand-orange default — better than grey for an "active-but-off"
    //      tap target. Theme-overridable via --paper-item-icon-active-color.
    const lastHue = this._lastSnapshots.hue;
    const lastSat = this._lastSnapshots.saturation;
    const lastBri = this._lastSnapshots.brightness;
    if (lastHue !== undefined && lastSat !== undefined) {
      const rgb = hsv2rgb(lastHue, lastSat, lastBri ?? 1);
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
    // 2. HA attributes might still carry colour info when off (Hue / Tradfri
    // / many integrations preserve these). Try hs_color first since it's the
    // canonical light-card colour attr; rgb_color is computed downstream.
    const hs = s.attributes.hs_color as [number, number] | undefined;
    if (hs && hs.length === 2) {
      const wrapped = ((hs[0] % 360) + 360) % 360;
      const rgb = hsv2rgb(wrapped / 360, Math.max(0, Math.min(1, hs[1] / 100)), 1);
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }
    const attrRgb = s.attributes.rgb_color as [number, number, number] | undefined;
    if (attrRgb && attrRgb.length === 3) return `rgb(${attrRgb[0]}, ${attrRgb[1]}, ${attrRgb[2]})`;
    // 3. Default brand-orange — visually communicates "tap me, I'm an
    // interactive control" instead of the dim grey that --primary-color
    // resolves to in HA's default theme.
    return 'var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a))';
  }

  private _label(): string {
    const s = this.stateObj;
    if (!s) return '';
    // Volume label is shown even when the media_player is paused/idle/off.
    if (this.mode === 'volume') {
      return `${Math.round(this._currentFraction() * 100)}`;
    }
    if (s.state !== 'on') return '';
    if (this.mode === 'brightness') {
      // Drive the label off the live fraction (drag or hass) so the readout
      // stays in lock-step with the visual position.
      return `${Math.round(this._currentFraction() * 100)}`;
    }
    if (this.mode === 'hue') {
      return `${Math.round(this._currentFraction() * 360)}°`;
    }
    if (this.mode === 'saturation') {
      return `${Math.round(this._currentFraction() * 100)}`;
    }
    const k = (s.attributes.color_temp_kelvin as number | undefined) ?? 0;
    if (!k) return '';
    return `${Math.round(1_000_000 / k)}`;
  }

  // ---------- pointer handling ----------

  private _onPointerDown = (ev: PointerEvent): void => {
    if (!this.entity || !this.hass) return;
    if (ev.button !== undefined && ev.button !== 0) return;
    ev.preventDefault();
    try {
      // Capture on the host - inner nodes can re-render freely without the
      // browser dropping the pointer stream mid-drag.
      this.setPointerCapture(ev.pointerId);
    } catch {
      // Some older WebKit throws; safe to ignore - the document still emits
      // pointermove/up to bubbling listeners on the host.
    }
    this._isDragging = true;
    this._updateFromPointer(ev);
  };

  private _onPointerMove = (ev: PointerEvent): void => {
    if (!this._isDragging) return;
    this._updateFromPointer(ev);
  };

  private _onPointerUp = (ev: PointerEvent): void => {
    if (!this._isDragging) return;
    try {
      this.releasePointerCapture(ev.pointerId);
    } catch {
      /* see above */
    }
    this._isDragging = false;
    this._updateFromPointer(ev);
    this._commitNow();
  };

  private _updateFromPointer(ev: PointerEvent): void {
    const track = this.renderRoot.querySelector('.track') as HTMLElement | null;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    if (this.orientation === 'horizontal') {
      if (rect.width <= 0) return;
      // For horizontal: the long axis is the X axis. Thumb-center range
      // is [halfHeight, pillWidth - halfHeight]. Drag right = increase
      // fraction (0 left → 1 right).
      const halfShort = rect.height / 2;
      const xFromLeft = ev.clientX - rect.left;
      const visualMin = halfShort;
      const visualMax = rect.width - halfShort;
      const visualRange = Math.max(1, visualMax - visualMin);
      const visualX = Math.max(visualMin, Math.min(visualMax, xFromLeft));
      const fraction = (visualX - visualMin) / visualRange;
      this._dragValue = fraction;
      this._scheduleServiceCall(fraction);
      return;
    }
    if (rect.height <= 0) return;
    const halfWidth = rect.width / 2;
    const yFromBottom = rect.height - (ev.clientY - rect.top);
    // Visual thumb-center range is [halfWidth, pillHeight - halfWidth] - clamping
    // the cursor to that range gives a 1:1 thumb-follows-finger feel without
    // ever letting the thumb spill outside the pill.
    const visualMin = halfWidth;
    const visualMax = rect.height - halfWidth;
    const visualRange = Math.max(1, visualMax - visualMin);
    const visualY = Math.max(visualMin, Math.min(visualMax, yFromBottom));
    const fraction = (visualY - visualMin) / visualRange;
    this._dragValue = fraction;
    // Stefan-2026-05-10 P15.6-r34 (R200a): clear hue-pinned-at-top when the
    // user drags below 0.999. The flag is re-set in `_setLight` when the
    // drag commits at fraction ≥ 0.999.
    if (this.mode === 'hue' && fraction < 0.999) this._pinnedAtTop = false;
    this._scheduleServiceCall(fraction);
  }

  private _scheduleServiceCall(fraction: number): void {
    this._pendingValue = fraction;
    if (this._serviceDebounceTimer !== null) return;
    this._serviceDebounceTimer = window.setTimeout(() => {
      this._serviceDebounceTimer = null;
      const v = this._pendingValue;
      this._pendingValue = null;
      if (v !== null) this._callService(v);
    }, DRAG_SERVICE_DEBOUNCE_MS);
  }

  private _commitNow(): void {
    if (this._serviceDebounceTimer !== null) {
      clearTimeout(this._serviceDebounceTimer);
      this._serviceDebounceTimer = null;
    }
    const v = this._pendingValue ?? this._dragValue;
    this._pendingValue = null;
    if (v === null) return;
    this._callService(v);
    this._committedValue = v;
    // KEEP _dragValue around. updated() clears it once hass reports the match.
    // The timeout below is a safety net for cases where HA never confirms
    // (offline, an automation overrode the state, etc.).
    if (this._commitTimeoutId !== null) clearTimeout(this._commitTimeoutId);
    this._commitTimeoutId = window.setTimeout(() => {
      this._commitTimeoutId = null;
      this._dragValue = null;
      this._committedValue = null;
    }, COMMIT_FALLBACK_TIMEOUT_MS);
  }

  private _callService(fraction: number): void {
    if (!this.hass || !this.entity) return;
    if (this.mode === 'volume') {
      // Volume mode: media_player.volume_set with the 0-1 fraction directly.
      // Drag-to-zero mutes (matches user expectation of "all the way down = silent").
      if (fraction <= 0.005) {
        void this.hass.callService('media_player', 'volume_mute', {
          entity_id: this.entity,
          is_volume_muted: true,
        });
        return;
      }
      // If muted, unmute first so the volume change takes effect.
      const muted = this.stateObj?.attributes?.is_volume_muted as boolean | undefined;
      if (muted) {
        void this.hass.callService('media_player', 'volume_mute', {
          entity_id: this.entity,
          is_volume_muted: false,
        });
      }
      void this.hass.callService('media_player', 'volume_set', {
        entity_id: this.entity,
        volume_level: Math.max(0, Math.min(1, fraction)),
      });
      return;
    }
    if (this.mode === 'brightness') {
      // Drag-to-zero turns the light off (matches the PoC's "min: 1, drag below = off" feel).
      if (fraction <= 0.005) {
        void this.hass.callService('light', 'turn_off', { entity_id: this.entity });
        return;
      }
      const brightness = Math.round(fraction * 255);
      void this.hass.callService('light', 'turn_on', { entity_id: this.entity, brightness });
      return;
    }
    // Stefan-2026-05-09 P41 R9: when the light is OFF and the user drags a
    // non-brightness slider, restore the previous brightness AND the OTHER
    // axis (sat for hue-mode, hue for sat-mode, brightness only for temp-mode)
    // so the bulb comes on with the user's prior state plus only the axis
    // they're actively dragging changed. Falls back to sensible defaults
    // when no snapshot exists yet.
    const isOff = this.stateObj?.state !== 'on';
    if (this.mode === 'hue') {
      const cur = this.stateObj?.attributes?.hs_color as [number, number] | undefined;
      // When off, attribute is unreliable — use snapshot first, default to 100.
      // Stefan-2026-05-10 P15.6-r34 (R200b): round sat to integer when
      // sending. Without the round, HA's hs→rgb→hs round-trip loses ~1%
      // sat per cycle (because float precision differs between hs and rgb
      // representations). Each hue-drag-cycle would pull sat down. With
      // integer round, the read-back equals the value we sent → no drift.
      const satFromSnap = this._lastSnapshots.saturation;
      const sat = isOff
        ? (satFromSnap !== undefined ? Math.round(satFromSnap * 100) : 100)
        : Math.round(cur?.[1] ?? 100);
      // Stefan-2026-05-10 P15.6-r34 (R200a): cap removed — pre-r34 was
      // `Math.min(359, ...)` to avoid HA's 360→0 normalisation snapping
      // the slider from top to bottom on the next hass push. New approach:
      // send 360 actual, set `_pinnedAtTop` so the renderer sticks the
      // thumb at fraction=1 + label "360°" until the user drags away.
      // HA still stores hue=0 internally (red 0°) — visually identical
      // to red 360° — but the slider remembers the user's intent.
      const hue = Math.round(fraction * 360);
      this._pinnedAtTop = fraction >= 0.999;
      const payload: Record<string, unknown> = {
        entity_id: this.entity,
        hs_color: [hue, sat],
      };
      if (isOff && this._lastSnapshots.brightness !== undefined) {
        payload.brightness = Math.round(this._lastSnapshots.brightness * 255);
      }
      void this.hass.callService('light', 'turn_on', payload);
      return;
    }
    if (this.mode === 'saturation') {
      const cur = this.stateObj?.attributes?.hs_color as [number, number] | undefined;
      const hueFromSnap = this._lastSnapshots.hue;
      const hue = isOff
        ? (hueFromSnap !== undefined ? Math.round(hueFromSnap * 360) : 0)
        : (cur?.[0] ?? 0);
      // Stefan-2026-05-09 P47-fix R61: saturation = 0 in HA's hs_color
      // collapses the colour to white (no chroma), which loses the user's
      // hue context. Clamp the service-call value to >= 1 so the lamp
      // always retains a sliver of saturation, even when the slider is at
      // its absolute 0 position. The slider DISPLAY still shows the raw
      // 0..100 fraction — only the service-call payload is clamped.
      const sat = Math.max(1, Math.round(fraction * 100));
      const payload: Record<string, unknown> = {
        entity_id: this.entity,
        hs_color: [hue, sat],
      };
      if (isOff && this._lastSnapshots.brightness !== undefined) {
        payload.brightness = Math.round(this._lastSnapshots.brightness * 255);
      }
      void this.hass.callService('light', 'turn_on', payload);
      return;
    }
    // Temperature mode: inverted-kelvin fraction → kelvin value.
    // Top (fraction=1) = warm (low K), bottom (fraction=0) = cool (high K).
    const kelvin = Math.round(this.maxKelvin - fraction * (this.maxKelvin - this.minKelvin));
    const payload: Record<string, unknown> = {
      entity_id: this.entity,
      color_temp_kelvin: kelvin,
    };
    if (isOff && this._lastSnapshots.brightness !== undefined) {
      payload.brightness = Math.round(this._lastSnapshots.brightness * 255);
    }
    void this.hass.callService('light', 'turn_on', payload);
  }

  // ---------- render ----------

  protected render(): TemplateResult {
    const s = this.stateObj;
    if (!this.hass) return html`<div class="container"><div class="track loading"></div></div>`;
    if (!s) {
      return html`<div class="container">
        <div class="track error" title="Entity not found">${this.entity}</div>
      </div>`;
    }

    const f = this._currentFraction();
    const fillColor = this._fillColor();
    const label = this._label();
    const isBrightness = this.mode === 'brightness';
    const isVolume = this.mode === 'volume';
    // Brightness + volume use the small round ".thumb" (= --thumb-size, 80% of
    // pill-width) — the original "level indicator" look kept across both
    // slider types. Color modes (temp/hue/saturation) use ".color-thumb"
    // which is SQUARE at full pill-width with a white border bleeding to
    // the host edge (Stefan-2026-05-09 P40 R1+R2+R7). Brightness vs color
    // thumbs intentionally differ — brightness stays the reference look,
    // color thumbs share their own visual identity (filled disc + ring).
    const showFill = isBrightness || isVolume;
    const stateClass = s.state === 'on' ? 'on' : 'off';
    const draggingClass = this._isDragging ? 'dragging' : '';

    // Stefan-2026-05-09 P47-fix: hide the thumb when this is a temperature
    // slider AND the light is currently in a color mode (hs/xy/rgb/...).
    // The thumb position would otherwise be misleading — color_temp_kelvin
    // is stale or undefined while the light is rendering color, so the
    // thumb pretends to indicate a temperature value that isn't applied.
    // Better to render the gradient track only and let the user opt in
    // (drag to commit) when they actively want temp control.
    const colorMode = s.attributes.color_mode as string | undefined;
    const isInColorMode = !!colorMode
      && colorMode !== 'color_temp'
      && colorMode !== 'brightness'
      && colorMode !== 'onoff'
      && colorMode !== 'unknown';
    const isInTempMode = colorMode === 'color_temp';
    const hideTempThumb = this.mode === 'temperature' && s.state === 'on' && isInColorMode;
    // Stefan-2026-05-10 P15.6-r34 (R192): when the light is in color-temp
    // mode (or kelvin-only without hs/rgb attributes), the hue + saturation
    // sliders show STALE/INVENTED data — hs_color is either undefined or
    // computed from a default for the kelvin point. Either way it doesn't
    // reflect anything the user touched. Hide the thumb on those sliders
    // so they don't pretend to know a value. The track still renders so
    // the user can drag-to-commit when they actively want color control.
    const hideHueSatThumb = (this.mode === 'hue' || this.mode === 'saturation')
      && s.state === 'on'
      && isInTempMode;
    // Stefan-2026-05-10 P15.6-r41 (R205): when the light is OFF, the
    // hue/temp/saturation sliders show no thumb at all. Brightness slider
    // at fraction=0 is OK (the empty fill bar IS the data). For non-
    // brightness modes, the thumb pointing at a "saved" colour or kelvin
    // value is misleading when the light is dark — Stefan-Quote: "the hue,
    // temp and saturation sliders should show NO thumb! brightness slider
    // in 0 position is ok." Track still renders so user can drag-to-commit.
    const hideOffStateThumb =
      (this.mode === 'hue' || this.mode === 'saturation' || this.mode === 'temperature')
      && s.state !== 'on';
    const hideThumb = hideTempThumb || hideHueSatThumb || hideOffStateThumb;

    // For the saturation gradient we need the current hue at full saturation
    // as the "100%" end-stop. Read from hs_color when ON; fall back to the
    // last-snapshotted hue when OFF so the saturation track keeps its colour
    // context across off → on transitions (Stefan-2026-05-09 P41 R9).
    const hs = s.attributes.hs_color as [number, number] | undefined;
    const hueDeg = (s.state === 'on' && hs)
      ? hs[0]
      : (this._lastSnapshots.hue !== undefined ? this._lastSnapshots.hue * 360 : 0);
    const hueColor = `hsl(${hueDeg}, 100%, 50%)`;
    const containerStyle = `--fill-frac: ${f}; --hue-color: ${hueColor};`;

    return html`
      <div class="container ${draggingClass}" style=${containerStyle}>
        <div class="track ${this.mode} ${stateClass}">
          ${showFill ? html`<div class="fill" style=${`background: ${fillColor};`}></div>` : null}
        </div>
        ${hideThumb
          ? null
          : html`
              <div
                class=${showFill ? 'thumb' : 'color-thumb'}
                style=${showFill ? '' : `background: ${fillColor};`}
              >
                <span class="label">${label}</span>
              </div>
            `}
      </div>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
      /* ------------------------------------------------------------------
         CSS-Variable architecture — Stefan-2026-05-09 P41 (corrects P40)
         ------------------------------------------------------------------
         --everyday-slider-width   OUTER host width. Default 60. Group view
                                   inherits 47 from group-layout-expanded.
         --pill-width              INNER pill width (gradient track + the
                                   brightness/volume .thumb). Default ALIASED
                                   to slider-width so the pill spans the host
                                   horizontally — the white ring on the
                                   colour-thumb lives BETWEEN pill and
                                   thumb-content rather than between host and
                                   pill. Stefan-2026-05-09 R5+R6+R7-corr
                                   ("--thumb-size soll ein fixer wert sein,
                                   .color-thumb width=height=thumb-size").
         --thumb-size              Brightness/volume thumb diameter AND the
                                   colour-thumb's inner content disc.
                                   Stefan-2026-05-09 P42 R15: back to a calc
                                   so the thumb scales with host-width.
                                     calc(var(--everyday-slider-width) * 0.8)
                                   Default 60 → 48. Group 47 → 37.6.
         --color-thumb-border      Stefan-formula:
                                     (--everyday-slider-width - --thumb-size) / 2
                                   With thumb-size = slider-width × 0.8, this
                                   simplifies to slider-width × 0.1 — a 10 %
                                   ring on each side. Default 6 px, group 4.7.
                                   With box-sizing:content-box and
                                   width/height = thumb-size, the OUTER box
                                   (incl. border) spans the full host width —
                                   the colour-thumb visually fills the lane.
         --range                   Vertical travel of the thumb center.
                                   = pill-height - pill-width.
         ------------------------------------------------------------------ */
      /* Stefan-2026-05-10 P15.6-r47 (R228): use var-with-fallback for
         all derived calcs INSTEAD of declaring --everyday-slider-width
         on :host. A :host declaration has higher specificity than an
         inherited value, so a parent inline-style override (e.g.
         group-layout-expanded.ts setting --everyday-slider-width: 27px
         on .layout) was never reaching the slider. Stefan-Quote: "i
         tried this config but the slider width doesnt change". With the
         fallback pattern, var(--everyday-slider-width, 60px) picks up
         the parent value when set, falls back to 60 when unset. */
      --pill-width: var(--everyday-slider-width, 60px);
      /* Stefan-2026-05-12 PA-0002: default bumped 220 -> 270. Stefan-Quote:
         "the default slider length should be 270px". Affects single-light
         + compact-host + parallel-inline + popup paths via the cascading
         override chain. Explicit slider.height config still wins. */
      --pill-height: var(--everyday-slider-height, 270px);
      --pill-half: calc(var(--pill-width) / 2);
      --thumb-size: calc(var(--everyday-slider-width, 60px) * 0.8);
      --color-thumb-border: calc((var(--everyday-slider-width, 60px) - var(--thumb-size)) / 2);
      /* range = how far the thumb's *center* travels from min to max */
      --range: calc(var(--pill-height) - var(--pill-width));
      width: var(--everyday-slider-width, 60px);
      height: var(--pill-height);
    }
    .container {
      position: relative;
      width: 100%;
      height: 100%;
      cursor: pointer;
      touch-action: none;
      user-select: none;
    }
    .track {
      /* Track is the visible PILL — fills the host since --pill-width is
         aliased to --everyday-slider-width by default. P41 reverts the
         centring transform from P40; the inner-vs-outer pill distinction
         is no longer the load-bearing concept (Stefan-2026-05-09 R5+R6+R7
         corr). */
      position: absolute;
      inset: 0;
      border-radius: var(--pill-half);
      background: rgba(0, 0, 0, 0.2);
      overflow: hidden;
      /* Stefan-2026-05-10 R165: dropped the OUTER slider drop-shadows.
         They were tuned for the dark paris theme and looked wrong in
         the default HA theme (heavy black bloom cast on light card
         surface). The inset shadow alone carries the depth. Themes that
         want the outer-shadow look can override --everyday-slider-outer-shadow
         (default none) - not the x/y vars from before, since those
         left a centered halo at offset 0. */
      box-shadow:
        inset 0 2px 3px rgba(0, 0, 0, 0.30),
        var(--everyday-slider-outer-shadow, none);
    }
    .track.loading {
      opacity: 0.4;
    }
    .track.error {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--error-color, #c62828);
      font-size: 11px;
      padding: 8px;
      background: rgba(198, 40, 40, 0.1);
    }
    .track.temperature {
      background: linear-gradient(to top, rgb(244, 253, 255) 0%, rgb(255, 136, 13) 100%);
    }
    .track.hue {
      /* Stefan-2026-05-10 R183b: gradient stops INSET by pill-half so the
         hue colors line up with the thumb-valid Y range (where fraction
         is computed). Pre-r25 the gradient spanned the full track height
         while fraction was clamped to [pill-half, height - pill-half] —
         clicking on visually-green produced fraction values that mapped
         to yellow. Now: bottom pill-half = solid red 0°, top pill-half =
         solid red 360°, and the rainbow transitions across the central
         range matching the thumb's reach. Calc-based stops let the
         gradient adapt when --pill-height changes (170/220/260). */
      background: linear-gradient(
        to top,
        hsl(0, 100%, 50%) 0,
        hsl(0, 100%, 50%) var(--pill-half),
        hsl(60, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.166),
        hsl(120, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.333),
        hsl(180, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.5),
        hsl(240, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.667),
        hsl(300, 100%, 50%) calc(var(--pill-half) + var(--range) * 0.833),
        hsl(360, 100%, 50%) calc(var(--pill-half) + var(--range)),
        hsl(360, 100%, 50%) 100%
      );
    }
    .track.saturation {
      /* Bottom = grey (0% sat), top = current hue at 100% saturation. */
      background: linear-gradient(
        to top,
        rgb(150, 150, 150) 0%,
        var(--hue-color, hsl(0, 100%, 50%)) 100%
      );
    }
    .fill {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      /* fill_height = pill-width (= the bottom dome at f=0) + fraction * range */
      height: calc(var(--pill-width) + var(--fill-frac, 0) * var(--range));
      /* Top corners rounded with pill-half radius - that's the colored "cap"
         Stefan was missing above the thumb. Bottom is auto-clipped by the
         track's overflow: hidden + matching pill curve. */
      border-radius: var(--pill-half) var(--pill-half) 0 0;
      transition: height 80ms linear, background 200ms ease-out;
      will-change: height, background;
    }
    .track.off .fill {
      background: rgba(0, 0, 0, 0) !important;
    }
    .thumb,
    .color-thumb {
      position: absolute;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: bottom 80ms linear;
      will-change: bottom;
      pointer-events: none;
    }
    /* Brightness/volume thumb: round, --thumb-size diameter, centred in the
       host. Stefan-2026-05-09 R7: brightness is the reference look — keep it. */
    .thumb {
      left: calc(50% - var(--thumb-size) / 2);
      width: var(--thumb-size);
      height: var(--thumb-size);
      border-radius: 50%;
      background: white;
      bottom: calc(var(--pill-half) - var(--thumb-size) / 2 + var(--fill-frac, 0) * var(--range));
    }
    /* Color-control thumb (temp / hue / saturation): Stefan-2026-05-09 P42
       (corrects P41 - Stefan said left=undefined, thumb-size back to calc).
         - Square geometry: width = height = --thumb-size (= slider-width × 0.8).
         - NO left - the thumb is auto-centred in the host by box-sizing
           content-box + matching border. With thumb-size + 2×border =
           slider-width = host width, the outer box fills the host
           horizontally and the inner content sits centred.
         - border = (slider-width - thumb-size) / 2 - Stefan formula.
           Simplifies to slider-width × 0.1 (10 % ring) given thumb-size is
           80 % of slider-width.
       Bottom math (Stefan-2026-05-09 P47-fix R48): thumb-OUTER-bottom is
       flush with pill-bottom at fill-frac=0 (no gap). With outer-size =
       thumb-size + 2x border = pill-width, the outer box from bottom 0
       to bottom 0 + outer-size = pill-width fills the pill bottom-cap
       exactly. At fill-frac=1, bottom = range = pill-height - pill-width,
       so outer-top = bottom + outer-size = pill-height (top-cap edge). */
    .color-thumb {
      /* Stefan-2026-05-10 P15.6-r34 (R199): switched from content-box +
         calc-derived width/height to border-box + left:0 right:0 +
         height: pill-width. Reason: with content-box and fractional CSS
         vars (e.g. --everyday-slider-width: 47 → thumb-size: 37.6 +
         border: 4.7), browsers round each component independently and
         the OUTER box ends up 1-2 px narrower/shorter than the pill
         track on top + right. New layout pins the outer box to the
         pill's exact dimensions; border thickness is consumed from
         within so the inner-circle radius adapts automatically. */
      left: 0;
      right: 0;
      height: var(--pill-width);
      box-sizing: border-box;
      border: var(--color-thumb-border) solid white;
      border-radius: 50%;
      background: white;
      bottom: calc(var(--fill-frac, 0) * var(--range));
    }
    /* Active drag → kill transitions so the cursor and the thumb stay in lockstep. */
    .container.dragging .fill,
    .container.dragging .thumb,
    .container.dragging .color-thumb {
      transition: none;
    }
    .label {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      font-family: var(--paper-font-body1_-_font-family);
    }

    /* ----- Horizontal orientation: PILL style (default) ----- */
    /* Stefan-2026-05-09: horizontal default is the original pill (full-width
       gradient track + thumb travelling along X). Mixer-fader is OPT-IN via
       style-variant='mixer' (handled below). */
    :host([orientation='horizontal']) {
      width: var(--pill-height);
      /* OUTER cross-axis dimension matches --everyday-slider-width (incl. white ring).
         Stefan-2026-05-10 P15.6-r47 (R228): also fallback-pattern for
         orientation=horizontal so per-card slider.width still wins. */
      height: var(--everyday-slider-width, 60px);
    }
    :host([orientation='horizontal']) {
      /* Horizontal: swap axes. Host width = pill-height (long axis), height
         = pill-width (short axis). Track stays inset:0 like the vertical
         orientation since pill-width = slider-width. */
    }
    :host([orientation='horizontal']) .track.temperature {
      background: linear-gradient(to right, rgb(244, 253, 255) 0%, rgb(255, 136, 13) 100%);
    }
    :host([orientation='horizontal']) .track.hue {
      background: linear-gradient(
        to right,
        hsl(0, 100%, 50%) 0%,
        hsl(60, 100%, 50%) 17%,
        hsl(120, 100%, 50%) 33%,
        hsl(180, 100%, 50%) 50%,
        hsl(240, 100%, 50%) 67%,
        hsl(300, 100%, 50%) 83%,
        hsl(360, 100%, 50%) 100%
      );
    }
    :host([orientation='horizontal']) .track.saturation {
      background: linear-gradient(to right, rgb(150, 150, 150) 0%, var(--hue-color, hsl(0, 100%, 50%)) 100%);
    }
    /* Fill grows from left to right (pill style). */
    :host([orientation='horizontal']) .fill {
      right: auto;
      bottom: auto;
      top: 0;
      height: 100%;
      width: calc(var(--pill-width) + var(--fill-frac, 0) * var(--range));
      border-radius: 0 var(--pill-half) var(--pill-half) 0;
      transition: width 80ms linear, background 200ms ease-out;
      will-change: width, background;
    }
    /* Thumb travels along the X axis (pill style). */
    :host([orientation='horizontal']) .thumb,
    :host([orientation='horizontal']) .color-thumb {
      bottom: auto;
      transition: left 80ms linear;
      will-change: left;
    }
    :host([orientation='horizontal']) .thumb {
      /* Brightness/volume thumb: round, centred on cross-axis, travels X. */
      top: calc(50% - var(--thumb-size) / 2);
      left: calc(var(--pill-half) - var(--thumb-size) / 2 + var(--fill-frac, 0) * var(--range));
      width: var(--thumb-size);
      height: var(--thumb-size);
    }
    :host([orientation='horizontal']) .color-thumb {
      /* Horizontal: square thumb-size × thumb-size with white ring. Travels
         along X like the brightness thumb; cross-axis (top) auto-centres
         via the equal border on top + bottom (content-box mode). Stefan-
         2026-05-09 P42. */
      top: 0;
      left: calc(var(--pill-half) - var(--thumb-size) / 2 + var(--fill-frac, 0) * var(--range));
      width: var(--thumb-size);
      height: var(--thumb-size);
    }

    /* ----- Horizontal orientation: MIXER style (opt-in) ----- */
    /* Stefan-2026-05-09: thin centred track + portrait rectangular pill
       thumb extending past the track. DJ-board / mixer-fader look. Opt-in
       via slider.style: 'mixer' which sets style-variant='mixer' on the
       host. */
    :host([orientation='horizontal'][style-variant='mixer']) {
      --hbar-height: 44px;
      --hbar-track-h: 14px;
      --hbar-thumb-w: 20px;
      --hbar-thumb-h: 44px;
      --hbar-thumb-r: 12px;
      --hbar-range: calc(var(--pill-height) - var(--hbar-thumb-w));
      width: var(--pill-height);
      height: var(--hbar-height);
    }
    :host([orientation='horizontal'][style-variant='mixer']) .track {
      /* Mixer-fader override: reset the transform from the parent horizontal
         rule (which uses translateY(-50%)) so the mixer's explicit top
         math isn't double-offset. Frontend-developer review 2026-05-09 P40. */
      inset: auto 0;
      transform: none;
      top: calc(50% - var(--hbar-track-h) / 2);
      height: var(--hbar-track-h);
      width: 100%;
      border-radius: calc(var(--hbar-track-h) / 2);
    }
    :host([orientation='horizontal'][style-variant='mixer']) .fill {
      width: calc(var(--hbar-track-h) + var(--fill-frac, 0) * var(--hbar-range));
      border-radius: 0 calc(var(--hbar-track-h) / 2) calc(var(--hbar-track-h) / 2) 0;
    }
    :host([orientation='horizontal'][style-variant='mixer']) .thumb,
    :host([orientation='horizontal'][style-variant='mixer']) .color-thumb {
      width: var(--hbar-thumb-w);
      height: var(--hbar-thumb-h);
      border-radius: var(--hbar-thumb-r);
      top: calc(50% - var(--hbar-thumb-h) / 2);
      left: calc(var(--fill-frac, 0) * var(--hbar-range));
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
      background: var(--everyday-mixer-handle, white);
      border: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-vertical-pill-slider': EverydayVerticalPillSlider;
  }
}
