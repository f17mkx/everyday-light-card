/**
 * mode-picker - Phase 6 deliverable, R4 in-place expansion.
 *
 * Triangle-arranged 3-circle picker that expands around a member icon when
 * the user long-presses. Geometry verbatim from
 * `assets/design-mocks/mode-picker-inplace.html` (Stefan-greenlit at the
 * Phase-1 review):
 *
 *     • Top-left  (210°)  Temp     - switches the slider to color-temp mode
 *     • Top-right (330°)  Saved    - opens the saved-colors popup (P7)
 *     • Bottom    (90°)   Wheel    - opens the color-wheel popup
 *
 * The component renders the three pickers absolutely-positioned around its
 * own origin. The host is expected to be placed on top of the member tile
 * in the parent component (z-index higher than the tile). On mount it runs
 * a quick scale 0 → 1 animation so the dots appear to bloom out from the
 * icon. On dismiss the parent removes the element from the DOM.
 *
 * Picker selection fires a `mode-pick` CustomEvent { detail: { mode } } and
 * the parent decides what to do (switch slider mode, open popup, etc.).
 */

import { LitElement, html, svg, css, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getPickerSlots, getPickerAngleMap } from '../helpers/picker-geometry.js';

// Stefan-2026-05-12 PA-0002 (R2a): 'collapse' picker mode appears only on
// expanded-group cards when `group.expansion_sticky: true` AND the card is
// currently inline-expanded. Picking it sets `_compactExpanded = false`,
// folding the topology back into the compact tile. Required when sticky
// expansion is enabled (outside-click is suppressed), otherwise users have
// no way to fold the topology back without a config reload.
export type PickerMode = 'temp' | 'wheel' | 'saved' | 'mindmap' | 'parallel' | 'cycle' | 'effects' | 'collapse';

/**
 * Layout variant — drives both how many options render AND their angles.
 *
 *   'member'         3-option triangle. Wheel 90° (bottom), Temp 210°
 *                    (top-left), Saved 330° (top-right). Used for member-
 *                    icon long-press in the expanded view AND the compact-
 *                    collapsed group when expand-via-picker is OFF.
 *   'group-compact'  4-option diamond. Wheel 90° (bottom), Saved 0° (right),
 *                    Temp 180° (left), Mindmap 270° (top). Used for the
 *                    compact-collapsed group icon (Stefan-2026-05-09 R8)
 *                    where Mindmap = expand into the N-slider topology view.
 *   'group-expanded' 2-option horizontal. Wheel 0° (right), Saved 180°
 *                    (left). Stefan-2026-05-09 R6: 2-option pickers sit
 *                    LEFT-RIGHT of the icon (was 90/270 = top/bottom).
 *                    Used for the GROUP tile in the expanded view — no
 *                    Temp (group has no per-mode slider) and no Mindmap
 *                    (already expanded).
 */
// Stefan-2026-05-10 P15.6-r46 (R221 + R222): `parallel-inline` is the
// variant for cards using `default_view_mode: parallel`. Picker shows
// only saved + wheel (+ effects when entity has effect_list) — drops
// 'cycle' (no point cycling when every mode is already visible side-
// by-side) and drops 'parallel' (already in parallel mode, opening a
// popup of the same modes is redundant).
export type PickerVariant =
  | 'member'
  | 'group-compact'
  | 'group-expanded'
  | 'parallel-inline';

interface PickerOption {
  mode: PickerMode;
  label: string;
  // polar offset from origin
  angleDeg: number;
  iconPath: string;
}

// Equilateral triangle, point-down. Distance from origin to each dot center.
// Bumped from 44 → 64 (Stefan 2026-05-08): less clustering around the icon,
// dots are easier to land on with the press-drag-select gesture.
const ORBIT_R = 64;
// Each picker dot is a 40 px circle.
const DOT_SIZE = 40;

