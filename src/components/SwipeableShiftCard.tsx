/**
 * SwipeableShiftCard Component
 * 
 * Purpose: Interactive shift card with native mobile swipe gestures for edit/delete actions
 * 
 * Features:
 * - Native swipe-to-reveal actions on mobile devices
 * - Click-to-reveal actions on desktop/laptop
 * - Smooth animations with proper physics
 * - Auto-close when swiping other cards
 * - Visual feedback during swipe interactions
 * 
 * Swipe Behavior:
 * - Swipe left: Reveals edit (blue) and delete (red) buttons
 * - Swipe right: Closes actions if open
 * - Tap outside: Closes actions
 * - Momentum and spring physics for natural feel
 * 
 * Desktop Behavior:
 * - Click card: Toggle actions visibility
 * - Hover effects for better UX
 * 
 * @param shift - The shift data object containing hours, times, etc.
 * @param settings - App settings for currency and rates
 * @param onEdit - Callback when edit button is pressed
 * @param onDelete - Callback when delete button is pressed
 * @param formatTime - Utility function to format time strings
 * @param formatCurrency - Utility function to format currency amounts
 */

import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, Clock } from 'lucide-react';

interface SwipeableShiftCardProps {
  shift: any;
  settings: any;
  onEdit: () => void;
  onDelete: () => void;
  formatTime: (time: string) => string;
  formatCurrency: (amount: number) => string;
}

