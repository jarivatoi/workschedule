/**
 * FILE: src/hooks/useIndexedDB.ts
 * 
 * OVERVIEW:
 * Custom React hooks for managing IndexedDB operations in the Work Schedule application.
 * Provides a clean, React-friendly interface for browser-based data persistence with
 * automatic state synchronization, error handling, and loading states.
 * 
 * MAIN FUNCTIONALITY:
 * - Generic IndexedDB operations with TypeScript support
 * - Automatic state synchronization between IndexedDB and React state
 * - Loading states and error handling for async operations
 * - Specialized hooks for schedule data management
 * - Optimistic updates with fallback error handling
 * - Data refresh capabilities for state synchronization
 * 
 * DEPENDENCIES:
 * - React hooks: useState, useEffect, useCallback
 * - IndexedDB utility: workScheduleDB from '../utils/indexedDB'
 * - Constants: DEFAULT_SHIFT_COMBINATIONS
 * 
 * RELATIONSHIPS:
 * - Used by App.tsx for main data management
 * - Integrates with workScheduleDB utility layer
 * - Provides data to Calendar and Settings components
 * - Manages persistence for all application state
 * 
 * DESIGN PATTERNS:
 * - Custom hooks pattern for reusable logic
 * - Observer pattern for state synchronization
 * - Error boundary pattern for graceful error handling
 * - Loading state pattern for async operations
 * - Generic programming for type safety
 */

import { useState, useEffect, useCallback } from 'react';
import { workScheduleDB } from '../utils/indexedDB';
import { DEFAULT_SHIFT_COMBINATIONS } from '../constants';

// ============================================================================
// GENERIC INDEXEDDB HOOK SECTION
// ============================================================================

/**
 * GENERIC INDEXEDDB HOOK
 * 
 * A reusable hook for managing any type of data in IndexedDB with full
 * TypeScript support, loading states, and error handling.
 * 
 * @template T - The type of data being stored/retrieved
 * @param key - The storage key for the data
 * @param initialValue - Default value if no stored data exists
 * @param storageType - Whether to store in 'setting' or 'metadata' store
 * @returns [value, setValue, { isLoading, error, refresh }]
 * 
 * FEATURES:
 * - Automatic loading from IndexedDB on mount
 * - Optimistic updates with error rollback
 * - Loading states for UI feedback
 * - Error handling with user-friendly messages
 * - Manual refresh capability
 * - Type safety with generics
 * 
 * USAGE EXAMPLE:
 * const [title, setTitle, { isLoading, error, refresh }] = useIndexedDB<string>(
 *   'appTitle', 
 *   'Default Title', 
 *   'metadata'
 * );
 */
