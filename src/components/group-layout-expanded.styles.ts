/**
 * group-layout-expanded.styles.ts — extracted static styles.
 *
 * Stefan-2026-05-10 P15-Phase-2 r33a: 361 LOC of CSS moved out of
 * `group-layout-expanded.ts` into this dedicated module. Pure
 * `css\`...\`` template — no class-state references, safe to extract
 * without behavior change. The host component now imports and assigns
 * via `static styles = GROUP_LAYOUT_EXPANDED_STYLES;`.
 *
 * Why this is the FIRST extraction in P15-Phase-2 (vs sub-components):
 *   - Lowest risk: zero functional code touched.
 *   - Highest LOC reduction: 361 lines out for ~20 lines added (import
 *     + reassignment).
 *   - Establishes the pattern: future component-level extractions
 *     (member-tile.ts, group-tile.ts) can co-locate their styles
 *     alongside their templates without disturbing the master CSS file.
 *
 * Keep this file in sync with the popup-portal-styles.ts shared block
 * (which mirrors several of these rules for body-portal-rendered popups).
 * When you change a `.tile`, `.member-cols`, `.topology` rule here,
 * verify the matching rule in popup-portal-styles.ts so the popup-
 * rendered topology stays visually identical to the inline render.
 */

import { css, type CSSResult } from 'lit';

