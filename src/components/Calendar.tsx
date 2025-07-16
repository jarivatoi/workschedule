/**
 * Calendar Component - Interactive Work Schedule Calendar
 * 
 * This component renders the main calendar interface where users can view and interact
 * with their work schedule. It provides a month-based view with visual indicators for
 * scheduled shifts, special dates, and calculated earnings.
 * 
 * Key Features:
 * - Month navigation with smooth animations
 * - Visual shift indicators with color coding
 * - Real-time amount calculations (monthly and month-to-date)
 * - Special date marking and management
 * - Long-press actions for data clearing
 * - Mobile-optimized touch interactions
 * - Hardware-accelerated animations via GSAP
 * 
 * Performance Optimizations:
 * - Sequential day animations for smooth mobile experience
 * - Dynamic row heights based on content
 * - Hardware acceleration with force3D
 * - Optimized touch event handling
 * 
 * Dependencies:
 * - React hooks for state management
 * - GSAP for animations
 * - Lucide React for icons
 * - Custom hooks for long-press detection
 * 
 * @author NARAYYA
 * @version 3.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Calculator, Edit3, TrendingUp, Trash2, AlertTriangle, X } from 'lucide-react';
import { gsap } from 'gsap';
import { SHIFTS } from '../constants';
import { DaySchedule, SpecialDates } from '../types';
import { ClearDateModal } from './ClearDateModal';
import { ClearMonthModal } from './ClearMonthModal';
import { MonthClearModal } from './MonthClearModal';
import { formatMauritianRupees } from '../utils/currency';
import { useLongPress } from '../hooks/useLongPress';

/**
 * Props interface for the Calendar component
 * 
 * @interface CalendarProps
 * @property {Date} currentDate - The currently viewed month/year
 * @property {DaySchedule} schedule - Object mapping dates to shift arrays
 * @property {SpecialDates} specialDates - Object mapping dates to special flags
 * @property {any} settings - Application settings including custom shifts and rates
 * @property {function} onDateClick - Callback when a date is clicked for editing
 * @property {function} onNavigateMonth - Callback for month navigation
 * @property {number} totalAmount - Total calculated amount for the month
 * @property {number} monthToDateAmount - Amount from start of month to today
 * @property {function} onDateChange - Callback when date picker changes month/year
 * @property {string} scheduleTitle - User-customizable title for the schedule
 * @property {function} onTitleUpdate - Callback when title is edited
 * @property {function} setSchedule - Function to update schedule data
 * @property {function} setSpecialDates - Function to update special dates data
 */
interface CalendarProps {
  currentDate: Date;
  schedule: DaySchedule;
  specialDates: SpecialDates;
  settings: any;
  onDateClick: (day: number) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  totalAmount: number;
  monthToDateAmount: number;
  onDateChange: (date: Date) => void;
  scheduleTitle: string;
  onTitleUpdate: (title: string) => void;
  onResetMonth?: (year: number, month: number) => void;
  setSchedule: React.Dispatch<React.SetStateAction<DaySchedule>>;
  setSpecialDates: React.Dispatch<React.SetStateAction<SpecialDates>>;
}

