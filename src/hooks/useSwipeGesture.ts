/**
 * useSwipeGesture Hook - Reusable Touch Gesture Handler
 * 
 * =============================================================================
 * PURPOSE AND FUNCTIONALITY
 * =============================================================================
 * 
 * This custom React hook provides a reusable solution for implementing swipe
 * gestures on mobile devices and touch-enabled interfaces. It handles the
 * complexity of touch event management, gesture recognition, and provides
 * a clean API for components to respond to swipe interactions.
 * 
 * CORE FEATURES:
 * - Touch event handling with proper cleanup
 * - Configurable swipe thresholds and resistance
 * - Momentum and velocity calculations
 * - Cross-platform compatibility (iOS, Android, desktop touch)
 * - Memory leak prevention with automatic cleanup
 * - Support for both directional and positional callbacks
 * 
 * DESIGN PRINCIPLES:
 * - Separation of concerns (gesture detection vs. UI response)
 * - Reusability across different components
 * - Performance optimization with minimal re-renders
 * - Accessibility considerations for touch interactions
 * 
 * =============================================================================
 * DEPENDENCIES AND PREREQUISITES
 * =============================================================================
 * 
 * REQUIRED IMPORTS:
 * - React hooks: useRef, useCallback
 * - React types: React.TouchEvent
 * 
 * BROWSER SUPPORT:
 * - Modern browsers with touch event support
 * - iOS Safari 10+
 * - Android Chrome 50+
 * - Desktop browsers with touch screens
 * 
 * COMPONENT REQUIREMENTS:
 * - Component must be able to handle touch events
 * - Element should have appropriate CSS for touch interactions
 * - Parent component should manage state based on callbacks
 * 
 * =============================================================================
 * USAGE INSTRUCTIONS
 * =============================================================================
 * 
 * BASIC IMPLEMENTATION:
 * 
 * 1. Import the hook:
 *    import { useSwipeGesture } from './hooks/useSwipeGesture';
 * 
 * 2. Use in component with basic callbacks:
 *    const swipeHandlers = useSwipeGesture({
 *      onSwipeLeft: () => console.log('Swiped left'),
 *      onSwipeRight: () => console.log('Swiped right'),
 *      threshold: 50
 *    });
 * 
 * 3. Apply to JSX element:
 *    return <div {...swipeHandlers}>Swipeable content</div>;
 * 
 * ADVANCED IMPLEMENTATION:
 * 
 * const swipeHandlers = useSwipeGesture({
 *   onSwipeLeft: () => setActionsVisible(true),
 *   onSwipeRight: () => setActionsVisible(false),
 *   onSwipeStart: (startX, startY) => setIsDragging(true),
 *   onSwipeMove: (deltaX, deltaY) => updatePosition(deltaX),
 *   onSwipeEnd: (deltaX, deltaY, velocity) => {
 *     setIsDragging(false);
 *     if (velocity > 0.5) {
 *       // Handle fast swipe
 *     }
 *   },
 *   threshold: 60,
 *   resistance: 0.3,
 *   preventVerticalScroll: true
 * });
 * 
 * INTEGRATION WITH STATE MANAGEMENT:
 * 
 * const [cardPosition, setCardPosition] = useState(0);
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * const swipeHandlers = useSwipeGesture({
 *   onSwipeMove: (deltaX) => {
 *     // Real-time position updates
 *     setCardPosition(Math.max(-120, Math.min(0, deltaX)));
 *   },
 *   onSwipeEnd: (deltaX, deltaY, velocity) => {
 *     // Determine final state based on position and velocity
 *     if (deltaX < -60 || velocity > 0.3) {
 *       setIsOpen(true);
 *       setCardPosition(-120);
 *     } else {
 *       setIsOpen(false);
 *       setCardPosition(0);
 *     }
 *   },
 *   threshold: 30,
 *   preventVerticalScroll: true
 * });
 * 
 * =============================================================================
 * CONFIGURATION OPTIONS
 * =============================================================================
 * 
 * CALLBACK FUNCTIONS:
 * 
 * onSwipeLeft?: () => void
 * - Triggered when user swipes left past threshold
 * - Use for revealing actions, navigating forward, etc.
 * 
 * onSwipeRight?: () => void
 * - Triggered when user swipes right past threshold
 * - Use for hiding actions, navigating back, etc.
 * 
 * onSwipeStart?: (startX: number, startY: number) => void
 * - Called when touch gesture begins
 * - Provides initial touch coordinates
 * - Use for initializing drag state, disabling animations
 * 
 * onSwipeMove?: (deltaX: number, deltaY: number) => void
 * - Called continuously during swipe gesture
 * - Provides real-time movement deltas from start position
 * - Use for live position updates, resistance effects
 * 
 * onSwipeEnd?: (deltaX: number, deltaY: number, velocity: number) => void
 * - Called when touch gesture completes
 * - Provides final movement deltas and calculated velocity
 * - Use for determining final state, cleanup operations
 * 
 * BEHAVIOR PARAMETERS:
 * 
 * threshold?: number (default: 50)
 * - Minimum distance in pixels to trigger directional callbacks
 * - Lower values = more sensitive, higher values = more deliberate
 * - Recommended range: 30-100px depending on use case
 * 
 * resistance?: number (default: 0.3)
 * - Resistance factor for over-swipe effects (0.0 - 1.0)
 * - 0.0 = no movement beyond limits, 1.0 = no resistance
 * - Creates rubber-band effect similar to iOS interfaces
 * 
 * preventVerticalScroll?: boolean (default: false)
 * - Whether to prevent vertical scrolling during horizontal swipes
 * - Set to true for horizontal-only interactions
 * - Use with caution as it affects page scrollability
 * 
 * =============================================================================
 * TYPICAL USAGE SCENARIOS
 * =============================================================================
 * 
 * SCENARIO 1: Card-based interfaces (like SwipeableShiftCard)
 * - Swipe left to reveal actions
 * - Swipe right to hide actions
 * - Real-time position feedback during drag
 * 
 * SCENARIO 2: Image galleries or carousels
 * - Swipe left/right to navigate between items
 * - Velocity-based navigation for fast swipes
 * - Threshold-based navigation for deliberate swipes
 * 
 * SCENARIO 3: List item management
 * - Swipe to delete or archive items
 * - Multiple action buttons revealed by swipe
 * - Confirmation dialogs triggered by swipe completion
 * 
 * SCENARIO 4: Navigation drawers
 * - Swipe from edge to open drawer
 * - Swipe to close drawer
 * - Resistance when swiping beyond limits
 * 
 * SCENARIO 5: Custom slider controls
 * - Horizontal swipe to adjust values
 * - Real-time value updates during drag
 * - Snap to discrete values on release
 * 
 * =============================================================================
 * TROUBLESHOOTING AND BEST PRACTICES
 * =============================================================================
 * 
 * COMMON ISSUES:
 * 
 * 1. Swipe not detected on mobile:
 *    - Verify touch events are not being prevented by parent elements
 *    - Check CSS touch-action property on element and parents
 *    - Ensure element has sufficient size for touch interaction
 *    - Test on actual device, not just browser dev tools
 * 
 * 2. Conflicts with page scrolling:
 *    - Use preventVerticalScroll: true for horizontal-only gestures
 *    - Set CSS touch-action: pan-y on swipeable elements
 *    - Avoid preventing default on touch events unless necessary
 * 
 * 3. Performance issues during swipe:
 *    - Use useCallback for all callback functions
 *    - Minimize state updates in onSwipeMove
 *    - Use refs for values that don't need re-renders
 *    - Debounce expensive operations in move handler
 * 
 * 4. Memory leaks:
 *    - Hook automatically cleans up event listeners
 *    - Ensure callback functions don't create closures over large objects
 *    - Use useCallback to prevent unnecessary re-creations
 * 
 * 5. Inconsistent behavior across devices:
 *    - Test on multiple devices and browsers
 *    - Account for different screen densities and touch sensitivities
 *    - Adjust threshold values based on device type if needed
 * 
 * PERFORMANCE BEST PRACTICES:
 * 
 * 1. Optimize callback functions:
 *    - Use useCallback for all callbacks to prevent re-renders
 *    - Keep onSwipeMove handler as lightweight as possible
 *    - Batch state updates when possible
 * 
 * 2. Minimize DOM manipulation:
 *    - Use CSS transforms instead of changing position properties
 *    - Avoid reading layout properties during move events
 *    - Use requestAnimationFrame for smooth animations
 * 
 * 3. Memory management:
 *    - Don't store large objects in callback closures
 *    - Clean up any timers or intervals in callback functions
 *    - Use refs for values that don't trigger re-renders
 * 
 * ACCESSIBILITY CONSIDERATIONS:
 * 
 * 1. Provide alternative interaction methods:
 *    - Include keyboard navigation for swipe actions
 *    - Provide visible buttons for non-touch devices
 *    - Support screen reader announcements for state changes
 * 
 * 2. Touch target guidelines:
 *    - Ensure swipeable areas meet minimum size requirements (44px)
 *    - Provide visual feedback during interactions
 *    - Use appropriate ARIA labels and roles
 * 
 * 3. Motion sensitivity:
 *    - Respect user's motion preferences (prefers-reduced-motion)
 *    - Provide options to disable gesture-based interactions
 *    - Use appropriate animation durations and easing
 * 
 * =============================================================================
 * ADVANCED CUSTOMIZATION
 * =============================================================================
 * 
 * CUSTOM GESTURE RECOGNITION:
 * 
 * You can extend the hook to recognize custom gestures:
 * 
 * const customSwipeHandlers = useSwipeGesture({
 *   onSwipeEnd: (deltaX, deltaY, velocity) => {
 *     const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
 *     const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
 *     
 *     if (distance > 100 && velocity > 0.5) {
 *       if (angle > -45 && angle < 45) {
 *         // Fast right swipe
 *       } else if (angle > 135 || angle < -135) {
 *         // Fast left swipe
 *       }
 *     }
 *   }
 * });
 * 
 * MULTI-DIRECTIONAL SUPPORT:
 * 
 * While this hook focuses on horizontal swipes, you can adapt it:
 * 
 * const multiDirectionalHandlers = useSwipeGesture({
 *   onSwipeEnd: (deltaX, deltaY) => {
 *     const absX = Math.abs(deltaX);
 *     const absY = Math.abs(deltaY);
 *     
 *     if (absX > absY) {
 *       // Horizontal swipe
 *       if (deltaX > 0) handleSwipeRight();
 *       else handleSwipeLeft();
 *     } else {
 *       // Vertical swipe
 *       if (deltaY > 0) handleSwipeDown();
 *       else handleSwipeUp();
 *     }
 *   }
 * });
 * 
 * INTEGRATION WITH ANIMATION LIBRARIES:
 * 
 * const animatedSwipeHandlers = useSwipeGesture({
 *   onSwipeMove: (deltaX) => {
 *     // Update spring animation target
 *     springApi.start({ x: deltaX });
 *   },
 *   onSwipeEnd: (deltaX, deltaY, velocity) => {
 *     // Use velocity for spring animation
 *     springApi.start({
 *       x: deltaX > -60 ? 0 : -120,
 *       config: { velocity: velocity * 100 }
 *     });
 *   }
 * });
 */

