/**
 * everyday-light-card - configuration schema (Phase 2 stub)
 *
 * Phase 2 (2026-05-07): minimal entity-only config to compile.
 * Phase 5 expands group + gestures + mindmap.
 * Phase 7 expands saved-colors + edit-mode.
 * Phase 9 expands gesture-runtime-rotation.
 *
 * Source-of-truth Schema-Spec: see CONCEPT.md "Config-Schema (proposal)".
 */

import type { LovelaceCardConfig } from 'custom-card-helpers';

export type GestureAction =
  | 'none'
  | 'toggle'
  | 'toggle_with_restore'
  | 'mode_picker'
  | 'saved_colors'
  | 'expand_overlay'
  | 'expand_inline'
  // Stefan-2026-05-12 R325 (PA-0006): for a LEAF (non-group) member entity,
  // double-tap opens an inline-style parallel-sliders view (brightness +
  // temp + ... side-by-side). MVP reuses the existing parallel-popup
  // mechanism (positioned at the slider rect); a true tile-replace inline
  // is a follow-up. Stefan-Quote PA-0006: "for boxes there should be an
  // inline expand option on double tap, that shows the brightness and
  // temp slider side by side".
  | 'expand_inline_parallel'
  | 'classic_more_info'
  | 'color_wheel'
  | 'cycle_mode'
  | 'effects_list'
  // Stefan-2026-05-16 PA-0001 (scenes_list): open a list-picker of scenes
  // that target this light entity. Mirrors `effects_list`. Scene discovery
  // intersects every `scene.*` entity's `entity_id` attribute with the
  // target light's children (when the light is itself a group) or with
  // `[entity]` (when leaf). Tap-to-fire calls `scene.turn_on`. Designed
  // for Hue users who favourite scenes in the Hue app and want those
  // scenes one-tap reachable from this card. Config knob:
  // `scenes_picker.scenes` for an explicit override list.
  | 'scenes_list';

export interface GestureMapping {
  tap?: GestureAction;
  long_press?: GestureAction;
  double_tap?: GestureAction;
}

/**
 * Stefan-2026-05-10 P15.6-r48 (R208): manual_members is `Member[]` — each
 * entry can be either a bare entity-id string (legacy flat-group form) OR
 * an object containing the entity-id PLUS its own per-member overrides
 * (nested-group form). When the nested form's `entity` resolves to a
 * group itself, the parent card recursively renders an embedded
 * `<everyday-light-card>` for that member instead of the usual slider
 * tile. Each level honors its own group / parallel_sliders / saved_colors
 * config independently. Backwards-compat: bare strings continue working.
 *
 * Example:
 *   manual_members:
 *     - light.bath                    # legacy bare string
 *     - entity: light.kitchen         # nested object form
 *       group:
 *         layout: compact
 *         expansion_mode: popup
 */
export type ManualMember =
  | string
  | (Partial<EverydayLightCardConfig> & { entity: string });

export interface GroupConfig {
  // If null/undefined: card auto-detects whether `entity` is itself a group.
  // If set: explicitly tells the card which entities are members.
  // Stefan-2026-05-10 P15.6-r48 (R208): expanded from `string[]` to
  // `ManualMember[]` for nested-group support — each entry can be a bare
  // entity-id (legacy) OR an object with the entity plus per-member
  // overrides (group config, parallel_sliders, etc.).
  manual_members?: ManualMember[];
  // 'expanded' shows N sliders side-by-side (R2). 'compact' shows 1 slider + group icon (R10).
  layout?: 'expanded' | 'compact' | 'auto';
  // Enable mindmap-path between member icons + group icon.
  mindmap?: boolean;
  // Group-on restore strategy: 'scene_snapshot' uses scene.create + scene.turn_on,
  // 'last_state' relies on HA's built-in last-state restoration (no helper).
  restore_strategy?: 'scene_snapshot' | 'last_state';
  // Where the group ("main light") icon sits in both compact and expanded views.
  //   'bottom' (default): sliders/tiles on top, group icon at the bottom -
  //     matches the original P5 design. The group icon's screen-Y shifts
  //     downward when the compact view expands (because expanded has more
  //     content above the group).
  //   'top': group icon on top, sliders/tiles below - anchors the group
  //     icon's screen-Y across the compact ↔ expanded transition. Stefan
  //     tagged this "falsch herum" so it's opt-in.
  icon_position?: 'top' | 'bottom';
  // Render the colored dots/halo around member + group icons via the
  // mindmap-path SVG. Smart default per icon_position when unset:
  //   'top'    → false (the HTML icon-tiles already carry the state visual)
  //   'bottom' → true  (matches the original P5 design - colored rings around
  //                     each tile + halo under the group icon)
  mindmap_dots?: boolean;