const OPTIONS: PickerOption[] = [
  {
    mode: 'temp',
    label: 'Temp',
    angleDeg: 210, // top-left
    // mdi:thermometer
    iconPath:
      'M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4 4 0 1 0 5 0z M11.5 14 L11.5 8',
  },
  {
    mode: 'saved',
    label: 'Saved',
    angleDeg: 330, // top-right
    // 7-dot favourites pattern (matches assets/icons/favourite-7-dot.svg)
    iconPath: '7DOT',
  },
  {
    mode: 'wheel',
    label: 'Wheel',
    angleDeg: 90, // bottom
    // mdi:palette (simplified)
    iconPath:
      'M12 3a9 9 0 1 0 0 18 c1 0 1.5 -.6 1.5 -1.5 c0 -.5 -.2 -.9 -.5 -1.2 c-.3 -.3 -.5 -.7 -.5 -1.2 c0 -.9 .6 -1.5 1.5 -1.5 H16 a5 5 0 0 0 5 -5 c0 -4 -4 -7.6 -9 -7.6 z',
  },
];

@customElement('everyday-mode-picker')
export class EverydayModePicker extends LitElement {
  /** Highlight a particular option (visual selected state). */
  @property({ type: String }) selected?: PickerMode;

  /**
   * Current mode of the slider this picker belongs to. Drives the dynamic
   * icon for the 'cycle' slot — Stefan-2026-05-10 P15.6-r35 (R196): the
   * cycle slot shows the NEXT mode in the cycle sequence so the user
   * sees what they'd get on the next pick. Also handles the legacy
   * 'temp' slot icon-swap (sun glyph when slider is already in temp).
   * Extended from 'brightness' | 'temperature' to all 4 slider modes
   * so cycle can resolve hue→saturation and saturation→brightness too.
   */
  @property({ type: String, attribute: 'current-mode' }) currentMode: 'brightness' | 'temperature' | 'hue' | 'saturation' = 'brightness';

  /**
   * Color mode of the underlying light entity (`color_temp`, `hs`, `xy`,
   * `rgb*`, etc.). Used to compute the cycle: lights in color_temp mode
   * cycle brightness ↔ temperature; lights in color modes cycle through
   * brightness → hue → saturation → brightness. When omitted, defaults
   * to assuming a color light (4-mode cycle).
   */
  @property({ type: String, attribute: 'color-mode' }) colorMode?: string;

  /**
   * Whether the underlying entity has a non-empty `effect_list` attribute.
   * Toggles the 5th 'effects' picker slot — Stefan-2026-05-10 R197.
   */
  @property({ type: Boolean, attribute: 'has-effects' }) hasEffects = false;

  /**
   * Layout variant — see `PickerVariant` jsdoc above. Default 'member' (the
   * original 3-option triangle).
   */
  @property({ type: String }) variant: PickerVariant = 'member';

  /**
   * @deprecated 2026-05-09 (P40) — use `variant='group-expanded'` instead.
   * Kept temporarily for backwards-compat with any in-flight callers.
   * When true, behaves like `variant='group-expanded'`.
   */
  @property({ type: Boolean, attribute: 'omit-temp' }) omitTemp = false;

  /**
   * Stefan-2026-05-11 R238: when true, swap 'parallel' for 'mindmap' in
   * the top slot. Used by embedded nested-group cards where 'parallel'
   * doesn't make sense as the primary action — the user wants to expand
   * the sub-group, not open a same-entity parallel-sliders popup.
   */
  @property({ type: Boolean, attribute: 'use-mindmap' }) useMindmap = false;

  /**
   * Stefan-2026-05-11 R290 (PA-14): when true, the 'mindmap' slot is
   * appended to the regular slot list (5 or 6 slots total) instead of
   * replacing 'parallel'. Used by standalone-compact group cards.
   * Mutually-exclusive with `useMindmap` (which wins when both true).
   */
  @property({ type: Boolean, attribute: 'additional-mindmap' }) additionalMindmap = false;

  /**
   * Stefan-2026-05-12 PA-0002 (R2a): when true, the 'collapse' slot is
   * appended to the slot list (group-expanded variant only). Used when
   * `group.expansion_sticky: true` AND the card is inline-expanded —
   * gives the user a way to fold the topology back since outside-click
   * is suppressed under sticky expansion. Picker dispatches
   * `mode-pick` with `detail.mode = 'collapse'` on selection.
   */
  @property({ type: Boolean, attribute: 'has-collapse' }) hasCollapse = false;

