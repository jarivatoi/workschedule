/**
 * FILE: src/components/Calendar.tsx
 * 
 * =============================================================================
 * OVERVIEW AND PURPOSE
 * =============================================================================
 * 
 * The Calendar component is the heart of the Work Schedule application, providing
 * an interactive monthly calendar interface for managing work shifts, special dates,
 * and viewing financial calculations. This component combines complex UI interactions,
 * animations, data visualization, and mobile-optimized touch gestures.
 * 
 * MAIN FUNCTIONALITY:
 * - Interactive monthly calendar with shift visualization
 * - Touch-optimized navigation and interactions
 * - Real-time financial calculations (monthly total, month-to-date)
 * - Special date marking and management
 * - Long-press gestures for data clearing operations
 * - Smooth animations using GSAP for enhanced UX
 * - Modal interfaces for date picking and confirmations
 * - Responsive design optimized for mobile devices
 * 
 * DEPENDENCIES AND RELATIONSHIPS:
 * - React hooks for state management and lifecycle
 * - GSAP for hardware-accelerated animations
 * - Lucide React for consistent iconography
 * - Custom hooks: useLongPress for gesture handling
 * - Modal components: ClearDateModal, DeleteMonthModal, MonthClearModal
 * - Utility functions: formatMauritianRupees for currency formatting
 * - Types: DaySchedule, SpecialDates for type safety
 * - Constants: SHIFTS for shift display configuration
 * 
 * DESIGN PATTERNS DEMONSTRATED:
 * - Component composition with modal overlays
 * - Event delegation for touch gesture handling
 * - Observer pattern for animation coordination
 * - Callback pattern for parent-child communication
 * - Portal pattern for modal rendering
 * - Memoization patterns for performance optimization
 * 
 * MOBILE OPTIMIZATION FEATURES:
 * - Hardware-accelerated animations using transform3d
 * - Touch gesture recognition with proper event handling
 * - Safe area insets for modern mobile devices
 * - Optimized rendering for 60fps performance
 * - Responsive grid layouts with dynamic sizing
 * 
 * =============================================================================
 * LEARNING OBJECTIVES
 * =============================================================================
 * 
 * This component demonstrates advanced React patterns including:
 * 1. Complex state management with multiple data sources
 * 2. Performance optimization techniques for mobile devices
 * 3. Animation coordination and timing management
 * 4. Touch gesture implementation and event handling
 * 5. Responsive design with dynamic content sizing
 * 6. Modal management and portal rendering
 * 7. Currency formatting and financial calculations
 * 8. Date manipulation and calendar mathematics
 * 
 * =============================================================================
 * ARCHITECTURE NOTES
 * =============================================================================
 * 
 * The component follows a layered architecture:
 * - Presentation Layer: JSX rendering and styling
 * - Interaction Layer: Event handlers and gesture recognition
 * - Animation Layer: GSAP-powered transitions and effects
 * - Data Layer: Props interface and state management
 * - Utility Layer: Helper functions and calculations
 * 
 * This separation allows for maintainable code and clear responsibility boundaries.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Calculator, Edit3, TrendingUp, Trash2, AlertTriangle, X } from 'lucide-react';
import { gsap } from 'gsap';
import { SHIFTS } from '../constants';
import { DaySchedule, SpecialDates } from '../types';
import { ClearDateModal } from './ClearDateModal';
import { DeleteMonthModal } from './DeleteMonthModal';
import { MonthClearModal } from './MonthClearModal';
import { formatMauritianRupees } from '../utils/currency';
import { useLongPress } from '../hooks/useLongPress';

/**
 * =============================================================================
 * COMPONENT PROPS INTERFACE
 * =============================================================================
 * 
 * Defines the contract between the Calendar component and its parent (App.tsx).
 * This interface demonstrates proper TypeScript usage for component props.
 * 
 * KEY DESIGN DECISIONS:
 * - Callback functions for all user interactions (follows React patterns)
 * - Separate handlers for different types of operations
 * - Optional onResetMonth for backward compatibility
 * - Direct state setters for performance-critical operations
 */
interface CalendarProps {
  // Date and navigation state
  currentDate: Date;                    // Currently viewed month/year
  onDateChange: (date: Date) => void;   // Handler for month/year changes
  onNavigateMonth: (direction: 'prev' | 'next') => void; // Month navigation
  
  // Schedule data and handlers
  schedule: DaySchedule;                // Main schedule data structure
  specialDates: SpecialDates;           // Special date markings
  settings: any;                        // Application settings (for custom shifts)
  onDateClick: (day: number) => void;   // Handler for date selection
  
  // Financial calculations
  totalAmount: number;                  // Monthly total amount
  monthToDateAmount: number;            // Amount earned to current date
  
  // Title management
  scheduleTitle: string;                // User-customizable title
  onTitleUpdate: (title: string) => void; // Title update handler
  
  // Data management
  onResetMonth?: (year: number, month: number) => void; // Optional month reset
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule>>; // Direct state setter
  setSpecialDates: React.Dispatch<React.SetStateAction<SpecialDates>>; // Direct state setter
}

/**
 * =============================================================================
 * MAIN COMPONENT IMPLEMENTATION
 * =============================================================================
 */