  /**
   * Member-slider length in the topology-popup view (Stefan-2026-05-09 R24).
   *   false (default): "slider-length-accounts-for-mindmap-and-is-therefore-shorter"
   *     — member sliders are 170 px (the original inline-expand height) so
   *     the mindmap-baum has room to render between tile-rows.
   *   true:  "full-length-expanded-slider" — member sliders match the host
   *     compact-slider height (260 px). The mindmap-baum still renders but
   *     with a tighter aspect ratio.
   */
  full_length_sliders?: boolean;

  /**
   * Expansion behaviour when the user picks Mindmap from the compact-group
   * picker (Stefan-2026-05-10 R131). Two modes:
   *   'inline' (default): the compact card transforms in-place into the
   *     N-slider topology view. Sibling cards in the dashboard reflow,
   *     animations are smoother, and the expanded state is persistable.
   *   'popup': the topology view mounts in a body-portal popup overlay.
   *     The compact card stays compact underneath. Was the original
   *     P43-R21 behaviour; kept as opt-in for users who prefer it.
   */
  expansion_mode?: 'inline' | 'popup';

  /**
   * Stefan-2026-05-11 P15.6-r63d (R300c / PA-0031): "card stays the same
   * height on expansion, group icon stays at the same vertical offset
   * from card-top".
   *
   * Default `false` (current behaviour): when a compact card expands via
   * the Mindmap picker option, the topology-tree pushes the group icon
   * down — card grows taller. Icon's Y-from-top shifts.
   *
   * `true`: when `compact:true` AND the card is in its expanded
   * state, the expanded member-sliders shrink so the topology-tree fits
   * within the same total card-height as the compact view. The
   * group-icon Y-from-top stays constant — the card visually "expands
   * in place" without reflowing siblings.
   *
   * This is what Stefan originally MEANT by `full_length_sliders=false`
   * — but that field's actual semantics evolved to control only the
   * popup/expanded slider's pixel height, not the expansion-icon-Y
   * relationship. `expand_in_place` is the right knob for that
   * intent; `full_length_sliders` keeps its existing meaning.
   *
   * Caveat: shrinks the member sliders. If the topology has many
   * members or deep nesting, expanded sliders may end up uncomfortably
   * short. In that case set `slider.height` explicitly to override the
   * derived height.
   */
  expand_in_place?: boolean;

  /**
   * Stefan-2026-05-12 PA-0002 (R2a): persist the inline-expanded state of
   * compact groups across page navigation + reloads. Default `false`
   * (legacy behaviour — tap outside the card collapses the expansion;
   * state is per-session only).
   *
   * When `true`:
   *   - The current `_compactExpanded` state is mirrored to localStorage
   *     under key `everyday-light-card:expanded:${groupEntityId}`.
   *   - On mount the card reads the persisted state and restores it.
   *   - Tap-outside no longer collapses the card; the user must
   *     explicitly fold via the long-press mode-picker → "Collapse" slot
   *     (added automatically when sticky AND inline-expanded).
   *
   * Stefan-Quote: "lets make it so, that the expansion state is
   * remembered. that is better. Pople can choose to for a node ... if
   * it should be collapsed automatically or not. If it is not the mode
   * picker needs to have an option to collapse the node."
   *
   * Scope: per-card. Nested cards each carry their own `expansion_sticky`
   * setting and their own localStorage row keyed by the nested group's
   * entity id, so sub-trees can be sticky independently of the parent.
   */
  expansion_sticky?: boolean;
}

export interface SavedColorsConfig {
  // 'ha_favorites' = HA's built-in favorite_colors entity-registry option (Phase 7 research).
  // 'helper:input_text.<id>' = custom JSON list in a helper.
  // 'static' = list in YAML.
  source?: 'ha_favorites' | `helper:${string}` | 'static';
  static?: Array<[number, number, number]>; // RGB triples
  // Keep popup open after picking a color (default true). When false, popup
  // closes after the first pick.
  persistent?: boolean;
}

