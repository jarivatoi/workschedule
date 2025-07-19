/**
 * FILE: src/App.tsx
 * 
 * OVERVIEW:
 * Main application component that serves as the root container and orchestrates the entire
 * Work Schedule application. This component manages global state, handles data persistence
 * through IndexedDB, coordinates between different UI panels, and provides the main
 * application lifecycle management.
 * 
 * MAIN FUNCTIONALITY:
 * - Global state management for schedule data, settings, and UI state
 * - IndexedDB integration for offline data persistence
 * - Tab navigation between Calendar, Settings, and Data panels
 * - Modal management for shift editing and data operations
 * - Loading states and error handling
 * - Add-to-homescreen PWA functionality
 * - Animation coordination using GSAP
 * 
 * DEPENDENCIES:
 * - React hooks for state management and lifecycle
 * - Custom hooks: useScheduleCalculations, useIndexedDB, useScheduleData
 * - GSAP for smooth animations and transitions
 * - IndexedDB utilities for data persistence
 * - UI Components: Calendar, ShiftModal, SettingsPanel, MenuPanel, TabNavigation
 * - Types: DaySchedule, SpecialDates, Settings, ExportData
 * 
 * RELATIONSHIPS:
 * - Parent to all major UI components
 * - Coordinates with IndexedDB layer for data persistence
 * - Manages communication between Calendar and Settings panels
 * - Handles data import/export operations
 * 
 * DESIGN PATTERNS:
 * - Container/Presentational pattern (App as container, components as presentational)
 * - Custom hooks pattern for data management
 * - Callback pattern for child-to-parent communication
 * - Observer pattern through useEffect for state synchronization
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

function App() {
  // ============================================================================
  // STATE MANAGEMENT SECTION
  // ============================================================================
  
  /**
   * UI STATE MANAGEMENT
   * These states control the user interface behavior and navigation
   */
  
  // Current date being viewed in the calendar (not necessarily today's date)
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Selected date for shift editing (format: YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Controls visibility of the shift editing modal
  const [showModal, setShowModal] = useState(false);
  
  // Active tab in the navigation (calendar, settings, or data)
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings' | 'data'>('calendar');
  
  // Refresh key to force recalculation of amounts when data changes
  const [refreshKey, setRefreshKey] = useState(0);
  
  /**
   * LOADING STATE MANAGEMENT
   * Implements artificial loading delay for better UX on fast devices
   * This prevents the loading screen from flashing too quickly
   */
  const [artificialLoading, setArtificialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [smoothProgress, setSmoothProgress] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // DATA PERSISTENCE SECTION
  // ============================================================================
  
  /**
   * INDEXEDDB INTEGRATION
   * Uses custom hooks to manage data persistence in the browser's IndexedDB
   * This provides offline functionality and data persistence across sessions
   */
  
  // Main schedule data (date -> array of shift IDs)
  const { schedule, specialDates, setSchedule, setSpecialDates, isLoading: dataLoading, error: dataError, refreshData } = useScheduleData();
  
  // Application title (editable by user)
  const [scheduleTitle, setScheduleTitle, { isLoading: titleLoading, refresh: refreshTitle }] = useIndexedDB<string>('scheduleTitle', 'Work Schedule', 'metadata');
  
  // User settings including salary, rates, and custom shifts
  const [settings, setSettings, { isLoading: settingsLoading, refresh: refreshSettings }] = useIndexedDB<Settings>('workSettings', {
    basicSalary: 35000,
    hourlyRate: 173.08,
    shiftCombinations: DEFAULT_SHIFT_COMBINATIONS,
    currency: 'Rs',
    customShifts: []
  });

  /**
   * DEBUG LOGGING
   * Helps track settings state for debugging purposes
   * This is particularly important for the complex settings object
   */
  console.log('🔧 App component - Settings state:', {
    settings,
    hasSettings: !!settings,
    hasShiftCombinations: !!settings?.shiftCombinations,
    combinationsCount: settings?.shiftCombinations?.length || 0,
    settingsLoading,
    basicSalary: settings?.basicSalary,
    hourlyRate: settings?.hourlyRate
  });

  // ============================================================================
  // CALCULATIONS SECTION
  // ============================================================================
  
  /**
   * AMOUNT CALCULATIONS
   * Uses custom hook to calculate total and month-to-date amounts
   * Depends on schedule data, settings, and special dates
   * RefreshKey dependency ensures recalculation when data changes
   */
  const { totalAmount, monthToDateAmount } = useScheduleCalculations(schedule, settings, specialDates, currentDate, refreshKey);

  // Extract current month/year for filtering calculations
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Combined loading state from all data sources
  const isDataLoading = dataLoading || titleLoading || settingsLoading;

  // ============================================================================
  // LOADING ANIMATION SECTION
  // ============================================================================
  
  /**
   * ARTIFICIAL LOADING DELAY
   * Implements a smooth loading animation that lasts 3 seconds
   * This ensures users can read the loading screen and creates a premium feel
   * Uses requestAnimationFrame for smooth 60fps animation
   */
  useEffect(() => {
    let animationFrame: number;
    let startTime: number;
    const duration = 3000; // 3 seconds total duration
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function for natural progress animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const smoothedProgress = Math.round(easeOutQuart * 100);
      
      setSmoothProgress(smoothedProgress);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setSmoothProgress(100);
        // Small delay after reaching 100% before hiding loading screen
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

  // Final loading state combines data loading and artificial delay
  const isLoading = isDataLoading || artificialLoading;

  // ============================================================================
  // PWA FUNCTIONALITY SECTION
  // ============================================================================
  
  /**
   * ADD TO HOMESCREEN INITIALIZATION
   * Implements Progressive Web App functionality for mobile installation
   * Only initializes after app has finished loading to avoid interference
   */
  useEffect(() => {
    if (!isLoading) {
      console.log('🏠 Initializing Add to Homescreen...');
      
      // Delay to ensure everything is settled
      setTimeout(() => {
        try {
          // Create AddToHomescreen instance with mobile-optimized settings
          const addToHomescreenInstance = new AddToHomescreen({
            appName: 'Work Schedule',
            appIconUrl: 'https://jarivatoi.github.io/workschedule/Icon.PNG',
            maxModalDisplayCount: 999,
            skipFirstVisit: false,
            startDelay: 3000,
            lifespan: 15000,
            displayPace: 0,
            mustShowCustomPrompt: false
          });

          console.log('📱 Add to Homescreen instance created');
          
          // Add global access for debugging
          (window as any).debugAddToHomescreen = addToHomescreenInstance;
          console.log('🔧 Debug commands:');
          console.log('  - window.debugAddToHomescreen.debugStandaloneStatus()');
          console.log('  - window.debugAddToHomescreen.markAsInstalled()');
          console.log('  - window.debugAddToHomescreen.clearInstallationFlag()');
          console.log('  - window.debugAddToHomescreen.show() // Force show prompt');
          console.log('  - window.debugAddToHomescreen.isAppAlreadyInstalled() // Check install status');
          
          // Add simple iOS Safari test
          if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            console.log('📱 iOS Safari specific commands:');
            console.log('  - localStorage.setItem("pwa-installed", "true") // Mark as installed');
            console.log('  - localStorage.removeItem("pwa-installed") // Clear installation flag');
            console.log('  - localStorage.getItem("pwa-installed") // Check current flag');
            
            // Add a simple test function
            (window as any).testIOSInstallation = () => {
              const flag = localStorage.getItem('pwa-installed');
              console.log('🔍 Current installation flag:', flag);
              console.log('🔍 Should show prompt:', flag !== 'true');
              return flag;
            };
            console.log('  - window.testIOSInstallation() // Test current status');
          }
          
          // iOS Safari specific commands
          if (/iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent)) {
            console.log('📱 iOS Safari specific commands:');
            console.log('  - localStorage.setItem("pwa-installed", "true") // Mark as installed');
            console.log('  - localStorage.removeItem("pwa-installed") // Clear installation flag');
            console.log('  - localStorage.getItem("pwa-installed") // Check current flag');
          }
          
          // Device detection for appropriate prompt display
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                              (window.navigator as any).standalone === true;
          
          // If we're in standalone mode, mark as installed
          if (isStandalone) {
            addToHomescreenInstance.markAsInstalled();
            console.log('📱 Marked app as installed (standalone mode detected)');
          }
          
          console.log('📱 Device info:', {
            isMobile,
            isStandalone,
            userAgent: navigator.userAgent,
            canPrompt: addToHomescreenInstance.canPrompt(),
            installationFlag: localStorage.getItem('pwa-installed')
          });
          
          // For iOS Safari, add additional detection when page loads
          if (/iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)) {
            console.log('📱 iOS Safari detected - checking for previous installation');
            
            // IMMEDIATE DEBUG: Check localStorage flag
            const installationFlag = localStorage.getItem('pwa-installed');
            console.log('🔍 IMMEDIATE CHECK - localStorage pwa-installed:', installationFlag);
            
            // IMMEDIATE DEBUG: Test the isAppAlreadyInstalled function
            addToHomescreenInstance.isAppAlreadyInstalled().then(isInstalled => {
              console.log('🔍 IMMEDIATE CHECK - isAppAlreadyInstalled():', isInstalled);
              if (isInstalled) {
                console.log('✅ App detected as installed - should NOT show prompt');
                return; // Don't show prompt
              } else {
                console.log('❌ App NOT detected as installed - will show prompt');
              }
            });
            
            // Check if user has previously installed the app
            const hasBeenInstalled = localStorage.getItem('pwa-installed') === 'true';
            if (hasBeenInstalled) {
              console.log('📱 iOS Safari: App previously installed, skipping prompt');
              return; // Don't show prompt
            }
          }
          
          // Show prompt (it will check installation status internally)
          addToHomescreenInstance.show();
          
        } catch (error) {
          console.error('❌ Error initializing Add to Homescreen:', error);
        }
      }, 3000);
    }
  }, [isLoading]);

  // ============================================================================
  // ANIMATION INITIALIZATION SECTION
  // ============================================================================
  
  /**
   * MAIN APP ANIMATIONS
   * Initializes GSAP animations for the main content when loading completes
   * Uses hardware acceleration for smooth mobile performance
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
          ease: "power2.out",
          force3D: true
        }
      );
    }
  }, [isLoading]);

  // ============================================================================
  // NAVIGATION HANDLERS SECTION
  // ============================================================================
  
  /**
   * TAB NAVIGATION HANDLER
   * Manages smooth transitions between different app sections
   * Immediately updates state for responsive UI feedback
   */
  const handleTabChange = (newTab: 'calendar' | 'settings' | 'data') => {
    if (newTab === activeTab || !contentRef.current) return;
    setActiveTab(newTab);
  };

  /**
   * MONTH NAVIGATION
   * Handles calendar month navigation (previous/next)
   */
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(new Date(currentYear, currentMonth + (direction === 'next' ? 1 : -1), 1));
  };

  // ============================================================================
  // DATE HANDLING SECTION
  // ============================================================================
  
  /**
   * DATE KEY FORMATTING
   * Converts day number to standardized date key format (YYYY-MM-DD)
   * This ensures consistent date handling throughout the application
   */
  const formatDateKey = (day: number) => {
    return `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  /**
   * DATE CLICK HANDLER
   * Opens shift editing modal for the selected date
   */
  const handleDateClick = (day: number) => {
    const dateKey = formatDateKey(day);
    setSelectedDate(dateKey);
    setShowModal(true);
  };

  // ============================================================================
  // SHIFT MANAGEMENT SECTION
  // ============================================================================
  
  /**
   * SHIFT CONFLICT VALIDATION
   * Prevents scheduling conflicting shifts on the same date
   * Business rules:
   * - 9-4 and 12-10 cannot overlap (different shift types)
   * - 12-10 and 4-10 cannot overlap (time conflict)
   */
  const canSelectShift = (shiftId: string, dateKey: string) => {
    const currentShifts = schedule[dateKey] || [];
    
    // Business logic for shift conflicts
    if (shiftId === '9-4' && currentShifts.includes('12-10')) return false;
    if (shiftId === '12-10' && currentShifts.includes('9-4')) return false;
    if (shiftId === '12-10' && currentShifts.includes('4-10')) return false;
    if (shiftId === '4-10' && currentShifts.includes('12-10')) return false;
    
    return true;
  };

  /**
   * SHIFT TOGGLE HANDLER
   * Adds or removes shifts from a specific date
   * Includes validation and triggers calculation refresh
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
      // Add shift if validation passes
      if (canSelectShift(shiftId, selectedDate)) {
        setSchedule(prev => ({
          ...prev,
          [selectedDate]: [...currentShifts, shiftId]
        }));
      }
    }
    
    // Force refresh of calculations when shifts change
    setRefreshKey(prev => prev + 1);
  };

  // ============================================================================
  // SPECIAL DATES SECTION
  // ============================================================================
  
  /**
   * SPECIAL DATE TOGGLE
   * Manages special date markings (holidays, overtime days, etc.)
   * Uses useCallback for performance optimization
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

  // ============================================================================
  // DATA MANAGEMENT SECTION
  // ============================================================================
  
  /**
   * MONTH/DATE RESET FUNCTIONALITY
   * Handles clearing data for specific dates or entire months
   * Supports both single date clearing and bulk month operations
   */
  const handleResetMonth = useCallback(async (year: number, month: number, specificDay?: number, showAlert: boolean = true) => {
    try {
      if (specificDay) {
        console.log(`🗑️ Clearing specific date: ${specificDay}/${month + 1}/${year}`);
        
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${specificDay.toString().padStart(2, '0')}`;
        
        // Clear both schedule and special date data
        setSchedule(prev => {
          const newSchedule = { ...prev };
          delete newSchedule[dateKey];
          return newSchedule;
        });
        
        setSpecialDates(prev => {
          const newSpecialDates = { ...prev };
          delete newSpecialDates[dateKey];
          return newSpecialDates;
        });
        
        setRefreshKey(prev => prev + 1);
        console.log(`✅ Successfully cleared date ${specificDay}/${month + 1}/${year}`);
        return;
      }
      
      console.log(`🗑️ Resetting month data for ${month + 1}/${year}`);
      
      // Generate all date keys for the month
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthDateKeys: string[] = [];
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        monthDateKeys.push(dateKey);
      }
      
      // Clear all data for the month
      setSchedule(prev => {
        const newSchedule = { ...prev };
        monthDateKeys.forEach(dateKey => {
          delete newSchedule[dateKey];
        });
        return newSchedule;
      });
      
      setSpecialDates(prev => {
        const newSpecialDates = { ...prev };
        monthDateKeys.forEach(dateKey => {
          delete newSpecialDates[dateKey];
        });
        return newSpecialDates;
      });
      
      setRefreshKey(prev => prev + 1);
      console.log(`✅ Successfully reset month data for ${month + 1}/${year}`);
      
      // User feedback
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

  // ============================================================================
  // MODAL MANAGEMENT SECTION
  // ============================================================================
  
  /**
   * MODAL CLOSE HANDLER
   * Resets modal state when closing shift editing modal
   */
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  // ============================================================================
  // SETTINGS HANDLERS SECTION
  // ============================================================================
  
  /**
   * SALARY UPDATE HANDLER
   * Updates basic salary and automatically calculates new hourly rate
   * Uses standard calculation: (salary * 12) / 52 / 40
   */
  const updateBasicSalary = useCallback((salary: number) => {
    const hourlyRate = (salary * 12) / 52 / 40;
    console.log('💰 Updating salary:', { salary, hourlyRate });
    setSettings(prev => ({
      ...prev,
      basicSalary: salary,
      hourlyRate: hourlyRate
    }));
  }, [setSettings]);

  /**
   * DEPRECATED HANDLERS
   * These handlers are kept for compatibility but no longer used
   * as the app has moved to custom shifts only
   */
  const updateShiftHours = useCallback((combinationId: string, hours: number) => {
    console.log('⚠️ updateShiftHours called but no longer used');
  }, [setSettings]);

  const updateShiftEnabled = useCallback((combinationId: string, enabled: boolean) => {
    console.log('⚠️ updateShiftEnabled called but no longer used');
  }, [setSettings]);

  /**
   * CURRENCY UPDATE HANDLER
   */
  const updateCurrency = useCallback((currency: string) => {
    console.log('💱 Updating currency:', currency);
    setSettings(prev => ({
      ...prev,
      currency
    }));
  }, [setSettings]);

  /**
   * HOURLY RATE UPDATE HANDLER
   */
  const updateHourlyRate = useCallback((rate: number) => {
    console.log('⏰ Updating hourly rate:', rate);
    setSettings(prev => ({
      ...prev,
      hourlyRate: rate
    }));
  }, [setSettings]);

  /**
   * OVERTIME MULTIPLIER UPDATE HANDLER
   */
  const updateOvertimeMultiplier = useCallback((multiplier: number) => {
    console.log('⏰ Updating overtime multiplier:', multiplier);
    setSettings(prev => ({
      ...prev,
      overtimeMultiplier: multiplier
    }));
  }, [setSettings]);

  // ============================================================================
  // CUSTOM SHIFT MANAGEMENT SECTION
  // ============================================================================
  
  /**
   * ADD CUSTOM SHIFT HANDLER
   * Adds new custom shift to settings and triggers calculation refresh
   */
  const addCustomShift = useCallback((shift: any) => {
    console.log('➕ Adding custom shift:', shift);
    setSettings(prev => ({
      ...prev,
      customShifts: [...(prev.customShifts || []), shift]
    }));
    setRefreshKey(prev => prev + 1);
  }, [setSettings]);

  /**
   * UPDATE CUSTOM SHIFT HANDLER
   * Updates existing custom shift and triggers calculation refresh
   */
  const updateCustomShift = useCallback((shiftId: string, shift: any) => {
    console.log('📝 Updating custom shift:', { shiftId, shift });
    setSettings(prev => ({
      ...prev,
      customShifts: (prev.customShifts || []).map(s =>
        s.id === shiftId ? shift : s
      )
    }));
    setRefreshKey(prev => prev + 1);
  }, [setSettings]);

  /**
   * DELETE CUSTOM SHIFT HANDLER
   * Removes custom shift from settings and cleans up schedule references
   * Also triggers calculation refresh
   */
  const deleteCustomShift = useCallback((shiftId: string) => {
    console.log('🗑️ Deleting custom shift:', shiftId);
    
    // Remove shift from all schedule entries
    setSchedule(prev => {
      const newSchedule = { ...prev };
      Object.keys(newSchedule).forEach(dateKey => {
        newSchedule[dateKey] = newSchedule[dateKey].filter(id => id !== shiftId);
        // Remove empty arrays
        if (newSchedule[dateKey].length === 0) {
          delete newSchedule[dateKey];
        }
      });
      return newSchedule;
    });
    
    // Remove shift from settings
    setSettings(prev => ({
      ...prev,
      customShifts: (prev.customShifts || []).filter(s => s.id !== shiftId)
    }));
    
    setRefreshKey(prev => prev + 1);
  }, [setSettings]);

  // ============================================================================
  // DATA IMPORT/EXPORT SECTION
  // ============================================================================
  
  /**
   * EXPORT DATA HANDLER
   * Exports all application data to JSON file for backup/transfer
   */
  const handleExportData = async () => {
    try {
      const exportData = await workScheduleDB.exportAllData();
      
      // Create downloadable file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `work-schedule-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  /**
   * IMPORT DATA HANDLER
   * Imports data from JSON file and refreshes all application state
   * Includes multiple refresh attempts to ensure data consistency
   * Automatically redirects to Calendar tab after successful import
   */
  const handleImportData = async (data: any) => {
    try {
      console.log('🔄 Starting import process with data:', data);
      
      // Import to IndexedDB
      await workScheduleDB.importAllData(data);
      console.log('✅ Data imported to IndexedDB');
      
      // Refresh all data with error handling
      const refreshPromises = [
        refreshData().catch(err => console.error('Failed to refresh schedule data:', err)),
        refreshSettings().catch(err => console.error('Failed to refresh settings:', err)),
        refreshTitle().catch(err => console.error('Failed to refresh title:', err))
      ];
      
      await Promise.allSettled(refreshPromises);
      console.log('✅ All data refresh attempts completed');
      
      // Multiple calculation refreshes with delays to ensure state updates
      const triggerRefresh = (delay: number, label: string) => {
        setTimeout(() => {
          console.log(`🔄 ${label} refresh key update`);
          setRefreshKey(prev => prev + 1);
        }, delay);
      };
      
      setRefreshKey(prev => prev + 1);
      triggerRefresh(100, 'First delayed');
      triggerRefresh(300, 'Second delayed');
      triggerRefresh(600, 'Third delayed');
      triggerRefresh(1000, 'Final delayed');
      
      // Automatically redirect to Calendar tab after successful import
      console.log('📅 Redirecting to Calendar tab after import');
      setActiveTab('calendar');
      
      // User feedback based on data version
      const version = data.version || '1.0';
      if (version === '1.0') {
        console.log('Data imported successfully! Note: This was an older format file. Special date information was not available and has been reset.');
      } else {
        console.log('Data imported successfully!');
      }
    } catch (error) {
      console.error('Import failed:', error);
      console.error('Error importing data. Please check the file format.');
    }
  };

  // ============================================================================
  // UTILITY HANDLERS SECTION
  // ============================================================================
  
  /**
   * DATE CHANGE HANDLER
   * Updates the current date being viewed in the calendar
   */
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  /**
   * TITLE UPDATE HANDLER
   * Updates the application title
   */
  const handleTitleUpdate = (newTitle: string) => {
    setScheduleTitle(newTitle);
  };

  // ============================================================================
  // ERROR HANDLING SECTION
  // ============================================================================
  
  /**
   * ERROR STATE DISPLAY
   * Shows error screen if data loading fails
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

  // ============================================================================
  // LOADING STATE DISPLAY SECTION
  // ============================================================================
  
  /**
   * ENHANCED LOADING SCREEN
   * Shows detailed loading screen with progress animation
   * Provides user feedback about what's being loaded
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

  // ============================================================================
  // MAIN RENDER SECTION
  // ============================================================================
  
  /**
   * MAIN APPLICATION INTERFACE
   * Renders the complete application with tab navigation and content panels
   * Uses mobile-optimized styling with safe area support
   */
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
          backgroundColor: 'black !important',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
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
            transform: 'translate3d(0,0,0)',
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

        {/* Debug Panel for Mobile Testing */}
        {showDebugPanel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[99999]">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Debug Panel</h3>
                <button
                  onClick={() => setShowDebugPanel(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>
              
              {debugInfo && (
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>App Installed:</strong> {debugInfo.isInstalled ? '✅ YES' : '❌ NO'}
                  </div>
                  <div>
                    <strong>localStorage Flag:</strong> {debugInfo.installationFlag || 'null'}
                  </div>
                  <div>
                    <strong>Is Standalone:</strong> {debugInfo.isStandalone ? 'YES' : 'NO'}
                  </div>
                  <div>
                    <strong>iOS Safari:</strong> {debugInfo.isIOSSafari ? 'YES' : 'NO'}
                  </div>
                  <div>
                    <strong>Can Prompt:</strong> {debugInfo.canPrompt ? 'YES' : 'NO'}
                  </div>
                  <div>
                    <strong>User Agent:</strong> {debugInfo.userAgent}
                  </div>
                </div>
              )}
              
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    localStorage.setItem('pwa-installed', 'true');
                    alert('✅ Marked as installed! Refresh page to test.');
                  }}
                  className="w-full p-3 bg-green-600 text-white rounded-lg"
                >
                  Mark as Installed
                </button>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('pwa-installed');
                    alert('🗑️ Cleared flag! Refresh page to test.');
                  }}
                  className="w-full p-3 bg-red-600 text-white rounded-lg"
                >
                  Clear Installation Flag
                </button>
                
                <button
                  onClick={() => {
                    const flag = localStorage.getItem('pwa-installed');
                    alert(`Current flag: ${flag || 'null'}`);
                  }}
                  className="w-full p-3 bg-blue-600 text-white rounded-lg"
                >
                  Check Current Flag
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Components - Rendered outside scrollable content */}
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

