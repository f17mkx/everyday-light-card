/**
 * color-wheel - Phase 6 deliverable, R5/R6 stepped variant.
 *
 * Stepped color wheel: HUES segments × RINGS rings, each segment fills with
 * an HSV-derived RGB color. Click on a segment fires a `color-pick` event
 * with the RGB triple. Configurable density (CONCEPT.md A6) - default is
 * 12 hues × 4 rings, generous enough for everyday color picking without
 * overwhelming with too many sub-segments.
 *
 * Geometry mirrors `assets/design-mocks/color-wheel-stepped-vs-smooth.html`:
 *   For each segment (hue h, ring r):
 *     hueAngle    = (h / HUES) × 2π            (start angle)
 *     hueAngleEnd = ((h + 1) / HUES) × 2π      (end angle)
 *     ring r1     = ringStart × (RMAX / RINGS) (inner radius)
 *     ring r2     = (ringStart + 1) × (RMAX / RINGS)
 *     saturation  = (r + 1) / RINGS
 *     value       = 1
 *     fill = hsv2rgb(hue, saturation, value)
 *     path = arc(r1, r2, hueAngle, hueAngleEnd)
 *
 * White center: when enabled (default), ring 0 is replaced by a single
 * white circle - useful so the user can quickly select white without
 * tracking the de-saturated outer ring.
 *
 * Smooth variant deferred to a follow-up (would use conic-gradient + click
 * → polar-coordinate mapping). The stepped variant alone meets P6's
 * Demo-blocker definition.
 */

