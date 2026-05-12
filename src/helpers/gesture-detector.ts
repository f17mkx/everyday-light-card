/**
 * gesture-detector - lightweight pointer-event helper.
 *
 * Replaces fragile YAML hold_action/double_tap_action wiring (CONCEPT.md
 * "Gestures via PointerEvents") with deterministic JS detection that works
 * across mouse, touch, and pen.
 *
 * Detected gestures
 *   - tap          single quick press-release within `tapMaxMs` and < `dragThresholdPx` movement.
 *   - longPress    pointer held ≥ `longPressMs` without moving > `dragThresholdPx`.
 *   - doubleTap    two taps within `doubleTapMs` of each other (second tap suppresses single-tap).
 *
 * Behavior notes
 *   - pointermove > dragThresholdPx cancels both long-press timer and tap detection
 *     (the user is clearly dragging, not gesturing).
 *   - longPress fires *during* the gesture (at the timer point); the subsequent
 *     pointerup is suppressed so the consumer doesn't get a stray tap as well.
 *   - doubleTap is opt-in: if `onDoubleTap` is omitted, second taps fire as ordinary taps.
 *
 * Returns a `dispose()` function that removes all listeners and clears any
 * pending timers - call this from the component's disconnectedCallback.
 */

export interface GestureOptions {
  onTap?: (ev: PointerEvent) => void;
  onLongPress?: (ev: PointerEvent) => void;
  onDoubleTap?: (ev: PointerEvent) => void;
  /**
   * Stefan-2026-05-12 R326 (PA-0007 deep-dive): fires synchronously inside
   * `pointerdown`, BEFORE any long-press timer. Use to pre-emptively
   * acquire scroll-lock at gesture-start — the W3C pointer-events-3 spec
   * freezes the touch-action chain at the FIRST pointerdown, so mutating
   * `documentElement.style.touchAction` 200ms later (when long-press fires)
   * is too late: iOS Safari / Android Chromium have already committed to a
   * scroll. Pair with `onPointerDownRelease` to drop the lock when the
   * sequence ends WITHOUT a long-press (regular tap, drag-cancel).
   */
  onPointerDownLock?: (ev: PointerEvent) => void;
  /**
   * Fires when the pointer sequence ends WITHOUT firing long-press: regular
   * tap, drag-threshold-exceeded, or pointercancel. Pair with
   * `onPointerDownLock` to release pre-emptive resource acquisitions. When
   * long-press DID fire (picker opened), the lock release should happen via
   * the picker's own close path instead — release is suppressed here.
   */
  onPointerDownRelease?: (ev: PointerEvent) => void;
  /**
   * Fired on every `pointermove` AFTER `onLongPress` has fired. Use this to
   * implement the "press, hold, drag-to-select" gesture - the consumer
   * receives live cursor positions while the user keeps their finger down.
   * Pointer capture and stopPropagation are applied internally so the
   * dashboard's swipe-navigation plugin (or other ancestor handlers) don't
   * hijack the pointer once the drag-select gesture is active.
   */
  onLongPressMove?: (ev: PointerEvent) => void;
  /**
   * Fired once on `pointerup` / `pointercancel` AFTER `onLongPress` has fired.
   * Pair with `onLongPressMove` to commit a press-drag-select selection.
   */
  onLongPressEnd?: (ev: PointerEvent) => void;
  /** ms before pointerdown is treated as a long-press. Default 200 (was 500 pre-P7-polish). */
  longPressMs?: number;
  /** Max ms between pointerdown and pointerup to count as a tap. Default 300. */
  tapMaxMs?: number;
  /** Max ms between two taps to count as a double-tap. Default 300. */
  doubleTapMs?: number;
  /** Movement (px) that cancels long-press detection. Default 8. */
  dragThresholdPx?: number;
}