/**
 * LEARNING POINTS:
 * 
 * 1. STATE MANAGEMENT PATTERNS:
 *    - Local state with useState for UI-specific data
 *    - Custom hooks for complex data operations
 *    - Callback pattern for child-to-parent communication
 * 
 * 2. PERFORMANCE OPTIMIZATIONS:
 *    - useCallback for expensive function recreations
 *    - Hardware acceleration with CSS transforms
 *    - Artificial loading delays for better UX
 * 
 * 3. DATA PERSISTENCE:
 *    - IndexedDB for offline functionality
 *    - Custom hooks abstracting database operations
 *    - Error handling and retry mechanisms
 * 
 * 4. MOBILE OPTIMIZATION:
 *    - Safe area insets for modern mobile devices
 *    - Touch-optimized interactions
 *    - PWA functionality for app-like experience
 * 
 * 5. ANIMATION TECHNIQUES:
 *    - GSAP for smooth, hardware-accelerated animations
 *    - RequestAnimationFrame for 60fps performance
 *    - Easing functions for natural motion
 * 
 * 6. ERROR HANDLING:
 *    - Graceful degradation with error boundaries
 *    - User-friendly error messages
 *    - Retry mechanisms for failed operations
 * 
 * 7. CODE ORGANIZATION:
 *    - Logical section grouping with comments
 *    - Consistent naming conventions
 *    - Separation of concerns between components
 * 
 * AREAS FOR FURTHER STUDY:
 * - React Context API for global state management
 * - Service Workers for advanced PWA features
 * - Web Workers for background calculations
 * - Advanced animation libraries and techniques
 * - Database optimization and indexing strategies
 */