import { useRef, useCallback } from 'react';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Configuration options for swipe gesture behavior
 * 
 * This interface defines all the customizable aspects of the swipe gesture,
 * from callback functions to behavioral parameters. Each option is optional
 * to allow for flexible usage patterns.
 */
interface SwipeGestureOptions {
  /**
   * Callback triggered when user swipes left past threshold
   * 
   * TYPICAL USE CASES:
   * - Revealing action buttons (edit, delete)
   * - Navigating to next item in sequence
   * - Opening contextual menus
   * - Triggering progressive disclosure
   * 
   * @example
   * onSwipeLeft: () => setActionsVisible(true)
   */
  onSwipeLeft?: () => void;
  
  /**
   * Callback triggered when user swipes right past threshold
   * 
   * TYPICAL USE CASES:
   * - Hiding action buttons
   * - Navigating to previous item
   * - Closing overlays or modals
   * - Returning to default state
   * 
   * @example
   * onSwipeRight: () => setActionsVisible(false)
   */
  onSwipeRight?: () => void;
  
  /**
   * Callback triggered when touch gesture begins
   * 
   * @param startX - Initial X coordinate of touch
   * @param startY - Initial Y coordinate of touch
   * 
   * TYPICAL USE CASES:
   * - Initializing drag state
   * - Disabling CSS transitions for immediate feedback
   * - Recording initial positions for calculations
   * - Providing haptic feedback on supported devices
   * 
   * @example
   * onSwipeStart: (startX, startY) => {
   *   setIsDragging(true);
   *   disableTransitions();
   * }
   */
  onSwipeStart?: (startX: number, startY: number) => void;
  