export function attachGestures(target: HTMLElement, opts: GestureOptions): () => void {
  const longPressMs = opts.longPressMs ?? 200;
  const tapMaxMs = opts.tapMaxMs ?? 300;
  const doubleTapMs = opts.doubleTapMs ?? 300;
  const dragThresholdPx = opts.dragThresholdPx ?? 8;

  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerDownAt = 0;
  let activePointerId: number | null = null;
  let longPressTimer: number | null = null;
  let longPressFired = false;
  let lastTapAt = 0;
  let pendingTapTimer: number | null = null;
  let pendingTapEvent: PointerEvent | null = null;

  const clearLongPress = (): void => {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };
  const clearPendingTap = (): void => {
    if (pendingTapTimer !== null) {
      clearTimeout(pendingTapTimer);
      pendingTapTimer = null;
    }
    pendingTapEvent = null;
  };

  const releaseCapture = (): void => {
    if (activePointerId !== null) {
      try {
        target.releasePointerCapture(activePointerId);
      } catch {
        /* may already be released */
      }
    }
    activePointerId = null;
  };

  const onPointerDown = (ev: PointerEvent): void => {
    if (ev.button !== undefined && ev.button !== 0) return;
    pointerStartX = ev.clientX;
    pointerStartY = ev.clientY;
    pointerDownAt = Date.now();
    activePointerId = ev.pointerId;
    longPressFired = false;
    // Stefan-2026-05-12 R326 (PA-0007 deep-dive): acquire scroll-lock at
    // gesture-start, NOT in the long-press callback. The browser freezes the
    // touch-action chain at this very pointerdown — late mutations don't
    // unwind a scroll commit.
    opts.onPointerDownLock?.(ev);
    if (opts.onLongPress) {
      clearLongPress();
      longPressTimer = window.setTimeout(() => {
        longPressTimer = null;
        longPressFired = true;
        // Capture the pointer so subsequent move/up events keep flowing to
        // this target even when the finger leaves its bounding box (over the
        // mode-picker dots that orbit outside the tile). Also blocks
        // ancestor handlers like HA's swipe-navigation plugin from claiming
        // the pointer mid-gesture.
        try {
          target.setPointerCapture(ev.pointerId);
        } catch {
          /* not supported - degrade gracefully, document still emits events */
        }
        // Cancel any pending single-tap waiting for double-tap window;
        // long-press supersedes both.
        clearPendingTap();
        opts.onLongPress?.(ev);
      }, longPressMs);
    }
  };

  const onPointerMove = (ev: PointerEvent): void => {
    if (longPressFired) {
      // Press-drag-select flow. Block ancestors (swipe-nav etc.) from seeing
      // these moves; forward to the consumer.
      ev.stopPropagation();
      opts.onLongPressMove?.(ev);
      return;
    }
    const dx = ev.clientX - pointerStartX;
    const dy = ev.clientY - pointerStartY;
    if (dx * dx + dy * dy > dragThresholdPx * dragThresholdPx) {
      // User started dragging before long-press fired - cancel detection.
      clearLongPress();
    }
  };

  const onPointerUp = (ev: PointerEvent): void => {
    clearLongPress();
    if (longPressFired) {
      // Press-drag-select end - fire the end handler with the final pointer
      // position so the consumer can commit the selection. The picker is
      // open; its close path (mode-pick / outside-click) releases the
      // R326 scroll-lock via the controller's _setPickerOpen(false).
      opts.onLongPressEnd?.(ev);
      releaseCapture();
      return;
    }
    releaseCapture();
    // Stefan-2026-05-12 R326: tap-only path (no long-press fired). Release
    // the pre-emptive scroll-lock so normal page-scroll resumes after the
    // tap completes.
    opts.onPointerDownRelease?.(ev);
    const dt = Date.now() - pointerDownAt;
    const dx = ev.clientX - pointerStartX;
    const dy = ev.clientY - pointerStartY;
    const movedTooMuch = dx * dx + dy * dy > dragThresholdPx * dragThresholdPx;
    if (dt > tapMaxMs || movedTooMuch) return;

    // Got a tap. Decide whether it completes a double-tap or starts one.
    const now = Date.now();
    if (opts.onDoubleTap && now - lastTapAt < doubleTapMs && pendingTapEvent) {
      // Second tap within window - fire double-tap, cancel pending single-tap.
      clearPendingTap();
      lastTapAt = 0;
      opts.onDoubleTap(ev);
      return;
    }
    lastTapAt = now;
    if (opts.onDoubleTap) {
      // Defer single-tap fire until the double-tap window closes; if a second
      // tap arrives in time, the branch above cancels this.
      pendingTapEvent = ev;
      pendingTapTimer = window.setTimeout(() => {
        pendingTapTimer = null;
        const tapEv = pendingTapEvent;
        pendingTapEvent = null;
        if (tapEv && opts.onTap) opts.onTap(tapEv);
      }, doubleTapMs);
    } else if (opts.onTap) {
      opts.onTap(ev);
    }
  };

  const onPointerCancel = (ev: PointerEvent): void => {
    clearLongPress();
    if (longPressFired) {
      // Treat cancel as end so the consumer can drop any in-progress selection.
      // The picker's close path will release the R326 scroll-lock.
      opts.onLongPressEnd?.(ev);
    } else {
      // Stefan-2026-05-12 R326: cancel before long-press fired (drag, system
      // gesture, etc.). Release the pre-emptive scroll-lock since no picker
      // will open.
      opts.onPointerDownRelease?.(ev);
    }
    longPressFired = false;
    releaseCapture();
  };

  target.addEventListener('pointerdown', onPointerDown);
  target.addEventListener('pointermove', onPointerMove);
  target.addEventListener('pointerup', onPointerUp);
  target.addEventListener('pointercancel', onPointerCancel);

  return (): void => {
    target.removeEventListener('pointerdown', onPointerDown);
    target.removeEventListener('pointermove', onPointerMove);
    target.removeEventListener('pointerup', onPointerUp);
    target.removeEventListener('pointercancel', onPointerCancel);
    clearLongPress();
    clearPendingTap();
  };
}
