/**
 * mindmap-path - Phase 4 deliverable.
 *
 * Pure-presentational SVG component that draws state-reactive curves between
 * a group node (bottom-center) and N member nodes (top-row). One cubic-Bézier
 * arm per member, originating at the group node and curving up into the member.
 *
 * Spec sources
 *   - CONCEPT.md R2 (state-reactive per-arm color/opacity)
 *   - PHASE-PLAN.md P4 (this is the deliverable)
 *   - assets/design-mocks/mindmap-geometries-n2-n8.html (canonical geometry)
 *   - PHASE-1-COMMENTS.md (Stefan-Verdict: only N=3 visually clean; N≥6 fallback)
 *
 * The component takes already-derived `MindmapMember` records (state, rgb,
 * brightness) instead of raw HassEntities so it can be unit-tested + reused
 * with mock data for the standalone test page. P5's group-layout-expanded
 * is the integration point that translates hass.states[...] → MindmapMember.
 *
 * Sizing model (responsive by default)
 *   ResizeObserver tracks the host element's actual rendered size and the
 *   SVG viewBox is set to "0 0 W H" in CSS pixels. That makes
 *   `preserveAspectRatio` irrelevant - the viewBox always matches the
 *   container, so circles stay circular and curves keep their natural
 *   shape regardless of the host's aspect ratio. Geometry positions
 *   (groupX/Y, memberY) are computed in pixel space.
 *
 *   Set `responsive=false` to lock fixed `view-width` / `view-height` /
 *   `group-x` / `group-y` / `member-y` attributes - useful when a caller
 *   wants pixel-exact reproducibility of the design-mock geometry.
 *
 * Geometry (verbatim from the design-mock's buildSvg)
 *   For each member at (memberX_i, memberY):
 *     dx           = memberX_i - groupX
 *     outwardPush  = |dx| * 0.35
 *     c1 = (groupX + dx*0.15 + sign(dx)*outwardPush*0.6, groupY - 0.35*verticalSpan)
 *     c2 = (memberX + sign(dx)*outwardPush*0.15,         memberY + 0.35*verticalSpan)
 *     path = "M groupX groupY  C c1  c2  memberX memberY"
 *
 * N-handling
 *   N = 0     no arms, no nodes - render an empty SVG so layout reservations stay stable.
 *   N = 1     one straight stem from group to member (the Bézier formula degenerates
 *             to a vertical line when memberX === groupX, which is the default).
 *   2..5      cubic-Bézier per design-mock formula (the "Triton-S-curve" Stefan greenlit at N=3).
 *   ≥ 6       comb fallback: short vertical drops from each member into a horizontal connector,
 *             single trunk down to the group. Reduces the "wirr"-ness Stefan flagged in PHASE-1-COMMENTS for high N.
 */

