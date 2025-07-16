/**
 * Shift Modal Component - Date-Specific Shift Selection Interface
 * 
 * This modal component provides an interface for selecting and managing shifts
 * for a specific date. It handles shift availability rules, special date logic,
 * and provides real-time feedback on selections and calculations.
 * 
 * Key Features:
 * - Date-specific shift selection with business rule validation
 * - Special date toggle with automatic shift adjustment
 * - Real-time amount calculations and display
 * - Auto-save functionality (changes persist immediately)
 * - Mobile-optimized scrolling and touch interactions
 * - Smart focus management and keyboard navigation
 * 
 * Business Rules:
 * - Maximum 3 shifts per day
 * - Shift availability based on day of week and special date status
 * - Automatic conflict resolution when toggling special dates
 * - Custom shifts respect their day-specific availability settings
 * 
 * UX Patterns:
 * - Auto-save eliminates need for save/cancel buttons
 * - Visual feedback for all interactions
 * - Smooth scrolling back to edited date on close
 * - Consistent modal behavior across the application
 * 
 * Dependencies:
 * - React hooks for state management
 * - Lucide React for icons
 * - Custom date utilities
 * - GSAP for scroll animations
 * 
 * @author NARAYYA
 * @version 3.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { DaySchedule, SpecialDates, Settings } from '../types';
import { getDayOfWeek } from '../utils/dateUtils';

/**
 * Props interface for the ShiftModal component
 * 
 * @interface ShiftModalProps
 * @property {string | null} selectedDate - Date being edited in YYYY-MM-DD format
 * @property {DaySchedule} schedule - Complete schedule data mapping dates to shifts
 * @property {SpecialDates} specialDates - Special date flags mapping
 * @property {Settings} settings - Application settings including custom shifts
 * @property {function} onToggleShift - Callback when a shift is toggled on/off
 * @property {function} onToggleSpecialDate - Callback when special date status changes
 * @property {function} onClose - Callback when modal should be closed
 */
interface ShiftModalProps {
  selectedDate: string | null;
  schedule: DaySchedule;
  specialDates: SpecialDates;
  settings: Settings;
  onToggleShift: (shiftId: string) => void;
  onToggleSpecialDate: (dateKey: string, isSpecial: boolean) => void;
  onClose: () => void;
}