export const SwipeableShiftCard: React.FC<SwipeableShiftCardProps> = ({
  shift,
  settings,
  onEdit,
  onDelete,
  formatTime,
  formatCurrency
}) => {
  // State for managing swipe interactions and animations
  const [translateX, setTranslateX] = useState(0); // Current X position of the card
  const [isOpen, setIsOpen] = useState(false); // Whether actions are revealed
  const [isDragging, setIsDragging] = useState(false); // Whether user is actively swiping
  
  // Refs for touch tracking and DOM manipulation
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0); // Starting X position of touch
  const currentX = useRef(0); // Current X position during drag
  const lastTranslateX = useRef(0); // Last committed translate position
  
  // Constants for swipe behavior - tuned for natural feel
  const SWIPE_THRESHOLD = 60; // Minimum distance to trigger action reveal
  const MAX_SWIPE = 120; // Maximum swipe distance (width of action buttons)
  const RESISTANCE_FACTOR = 0.3; // Resistance when swiping beyond limits
  
  /**
   * Detects if the current device is likely a mobile device
   * Used to enable/disable swipe gestures appropriately
   * 
   * @returns {boolean} True if mobile device detected
   */
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  };
  
  /**
   * Applies smooth spring animation to card position
   * Uses CSS transitions for hardware acceleration
   * 
   * @param {number} targetX - Target X position to animate to
   * @param {boolean} immediate - Whether to skip animation
   */
  const animateToPosition = (targetX: number, immediate = false) => {
    if (!cardRef.current) return;
    
    const card = cardRef.current;
    
    if (immediate) {
      card.style.transition = 'none';
    } else {
      // Spring-like animation with proper easing
      card.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    
    card.style.transform = `translateX(${targetX}px)`;
    setTranslateX(targetX);
    lastTranslateX.current = targetX;
  };
  
  /**
   * Closes the swipe actions with smooth animation
   * Resets card to original position
   */
  const closeActions = () => {
    setIsOpen(false);
    animateToPosition(0);
  };
  
  /**
   * Opens the swipe actions with smooth animation
   * Reveals edit and delete buttons
   */
  const openActions = () => {
    setIsOpen(true);
    animateToPosition(-MAX_SWIPE);
  };
  
  /**
   * Handles the start of a touch interaction
   * Records initial touch position and prepares for drag
   * 
   * @param {React.TouchEvent} e - Touch event object
   */
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileDevice()) return;
    
    const touch = e.touches[0];
    startX.current = touch.clientX;
    currentX.current = touch.clientX;
    setIsDragging(true);
    
    // Disable transitions during drag for immediate feedback
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };
  
  /**
   * Handles touch movement during swipe gesture
   * Applies real-time position updates with resistance at boundaries
   * 
   * @param {React.TouchEvent} e - Touch event object
   */
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobileDevice()) return;
    
    const touch = e.touches[0];
    currentX.current = touch.clientX;
    
    // Calculate the distance moved from start position
    const deltaX = currentX.current - startX.current;
    let newTranslateX = lastTranslateX.current + deltaX;
    
    // Apply resistance when swiping beyond natural limits
    if (newTranslateX > 0) {
      // Resistance when swiping right (closing direction)
      newTranslateX = newTranslateX * RESISTANCE_FACTOR;
    } else if (newTranslateX < -MAX_SWIPE) {
      // Resistance when swiping too far left
      const excess = Math.abs(newTranslateX + MAX_SWIPE);
      newTranslateX = -MAX_SWIPE - (excess * RESISTANCE_FACTOR);
    }
    
    // Apply the position immediately for responsive feel
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${newTranslateX}px)`;
      setTranslateX(newTranslateX);
    }
  };
  
  /**
   * Handles the end of a touch interaction
   * Determines final state based on swipe distance and velocity
   * 
   * @param {React.TouchEvent} e - Touch event object
   */
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || !isMobileDevice()) return;
    
    setIsDragging(false);
    
    const deltaX = currentX.current - startX.current;
    const finalPosition = lastTranslateX.current + deltaX;
    
    // Determine whether to open or close based on swipe distance
    if (finalPosition < -SWIPE_THRESHOLD) {
      // Swiped far enough left to reveal actions
      openActions();
    } else {
      // Not far enough, snap back to closed position
      closeActions();
    }
  };
  
  /**
   * Handles click events for desktop/laptop users
   * Toggles action visibility on click
   */
  const handleClick = () => {
    if (isMobileDevice()) return; // Only for non-mobile devices
    
    if (isOpen) {
      closeActions();
    } else {
      openActions();
    }
  };
  
  /**
   * Handles action button clicks (Edit/Delete)
   * Executes the action and closes the swipe panel
   * 
   * @param {() => void} action - The action callback to execute
   */
  const handleActionClick = (action: () => void) => {
    action();
    closeActions();
  };
  
  // Close actions when component unmounts or shift changes
  useEffect(() => {
    return () => {
      closeActions();
    };
  }, [shift.id]);
  
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden group">
      {/* Action buttons - positioned behind the card */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: `${MAX_SWIPE}px` }}
      >
        {/* Edit button - blue background */}
        <button
          onClick={() => handleActionClick(onEdit)}
          className="flex-1 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center transition-colors duration-200"
          style={{
            minWidth: '60px',
            minHeight: '44px' // Minimum touch target size
          }}
        >
          <Edit className="w-5 h-5" />
        </button>
        
        {/* Delete button - red background */}
        <button
          onClick={() => handleActionClick(onDelete)}
          className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white flex items-center justify-center transition-colors duration-200"
          style={{
            minWidth: '60px',
            minHeight: '44px' // Minimum touch target size
          }}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content - swipeable on mobile, clickable on desktop */}
      <div
        ref={cardRef}
        className={`relative bg-white p-4 select-none ${
          !isMobileDevice() ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        style={{
          transform: `translateX(${translateX}px)`,
          // Prevent text selection during swipe
          userSelect: 'none',
          WebkitUserSelect: 'none',
          // Ensure proper touch handling
          touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal
        }}
        // Touch events for mobile swipe gestures
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        // Click event for desktop interaction
        onClick={handleClick}
      >
        {/* Shift Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 text-lg">{shift.label}</h4>
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
            {shift.hours}h
          </span>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-center mb-3 p-2 bg-gray-50 rounded-lg">
          <Clock className="w-4 h-4 text-gray-600 mr-2" />
          <span className="font-medium text-gray-800">
            {formatTime(shift.fromTime)} - {formatTime(shift.toTime)}
          </span>
        </div>

        {/* Hours Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Normal</div>
            <div className="text-sm font-bold text-green-800">{shift.normalHours || 0}h</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 font-medium">Overtime</div>
            <div className="text-sm font-bold text-orange-800">{shift.overtimeHours || 0}h</div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <span className="text-xs text-indigo-600 font-medium">Total Amount</span>
          </div>
          <div className="text-lg font-bold text-indigo-800">
            {formatCurrency(
              (shift.normalHours || 0) * (settings.hourlyRate || 0) +
              (shift.overtimeHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5))
            )}
          </div>
        </div>

        {/* Visual indicator when actions are revealed */}
        {isOpen && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
        
        {/* Subtle visual hint for swipe capability on mobile */}
        {isMobileDevice() && !isOpen && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-30">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};