import { LitElement, html, svg, css, type CSSResult, type SVGTemplateResult, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface MindmapMember {
  // Match HA-state shape so a hass-state map can be passed through with one transform.
  state: 'on' | 'off' | 'unavailable' | 'unknown' | string;
  rgb?: [number, number, number];
  brightness?: number; // 0-255
}

// Stefan-2026-05-10 R164: theme-aware off-state stroke. Pre-r15 was a
// fixed white-rgba which disappeared on light themes (white-on-white).
// Use HA's --disabled-color CSS var with a faded gray fallback so the
// arms stay visible in both light and dark themes.
const FAINT_GRAY = 'var(--disabled-color, rgba(150, 150, 150, 0.55))';
// Default geometry mirrors the design-mock 1:1 so visual-fidelity is automatic
// when the host is sized at 300×200 (e.g. responsive=false / standalone test).
const DEFAULT_VIEW_W = 300;
const DEFAULT_VIEW_H = 200;
const DEFAULT_GROUP_X = 150;
const DEFAULT_GROUP_Y = 170;
const DEFAULT_MEMBER_Y = 30;
const DEFAULT_MARGIN = 30;
const DEFAULT_MEMBER_R = 17;
const DEFAULT_GROUP_R = 23;
const DEFAULT_STROKE_WIDTH = 2.6;
// Padding from each edge in responsive mode. 10 px keeps stroke ends inside the box.
const RESPONSIVE_PAD = 10;
// ≥ this many members → switch from S-curves to the comb fallback.
// Stefan-2026-05-10 P15.6-r36 (R193): bumped from 6 → 100. The original
// threshold caused groups with 6+ members (Stefan's `light.main` Hue setup
// is one) to render the comb-fallback (vertical drops + horizontal trunk)
// which Stefan flagged as visually inconsistent with the 2/3/4-member
// bezier-S-curve style. Bezier curves scale to higher N just fine — they
// only get visually noisy past ~10 members. The new threshold effectively
// disables comb unless the user explicitly opts in via the `fallback-at`
// attribute (e.g. a wall-tablet showing a 20-light scene where comb's
// quietness wins over bezier's animated arms).
const COMB_FALLBACK_THRESHOLD = 100;

@customElement('everyday-mindmap-path')
export class EverydayMindmapPath extends LitElement {
  @property({ attribute: false }) members: MindmapMember[] = [];

  /**
   * Responsive mode (default): viewBox tracks the host's actual rendered size,
   * so the geometry adapts to whatever container the host lives in without
   * distorting circles or warping curves.
   *
   * Set to false when you want pixel-exact reproducibility of the design-mock
   * (e.g. for golden-image tests against `view-width`/`view-height`).
   */
  @property({ type: Boolean }) responsive = true;

  @property({ type: Number, attribute: 'view-width' }) viewWidth = DEFAULT_VIEW_W;
  @property({ type: Number, attribute: 'view-height' }) viewHeight = DEFAULT_VIEW_H;

  // Optional geometry overrides. When unset, sensible defaults are derived
  // from the (possibly measured) viewBox dimensions.
  @property({ type: Number, attribute: 'group-x' }) groupXOverride?: number;
  @property({ type: Number, attribute: 'group-y' }) groupYOverride?: number;
  @property({ type: Number, attribute: 'member-y' }) memberYOverride?: number;

  @property({ type: Number, attribute: 'margin' }) margin = DEFAULT_MARGIN;
  @property({ type: Number, attribute: 'stroke-width' }) strokeWidth = DEFAULT_STROKE_WIDTH;
  @property({ type: Number, attribute: 'fallback-at' }) fallbackAtN = COMB_FALLBACK_THRESHOLD;

  /**
   * CSS gap (in pixels) used by the parent's tile grid. When set, the member
   * X positions follow `colWidth/2 + i × (colWidth + gap)` so the SVG arm
   * tops land on the actual tile centers - the simple `(i + 0.5)/n × W`
   * formula clusters the outer dots inward by `gap/3` per side.
   */
  @property({ type: Number, attribute: 'tile-gap' }) tileGap = 0;

  /**
   * Stefan-2026-05-13 PA-0020 (R355): pixel width of each parallel-slider
   * sibling. When set, `_memberXs` switches from the CSS-grid equal-cols
   * formula to a flex-row-with-`gap`-and-`justify-content: space-around`
   * formula that exactly mirrors the parallel-slider-row's layout. This is
   * required for `.parallel-mindmap-area` (parallel-inline expanded view)
   * because that row uses flex+space-around with `gap: 14px` (R350), NOT a
   * CSS grid — at narrow widths where total slider content (N * s + (N-1) * g)
   * exceeds the row width, the sliders OVERFLOW flush-left with a constant
   * 14 px between-gap while the row width stays at 100% of the container.
   * The legacy equal-cols formula `(i + 0.5)/n × W` keeps shrinking arm-X's
   * past the constant slider centers, so the mindmap arms detach from their
   * sliders. Stefan-Quote PA-0020: "Der abstand zwischen den paralell slidern
   * bleibt konstant, während die mindmap arme, die zu den slidern führen
   * immer enger werden". When undefined → legacy formula (no behaviour
   * change for the group-layout-expanded topology-bg + standalone test page).
   * Pairs with `tileGap` (= the flex `gap` value, typically 14 here).
   */
  @property({ type: Number, attribute: 'slider-width' }) sliderWidth?: number;

  /**
   * Stefan-2026-05-11 (R234b): per-member-dot-radius override. When set,
   * `memberRadii[i]` is used for the i-th member dot instead of
   * DEFAULT_MEMBER_R. Used by group-layout-expanded to draw bigger dots
   * (GROUP_R = 23) at member positions that themselves contain nested
   * groups, so the parent mindmap visually signals "this member is itself
   * a group" — matching the larger group-icon size of the embedded
   * sub-card rendered below the dot. Bare-string members keep the default
   * MEMBER_R. When unset/empty, every member dot is MEMBER_R as before.
   */
  @property({ attribute: false }) memberRadii?: number[];

  /**
   * Stefan-2026-05-11 (R255): per-column fr-weights matching the parent
   * grid-template-columns. When set, member-X positions are computed as
   * weighted col centers (proportional to colWeights[i] / sum(colWeights))
   * instead of equal `(i + 0.5)/n × W`. So an outer apartment card with
   * Back (8 leaves) and Main (6 leaves) puts Back-dot at 4/14 × W ≈ 0.286W
   * and Main-dot at 11/14 × W ≈ 0.786W — matching the weighted grid where
   * Back-col is wider and its center sits left of W/2. Without this prop,
   * member-X falls back to the legacy equal-distribution behaviour, so
   * non-nested standalone views are unaffected.
   */
  @property({ attribute: false }) colWeights?: number[];

  /**
   * Stefan-2026-05-11 (R260): per-member Y override. When set, dots and
   * arm-end-points for member i use memberYs[i] instead of the single
   * `_memberY` value. Enables depth-aware mindmap arms where shallow
   * members (e.g. Main with 1 level of children) dot HIGHER and deep
   * members (e.g. Back with 2-3 levels of children) dot LOWER. The
   * parent (group-layout-expanded) computes these via a ResizeObserver
   * on each .member-col element, so the dots track the actual rendered
   * icon position regardless of inline-expansion state. Without this
   * prop, all members share a single _memberY (legacy behaviour).
   */
  @property({ attribute: false }) memberYs?: number[];

  /**
   * Stefan-2026-05-11 (R263): responsive group-dot offset from the far
   * edge (bottom when iconPosition='bottom', top when iconPosition='top').
   * Default 10 px (RESPONSIVE_PAD) preserves the compact-mindmap-arm
   * geometry where margin-bottom:-33 pulls the icon-tile to overlap the
   * SVG bottom — the dot at H-10 then merges with the icon visually.
   * Group-layout-expanded sets this to 46 in the topology-bg context
   * where the group-row sits at the topology bottom with its .ic
   * (46 px) centered 46 px above the topology bottom (= half-icon 23 +
   * 4 gap + ~19 px label line-height). With offset=46 the dot at H-46
   * lands on the icon-center, fixing Stefan's PA-11 complaint that
   * parent group-dots (Hall, Kitchen, Bathroom, Main) "ist zu weit
   * unten" relative to their HTML icons.
   *
   * Stefan-2026-05-12 R345 (PA-0018): EMPIRICAL value verified via
   * Chrome MCP getBoundingClientRect on /ed-slider/main — `.tile.group`
   * height = 69 px (.ic 46 + gap 4 + .lbl 19), so .ic-CENTER from
   * .tile.group-bottom = 46 (not 41 as the original docstring assumed
   * with .lbl=14). PA-0017 R343 mistakenly changed this 46→41 based on
   * the docstring's stale .lbl=14 assumption — produced a visible
   * 6-pixel misalignment Stefan flagged "if anything it is worse now".
   * Reverted in R345.
   */
  @property({ type: Number, attribute: 'group-icon-offset' }) groupIconOffset = RESPONSIVE_PAD;

  /**
   * Stefan-2026-05-11 (R244): icon-position-aware responsive defaults.
   * The mindmap-path's host fills the .topology div; the group-icon and
   * member-icons sit at opposite ends of that div based on the host
   * card's `icon_position` config.
   *   'bottom' (default): members near top of SVG, group near bottom.
   *   'top':              group near top of SVG, members near bottom.
   * When `groupYOverride` / `memberYOverride` are unset, this prop drives
   * which end the dots stick to. Combined with the ResizeObserver-driven
   * `_measuredHeight`, dots auto-reflow when the host card grows or
   * shrinks (e.g. when a nested member expands inline — Stefan's R244).
   */
  @property({ type: String, attribute: 'icon-position' }) iconPosition: 'top' | 'bottom' = 'bottom';

  // Render placeholder dots for the group + members. The standalone test page
  // wants them visible; group-layout-expanded sets dotsEnabled=false because
  // it owns the icon tiles in HTML and just needs the connecting curves.
  @property({ type: Boolean, attribute: 'dots-enabled' }) dotsEnabled = true;

  /**
   * Stefan-2026-05-09 P47-fix R49: split control so the GROUP dot (the halo
   * around the group icon) can render independently of MEMBER dots (the
   * coloured rings around member tiles). Stefan's expanded-view default:
   * group-halo ON, member-dots OFF — arms flow directly from group-icon
   * into each slider, no terminal circle on the member end.
   * Default: undefined → falls back to `dotsEnabled` (back-compat).
   */
  @property({ type: Boolean, attribute: 'group-dot-enabled' }) groupDotEnabled?: boolean;

  /**
   * Group on/off state. Drives the group-dot stroke colour: when false the
   * group ring goes faint-gray (matches the off-state of the arms);
   * when true the ring uses `groupRgb` if provided, else falls back to
   * the gold default. Without this prop the stroke stays at the gold
   * default — preserves backward compat for the standalone test page.
   */
  @property({ type: Boolean, attribute: 'group-on' }) groupOn?: boolean;

  /**
   * Optional rgb tuple for the group's "active" stroke. When `groupOn` is
   * true and this is set, the ring is drawn in the group's actual colour.
   * Otherwise the gold default is used.
   */
  @property({ attribute: false }) groupRgb?: [number, number, number];

  /**
   * @deprecated v0.0.8 - no-op. Previously set `preserveAspectRatio="none"`
   * which distorted SVG circles into ovals. The responsive viewBox approach
   * achieves the same alignment goal without distortion.
   */
  @property({ type: Boolean }) stretch = false;

  // Measured rendered dimensions, populated by ResizeObserver when responsive.
  @state() private _measuredWidth = DEFAULT_VIEW_W;
  @state() private _measuredHeight = DEFAULT_VIEW_H;

  private _resizeObserver?: ResizeObserver;

  // ---------- lifecycle ----------

  override connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          if (width !== this._measuredWidth) this._measuredWidth = width;
          if (height !== this._measuredHeight) this._measuredHeight = height;
        }
      });
      this._resizeObserver.observe(this);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }

  // ---------- effective geometry getters ----------

  private get _W(): number {
    return this.responsive ? this._measuredWidth : this.viewWidth;
  }
  private get _H(): number {
    return this.responsive ? this._measuredHeight : this.viewHeight;
  }
  private get _groupX(): number {
    if (this.groupXOverride !== undefined) return this.groupXOverride;
    if (!this.responsive) return DEFAULT_GROUP_X;
    // Stefan-2026-05-11 R269: revert R256 weighted-midpoint logic. With
    // R271 stretching the embedded cards to fill their cols, the visual
    // "balance point" between weighted children is no longer perceived
    // as off-center; Stefan PA-11 reported the R256-shifted All-icon as
    // "zu weit rechts". Restoring W/2 (geometric center) for the
    // responsive case; asymmetric arm lengths to weighted children are
    // visually acceptable and Stefan-preferred over a shifted group.
    return this._W / 2;
  }
  private get _groupY(): number {
    if (this.groupYOverride !== undefined) return this.groupYOverride;
    if (!this.responsive) return DEFAULT_GROUP_Y;
    // Stefan-2026-05-11 R244/R247/R263: responsive default based on
    // iconPosition + configurable groupIconOffset. iconPosition='top' →
    // group at top of topology, dot near top (groupIconOffset from top
    // edge). iconPosition='bottom' (default) → group at bottom, dot at
    // (_H - groupIconOffset) from top = groupIconOffset from bottom.
    // Default offset 10 (compact-arm geometry); 41 in topology-bg
    // context where the icon-center sits 41 px above the topology
    // bottom (label 14 + gap 4 + half-icon 23).
    return this.iconPosition === 'top'
      ? this.groupIconOffset
      : this._H - this.groupIconOffset;
  }
  private get _memberY(): number {
    if (this.memberYOverride !== undefined) return this.memberYOverride;
    if (!this.responsive) return DEFAULT_MEMBER_Y;
    // Stefan-2026-05-11 R257: bumped offset 110 → 140 so dots sit
    // VISUALLY HIGHER (= smaller SVG Y when iconPosition='bottom').
    // Geometry in the nested-outer apartment context:
    //   topology = member-cols + 30 px gap + group-row (~64 px, icon+label)
    //   _H = topology total height
    //   member-cols-bottom (in topology coords) = _H - 30 - 64 ≈ _H - 94
    //   Embedded sub-card's group-icon center sits at col-bottom - 41
    //     (= half of sub-card's own group-row: 46 px icon + 4 gap + 14 label,
    //      half-icon 23, plus label area below). So in topology coords:
    //     icon-center ≈ _H - 94 - 41 = _H - 135.
    //   Bare-string tile-icon center at col-bottom - 35 ≈ _H - 129.
    // Use _H - 140 — slightly above both targets so the dot's circumference
    // overlaps the icon (visually merging dot + icon into one element).
    // Stefan-Feedback PA-08 r56 "Node kreise müssen höher" → reducing the
    // dot-Y by 30 px from the r56 _H - 110 compromise.
    const ICON_OFFSET_FROM_FAR_EDGE = 140;
    return this.iconPosition === 'top'
      ? ICON_OFFSET_FROM_FAR_EDGE
      : this._H - ICON_OFFSET_FROM_FAR_EDGE;
  }

  /**
   * Stefan-2026-05-11 R255: detect whether colWeights actually shifts the
   * X-distribution off equal cols. When all weights are equal (or unset),
   * fall back to legacy equal-distribution behaviour so standalone views
   * stay pixel-identical to pre-R255 renders.
   */
  private _isWeighted(): boolean {
    if (!this.colWeights || this.colWeights.length === 0) return false;
    const first = this.colWeights[0];
    return this.colWeights.some((w) => w !== first);
  }

  // ---------- helpers ----------

  /**
   * X positions of the N members.
   *
   * Tile-grid-aligned formula `(i + 0.5) / n × W` so the arm-tops land
   * directly under each member-tile column-center when the parent layout
   * uses an equal-fraction grid. Edge-to-edge spacing falls out
   * automatically: N=3 → 1/6, 1/2, 5/6 of the width.
   *
   * If the user explicitly set `margin` to a non-default value, we honor
   * the legacy "evenly spaced between margin and W - margin" behavior so
   * existing callers don't break.
   */
  private _memberXs(n: number): number[] {
    if (n <= 0) return [];
    const W = this._W;
    if (n === 1) return [W / 2];
    if (this.margin !== DEFAULT_MARGIN) {
      const usable = W - 2 * this.margin;
      const xs: number[] = [];
      for (let i = 0; i < n; i++) xs.push(this.margin + (usable * i) / (n - 1));
      return xs;
    }
    const gap = this.tileGap;
    // Stefan-2026-05-13 PA-0020 (R355): flex-row-space-around-with-gap branch.
    // When `sliderWidth` is supplied, mirror the CSS flex layout used by
    // .parallel-slider-row (`display: flex; gap: G; justify-content: space-
    // around`). Two regimes:
    //   1. W >= content-width (= n*s + (n-1)*g): free space distributed by
    //      space-around — endmost padding E = free/(2n), between-padding
    //      2E + gap. Slider centers at E*(2i+1) + (i+0.5)*s + i*g.
    //   2. W < content-width: row overflows flush-left, sliders pinned at
    //      `i*(s+g) + s/2`. This is the case Stefan flagged — pre-R355 the
    //      legacy equal-cols formula kept shrinking the mindmap-X past the
    //      now-constant slider centers, detaching the arms from the sliders.
    // Weighted-cols + sliderWidth would be ambiguous (no real-world config
    // uses both), so weighted takes precedence below when present.
    //
    // Stefan-2026-05-13 R364 (PA-0022): use the effective `--everyday-slider-
    // width` CSS var from this host's computed style when present, falling
    // back to the static prop. Pre-R364 the prop was set from cfg.slider?.width
    // ?? 60 at the parent's render time and stayed at 60 even after R349
    // sibling-coordination shrunk the actual rendered slider to 44 px (nested
    // narrow contexts). Result: the overflow formula computed xs from s=60
    // (content-width 134), so arm endpoints landed at i*74+30 = [30, 104]
    // while the actual 44-px sliders had centers at [22, 80] — 8-24 px
    // detachment per arm (Stefan-Quote PA-0022: "the arms are now again kinda
    // more detached"). The CSS var cascades through shadow DOM boundaries
    // (default for custom properties), so this host always sees the same
    // value the slider component uses. We re-read on every render — cheap,
    // and naturally tracks ResizeObserver-driven re-renders so the arm
    // endpoints follow the actual slider widths as they shrink/grow.
    const cssSliderWidthRaw = parseFloat(
      getComputedStyle(this).getPropertyValue('--everyday-slider-width'),
    );
    const effectiveSliderWidth = Number.isFinite(cssSliderWidthRaw) && cssSliderWidthRaw > 0
      ? cssSliderWidthRaw
      : this.sliderWidth;
    if (effectiveSliderWidth !== undefined && effectiveSliderWidth > 0 && !this._isWeighted()) {
      const s = effectiveSliderWidth;
      const contentW = n * s + (n - 1) * gap;
      if (W >= contentW) {
        const E = (W - contentW) / (2 * n);
        const xs: number[] = [];
        for (let i = 0; i < n; i++) {
          xs.push(E * (2 * i + 1) + (i + 0.5) * s + i * gap);
        }
        return xs;
      }
      const xs: number[] = [];
      for (let i = 0; i < n; i++) {
        xs.push(i * (s + gap) + s / 2);
      }
      return xs;
    }
    // Stefan-2026-05-11 R255: weighted-cols branch. When the parent's
    // grid-template-columns is `8fr 6fr` (etc), the columns aren't equal
    // width — so equal-distribution member-X clusters the dots away from
    // their actual col centers. Compute weighted col-centers matching the
    // parent's CSS grid layout: each col-i width = weights[i] / totalWeight
    // × (W - (n-1) × gap). Col-i left-edge = sum of previous widths + i × gap.
    // Col-i center = left-edge + width/2.
    if (this._isWeighted()) {
      const weights = this.colWeights!;
      const totalWeight = weights.reduce((s, w) => s + w, 0);
      const totalGap = (n - 1) * gap;
      const usable = W - totalGap;
      const xs: number[] = [];
      let cursor = 0;
      for (let i = 0; i < n; i++) {
        const colWidth = (usable * weights[i]) / totalWeight;
        xs.push(cursor + colWidth / 2);
        cursor += colWidth + gap;
      }
      return xs;
    }
    // Gap-aware equal-cols formula (legacy). With CSS grid `repeat(N, 1fr) gap: G`,
    // each column is `(W - (N-1)G)/N` wide, and column-i's center sits at
    // `colWidth/2 + i × (colWidth + gap)`. For tileGap=0 this collapses
    // back to the simple `(i + 0.5)/n × W`.
    const colWidth = (W - (n - 1) * gap) / n;
    const xs: number[] = [];
    for (let i = 0; i < n; i++) xs.push(colWidth / 2 + i * (colWidth + gap));
    return xs;
  }

  /** Per-arm stroke color. Off / unavailable members keep the path visible as a faint guide.
   *
   * Stefan-2026-05-09 P14b: opacity floor raised from 0.1 to 0.4 so even
   * dim lights (brightness under 25 percent) read as actively-on rather
   * than off. Helps the topology feel alive at reduced brightness levels.
   */
  private _armStroke(m: MindmapMember | undefined): string {
    if (!m || m.state !== 'on' || !m.rgb) return FAINT_GRAY;
    const opacity = Math.max(0.4, Math.min(1, (m.brightness ?? 255) / 255));
    return `rgba(${m.rgb[0]}, ${m.rgb[1]}, ${m.rgb[2]}, ${opacity.toFixed(3)})`;
  }

  /** dasharray for unavailable arms - keeps them legible without screaming "active". */
  private _armDash(m: MindmapMember | undefined): string {
    // 3 px stroke / 8 px gap reads as clearly intermittent without looking like
    // a tight stitching pattern (which is what "3 3" produced).
    // Stefan-2026-05-10 P15.6-r45 (R219): `'none'` (not `''`) for the default
    // case. Empty string is invalid CSS — Firefox/Chrome drop it with the
    // DevTools warning "Error in parsing value for 'stroke-dasharray'.
    // Declaration dropped." The behaviour is the same (no dash applied) but
    // the console stays clean.
    return m && (m.state === 'unavailable' || m.state === 'unknown') ? '3 8' : 'none';
  }

  /**
   * Cubic Bézier from group → member.
   *
   * Stefan-2026-05-09 P41-R13: redesigned for L-shaped outer arms ("der
   * linke arm zb soll schon fast 'L' förmig sein. natürlich mit einer
   * natürlichen Kurve … sieht dann seriöser aus"). Symmetric: the right arm
   * is the mirror of the left because we drive the entire shape from `dx`,
   * which flips sign across groupX.
   *
   * Geometry:
   *   c1 sits near group-Y but already pushed 70 % of the horizontal
   *      distance toward the member — this makes the curve start out
   *      almost horizontal from the group node.
   *   c2 sits at member-X, 50 % up from group-Y — this makes the curve
   *      finish almost vertical at the member node.
   *
   * For dx = 0 (centre member): c1 = (groupX, groupY - vs * 0.05),
   * c2 = (groupX, groupY - vs * 0.5). Both x's equal groupX, so the path
   * collapses to a vertical line — exactly what we want for the centre arm.
   *
   * "Natural curve" comes from c1y not being EXACTLY at groupY (small 5 %
   * lift) so the corner is a smooth radius rather than a hard right angle.
   */
  private _bezierD(memberX: number, memberYOverride?: number): string {
    const groupX = this._groupX;
    const groupY = this._groupY;
    // Stefan-2026-05-11 R260: per-member-Y override allows depth-aware
    // arms (Main higher than Back, etc). Falls back to the single _memberY
    // when memberYs[i] is not provided.
    const memberY = memberYOverride ?? this._memberY;
    const dx = memberX - groupX;
    const verticalSpan = groupY - memberY;
    // c1: start of curve — horizontal-out, near group-Y.
    const c1x = groupX + dx * 0.7;
    const c1y = groupY - verticalSpan * 0.05;
    // c2: end of curve — at member-X, half-way up.
    const c2x = memberX;
    const c2y = groupY - verticalSpan * 0.5;
    return `M ${groupX} ${groupY} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${memberX} ${memberY}`;
  }

  // ---------- arm renderers ----------

  /** S-curve renderer for N = 1..5 - matches Stefan-greenlit Triton geometry at N=3. */
  private _renderBezierArms(xs: number[]): SVGTemplateResult[] {
    return xs.map((x, i) => {
      const m = this.members[i];
      const yOverride = this.memberYs?.[i];
      return svg`
        <path
          d=${this._bezierD(x, yOverride)}
          stroke=${this._armStroke(m)}
          stroke-width=${this.strokeWidth}
          stroke-dasharray=${this._armDash(m)}
          stroke-linecap="round"
          fill="none"
        />
      `;
    });
  }

  /**
   * Comb fallback for N ≥ fallbackAtN. Each member drops vertically to a
   * horizontal connector slightly above the group, then a single trunk runs
   * to the group node. Visually quieter than 6+ overlapping S-curves.
   */
  private _renderCombArms(xs: number[]): SVGTemplateResult[] {
    if (xs.length === 0) return [];
    const memberY = this._memberY;
    const groupY = this._groupY;
    const groupX = this._groupX;
    const combY = memberY + (groupY - memberY) * 0.55;
    const combLeftX = Math.min(...xs);
    const combRightX = Math.max(...xs);

    const drops = xs.map((x, i) => {
      const m = this.members[i];
      // Stefan-2026-05-11 R260: per-member-Y in comb mode too. Drop-line
      // starts at memberYs[i] (the actual icon Y) instead of the single
      // memberY default. Used when colWeights + variable depth siblings.
      const dropTop = this.memberYs?.[i] ?? memberY;
      return svg`
        <line
          x1=${x}
          y1=${dropTop}
          x2=${x}
          y2=${combY}
          stroke=${this._armStroke(m)}
          stroke-width=${this.strokeWidth}
          stroke-dasharray=${this._armDash(m)}
          stroke-linecap="round"
        />
      `;
    });

    // Connector + trunk colored by the average of the on-members
    // (matches CONCEPT.md R2 "Trunk = Average-RGB der aktiven Member").
    const onMembers = this.members.filter((m) => m && m.state === 'on' && m.rgb);
    let trunkStroke = FAINT_GRAY;
    if (onMembers.length > 0) {
      let r = 0;
      let g = 0;
      let b = 0;
      let maxBrightness = 0;
      for (const m of onMembers) {
        r += m.rgb![0];
        g += m.rgb![1];
        b += m.rgb![2];
        maxBrightness = Math.max(maxBrightness, (m.brightness ?? 255) / 255);
      }
      r = Math.round(r / onMembers.length);
      g = Math.round(g / onMembers.length);
      b = Math.round(b / onMembers.length);
      trunkStroke = `rgba(${r}, ${g}, ${b}, ${maxBrightness.toFixed(3)})`;
    }

    const connector = svg`
      <line
        x1=${combLeftX} y1=${combY}
        x2=${combRightX} y2=${combY}
        stroke=${trunkStroke}
        stroke-width=${this.strokeWidth}
        stroke-linecap="round"
      />
    `;
    const trunk = svg`
      <line
        x1=${groupX} y1=${combY}
        x2=${groupX} y2=${groupY}
        stroke=${trunkStroke}
        stroke-width=${this.strokeWidth}
        stroke-linecap="round"
      />
    `;

    return [...drops, connector, trunk];
  }

  // ---------- main render ----------

  protected render(): TemplateResult {
    const n = this.members.length;
    const xs = this._memberXs(n);
    const W = this._W;
    const H = this._H;
    const memberY = this._memberY;
    const groupX = this._groupX;
    const groupY = this._groupY;

    const arms = n >= 1 ? (n >= this.fallbackAtN ? this._renderCombArms(xs) : this._renderBezierArms(xs)) : [];

    const memberDots: SVGTemplateResult[] = this.dotsEnabled
      ? xs.map(
          (x, i) => svg`
            <circle
              cx=${x}
              cy=${this.memberYs?.[i] ?? memberY}
              r=${this.memberRadii?.[i] ?? DEFAULT_MEMBER_R}
              fill="var(--mindmap-dot-fill, #3a3a52)"
              stroke=${this._armStroke(this.members[i])}
              stroke-width="2"
            />
          `,
        )
      : [];

    // Group-dot stroke depends on `groupOn` + `groupRgb`. When the prop is
    // unset (older callers / standalone test page) we default to the gold
    // brand stroke so existing visuals are preserved.
    let groupStroke = 'var(--mindmap-group-stroke, #f4b91d)';
    if (this.groupOn === false) {
      groupStroke = FAINT_GRAY;
    } else if (this.groupOn === true && this.groupRgb && this.groupRgb.length === 3) {
      groupStroke = `rgba(${this.groupRgb[0]}, ${this.groupRgb[1]}, ${this.groupRgb[2]}, 1)`;
    }
    // Stefan-2026-05-09 P47-fix R49: groupDotEnabled overrides dotsEnabled
    // for the group-halo specifically. When undefined, falls back to
    // dotsEnabled. When set explicitly (e.g. group-layout-expanded passes
    // true), the group-halo renders even if member-dots are off.
    const groupShowing = this.groupDotEnabled ?? this.dotsEnabled;
    const groupDot: SVGTemplateResult | null =
      groupShowing && n >= 1
        ? svg`
            <circle
              cx=${groupX}
              cy=${groupY}
              r=${DEFAULT_GROUP_R}
              fill="var(--mindmap-dot-fill, #3a3a52)"
              stroke=${groupStroke}
              stroke-width="2"
            />
          `
        : null;

    return html`
      <svg
        viewBox=${`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
        role="img"
        aria-label=${`Mindmap with ${n} member${n === 1 ? '' : 's'}`}
      >
        <g class="arms">${arms}</g>
        <g class="dots">${memberDots}${groupDot}</g>
      </svg>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
      width: 100%;
      /* Default aspect ratio matches the design-mock for the standalone test
         page. Group-layout-expanded overrides this with aspect-ratio:auto
         and an explicit pixel height. */
      aspect-ratio: 300 / 200;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    /* Same depth-treatment Stefan asked for on tiles + slider, applied as an
       SVG filter on the connector arms only (NOT the placeholder dots) so the
       curves visually lift off the card. drop-shadow on the <g> applies once
       per group rather than per <path>, which is the cheaper render path. */
    .arms {
      filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.35));
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-mindmap-path': EverydayMindmapPath;
  }
}
