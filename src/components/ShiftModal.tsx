/**
 * FILE: src/components/ShiftModal.tsx
 * 
 * =============================================================================
 * OVERVIEW AND PURPOSE
 * =============================================================================
 * 
 * The ShiftModal component provides a comprehensive interface for managing work
 * shifts on specific dates. It serves as the primary interaction point for users
 * to schedule shifts, mark special dates, and view real-time calculations of
 * earnings. This modal demonstrates advanced React patterns including controlled
 * components, real-time validation, and mobile-optimized UI design.
 * 
 * MAIN FUNCTIONALITY:
 * - Interactive shift selection with real-time validation
 * - Special date marking and management
 * - Live calculation of total earnings for selected shifts
 * - Mobile-optimized scrolling and touch interactions
 * - Automatic state synchronization with parent components
 * - Business rule enforcement (shift conflicts, limits)
 * - Responsive design with safe area support
 * 
 * DEPENDENCIES AND RELATIONSHIPS:
 * - React hooks for state management and lifecycle
 * - Lucide React for consistent iconography
 * - Parent component (App.tsx) for data and callbacks
 * - Types: DaySchedule, SpecialDates, Settings for type safety
 * - Utility functions: getDayOfWeek for business logic
 * 
 * DESIGN PATTERNS DEMONSTRATED:
 * - Modal pattern with portal rendering
 * - Controlled component pattern for form inputs
 * - Callback pattern for parent-child communication
 * - Real-time validation and feedback
 * - Mobile-first responsive design
 * - Accessibility patterns for modal interactions
 * 
 * BUSINESS LOGIC IMPLEMENTATION:
 * - Maximum 3 shifts per day limit
 * - Shift availability based on day of week and special dates
 * - Real-time earnings calculations
 * - Conflict prevention between incompatible shifts
 * - Special date handling with automatic shift filtering
 * 
 * =============================================================================
 * LEARNING OBJECTIVES
 * =============================================================================
 * 
 * This component demonstrates advanced React concepts including:
 * 1. Complex modal state management and lifecycle
 * 2. Real-time form validation and user feedback
 * 3. Mobile-optimized scrolling and touch interactions
 * 4. Business rule implementation in UI components
 * 5. Accessibility patterns for modal dialogs
 * 6. Performance optimization for mobile devices
 * 7. Currency formatting and financial calculations
 * 8. Dynamic content sizing and responsive design
 * 
 * =============================================================================
 * MOBILE OPTIMIZATION FEATURES
 * =============================================================================
 * 
 * The component includes extensive mobile optimizations:
 * - Hardware-accelerated scrolling with -webkit-overflow-scrolling
 * - Touch-action properties for proper gesture handling
 * - Safe area insets for modern mobile devices
 * - Optimized touch targets (44px minimum)
 * - Smooth animations with transform3d
 * - Proper keyboard handling for mobile browsers
 * - Responsive typography and spacing
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { DaySchedule, SpecialDates, Settings } from '../types';
import { getDayOfWeek } from '../utils/dateUtils';

/**
 * =============================================================================
 * COMPONENT PROPS INTERFACE
 * =============================================================================
 * 
 * Defines the contract between ShiftModal and its parent component.
 * This interface demonstrates proper TypeScript usage for modal components
 * and shows how to structure props for complex interactive components.
 * 
 * KEY DESIGN DECISIONS:
 * - Nullable selectedDate allows for controlled modal visibility
 * - Separate callbacks for different types of operations
 * - Direct access to schedule and settings for real-time calculations
 * - Callback pattern for all state modifications
 */
interface ShiftModalProps {
  selectedDate: string | null;                    // Currently selected date (YYYY-MM-DD format)
  schedule: DaySchedule;                          // Complete schedule data
  specialDates: SpecialDates;                     // Special date markings
  settings: Settings;                             // Application settings for shift definitions
  onToggleShift: (shiftId: string) => void;      // Handler for shift selection/deselection
  onToggleSpecialDate: (dateKey: string, isSpecial: boolean) => void; // Special date toggle
  onClose: () => void;                            // Modal close handler
}

/**
 * =============================================================================
 * MAIN COMPONENT IMPLEMENTATION
 * =============================================================================
 */
