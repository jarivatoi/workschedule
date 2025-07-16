/**
 * Main Application Component - Work Schedule Calendar
 * 
 * This is the root component that orchestrates the entire work schedule application.
 * It manages global state, handles data persistence via IndexedDB, and coordinates
 * between the calendar view, settings panel, and data management features.
 * 
 * Key Features:
 * - Calendar-based shift scheduling with visual feedback
 * - Custom shift creation and management
 * - Real-time salary calculations with overtime support
 * - Data import/export functionality
 * - Progressive Web App (PWA) capabilities
 * - Mobile-optimized touch interactions
 * 
 * Architecture Notes:
 * - Uses IndexedDB for offline-first data storage
 * - Implements optimistic updates for better UX
 * - Hardware-accelerated animations via GSAP
 * - Tab-based navigation with smooth transitions
 * 
 * Dependencies:
 * - React 18+ with hooks
 * - GSAP for animations
 * - IndexedDB for offline data storage
 * - Lucide React for icons
 * 
 * @author NARAYYA
 * @version 3.0 (IndexedDB powered)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { ShiftModal } from './components/ShiftModal';
import { SettingsPanel } from './components/SettingsPanel';
import { MenuPanel } from './components/MenuPanel';
import { ClearDateModal } from './components/ClearDateModal';
import { DeleteMonthModal } from './components/DeleteMonthModal';
import TabNavigation from './components/TabNavigation';
import { useScheduleCalculations } from './hooks/useScheduleCalculations';
import { useIndexedDB, useScheduleData } from './hooks/useIndexedDB';
import { workScheduleDB } from './utils/indexedDB';
import { AddToHomescreen } from './utils/addToHomescreen';
import { DEFAULT_SHIFT_COMBINATIONS } from './constants';
import { DaySchedule, SpecialDates, Settings, ExportData } from './types';
import { gsap } from 'gsap';

/**
 * Main App Component
 * 
 * Manages the entire application state and coordinates between different views.
 * Implements a tab-based navigation system with calendar, settings, and data management.
 * 
 * State Management Strategy:
 * - Uses IndexedDB for persistent storage (offline-first approach)
 * - Implements optimistic updates for better perceived performance
 * - Handles data synchronization between components via props drilling
 * - Uses refresh keys to force recalculation when deep object changes occur
 * 
 * Performance Optimizations:
 * - Artificial loading delay for better perceived performance
 * - Hardware-accelerated animations via GSAP with force3D
 * - Memoized calculations to prevent unnecessary re-renders
 * - Debounced state updates for smooth interactions
 * 
 * @returns {JSX.Element} The main application interface
 */