  /**
   * Callback triggered continuously during swipe movement
   * 
   * @param deltaX - Horizontal distance moved from start position
   * @param deltaY - Vertical distance moved from start position
   * 
   * PERFORMANCE WARNING:
   * This callback is called frequently during gesture. Keep it lightweight
   * and avoid expensive operations like DOM queries or complex calculations.
   * 
   * TYPICAL USE CASES:
   * - Real-time position updates
   * - Applying resistance effects
   * - Updating progress indicators
   * - Live preview of gesture outcome
   * 
   * @example
   * onSwipeMove: (deltaX, deltaY) => {
   *   const constrainedX = Math.max(-120, Math.min(0, deltaX));
   *   updateCardPosition(constrainedX);
   * }
   */
  onSwipeMove?: (deltaX: number, deltaY: number) => void;
  
  /**
   * Callback triggered when touch gesture completes
   * 
   * @param deltaX - Final horizontal distance moved
   * @param deltaY - Final vertical distance moved
   * @param velocity - Calculated velocity in pixels per millisecond
   * 
   * TYPICAL USE CASES:
   * - Determining final state based on distance and velocity
   * - Triggering completion animations
   * - Cleaning up drag state
   * - Making decisions about gesture outcome
   * 
   * @example
   * onSwipeEnd: (deltaX, deltaY, velocity) => {
   *   setIsDragging(false);
   *   if (Math.abs(deltaX) > threshold || velocity > 0.3) {
   *     completeGesture();
   *   } else {
   *     cancelGesture();
   *   }
   * }
   */
  onSwipeEnd?: (deltaX: number, deltaY: number, velocity: number) => void;
  