export const GROUP_LAYOUT_EXPANDED_STYLES: CSSResult = css`
    :host {
      display: block;
      /* Stefan-2026-05-11 P15.6-r63d (R300a / PA-0031): bumped default
         from 47 → 60 px so compact-group sliders (60 px) and expanded
         group-member sliders match in width. Stefan: "B width should
         be 60px as well" — option B (expanded follows compact). The
         per-N responsiveSliderWidth shrink in group-layout-expanded.ts
         starts from this base (60) and clamps down to a 40 px floor
         for very-many-leaves groups (apartment view's 14 leaves). */
      --everyday-slider-width: 60px;
      --everyday-slider-height: 170px;
      /* Default outer-shadow direction: positive Y (cast downward). The
         'bottom' iconPosition override below flips them so the slider
         shadow casts UPWARD - reads as if light comes from the group icon
         below (Stefan 2026-05-08-night). */
      --everyday-slider-shadow-y1: 4px;
      --everyday-slider-shadow-y2: 14px;
    }
    /* Stefan-2026-05-11 R235-237: when embedded inside a parent layout
       (nested-group member-tile), reset the standalone host defaults so
       the embedded card inherits the parent's slider sizing context.
       Matches the slider heights of sibling member-cols (220 px or
       whatever the parent's full_length_sliders resolved to).
       'unset' on a custom property falls back to the inherited value
       which here is the parent layout's .layout style attribute. */
    :host([embedded]) {
      --everyday-slider-width: unset;
      --everyday-slider-height: unset;
    }
    /* Stefan-2026-05-11 P15.6-r63a (R292 / PA-0019): depth-scaled
       --member-cols-gap so intra-group siblings (deep) sit tighter
       than inter-group boundaries (shallow). Stefan PA-14 spec: gap
       between intra-group sibs MUST be strictly less than between
       cross-group sibs. Defaults: depth 0 (outermost) = 28 px, depth
       1 = 14 px, depth 2 = 8 px, depth 3+ inherits via the fallback
       4 px. Plumbed via the depth property on the host card chain
       (everyday-light-card.depth -> group-layout-expanded.depth via
       attribute reflection).

       Stefan-2026-05-12 P15.6 R299 (PA-0041): these rules are now the
       PRE-MEASUREMENT FALLBACK only. group-layout-expanded.ts measures
       its .member-cols clientWidth via ResizeObserver, runs the
       computeMemberColsGap helper, and writes the result as an inline
       --member-cols-gap on .layout (which overrides this cascade for
       descendants). Until the first RO callback fires (one frame
       after firstUpdated), the :host([depth=N]) values below keep the
       initial paint visually identical to pre-R299 — no FOUC. The
       dynamic values track the same depth ratios (28:14:8:4:2) scaled
       by container width. */
    :host([depth='0']) { --member-cols-gap: 28px; }
    :host([depth='1']) { --member-cols-gap: 14px; }
    :host([depth='2']) { --member-cols-gap: 8px; }
    :host([depth='3']),
    :host([depth='4']),
    :host([depth='5']) { --member-cols-gap: 4px; }
    /* Also remove the compact-slider's standalone 260 px override when
       embedded — the embedded compact card lives in a member-col and
       must match the sibling expanded-member sliders, not the
       standalone-compact 260 px.
       Stefan-2026-05-11 R280 (PA-13 follow-up): also unset the R274
       standalone-compact width override (60 px). Embedded compact
       sliders must inherit the parent's --everyday-slider-width (24 px
       in the apartment view) so all leaf sliders are visually uniform.
       Pre-R280, hall_spots + kitchen_ceiling rendered at 60 px while
       sibling leaves were 24 px — visible width-mismatch Stefan would
       have flagged on next review. */
    :host([embedded]) .layout.compact .compact-slider-el {
      --everyday-slider-height: unset;
      --everyday-slider-width: unset;
    }
    /* Stefan-2026-05-11 R237: the decorative compact-mindmap-arm (the
       short SVG hint below the compact-slider) is redundant when
       embedded — the parent layout already draws a mindmap arm leading
       to this tile. Hiding it removes the extra vertical box that was
       making the embedded compact card taller than its siblings. */
    :host([embedded]) .layout.compact .compact-mindmap-arm {
      display: none;
    }
    /* Stefan-2026-05-11 R237: when embedded, the .layout's reserved
       min-height (380 px standalone default) makes the embedded card
       way taller than sibling member-cols. Drop the min-height so the
       layout shrinks to its content + matches sibling height. */
    :host([embedded]) .layout {
      min-height: 0;
      padding: 0;
      gap: 8px;
    }
    /* Stefan-2026-05-11 R240: defensive — make sure the embedded
       group-tile sits above any overlapping outer-mindmap SVG arms
       and receives pointer events. The outer mindmap-path SVG has
       pointer-events: none in normal flow, but with the new larger
       member-radii from r51 the dots can visually overlap the
       embedded card's group-tile area. This rule makes the embedded
       group-tile explicitly interactive so long-press → mode-picker
       fires reliably. */
    :host([embedded]) .tile.group {
      pointer-events: auto;
      position: relative;
      z-index: 5;
    }
    /* Stefan-2026-05-11 R241/R242: when embedded with icon_position='top',
       the embedded group-row sits at the TOP of the embedded card so
       it aligns with the outer's memberY (where the outer mindmap arm
       terminates). Reduce the topology gap so the group-icon doesn't
       float visually distant from its members below. */
    :host([embedded][icon-position='top']) .topology {
      gap: 12px;
    }
    /* Shadow direction flip when group icon sits at the bottom. Stefan's
       visual narrative: the group icon = light source, so sliders cast
       their shadow AWAY from the group. */
    :host([icon-position='bottom']) {
      --everyday-slider-shadow-y1: -4px;
      --everyday-slider-shadow-y2: -14px;
    }
    .layout {
      display: flex;
      flex-direction: column;
      gap: 14px;
      /* Stefan-2026-05-11 P15.6-r63e (R303 / PA-0032): padding parity with
         .layout.compact (was 16 px). Stefan-Quote: ".layout.compact and
         .layout must have the same amount of padding (24px)!!". Pre-r63e
         the bottom edge was 20 px (asymmetric for the legacy mindmap-arm
         clearance); r63e drops the asymmetry. */
      padding: 24px;
    }
    /* Stefan-2026-05-09 P42 R16 — group-icon-anchor stability across
       compact ↔ expanded transitions for the DEFAULT 'bottom' icon-position.
       Root cause of the recurring bug: with default flex-column flow, the
       card grows DOWNWARD when content (member-cols + topology-gap) is
       added on expand, so the bottom-anchored host icon shifts to a new
       viewport-y. A previous fix (P32 2026-05-08) only addressed this for
       icon-position='top' by reordering the topology — the default 'bottom'
       was never repaired.
       GAP-CLOSURE: introduce a SHARED min-height (--everyday-card-min-height)
       that BOTH compact AND expanded modes consume. Compact mode reserves
       empty space at the top; expanded mode fills it with content. The
       host icon stays at the same viewport-y regardless of mode.
       Default 380 px is enough for 3 members in expanded view. Override per
       card via CSS var. The justify-content flex-end pins content to
       the bottom of the reserved space so the host stays anchored. */
    :host([icon-position='bottom']) .layout,
    .layout {
      min-height: var(--everyday-card-min-height, 380px);
      justify-content: flex-end;
    }
    :host([icon-position='top']) .layout {
      /* 'top' anchors host at top instead — shared min-height still applies
         so compact↔expanded transitions don't shrink the card. */
      justify-content: flex-start;
    }
    /* Stefan-2026-05-11 R274 (PA-13 Issue 5): standalone compact view
       must visually match single-light — single-light has NO min-height
       reservation, it sizes to content (slider + caption). Drop the 380 px
       reservation here. The cross-mode (compact↔expanded) icon-Y stability
       documented in P42 R16 no longer applies because compact-mode now
       collapses to a single-light-equivalent tile. Embedded compact already
       has min-height: 0 via the :host([embedded]) rule above.
       Stefan-2026-05-11 P15.6-r63e (R303 / PA-0032): bumped padding 16 →
       24 px to match .layout (which is also 24 px in r63e). Stefan-Quote:
       ".layout.compact and .layout must have the same amount of padding
       (24px)!!". */
    .layout.compact {
      min-height: 0;
      justify-content: flex-start;
      padding: 24px;
    }
    /* Compact view: single group slider + group tile, no member rows.
       Stefan-2026-05-11 R274 (PA-13 Issue 5): compact view MUST visually
       match a single-light tile. Single-light layout =
       .container.vertical with gap 12 + padding 16, slider on top, then
       .caption block with [single-icon, name, state]. Mirror those values
       so a "group.layout: compact" config and the equivalent single-light
       config render identically. */
    .layout.compact {
      align-items: center;
      gap: 12px;
      position: relative;
    }
    .layout.compact .compact-slider {
      display: flex;
      justify-content: center;
    }
    .layout.compact .tile.group.compact-target {
      position: relative;
      z-index: 1;
      /* Stefan-2026-05-12 P15.6-r63i (R310): R274's 2 px gap reverted to
         the default .tile { gap: 4px } now that the compact-state-line is
         removed. icon + name with 4 px between them matches the single-
         light caption sans-state-line. */
    }
    /* Stefan-2026-05-11 R274 (PA-13 Issue 5): compact-slider sizing now
       MATCHES the single-light slider. Single-light uses 60 × 220 px
       (from the vertical-pill-slider :host fallbacks). The earlier
       260 px compact-tall override created a visual mismatch Stefan
       wants gone. Embedded compact cards still inherit unset from
       the :host([embedded]) rule above, so nested-compact members
       follow the parent layout's sizing. */
    .layout.compact .compact-slider-el {
      --everyday-slider-width: 60px;
      --everyday-slider-height: 220px;
    }
    /* Stefan-2026-05-09 P45 R25: when the topology-popup is open, hide the
       compact slider so the popup at the same screen position visually
       replaces it. Visibility (not display:none) keeps the layout slot
       reserved — no reflow when the popup mounts/unmounts. */
    .compact-slider.popup-hidden {
      visibility: hidden;
    }
    /* Stefan-2026-05-10 R150: compact-glyph is now a ha-icon (was
       inline SVG). ha-icon sizes via --mdc-icon-size CSS var, so the
       explicit width/height becomes a sizing-hint AND a guaranteed
       click area. */
    .compact-glyph {
      --mdc-icon-size: 32px;
      width: 32px;
      height: 32px;
    }
    .placeholder {
      padding: 24px;
      color: var(--secondary-text-color);
    }
    /* Member columns: N grid columns, each holds [slider on top, tile on
       bottom]. This is the post-2026-05-08-evening layout that puts the
       slider directly above its tile (Stefan: "die slider auf dem Kopf"
       feedback on the prior layout where sliders were below tiles). */
    .member-cols {
      display: grid;
      /* Stefan-2026-05-11 R253: weighted columns when nested members have
         varying subtree-depths. --member-cols-template defaults to
         repeat(N, 1fr) for the equal-columns case but is overridden by
         the host to fr-weighted values when leaf-counts differ. */
      grid-template-columns: var(--member-cols-template, repeat(var(--member-count, 1), 1fr));
      /* Stefan-2026-05-11 P15.6-r63a R292 (PA-0019): depth-scaled gap.
         Honors --member-cols-gap set by the :host([depth='N']) rules
         below. Stefan-confirmed defaults: 28 px (depth 0 outer) -> 14 px
         (depth 1) -> 8 px (depth 2) -> 4 px (depth 3+). Intra-group sibs
         (deeper) get tighter gaps, inter-group boundaries (shallower)
         get wider ones — the visual rule from PA-14 R292. Pre-r63a was
         uniform 18 px regardless of depth (R270 revert from r62).
         Stefan-2026-05-12 P15.6 R299 (PA-0041): the variable is now
         dynamically overridden by the inline-style on .layout once
         ResizeObserver has measured the container. The
         :host([depth=N]) rules below seed the value for the first
         paint. */
      gap: var(--member-cols-gap, 18px);
      /* Stefan-2026-05-11 R271: stretch cols to fill the grid container
         width. Was justify-items center which kept cols at their
         content-width, centered in cells - visible as a big empty
         channel between Back's cluster and Main's cluster in the
         apartment view. With stretch + the weighted grid-template
         (8fr/6fr outer, 2fr/3fr/3fr Back-inner, etc.), every leaf col
         settles at ~1/14 of the outer card width - sliders evenly
         distributed across the full card with dynamic per-col empty
         space + the explicit 18 px col-gap. Slider stays 47 px and
         is horizontally centered inside its now wider col. Stefan
         PA-12: die slider sollen sich ueber die ganze breite der Karte
         verteilen. */
      justify-items: stretch;
      /* Stefan-2026-05-11 R262: align-items: start disables the grid's
         default stretch so each col sizes to its content height. Without
         stretch, shallow members (Main, 1-level deep) and deep members
         (Back, 2-3 levels deep) each occupy their intrinsic height in
         the row. All cols sit at row-top so their sliders are TOP-aligned,
         while their content-bottoms (and thus group-icons) sit at
         different Ys based on depth - matching Stefan's PA-09 wish
         "die höhe der dots für main und back muss unterschiedlich sein
         weil Main viel höher ist als Back". The mindmap dots track each
         icon-Y per-member via the memberYs[] prop. */
      align-items: start;
    }
    .member-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px; /* slider → tile spacing */
      /* Stefan-2026-05-11 R259: revert R258 flex-end + height:100%.
         R258 packed bare-member sliders to col-bottom which broke
         top-alignment with sibling sliders (Stefan PA-09: "hall boxes,
         door und kitchen counter sind nicht mehr top aligned"). Each col
         now sizes to its content (slider+tile for bare, embedded card
         for nested) and sits at row-top via .member-cols align-items:
         start. Mindmap dots align via per-member-Y (memberYs prop). */
      /* Stefan-2026-05-11 R276 (PA-13 Issue 1+2): grid items default to
         min-width: auto (= min-content of children). The slider's 47 px
         host width forced each leaf col to be at least 47 px wide, so
         the fr-distribution (8fr/6fr outer, 2fr/3fr/3fr inner, etc.)
         was overridden when the outer card was narrow. Resetting
         min-width:0 lets fr-shares win; the slider auto-shrinks via the
         R276 totalLeafCount-aware responsiveSliderWidth so leaf cols
         settle at uniform pitches across every group. */
      min-width: 0;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    /* Tile-icon dimensions match the mindmap-path dot radii so the long-press
       feedback (orange tint inside the .ic) sits at exactly DEFAULT_MEMBER_R
       on members and DEFAULT_GROUP_R on the group icon. Stefan-2026-05-09. */
    .tile .ic {
      width: 34px;  /* = 2 × DEFAULT_MEMBER_R (17) */
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      color: var(--secondary-text-color);
      transition: color 200ms ease, background 160ms ease;
    }
    /* Drop-shadow on the icon glyph itself - replaces the disc-background
       look with a free-floating icon. Applied to both ha-icon (member tiles
       in expanded) and the inline ceiling-light SVG (group tile in compact
       and expanded). */
    .tile .ic ha-icon,
    .tile .ic .compact-glyph {
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55));
    }
    /* Stefan-2026-05-11 P15.6-r63e (R304 / PA-0032): unified --active-color
       resolution chain across .single-icon (everyday-light-card.ts), .parallel-
       mindmap-icon (everyday-light-card.ts), and .tile .ic here. Pre-r63e
       this used --state-light-active-color directly without falling through
       --paper-item-icon-active-color first, so users setting the theme's
       --active-color via --paper-item-icon-active-color saw it applied on
       single-light cards but NOT on group + member icons. Stefan-Quote:
       "please can you make all icons behave the same? ... doesnt require
       many different implementaions to do one thing". */
    .tile.on .ic {
      color: var(--paper-item-icon-active-color, var(--state-light-active-color, #f88d2a));
    }
    /* Stefan-2026-05-12 P15.6-r63l (R316 / PA-0043): when the host card sets
       show_icons: false, the .topology gets .hide-icons class which hides
       every .ic + .compact-glyph inside it. Labels stay (Stefan-Quote: "to
       disable the icons completely"). Drops layout-space too so the tile
       shrinks to just the label height. */
    .topology.hide-icons .ic,
    .topology.hide-icons .compact-glyph {
      display: none;
    }
    .tile .lbl {
      font-size: 12px;
      color: var(--secondary-text-color);
      text-align: center;
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .tile.group {
      cursor: pointer;
      user-select: none;
      /* Stefan-2026-05-12 R326 (PA-0007 deep-dive): bind-target for both
         _bindExpandedGroupGestures + _bindCompactGestures. touch-action is
         determined by the browser at the FIRST pointerdown (W3C pointer-
         events-3 spec, frozen thereafter for the gesture's lifetime). R323's
         runtime scroll-lock acquired at the 200ms long-press timer fires too
         late — by then iOS Safari + Android Chromium have already committed
         to a scroll. Matches .tile.member at line 469. */
      touch-action: none;
    }
    .tile.group .ic {
      width: 46px;  /* = 2 × DEFAULT_GROUP_R (23) */
      height: 46px;
    }
    .tile.group:focus-visible .ic {
      outline: 2px solid var(--accent-color, #f88d2a);
      outline-offset: 2px;
    }
    /* Compact-collapsed group tile: matches the single-light
       .caption .single-icon circle exactly so a group.layout=compact config
       renders identically to a light.<member> single-light tile.
       Stefan-2026-05-11 R274 (PA-13 Issue 5). Pre-R274 had transparent
       bg + box-shadow (R142) which relied on the SVG groupDot underneath
       (now removed with the arm). Solid dark fill + gold border matches
       the mindmap-node visual identity Stefan picked for single-light
       in P47-fix R52. */
    .layout.compact .tile.group.compact-target .ic {
      --mdc-icon-size: 28px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: var(--mindmap-dot-fill, #3a3a52);
      border: 2.6px solid var(--mindmap-group-stroke, #f4b91d);
      box-sizing: border-box;
      box-shadow: none;
    }
    /* Drop the drop-shadow on the inner glyph for compact mode — the
       solid disc with gold border carries the visual weight; the
       drop-shadow was tuned for the floating-glyph look. */
    .layout.compact .tile.group.compact-target .ic .compact-glyph,
    .layout.compact .tile.group.compact-target .ic ha-icon {
      filter: none;
    }
    /* Topology stack: group-row (top) → curve traversal area → member-cols
       (bottom). Mindmap SVG is absolutely positioned behind everything; arms
       terminate at the TOP of each member column (= top of slider). */
    .topology {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 30px; /* group-row → member-cols, where the mindmap arms live */
    }
    .topology > .topology-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      aspect-ratio: auto;
      display: block;
      z-index: 0;
      pointer-events: none;
    }
    .topology > .group-row,
    .topology > .member-cols {
      position: relative;
      z-index: 2;
    }
    .group-row {
      display: flex;
      justify-content: center;
    }
    /* HA's <ha-icon> uses --mdc-icon-size for sizing. */
    ha-icon {
      --mdc-icon-size: 24px;
    }
    .tile.group ha-icon {
      --mdc-icon-size: 32px;
    }

    /* Long-press feedback: combine an inset orange tint with layered outer
       rings that bleed past the .ic boundary. Stefan-2026-05-09-late wants
       the glow to extend "etwas über DEFAULT_MEMBER_R rand hinaus" - the
       outer rings reach up to 9 px beyond the .ic edge (= radius 17 + 9 =
       26 for member, 23 + 9 = 32 for group). Same numbers work for both
       since the rings are absolute px, not radius-relative. */
    .tile.member.lp .ic,
    .tile.group.lp .ic {
      background: rgba(248, 141, 42, 0.20);
      box-shadow:
        inset 0 0 0 1px rgba(248, 141, 42, 0.50),
        0 0 0 4px rgba(248, 141, 42, 0.18),
        0 0 0 9px rgba(248, 141, 42, 0.08);
    }
    .tile.member {
      cursor: pointer;
      user-select: none;
      touch-action: none; /* let gesture-detector own pointer events */
    }
    /* The mode-picker overlay is positioned at the icon center; the picker
       component renders its three orbits absolutely from there. Top = 17 px
       matches the 34 × 34 member .ic centre. Group tile uses 23 px to match
       its 46 × 46 .ic. */
    .picker-overlay {
      position: absolute;
      top: 17px;
      left: 50%;
      width: 0;
      height: 0;
      pointer-events: none;
      z-index: 10;
    }
    .tile.group .picker-overlay {
      top: 23px;
    }
    /* Group tile is also a positioning context for its picker-overlay. */
    .tile.group {
      position: relative;
    }
    .picker-overlay > everyday-mode-picker {
      pointer-events: auto;
    }
    /* Tile is the picker's positioning context. */
    .tile.member {
      position: relative;
    }

    /* In-place popup for color-wheel + saved-colors. Fixed-position so it
       escapes any ancestor with overflow:hidden (HA cards default to clipped).
       Centered on the picker DOT (Stefan 2026-05-08: "Mitte vom color-wheel
       über dem color-wheel icon"). Bloom animation expands from center. */
    .inplace-popup {
      position: fixed;
      transform: translate(-50%, -50%) scale(1);
      transform-origin: center;
      background: var(--card-background-color, #1d1f3a);
      border-radius: 20px;
      padding: 14px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 99;
      animation: inplace-bloom 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) both;
    }
    @keyframes inplace-bloom {
      0% {
        transform: translate(-50%, -50%) scale(0.4);
        opacity: 0;
      }
      100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
    /* Stefan-2026-05-08-evening: the wheel popup should be just the wheel
       itself with a strong shadow - no rectangular card frame around it.
       Override the default .inplace-popup background/padding/box-shadow.
       The drop-shadow on the wheel SVG itself (in color-wheel.ts) carries
       the depth treatment. */
    .inplace-popup.wheel {
      width: 240px;
      background: transparent;
      padding: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .inplace-popup.saved {
      max-width: 280px;
    }

    /* Transient toast for the saved-colors stub etc. */
    .toast {
      position: absolute;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.78);
      color: #fff;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 12px;
      letter-spacing: 0.02em;
      animation: toast-in 180ms ease-out;
      pointer-events: none;
      z-index: 10;
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translate(-50%, 8px); }
      to   { opacity: 1; transform: translate(-50%, 0); }
    }
  `;