import { LitElement, html, svg, css, type CSSResult, type SVGTemplateResult, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const RMAX = 100; // viewBox radius

function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0;
  let g = 0;
  let b = 0;
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

function arcPath(r1: number, r2: number, a1: number, a2: number): string {
  const x1 = Math.cos(a1) * r1;
  const y1 = Math.sin(a1) * r1;
  const x2 = Math.cos(a2) * r1;
  const y2 = Math.sin(a2) * r1;
  const x3 = Math.cos(a2) * r2;
  const y3 = Math.sin(a2) * r2;
  const x4 = Math.cos(a1) * r2;
  const y4 = Math.sin(a1) * r2;
  const large = a2 - a1 > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r1} ${r1} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 ${large} 0 ${x4} ${y4} Z`;
}

@customElement('everyday-color-wheel')
export class EverydayColorWheel extends LitElement {
  /**
   * 'stepped' = HUES × RINGS arc segments (default).
   * 'smooth'  = continuous conic-gradient + radial saturation. Click position
   *             maps to polar coords → HSV → RGB.
   */
  @property({ type: String, attribute: 'wheel-type' }) wheelType: 'stepped' | 'smooth' = 'stepped';
  // Stefan-2026-05-12 P15.6-r64 (PA-0014): defaults bumped from 21×6 to
  // 8×24 — more hue resolution at the same visual density, fewer
  // saturation rings so each ring carries more weight. Stefan-Quote
  // PA-0014: "default, with 8 steps and 24 hues, 12 und 5 steps". The
  // 21×6 default from r47 was too crowded on small screens; the new
  // 8×24 reads cleaner while exposing more colors. Hosts default to
  // 8×24 in their `??` fallbacks so explicit-undefined props land on
  // the same numbers.
  @property({ type: Number, attribute: 'hues' }) hues = 24;
  @property({ type: Number, attribute: 'rings' }) rings = 8;
  // Stefan-2026-05-12 P15.6-r64 (PA-0014): when `rings ≤ 5`, the inner
  // circle must NOT be replaced by a white disc — instead, the natural
  // low-saturation segment at ring 0 remains selectable. Stefan-Quote:
  // "bei 5 oder weniger Steps soll der innere Kreis nicht weiß sein,
  // sondern immer auch als option zum auswählen bestehen". Applies to
  // the stepped variant; smooth keeps its radial white-bias gradient.
  // `whiteCenter` here is the *requested* state; the effective state
  // is computed in render() so the rings-≤5 rule wins regardless of
  // attribute value.
  @property({ type: Boolean, attribute: 'white-center' }) whiteCenter = true;

  private _onSegmentClick = (rgb: [number, number, number]) => (ev: Event): void => {
    ev.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('color-pick', {
        detail: { r: rgb[0], g: rgb[1], b: rgb[2] },
        bubbles: true,
        composed: true,
      }),
    );
  };

  private _onWhiteClick = (ev: Event): void => {
    ev.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('color-pick', {
        detail: { r: 255, g: 255, b: 255 },
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Smooth-wheel click handler. Computes the polar coords from the wheel's
   * client rect, derives HSV (hue from angle, saturation from radius), and
   * emits a color-pick event. White center bias: when the click lands within
   * the inner 8% of the radius, snap to white.
   */
  private _onSmoothClick = (ev: MouseEvent): void => {
    const target = ev.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = ev.clientX - cx;
    const dy = ev.clientY - cy;
    const radius = Math.min(rect.width, rect.height) / 2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > radius) return; // click outside the circle
    if (dist < radius * 0.08) {
      // White center
      this.dispatchEvent(
        new CustomEvent('color-pick', {
          detail: { r: 255, g: 255, b: 255 },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }
    const angle = Math.atan2(dy, dx); // -π..π, 0 = +x axis (right)
    let hue = angle / (2 * Math.PI);
    if (hue < 0) hue += 1; // 0..1
    const sat = Math.min(1, dist / radius);
    const rgb = hsv2rgb(hue, sat, 1);
    this.dispatchEvent(
      new CustomEvent('color-pick', {
        detail: { r: rgb[0], g: rgb[1], b: rgb[2] },
        bubbles: true,
        composed: true,
      }),
    );
  };

  protected render(): TemplateResult {
    if (this.wheelType === 'smooth') {
      return html`
        <div class="smooth-wheel" role="img" aria-label="Color wheel" @click=${this._onSmoothClick}>
          <div class="smooth-bg"></div>
        </div>
      `;
    }

    const HUES = Math.max(2, this.hues);
    const RINGS = Math.max(1, this.rings);
    // Stefan-2026-05-12 P15.6-r64 (PA-0014): rings ≤ 5 → force the
    // innermost segment to render as a selectable arc instead of a
    // white disc, so users on the chunky variants still get full
    // saturation coverage at the low-saturation end.
    const effectiveWhiteCenter = this.whiteCenter && RINGS > 5;
    const startRing = effectiveWhiteCenter ? 1 : 0;
    const segments: SVGTemplateResult[] = [];
    for (let ring = startRing; ring < RINGS; ring++) {
      const r1 = (RMAX / RINGS) * ring;
      const r2 = (RMAX / RINGS) * (ring + 1);
      const sat = (ring + 1) / RINGS;
      for (let hue = 0; hue < HUES; hue++) {
        const a1 = (hue / HUES) * 2 * Math.PI;
        const a2 = ((hue + 1) / HUES) * 2 * Math.PI;
        const rgb = hsv2rgb(hue / HUES, sat, 1);
        const fill = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        segments.push(svg`
          <path
            d=${arcPath(r1, r2, a1, a2)}
            fill=${fill}
            class="seg"
            @click=${this._onSegmentClick(rgb)}
          ></path>
        `);
      }
    }
    const whiteCircle = effectiveWhiteCenter
      ? svg`
        <circle
          cx="0"
          cy="0"
          r=${RMAX / RINGS}
          fill="white"
          class="seg"
          @click=${this._onWhiteClick}
        ></circle>
      `
      : null;

    return html`
      <svg viewBox="-110 -110 220 220" role="img" aria-label="Color wheel">
        ${segments}${whiteCircle}
      </svg>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
      width: 100%;
      /* Stefan-2026-05-12 P15.6-r64 (PA-0014): dropped max-width 320px.
         When a host set explicit width 360 + height 360, the
         320px clamp on width left height untouched, producing a
         320x360 rectangle (Stefan saw the smooth wheel "schmaler
         als hoch" on wheel-variants.html). aspect-ratio alone now
         drives height from the rendered width; the popup host
         already constrains absolute size via its own wrapper. */
      aspect-ratio: 1 / 1;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      /* Stefan-2026-05-08-evening: the wheel popup wrapper is now transparent
         (no rectangular card around the wheel), so the shadow lives entirely
         on the wheel SVG itself. Pumped strength up so the round wheel reads
         as floating above the card. */
      filter: drop-shadow(0 14px 36px rgba(0, 0, 0, 0.7))
              drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
    }
    .seg {
      cursor: pointer;
      stroke: rgba(0, 0, 0, 0.05);
      stroke-width: 0.5;
      transition: opacity 120ms ease-out, transform 120ms ease-out;
      transform-origin: center;
      transform-box: fill-box;
    }
    .seg:hover {
      opacity: 0.92;
    }
    .seg:active {
      opacity: 0.8;
    }
    /* Smooth variant: continuous HSV via CSS gradients. White center fades
       in via the radial gradient layered over the conic hue. */
    .smooth-wheel {
      position: relative;
      width: 100%;
      height: 100%;
      cursor: pointer;
      filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.45));
    }
    .smooth-bg {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background:
        radial-gradient(circle at center, #fff 0%, rgba(255, 255, 255, 0) 70%),
        conic-gradient(
          from 0deg,
          #ff0000,
          #ffff00,
          #00ff00,
          #00ffff,
          #0000ff,
          #ff00ff,
          #ff0000
        );
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-color-wheel': EverydayColorWheel;
  }
}