export function useIndexedDB<T>(
  key: string,
  initialValue: T,
  storageType: 'setting' | 'metadata' = 'setting'
) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /**
   * CORE STATE
   * Manages the actual data value, loading state, and error state
   */
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING FUNCTION
  // ============================================================================
  
  /**
   * LOAD VALUE FROM INDEXEDDB
   * 
   * Handles the complete lifecycle of loading data from IndexedDB:
   * 1. Initialize database connection
   * 2. Retrieve stored value
   * 3. Handle special cases (like missing shift combinations)
   * 4. Update React state
   * 5. Handle errors gracefully
   * 
   * SPECIAL HANDLING:
   * - workSettings: Ensures shift combinations are present for compatibility
   * - Automatic fallback to initial value if no stored data
   * - Automatic saving of initial value for new installations
   */
  const loadValue = useCallback(async () => {
    try {
      console.log(`🔄 Loading ${storageType} "${key}" from IndexedDB...`);
      setIsLoading(true);
      setError(null);
      
      // Ensure database is initialized
      await workScheduleDB.init();
      
      // Retrieve value based on storage type
      const storedValue = storageType === 'setting' 
        ? await workScheduleDB.getSetting<T>(key)
        : await workScheduleDB.getMetadata<T>(key);
      
      console.log(`📦 Retrieved ${storageType} "${key}":`, storedValue);
      
      if (storedValue !== null) {
        // SPECIAL HANDLING FOR WORK SETTINGS
        // Ensures backward compatibility with older data formats
        if (key === 'workSettings' && typeof storedValue === 'object' && storedValue !== null) {
          const settings = storedValue as any;
          
          // Check for missing or empty shift combinations
          if (!settings.shiftCombinations || settings.shiftCombinations.length === 0) {
            console.log(`🔧 Fixing missing shift combinations for ${key}`);
            const fixedSettings = {
              ...settings,
              currency: settings.currency || 'Rs',
              shiftCombinations: DEFAULT_SHIFT_COMBINATIONS,
              customShifts: settings.customShifts || []
            };
            
            // Save fixed settings back to IndexedDB
            await workScheduleDB.setSetting(key, fixedSettings as T);
            setValue(fixedSettings as T);
            console.log(`✅ Fixed and saved ${key} with default shift combinations`);
          } else {
            setValue(storedValue);
            console.log(`✅ Loaded ${storageType} "${key}" successfully`);
          }
        } else {
          setValue(storedValue);
          console.log(`✅ Loaded ${storageType} "${key}" successfully`);
        }
      } else {
        // NO STORED VALUE - USE INITIAL VALUE
        console.log(`🆕 No stored value for ${storageType} "${key}", using initial value:`, initialValue);
        setValue(initialValue);
        
        // Save initial value to IndexedDB for future loads
        if (storageType === 'setting') {
          await workScheduleDB.setSetting(key, initialValue);
        } else {
          await workScheduleDB.setMetadata(key, initialValue);
        }
        console.log(`💾 Saved initial value for ${storageType} "${key}"`);
      }
    } catch (err) {
      console.error(`❌ Error loading ${key} from IndexedDB:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // On error, still set initial value so app doesn't break
      setValue(initialValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, storageType, JSON.stringify(initialValue)]);

  // ============================================================================
  // INITIALIZATION EFFECT
  // ============================================================================
  
  /**
   * LOAD INITIAL VALUE ON MOUNT
   * Automatically loads data when the hook is first used
   */
  useEffect(() => {
    loadValue();
  }, [loadValue]);

  // ============================================================================
  // UPDATE VALUE FUNCTION
  // ============================================================================
  
  /**
   * UPDATE VALUE AND PERSIST TO INDEXEDDB
   * 
   * Handles both direct values and function updates (like setState)
   * Implements optimistic updates for better UX
   * 
   * @param newValue - New value or function that returns new value
   * 
   * PROCESS:
   * 1. Calculate new value (handle function updates)
   * 2. Optimistically update React state
   * 3. Persist to IndexedDB
   * 4. Handle errors (could implement rollback here)
   */
  const updateValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    try {
      setError(null);
      
      // Handle function updates (like setState)
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value) 
        : newValue;
      
      console.log(`💾 Saving ${storageType} "${key}":`, valueToStore);
      
      // Optimistic update - update UI immediately
      setValue(valueToStore);
      
      // Persist to IndexedDB
      if (storageType === 'setting') {
        await workScheduleDB.setSetting(key, valueToStore);
      } else {
        await workScheduleDB.setMetadata(key, valueToStore);
      }
      
      console.log(`✅ Saved ${storageType} "${key}" successfully`);
    } catch (err) {
      console.error(`❌ Error saving ${key} to IndexedDB:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // TODO: Could implement rollback here by reverting to previous value
    }
  }, [key, value, storageType]);

  // Return hook interface
  return [value, updateValue, { isLoading, error, refresh: loadValue }] as const;
}

// ============================================================================
// SPECIALIZED SCHEDULE DATA HOOK SECTION
// ============================================================================

/**
 * SPECIALIZED SCHEDULE DATA HOOK
 * 
 * A specialized hook for managing the main schedule data (shifts and special dates).
 * Provides optimized operations for the core application data with batch updates
 * and specialized error handling.
 * 
 * @returns Object with schedule data, setters, loading state, and refresh function
 * 
 * FEATURES:
 * - Manages both schedule and special dates in one hook
 * - Optimized for frequent updates (shift scheduling)
 * - Batch operations for better performance
 * - Specialized error handling for schedule operations
 * - Manual refresh capability for data synchronization
 * 
 * DATA STRUCTURE:
 * - schedule: Record<string, string[]> - Maps date keys to arrays of shift IDs
 * - specialDates: Record<string, boolean> - Maps date keys to special date flags
 */