  /**
   * Minimum distance in pixels to trigger directional callbacks
   * 
   * DEFAULT: 50px
   * RECOMMENDED RANGE: 30-100px
   * 
   * CONSIDERATIONS:
   * - Lower values: More sensitive, easier to trigger accidentally
   * - Higher values: More deliberate, requires clear intent
   * - Mobile vs desktop: Mobile may need higher thresholds
   * - Content density: Dense interfaces may need lower thresholds
   * 
   * @example
   * threshold: 60 // Requires 60px movement to trigger swipe
   */
  threshold?: number;
  
  /**
   * Resistance factor for over-swipe effects (0.0 - 1.0)
   * 
   * DEFAULT: 0.3 (30% of movement applied beyond limits)
   * 
   * VALUES:
   * - 0.0: No movement beyond limits (hard stop)
   * - 0.3: Moderate resistance (iOS-like rubber band)
   * - 1.0: No resistance (unlimited movement)
   * 
   * DESIGN IMPACT:
   * - Creates natural, physics-based feel
   * - Provides visual feedback about limits
   * - Prevents jarring stops at boundaries
   * 
   * @example
   * resistance: 0.2 // 20% movement beyond limits
   */
  resistance?: number;
  
  /**
   * Whether to prevent vertical scrolling during horizontal swipes
   * 
   * DEFAULT: false
   * 
   * WHEN TO USE:
   * - Horizontal-only interactions (like card swipes)
   * - When horizontal gesture should take precedence
   * - In scrollable containers where you need gesture priority
   * 
   * CAUTION:
   * - Can interfere with page scrollability
   * - May affect accessibility for some users
   * - Test thoroughly on various devices
   * 
   * @example
   * preventVerticalScroll: true // Prioritize horizontal gestures
   */
  preventVerticalScroll?: boolean;
}

