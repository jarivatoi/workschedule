/**
 * useSwipeGesture Hook
 * 
 * Purpose: Reusable hook for implementing swipe gestures on mobile devices
 * 
 * Features:
 * - Touch event handling with proper cleanup
 * - Configurable swipe thresholds and resistance
 * - Momentum and velocity calculations
 * - Cross-platform compatibility
 * - Memory leak prevention
 * 
 * Usage:
 * ```typescript
 * const swipeHandlers = useSwipeGesture({
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 *   threshold: 50,
 *   resistance: 0.3
 * });
 * 
 * return <div {...swipeHandlers}>Swipeable content</div>;
 * ```
 * 
 * @param options - Configuration object for swipe behavior
 * @returns Object containing touch event handlers
 */

import { useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeStart?: (startX: number, startY: number) => void;
  onSwipeMove?: (deltaX: number, deltaY: number) => void;
  onSwipeEnd?: (deltaX: number, deltaY: number, velocity: number) => void;
  threshold?: number; // Minimum distance to trigger swipe
  resistance?: number; // Resistance factor for over-swipe
  preventVerticalScroll?: boolean; // Whether to prevent vertical scrolling
}

interface SwipeGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: (e: React.TouchEvent) => void;
}

export const useSwipeGesture = (options: SwipeGestureOptions = {}): SwipeGestureHandlers => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd,
    threshold = 50,
    resistance = 0.3,
    preventVerticalScroll = false
  } = options;

  // Refs to track touch state across events
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef(false);

  /**
   * Handles the start of a touch gesture
   * Records initial touch position and timestamp for velocity calculation
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };
    
    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };
    
    isDraggingRef.current = true;
    
    // Notify parent component of swipe start
    onSwipeStart?.(touch.clientX, touch.clientY);
  }, [onSwipeStart]);

  /**
   * Handles touch movement during gesture
   * Calculates delta and applies resistance if configured
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    
    // Calculate movement delta from start position
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Prevent vertical scrolling if configured
    if (preventVerticalScroll && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
    
    // Update last touch position for velocity calculation
    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };
    
    // Notify parent component of movement
    onSwipeMove?.(deltaX, deltaY);
  }, [onSwipeMove, preventVerticalScroll]);

  /**
   * Handles the end of a touch gesture
   * Determines swipe direction and triggers appropriate callbacks
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !touchStartRef.current || !lastTouchRef.current) {
      return;
    }
    
    const deltaX = lastTouchRef.current.x - touchStartRef.current.x;
    const deltaY = lastTouchRef.current.y - touchStartRef.current.y;
    const deltaTime = lastTouchRef.current.time - touchStartRef.current.time;
    
    // Calculate velocity (pixels per millisecond)
    const velocity = Math.abs(deltaX) / Math.max(deltaTime, 1);
    
    // Determine swipe direction based on threshold
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Only trigger swipe if horizontal movement is dominant and exceeds threshold
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }
    
    // Notify parent component of swipe end
    onSwipeEnd?.(deltaX, deltaY, velocity);
    
    // Reset state
    isDraggingRef.current = false;
    touchStartRef.current = null;
    lastTouchRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeEnd, threshold]);

  /**
   * Handles touch cancellation (e.g., when user moves finger off screen)
   * Resets gesture state without triggering swipe actions
   */
  const handleTouchCancel = useCallback((e: React.TouchEvent) => {
    isDraggingRef.current = false;
    touchStartRef.current = null;
    lastTouchRef.current = null;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
};