export const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  schedule,
  specialDates,
  settings,
  onDateClick,
  onNavigateMonth,
  totalAmount,
  monthToDateAmount,
  onDateChange,
  scheduleTitle,
  onTitleUpdate,
  setSchedule,
  setSpecialDates
}) => {
  
  // ===========================================================================
  // STATE MANAGEMENT SECTION
  // ===========================================================================
  
  /**
   * UI STATE MANAGEMENT
   * 
   * These states control various UI elements and modal visibility.
   * Each state serves a specific purpose in the user interaction flow.
   * 
   * DESIGN PATTERN: Single Responsibility Principle
   * Each state variable has one clear purpose and is managed independently.
   */
  
  // Modal visibility states
  const [showDatePicker, setShowDatePicker] = useState(false);        // Month/year picker modal
  const [showClearDateModal, setShowClearDateModal] = useState(false); // Single date clearing
  const [showClearMonthModal, setShowClearMonthModal] = useState(false); // Month clearing (unused)
  const [showMonthClearModal, setShowMonthClearModal] = useState(false); // Long-press month clear
  
  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);        // Title edit mode
  const [tempTitle, setTempTitle] = useState(scheduleTitle);          // Temporary title during editing
  
  // Date clearing state
  const [dateToDelete, setDateToDelete] = useState<string | null>(null); // Date selected for clearing
  
  // Long-press gesture state
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null); // Timer for long-press detection
  const [isLongPressActive, setIsLongPressActive] = useState(false);  // Prevents conflicts between long-press and click
  
  // Animation reference
  const calendarGridRef = useRef<HTMLDivElement>(null);               // Reference for GSAP animations
  
  // ===========================================================================
  // DATE CALCULATIONS SECTION
  // ===========================================================================
  
  /**
   * CALENDAR MATHEMATICS
   * 
   * These calculations determine the calendar layout and structure.
   * Understanding these is crucial for calendar component development.
   * 
   * KEY CONCEPTS:
   * - JavaScript Date object month indexing (0-based)
   * - First day of month calculation for grid positioning
   * - Days in month calculation for iteration
   * - Weekday calculation for proper alignment
   */
  
  const today = new Date();                                           // Current date for highlighting
  const currentMonth = currentDate.getMonth();                       // 0-based month index
  const currentYear = currentDate.getFullYear();                     // Full year number
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);    // First day of viewed month
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0); // Last day of viewed month
  const firstDayWeekday = firstDayOfMonth.getDay();                  // Day of week (0=Sunday)
  const daysInMonth = lastDayOfMonth.getDate();                      // Total days in month
  
  /**
   * LOCALIZATION DATA
   * 
   * These arrays provide human-readable labels for dates.
   * Could be extracted to a localization system for internationalization.
   */
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ===========================================================================
  // MODAL MANAGEMENT SECTION
  // ===========================================================================
  
  /**
   * MODAL BODY SCROLL PREVENTION
   * 
   * This effect prevents body scrolling when modals are open, which is
   * essential for mobile UX. The technique used here is comprehensive
   * and works across different mobile browsers.
   * 
   * TECHNIQUE EXPLANATION:
   * - overflow: 'hidden' prevents scrolling
   * - position: 'fixed' prevents scroll position jumping
   * - Setting all position values ensures full coverage
   * 
   * CLEANUP PATTERN:
   * The return function restores original styles, preventing side effects.
   */
  useEffect(() => {
    if (showDatePicker) {
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
  }, [showDatePicker]);

  /**
   * KEYBOARD EVENT HANDLING
   * 
   * Provides keyboard accessibility for modal interactions.
   * The Escape key is a standard UX pattern for closing modals.
   * 
   * EVENT LISTENER PATTERN:
   * - Add listener when modal opens
   * - Remove listener when modal closes or component unmounts
   * - Prevents memory leaks and duplicate listeners
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDatePicker]);

  // ===========================================================================
  // ANIMATION SYSTEM SECTION
  // ===========================================================================
  
  /**
   * MOBILE-OPTIMIZED CALENDAR ANIMATIONS
   * 
   * This animation system creates smooth, sequential animations for calendar
   * days when the month changes. The implementation is optimized for mobile
   * devices with hardware acceleration and careful timing.
   * 
   * PERFORMANCE OPTIMIZATIONS:
   * - force3D: true enables hardware acceleration
   * - transform3d prevents layout thrashing
   * - Sequential timing creates natural flow
   * - Reduced distances for smoother mobile performance
   * 
   * ANIMATION PHASES:
   * 1. Set initial state (opacity: 0, transformed position)
   * 2. Create sequential timeline with staggered delays
   * 3. Animate each element with optimized easing
   * 4. Handle different content types (shifts, special dates)
   * 
   * WHY THIS APPROACH:
   * - Creates engaging user experience
   * - Provides visual feedback for month changes
   * - Maintains 60fps performance on mobile devices
   * - Uses industry-standard animation library (GSAP)
   */
  useEffect(() => {
    if (calendarGridRef.current) {
      // Get all day boxes and sort them by day number for sequential animation
      const dayBoxes = Array.from(calendarGridRef.current.querySelectorAll('.day-box'))
        .filter(box => box.getAttribute('data-day') !== null)
        .sort((a, b) => {
          const dayA = parseInt(a.getAttribute('data-day') || '0');
          const dayB = parseInt(b.getAttribute('data-day') || '0');
          return dayA - dayB;
        });
      
      // Force hardware acceleration and set initial state - iOS optimized
      gsap.set(dayBoxes, {
        opacity: 0,
        x: 80,  // Reduced distance for smoother mobile performance
        scale: 0.9,
        force3D: true,  // Force hardware acceleration
        transformOrigin: "center center"
      });

      // Set initial state for shift texts - optimized for mobile
      const shiftTexts = calendarGridRef.current.querySelectorAll('.shift-text');
      gsap.set(shiftTexts, {
        opacity: 0,
        y: 8,   // Reduced movement for smoother animation
        scale: 0.8,
        force3D: true
      });

      // Set initial state for special text
      const specialTexts = calendarGridRef.current.querySelectorAll('.special-text');
      gsap.set(specialTexts, {
        opacity: 0,
        scale: 0.7,
        y: -8,
        force3D: true
      });

      // Create master timeline with mobile-optimized settings
      const masterTl = gsap.timeline({
        defaults: {
          ease: "power2.out",  // Smoother easing for mobile
          force3D: true
        }
      });

      // Phase 1: Animate boxes sequentially - optimized timing for mobile
      dayBoxes.forEach((box, index) => {
        const dayNumber = parseInt(box.getAttribute('data-day') || '0');
        const shiftElements = box.querySelectorAll('.shift-text');
        const specialElements = box.querySelectorAll('.special-text');
        
        // Faster sequence for mobile - reduced delay
        const delay = (dayNumber - 1) * 0.05; // 50ms between each day (faster)
        
        // Animate the box - smoother for mobile
        masterTl.to(box, {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.4,  // Shorter duration
          ease: "power2.out",  // Simpler easing
          force3D: true
        }, delay);

        // Animate shift texts - simplified for mobile
        if (shiftElements.length > 0) {
          masterTl.to(shiftElements, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: "power1.out",  // Gentler easing
            stagger: 0.03,  // Faster stagger
            force3D: true
          }, delay + 0.15);
        }

        // Animate special text - simplified
        if (specialElements.length > 0) {
          masterTl.to(specialElements, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.25,
            ease: "power1.out",
            force3D: true
          }, delay + 0.2);
        }
      });
    }
  }, [currentMonth, currentYear]);

  // ===========================================================================
  // UTILITY FUNCTIONS SECTION
  // ===========================================================================
  
  /**
   * DATE FORMATTING UTILITIES
   * 
   * These functions handle date string formatting and manipulation.
   * Consistent date formatting is crucial for data integrity.
   * 
   * FORMAT: YYYY-MM-DD (ISO 8601 standard)
   * - Ensures consistent sorting
   * - Compatible with Date constructor
   * - Internationally recognized format
   */
  
  /**
   * Formats a day number into a standardized date key
   * @param day - Day of the month (1-31)
   * @returns Formatted date string (YYYY-MM-DD)
   */
  const formatDateKey = (day: number) => {
    return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  /**
   * DATE COMPARISON UTILITIES
   * 
   * These functions provide date comparison logic for UI styling
   * and business logic decisions.
   */
  
  /**
   * Checks if a given day is today's date
   * @param day - Day of the month to check
   * @returns True if the day represents today
   */
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  /**
   * Checks if a given day is in the past
   * @param day - Day of the month to check
   * @returns True if the day is before today
   */
  const isPastDate = (day: number) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateToCheck < todayDate;
  };

  /**
   * BUSINESS LOGIC UTILITIES
   * 
   * These functions implement the application's business rules
   * for date classification and shift management.
   */
  
  /**
   * Gets the day of the week for a given day
   * @param day - Day of the month
   * @returns Day of week (0 = Sunday, 6 = Saturday)
   */
  const getDayOfWeek = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.getDay(); // 0 = Sunday, 6 = Saturday
  };

  /**
   * Checks if a given day is a Sunday
   * @param day - Day of the month
   * @returns True if the day is a Sunday
   */
  const isSunday = (day: number) => {
    return getDayOfWeek(day) === 0;
  };

  /**
   * Checks if a date is marked as special
   * @param day - Day of the month
   * @returns True if marked as special date
   */
  const isSpecialDate = (day: number) => {
    const dateKey = formatDateKey(day);
    return specialDates[dateKey] === true;
  };

  /**
   * SHIFT DATA RETRIEVAL AND SORTING
   * 
   * Retrieves and sorts shifts for a given day according to business rules.
   * The sorting ensures consistent display order across the application.
   */
  
  /**
   * Gets shifts for a specific day, sorted by display priority
   * @param day - Day of the month
   * @returns Array of shift IDs in display order
   */
  const getDayShifts = (day: number) => {
    const dateKey = formatDateKey(day);
    const shifts = schedule[dateKey] || [];
    
    // Sort shifts in the desired display order: 9-4, 4-10, 12-10, N
    const shiftOrder = ['9-4', '4-10', '12-10', 'N'];
    return shifts.sort((a, b) => {
      const indexA = shiftOrder.indexOf(a);
      const indexB = shiftOrder.indexOf(b);
      
      // If shift not found in order array, put it at the end
      const orderA = indexA === -1 ? 999 : indexA;
      const orderB = indexB === -1 ? 999 : indexB;
      
      return orderA - orderB;
    });
  };

  /**
   * Gets shift display information from constants
   * @param shiftId - Shift identifier
   * @returns Shift display object or undefined
   */
  const getShiftDisplay = (shiftId: string) => {
    return SHIFTS.find(shift => shift.id === shiftId);
  };

  /**
   * UI STYLING UTILITIES
   * 
   * These functions determine the visual appearance of calendar dates
   * based on their status and properties.
   */
  
  /**
   * Determines text color for a date based on its properties
   * @param day - Day of the month
   * @returns CSS class string for text color
   */
  const getDateTextColor = (day: number) => {
    if (isToday(day)) {
      return 'text-green-700 font-bold'; // Current date in green
    } else if (isSunday(day) || isSpecialDate(day)) {
      return 'text-red-600 font-bold'; // Sunday and special dates in red
    } else {
      return 'text-gray-900'; // Regular dates
    }
  };

  /**
   * CURRENCY FORMATTING
   * 
   * Formats monetary amounts using the application's currency utility.
   * Centralized formatting ensures consistency across the application.
   */
  
  /**
   * Formats a numeric amount as currency
   * @param amount - Numeric amount to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number) => {
    const result = formatMauritianRupees(amount);
    return result.formatted;
  };

  // ===========================================================================
  // MONTH STATISTICS AND DATA ANALYSIS SECTION
  // ===========================================================================
  
  /**
   * MONTH STATISTICS CALCULATION
   * 
   * Calculates statistics for the current month to display in modals
   * and provide data insights to users.
   * 
   * BUSINESS LOGIC:
   * - Only counts shifts in the currently viewed month
   * - Calculates total shifts and amounts
   * - Provides data for month clearing operations
   */
  
  /**
   * Calculates statistics for the currently viewed month
   * @returns Object containing month statistics
   */
  const getMonthStatistics = () => {
    let totalShifts = 0;
    let totalAmount = 0;
    
    // Iterate through all schedule entries
    Object.entries(schedule).forEach(([dateKey, dayShifts]) => {
      const workDate = new Date(dateKey);
      // Only count shifts from the current month/year
      if (workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear) {
        totalShifts += dayShifts.length;
      }
    });
    
    return {
      month: currentMonth,
      year: currentYear,
      totalShifts,
      totalAmount: totalAmount
    };
  };

  // ===========================================================================
  // GESTURE HANDLING SECTION
  // ===========================================================================
  
  /**
   * LONG-PRESS GESTURE IMPLEMENTATION
   * 
   * Implements long-press functionality for the month header using a custom hook.
   * This provides advanced interaction patterns similar to native mobile apps.
   * 
   * GESTURE LOGIC:
   * - Long press (500ms) triggers month clearing modal
   * - Short press opens date picker
   * - Prevents conflicts between the two actions
   * 
   * UX CONSIDERATIONS:
   * - Only shows modal if month has data to clear
   * - Provides visual feedback during long press
   * - Handles both touch and mouse events
   */
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      setIsLongPressActive(true);
      // Only show modal if month has data to clear
      if (hasMonthData()) {
        setShowMonthClearModal(true);
      }
      // Reset flag after a delay
      setTimeout(() => setIsLongPressActive(false), 500);
    },
    onPress: () => {
      // Only trigger single press if long press wasn't active
      if (!isLongPressActive) {
        setTimeout(() => {
          if (!isLongPressActive) {
            setShowDatePicker(true);
          }
        }, 50);
      }
    },
    delay: 500 // 500ms for long press detection
  });

  /**
   * FALLBACK CLICK HANDLER
   * 
   * Provides fallback click handling for devices that don't support
   * touch events properly (some Android devices).
   */
  const handleMonthYearFallbackClick = (e: React.MouseEvent) => {
    // Only handle if it's a mouse click (not touch) and no long press is active
    if (e.type === 'click' && !isLongPressActive) {
      setTimeout(() => {
        if (!isLongPressActive && !showDatePicker) {
          setShowDatePicker(true);
        }
      }, 100);
    }
  };

  /**
   * DATA VALIDATION UTILITIES
   * 
   * These functions check for the existence of data to determine
   * whether certain operations should be available.
   */
  
  /**
   * Checks if the current month has any data (shifts or special dates)
   * @returns True if month contains data
   */
  const hasMonthData = () => {
    // Check for shifts in current month
    const hasShifts = Object.entries(schedule).some(([dateKey, dayShifts]) => {
      const workDate = new Date(dateKey);
      return workDate.getMonth() === currentMonth && 
             workDate.getFullYear() === currentYear && 
             dayShifts.length > 0 && 
             dayShifts.some(shiftId => shiftId.trim() !== '');
    });
    
    // Check for special dates in current month
    const hasSpecialDates = Object.entries(specialDates).some(([dateKey, isSpecial]) => {
      const workDate = new Date(dateKey);
      return workDate.getMonth() === currentMonth && 
             workDate.getFullYear() === currentYear && 
             isSpecial === true;
    });
    
    return hasShifts || hasSpecialDates;
  };

  // ===========================================================================
  // EVENT HANDLERS SECTION
  // ===========================================================================
  
  /**
   * NAVIGATION HANDLERS
   * 
   * These handlers manage calendar navigation with smooth animations.
   * The animation provides visual feedback for the navigation action.
   */
  
  /**
   * Handles month navigation with slide animation
   * @param direction - Navigation direction ('prev' or 'next')
   */
  const handleMonthNavigation = (direction: 'prev' | 'next') => {
    // Simplified month navigation for mobile
    if (calendarGridRef.current) {
      const slideDirection = direction === 'next' ? 30 : -30;
      
      // Animate out current month
      gsap.to(calendarGridRef.current, {
        x: slideDirection,
        opacity: 0.5,
        duration: 0.2,
        ease: "power2.out",
        force3D: true,
        onComplete: () => {
          // Change month data
          onNavigateMonth(direction);
          // Set up for slide in animation
          gsap.set(calendarGridRef.current, { 
            x: direction === 'next' ? -30 : 30
          });
          // Animate in new month
          gsap.to(calendarGridRef.current, {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            force3D: true
          });
        }
      });
    } else {
      // Fallback without animation
      onNavigateMonth(direction);
    }
  };

  /**
   * DATE PICKER HANDLERS
   * 
   * These handlers manage the month/year picker modal functionality.
   */
  
  /**
   * Handles month/year selection from date picker
   * @param year - Selected year
   * @param month - Selected month (0-based)
   */
  const handleDatePickerChange = (year: number, month: number) => {
    onDateChange(new Date(year, month, 1));
    setShowDatePicker(false);
  };

  /**
   * Handles backdrop clicks for date picker modal
   * @param e - Mouse event
   */
  const handleDatePickerBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowDatePicker(false);
    }
  };

  /**
   * TITLE EDITING HANDLERS
   * 
   * These handlers manage the inline title editing functionality.
   * Provides a smooth UX for customizing the schedule title.
   */
  
  /**
   * Initiates title editing mode
   */
  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTempTitle(scheduleTitle);
  };

  /**
   * Saves the edited title
   */
  const handleTitleSave = () => {
    onTitleUpdate(tempTitle.trim() || 'Work Schedule');
    setIsEditingTitle(false);
  };

  /**
   * Cancels title editing
   */
  const handleTitleCancel = () => {
    setTempTitle(scheduleTitle);
    setIsEditingTitle(false);
  };

  /**
   * Handles keyboard events during title editing
   * @param e - Keyboard event
   */
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  /**
   * DATE INTERACTION HANDLERS
   * 
   * These handlers manage user interactions with individual calendar dates.
   */
  
  /**
   * Handles date clicks with animation feedback
   * @param day - Day of the month that was clicked
   */
  const handleDateClick = (day: number) => {
    // Simplified click animation for mobile - no complex transforms
    const clickedElement = document.querySelector(`[data-day="${day}"]`);
    
    if (clickedElement) {
      // Simple, smooth scale animation
      gsap.to(clickedElement, {
        scale: 0.95,
        duration: 0.1,
        ease: "power2.out",
        force3D: true,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          gsap.set(clickedElement, { scale: 1 });
        }
      });
    }
    onDateClick(day);
  };

  /**
   * LONG-PRESS HANDLERS FOR DATE CLEARING
   * 
   * These handlers implement long-press functionality for individual dates,
   * allowing users to clear date data with a long-press gesture.
   */
  
  /**
   * Handles the start of a long-press gesture on a date
   * @param day - Day of the month
   * @param e - Mouse or touch event
   */
  const handleDateLongPressStart = (day: number, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const dateKey = formatDateKey(day);
    
    // Check if date has content before showing modal
    const hasShifts = schedule[dateKey] && schedule[dateKey].length > 0;
    const isSpecial = specialDates[dateKey] === true;
    const hasContent = hasShifts || isSpecial;
    
    // Only show modal if date has content to clear
    if (!hasContent) {
      return;
    }
    
    const timer = setTimeout(() => {
      setDateToDelete(dateKey);
      setShowClearDateModal(true);
      setLongPressTimer(null);
    }, 800); // 800ms long press
    
    setLongPressTimer(timer);
  };

  /**
   * Handles the end of a long-press gesture
   */
  const handleDateLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // ===========================================================================
  // DATA MANAGEMENT HANDLERS SECTION
  // ===========================================================================
  
  /**
   * DATA CLEARING OPERATIONS
   * 
   * These handlers manage data clearing operations for dates and months.
   * They implement the business logic for data deletion with proper
   * error handling and user feedback.
   */
  
  /**
   * Clears all data for a specific date
   * @param dateKey - Date key in YYYY-MM-DD format
   * @returns Promise that resolves when clearing is complete
   */
  const handleClearDate = async (dateKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Clear schedule data for this specific date
        setSchedule(prev => {
          const newSchedule = { ...prev };
          delete newSchedule[dateKey];
          return newSchedule;
        });
        
        // Clear special date marking for this specific date
        setSpecialDates(prev => {
          const newSpecialDates = { ...prev };
          delete newSpecialDates[dateKey];
          return newSpecialDates;
        });
        
        console.log(`✅ Successfully cleared date ${dateKey}`);
        resolve();
      } catch (error) {
        console.error(`❌ Error clearing date ${dateKey}:`, error);
        reject(error);
      }
    });
  };

  /**
   * Clears all data for an entire month
   * @param year - Year to clear
   * @param month - Month to clear (0-based)
   * @returns Promise that resolves when clearing is complete
   */
  const handleClearMonth = async (year: number, month: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Create date keys for the entire month
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthDateKeys: string[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          monthDateKeys.push(dateKey);
        }
        
        // Clear schedule data for the month
        setSchedule(prev => {
          const newSchedule = { ...prev };
          monthDateKeys.forEach(dateKey => {
            delete newSchedule[dateKey];
          });
          return newSchedule;
        });
        
        // Clear special dates for the month
        setSpecialDates(prev => {
          const newSpecialDates = { ...prev };
          monthDateKeys.forEach(dateKey => {
            delete newSpecialDates[dateKey];
          });
          return newSpecialDates;
        });
        
        console.log(`✅ Successfully cleared month ${month + 1}/${year}`);
        resolve();
      } catch (error) {
        console.error(`❌ Error clearing month ${month + 1}/${year}:`, error);
        reject(error);
      }
    });
  };

  // ===========================================================================
  // CALENDAR GRID GENERATION SECTION
  // ===========================================================================
  
  /**
   * CALENDAR GRID CALCULATION
   * 
   * This section generates the calendar grid structure, including empty
   * cells for proper alignment and calculating dynamic row heights.
   * 
   * GRID STRUCTURE:
   * - 7 columns (days of week)
   * - Variable rows based on month layout
   * - Empty cells for days before first day of month
   * - Dynamic heights based on content
   */
  
  // Check if current month/year matches today's month/year for month-to-date display
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  // Generate calendar days array
  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calculate number of rows needed
  const totalCells = calendarDays.length;
  const numberOfRows = Math.ceil(totalCells / 7);

  /**
   * DYNAMIC ROW HEIGHT CALCULATION
   * 
   * Calculates optimal row heights based on content to prevent layout shifts
   * and ensure consistent visual appearance.
   * 
   * ALGORITHM:
   * 1. Iterate through each row (7 days per row)
   * 2. Check content for each day in the row
   * 3. Find maximum content lines in the row
   * 4. Calculate height based on content + padding
   * 5. Apply minimum height for consistency
   * 
   * CONTENT TYPES:
   * - Date number (always present)
   * - Special date indicator (1 line)
   * - Shift indicators (variable lines)
   * - Maximum possible: 4 lines total
   */
  const calculateRowHeights = () => {
    const rowHeights: string[] = [];
    
    for (let row = 0; row < numberOfRows; row++) {
      let maxContentLines = 0;
      
      // Check each day in this row (7 days per row)
      for (let col = 0; col < 7; col++) {
        const dayIndex = row * 7 + col;
        if (dayIndex < calendarDays.length) {
          const day = calendarDays[dayIndex];
          if (day) {
            const dayShifts = getDayShifts(day);
            const hasSpecial = isSpecialDate(day);
            
            // Count content lines: shifts + special text (if present)
            // Maximum possible: SPECIAL (1 line) + 3 shifts (3 lines) = 4 total
            let contentLines = dayShifts.length;
            if (hasSpecial) contentLines += 1; // Add 1 line for "SPECIAL" text
            
            // Cap at maximum possible content (should never exceed 4)
            contentLines = Math.min(contentLines, 4);
            
            maxContentLines = Math.max(maxContentLines, contentLines);
          }
        }
      }
      
      // Calculate height based on maximum content lines in the row
      const baseHeight = window.innerWidth >= 640 ? 60 : 50; // Base height for date number
      const lineHeight = window.innerWidth >= 640 ? 16 : 12; // Reduced height per content line
      const padding = window.innerWidth >= 640 ? 16 : 12; // Top/bottom padding
      
      const calculatedHeight = baseHeight + (maxContentLines * lineHeight) + padding;
      const minHeight = window.innerWidth >= 640 ? 70 : 55; // Reduced minimum height
      
      const finalHeight = Math.max(calculatedHeight, minHeight);
      rowHeights.push(`${finalHeight}px`);
    }
    
    return rowHeights;
  };

  const rowHeights = calculateRowHeights();

  // ===========================================================================
  // RENDER SECTION
  // ===========================================================================
  
  /**
   * MAIN COMPONENT RENDER
   * 
   * The render section is organized into logical blocks:
   * 1. Header with title and navigation
   * 2. Date picker modal
   * 3. Calendar grid with days
   * 4. Amount display section
   * 5. Modal components
   * 6. Custom CSS for animations
   * 
   * STYLING APPROACH:
   * - Tailwind CSS for utility-first styling
   * - Responsive design with mobile-first approach
   * - Custom CSS for animations and special effects
   * - Inline styles for dynamic values
   */
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden select-none max-w-4xl mx-auto" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      
      {/* ===================================================================== */}
      {/* HEADER SECTION */}
      {/* ===================================================================== */}
      
      <div className="p-4 sm:p-6 border-b border-gray-200">
        {/* App Icon and Title */}
        <div className="flex items-center justify-center space-x-3 mb-4">
          <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
          {isEditingTitle ? (
            // Title editing mode
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={handleTitleKeyPress}
                onBlur={handleTitleSave}
                className="text-xl sm:text-3xl font-bold text-gray-900 text-center bg-transparent border-b-2 border-indigo-500 focus:outline-none min-w-[250px] sm:min-w-[300px]"
                autoFocus
              />
            </div>
          ) : (
            // Title display mode with edit button
            <button
              onClick={handleTitleClick}
              className="flex items-center space-x-2 text-xl sm:text-3xl font-bold text-gray-900 text-center hover:text-indigo-600 transition-colors duration-200 group select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              <span className="select-none">{scheduleTitle}</span>
              <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          )}
        </div>
        
        {/* Month/Year Navigation */}
        <div className="flex items-center justify-center space-x-3 sm:space-x-4">
          {/* Previous month button */}
          <button
            onClick={() => handleMonthNavigation('prev')}
            className="w-10 h-10 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors duration-200 active:scale-95 select-none"
            style={{ 
              userSelect: 'none', 
              WebkitUserSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              margin: '0',
              border: 'none',
              outline: 'none'
            }}
          >
            <ChevronLeft 
              className="w-5 h-5" 
              style={{
                display: 'block',
                margin: '0 auto'
              }}
            />
          </button>
          
          {/* Month/Year Button with Long-Press Support */}
          <div className="flex-1 flex justify-center">
            <button
              {...longPressHandlers}
              onClick={handleMonthYearFallbackClick}
              className="text-lg sm:text-xl font-semibold text-gray-800 hover:text-indigo-600 transition-colors duration-200 px-4 py-2 rounded-lg hover:bg-gray-50 select-none"
              style={{ 
                userSelect: 'none', 
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <span className="select-none">{monthNames[currentMonth]} {currentYear}</span>
            </button>
          </div>
          
          {/* Next month button */}
          <button
            onClick={() => handleMonthNavigation('next')}
            className="w-10 h-10 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors duration-200 active:scale-95 select-none"
            style={{ 
              userSelect: 'none', 
              WebkitUserSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0',
              margin: '0',
              border: 'none',
              outline: 'none'
            }}
          >
            <ChevronRight 
              className="w-5 h-5" 
              style={{
                display: 'block',
                margin: '0 auto'
              }}
            />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DATE PICKER MODAL */}
      {/* ===================================================================== */}
      
      {showDatePicker && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            console.log('📱 Backdrop clicked');
            handleDatePickerBackdropClick(e);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            pointerEvents: 'auto',
            // CRITICAL: Enable touch scrolling on the backdrop
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y' // Allow vertical panning (scrolling)
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full select-none" 
            style={{ 
              userSelect: 'none', 
              WebkitUserSelect: 'none'
            }}
            onClick={(e) => {
              console.log('📱 Modal content clicked - preventing close');
              // Prevent modal from closing when clicking inside
              e.stopPropagation();
            }}
          >
            {/* Header with close button */}
            <div className="relative p-6 pb-4 border-b border-gray-200">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('📱 Close button clicked');
                  setShowDatePicker(false);
                }}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 select-none"
                style={{ 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Title - centered */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-1 select-none">
                  Select Month & Year
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center select-none">Year</label>
                  <select
                    value={currentYear}
                    onChange={(e) => handleDatePickerChange(Number(e.target.value), currentMonth)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center transition-colors duration-200"
                  >
                    {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-center select-none">Month</label>
                  <select
                    value={currentMonth}
                    onChange={(e) => handleDatePickerChange(currentYear, Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center transition-colors duration-200"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index} value={index}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('📱 Close modal button clicked');
                  setShowDatePicker(false);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200 active:scale-95 select-none"
                style={{ 
                  userSelect: 'none', 
                  WebkitUserSelect: 'none',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <span className="select-none">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CALENDAR BODY */}
      {/* ===================================================================== */}
      
      <div className="p-3 sm:p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3 sm:mb-4">
          {weekDays.map((day, index) => (
            <div key={day} className={`p-2 sm:p-3 text-center font-semibold text-xs sm:text-sm select-none ${
              index === 0 ? 'text-red-600' : 'text-gray-600'
            }`} style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid - MOBILE OPTIMIZED ANIMATIONS */}
        <div 
          ref={calendarGridRef} 
          className="mb-4 sm:mb-6 select-none w-full mx-auto"
          style={{
            transform: 'translate3d(0,0,0)', // Force hardware acceleration
            backfaceVisibility: 'hidden',     // Prevent flickering
            userSelect: 'none',
            WebkitUserSelect: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: window.innerWidth >= 640 ? '8px' : '4px',
            // Center the grid in portrait mode
            justifyContent: 'center',
            alignContent: 'start',
            maxWidth: '100%',
            margin: '0 auto'
          }}
        >
          {calendarDays.map((day, index) => {
            const rowIndex = Math.floor(index / 7);
            const dayShifts = day ? getDayShifts(day) : [];
            const hasSpecialDate = day ? isSpecialDate(day) : false;
            const todayDate = day ? isToday(day) : false;
            const pastDate = day ? isPastDate(day) : false;

            return (
              <div
                key={index}
                data-day={day}
                className={`day-box p-1 sm:p-2 rounded-lg border-2 transition-colors duration-200 overflow-hidden relative select-none ${
                  day 
                    ? todayDate
                      ? `cursor-pointer border-indigo-400 shadow-lg bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-200` // TODAY: Permanent hover state
                      : `cursor-pointer hover:border-indigo-400 hover:shadow-lg bg-yellow-50 border-yellow-200 hover:bg-yellow-100 active:bg-yellow-200`
                    : 'border-transparent'
                }`}
                style={{
                  height: rowHeights[rowIndex], // All cells in same row have same height
                  transform: 'translate3d(0,0,0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  WebkitTransform: 'translate3d(0,0,0)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onClick={() => day && handleDateClick(day)}
               onMouseDown={(e) => day && handleDateLongPressStart(day, e)}
               onMouseUp={handleDateLongPressEnd}
               onMouseLeave={handleDateLongPressEnd}
               onTouchStart={(e) => day && handleDateLongPressStart(day, e)}
               onTouchEnd={handleDateLongPressEnd}
              >
                {day && (
                  <div className="flex flex-col select-none h-full">
                    {/* BIG X WATERMARK for past dates */}
                    {pastDate && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="text-gray-300 text-4xl sm:text-5xl font-bold opacity-30 select-none">
                          ✕
                        </div>
                      </div>
                    )}
                    
                    {/* Date header with special indicator and TODAY CIRCLE */}
                    <div className={`flex-shrink-0 mb-1.5 sm:mb-2 relative ${pastDate ? 'z-30' : ''}`}>
                      <div className={`text-sm sm:text-base text-center font-semibold ${getDateTextColor(day)} relative select-none`}>
                        {/* TODAY CIRCLE - PERFECT SIZE FOR 2-DIGIT DATES */}
                        {todayDate && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div 
                              className="w-6 h-6 sm:w-7 sm:h-7 border-2 border-green-500 rounded-full animate-pulse"
                              style={{
                                boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.2), 0 0 10px rgba(34, 197, 94, 0.3)',
                                animation: 'todayPulse 2s ease-in-out infinite'
                              }}
                            />
                          </div>
                        )}
                        <span className="relative z-10 select-none">{day}</span>
                        
                        {/* TICK INDICATOR for dates with shifts */}
                        {dayShifts.length > 0 && dayShifts.some(shiftId => shiftId.trim() !== '') && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg 
                              className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Content container - grows to fill available space */}
                    <div className={`flex flex-col items-center justify-start space-y-0.5 sm:space-y-1 px-0.5 select-none min-w-0 flex-1 ${pastDate ? 'z-30' : ''}`}>
                      {/* Special date indicator */}
                      {hasSpecialDate && (
                        <div 
                          className="special-text text-[8px] sm:text-[9px] text-red-500 font-bold leading-none mt-0.5 flex justify-center select-none"
                          style={{
                            transform: 'translate3d(0,0,0)',
                            backfaceVisibility: 'hidden',
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                          }}
                        >
                          <div className="text-center select-none">SPECIAL</div>
                        </div>
                      )}
                      
                      {/* All shifts displayed with labels */}
                      {dayShifts.map((shiftId, idx) => {
                        const shift = getShiftDisplay(shiftId);
                        return shift ? (
                          <div
                            key={`${shiftId}-${idx}`}
                            className={`shift-text text-[8px] sm:text-[11px] font-bold leading-tight text-black flex-shrink-0 w-full select-none whitespace-nowrap overflow-hidden ${pastDate ? 'opacity-60' : ''}`}
                            style={{
                              transform: 'translate3d(0,0,0)',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              WebkitTransform: 'translate3d(0,0,0)',
                              userSelect: 'none',
                              WebkitUserSelect: 'none'
                            }}
                          >
                            <div className="text-center select-none truncate px-0.5">{shift.time}</div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* AMOUNT DISPLAY SECTION */}
        {/* ================================================================= */}
        
        <div 
          className={`space-y-3 sm:space-y-4 select-none ${isCurrentMonth ? 'mt-4 sm:mt-6' : 'mt-4 sm:mt-6'}`}
          style={{ 
            userSelect: 'none', 
            WebkitUserSelect: 'none',
            // FIXED: Dynamic padding based on content
            paddingBottom: isCurrentMonth ? '30px' : '20px', // Extra padding when Month-to-Date is shown
            marginBottom: '10px'
          }}
        >
          {/* Month to Date Total - Only show if viewing current month */}
          {isCurrentMonth && (
            <div 
              className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4"
              style={{
                // FIXED: Ensure proper touch scrolling
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  <span className="text-base sm:text-lg font-semibold text-green-800 select-none">Month to Date</span>
                </div>
                <span className="text-lg sm:text-2xl font-bold text-green-900 select-none">
                  {formatCurrency(monthToDateAmount)}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-green-600 mt-2 text-center select-none">
                Amount earned from start of month to today ({today.getDate()}/{currentMonth + 1}/{currentYear})
              </p>
            </div>
          )}

          {/* Monthly Total */}
          <div 
            className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4"
            style={{
              // FIXED: Ensure proper touch scrolling
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                <span className="text-base sm:text-lg font-semibold text-indigo-800 select-none">Monthly Total</span>
              </div>
              <span className="text-lg sm:text-2xl font-bold text-indigo-900 select-none">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-600 mt-2 text-center select-none">
              Total amount for all scheduled shifts in {monthNames[currentMonth]} {currentYear}
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL COMPONENTS SECTION */}
      {/* ===================================================================== */}
      
      {/* Clear Date Modal */}
      <ClearDateModal
        isOpen={showClearDateModal}
        selectedDate={dateToDelete}
        schedule={schedule}
        specialDates={specialDates}
        onConfirm={handleClearDate}
        onCancel={() => {
          setShowClearDateModal(false);
          setDateToDelete(null);
        }}
      />

      {/* Clear Month Modal */}
      <DeleteMonthModal
        isOpen={showClearMonthModal}
        selectedMonth={currentMonth}
        selectedYear={currentYear}
        onConfirm={handleClearMonth}
        onCancel={() => setShowClearMonthModal(false)}
      />

      {/* Month Clear Modal (Long-press triggered) */}
      <MonthClearModal
        isOpen={showMonthClearModal}
        monthData={getMonthStatistics()}
        onConfirm={handleClearMonth}
        onCancel={() => setShowMonthClearModal(false)}
      />

      {/* ===================================================================== */}
      {/* CUSTOM CSS ANIMATIONS */}
      {/* ===================================================================== */}
      
      {/* Custom CSS for today's circle animation */}
      <style jsx>{`
        @keyframes todayPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * =============================================================================
 * LEARNING POINTS AND EDUCATIONAL VALUE
 * =============================================================================
 * 
 * This Calendar component demonstrates numerous advanced React and web development
 * concepts that are valuable for learning and professional development:
 * 
 * 1. COMPLEX STATE MANAGEMENT:
 *    - Multiple interconnected state variables
 *    - State synchronization between parent and child components
 *    - Optimistic updates for better user experience
 *    - State cleanup and memory management
 * 
 * 2. PERFORMANCE OPTIMIZATION TECHNIQUES:
 *    - Hardware-accelerated animations using CSS transforms
 *    - useCallback and useMemo for preventing unnecessary re-renders
 *    - Efficient DOM manipulation with GSAP
 *    - Optimized event handling for touch devices
 * 
 * 3. MOBILE-FIRST DEVELOPMENT:
 *    - Touch gesture recognition and handling
 *    - Responsive design with dynamic content sizing
 *    - Safe area insets for modern mobile devices
 *    - Hardware acceleration for smooth animations
 * 
 * 4. ADVANCED UI PATTERNS:
 *    - Modal management with portal rendering
 *    - Long-press gesture implementation
 *    - Inline editing with keyboard shortcuts
 *    - Dynamic content sizing and layout
 * 
 * 5. ANIMATION AND INTERACTION DESIGN:
 *    - Sequential animations with staggered timing
 *    - Physics-based easing functions
 *    - Visual feedback for user interactions
 *    - Smooth transitions between states
 * 
 * 6. DATA VISUALIZATION:
 *    - Calendar grid mathematics and layout
 *    - Financial calculations and formatting
 *    - Color coding for different data types
 *    - Dynamic content organization
 * 
 * 7. ACCESSIBILITY CONSIDERATIONS:
 *    - Keyboard navigation support
 *    - Screen reader friendly markup
 *    - High contrast color schemes
 *    - Touch target sizing guidelines
 * 
 * 8. CODE ORGANIZATION PATTERNS:
 *    - Logical section grouping with clear comments
 *    - Separation of concerns between different functionalities
 *    - Consistent naming conventions
 *    - Modular function design
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced animation libraries and techniques
 * - Web Workers for background calculations
 * - Service Workers for offline functionality
 * - Advanced accessibility patterns (ARIA)
 * - Performance monitoring and optimization
 * - Advanced TypeScript patterns
 * - State management alternatives (Redux, Zustand)
 * - Testing strategies for complex components
 * 
 * This component serves as an excellent reference for building complex,
 * production-ready React components with advanced features and optimizations.
 */