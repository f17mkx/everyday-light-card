/**
 * Tests for `helpers/gesture-detector.ts` — the pointer-event helper that
 * powers tap / long-press / double-tap / press-drag-select gestures.
 *
 * Stefan-2026-05-10 P16-extra: covers the gesture state machine using
 * vitest fake timers so timing-sensitive branches (longPress threshold,
 * doubleTap window, tapMaxMs) deterministically fire without real-time
 * delays.
 *
 * Limitations of happy-dom:
 *   - PointerEvent is supported but `setPointerCapture` is a no-op in
 *     happy-dom (logs a stub). Tests don't depend on capture working.
 *   - clientX/clientY come from the dispatched event init dict.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachGestures } from '../src/helpers/gesture-detector.js';

/** Build a PointerEvent that happy-dom + the gesture-detector accept. */
function pointerEvent(type: string, init: { x?: number; y?: number; pointerId?: number } = {}): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.x ?? 0,
    clientY: init.y ?? 0,
    pointerId: init.pointerId ?? 1,
    button: 0,
  });
}

describe('attachGestures', () => {
  let target: HTMLElement;
  let dispose: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    target = document.createElement('div');
    document.body.appendChild(target);
  });

  afterEach(() => {
    if (dispose) dispose();
    target.remove();
    vi.useRealTimers();
  });

  describe('tap', () => {
    it('fires onTap on quick down+up under 300 ms', () => {
      const onTap = vi.fn();
      dispose = attachGestures(target, { onTap });
      target.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
      target.dispatchEvent(pointerEvent('pointerup', { x: 100, y: 100 }));
      expect(onTap).toHaveBeenCalledTimes(1);
    });

    it('does NOT fire onTap when up takes longer than tapMaxMs', () => {
      const onTap = vi.fn();
      dispose = attachGestures(target, { onTap, tapMaxMs: 50 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      vi.advanceTimersByTime(100);
      target.dispatchEvent(pointerEvent('pointerup'));
      expect(onTap).not.toHaveBeenCalled();
    });

    it('does NOT fire onTap when finger moves > dragThresholdPx', () => {
      const onTap = vi.fn();
      dispose = attachGestures(target, { onTap, dragThresholdPx: 5 });
      target.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
      target.dispatchEvent(pointerEvent('pointermove', { x: 110, y: 100 }));
      target.dispatchEvent(pointerEvent('pointerup', { x: 110, y: 100 }));
      expect(onTap).not.toHaveBeenCalled();
    });
  });

  describe('long-press', () => {
    it('fires onLongPress after longPressMs without movement', () => {
      const onLongPress = vi.fn();
      dispose = attachGestures(target, { onLongPress, longPressMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      vi.advanceTimersByTime(200);
      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('does NOT fire onLongPress when finger lifts before threshold', () => {
      const onLongPress = vi.fn();
      dispose = attachGestures(target, { onLongPress, longPressMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      vi.advanceTimersByTime(100);
      target.dispatchEvent(pointerEvent('pointerup'));
      vi.advanceTimersByTime(200);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('does NOT fire onLongPress when movement exceeds dragThresholdPx', () => {
      const onLongPress = vi.fn();
      dispose = attachGestures(target, { onLongPress, longPressMs: 200, dragThresholdPx: 5 });
      target.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
      target.dispatchEvent(pointerEvent('pointermove', { x: 110, y: 100 }));
      vi.advanceTimersByTime(200);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('fires onLongPressMove + onLongPressEnd for press-drag-select', () => {
      const onLongPress = vi.fn();
      const onLongPressMove = vi.fn();
      const onLongPressEnd = vi.fn();
      dispose = attachGestures(target, { onLongPress, onLongPressMove, onLongPressEnd, longPressMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown', { x: 100, y: 100 }));
      vi.advanceTimersByTime(200);
      expect(onLongPress).toHaveBeenCalledTimes(1);
      target.dispatchEvent(pointerEvent('pointermove', { x: 150, y: 100 }));
      target.dispatchEvent(pointerEvent('pointermove', { x: 200, y: 100 }));
      expect(onLongPressMove).toHaveBeenCalledTimes(2);
      target.dispatchEvent(pointerEvent('pointerup', { x: 200, y: 100 }));
      expect(onLongPressEnd).toHaveBeenCalledTimes(1);
    });

    it('long-press suppresses subsequent tap on the same gesture', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      dispose = attachGestures(target, { onTap, onLongPress, longPressMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      vi.advanceTimersByTime(200);
      target.dispatchEvent(pointerEvent('pointerup'));
      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(onTap).not.toHaveBeenCalled();
    });
  });

  describe('double-tap', () => {
    it('fires onDoubleTap when two taps land within doubleTapMs', () => {
      const onTap = vi.fn();
      const onDoubleTap = vi.fn();
      dispose = attachGestures(target, { onTap, onDoubleTap, doubleTapMs: 300 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      target.dispatchEvent(pointerEvent('pointerup'));
      vi.advanceTimersByTime(100);
      target.dispatchEvent(pointerEvent('pointerdown'));
      target.dispatchEvent(pointerEvent('pointerup'));
      expect(onDoubleTap).toHaveBeenCalledTimes(1);
      expect(onTap).not.toHaveBeenCalled();
    });

    it('falls back to onTap when second tap is too late', () => {
      const onTap = vi.fn();
      const onDoubleTap = vi.fn();
      dispose = attachGestures(target, { onTap, onDoubleTap, doubleTapMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      target.dispatchEvent(pointerEvent('pointerup'));
      // Wait > doubleTapMs so the deferred single-tap fires first
      vi.advanceTimersByTime(250);
      expect(onTap).toHaveBeenCalledTimes(1);
      // Second tap is now treated as a fresh single-tap waiting for its own
      // double-tap window.
      target.dispatchEvent(pointerEvent('pointerdown'));
      target.dispatchEvent(pointerEvent('pointerup'));
      vi.advanceTimersByTime(250);
      expect(onTap).toHaveBeenCalledTimes(2);
      expect(onDoubleTap).not.toHaveBeenCalled();
    });

    it('without onDoubleTap configured, taps fire immediately as onTap', () => {
      const onTap = vi.fn();
      dispose = attachGestures(target, { onTap });
      target.dispatchEvent(pointerEvent('pointerdown'));
      target.dispatchEvent(pointerEvent('pointerup'));
      // No doubleTapMs deferral — onTap fires synchronously on pointerup.
      expect(onTap).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel', () => {
    it('pointercancel clears long-press timer', () => {
      const onLongPress = vi.fn();
      dispose = attachGestures(target, { onLongPress, longPressMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      vi.advanceTimersByTime(100);
      target.dispatchEvent(pointerEvent('pointercancel'));
      vi.advanceTimersByTime(200);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('pointercancel after long-press fires onLongPressEnd', () => {
      const onLongPress = vi.fn();
      const onLongPressEnd = vi.fn();
      dispose = attachGestures(target, { onLongPress, onLongPressEnd, longPressMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      vi.advanceTimersByTime(200);
      target.dispatchEvent(pointerEvent('pointercancel'));
      expect(onLongPressEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispose', () => {
    it('removes all listeners after dispose() called', () => {
      const onTap = vi.fn();
      const localDispose = attachGestures(target, { onTap });
      localDispose();
      target.dispatchEvent(pointerEvent('pointerdown'));
      target.dispatchEvent(pointerEvent('pointerup'));
      expect(onTap).not.toHaveBeenCalled();
      // Override the outer-scope dispose so afterEach doesn't double-call.
      dispose = () => undefined;
    });

    it('clears pending long-press timer on dispose', () => {
      const onLongPress = vi.fn();
      const localDispose = attachGestures(target, { onLongPress, longPressMs: 200 });
      target.dispatchEvent(pointerEvent('pointerdown'));
      vi.advanceTimersByTime(100);
      localDispose();
      vi.advanceTimersByTime(200);
      expect(onLongPress).not.toHaveBeenCalled();
      dispose = () => undefined;
    });
  });

  describe('edge cases', () => {
    it('ignores non-primary mouse buttons', () => {
      const onTap = vi.fn();
      dispose = attachGestures(target, { onTap });
      target.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        button: 2,  // right-click
        pointerId: 1,
      }));
      target.dispatchEvent(pointerEvent('pointerup'));
      expect(onTap).not.toHaveBeenCalled();
    });
  });
});
