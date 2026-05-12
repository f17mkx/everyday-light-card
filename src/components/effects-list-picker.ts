/**
 * effects-list-picker - Phase 38.1 deliverable.
 *
 * Scrollable list-picker for light effects (mdi:auto-fix). Mirrors the
 * saved-colors-picker pattern (P7) but with text rows instead of swatches.
 *
 * Behaviour (Stefan-2026-05-09 P38.1 R75: edit-mode long-press to remove)
 *   - Default mode (edit=false):
 *     - Tap an active row    -> emit `effect-pick` (apply / preview).
 *     - Long-press an active -> emit `enter-edit` (flips editMode=true).
 *     - Hidden effects are NOT visible.
 *   - Edit mode (edit=true): active rows + grayed-out section render.
 *     - Tap an active row    -> emit `effect-pick` (still apply).
 *     - Long-press active    -> emit `delete-effect` (move to grayed).
 *     - Tap a grayed row     -> emit `restore-effect` (move to bottom of active).
 *     - Tap outside any row  -> emit `exit-edit`.
 *   - No wiggle. No Done button. No "+ N hidden" chip.
 *   - Drag-reorder (P38.2): future, no implementation yet.
 *
 * Inputs
 *   .effects        Array<string>   - full effect_list from `light.attributes.effect_list`
 *                                      (sourced by the host; the picker doesn't read hass).
 *   .activeOrder    Array<string>   - explicit ordering of active effects (subset of `effects`).
 *                                      Anything in `effects` but not in `activeOrder` lands in
 *                                      the grayed-out section.
 *   .editMode       boolean         - wiggle visual indicator. Toggled via long-press on any
 *                                      row -> `enter-edit` event.
 *
 * Events (custom, bubbling + composed)
 *   effect-pick     {detail: {effect: string}}     active-tap (any mode) -> host applies effect
 *   delete-effect   {detail: {effect: string}}     active-long-press in edit-mode -> host hides
 *   restore-effect  {detail: {effect: string}}     grayed-tap (edit-mode) -> host unhides
 *   enter-edit      {}                             active-long-press in default mode
 *   exit-edit       {}                             tap outside any row in edit-mode
 *
 * Persistence note: the host owns `activeOrder`. The picker only emits
 * intent events; the host decides how to persist (in-memory @state for
 * MVP, or input_text helper for cross-session - Stefan-deferred to P38.2).
 */

