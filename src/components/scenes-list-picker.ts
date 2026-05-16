/**
 * scenes-list-picker - Stefan-2026-05-16 PA-0001, edit-mode added PA-0005.
 *
 * Scrollable list-picker for HA scenes. Mirrors `effects-list-picker.ts`:
 *
 *   - Default mode (editMode=false):
 *     - Tap an active row    -> emit `scene-pick` (fire `scene.turn_on`).
 *     - Long-press an active -> emit `enter-edit` (host flips editMode=true).
 *     - Hidden scenes are NOT visible.
 *   - Edit mode (editMode=true): active rows + grayed-out section render.
 *     - Tap an active row    -> emit `scene-pick` (still fires).
 *     - Long-press active    -> emit `delete-scene` (move to grayed).
 *     - Tap a grayed row     -> emit `restore-scene` (move to bottom of active).
 *     - Tap outside any row  -> emit `exit-edit`.
 *
 * Inputs
 *   .scenes        Array<{id, name}>  - resolved by scenes-discovery (Hue
 *                                       group_name match + entity_id
 *                                       intersection unioned).
 *   .activeOrder   Array<string>      - explicit ordering of active scene ids
 *                                       (subset of `scenes.map(s => s.id)`).
 *                                       Ids in `scenes` but not in
 *                                       `activeOrder` render in the grayed-out
 *                                       section. When empty, the picker
 *                                       treats every scene as active.
 *   .editMode      boolean            - toggles default ↔ edit-mode view.
 *   .editable      boolean            - default true. Set false to suppress
 *                                       the edit-mode enter path (pick-only).
 *   .longPressMs   number             - matches host's gesture config.
 *
 * Events (custom, bubbling + composed)
 *   scene-pick     {detail: {id: string}}     tap an active row, any mode.
 *   delete-scene   {detail: {id: string}}     long-press active in edit-mode.
 *   restore-scene  {detail: {id: string}}     tap a grayed row in edit-mode.
 *   enter-edit     {}                          long-press active in default mode.
 *   exit-edit      {}                          tap outside any row in edit-mode.
 *
 * Persistence note: the host owns `activeOrder`. The picker only emits
 * intent events; the host decides how to persist
 * (`scenes_picker.source: helper:input_text.<id>` mirrors effects).
 */

import { LitElement, html, css, type CSSResult, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { attachGestures } from '../helpers/gesture-detector.js';

export interface SceneRow {
  id: string;
  name: string;
}

@customElement('everyday-scenes-list-picker')
export class EverydayScenesListPicker extends LitElement {
  /** Resolved list of scenes to render (alphabetical by name from helper). */
  @property({ attribute: false }) scenes: SceneRow[] = [];

  /**
   * User's preferred active order (subset of `scenes` ids). Ids in
   * `scenes` but missing from `activeOrder` render in the grayed-out
   * section (visible only when `editMode` is true). When empty the picker
   * treats every scene as active (default-population, mirrors
   * effects-list-picker's behaviour).
   */
  @property({ attribute: false }) activeOrder: string[] = [];

  /** Edit-mode toggle. Default false; host flips on `enter-edit` event. */
  @property({ type: Boolean, attribute: 'edit-mode' }) editMode = false;

  /**
   * Stefan-2026-05-16 PA-0005: default edit-mode ON (mirrors effects-list-
   * picker since R288 / 2026-05-11 PA-0021). Long-press → enter-edit
   * works out of the box. Card config can still set
   * `scenes_picker.editable: false` to suppress the edit path for a
   * strict pick-only surface (e.g. a guest tablet).
   */
  @property({ type: Boolean, attribute: 'editable' }) editable = true;

  /** Long-press timer threshold in ms (matches host's gesture config). */
  @property({ type: Number, attribute: 'long-press-ms' }) longPressMs = 200;

  private _gestureCleanups = new Map<HTMLElement, () => void>();

  protected updated(): void {
    for (const cleanup of this._gestureCleanups.values()) cleanup();
    this._gestureCleanups.clear();

    const rows = this.renderRoot.querySelectorAll('.row[data-scene]') as NodeListOf<HTMLElement>;
    rows.forEach((row) => {
      const sceneId = row.dataset.scene;
      const isGrayed = row.classList.contains('grayed');
      if (!sceneId) return;
      const dispose = attachGestures(row, {
        longPressMs: this.longPressMs,
        onTap: () => {
          // Mirrors effects-list-picker:
          //   Active tap (any mode)  → scene-pick (fire scene.turn_on).
          //   Grayed tap (edit only) → restore-scene.
          if (isGrayed) {
            this._emit('restore-scene', { id: sceneId });
          } else {
            this._emit('scene-pick', { id: sceneId });
          }
        },
        onLongPress: () => {
          if (isGrayed) return;
          // Active long-press:
          //   - In edit-mode → delete-scene (move to grayed section).
          //   - In default mode AND editable → enter-edit.
          //   - In default mode AND !editable → no-op (pick-only surface).
          if (this.editMode) {
            this._emit('delete-scene', { id: sceneId });
          } else if (this.editable) {
            this._emit('enter-edit', {});
          }
        },
      });
      this._gestureCleanups.set(row, dispose);
    });
  }

  /**
   * Tap outside any row in edit-mode → exit-edit. Host clears `editMode`
   * on receiving the event. Mirrors effects-list-picker behaviour.
   */
  private _onHostClick = (ev: MouseEvent): void => {
    if (!this.editMode) return;
    const target = ev.target as HTMLElement | null;
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

  private _resolveOrder(): { active: SceneRow[]; grayed: SceneRow[] } {
    if (!this.activeOrder || this.activeOrder.length === 0) {
      return { active: [...this.scenes], grayed: [] };
    }
    const activeSet = new Set(this.activeOrder);
    // Active = scenes whose id IS in activeOrder, preserving activeOrder
    // sequence (so user-curated order survives re-render).
    const sceneById = new Map(this.scenes.map((s) => [s.id, s]));
    const active: SceneRow[] = [];
    for (const id of this.activeOrder) {
      const row = sceneById.get(id);
      if (row) active.push(row);
    }
    // Grayed = scenes whose id is NOT in activeOrder, preserving the
    // alphabetical sort from discovery.
    const grayed = this.scenes.filter((s) => !activeSet.has(s.id));
    return { active, grayed };
  }

  protected render(): TemplateResult {
    const { active, grayed } = this._resolveOrder();
    const showGrayed = this.editMode && grayed.length > 0;
    return html`
      <div class="list" @click=${this._onHostClick}>
        ${active.length === 0
          ? html`<div class="empty">No scenes available</div>`
          : null}
        ${active.map(
          (s) => html`
            <div class="row" data-scene=${s.id}>
              <span class="name">${s.name}</span>
              ${this.editMode ? html`<span class="hint">long-press to remove</span>` : null}
            </div>
          `,
        )}
        ${showGrayed ? html`<div class="divider" aria-hidden="true"></div>` : null}
        ${showGrayed
          ? grayed.map(
              (s) => html`
                <div class="row grayed" data-scene=${s.id}>
                  <span class="name">${s.name}</span>
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'everyday-scenes-list-picker': EverydayScenesListPicker;
  }
}