  /**
   * Stefan-2026-05-12 R342 (PA-0017): true when the parallel-inline layout
   * is currently EXPANDED (multi-axis sliders side-by-side). Drives the
   * glyph swap on the `mindmap` slot in the parallel-inline variant —
   * when expanded, render the inverted-mindmap (COLLAPSE) glyph so the
   * user reads the action as "collapse back to compact"; when compact,
   * render the upright MINDMAP glyph signalling "expand to multi-axis".
   * Mirrors the host-icon swap pattern used elsewhere when state implies
   * the inverse action. Default false (compact).
   */
  @property({ type: Boolean, attribute: 'parallel-expanded' }) parallelExpanded = false;

  private _onPick = (mode: PickerMode) => (ev: Event): void => {
    ev.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('mode-pick', { detail: { mode }, bubbles: true, composed: true }),
    );
  };

  /**
   * Resolve the NEXT slider mode in the cycle based on the current slider
   * mode + the light's color_mode. Mirrors the cycle table in
   * `group-layout-expanded.ts:_cycleNextMode` so the picker icon agrees
   * with what actually happens on pick. Stefan-2026-05-10 P15.6-r35 (R196).
   *
   *   color_temp light: brightness ↔ temperature
   *   color light:      brightness → hue → saturation → brightness
   *
   * (Temperature is intentionally NOT in the color-light cycle — it lives
   * on its own axis. To set color-temp on a color-capable light, users
   * pick 'temp' from the 4-diamond directly.)
   */
  private _nextSliderMode(): 'brightness' | 'temperature' | 'hue' | 'saturation' {
    if (this.colorMode === 'color_temp') {
      return this.currentMode === 'brightness' ? 'temperature' : 'brightness';
    }
    switch (this.currentMode) {
      case 'brightness': return 'hue';
      case 'hue':        return 'saturation';
      case 'saturation': return 'brightness';
      case 'temperature': return 'brightness';  // off-cycle re-entry
      default: return 'brightness';
    }
  }

  private _renderIcon(opt: PickerOption): TemplateResult {
    // Cycle slot — Stefan-2026-05-10 P15.6-r35 (R196): icon shows the NEXT
    // slider mode in the cycle so the user sees what they'd get on the
    // next pick. Replaces the original static 'temp' slot for member +
    // group-compact variants.
    if (opt.mode === 'cycle') {
      return this._renderModeIcon(this._nextSliderMode());
    }
    // Temp option in temperature-mode → render a sun/brightness glyph so the
    // tap target reads as "return to brightness" instead of "switch to temp".
    if (opt.mode === 'temp' && this.currentMode === 'temperature') {
      return this._renderModeIcon('brightness');
    }
    // Stefan-2026-05-12 R342 (PA-0017): when this is the parallel-inline
    // mindmap slot AND the parallel layout is currently expanded, render
    // the inverted mindmap (= COLLAPSE glyph) so the icon reads as
    // "collapse back to compact". Stefan-Quote PA-0017: "bei R3 soll beim
    // zusammenklappen von den paralellen slidern die umgekehrte mindmap
    // im mode picker gezeigt werden". Only swaps in parallel-inline variant
    // — the `mindmap` slot in member/group-compact still means "expand".
    if (
      opt.mode === 'mindmap'
      && this.variant === 'parallel-inline'
      && this.parallelExpanded
    ) {
      return this._renderRawIcon('COLLAPSE');
    }
    if (opt.iconPath === '7DOT') {
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
          <circle cx="19" cy="12" r="1.6" fill="currentColor"></circle>
          <circle cx="15.5" cy="18.06" r="1.6" fill="currentColor"></circle>
          <circle cx="8.5" cy="18.06" r="1.6" fill="currentColor"></circle>
          <circle cx="5" cy="12" r="1.6" fill="currentColor"></circle>
          <circle cx="8.5" cy="5.94" r="1.6" fill="currentColor"></circle>
          <circle cx="15.5" cy="5.94" r="1.6" fill="currentColor"></circle>
        </svg>
      `;
    }
    if (opt.iconPath === 'PARALLEL') {
      // Parallel-sliders glyph: 4 small vertical bars at different heights —
      // suggests "multiple sliders side-by-side". Stefan-2026-05-09 P43 R20.
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <line x1="5"  y1="6"  x2="5"  y2="20"></line>
          <circle cx="5"  cy="9"  r="1.6" fill="currentColor"></circle>
          <line x1="11" y1="4"  x2="11" y2="20"></line>
          <circle cx="11" cy="14" r="1.6" fill="currentColor"></circle>
          <line x1="17" y1="6"  x2="17" y2="20"></line>
          <circle cx="17" cy="11" r="1.6" fill="currentColor"></circle>
        </svg>
      `;
    }
    if (opt.iconPath === 'EFFECTS') {
      // Effects-list glyph: 3 horizontal lines decreasing in length —
      // suggests a "list of effect names". Stefan-2026-05-10 P15.6-r35 R197.
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <line x1="5" y1="6"  x2="19" y2="6"></line>
          <line x1="5" y1="12" x2="15" y2="12"></line>
          <line x1="5" y1="18" x2="11" y2="18"></line>
          <circle cx="20" cy="12" r="1.4" fill="currentColor"></circle>
        </svg>
      `;
    }
    if (opt.iconPath === 'COLLAPSE') {
      // Stefan-2026-05-12 PA-0002 (R2a): "collapse expanded topology" glyph.
      // Inverted mindmap-trizack — host (large dot) at TOP, three child
      // nodes converging at the BOTTOM, curves drawn from children-toward-
      // host (suggesting "fold up into the parent"). Mirrors the MINDMAP
      // glyph's L-arm geometry so users recognise the visual relationship.
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <!-- Host at TOP-center -->
          <circle cx="12" cy="4" r="2.4" fill="currentColor"></circle>
          <!-- 3 child nodes at bottom y=18 — converging into the host above -->
          <circle cx="4" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="18" r="1.8" fill="currentColor"></circle>
          <!-- Left arm: child(4,18) curving up to host(12,4) -->
          <path d="M 4 18 C 4 10 6 5 12 4" fill="none"></path>
          <!-- Center arm: vertical -->
          <path d="M 12 18 L 12 4" fill="none"></path>
          <!-- Right arm: mirror -->
          <path d="M 20 18 C 20 10 18 5 12 4" fill="none"></path>
        </svg>
      `;
    }
    if (opt.iconPath === 'MINDMAP') {
      // Mindmap-trizack glyph for the "expand to topology view" picker
      // option. Stefan-2026-05-09 P41-R12: flatter than P40 — all three
      // child nodes sit on the SAME y, and the outer arms FAN OUT (sharper
      // initial horizontal then upward turn) for a more L-shaped feel.
      // Geometry mirrors the expanded-view mindmap-path's new symmetric
      // L-arms (P41-R13).
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <!-- 3 child nodes at same y=6 — Stefan-flatter request -->
          <circle cx="4" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="6" r="1.8" fill="currentColor"></circle>
          <!-- Host at bottom-center -->
          <circle cx="12" cy="20" r="2.4" fill="currentColor"></circle>
          <!-- Left arm: L-shaped — host out to (4,18) horizontal, then up
               to (4,6). Control points pull the curve toward the corner. -->
          <path d="M 12 20 C 6 19 4 14 4 6" fill="none"></path>
          <!-- Center arm: pure vertical -->
          <path d="M 12 20 L 12 6" fill="none"></path>
          <!-- Right arm: mirror of left -->
          <path d="M 12 20 C 18 19 20 14 20 6" fill="none"></path>
        </svg>
      `;
    }
    return html`
      <svg viewBox="0 0 24 24" class="g">
        <path d=${opt.iconPath}></path>
      </svg>
    `;
  }

  /**
   * Stefan-2026-05-12 R342 (PA-0017): render a named glyph (MINDMAP /
   * COLLAPSE / PARALLEL / EFFECTS / 7DOT) WITHOUT going through the full
   * `_renderIcon(opt)` dispatch. Lets `_renderIcon` do an opt-mode-aware
   * glyph swap (e.g. "render COLLAPSE here even though opt.iconPath says
   * MINDMAP") without recursive calls. Falls back to a minimal SVG when
   * the glyph code is unknown.
   */
  private _renderRawIcon(iconPath: string): TemplateResult {
    const stub: PickerOption = {
      mode: 'mindmap',  // arbitrary — caller already decided rendering
      label: '',
      angleDeg: 0,
      iconPath,
    };
    // Re-enter _renderIcon's iconPath branches by directly inlining the
    // matching glyph. Avoids the cycle/temp-mode swap branches at the top
    // of _renderIcon since this helper is only called for raw glyph render.
    if (iconPath === 'COLLAPSE') {
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="4" r="2.4" fill="currentColor"></circle>
          <circle cx="4" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="18" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="18" r="1.8" fill="currentColor"></circle>
          <path d="M 4 18 C 4 10 6 5 12 4" fill="none"></path>
          <path d="M 12 18 L 12 4" fill="none"></path>
          <path d="M 20 18 C 20 10 18 5 12 4" fill="none"></path>
        </svg>
      `;
    }
    if (iconPath === 'MINDMAP') {
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="4" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="20" cy="6" r="1.8" fill="currentColor"></circle>
          <circle cx="12" cy="20" r="2.4" fill="currentColor"></circle>
          <path d="M 12 20 C 6 19 4 14 4 6" fill="none"></path>
          <path d="M 12 20 L 12 6" fill="none"></path>
          <path d="M 12 20 C 18 19 20 14 20 6" fill="none"></path>
        </svg>
      `;
    }
    // Unknown glyph code — render an empty SVG so the dot still has a
    // valid child (avoids layout collapse).
    void stub;
    return html`<svg viewBox="0 0 24 24" class="g"></svg>`;
  }

  /**
   * Render the icon for a specific slider mode. Used by both the cycle slot
   * (which shows the NEXT mode's icon) and the temp slot's brightness-fallback
   * when the slider is already in temp. Stefan-2026-05-10 P15.6-r35 (R196).
   */
  private _renderModeIcon(mode: 'brightness' | 'temperature' | 'hue' | 'saturation'): TemplateResult {
    if (mode === 'brightness') {
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="12" r="4" fill="none"></circle>
          <line x1="12" y1="3" x2="12" y2="5"></line>
          <line x1="12" y1="19" x2="12" y2="21"></line>
          <line x1="3" y1="12" x2="5" y2="12"></line>
          <line x1="19" y1="12" x2="21" y2="12"></line>
          <line x1="5.6" y1="5.6" x2="7" y2="7"></line>
          <line x1="17" y1="17" x2="18.4" y2="18.4"></line>
          <line x1="5.6" y1="18.4" x2="7" y2="17"></line>
          <line x1="17" y1="7" x2="18.4" y2="5.6"></line>
        </svg>
      `;
    }
    if (mode === 'temperature') {
      // mdi:thermometer
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <path d="M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4 4 0 1 0 5 0z M11.5 14 L11.5 8"></path>
        </svg>
      `;
    }
    if (mode === 'hue') {
      // Hue: 3 nested arcs suggesting a color spectrum (red/green/blue tilt).
      // Drawn line-only so the picker keeps its mono-look (color comes from
      // the active state's currentColor).
      return html`
        <svg viewBox="0 0 24 24" class="g">
          <circle cx="12" cy="12" r="8" fill="none"></circle>
          <path d="M 12 4 A 8 8 0 0 1 20 12" fill="none" stroke-width="2.4"></path>
          <path d="M 12 4 A 8 8 0 0 0 4 12" fill="none" stroke-width="1.4"></path>
          <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
        </svg>
      `;
    }
    // saturation: gradient bar from empty to full (top-to-bottom dot column).
    return html`
      <svg viewBox="0 0 24 24" class="g">
        <circle cx="12" cy="6"  r="1.6" fill="none"></circle>
        <circle cx="12" cy="11" r="2.0" fill="none" stroke-width="1.6"></circle>
        <circle cx="12" cy="17" r="2.6" fill="currentColor"></circle>
      </svg>
    `;
  }

  /**
   * Resolve which `PickerOption[]` the picker should render based on the
   * variant (and the legacy `omitTemp` prop for backwards-compat). Each
   * variant pins its own angles — the OPTIONS constant only carries the
   * 'member' angles, the others are spread-overridden here.
   */
  private _renderedOptions(): PickerOption[] {
    const wheel = OPTIONS.find((o) => o.mode === 'wheel')!;
    const temp = OPTIONS.find((o) => o.mode === 'temp')!;
    const saved = OPTIONS.find((o) => o.mode === 'saved')!;
    // Backwards-compat: if `omitTemp` was set explicitly, treat as group-expanded.
    const v: PickerVariant = this.omitTemp ? 'group-expanded' : this.variant;
    // Stefan-2026-05-10 P15.6-r45 (R216): drop the legacy 2-option early-
    // return for v === 'group-expanded'. It rendered wheel/saved at 0°/180°
    // but the hit-detection (pickerHoverFromPointer) used the modern
    // 4-diamond angle-map (saved=0°, wheel=90°), so RIGHT pointer (dx>0)
    // visually highlighted wheel-icon while the selected mode came back as
    // saved — Stefan-Quote: "wenn ich auf color-wheel gehe, dann blinkt
    // das saved colors icon und umgedreht". Falling through to the unified
    // slots+angleMap path below makes both render and hit-detection share
    // the SAME source-of-truth (`getPickerAngleMap`). Group-expanded now
    // shows the same modern 4-5 slot picker as member/group-compact.
    // The legacy `omitTemp: true` 2-option layout still works (handled
    // inside picker-geometry.ts via `opts.omitTemp`) for any caller that
    // sets it explicitly.
    // Stefan-2026-05-10 P15.6-r38 (R202 + R203 + R204): unified picker
    // layout for all 3 variants (member / group-compact / group-expanded).
    // Slot list + angle distribution come from `picker-geometry` so the
    // hit-detection (`pickerHoverFromPointer`) sees exactly the same
    // dots the picker renders. Default 4-diamond (parallel/saved/wheel/
    // cycle) at cardinals; pentagon distribution (72° intervals) when
    // `hasEffects` adds the 5th slot. Stefan-Quote (R202): "per default
    // the main node's mode picker should contain the full pop up sliders".
    const slots = getPickerSlots(v, {
      hasEffects: this.hasEffects,
      omitTemp: this.omitTemp,
      useMindmap: this.useMindmap,
      additionalMindmap: this.additionalMindmap,
      hasCollapse: this.hasCollapse,
    });
    const angleMap = getPickerAngleMap(v, {
      hasEffects: this.hasEffects,
      omitTemp: this.omitTemp,
      useMindmap: this.useMindmap,
      additionalMindmap: this.additionalMindmap,
      hasCollapse: this.hasCollapse,
    });
    const slotMeta: Record<string, Omit<PickerOption, 'angleDeg'>> = {
      wheel: { mode: 'wheel', label: wheel.label, iconPath: wheel.iconPath },
      saved: { mode: 'saved', label: saved.label, iconPath: saved.iconPath },
      temp: { mode: 'temp', label: temp.label, iconPath: temp.iconPath },
      cycle: { mode: 'cycle', label: 'Cycle slider mode', iconPath: 'CYCLE' },
      parallel: { mode: 'parallel', label: 'Parallel sliders', iconPath: 'PARALLEL' },
      mindmap: { mode: 'mindmap', label: 'Expand', iconPath: 'MINDMAP' },
      effects: { mode: 'effects', label: 'Effects', iconPath: 'EFFECTS' },
      // Stefan-2026-05-12 PA-0002 (R2a): collapse-topology mode for sticky
      // expansion. Label "Collapse" reads as the inverse of "Expand".
      collapse: { mode: 'collapse', label: 'Collapse', iconPath: 'COLLAPSE' },
    };
    return slots
      .map((m): PickerOption | null => {
        const meta = slotMeta[m];
        const angle = angleMap[m];
        if (!meta || angle === undefined) return null;
        return { ...meta, angleDeg: angle } as PickerOption;
      })
      .filter((o): o is PickerOption => o !== null);
  }

  protected render(): TemplateResult {
    const renderedOptions = this._renderedOptions();
    return html`
      <div class="picker">
        ${renderedOptions.map((opt) => {
          const a = (opt.angleDeg * Math.PI) / 180;
          const x = Math.cos(a) * ORBIT_R;
          const y = Math.sin(a) * ORBIT_R;
          const isSelected = this.selected === opt.mode;
          return html`
            <button
              class="dot ${isSelected ? 'sel' : ''}"
              style=${`left: ${x}px; top: ${y}px;`}
              type="button"
              @click=${this._onPick(opt.mode)}
              @pointerdown=${(ev: Event) => ev.stopPropagation()}
              aria-label=${opt.label}
            >
              ${this._renderIcon(opt)}
            </button>
          `;
        })}
      </div>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
      position: relative;
      width: 0;
      height: 0;
      pointer-events: auto;
    }
    .picker {
      position: absolute;
      left: 0;
      top: 0;
      /* Stefan-2026-05-12 R323 (PA-0004): block mobile scroll-claim on the
         picker container. The press-drag-select gesture lives entirely inside
         this 0x0 anchor's absolute-positioned children; without touch-action
         none the browser's scroll engine claimed touches that drifted onto
         picker children, killing target-acquisition mid-drag. */
      touch-action: none;
    }
    .dot {
      position: absolute;
      width: ${DOT_SIZE}px;
      height: ${DOT_SIZE}px;
      transform: translate(-50%, -50%) scale(0);
      animation: bloom 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) forwards;
      border-radius: 50%;
      border: none;
      background: var(--card-background-color, #2a2c4a);
      color: var(--state-light-active-color, #f88d2a);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 140ms ease-out, box-shadow 140ms ease-out;
      will-change: transform;
      /* Stefan-2026-05-12 R323 (PA-0004): per-dot guarantee. The bound icon
         element already declares touch-action none (see group-layout-expanded
         .tile.member + everyday-light-card .single-icon[data-interactive]),
         but as the finger moves OFF the icon and ONTO a dot, the dot needs
         its own declaration or mobile Safari/Chrome reclaim the touch for
         scrolling and dispatch pointercancel mid-drag. */
      touch-action: none;
    }
    .dot:hover {
      transform: translate(-50%, -50%) scale(1.08);
    }
    .dot.sel,
    .dot:active {
      transform: translate(-50%, -50%) scale(1.14);
      box-shadow:
        0 0 0 2px var(--state-light-active-color, #f88d2a),
        0 0 18px rgba(248, 141, 42, 0.5),
        0 4px 12px rgba(0, 0, 0, 0.45);
    }
    .dot:focus-visible {
      outline: 2px solid var(--state-light-active-color, #f88d2a);
      outline-offset: 4px;
    }
    .g {
      width: 22px;
      height: 22px;
      stroke: currentColor;
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    /* Stagger the bloom so the dots don't fire at the exact same frame -
       reads as a quick "fan out". 4-option diamond ('group-compact' variant)
       needs the 4th rule too, otherwise nth-child(4) gets animation-delay 0
       and bloomed alongside the 1st (frontend-developer + code-reviewer
       2026-05-09 P40). */
    .dot:nth-child(1) { animation-delay: 0ms; }
    .dot:nth-child(2) { animation-delay: 40ms; }
    .dot:nth-child(3) { animation-delay: 80ms; }
    .dot:nth-child(4) { animation-delay: 120ms; }
    /* Stefan-2026-05-11 R290 (PA-14): support 5- and 6-slot pickers
       (pentagon + hexagon) when additionalMindmap is set on standalone-
       compact group cards. Same 40 ms stagger so the bloom reads as
       one fan-out instead of two paired pops. R111-safe: no backticks. */
    .dot:nth-child(5) { animation-delay: 160ms; }
    .dot:nth-child(6) { animation-delay: 200ms; }

    @keyframes bloom {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      }
      60% {
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-mode-picker': EverydayModePicker;
  }
}