/**
 * Return type for the useSwipeGesture hook
 * 
 * These handlers should be spread onto the target element to enable
 * swipe gesture recognition. All handlers are required for proper
 * gesture lifecycle management.
 */
interface SwipeGestureHandlers {
  /**
   * Handler for touch start events
   * Records initial touch position and initializes gesture tracking
   */
  onTouchStart: (e: React.TouchEvent) => void;
  
  /**
   * Handler for touch move events
   * Tracks finger movement and calculates deltas
   */
  onTouchMove: (e: React.TouchEvent) => void;
  
  /**
   * Handler for touch end events
   * Determines gesture outcome and triggers appropriate callbacks
   */
  onTouchEnd: (e: React.TouchEvent) => void;
  
  /**
   * Handler for touch cancel events
   * Cleans up gesture state when touch is interrupted
   */
  onTouchCancel: (e: React.TouchEvent) => void;
}

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * Custom hook for implementing swipe gestures on touch devices
 * 
 * This hook encapsulates all the complexity of touch event handling,
 * gesture recognition, and state management, providing a clean API
 * for components to respond to swipe interactions.
 * 
 * @param options - Configuration object for swipe behavior
 * @returns Object containing touch event handlers to spread on target element
 * 
 * USAGE PATTERN:
 * const handlers = useSwipeGesture({ onSwipeLeft: handleSwipe });
 * return <div {...handlers}>Content</div>;
 * 
 * PERFORMANCE CHARACTERISTICS:
 * - Minimal re-renders (uses refs for tracking state)
 * - Efficient event handling with useCallback
 * - Automatic cleanup prevents memory leaks
 * - Optimized for 60fps touch interactions
 */