/**
 * Effects-list-picker config (Phase 38.1 / P12 follow-up).
 *
 * Source semantics match SavedColorsConfig:
 *   - undefined → in-memory only (lost on reload)
 *   - 'helper:input_text.<id>' → JSON `{ activeOrder: [string, ...] }` in the
 *     helper. Read on every hass push, write on user mutation. Helper's
 *     `max` attribute should be ≥ 255 for typical effect-lists.
 *
 * Stefan-2026-05-11 P15.6-r63a (R288 / PA-0021): edit-mode default flipped
 * to `true` — reverts the R230 (r49) opt-in default. Long-press on an
 * active effect-row now enters edit-mode out of the box; long-press on the
 * editable row in edit-mode deletes it; tap on a grayed row in edit-mode
 * restores it. Card config can still set `editable: false` explicitly to
 * suppress the edit-mode path. Persistence still requires `source` (helper
 * or — via R296-C — the HA user_data fallback when source is unset).
 *
 * Stefan-2026-05-12 PA-0002 (R1): `in_picker` controls whether the effects
 * slot appears in the long-press mode-picker. Default `false`. Pre-PA-0002
 * the slot was auto-added whenever the entity reported a non-empty
 * `effect_list` — most modern color bulbs do, so every light card showed
 * an effects diamond by default. Stefan-Quote: "by default the effects-
 * list should be disabled in the mode-picker". Set `effects_picker.in_picker:
 * true` to bring it back per-card. Affects member, group-compact,
 * group-expanded and parallel-inline picker variants uniformly.
 */
export interface EffectsPickerConfig {
  source?: `helper:${string}`;
  editable?: boolean;
  in_picker?: boolean;
}

/**
 * Scenes-list-picker config (Stefan-2026-05-16 PA-0001, edit-mode wired
 * in PA-0005).
 *
 * Mirrors `EffectsPickerConfig` shape, targets the `scene.*` domain.
 * Hue users favourite scenes in the Hue app — those scenes appear as
 * `scene.<name>` entities in HA. The card auto-discovers relevant
 * scenes via two paths (unioned): entity_id-attribute intersection
 * (HA-native + light_group scenes), and Hue `group_name` match (Hue-
 * bridge scenes which don't populate `entity_id`).
 *
 * Config knobs:
 *   `scenes` — explicit list of `scene.*` entity ids. When set, replaces
 *     auto-discovery entirely. Use when auto-discovery surfaces unwanted
 *     scenes (e.g. global "all lights" scenes that touch every bulb)
 *     or when the user wants a curated short-list per card.
 *   `source` — `helper:input_text.<id>` for persistence of the curated
 *     active-order across reloads. JSON payload
 *     `{ activeOrder: [sceneId, ...] }`. Without a source, edits live
 *     in-memory and are lost on refresh.
 *   `transition` — seconds passed to `scene.turn_on`. Default 0.4 to
 *     roughly match the Hue-app feel.
 *   `name_strip_prefix` — when true (default), strip the light's
 *     friendly_name prefix from scene names so "Wohnzimmer Konzentriert"
 *     renders as "Konzentriert". Set false to keep the full name.
 *   `editable` — long-press an active scene-row to enter edit mode
 *     (hide / restore scenes from the discovered list). Default true.
 *     Mirrors `effects_picker.editable`. Set false for a strict pick-
 *     only surface (e.g. a guest tablet).
 *   `in_picker` — reserved for the future mode-picker slot. Not wired
 *     yet; trigger the action via `gestures.*.double_tap: scenes_list`.
 */
export interface ScenesPickerConfig {
  scenes?: string[];
  source?: `helper:${string}`;
  transition?: number;
  name_strip_prefix?: boolean;
  editable?: boolean;
  in_picker?: boolean;
}

/**
 * Parallel-sliders pop-up config. Stefan-2026-05-09 P43 R20: when the user
 * picks the "Parallel" option in the member-icon long-press picker, a
 * pop-up opens with N sliders side-by-side for the same entity, one per
 * axis the user wants to control. Default is the full quartet (brightness
 * + temperature + hue + saturation). Subset configurable.
 */