function App() {
  // ==================== CORE STATE MANAGEMENT ====================
  
  /**
   * Current date being viewed in the calendar
   * Used to determine which month/year to display and calculate amounts for
   * Always represents the first day of the month being viewed
   */
  const [currentDate, setCurrentDate] = useState(new Date());
  
  /**
   * Currently selected date for shift editing
   * Format: YYYY-MM-DD string or null if no date selected
   * Used to open the shift modal for a specific date
   */
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  /**
   * Controls visibility of the shift editing modal
   * Managed separately from selectedDate to allow for smooth close animations
   */
  const [showModal, setShowModal] = useState(false);
  
  /**
   * Active tab in the navigation system
   * Determines which main view is currently displayed
   * Drives the content switching logic and tab highlighting
   */
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings' | 'data'>('calendar');
  
  /**
   * Force refresh key for calculations
   * Incremented when we need to trigger recalculation of amounts
   * 
   * WHY: React's dependency arrays don't always catch deep object changes
   * in schedule data, especially when shifts are added/removed. This key
   * forces the useScheduleCalculations hook to recalculate totals.
   */
  const [refreshKey, setRefreshKey] = useState(0);
  
  // ==================== LOADING STATE MANAGEMENT ====================
  
  /**
   * Artificial loading state for better UX
   * Shows a professional loading screen even if data loads quickly
   * 
   * WHY: Instant loads can feel jarring and don't give users time to
   * read branding or understand what's happening. A 3-second delay
   * creates a more premium, intentional feeling.
   */
  const [artificialLoading, setArtificialLoading] = useState(true);
  
  /**
   * Loading progress for the artificial loading screen
   * Smoothly animates from 0 to 100 over 3 seconds using requestAnimationFrame
   */
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  /**
   * Smoothed progress value for natural animation
   * Uses easing function (easeOutQuart) to make progress feel more organic
   * WHY: Linear progress feels robotic; eased progress feels more human
   */
  const [smoothProgress, setSmoothProgress] = useState(0);
  
  /**
   * Reference to main content container for animations
   * Used by GSAP for hardware-accelerated transitions between tabs
   * WHY: Direct DOM manipulation via refs is more performant than CSS transitions
   */
  const contentRef = useRef<HTMLDivElement>(null);

  // ==================== DATA PERSISTENCE HOOKS ====================
  
  /**
   * Main schedule and special dates data from IndexedDB
   * This hook handles all CRUD operations for shift scheduling data
   * 
   * Data Structure:
   * - schedule: Record<string, string[]> - Maps date strings (YYYY-MM-DD) to arrays of shift IDs
   * - specialDates: Record<string, boolean> - Maps date strings to special date flags
   * 
   * WHY IndexedDB: Unlike localStorage, IndexedDB can store large amounts of data
   * (hundreds of MB) and doesn't block the main thread during operations.
   * Perfect for storing years of shift data.
   */
  const { schedule, specialDates, setSchedule, setSpecialDates, isLoading: dataLoading, error: dataError, refreshData } = useScheduleData();
  
  /**
   * Schedule title metadata
   * Allows users to customize the main heading of their schedule
   * Stored separately from settings to allow for easy editing without affecting calculations
   */
  const [scheduleTitle, setScheduleTitle, { isLoading: titleLoading, refresh: refreshTitle }] = useIndexedDB<string>('scheduleTitle', 'Work Schedule', 'metadata');
  
  /**
   * Application settings including salary, rates, and custom shifts
   * This is the core configuration that drives all salary calculations
   * 
   * Critical Fields:
   * - basicSalary: Annual salary used for hourly rate calculation
   * - hourlyRate: Rate per hour for normal time (can be calculated or manual)
   * - overtimeMultiplier: Multiplier for overtime rate (typically 1.5x)
   * - customShifts: User-defined shift templates with normal/overtime hours
   * 
   * WHY separate from schedule: Settings change infrequently but affect all calculations,
   * while schedule data changes daily. Separating them optimizes update performance.
   */
  const [settings, setSettings, { isLoading: settingsLoading, refresh: refreshSettings }] = useIndexedDB<Settings>('workSettings', {
    basicSalary: 35000,
    hourlyRate: 173.08,
    shiftCombinations: DEFAULT_SHIFT_COMBINATIONS, // Legacy field for compatibility
    currency: 'Rs',
    customShifts: []
  });

  // Debug logging for settings to help troubleshoot calculation issues
  // WHY: Settings are complex and calculation bugs are hard to trace without visibility
  console.log('🔧 App component - Settings state:', {
    settings,
    hasSettings: !!settings,
    hasShiftCombinations: !!settings?.shiftCombinations,
    combinationsCount: settings?.shiftCombinations?.length || 0,
    settingsLoading,
    basicSalary: settings?.basicSalary,
    hourlyRate: settings?.hourlyRate
  });

  /**
   * Calculate total amounts for current month and month-to-date
   * Uses memoized hook to prevent unnecessary recalculations
   * 
   * WHY refreshKey dependency: Forces recalculation when shifts are modified
   * even if React doesn't detect the deep object changes in schedule
   */
  const { totalAmount, monthToDateAmount } = useScheduleCalculations(schedule, settings, specialDates, currentDate, refreshKey);

  // Extract current month/year for date filtering
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  /**
   * Combined loading state check
   * App shows loading screen until both data and artificial delay complete
   * WHY: Ensures consistent loading experience regardless of data load speed
   */
  const isDataLoading = dataLoading || titleLoading || settingsLoading;

  // ==================== ARTIFICIAL LOADING ANIMATION ====================
  
  /**
   * Smooth loading progress animation using requestAnimationFrame
   * Creates a natural-feeling progress bar that takes exactly 3 seconds
   * 
   * WHY requestAnimationFrame: Provides smooth 60fps animation that's
   * synchronized with the browser's repaint cycle for optimal performance
   */
  useEffect(() => {
    let animationFrame: number;
    let startTime: number;
    const duration = 3000; // 3 seconds total duration
    
    /**
     * Animation loop function
     * @param {number} currentTime - Current timestamp from requestAnimationFrame
     */
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Apply easeOutQuart easing for natural feeling progress
      // WHY easeOutQuart: Starts fast, slows down at end - feels more natural than linear
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const smoothedProgress = Math.round(easeOutQuart * 100);
      
      setSmoothProgress(smoothedProgress);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setSmoothProgress(100);
        // Small delay after reaching 100% for visual confirmation
        setTimeout(() => {
          setArtificialLoading(false);
        }, 100);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Combined loading state - show loading until both data and artificial delay complete
  const isLoading = isDataLoading || artificialLoading;

  // ==================== PWA INITIALIZATION ====================
  
  /**
   * Initialize Add to Home Screen functionality
   * Only runs after app fully loads to avoid interfering with initial experience
   * 
   * WHY delayed initialization: PWA prompts during loading feel pushy and
   * can interfere with the user's first impression of the app
   */
  useEffect(() => {
    if (!isLoading) {
      console.log('🏠 Initializing Add to Homescreen...');
      
      // Create AddToHomescreen instance with app-specific configuration
      const addToHomescreenInstance = new AddToHomescreen({
        appName: 'Work Schedule',
        appIconUrl: 'https://jarivatoi.github.io/anwh/icon.svg',
        maxModalDisplayCount: 3, // Limit to 3 prompts total to avoid annoyance
        skipFirstVisit: false,
        startDelay: 2000, // Wait 2 seconds after app loads
        lifespan: 20000, // Auto-close after 20 seconds
        displayPace: 1440, // 24 hours between prompts (in minutes)
        mustShowCustomPrompt: false
      });

      console.log('📱 Add to Homescreen instance created');
      
      // Show prompt after delay if user can install
      setTimeout(() => {
        console.log('⏰ Checking if can prompt...');
        if (addToHomescreenInstance.canPrompt()) {
          console.log('✅ Showing Add to Homescreen prompt');
          addToHomescreenInstance.show();
        } else {
          console.log('❌ Cannot show Add to Homescreen prompt');
          console.log('Debug info:', {
            isStandalone: addToHomescreenInstance.isStandalone(),
            canPrompt: addToHomescreenInstance.canPrompt()
          });
        }
      }, 2000);
    }
  }, [isLoading]);

  // ==================== CONTENT ANIMATIONS ====================
  
  /**
   * Initialize main content entrance animation
   * Uses GSAP for hardware-accelerated animation when app finishes loading
   * 
   * WHY GSAP over CSS: Better performance, more control, works consistently
   * across all browsers including older mobile browsers
   */
  useEffect(() => {
    if (contentRef.current && !isLoading) {
      console.log('🎨 Initializing main app animations');
      gsap.fromTo(contentRef.current,
        {
          opacity: 0,
          y: 30,
          scale: 0.95,
          force3D: true // Force hardware acceleration
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out", // Smooth easing
          force3D: true
        }
      );
    }
  }, [isLoading]);

  // ==================== TAB NAVIGATION ====================
  
  /**
   * Handle tab changes with immediate UI feedback
   * Updates active tab state immediately for responsive feel
   * 
   * @param {string} newTab - The tab ID to switch to
   * 
   * WHY immediate update: Users expect instant feedback when clicking tabs.
   * Any delay feels sluggish and unresponsive.
   */
  const handleTabChange = (newTab: 'calendar' | 'settings' | 'data') => {
    if (newTab === activeTab || !contentRef.current) return;

    // Immediately update the active tab state for instant UI feedback
    setActiveTab(newTab);
  };

  // ==================== CALENDAR NAVIGATION ====================
  
  /**
   * Navigate to previous or next month
   * @param {string} direction - 'prev' for previous month, 'next' for next month
   */
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1));
  };

  /**
   * Format a day number into a standardized date key
   * @param {number} day - Day of the month (1-31)
   * @returns {string} Date string in YYYY-MM-DD format
   * 
   * WHY this format: ISO 8601 standard ensures consistent sorting and parsing
   */
  const formatDateKey = (day: number) => {
    return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  /**
   * Handle date click to open shift modal
   * @param {number} day - Day of the month that was clicked
   */
  const handleDateClick = (day: number) => {
    const dateKey = formatDateKey(day);
    setSelectedDate(dateKey);
    setShowModal(true);
  };

  // ==================== SHIFT MANAGEMENT ====================
  
  /**
   * Check if a shift can be selected for a given date
   * Implements business rules for shift conflicts and limitations
   * 
   * @param {string} shiftId - ID of the shift to check
   * @param {string} dateKey - Date key in YYYY-MM-DD format
   * @returns {boolean} True if shift can be selected
   * 
   * Business Rules:
   * - 9-4 and 12-10 cannot overlap (different shift types)
   * - 12-10 and 4-10 cannot overlap (time conflict)
   * 
   * WHY these rules: Based on real workplace scheduling constraints
   * where certain shifts have conflicting time periods or purposes
   */
  const canSelectShift = (shiftId: string, dateKey: string) => {
    const currentShifts = schedule[dateKey] || [];
    
    // 9-4 and 12-10 cannot overlap (different shift types)
    if (shiftId === '9-4' && currentShifts.includes('12-10')) return false;
    if (shiftId === '12-10' && currentShifts.includes('9-4')) return false;
    
    // 12-10 and 4-10 cannot overlap (time conflict)
    if (shiftId === '12-10' && currentShifts.includes('4-10')) return false;
    if (shiftId === '4-10' && currentShifts.includes('12-10')) return false;
    
    return true;
  };

  /**
   * Toggle a shift on/off for the selected date
   * Implements optimistic updates for immediate UI feedback
   * 
   * @param {string} shiftId - ID of the shift to toggle
   * 
   * WHY optimistic updates: Users expect immediate feedback when clicking.
   * Database updates happen in background while UI updates instantly.
   */
  const toggleShift = (shiftId: string) => {
    if (!selectedDate) return;
    
    const currentShifts = schedule[selectedDate] || [];
    
    if (currentShifts.includes(shiftId)) {
      // Remove shift
      const updatedShifts = currentShifts.filter(id => id !== shiftId);
      setSchedule(prev => ({
        ...prev,
        [selectedDate]: updatedShifts.length > 0 ? updatedShifts : []
      }));
    } else {
      // Add shift if business rules allow it
      if (canSelectShift(shiftId, selectedDate)) {
        setSchedule(prev => ({
          ...prev,
          [selectedDate]: [...currentShifts, shiftId]
        }));
      }
    }
    
    // Force refresh calculations when shifts change
    // WHY: React doesn't always detect deep object changes in schedule
    setRefreshKey(prev => prev + 1);
  };

  // ==================== SPECIAL DATE MANAGEMENT ====================
  
  /**
   * Toggle special date status for a given date
   * Special dates affect which shifts are available and how they're calculated
   * 
   * @param {string} dateKey - Date key in YYYY-MM-DD format
   * @param {boolean} isSpecial - Whether the date should be marked as special
   * 
   * WHY useCallback: This function is passed to child components and we want
   * to prevent unnecessary re-renders when the function reference changes
   */
  const toggleSpecialDate = useCallback((dateKey: string, isSpecial: boolean) => {
    setSpecialDates(prev => {
      const newSpecialDates = { ...prev };
      if (isSpecial) {
        newSpecialDates[dateKey] = true;
      } else {
        delete newSpecialDates[dateKey];
      }
      return newSpecialDates;
    });
  }, [setSpecialDates]);

  // ==================== DATA MANAGEMENT ====================
  
  /**
   * Reset/clear data for a specific month or date
   * Supports both full month clearing and individual date clearing
   * 
   * @param {number} year - Year to clear
   * @param {number} month - Month to clear (0-11)
   * @param {number} [specificDay] - Optional specific day to clear
   * @param {boolean} [showAlert=true] - Whether to show success alert
   * 
   * WHY async: Database operations are asynchronous and we need to handle
   * potential errors gracefully without blocking the UI
   */
  const handleResetMonth = useCallback(async (year: number, month: number, specificDay?: number, showAlert: boolean = true) => {
    try {
      if (specificDay) {
        console.log(`🗑️ Clearing specific date: ${specificDay}/${month + 1}/${year}`);
        
        // Clear only the specific date
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${specificDay.toString().padStart(2, '0')}`;
        
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
        
        // Force refresh calculations
        setRefreshKey(prev => prev + 1);
        
        console.log(`✅ Successfully cleared date ${specificDay}/${month + 1}/${year}`);
        return;
      }
      
      console.log(`🗑️ Resetting month data for ${month + 1}/${year}`);
      
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
      
      // Force refresh calculations
      setRefreshKey(prev => prev + 1);
      
      console.log(`✅ Successfully reset month data for ${month + 1}/${year}`);
      
      // Show success feedback only if requested
      if (showAlert) {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        alert(`✅ Successfully cleared all data for ${monthNames[month]} ${year}`);
      }
      
    } catch (error) {
      console.error('❌ Error resetting month:', error);
      alert('❌ Error resetting month data. Please try again.');
    }
  }, [setSchedule, setSpecialDates]);

  // ==================== MODAL MANAGEMENT ====================
  
  /**
   * Close the shift modal and reset selected date
   * Separated into its own function for clarity and reusability
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  // ==================== SETTINGS MANAGEMENT ====================
  
  /**
   * Update basic salary and automatically calculate hourly rate
   * Uses standard formula: (salary * 12) / 52 / 40
   * 
   * @param {number} salary - Annual salary amount
   * 
   * WHY auto-calculate: Most users don't know their hourly rate but know
   * their annual salary. This provides a reasonable default calculation.
   */
  const updateBasicSalary = useCallback((salary: number) => {
    const hourlyRate = (salary * 12) / 52 / 40; // Standard calculation: annual to hourly
    console.log('💰 Updating salary:', { salary, hourlyRate });
    setSettings(prev => ({
      ...prev,
      basicSalary: salary,
      hourlyRate: hourlyRate
    }));
  }, [setSettings]);

  /**
   * Legacy function for shift hours updates
   * Kept for compatibility but no longer used in current implementation
   * 
   * @param {string} combinationId - ID of shift combination
   * @param {number} hours - Number of hours
   * 
   * WHY deprecated: Moved to custom shifts system for more flexibility
   */
  const updateShiftHours = useCallback((combinationId: string, hours: number) => {
    console.log('⏰ Updating shift hours:', { combinationId, hours });
    console.log('⚠️ updateShiftHours called but no longer used');
  }, [setSettings]);

  /**
   * Update currency symbol/code
   * @param {string} currency - Currency symbol or code to use
   */
  const updateCurrency = useCallback((currency: string) => {
    console.log('💱 Updating currency:', currency);
    setSettings(prev => ({
      ...prev,
      currency
    }));
  }, [setSettings]);

  /**
   * Update hourly rate manually
   * @param {number} rate - Hourly rate amount
   */
  const updateHourlyRate = useCallback((rate: number) => {
    console.log('⏰ Updating hourly rate:', rate);
    setSettings(prev => ({
      ...prev,
      hourlyRate: rate
    }));
  }, [setSettings]);

  /**
   * Update overtime multiplier
   * @param {number} multiplier - Overtime rate multiplier (typically 1.5)
   */
  const updateOvertimeMultiplier = useCallback((multiplier: number) => {
    console.log('⏰ Updating overtime multiplier:', multiplier);
    setSettings(prev => ({
      ...prev,
      overtimeMultiplier: multiplier
    }));
  }, [setSettings]);

  /**
   * Legacy function for shift enabled status
   * Kept for compatibility but no longer used
   * 
   * WHY deprecated: Custom shifts have their own enabled property
   */
  const updateShiftEnabled = useCallback((combinationId: string, enabled: boolean) => {
    console.log('✅ Updating shift enabled:', { combinationId, enabled });
    console.log('⚠️ updateShiftEnabled called but no longer used');
  }, [setSettings]);

  /**
   * Add a new custom shift
   * @param {CustomShift} shift - The shift object to add
   */
  const addCustomShift = useCallback((shift: any) => {
    console.log('➕ Adding custom shift:', shift);
    setSettings(prev => ({
      ...prev,
      customShifts: [...(prev.customShifts || []), shift]
    }));
    
    // Force refresh calculations when new shifts are added
    setRefreshKey(prev => prev + 1);
  }, [setSettings]);

  /**
   * Update an existing custom shift
   * @param {string} shiftId - ID of the shift to update
   * @param {CustomShift} shift - Updated shift object
   */
  const updateCustomShift = useCallback((shiftId: string, shift: any) => {
    console.log('📝 Updating custom shift:', { shiftId, shift });
    setSettings(prev => ({
      ...prev,
      customShifts: (prev.customShifts || []).map(s =>
        s.id === shiftId ? shift : s
      )
    }));
    
    // Force refresh calculations when shifts are updated
    setRefreshKey(prev => prev + 1);
  }, [setSettings]);

  /**
   * Delete a custom shift and remove it from all scheduled dates
   * @param {string} shiftId - ID of the shift to delete
   * 
   * WHY remove from schedule: Prevents orphaned shift references that
   * would cause calculation errors or display issues
   */
  const deleteCustomShift = useCallback((shiftId: string) => {
    console.log('🗑️ Deleting custom shift:', shiftId);
    
    // Remove the shift from all schedule entries
    setSchedule(prev => {
      const newSchedule = { ...prev };
      Object.keys(newSchedule).forEach(dateKey => {
        newSchedule[dateKey] = newSchedule[dateKey].filter(id => id !== shiftId);
        // Remove empty arrays to keep data clean
        if (newSchedule[dateKey].length === 0) {
          delete newSchedule[dateKey];
        }
      });
      return newSchedule;
    });
    
    // Remove the shift from settings
    setSettings(prev => ({
      ...prev,
      customShifts: (prev.customShifts || []).filter(s => s.id !== shiftId)
    }));
    
    // Force refresh calculations when shifts are deleted
    setRefreshKey(prev => prev + 1);
  }, [setSettings]);

  // ==================== DATA IMPORT/EXPORT ====================
  
  /**
   * Export all application data as JSON file
   * Creates a downloadable backup file with all user data
   * 
   * WHY async: File operations can be slow and we don't want to block the UI
   */
  const handleExportData = async () => {
    try {
      const exportData = await workScheduleDB.exportAllData();
      
      // Create downloadable JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Trigger download with descriptive filename
      const link = document.createElement('a');
      link.href = url;
      link.download = `work-schedule-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up memory
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  /**
   * Import data from a backup file
   * Replaces all current data with imported data
   * 
   * @param {any} data - Parsed JSON data from import file
   * 
   * WHY multiple refreshes: Different parts of the app may not immediately
   * reflect the imported data due to React's batching. Multiple refreshes
   * with delays ensure all components update properly.
   */
  const handleImportData = async (data: any) => {
    try {
      console.log('🔄 Starting import process with data:', data);
      
      // Import data to IndexedDB
      await workScheduleDB.importAllData(data);
      console.log('✅ Data imported to IndexedDB');
      
      // Show loading state during refresh
      console.log('🔄 Refreshing all data from database...');
      
      // Refresh all data with proper error handling
      const refreshPromises = [
        refreshData().catch(err => console.error('Failed to refresh schedule data:', err)),
        refreshSettings().catch(err => console.error('Failed to refresh settings:', err)),
        refreshTitle().catch(err => console.error('Failed to refresh title:', err))
      ];
      
      await Promise.allSettled(refreshPromises);
      console.log('✅ All data refresh attempts completed');
      
      // Force multiple calculation refreshes with delays
      // WHY staggered: Ensures all state updates are processed before recalculating
      const triggerRefresh = (delay: number, label: string) => {
        setTimeout(() => {
          console.log(`🔄 ${label} refresh key update`);
          setRefreshKey(prev => prev + 1);
        }, delay);
      };
      
      // Immediate refresh
      setRefreshKey(prev => prev + 1);
      
      // Staggered refreshes to ensure all state updates are processed
      triggerRefresh(100, 'First delayed');
      triggerRefresh(300, 'Second delayed');
      triggerRefresh(600, 'Third delayed');
      triggerRefresh(1000, 'Final delayed');
      
      const version = data.version || '1.0';
      if (version === '1.0') {
        // Show success message for older format files
        console.log('Data imported successfully! Note: This was an older format file. Special date information was not available and has been reset.');
      } else {
        console.log('Data imported successfully!');
      }
    } catch (error) {
      console.error('Import failed:', error);
      console.error('Error importing data. Please check the file format.');
    }
  };

  /**
   * Handle date change from date picker
   * @param {Date} date - New date to navigate to
   */
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  /**
   * Handle schedule title updates
   * @param {string} newTitle - New title for the schedule
   */
  const handleTitleUpdate = (newTitle: string) => {
    setScheduleTitle(newTitle);
  };

  // ==================== ERROR HANDLING ====================
  
  /**
   * Show error screen if data loading failed
   * Provides user-friendly error message and retry option
   */
  if (dataError) {
    console.log('❌ Showing error screen:', dataError);
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Database Error</h2>
          <p className="text-gray-700 mb-6">{dataError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==================== LOADING SCREEN ====================
  
  /**
   * Enhanced loading screen with progress animation
   * Shows branding and progress while data loads and artificial delay completes
   */
  if (isLoading) {
    console.log('⏳ Data still loading, showing enhanced loading screen');
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100" style={{ minHeight: '100vh', minHeight: '-webkit-fill-available' }}>
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Work Schedule Calendar
          </h2>
          
          <p className="text-lg text-gray-700 mb-6">
            Created by NARAYYA
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-gray-600 text-lg">Loading your workspace...</span>
          </div>
          
          <div className="space-y-3 text-base text-gray-600">
            <p>• Initializing offline database</p>
            <p>• Loading schedule data</p>
            <p>• Preparing settings</p>
            <p>• Calculating amounts</p>
            <p>• Setting up interface</p>
          </div>
          
          <div className="mt-8 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-600 h-2 rounded-full transition-all duration-100 ease-out" 
              style={{ 
                width: `${smoothProgress}%`,
                transition: 'width 0.1s ease-out'
              }}
            ></div>
          </div>
          
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-600 font-mono tabular-nums">{smoothProgress}%</span>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN APPLICATION INTERFACE ====================
  
  console.log('🎯 Showing main app interface');
  return (
    <>
      <div 
        className="min-h-screen bg-black select-none p-4"
        style={{ 
          minHeight: '100vh',
          minHeight: '100dvh', // Dynamic viewport height for mobile
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          backgroundColor: 'black !important', // Force black background
          // Enable smooth iOS scrolling
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y' // Allow vertical touch scrolling
        }}
      >
        {/* Tab Navigation */}
        <div className="mb-4">
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        
        {/* Content with smooth transitions */}
        <div 
          ref={contentRef}
          style={{
            transform: 'translate3d(0,0,0)', // Force hardware acceleration
            backfaceVisibility: 'hidden'
          }}
        >
          {/* Conditional rendering based on active tab */}
          {activeTab === 'calendar' ? (
            <Calendar
              currentDate={currentDate}
              schedule={schedule}
              specialDates={specialDates}
              settings={settings}
              onDateClick={handleDateClick}
              onNavigateMonth={navigateMonth}
              totalAmount={totalAmount}
              monthToDateAmount={monthToDateAmount}
              onDateChange={handleDateChange}
              scheduleTitle={scheduleTitle}
              onTitleUpdate={handleTitleUpdate}
              setSchedule={setSchedule}
              setSpecialDates={setSpecialDates}
            />
          ) : activeTab === 'settings' ? (
            <SettingsPanel
              settings={settings}
              onUpdateBasicSalary={updateBasicSalary}
              onUpdateShiftHours={updateShiftHours}
              onUpdateCurrency={updateCurrency}
              onUpdateShiftEnabled={updateShiftEnabled}
              onAddCustomShift={addCustomShift}
              onUpdateCustomShift={updateCustomShift}
              onDeleteCustomShift={deleteCustomShift}
              onUpdateHourlyRate={updateHourlyRate}
              onUpdateOvertimeMultiplier={updateOvertimeMultiplier}
            />
          ) : (
            <MenuPanel
              onImportData={handleImportData}
              onExportData={handleExportData}
            />
          )}
        </div>

        {/* Modals - Outside of any scrollable content */}
        {showModal && (
          <ShiftModal
            selectedDate={selectedDate}
            schedule={schedule}
            specialDates={specialDates}
            settings={settings}
            onToggleShift={toggleShift}
            onToggleSpecialDate={toggleSpecialDate}
            onClose={closeModal}
          />
        )}

      </div>
    </>
  );
}

export default App;