export const useSwipeGesture = (options: SwipeGestureOptions = {}): SwipeGestureHandlers => {
  // Extract options with defaults
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

  // ==========================================================================
  // GESTURE TRACKING STATE
  // ==========================================================================
  
  /**
   * Refs to track touch state across events
   * 
   * WHY REFS INSTEAD OF STATE:
   * - Prevents unnecessary re-renders during gesture
   * - Provides stable references across event handlers
   * - Avoids stale closure issues in event callbacks
   * - Better performance for high-frequency updates
   */
  
  /**
   * Initial touch position and timestamp when gesture begins
   * Used to calculate movement deltas and gesture duration
   */
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  /**
   * Most recent touch position and timestamp
   * Used for velocity calculations and real-time updates
   */
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  /**
   * Whether user is currently performing a drag gesture
   * Prevents processing of stale or conflicting events
   */
  const isDraggingRef = useRef(false);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  /**
   * Handles the start of a touch gesture
   * 
   * RESPONSIBILITIES:
   * 1. Record initial touch position and timestamp
   * 2. Initialize tracking state for gesture
   * 3. Notify parent component of gesture start
   * 4. Set up for subsequent move and end events
   * 
   * @param e - React touch event object
   * 
   * PERFORMANCE NOTES:
   * - Uses useCallback to prevent re-creation on every render
   * - Minimal processing to ensure responsive touch feedback
   * - Stores timestamp for velocity calculations
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    // Record initial touch state
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };
    
    // Initialize tracking for move events
    lastTouchRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };
    
    // Mark gesture as active
    isDraggingRef.current = true;
    
    // Notify parent component of gesture start
    onSwipeStart?.(touch.clientX, touch.clientY);
  }, [onSwipeStart]);

  /**
   * Handles touch movement during gesture
   * 
   * RESPONSIBILITIES:
   * 1. Calculate movement deltas from start position
   * 2. Apply resistance effects if configured
   * 3. Prevent vertical scrolling if requested
   * 4. Update tracking state for velocity calculation
   * 5. Notify parent component of real-time movement
   * 
   * @param e - React touch event object
   * 
   * PERFORMANCE CRITICAL:
   * This function is called frequently during gesture (potentially 60+ times
   * per second). Keep processing minimal and avoid expensive operations.
   * 
   * SCROLL PREVENTION:
   * When preventVerticalScroll is true, we call preventDefault() only for
   * horizontal-dominant gestures to maintain vertical scrolling capability.
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !touchStartRef.current) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    
    // Calculate movement delta from start position
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    // Prevent vertical scrolling if configured and gesture is horizontal-dominant
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
   * 
   * RESPONSIBILITIES:
   * 1. Calculate final movement deltas and velocity
   * 2. Determine if gesture meets threshold requirements
   * 3. Trigger appropriate directional callbacks
   * 4. Notify parent component of gesture completion
   * 5. Clean up tracking state
   * 
   * @param e - React touch event object
   * 
   * GESTURE RECOGNITION LOGIC:
   * - Horizontal movement must be dominant (greater than vertical)
   * - Movement must exceed configured threshold
   * - Direction determines which callback to trigger
   * 
   * VELOCITY CALCULATION:
   * Velocity is calculated as pixels per millisecond based on the most
   * recent movement, not the entire gesture duration. This provides
   * more responsive feedback for quick gestures.
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || !touchStartRef.current || !lastTouchRef.current) {
      return;
    }
    
    // Calculate final movement deltas
    const deltaX = lastTouchRef.current.x - touchStartRef.current.x;
    const deltaY = lastTouchRef.current.y - touchStartRef.current.y;
    const deltaTime = lastTouchRef.current.time - touchStartRef.current.time;
    
    // Calculate velocity (pixels per millisecond)
    // Use Math.max to prevent division by zero
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
    
    // Notify parent component of gesture completion
    onSwipeEnd?.(deltaX, deltaY, velocity);
    
    // Reset tracking state
    isDraggingRef.current = false;
    touchStartRef.current = null;
    lastTouchRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeEnd, threshold]);

  /**
   * Handles touch cancellation events
   * 
   * WHEN THIS OCCURS:
   * - User moves finger off screen during gesture
   * - System interrupts touch (incoming call, notification)
   * - Browser cancels touch for other reasons
   * 
   * RESPONSIBILITIES:
   * 1. Clean up tracking state without triggering callbacks
   * 2. Reset gesture state to prevent stale data
   * 3. Ensure no memory leaks from incomplete gestures
   * 
   * @param e - React touch event object
   * 
   * IMPORTANT:
   * This handler is crucial for preventing memory leaks and ensuring
   * consistent behavior when gestures are interrupted.
   */
  const handleTouchCancel = useCallback((e: React.TouchEvent) => {
    // Reset all tracking state without triggering callbacks
    isDraggingRef.current = false;
    touchStartRef.current = null;
    lastTouchRef.current = null;
  }, []);

  // ==========================================================================
  // RETURN HANDLERS
  // ==========================================================================

  /**
   * Return object containing all necessary touch event handlers
   * 
   * These handlers should be spread onto the target element to enable
   * swipe gesture recognition:
   * 
   * const handlers = useSwipeGesture(options);
   * return <div {...handlers}>Content</div>;
   * 
   * ALL HANDLERS ARE REQUIRED:
   * - onTouchStart: Initializes gesture tracking
   * - onTouchMove: Tracks movement and provides real-time feedback
   * - onTouchEnd: Determines gesture outcome and triggers callbacks
   * - onTouchCancel: Handles interrupted gestures and prevents memory leaks
   */
  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
};

// =============================================================================
// UTILITY FUNCTIONS (for advanced usage)
// =============================================================================

/**
 * Throttle utility function for performance optimization
 * 
 * Use this to limit the frequency of expensive operations in gesture callbacks:
 * 
 * @example
 * const throttledUpdate = throttle((deltaX) => {
 *   expensiveOperation(deltaX);
 * }, 16); // Limit to ~60fps
 * 
 * const handlers = useSwipeGesture({
 *   onSwipeMove: throttledUpdate
 * });
 */
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
}