export interface ParallelSlidersConfig {
  /** Modes to render side-by-side. Order in array drives left-to-right
   *  order in the popup. Default `['brightness', 'temperature', 'hue', 'saturation']`. */
  modes?: Array<'brightness' | 'temperature' | 'hue' | 'saturation'>;
  /** Stefan-2026-05-09 P47 R31b — show the per-slider mode label
   *  ("Hue" / "Saturation" / etc.) above each slider. Default true.
   *  When false the parallel sliders look like a row of bare sliders. */
  show_labels?: boolean;
  /** Stefan-2026-05-10 P15.6-r29 (R180) — match the parallel sliders to
   *  the compact-group `full_length_sliders` semantics:
   *    `false` (default): sliders 220 px tall — same as expanded-group
   *      with `full_length_sliders: false`. Visually balanced when the
   *      parallel-inline card sits in a row alongside other Everyday cards.
   *    `true`: sliders 260 px tall — same as compact + full_length:true.
   *      Use when the card stands alone or needs maximum visual weight.
   *  When `slider.height` is also set, it wins (explicit override). */
  full_length?: boolean;
  /**
   * Stefan-2026-05-12 R327 (PA-0008): visual variant for the parallel-inline
   * card.
   *   'expanded' (default): full layout with `.parallel-mindmap-area` SVG
   *     (curve arms + groupDot + orbiting icon overlay) above the sliders.
   *     Use when the parallel card stands alone as a primary entity tile.
   *   'compact': drops the mindmap SVG + the orbiting icon. Renders a
   *     minimal vertical stack: icon → slider-row → caption. Use when
   *     embedded inside a larger group's topology (parent already provides
   *     the surrounding mindmap-arms structure).
   * Stefan-Quote PA-0008: configured as `parallel_sliders: { layout: compact,
   * modes: [brightness, temperature] }` for `light.hall_boxes_2`.
   */
  layout?: 'expanded' | 'compact';
}

export interface ColorWheelConfig {
  type?: 'stepped' | 'smooth' | 'both'; // Stefan-Decision (A6): both should be option
  hue_segments?: number; // for stepped, default 21
  saturation_rings?: number; // for stepped, default 6
  // Keep popup open after picking a color (default true). When false, the
  // popup auto-closes after the first pick - 1-shot mode for users who
  // prefer minimal UI persistence.
  persistent?: boolean;
}

export interface SliderConfig {
  // px overrides for the vertical-pill-slider's --pill-width / --pill-height.
  // Defaults inside group-layout-expanded: 47×170 (matches the design-mock).
  // Defaults outside the group view (single-light card): 60×220.
  width?: number;
  height?: number;
  // When false (default): a member's transient slider mode (temperature/hue/
  // saturation) reverts to 'brightness' the next time the light goes off,
  // so the user always sees the brightness slider on re-activation.
  // When true: the mode persists across off → on transitions.
  persistent_mode?: boolean;
  // Slider orientation. Default 'vertical' (the design-mock pill, tall and
  // narrow). 'horizontal' swaps the dimensions so the pill lies flat — the
  // natural shape for media-player volume controls (Stefan-2026-05-09).
  orientation?: 'vertical' | 'horizontal';
  // Visual style variant. 'pill' (default) is the original full-width pill
  // with gradient track. 'mixer' is the DJ-mixer-fader look — thin centred
  // track + portrait rectangular thumb. Currently only meaningful in
  // horizontal orientation.
  style?: 'pill' | 'mixer';
  // When `style: 'mixer'` AND domain is media_player.*, render the row
  // layout `[name | slider | − | +]` with media_player.volume_down/up
  // buttons (Stefan-2026-05-09: matches the existing my-slider-v2 layout).
  show_buttons?: boolean;
}

export interface EverydayLightCardConfig extends LovelaceCardConfig {
  type: 'custom:everyday-light-card';
  // Single light entity OR media_player entity. The card auto-detects domain
  // (light.* → brightness/temp/hue/sat sliders, media_player.* → volume
  // slider) and selects sensible defaults. Group-detection only applies to
  // light entities.
  entity: string;

  // Default mode of the slider. Domain-aware default if unset:
  //   light.*        → 'brightness'
  //   media_player.* → 'volume'
  mode?: 'brightness' | 'temperature' | 'volume';

