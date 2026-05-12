/**
 * popup-portal-styles - Phase 15 deliverable.
 *
 * CSS injected once into document.head so the body-portal popups have
 * styling. Mirrors the relevant rules from the host's static styles —
 * the popups can't inherit the host's shadow-root CSS, so the styles are
 * duplicated here.
 *
 * Stefan-2026-05-09 P14c.2/P15: extracted from group-layout-expanded.ts
 * static readonly PORTAL_STYLES so the file gets ~290 LOC lighter and
 * future popup-render extraction can co-locate render fn + matching CSS.
 *
 * Keep in sync with `.inplace-popup` rules in the host's static styles.
 */

export const POPUP_PORTAL_STYLES = `
  /* Stefan-2026-05-09 P46 R27: portal is NO LONGER position:fixed. Without
     a positioned-ancestor at portal level, children with position:absolute
     use the initial containing block (= document) — which scrolls with the
     page. Wheel + saved popups (which still use position:fixed for picker-
     dot anchoring) work either way. Topology + parallel popups now scroll
     with the page like any other in-document content. */
  .everyday-popup-portal { pointer-events: none; }
  .everyday-popup-portal .inplace-popup {
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
    pointer-events: auto;
    /* Stefan-2026-05-09 P47-fix: wheel + saved popups must stack ABOVE
       topology + parallel popups (same portal, both originally z-index 99
       → wheel rendered earlier in template → wheel sat behind). Bumping
       to 200 keeps the picker-result chain (wheel/saved) always on top. */
    z-index: 200;
    animation: everyday-inplace-bloom 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) both;
  }
  @keyframes everyday-inplace-bloom {
    0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
    100% { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
  }
  .everyday-popup-portal .inplace-popup.wheel {
    width: 240px;
    background: transparent;
    padding: 0;
    border-radius: 0;
    box-shadow: none;
  }
  .everyday-popup-portal .inplace-popup.saved {
    max-width: 280px;
  }
  /* Topology + parallel-sliders popups (P43 R20/R21, redesigned P45 R25/R26a).
     Stefan-2026-05-09: popups mount at the SAME position as the underlying
     card / slider (not viewport-centred fullscreen-modal). The body-portal
     still lets them escape HA's transform-ancestor; we just position them
     precisely via inline style instead of inset zero. */
  .everyday-popup-portal .topology-popup.anchored,
  .everyday-popup-portal .parallel-popup.anchored {
    /* P46 R27: position absolute (not fixed) so the popup scrolls with
       the page. Inline-style from JS supplies the actual position
       absolute, left/top, transform translateY(-100%) etc. - see
       _renderTopologyPopup / _renderParallelSlidersPopup. */
    pointer-events: auto;
    z-index: 99;
    /* Bloom-in animation kept; chained with the inline translateY(-100%)
       via the SAME transform property by spelling both out together
       (translateY + scale). */
    animation: everyday-anchored-card-in 220ms cubic-bezier(0.16, 1.06, 0.46, 1.04) both;
  }
  @keyframes everyday-anchored-card-in {
    from { transform: translateY(-100%) scale(0.92); opacity: 0; }
    to   { transform: translateY(-100%) scale(1);    opacity: 1; }
  }
  .everyday-popup-portal .popup-card {
    background: var(--card-background-color, #1d1f3a);
    border-radius: 24px;
    padding: 18px 22px 22px;
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
    max-width: min(95vw, 720px);
    max-height: 90vh;
    overflow: auto;
  }
  /* Anchored variant: card fills the popup container (which is already
     sized to match the underlying card/slider). */
  .everyday-popup-portal .popup-card.anchored-card {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;  /* group-icon at popup-bottom */
  }
  .everyday-popup-portal .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .everyday-popup-portal .popup-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color, #fff);
  }
  .everyday-popup-portal .popup-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.06);
    color: var(--primary-text-color, #fff);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .everyday-popup-portal .popup-close:hover {
    background: rgba(255, 255, 255, 0.12);
  }
  /* Topology popup — Stefan-2026-05-09 P44 R23: re-use the inline-expand
     layout exactly. The CSS rules below are scoped DUPLICATES of the host's
     shadow-root rules (.layout, .topology, .tile, .member-cols, etc.) so
     the body-portal-rendered topology-tree looks identical to the
     in-card inline-expand version. Keep this block in sync with the host's
     static styles when those change. The default
     --everyday-slider-height: 170 px applies; the popup-card opt-in
     overrides via inline style when full_length_sliders is true. */
  .everyday-popup-portal .topology-popup-card {
    --everyday-slider-width: 47px;
    --everyday-slider-height: 170px;
    --everyday-slider-shadow-y1: -4px;
    --everyday-slider-shadow-y2: -14px;
    padding: 18px 22px 22px;
    /* Stefan-2026-05-09 P47-fix: topology-popup is transparent so the
       original card / wallpaper shows through. Sliders + tiles still
       render solid; only the popup-card chrome is invisible. */
    background: transparent;
    box-shadow: none;
  }
  .everyday-popup-portal .topology-popup-card .layout {
    /* Stefan-2026-05-09 P47 R30: top-padding 111 px brings the anchor
       (group-icon at popup-bottom) to align with the original card's
       group-icon-y. Inline-expand .layout keeps the original 24/24/20
       padding — only the popup variant needs the larger top-padding to
       compensate for the popup's translateY(-100%) bottom-anchor model. */
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 111px 24px 24px;
  }
  .everyday-popup-portal .topology-popup-card .topology {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  .everyday-popup-portal .topology-popup-card .topology > .topology-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
    display: block;
    z-index: 0;
    pointer-events: none;
  }
  .everyday-popup-portal .topology-popup-card .topology > .group-row,
  .everyday-popup-portal .topology-popup-card .topology > .member-cols {
    position: relative;
    z-index: 2;
  }
  .everyday-popup-portal .topology-popup-card .group-row {
    display: flex;
    justify-content: center;
  }
  .everyday-popup-portal .topology-popup-card .member-cols {
    display: grid;
    grid-template-columns: repeat(var(--member-count, 1), 1fr);
    gap: 18px;
    justify-items: center;
  }
  .everyday-popup-portal .topology-popup-card .member-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .everyday-popup-portal .topology-popup-card .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    position: relative;
  }
  .everyday-popup-portal .topology-popup-card .tile .ic {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--secondary-text-color);
    transition: color 200ms ease, background 160ms ease;
  }
  .everyday-popup-portal .topology-popup-card .tile.group .ic {
    width: 46px;
    height: 46px;
  }
  .everyday-popup-portal .topology-popup-card .tile .ic ha-icon,
  .everyday-popup-portal .topology-popup-card .tile .ic .compact-glyph {
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55));
  }
  .everyday-popup-portal .topology-popup-card .tile.on .ic {
    color: var(--state-light-active-color, #f88d2a);
  }
  .everyday-popup-portal .topology-popup-card .tile .lbl {
    font-size: 12px;
    color: var(--secondary-text-color);
    text-align: center;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .everyday-popup-portal .topology-popup-card .tile.group {
    cursor: pointer;
    user-select: none;
  }
  .everyday-popup-portal .topology-popup-card .tile.member.lp .ic,
  .everyday-popup-portal .topology-popup-card .tile.group.lp .ic {
    background: rgba(248, 141, 42, 0.20);
    box-shadow:
      inset 0 0 0 1px rgba(248, 141, 42, 0.50),
      0 0 0 4px rgba(248, 141, 42, 0.18),
      0 0 0 9px rgba(248, 141, 42, 0.08);
  }
  .everyday-popup-portal .topology-popup-card .tile.member {
    cursor: pointer;
    user-select: none;
    touch-action: none;
  }
  .everyday-popup-portal .topology-popup-card .compact-glyph {
    width: 32px;
    height: 32px;
  }
  .everyday-popup-portal .topology-popup-card ha-icon {
    --mdc-icon-size: 24px;
  }
  .everyday-popup-portal .topology-popup-card .tile.group ha-icon {
    --mdc-icon-size: 32px;
  }
  .everyday-popup-portal .topology-popup-card .picker-overlay {
    position: absolute;
    top: 17px;
    left: 50%;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 10;
  }
  .everyday-popup-portal .topology-popup-card .tile.group .picker-overlay {
    top: 23px;
  }
  .everyday-popup-portal .topology-popup-card .picker-overlay > everyday-mode-picker {
    pointer-events: auto;
  }
  /* Parallel-sliders body — N sliders side-by-side. Stefan-2026-05-09 P47
     R31a: SLIDERS at the bottom-edge of the popup (= anchor-y), labels
     above. justify-content:flex-end on parallel-card pushes everything
     to the bottom; parallel-col is flex-column with label first then
     slider, so slider sits at column-bottom. */
  .everyday-popup-portal .parallel-card.anchored-card {
    /* Reset the parent anchored-card padding to 0 since we want the
       sliders flush with the popup-bottom; per-col gap handles spacing. */
    padding: 0;
  }
  .everyday-popup-portal .parallel-body {
    display: flex;
    gap: 22px;
    align-items: flex-end;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
  .everyday-popup-portal .parallel-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    /* Slider sits at the bottom of its column → label flows on top. */
  }
  .everyday-popup-portal .parallel-lbl {
    font-size: 11px;
    color: var(--secondary-text-color, #b1b3c8);
    text-transform: capitalize;
  }
`;