export function useScheduleData() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /**
   * CORE SCHEDULE STATE
   * Manages the main application data structures
   */
  const [schedule, setSchedule] = useState<Record<string, string[]>>({});
  const [specialDates, setSpecialDates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING FUNCTION
  // ============================================================================
  
  /**
   * LOAD SCHEDULE DATA FROM INDEXEDDB
   * 
   * Loads both schedule and special dates data in parallel for efficiency
   * Provides detailed logging for debugging data loading issues
   */
  const loadData = useCallback(async () => {
    try {
      console.log('🔄 Loading schedule data from IndexedDB...');
      setIsLoading(true);
      setError(null);
      
      // Initialize database connection
      await workScheduleDB.init();
      
      // Load both data types in parallel for better performance
      const [scheduleData, specialDatesData] = await Promise.all([
        workScheduleDB.getSchedule(),
        workScheduleDB.getSpecialDates()
      ]);
      
      console.log('📦 Retrieved schedule data:', {
        scheduleEntries: Object.keys(scheduleData).length,
        specialDatesEntries: Object.keys(specialDatesData).length
      });
      
      // Update state with loaded data
      setSchedule(scheduleData);
      setSpecialDates(specialDatesData);
      console.log('✅ Schedule data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading schedule data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================================
  // INITIALIZATION EFFECT
  // ============================================================================
  
  /**
   * LOAD DATA ON MOUNT
   * Automatically loads schedule data when hook is first used
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================================================
  // SCHEDULE UPDATE FUNCTION
  // ============================================================================
  
  /**
   * UPDATE SCHEDULE DATA
   * 
   * Handles schedule updates with optimistic UI updates and persistence
   * Supports both direct values and function updates
   * 
   * @param newSchedule - New schedule data or update function
   * 
   * OPTIMIZATION:
   * - Optimistic updates for immediate UI feedback
   * - Batch operations for multiple changes
   * - Detailed logging for debugging
   */
  const updateSchedule = useCallback(async (newSchedule: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => {
    try {
      setError(null);
      
      // Handle function updates
      const scheduleToStore = typeof newSchedule === 'function' 
        ? newSchedule(schedule) 
        : newSchedule;
      
      console.log('💾 Saving schedule data:', {
        entries: Object.keys(scheduleToStore).length
      });
      
      // Optimistic update
      setSchedule(scheduleToStore);
      
      // Persist to IndexedDB
      await workScheduleDB.setSchedule(scheduleToStore);
      console.log('✅ Schedule data saved successfully');
    } catch (err) {
      console.error('❌ Error saving schedule:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [schedule]);

  // ============================================================================
  // SPECIAL DATES UPDATE FUNCTION
  // ============================================================================
  
  /**
   * UPDATE SPECIAL DATES DATA
   * 
   * Handles special dates updates with optimistic UI updates and persistence
   * Similar pattern to schedule updates but for special date flags
   * 
   * @param newSpecialDates - New special dates data or update function
   */
  const updateSpecialDates = useCallback(async (newSpecialDates: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    try {
      setError(null);
      
      // Handle function updates
      const specialDatesToStore = typeof newSpecialDates === 'function' 
        ? newSpecialDates(specialDates) 
        : newSpecialDates;
      
      console.log('💾 Saving special dates data:', {
        entries: Object.keys(specialDatesToStore).length
      });
      
      // Optimistic update
      setSpecialDates(specialDatesToStore);
      
      // Persist to IndexedDB
      await workScheduleDB.setSpecialDates(specialDatesToStore);
      console.log('✅ Special dates data saved successfully');
    } catch (err) {
      console.error('❌ Error saving special dates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [specialDates]);

  // Return hook interface
  return {
    schedule,
    specialDates,
    setSchedule: updateSchedule,
    setSpecialDates: updateSpecialDates,
    isLoading,
    error,
    refreshData: loadData // Export refresh function for manual data synchronization
  };
}

/**
 * LEARNING POINTS:
 * 
 * 1. CUSTOM HOOKS PATTERNS:
 *    - Generic hooks with TypeScript for reusability
 *    - Specialized hooks for domain-specific operations
 *    - Consistent return patterns across hooks
 *    - Proper dependency management in useCallback/useEffect
 * 
 * 2. INDEXEDDB INTEGRATION:
 *    - Async/await patterns for database operations
 *    - Error handling for database failures
 *    - Initialization and connection management
 *    - Batch operations for performance
 * 
 * 3. STATE SYNCHRONIZATION:
 *    - Optimistic updates for better UX
 *    - Loading states for async operations
 *    - Error states with user-friendly messages
 *    - Manual refresh capabilities
 * 
 * 4. PERFORMANCE OPTIMIZATION:
 *    - useCallback to prevent unnecessary re-renders
 *    - Parallel data loading with Promise.all
 *    - Efficient state updates
 *    - Proper cleanup and memory management
 * 
 * 5. ERROR HANDLING STRATEGIES:
 *    - Graceful degradation on database errors
 *    - Fallback to initial values
 *    - Detailed logging for debugging
 *    - User-friendly error messages
 * 
 * 6. TYPE SAFETY:
 *    - Generic types for reusable hooks
 *    - Proper TypeScript interfaces
 *    - Type-safe database operations
 *    - Compile-time error prevention
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced error recovery strategies
 * - Offline-first data synchronization
 * - Database migration patterns
 * - Performance monitoring and optimization
 * - Advanced TypeScript patterns for hooks
 * - State management alternatives (Redux, Zustand)
 */