import { LitElement, html, css, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { attachGestures } from '../helpers/gesture-detector.js';

@customElement('everyday-effects-list-picker')
export class EverydayEffectsListPicker extends LitElement {
  /** All effects available (raw light.attributes.effect_list). */
  @property({ attribute: false }) effects: string[] = [];

  /**
   * User's preferred active order (subset of `effects`). Effects in
   * `effects` but missing from `activeOrder` render in the grayed-out
   * section. When empty, the picker treats `effects` as the initial
   * active order (default-effects-population, Stefan-2026-05-09 P38.1
   * Feature 1).
   */
  @property({ attribute: false }) activeOrder: string[] = [];

  /** Edit-mode toggle (wiggle indicator). */
  @property({ type: Boolean, attribute: 'edit-mode' }) editMode = false;

  /**
   * Stefan-2026-05-11 P15.6-r63a (R288 / PA-0021): edit-mode default flipped
   * back to true. The earlier R230 (r49) default-false decision is reverted
   * — Stefan wants long-press → enter-edit to work out of the box, no opt-in
   * needed. Card config can still set `effects_picker.editable: false` to
   * suppress the edit-mode path for a strict pick-only surface.
   *
   * Original R75 (P38.1) flow:
   *   - default mode: active long-press → enter-edit
   *   - edit mode:    active long-press → delete-effect
   *   - grayed long-press is always a no-op (a grayed row's only action is
   *     restore-via-tap in edit-mode).
   */
  @property({ type: Boolean, attribute: 'editable' }) editable = true;

  /** Long-press timer threshold in ms (matches host's gesture config). */
  @property({ type: Number, attribute: 'long-press-ms' }) longPressMs = 200;

  private _gestureCleanups = new Map<HTMLElement, () => void>();

  protected updated(): void {
    for (const cleanup of this._gestureCleanups.values()) cleanup();
    this._gestureCleanups.clear();

    const rows = this.renderRoot.querySelectorAll('.row[data-effect]') as NodeListOf<HTMLElement>;
    rows.forEach((row) => {
      const effect = row.dataset.effect;
      const isGrayed = row.classList.contains('grayed');
      if (!effect) return;
      const dispose = attachGestures(row, {
        longPressMs: this.longPressMs,
        onTap: () => {
          // Stefan-2026-05-09 P38.1 R75:
          //   Active TAP (any mode)  → apply (preview the effect).
          //   Grayed TAP (edit only) → restore.
          if (isGrayed) {
            this._emit('restore-effect', { effect });
          } else {
            this._emit('effect-pick', { effect });
          }
        },
        onLongPress: () => {
          if (isGrayed) return;
          // Stefan-2026-05-09 P38.1 R75: long-press only removes when
          // already in edit-mode. In default mode it ENTERS edit-mode
          // (so the user can then long-press again to remove, or just
          // see the grayed section + restore items). Drag-reorder
          // future-binding will replace this in P38.2.
          //
          // Stefan-2026-05-10 P15.6-r49 (R230): the enter-edit path is
          // gated behind `editable` (default false). When the host has
          // not opted into editable mode the long-press is a no-op so
          // the popup stays a clean pick-only surface. Active-list
          // mutations + persistence per-light land post-launch.
          if (this.editMode) {
            this._emit('delete-effect', { effect });
          } else if (this.editable) {
            this._emit('enter-edit', {});
          }
        },
      });
      this._gestureCleanups.set(row, dispose);
    });
  }

  /**
   * Stefan-2026-05-09 P38.1 R68: tap outside any row in edit-mode exits
   * edit-mode (no Done button required). The host clears `editMode` on
   * receiving the `exit-edit` event.
   */
  private _onHostClick = (ev: MouseEvent): void => {
    if (!this.editMode) return;
    const target = ev.target as HTMLElement | null;
    // If the click landed on a row OR a child of a row, ignore — that
    // case is handled by the row's own gesture-detector.
    if (target?.closest('.row')) return;
    this._emit('exit-edit', {});
  };

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const cleanup of this._gestureCleanups.values()) cleanup();
    this._gestureCleanups.clear();
  }

  private _emit(eventName: string, detail: Record<string, unknown>): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _resolveOrder(): { active: string[]; grayed: string[] } {
    if (!this.activeOrder || this.activeOrder.length === 0) {
      return { active: [...this.effects], grayed: [] };
    }
    const activeSet = new Set(this.activeOrder);
    const active = this.activeOrder.filter((e) => this.effects.includes(e));
    const grayed = this.effects.filter((e) => !activeSet.has(e));
    return { active, grayed };
  }

  protected render(): TemplateResult {
    const { active, grayed } = this._resolveOrder();
    // Stefan-2026-05-09 P38.1 R65 + R75: hidden effects only render in
    // edit-mode. Default view = clean active list. To enter edit-mode,
    // user long-presses any active row (R75). To exit, user taps outside
    // any row (R68 still applies).
    const showGrayed = this.editMode && grayed.length > 0;
    return html`
      <div class="list" @click=${this._onHostClick}>
        ${active.length === 0
          ? html`<div class="empty">No effects available</div>`
          : null}
        ${active.map(
          (e) => html`
            <div class="row" data-effect=${e}>
              <span class="name">${e}</span>
              ${this.editMode ? html`<span class="hint">long-press to remove</span>` : null}
            </div>
          `,
        )}
        ${showGrayed
          ? html`<div class="divider" aria-hidden="true"></div>`
          : null}
        ${showGrayed
          ? grayed.map(
              (e) => html`
                <div class="row grayed" data-effect=${e}>
                  <span class="name">${e}</span>
                  <span class="hint">tap to restore</span>
                </div>
              `,
            )
          : null}
      </div>
    `;
  }

  static styles: CSSResult = css`
    :host {
      display: block;
      max-width: 280px;
      max-height: 60vh;
      overflow-y: auto;
      background: var(--card-background-color, #1d1f3a);
      border-radius: 18px;
      padding: 10px 6px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
      touch-action: none;
      color: var(--primary-text-color, #fff);
      font-family: var(--paper-font-body1_-_font-family);
      font-size: 14px;
      transition: background 120ms ease-out;
    }
    .row:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .row.grayed {
      color: var(--secondary-text-color, #888);
      opacity: 0.55;
    }
    .row.grayed:hover {
      background: rgba(255, 255, 255, 0.03);
      opacity: 0.85;
    }
    .name {
      flex: 1 1 auto;
      text-transform: capitalize;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hint {
      flex: 0 0 auto;
      font-size: 11px;
      opacity: 0.6;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 8px 12px;
    }
    .empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color, #888);
      font-style: italic;
      font-size: 13px;
    }
    /* Stefan-2026-05-09 P38.1 R66: no wiggle in edit-mode. */
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-effects-list-picker': EverydayEffectsListPicker;
  }
}