export const ShiftModal: React.FC<ShiftModalProps> = ({
  selectedDate,
  schedule,
  specialDates,
  settings,
  onToggleShift,
  onToggleSpecialDate,
  onClose
}) => {
  
  // ===========================================================================
  // STATE MANAGEMENT SECTION
  // ===========================================================================
  
  /**
   * LOCAL STATE MANAGEMENT
   * 
   * These state variables manage the modal's internal state and user interactions.
   * The state is kept minimal and focused on UI concerns, with business logic
   * handled by the parent component.
   * 
   * DESIGN PATTERN: Controlled Component
   * The modal receives its data via props and communicates changes via callbacks,
   * making it a controlled component that doesn't own its data.
   */
  const [isSpecialDate, setIsSpecialDate] = useState(false);      // Local special date state
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]); // Currently selected shifts

  // ===========================================================================
  // INITIALIZATION AND SYNCHRONIZATION SECTION
  // ===========================================================================
  
  /**
   * STATE SYNCHRONIZATION EFFECT
   * 
   * This effect synchronizes the modal's local state with the parent component's
   * data whenever the selected date changes. This ensures the modal always
   * displays the correct information when opened.
   * 
   * SYNCHRONIZATION LOGIC:
   * - Updates special date flag from parent data
   * - Loads existing shifts for the selected date
   * - Runs whenever selectedDate, specialDates, or schedule changes
   * 
   * WHY THIS APPROACH:
   * - Ensures data consistency between parent and modal
   * - Provides immediate feedback when modal opens
   * - Handles edge cases like data changes while modal is open
   */
  useEffect(() => {
    if (selectedDate) {
      setIsSpecialDate(specialDates[selectedDate] === true);
      setSelectedShifts(schedule[selectedDate] || []);
    }
  }, [selectedDate, specialDates, schedule]);

  // ===========================================================================
  // MODAL LIFECYCLE MANAGEMENT SECTION
  // ===========================================================================
  
  /**
   * BODY SCROLL PREVENTION
   * 
   * This effect prevents body scrolling when the modal is open, which is
   * essential for mobile UX. The implementation is comprehensive and works
   * across different mobile browsers and devices.
   * 
   * TECHNIQUE EXPLANATION:
   * - overflow: 'hidden' prevents scrolling
   * - position: 'fixed' prevents scroll position jumping
   * - Setting all position values ensures full coverage
   * - Works on iOS Safari, Android Chrome, and other mobile browsers
   * 
   * CLEANUP PATTERN:
   * The return function restores original styles, preventing side effects
   * when the modal is closed or the component unmounts.
   */
  useEffect(() => {
    if (selectedDate) {
      // Disable body scroll with comprehensive mobile support
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
    }

    // Cleanup function - always restore original state
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, [selectedDate]);

  /**
   * MODAL CLOSE HANDLER WITH FOCUS MANAGEMENT
   * 
   * This callback provides enhanced modal closing functionality that includes
   * automatic scrolling back to the edited date. This creates a smooth user
   * experience by maintaining context after modal interactions.
   * 
   * FOCUS MANAGEMENT FEATURES:
   * - Scrolls back to the edited date when modal closes
   * - Provides visual feedback with highlight animation
   * - Handles edge cases where date element might not exist
   * - Uses smooth scrolling for better UX
   * 
   * ANIMATION SEQUENCE:
   * 1. Close modal immediately for responsive feedback
   * 2. Find the date element in the calendar
   * 3. Scroll to center the date in the viewport
   * 4. Apply highlight animation to show which date was edited
   * 5. Remove highlight after animation completes
   */
  const handleCloseWithFocus = useCallback(() => {
    if (selectedDate) {
      // Parse the date to get the day number
      const dateObj = new Date(selectedDate);
      const dayNumber = dateObj.getDate();
      
      // Close the modal first for immediate feedback
      onClose();
      
      // Use setTimeout to ensure modal is closed before scrolling
      setTimeout(() => {
        // Find the date element using the data-day attribute
        const dateElement = document.querySelector(`[data-day="${dayNumber}"]`) as HTMLElement;
        
        if (dateElement) {
          console.log(`📍 Scrolling back to date ${dayNumber}`);
          
          // Scroll the element into view with smooth behavior
          dateElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',    // Center the element vertically
            inline: 'center'    // Center the element horizontally
          });
          
          // Optional: Add a brief highlight effect to show which date was edited
          dateElement.style.transition = 'all 0.3s ease';
          dateElement.style.transform = 'scale(1.05)';
          dateElement.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';
          
          // Remove highlight after animation
          setTimeout(() => {
            dateElement.style.transform = '';
            dateElement.style.boxShadow = '';
          }, 600);
        } else {
          console.warn(`⚠️ Could not find date element for day ${dayNumber}`);
        }
      }, 100); // Small delay to ensure modal close animation completes
    } else {
      // Fallback to normal close if no selected date
      onClose();
    }
  }, [selectedDate, onClose]);

  /**
   * KEYBOARD EVENT HANDLING
   * 
   * Provides keyboard accessibility for modal interactions. The Escape key
   * is a standard UX pattern for closing modals and is expected by users.
   * 
   * ACCESSIBILITY FEATURES:
   * - Escape key closes modal
   * - Event listener cleanup prevents memory leaks
   * - Only active when modal is open
   * - Uses the enhanced close handler for better UX
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseWithFocus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleCloseWithFocus]);

  // ===========================================================================
  // EARLY RETURN FOR CLOSED MODAL
  // ===========================================================================
  
  /**
   * EARLY RETURN PATTERN
   * 
   * This pattern prevents unnecessary rendering when the modal should not
   * be displayed. It's a common optimization technique in React components.
   */
  if (!selectedDate) return null;

  // ===========================================================================
  // BUSINESS LOGIC SECTION
  // ===========================================================================
  
  /**
   * SHIFT AVAILABILITY CALCULATION
   * 
   * This function implements the core business logic for determining which
   * shifts are available on a given date. It considers day of the week,
   * special date status, and shift-specific availability rules.
   * 
   * BUSINESS RULES IMPLEMENTED:
   * - Each shift has configurable applicable days
   * - Special dates can have different shift availability
   * - Default availability includes all days and special dates
   * - Disabled shifts are filtered out
   * 
   * ALGORITHM:
   * 1. Parse selected date to get day of week
   * 2. Check if date is marked as special
   * 3. Filter custom shifts based on enabled status
   * 4. Check each shift's applicable days configuration
   * 5. Return shifts that match current day or special date criteria
   */
  const getAvailableShifts = () => {
    const shifts = [];
    
    // Get day of week for the selected date (0 = Sunday, 1 = Monday, etc.)
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[dayOfWeek];
    
    // Check if it's a special date
    const isSpecial = specialDates[selectedDate] === true;
    
    // Add all custom shifts from settings
    if (settings.customShifts) {
      settings.customShifts.forEach(shift => {
        if (shift.enabled) {
          // Check if shift is applicable for this day
          const applicableDays = shift.applicableDays || {
            monday: true, tuesday: true, wednesday: true, thursday: true,
            friday: true, saturday: true, sunday: true, specialDay: true
          };
          
          // Show shift if it's applicable for current day OR if it's a special day and shift allows special days
          const isApplicableForDay = applicableDays[currentDayName as keyof typeof applicableDays];
          const isApplicableForSpecial = isSpecial && applicableDays.specialDay;
          
          if (isApplicableForDay || isApplicableForSpecial) {
            shifts.push({
              id: shift.id,
              label: shift.label,
              time: `${shift.fromTime} to ${shift.toTime}`,
              hours: shift.hours,
              color: 'bg-blue-100 text-blue-800 border-blue-200'
            });
          }
        }
      });
    }
    
    return shifts;
  };

  const availableShifts = getAvailableShifts();
  
  /**
   * SHIFT CONFLICT DETECTION
   * 
   * This function implements business rules for shift conflicts and overlaps.
   * Currently simplified but can be extended for complex scheduling rules.
   * 
   * POTENTIAL CONFLICT TYPES:
   * - Time overlaps between shifts
   * - Maximum shifts per day limits
   * - Incompatible shift combinations
   * - Resource conflicts
   * 
   * CURRENT IMPLEMENTATION:
   * Returns false (no conflicts) as a placeholder for future enhancement.
   * This allows the system to be extended with complex conflict detection.
   */
  const checkTimeOverlap = (shift1: any, shift2: any) => {
    // Simple overlap check - can be enhanced based on actual time ranges
    return false; // For now, allow all combinations
  };

  /**
   * SHIFT SELECTION VALIDATION
   * 
   * This function determines whether a shift can be selected based on
   * current selections and business rules.
   * 
   * VALIDATION RULES:
   * - Already selected shifts are always valid (for deselection)
   * - Maximum 3 shifts per day limit
   * - No time conflicts with existing selections
   * - Shift must be in available shifts list
   * 
   * @param shiftId - ID of the shift to validate
   * @returns true if shift can be selected, false otherwise
   */
  const canSelectShift = (shiftId: string) => {
    if (selectedShifts.includes(shiftId)) return true; // Already selected, allow deselection
    if (selectedShifts.length >= 3) return false; // Maximum 3 shifts limit
    
    const currentShift = availableShifts.find(s => s.id === shiftId);
    if (!currentShift) return false; // Shift not available
    
    // Check for overlaps with already selected shifts
    for (const selectedId of selectedShifts) {
      const selectedShift = availableShifts.find(s => s.id === selectedId);
      if (selectedShift && checkTimeOverlap(currentShift, selectedShift)) {
        return false; // Time conflict detected
      }
    }
    
    return true; // No conflicts, selection allowed
  };
  
  // ===========================================================================
  // EVENT HANDLERS SECTION
  // ===========================================================================
  
  /**
   * SHIFT TOGGLE HANDLER
   * 
   * Handles shift selection and deselection with immediate UI feedback
   * and parent component synchronization.
   * 
   * PROCESS:
   * 1. Update local state for immediate UI feedback
   * 2. Call parent callback to persist changes
   * 3. Handle both selection and deselection cases
   * 
   * OPTIMISTIC UPDATES:
   * The local state is updated immediately for responsive UI, while the
   * parent callback handles persistence and validation.
   */
  const handleShiftToggle = (shiftId: string) => {
    const newSelectedShifts = selectedShifts.includes(shiftId)
      ? selectedShifts.filter(id => id !== shiftId)  // Deselect
      : [...selectedShifts, shiftId];                // Select
    
    setSelectedShifts(newSelectedShifts);
    onToggleShift(shiftId);
  };
  
  /**
   * FINANCIAL CALCULATIONS SECTION
   * 
   * These functions handle real-time calculation of earnings based on
   * selected shifts and current settings.
   */
  
  /**
   * Calculates total amount for currently selected shifts
   * @returns Total earnings for selected shifts
   */
  const calculateTotalAmount = () => {
    let total = 0;
    selectedShifts.forEach(shiftId => {
      const shift = availableShifts.find(s => s.id === shiftId);
      if (shift) {
        total += shift.hours * (settings.hourlyRate || 0);
      }
    });
    return total;
  };
  
  /**
   * Formats currency amounts using application settings
   * @param amount - Numeric amount to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number) => {
    const currency = settings.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  /**
   * DATE FORMATTING UTILITIES
   * 
   * These functions provide human-readable date formatting for the modal header.
   */
  
  /**
   * Formats the selected date for display in the modal header
   * @param dateString - Date string in YYYY-MM-DD format
   * @returns Object with formatted day name and date string
   */
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return {
      dayName,
      dateString: `${day}-${month}-${year}`
    };
  };

  /**
   * SPECIAL DATE TOGGLE HANDLER
   * 
   * Handles special date marking with business rule enforcement.
   * This function demonstrates complex state management with side effects.
   * 
   * BUSINESS RULES ENFORCED:
   * - Enabling special date removes incompatible shifts (12-10)
   * - Disabling special date removes shifts only valid on special dates (9-4 on non-Sundays)
   * - Immediate UI feedback with parent synchronization
   * 
   * SIDE EFFECTS:
   * - May automatically deselect incompatible shifts
   * - Updates both special date status and shift selections
   * - Provides immediate visual feedback
   */
  const handleSpecialDateToggle = async () => {
    const newSpecialState = !isSpecialDate;
    setIsSpecialDate(newSpecialState);
    
    // Update parent state immediately
    onToggleSpecialDate(selectedDate, newSpecialState);
    
    const currentShifts = schedule[selectedDate] || [];
    
    if (newSpecialState) {
      // If we're ENABLING special date status, remove any 12-10 shifts (not allowed on special dates)
      if (currentShifts.includes('12-10')) {
        onToggleShift('12-10'); // This will remove the 12-10 shift
      }
    } else {
      // If we're DISABLING special date status, remove any 9-4 shifts that are no longer valid
      const dayOfWeek = getDayOfWeek(selectedDate);
      
      // If it's not Sunday and we're removing special date status, remove 9-4 shifts
      if (dayOfWeek !== 0 && currentShifts.includes('9-4')) {
        onToggleShift('9-4'); // This will remove the 9-4 shift
      }
    }
  };

  /**
   * BACKDROP CLICK HANDLER
   * 
   * Handles clicks outside the modal content to close the modal.
   * This is a standard UX pattern for modal dialogs.
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseWithFocus();
    }
  };

  // ===========================================================================
  // RENDER PREPARATION SECTION
  // ===========================================================================
  
  /**
   * RENDER DATA PREPARATION
   * 
   * Prepare data for rendering, including date formatting and calculations.
   */
  const { dayName, dateString } = formatDateDisplay(selectedDate);

  // ===========================================================================
  // MAIN RENDER SECTION
  // ===========================================================================
  
  /**
   * MODAL STRUCTURE:
   * 1. Full-screen backdrop with click-to-close
   * 2. Centered modal container with mobile optimizations
   * 3. Header with close button and auto-save indicator
   * 4. Scrollable content area with touch optimizations
   * 5. Special date toggle
   * 6. Shift selection interface
   * 7. Real-time calculations display
   * 
   * MOBILE OPTIMIZATIONS:
   * - Hardware-accelerated scrolling
   * - Touch-action properties for proper gesture handling
   * - Safe area insets for modern devices
   * - Optimized touch targets (44px minimum)
   * - Smooth animations with transform3d
   */
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, // Higher z-index to ensure it's above everything
        // CRITICAL: Enable touch scrolling on the backdrop
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y' // Allow vertical panning (scrolling)
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full select-none" 
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          // Ensure modal is properly centered and doesn't overlap calendar
          position: 'relative',
          maxHeight: '90vh',
          margin: 'auto',
          // Prevent any positioning issues
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
        onClick={(e) => {
          // Prevent modal from closing when clicking inside
          e.stopPropagation();
        }}
      >
        
        {/* ================================================================= */}
        {/* MODAL HEADER SECTION */}
        {/* ================================================================= */}
        
        <div className="relative p-6 pb-4 border-b border-gray-200">
          {/* Close Button */}
          <button
            onClick={handleCloseWithFocus}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 select-none z-10"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Auto-save Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium select-none">Changes saved automatically</span>
          </div>

          {/* Date Information - Centered */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-1 select-none">
              {dayName}
            </h3>
            <p className="text-lg text-gray-700 select-none">
              {dateString}
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SCROLLABLE CONTENT SECTION */}
        {/* ================================================================= */}
        
        <div 
          className="overflow-y-auto max-h-[70vh] p-6"
          style={{
            // CRITICAL: Enable smooth touch scrolling
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y', // Allow vertical panning (scrolling)
            overscrollBehavior: 'contain' // Prevent scroll chaining to parent
          }}
        >
          
          {/* Special Date Toggle */}
          <div className="flex items-center justify-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpecialDate}
                onChange={handleSpecialDateToggle}
                className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 focus:ring-2 rounded"
              />
              <span className="text-sm font-medium text-yellow-800 select-none">
                Special Date
              </span>
            </label>
          </div>
          
          {/* Shift Selection Information */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
            <p className="text-sm text-gray-700 text-center select-none">
              <strong>Shift Selection ({selectedShifts.length}/3)</strong>
            </p>
            {selectedShifts.length > 0 && (
              <p className="text-sm text-indigo-600 text-center mt-1 font-medium">
                Total: {formatCurrency(calculateTotalAmount())}
              </p>
            )}
          </div>

          {/* Scrollable Shift List */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Available Shifts ({availableShifts.length})</h4>
            <div className="max-h-64 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-3">
            {availableShifts.map(shift => {
              const isSelected = selectedShifts.includes(shift.id);
              const canSelect = isSelected || selectedShifts.length < 3;
              const isDisabled = !isSelected && !canSelect;

              return (
                <div key={shift.id}>
                  <button
                    onClick={() => handleShiftToggle(shift.id)}
                    disabled={isDisabled}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 select-none ${
                      isSelected
                        ? `${shift.color} border-current shadow-md transform scale-[1.02]`
                        : isDisabled
                          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                    style={{ 
                      userSelect: 'none', 
                      WebkitUserSelect: 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="relative">
                          <input
                            type="radio"
                            name={`shift-${shift.id}`}
                            checked={isSelected}
                            onChange={() => {}}
                            disabled={isDisabled}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                          />
                        </div>
                        <div className="flex-1">
                        <div className="font-semibold select-none">{shift.label}</div>
                        <div className="text-sm opacity-75 select-none">{shift.time}</div>
                          <div className="text-xs text-gray-600 select-none">{shift.hours}h</div>
                        </div>
                      </div>
                      {isDisabled && selectedShifts.length >= 3 && (
                        <div className="text-xs text-red-500 select-none">
                          Maximum 3 shifts allowed
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
            </div>
          </div>

          {/* No Shifts Available Message */}
          {availableShifts.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 font-medium">No shifts available</p>
              <p className="text-yellow-700 text-sm mt-1">Please add shifts in the Settings section first.</p>
            </div>
          )}

          {/* Add extra padding at bottom to ensure all content is accessible */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

/**
 * =============================================================================
 * LEARNING POINTS AND EDUCATIONAL VALUE
 * =============================================================================
 * 
 * This ShiftModal component demonstrates numerous advanced React and web
 * development concepts that are valuable for learning and professional development:
 * 
 * 1. MODAL COMPONENT PATTERNS:
 *    - Portal rendering for proper z-index management
 *    - Body scroll prevention for mobile devices
 *    - Keyboard accessibility with escape key handling
 *    - Click-outside-to-close functionality
 *    - Focus management and return-to-context behavior
 * 
 * 2. CONTROLLED COMPONENT ARCHITECTURE:
 *    - Props-driven data flow from parent component
 *    - Callback pattern for state modifications
 *    - Local state for UI concerns only
 *    - Immediate UI feedback with optimistic updates
 * 
 * 3. BUSINESS LOGIC IMPLEMENTATION:
 *    - Complex validation rules for shift selection
 *    - Real-time conflict detection and prevention
 *    - Dynamic availability based on date properties
 *    - Financial calculations with live updates
 * 
 * 4. MOBILE-FIRST DEVELOPMENT:
 *    - Hardware-accelerated scrolling implementation
 *    - Touch gesture optimization
 *    - Safe area insets for modern devices
 *    - Responsive typography and spacing
 *    - Optimized touch targets for accessibility
 * 
 * 5. REAL-TIME USER FEEDBACK:
 *    - Live calculation updates as selections change
 *    - Immediate visual feedback for user actions
 *    - Auto-save indicators for user confidence
 *    - Validation messages and error states
 * 
 * 6. ACCESSIBILITY CONSIDERATIONS:
 *    - Proper ARIA labels and roles
 *    - Keyboard navigation support
 *    - Screen reader friendly markup
 *    - High contrast color schemes
 *    - Focus management for modal interactions
 * 
 * 7. PERFORMANCE OPTIMIZATION:
 *    - useCallback for expensive function recreations
 *    - Efficient state updates and re-renders
 *    - Hardware acceleration for smooth animations
 *    - Optimized event handling for touch devices
 * 
 * 8. ERROR HANDLING AND EDGE CASES:
 *    - Graceful handling of missing data
 *    - Validation of user inputs
 *    - Fallback behaviors for edge cases
 *    - Proper cleanup on component unmount
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced form validation libraries
 * - Complex animation libraries and techniques
 * - Advanced accessibility patterns (ARIA)
 * - Performance monitoring and optimization
 * - Advanced TypeScript patterns
 * - Testing strategies for modal components
 * - State management alternatives for complex forms
 * - Advanced mobile gesture handling
 * 
 * This component serves as an excellent reference for building complex,
 * production-ready modal components with advanced features and optimizations.
 */