  /**
   * Stefan-2026-05-09 P47 R31d — top-level view mode driving the card's
   * primary render path:
   *   'collapsed' (default) — single slider + group-icon (current behaviour).
   *   'parallel'  — N parallel sliders inline (no popup). Modes / labels
   *                 driven by `parallel_sliders` config. Single-entity card
   *                 replaces its single slider with the parallel row;
   *                 group-context (compact) replaces the compact slider
   *                 with the parallel row.
   *   'effects-picker' — Stefan-2026-05-09 P38.1: render JUST the effects-
   *                 list-picker for the entity. No slider, no icon — the
   *                 card becomes a dedicated effects-pick tile. Source of
   *                 effects = `light.attributes.effect_list`. Active /
   *                 deleted ordering kept in @state for MVP (lost on reload);
   *                 input_text-helper persistence deferred to P38.2.
   *   'color-wheel' — Stefan-2026-05-12 P15.6-r64 (PA-0014 R3): render JUST
   *                 the color wheel for the entity. No slider, no icon, no
   *                 mindmap. Wheel geometry from `color_wheel.hue_segments` /
   *                 `color_wheel.saturation_rings` / `color_wheel.type`;
   *                 defaults 6 rings x 21 hues stepped. Tap a segment to
   *                 `light.turn_on` with `rgb_color`. Useful as a dedicated
   *                 wall-tile picker.
   *   'saved-colors' — Stefan-2026-05-12 P15.6-r64 (PA-0014 R3): render JUST
   *                 the saved-colors palette tile. No slider, no icon, no
   *                 wheel. Tap a swatch → `light.turn_on` with `rgb_color`.
   *                 Long-press a swatch (when `saved_colors.editable !==
   *                 false`) enters edit-mode; long-press a non-saved cell
   *                 saves the current entity color. Persistence reuses the
   *                 standard `saved_colors.source` / HA user_data fallback.
   * Stefan-decision-2026-05-09: "Es soll auch eine 'per default paralell'
   * sliders geben (das ist dann wieder ohne popup gelöst)" — so this is the
   * non-popup render path; the parallel-popup is only for picker-triggered
   * one-shot use.
   */
  default_view_mode?:
    | 'collapsed'
    | 'parallel'
    | 'effects-picker'
    | 'color-wheel'
    | 'saved-colors';

  // Group features (Phase 5 expansion).
  group?: GroupConfig;

  // Slider sizing override (Phase 7 polish).
  slider?: SliderConfig;

  // Gesture mappings - Phase 8 makes runtime-editable (A8).
  // `long_press_ms` controls the press-drag-select gesture timer.
  // Default 200 ms (was 500 in P6; Stefan's tuning at the demo review).
  gestures?: {
    long_press_ms?: number;
    member_icon?: GestureMapping;
    group_icon?: GestureMapping;
  };

  // Saved colors (Phase 7).
  saved_colors?: SavedColorsConfig;

  // Color wheel (Phase 6).
  color_wheel?: ColorWheelConfig;

  /**
   * Stefan-2026-05-10 P15.6-r48 (R229): cycle-mode config — pick which
   * slider modes the cycle action steps through. Default behaviour is
   * driven by the entity's `color_mode` attribute (color_temp lights:
   * brightness ↔ temperature; color lights: brightness → hue →
   * saturation → brightness). Set `cycle.modes` to override with an
   * explicit ordered list — useful for users who want a fixed cycle
   * regardless of HA's reported color_mode (e.g. always rotate
   * brightness → hue → saturation → temperature → brightness on a
   * color-temp + color light). Also useful for skipping modes you
   * don't care about.
   *
   * Example:
   *   cycle:
   *     modes: [brightness, hue, saturation]
   */
  cycle?: {
    modes?: Array<'brightness' | 'temperature' | 'hue' | 'saturation'>;
  };

  // Parallel-sliders pop-up (Phase 43 / Stefan-2026-05-09 R20). Member-icon
  // long-press → 'Parallel' option opens a side-by-side multi-slider popup.
  parallel_sliders?: ParallelSlidersConfig;

  // Effects-list-picker source (P38.1 / P12). Set
  // `effects_picker.source: 'helper:input_text.<id>'` to persist the
  // user's curated active-order across reloads. Without it, curation is
  // in-memory only.
  effects_picker?: EffectsPickerConfig;

  // Scenes-list-picker (Stefan-2026-05-16 PA-0001). Drives the
  // `scenes_list` gesture action — opens a popup with Hue/HA scenes that
  // target this light. Without `scenes_picker` the card auto-discovers
  // scenes by intersecting `scene.*` entity_id attributes with the
  // target light's children. Provide `scenes_picker.scenes` to override
  // with an explicit list.
  scenes_picker?: ScenesPickerConfig;