/**
 * ShiftModal Component
 * 
 * Renders a modal interface for editing shifts on a specific date.
 * Handles complex business logic for shift availability and conflicts.
 * 
 * State Management:
 * - Tracks special date status locally for immediate UI feedback
 * - Maintains selected shifts array for real-time calculations
 * - Syncs with parent state through callbacks
 * 
 * Performance Optimizations:
 * - Smooth scrolling with hardware acceleration
 * - Efficient re-rendering through proper state management
 * - Touch-optimized scrolling for mobile devices
 * 
 * @param {ShiftModalProps} props - Component props
 * @returns {JSX.Element | null} The rendered modal or null if not open
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
  // ==================== STATE MANAGEMENT ====================
  
  /**
   * Local special date status for immediate UI feedback
   * Synced with parent state but allows for optimistic updates
   */
  const [isSpecialDate, setIsSpecialDate] = useState(false);
  
  /**
   * Currently selected shifts for real-time calculations
   * Maintained locally to avoid prop drilling and enable immediate feedback
   */
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);

  /**
   * Initialize state when modal opens or date changes
   * 
   * Why useEffect:
   * - Ensures state is fresh when modal opens
   * - Handles date changes while modal is open
   * - Syncs local state with parent data
   */
  useEffect(() => {
    if (selectedDate) {
      setIsSpecialDate(specialDates[selectedDate] === true);
      setSelectedShifts(schedule[selectedDate] || []);
    }
  }, [selectedDate, specialDates, schedule]);

  /**
   * Enhanced close handler with focus management
   * 
   * Why useCallback:
   * - Prevents unnecessary re-renders of child components
   * - Stable reference for event handlers
   * - Optimizes performance in dependency arrays
   * 
   * Focus Management:
   * - Scrolls back to the edited date after closing
   * - Provides visual feedback about which date was edited
   * - Improves user orientation and workflow
   */
  const handleCloseWithFocus = useCallback(() => {
    if (selectedDate) {
      // Parse the date to get the day number for scrolling
      const dateObj = new Date(selectedDate);
      const dayNumber = dateObj.getDate();
      
      // Close the modal first
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

  // ==================== SCROLL PREVENTION ====================
  
  /**
   * Prevents body scroll when modal is open
   * 
   * Why this approach:
   * - Prevents background scrolling on mobile devices
   * - Maintains modal position during device orientation changes
   * - Ensures consistent behavior across iOS and Android
   * - Matches pattern used in other modals for consistency
   * 
   * Implementation Details:
   * - Sets body to fixed positioning to prevent scroll
   * - Covers entire viewport to prevent any scrolling
   * - Restores original styles on cleanup
   */
  useEffect(() => {
    if (selectedDate) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
    }

    return () => {
      // Re-enable body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, [selectedDate]);

  /**
   * Handles backdrop clicks to close modal
   * 
   * @param {React.MouseEvent} e - Mouse event from backdrop click
   * 
   * Why check target === currentTarget:
   * - Ensures click was on backdrop, not modal content
   * - Prevents accidental closes when clicking inside modal
   * - Standard pattern for modal backdrop behavior
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseWithFocus();
    }
  };

  /**
   * Handles escape key to close modal
   * 
   * Why separate from backdrop handler:
   * - Provides keyboard accessibility
   * - Standard modal behavior expectation
   * - Allows for different close animations if needed
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

  // Early return if modal should not be shown
  if (!selectedDate) return null;

  // ==================== SHIFT AVAILABILITY LOGIC ====================
  
  /**
   * Gets available shifts for the selected date based on business rules
   * 
   * @returns {Array} Array of available shift objects with display information
   * 
   * Business Logic:
   * 1. Determines day of week for the selected date
   * 2. Checks if date is marked as special
   * 3. Filters custom shifts based on their applicability rules
   * 4. Returns formatted shift objects for display
   * 
   * Applicability Rules:
   * - Each custom shift has day-specific availability settings
   * - Special dates can override normal day rules
   * - Disabled shifts are excluded from availability
   * 
   * Why calculate here:
   * - Rules may change based on special date status
   * - Provides real-time updates when special date is toggled
   * - Encapsulates complex business logic in one place
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
   * Checks for time overlaps between two shifts
   * 
   * @param {any} shift1 - First shift to compare
   * @param {any} shift2 - Second shift to compare
   * @returns {boolean} True if shifts overlap in time
   * 
   * Note: Currently returns false (allows all combinations)
   * This is a placeholder for future time conflict detection
   * 
   * Future Implementation:
   * - Parse fromTime and toTime for each shift
   * - Calculate overlap periods
   * - Return true if any overlap exists
   * - Consider overnight shifts (end time < start time)
   */
  const checkTimeOverlap = (shift1: any, shift2: any) => {
    // Simple overlap check - can be enhanced based on actual time ranges
    return false; // For now, allow all combinations
  };

  /**
   * Determines if a shift can be selected based on current state
   * 
   * @param {string} shiftId - ID of the shift to check
   * @returns {boolean} True if shift can be selected
   * 
   * Selection Rules:
   * 1. Already selected shifts can always be deselected
   * 2. Maximum 3 shifts per day limit
   * 3. No time overlaps with already selected shifts
   * 4. Shift must exist in available shifts list
   * 
   * Why these rules:
   * - 3 shift limit prevents UI overcrowding and unrealistic schedules
   * - Time overlap prevention avoids scheduling conflicts
   * - Availability check ensures business rules are respected
   */
  const canSelectShift = (shiftId: string) => {
    if (selectedShifts.includes(shiftId)) return true; // Can always deselect
    if (selectedShifts.length >= 3) return false; // Maximum 3 shifts
    
    const currentShift = availableShifts.find(s => s.id === shiftId);
    if (!currentShift) return false;
    
    // Check for overlaps with already selected shifts
    for (const selectedId of selectedShifts) {
      const selectedShift = availableShifts.find(s => s.id === selectedId);
      if (selectedShift && checkTimeOverlap(currentShift, selectedShift)) {
        return false;
      }
    }
    
    return true;
  };
  
  /**
   * Handles toggling a shift on/off for the selected date
   * 
   * @param {string} shiftId - ID of the shift to toggle
   * 
   * Process:
   * 1. Updates local state immediately for UI responsiveness
   * 2. Calls parent callback to persist changes
   * 3. Maintains consistency between local and parent state
   * 
   * Why update local state:
   * - Provides immediate visual feedback
   * - Enables real-time calculation updates
   * - Improves perceived performance
   */
  const handleShiftToggle = (shiftId: string) => {
    const newSelectedShifts = selectedShifts.includes(shiftId)
      ? selectedShifts.filter(id => id !== shiftId)
      : [...selectedShifts, shiftId];
    
    setSelectedShifts(newSelectedShifts);
    onToggleShift(shiftId);
  };
  
  /**
   * Calculates total amount for currently selected shifts
   * 
   * @returns {number} Total calculated amount
   * 
   * Calculation:
   * 1. Finds each selected shift in available shifts
   * 2. Multiplies shift hours by hourly rate
   * 3. Sums all shift amounts
   * 
   * Note: Uses basic hourly rate calculation
   * Future enhancement: Separate normal/overtime calculations
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
   * Formats currency amounts for display
   * 
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   * 
   * Uses application currency setting and standard formatting
   */
  const formatCurrency = (amount: number) => {
    const currency = settings.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  /**
   * Formats date for display in modal header
   * 
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {Object} Object with formatted day name and date string
   * 
   * Format:
   * - dayName: Full day name (e.g., "Monday")
   * - dateString: Formatted as DD-MMM-YYYY (e.g., "15-Jan-2024")
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
   * Handles special date toggle with automatic shift adjustment
   * 
   * Why async:
   * - Allows for future database operations
   * - Provides consistent API with other data operations
   * - Enables proper error handling
   * 
   * Business Logic:
   * 1. Updates special date status immediately
   * 2. Calls parent callback to persist change
   * 3. Removes conflicting shifts automatically
   * 4. Provides smooth user experience
   * 
   * Conflict Resolution:
   * - Enabling special date: Removes shifts not allowed on special days
   * - Disabling special date: Removes shifts only allowed on special days
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

  const { dayName, dateString } = formatDateDisplay(selectedDate);

  // ==================== RENDER ====================
  
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
        zIndex: 99999,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full select-none" 
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          position: 'relative',
          maxHeight: '90vh',
          margin: 'auto',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Header with auto-save indicator */}
        <div className="relative p-6 pb-4 border-b border-gray-200">
          <button
            onClick={handleCloseWithFocus}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 select-none z-10"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Auto-save indicator */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium select-none">Changes saved automatically</span>
          </div>

          {/* Date info */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-1 select-none">
              {dayName}
            </h3>
            <p className="text-lg text-gray-700 select-none">
              {dateString}
            </p>
          </div>
        </div>

        {/* Scrollable content */}
        <div 
          className="overflow-y-auto max-h-[70vh] p-6"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain'
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
          
          {/* Shift Selection Info */}
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

          {/* Shift List */}
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

          {/* Empty state */}
          {availableShifts.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 font-medium">No shifts available</p>
              <p className="text-yellow-700 text-sm mt-1">Please add shifts in the Settings section first.</p>
            </div>
          )}

          {/* Bottom padding for scroll accessibility */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};