/**
 * Calendar Component
 * 
 * Renders an interactive monthly calendar with shift scheduling capabilities.
 * Handles user interactions, animations, and data management for the calendar view.
 * 
 * Architecture:
 * - Uses GSAP for hardware-accelerated animations
 * - Implements long-press detection for advanced actions
 * - Manages multiple modal states for different operations
 * - Calculates dynamic layouts based on content
 * 
 * Mobile Optimizations:
 * - Touch-friendly interaction targets (44px minimum)
 * - Smooth scrolling with momentum
 * - Optimized animation timing for mobile performance
 * - Safe area handling for notched devices
 * 
 * @param {CalendarProps} props - Component props
 * @returns {JSX.Element} The rendered calendar interface
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
  // ==================== STATE MANAGEMENT ====================
  
  /**
   * Controls visibility of the date picker modal
   * Used for month/year navigation
   */
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  /**
   * Controls title editing mode
   * When true, shows input field instead of title text
   */
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  /**
   * Temporary title value during editing
   * Allows cancellation without affecting the actual title
   */
  const [tempTitle, setTempTitle] = useState(scheduleTitle);
  
  /**
   * Modal state management for various clearing operations
   * Each modal handles different types of data clearing
   */
  const [showClearDateModal, setShowClearDateModal] = useState(false);
  const [showClearMonthModal, setShowClearMonthModal] = useState(false);
  const [showMonthClearModal, setShowMonthClearModal] = useState(false);
  
  /**
   * Stores the date key for the date being cleared
   * Format: YYYY-MM-DD
   */
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);
  
  /**
   * Timer reference for long-press detection
   * Used to implement long-press actions on dates
   */
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  /**
   * Reference to the calendar grid container
   * Used by GSAP for animations and DOM manipulation
   */
  const calendarGridRef = useRef<HTMLDivElement>(null);
  
  // ==================== DATE CALCULATIONS ====================
  
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  /**
   * Month and day name arrays for display formatting
   * Used throughout the component for consistent date formatting
   */
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // ==================== MODAL SCROLL PREVENTION ====================
  
  /**
   * Prevents body scroll when date picker modal is open
   * 
   * Why this approach:
   * - Prevents background scrolling on mobile devices
   * - Maintains modal position during device orientation changes
   * - Ensures consistent behavior across iOS and Android
   * 
   * Implementation matches other modals for consistency
   */
  useEffect(() => {
    if (showDatePicker) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, [showDatePicker]);

  // ==================== ANIMATION SYSTEM ====================
  
  /**
   * Mobile-optimized sequential animation system
   * 
   * Why this approach:
   * - Sequential animations feel more natural than simultaneous ones
   * - Reduced animation distance (80px vs 120px) for mobile performance
   * - Hardware acceleration via force3D for smooth 60fps animations
   * - Eased timing (easeOutQuart) feels more organic than linear
   * 
   * Performance considerations:
   * - Uses requestAnimationFrame for optimal timing
   * - Sorts elements by day number for logical animation order
   * - Separate animation phases for different content types
   * - Cleanup prevents memory leaks on component unmount
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

  // ==================== KEYBOARD NAVIGATION ====================
  
  /**
   * Handles escape key to close modals
   * 
   * Why separate from click handlers:
   * - Provides consistent keyboard navigation
   * - Accessibility requirement for modal dialogs
   * - Prevents event conflicts with other key handlers
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

  /**
   * Handles backdrop clicks to close date picker modal
   * 
   * @param {React.MouseEvent} e - Mouse event from backdrop click
   * 
   * Why check target === currentTarget:
   * - Ensures click was on backdrop, not modal content
   * - Prevents accidental closes when clicking inside modal
   * - Standard pattern for modal backdrop behavior
   */
  const handleDatePickerBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowDatePicker(false);
    }
  };

  // ==================== DATE UTILITY FUNCTIONS ====================
  
  /**
   * Formats a day number into a standardized date key
   * 
   * @param {number} day - Day of the month (1-31)
   * @returns {string} Date string in YYYY-MM-DD format
   * 
   * Why ISO 8601 format:
   * - Ensures consistent sorting across different locales
   * - Compatible with Date constructor and parsing
   * - Standard format for database storage and API communication
   * - Avoids timezone and locale-specific formatting issues
   */
  const formatDateKey = (day: number) => {
    return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  /**
   * Checks if a given day is today's date
   * 
   * @param {number} day - Day of the month to check
   * @returns {boolean} True if the day represents today
   * 
   * Why separate function:
   * - Used multiple times throughout component
   * - Encapsulates the comparison logic
   * - Makes the intent clear in calling code
   */
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear;
  };

  /**
   * Checks if a given day is in the past
   * 
   * @param {number} day - Day of the month to check
   * @returns {boolean} True if the day is before today
   * 
   * Used for:
   * - Visual styling (grayed out past dates)
   * - Preventing edits to historical data
   * - Showing completion status
   */
  const isPastDate = (day: number) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateToCheck < todayDate;
  };

  /**
   * Gets the day of the week for a given day
   * 
   * @param {number} day - Day of the month
   * @returns {number} Day of week (0 = Sunday, 6 = Saturday)
   * 
   * Used for:
   * - Determining if date is Sunday (special styling)
   * - Shift availability rules
   * - Weekend/weekday logic
   */
  const getDayOfWeek = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return date.getDay();
  };

  /**
   * Checks if a given day is Sunday
   * 
   * @param {number} day - Day of the month to check
   * @returns {boolean} True if the day is Sunday
   * 
   * Why separate from getDayOfWeek:
   * - Sunday has special significance in this app
   * - Used for styling and business logic
   * - Makes calling code more readable
   */
  const isSunday = (day: number) => {
    return getDayOfWeek(day) === 0;
  };

  /**
   * Checks if a given day is marked as a special date
   * 
   * @param {number} day - Day of the month to check
   * @returns {boolean} True if the day is marked as special
   * 
   * Special dates:
   * - Public holidays
   * - Company events
   * - Days with different shift rules
   * - User-defined special occasions
   */
  const isSpecialDate = (day: number) => {
    const dateKey = formatDateKey(day);
    return specialDates[dateKey] === true;
  };

  /**
   * Gets the scheduled shifts for a given day, sorted in display order
   * 
   * @param {number} day - Day of the month
   * @returns {string[]} Array of shift IDs sorted for optimal display
   * 
   * Sorting logic:
   * - Predefined order: 9-4, 4-10, 12-10, N (Night)
   * - Custom shifts appear after predefined ones
   * - Consistent ordering improves user experience
   * 
   * Why sorting matters:
   * - Visual consistency across the calendar
   * - Logical flow from day to evening to night shifts
   * - Easier for users to scan and understand
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
   * Gets display information for a shift ID
   * 
   * @param {string} shiftId - The shift identifier
   * @returns {Shift | undefined} Shift display object or undefined if not found
   * 
   * Used for:
   * - Getting display colors and labels
   * - Backward compatibility with legacy shift system
   * - Fallback when custom shifts aren't available
   */
  const getShiftDisplay = (shiftId: string) => {
    return SHIFTS.find(shift => shift.id === shiftId);
  };

  /**
   * Determines the appropriate text color for a date based on its status
   * 
   * @param {number} day - Day of the month
   * @returns {string} CSS class string for text color
   * 
   * Color coding:
   * - Green: Today (current date)
   * - Red: Sundays and special dates
   * - Gray: Regular dates
   * 
   * Why color coding:
   * - Immediate visual feedback about date significance
   * - Accessibility through color differentiation
   * - Consistent with calendar conventions
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
   * Formats currency amounts using the Mauritian Rupees formatter
   * 
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   * 
   * Why separate function:
   * - Consistent formatting across the component
   * - Easy to change currency formatting rules
   * - Handles edge cases (NaN, null, etc.)
   */
  const formatCurrency = (amount: number) => {
    const result = formatMauritianRupees(amount);
    return result.formatted;
  };

  // ==================== STATISTICS AND DATA MANAGEMENT ====================
  
  /**
   * Calculates month statistics for modal display
   * 
   * @returns {Object} Statistics object with month info and totals
   * 
   * Used by:
   * - Month clear modal to show what will be deleted
   * - Data export summaries
   * - User confirmation dialogs
   * 
   * Why calculate here:
   * - Real-time data ensures accuracy
   * - Avoids stale cached statistics
   * - Provides immediate feedback for user actions
   */
  const getMonthStatistics = () => {
    let totalShifts = 0;
    let totalAmount = 0;
    
    Object.entries(schedule).forEach(([dateKey, dayShifts]) => {
      const workDate = new Date(dateKey);
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

  // ==================== INTERACTION HANDLERS ====================
  
  /**
   * Long-press handlers for month header
   * 
   * Why long-press for month operations:
   * - Prevents accidental month clearing
   * - Follows mobile UI conventions
   * - Provides advanced functionality without cluttering UI
   * 
   * Configuration:
   * - 500ms delay balances accessibility and prevention of accidents
   * - onPress: Normal tap opens date picker
   * - onLongPress: Long press opens month clear modal
   */
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      setShowMonthClearModal(true);
    },
    onPress: () => {
      setShowDatePicker(true);
    },
    delay: 500
  });

  /**
   * Handles month/year header click to open date picker
   * 
   * Why separate from long-press:
   * - Provides fallback for devices without long-press
   * - Clearer intent for basic navigation
   * - Better accessibility for users with motor difficulties
   */
  const handleMonthYearClick = () => {
    setShowDatePicker(true);
  };

  /**
   * Handles date picker changes and updates current view
   * 
   * @param {number} year - Selected year
   * @param {number} month - Selected month (0-11)
   * 
   * Why separate parameters:
   * - More flexible than passing Date object
   * - Avoids timezone issues with Date construction
   * - Clearer intent about what's being changed
   */
  const handleDatePickerChange = (year: number, month: number) => {
    onDateChange(new Date(year, month, 1));
    setShowDatePicker(false);
  };

  // ==================== TITLE EDITING HANDLERS ====================
  
  /**
   * Enters title editing mode
   * 
   * Why separate editing state:
   * - Allows cancellation without affecting actual title
   * - Provides immediate visual feedback
   * - Prevents accidental changes from single clicks
   */
  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setTempTitle(scheduleTitle);
  };

  /**
   * Saves the edited title and exits editing mode
   * 
   * Validation:
   * - Trims whitespace to prevent empty titles
   * - Falls back to default if empty
   * - Updates parent state immediately
   */
  const handleTitleSave = () => {
    onTitleUpdate(tempTitle.trim() || 'Work Schedule');
    setIsEditingTitle(false);
  };

  /**
   * Cancels title editing and reverts to original
   * 
   * Why revert:
   * - Prevents loss of original title
   * - Clear user feedback about cancellation
   * - Consistent with standard editing patterns
   */
  const handleTitleCancel = () => {
    setTempTitle(scheduleTitle);
    setIsEditingTitle(false);
  };

  /**
   * Handles keyboard shortcuts during title editing
   * 
   * @param {React.KeyboardEvent} e - Keyboard event
   * 
   * Shortcuts:
   * - Enter: Save changes
   * - Escape: Cancel changes
   * 
   * Why keyboard shortcuts:
   * - Faster workflow for power users
   * - Standard editing conventions
   * - Better accessibility
   */
  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  /**
   * Handles date clicks with visual feedback animation
   * 
   * @param {number} day - Day that was clicked
   * 
   * Animation details:
   * - Simple scale animation for immediate feedback
   * - Hardware acceleration for smooth performance
   * - Yoyo effect (scale down then back up)
   * - Cleanup ensures element returns to normal state
   * 
   * Why animate clicks:
   * - Provides immediate user feedback
   * - Makes interface feel responsive
   * - Helps users understand what they clicked
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

  // ==================== LONG-PRESS DATE CLEARING ====================
  
  /**
   * Initiates long-press detection for date clearing
   * 
   * @param {number} day - Day being long-pressed
   * @param {React.MouseEvent | React.TouchEvent} e - Event object
   * 
   * Business logic:
   * - Only shows modal if date has content to clear
   * - Prevents unnecessary modals on empty dates
   * - 800ms delay balances accessibility and accident prevention
   * 
   * Why long-press for clearing:
   * - Prevents accidental data loss
   * - Follows mobile conventions for destructive actions
   * - Keeps UI clean without extra buttons
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
   * Cancels long-press detection
   * 
   * Called when:
   * - User lifts finger/mouse before timeout
   * - User moves finger/mouse away from element
   * - Component unmounts during long-press
   * 
   * Why cleanup is important:
   * - Prevents memory leaks from dangling timers
   * - Avoids unexpected modal appearances
   * - Ensures consistent behavior across interactions
   */
  const handleDateLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // ==================== DATA CLEARING FUNCTIONS ====================
  
  /**
   * Clears all data for a specific date
   * 
   * @param {string} dateKey - Date key in YYYY-MM-DD format
   * @returns {Promise<void>} Promise that resolves when clearing is complete
   * 
   * Operations performed:
   * - Removes all scheduled shifts for the date
   * - Removes special date marking
   * - Updates both schedule and specialDates state
   * - Provides console logging for debugging
   * 
   * Why async:
   * - Allows for future database operations
   * - Provides consistent API with other data operations
   * - Enables proper error handling in calling code
   * 
   * Error handling:
   * - Catches and logs any errors
   * - Rejects promise to allow caller to handle errors
   * - Maintains data integrity even if partial operations fail
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
   * 
   * @param {number} year - Year to clear
   * @param {number} month - Month to clear (0-11)
   * @returns {Promise<void>} Promise that resolves when clearing is complete
   * 
   * Algorithm:
   * 1. Calculate all date keys for the month
   * 2. Remove each date from schedule data
   * 3. Remove each date from special dates data
   * 4. Update state with cleaned data
   * 
   * Why generate all date keys:
   * - Ensures complete clearing even with sparse data
   * - Handles edge cases like leap years correctly
   * - More reliable than filtering existing keys
   * 
   * Performance considerations:
   * - Batches all operations into single state updates
   * - Avoids multiple re-renders during clearing
   * - Uses object spread for immutable updates
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

  /**
   * Closes the shift modal and resets selected date
   * 
   * Why separate function:
   * - Ensures both state variables are updated together
   * - Provides single point for modal closing logic
   * - Makes calling code cleaner and more readable
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  // ==================== NAVIGATION HANDLERS ====================
  
  /**
   * Handles month navigation with smooth animations
   * 
   * @param {'prev' | 'next'} direction - Direction to navigate
   * 
   * Animation approach:
   * - Slides current content out in direction of navigation
   * - Calls navigation callback to update data
   * - Slides new content in from opposite direction
   * - Uses hardware acceleration for smooth performance
   * 
   * Why animate navigation:
   * - Provides visual continuity between months
   * - Helps users understand spatial relationship
   * - Makes the interface feel more responsive
   * 
   * Fallback behavior:
   * - If animation fails, still performs navigation
   * - Ensures functionality even on low-performance devices
   * - Graceful degradation for accessibility
   */
  const handleMonthNavigation = (direction: 'prev' | 'next') => {
    // Simplified month navigation for mobile
    if (calendarGridRef.current) {
      const slideDirection = direction === 'next' ? 30 : -30;
      
      gsap.to(calendarGridRef.current, {
        x: slideDirection,
        opacity: 0.5,
        duration: 0.2,
        ease: "power2.out",
        force3D: true,
        onComplete: () => {
          onNavigateMonth(direction);
          gsap.set(calendarGridRef.current, { 
            x: direction === 'next' ? -30 : 30
          });
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
      onNavigateMonth(direction);
    }
  };

  // ==================== LAYOUT CALCULATIONS ====================
  
  /**
   * Checks if current month/year matches today's month/year
   * Used to determine whether to show month-to-date calculations
   * 
   * Why separate variable:
   * - Used in multiple places for conditional rendering
   * - Makes the logic clear and reusable
   * - Avoids repeated date calculations
   */
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  /**
   * Generates the calendar day array for rendering
   * 
   * Structure:
   * - null values for empty cells before first day of month
   * - Day numbers (1-31) for actual days
   * - Used by rendering logic to create grid layout
   * 
   * Why include empty cells:
   * - Maintains proper grid alignment
   * - Ensures days appear under correct weekday headers
   * - Standard calendar layout convention
   */
  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Calculate number of rows needed for dynamic layout
  const totalCells = calendarDays.length;
  const numberOfRows = Math.ceil(totalCells / 7);

  /**
   * Calculates dynamic row heights based on content
   * 
   * @returns {string[]} Array of height strings for each row
   * 
   * Algorithm:
   * 1. For each row, find the day with the most content
   * 2. Calculate height needed for that content
   * 3. Apply minimum height constraints
   * 4. Return array of height values
   * 
   * Why dynamic heights:
   * - Prevents content overflow in busy days
   * - Optimizes space usage for sparse months
   * - Maintains visual balance across rows
   * - Improves readability of shift information
   * 
   * Content calculation:
   * - Each shift = 1 line
   * - Special date marker = 1 line
   * - Maximum 4 lines total (3 shifts + special)
   * - Base height for date number + padding
   * 
   * Responsive considerations:
   * - Different base heights for mobile vs desktop
   * - Scaled line heights for different screen sizes
   * - Minimum heights to ensure touch targets
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

  // ==================== RENDER ====================
  
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden select-none max-w-4xl mx-auto" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
          {isEditingTitle ? (
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
          
          {/* Month/Year Button */}
          <div className="flex-1 flex justify-center">
            <button
              {...longPressHandlers}
              className="text-lg sm:text-xl font-semibold text-gray-700 text-center hover:bg-gray-100 px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 select-none"
              style={{ 
                userSelect: 'none', 
                WebkitUserSelect: 'none',
              }}
            >
              <span className="select-none">{monthNames[currentMonth]} {currentYear}</span>
            </button>
          </div>
          
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

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50"
          onClick={handleDatePickerBackdropClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            paddingTop: '33.333vh'
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full select-none" 
            style={{ 
              userSelect: 'none', 
              WebkitUserSelect: 'none',
              maxHeight: '60vh',
              marginTop: 0
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Header with close button */}
            <div className="relative p-6 pb-4 border-b border-gray-200">
              <button
                onClick={() => setShowDatePicker(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                <X className="w-5 h-5" />
              </button>
              
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
                onClick={() => setShowDatePicker(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200 active:scale-95 select-none"
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
              >
                <span className="select-none">Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Body */}
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

        {/* Calendar grid */}
        <div 
          ref={calendarGridRef} 
          className="mb-4 sm:mb-6 select-none w-full mx-auto"
          style={{
            transform: 'translate3d(0,0,0)',
            backfaceVisibility: 'hidden',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: window.innerWidth >= 640 ? '8px' : '4px',
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
                      ? `cursor-pointer border-indigo-400 shadow-lg bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-200`
                      : `cursor-pointer hover:border-indigo-400 hover:shadow-lg bg-yellow-50 border-yellow-200 hover:bg-yellow-100 active:bg-yellow-200`
                    : 'border-transparent'
                }`}
                style={{
                  height: rowHeights[rowIndex],
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
                    {/* Past date watermark */}
                    {pastDate && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="text-gray-300 text-4xl sm:text-5xl font-bold opacity-30 select-none">
                          ✕
                        </div>
                      </div>
                    )}
                    
                    {/* Date header */}
                    <div className={`flex-shrink-0 mb-1.5 sm:mb-2 relative ${pastDate ? 'z-30' : ''}`}>
                      <div className={`text-sm sm:text-base text-center font-semibold ${getDateTextColor(day)} relative select-none`}>
                        {/* Today circle indicator */}
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
                        
                        {/* Shift indicator */}
                        {dayShifts.length > 0 && (
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
                    
                    {/* Content container */}
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
                      
                      {/* Shift labels */}
                      {dayShifts.map((shiftId, idx) => {
                        const customShift = settings?.customShifts?.find(s => s.id === shiftId);
                        const displayText = customShift ? customShift.label : shiftId;
                        
                        return (
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
                            <div className="text-center select-none truncate px-0.5">{displayText}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Amount Display Section */}
        <div 
          className={`space-y-3 sm:space-y-4 select-none ${isCurrentMonth ? 'mt-4 sm:mt-6' : 'mt-4 sm:mt-6'}`}
          style={{ 
            userSelect: 'none', 
            WebkitUserSelect: 'none',
            paddingBottom: isCurrentMonth ? '30px' : '20px',
            marginBottom: '10px'
          }}
        >
          {/* Month to Date Total */}
          {isCurrentMonth && (
            <div 
              className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4"
              style={{
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

      {/* Modals */}
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

      <ClearMonthModal
        isOpen={showClearMonthModal}
        selectedMonth={currentMonth}
        selectedYear={currentYear}
        onConfirm={handleClearMonth}
        onCancel={() => setShowClearMonthModal(false)}
      />

      <MonthClearModal
        isOpen={showMonthClearModal}
        monthData={getMonthStatistics()}
        onConfirm={handleClearMonth}
        onCancel={() => setShowMonthClearModal(false)}
      />

      {/* CSS for today's circle animation */}
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