  // Optional R-v5-4: Stefan-Decision 2026-05-07 - mode 'classic' triggers HA-native more-info dialog
  // for users who prefer the standard HA light card UI in a popup.
  classic_mode?: {
    // If true, single-tap on member icon opens HA's standard more-info dialog.
    enable?: boolean;
    // Override the normal R1 (no toggle) - useful for users who want classic behavior.
    use_for_tap?: boolean;
  };

  // Display name override (defaults to friendly_name from HA).
  name?: string;
  icon?: string;

  /**
   * Stefan-2026-05-11 P15.6-r63d (R298 / PA-0031): icon color strategy.
   *
   * Default `undefined` → no inline color; CSS theming applies (themed
   * gold via `var(--paper-item-icon-active-color, --state-light-active-
   * color, #f88d2a)` when on; baseline gray when off). Matches every
   * other icon on the dashboard, so the card visually fits in.
   *
   * `'on-state'` → inline color reflects the entity's current state.
   * For light entities: RGB from `attributes.rgb_color`, opacity
   * modulated by `attributes.brightness` (0.4-1.0). Off → no inline
   * color (falls back to CSS baseline gray).
   *
   * Any other string → used as a literal CSS color value (e.g.
   * `"#ff0000"`, `"rebeccapurple"`, `"var(--my-color)"`). Wins
   * regardless of on/off state — drops directly into the inline
   * `color:` property on the icon element. Useful for theme-bound
   * styling where the user wants a fixed accent regardless of state.
   *
   * Stefan-2026-05-11: r63c shipped `'on-state'` as default which made
   * the single-light icon stick out vs the rest of the dashboard. This
   * field re-establishes "themed gold like the others" as the default
   * and turns the entity-RGB behavior into an opt-in. Applies to:
   *   - `.single-icon` in single-light vertical + horizontal renders
   *   - `.parallel-mindmap-icon` in parallel-inline render
   * The group-icon and member-icons in the expanded group view still
   * use their tile-state CSS for now (R298 regression was localized to
   * single-light + parallel paths only).
   *
   * Example:
   *   type: custom:everyday-light-card
   *   entity: light.hall_spot_1
   *   icon_color: on-state        # icon reflects entity RGB
   *
   *   icon_color: "var(--accent-color)"  # icon always uses theme accent
   */
  icon_color?: 'on-state' | string;

  /**
   * Stefan-2026-05-10 P15.6-r48 (R208): nested-group rendering. When set
   * by the parent card on its child instance, the embedded card skips the
   * outer <ha-card> chrome (no rounded background, no shadow) so it
   * blends visually as a member tile inside the parent's grid. Users
   * shouldn't set this directly in YAML — it's wired internally during
   * recursive render. Default false.
   */
  embedded?: boolean;

  /**
   * Stefan-2026-05-12 P15.6-r63l (R315 / PA-0043): control parent-node
   * visibility on expanded-group renders.
   *   'show' (default) — parent group-row with icon + label renders normally
   *   'hide' — skip the parent-row entirely. Only member sliders render.
   *
   * Used together with `show_icons: false` + `show_mindmap: false` to get
   * a clean "row-of-sliders" layout. Stefan-Quote PA-0043 Req C:
   * "there should also be an option to disable ... the parent ( so that
   * only the sliders show up besides each other".
   */
  parent_node?: 'show' | 'hide';

  /**
   * Stefan-2026-05-12 P15.6-r63l (R316 / PA-0043): control member-icon AND
   * parent-icon visibility. Default `true` (icons visible). Set `false` to
   * hide ALL icons on the card (members + parent). The label text under
   * each slider stays. Stefan-Quote PA-0043 Req C: "to disable the icons
   * completely".
   */
  show_icons?: boolean;

  /**
   * Stefan-2026-05-12 P15.6-r63l (R317 / PA-0043): control mindmap-path
   * SVG visibility (the curved arms + dots between members and parent).
   * Default `true` (mindmap visible). Set `false` to hide the SVG entirely.
   * Independent of `show_icons` — you can hide the mindmap but keep icons.
   * Stefan-Quote PA-0043 Req C: "to disable the mindmap".
   */
  show_mindmap?: boolean;
}
