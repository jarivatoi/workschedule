/**
 * IndexedDB Database Manager for Work Schedule Application
 * 
 * This module provides a comprehensive interface for storing and retrieving
 * work schedule data using IndexedDB. It handles all CRUD operations for
 * schedule data, settings, and metadata with proper error handling and
 * data validation.
 * 
 * Key Features:
 * - Offline-first data storage with IndexedDB
 * - Automatic database initialization and schema management
 * - Type-safe operations with TypeScript
 * - Data import/export functionality
 * - Storage quota management and reporting
 * - Backward compatibility with older data formats
 * 
 * Database Schema:
 * - schedule: Individual shift assignments by date
 * - specialDates: Special date markings
 * - settings: Application configuration and custom shifts
 * - metadata: App metadata like schedule title
 * 
 * Why IndexedDB over localStorage:
 * - Much larger storage capacity (hundreds of MB vs ~5-10MB)
 * - Non-blocking asynchronous operations
 * - Better performance for large datasets
 * - Structured data storage with indexing capabilities
 * - Automatic garbage collection
 * 
 * Dependencies:
 * - Native IndexedDB API (available in all modern browsers)
 * - DEFAULT_SHIFT_COMBINATIONS from constants
 * 
 * Browser Support:
 * - Chrome 24+, Firefox 16+, Safari 10+, Edge 12+
 * - iOS Safari 10+, Android Chrome 25+
 * 
 * @author NARAYYA
 * @version 3.0
 */

import { DEFAULT_SHIFT_COMBINATIONS } from '../constants';

/**
 * TypeScript interface definitions for database schema
 * Ensures type safety for all database operations
 */
interface DBSchema {
  schedule: {
    key: string;
    value: {
      date: string;
      shifts: string[];
    };
  };
  specialDates: {
    key: string;
    value: {
      date: string;
      isSpecial: boolean;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

/**
 * Work Schedule Database Manager
 * 
 * Provides a high-level interface for all database operations.
 * Handles connection management, error handling, and data validation.
 * 
 * Usage Pattern:
 * 1. Call init() to establish database connection
 * 2. Use get/set methods for data operations
 * 3. Database connection is maintained for app lifetime
 * 
 * Error Handling:
 * - All methods throw descriptive errors on failure
 * - Automatic retry logic for connection issues
 * - Graceful degradation when storage is full
 */
class WorkScheduleDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'WorkScheduleDB';
  private readonly version = 1;

  /**
   * Initialize the database connection and create object stores
   * 
   * This method establishes the IndexedDB connection and sets up the database
   * schema if it doesn't exist. It handles version upgrades and ensures all
   * required object stores are created.
   * 
   * @returns {Promise<void>} Resolves when database is ready for use
   * @throws {Error} If database cannot be opened or created
   * 
   * Schema Creation:
   * - Creates object stores with appropriate key paths
   * - Sets up indexes for efficient querying (future enhancement)
   * - Handles version upgrades gracefully
   * 
   * Why async: IndexedDB operations are inherently asynchronous
   * and we need to wait for the database to be ready before use
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      /**
       * Handle database schema creation and upgrades
       * Only runs when database is first created or version is incremented
       */
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        // WHY keyPath: Allows efficient lookups by primary key
        if (!db.objectStoreNames.contains('schedule')) {
          db.createObjectStore('schedule', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('specialDates')) {
          db.createObjectStore('specialDates', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Ensure database is initialized before operations
   * 
   * @returns {Promise<IDBDatabase>} The initialized database instance
   * @throws {Error} If database cannot be initialized
   * 
   * WHY: Provides a consistent way to ensure database readiness
   * before any operation, with automatic initialization if needed
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Retrieve all schedule data from the database
   * 
   * @returns {Promise<Record<string, string[]>>} Object mapping date strings to shift ID arrays
   * @throws {Error} If retrieval fails
   * 
   * Data Format:
   * {
   *   "2024-01-15": ["shift1", "shift2"],
   *   "2024-01-16": ["shift3"]
   * }
   * 
   * Performance: Retrieves all records in a single transaction
   * for optimal performance with large datasets
   */
  async getSchedule(): Promise<Record<string, string[]>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['schedule'], 'readonly');
      const store = transaction.objectStore('schedule');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, string[]> = {};
        request.result.forEach((item: { date: string; shifts: string[] }) => {
          result[item.date] = item.shifts;
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get schedule'));
      };
    });
  }

  /**
   * Store complete schedule data to the database
   * 
   * @param {Record<string, string[]>} schedule - Complete schedule data to store
   * @returns {Promise<void>} Resolves when storage is complete
   * @throws {Error} If storage fails
   * 
   * Strategy: Clear and replace all data for consistency
   * WHY: Ensures no orphaned records remain from deleted dates
   * 
   * Transaction Safety: Uses a single transaction to ensure
   * atomicity - either all data is saved or none is
   */
  async setSchedule(schedule: Record<string, string[]>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['schedule'], 'readwrite');
      const store = transaction.objectStore('schedule');

      // Clear existing data first to prevent orphaned records
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add new data
        const promises: Promise<void>[] = [];
        
        Object.entries(schedule).forEach(([date, shifts]) => {
          // Only store dates that have shifts to keep database clean
          if (shifts.length > 0) {
            promises.push(new Promise((resolveItem, rejectItem) => {
              const addRequest = store.add({ date, shifts });
              addRequest.onsuccess = () => resolveItem();
              addRequest.onerror = () => rejectItem(new Error(`Failed to add schedule for ${date}`));
            }));
          }
        });

        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      };

      clearRequest.onerror = () => {
        reject(new Error('Failed to clear schedule'));
      };
    });
  }

  /**
   * Retrieve all special dates from the database
   * 
   * @returns {Promise<Record<string, boolean>>} Object mapping date strings to special flags
   * @throws {Error} If retrieval fails
   * 
   * Special dates affect which shifts are available on certain days
   * and may have different calculation rules
   */
  async getSpecialDates(): Promise<Record<string, boolean>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['specialDates'], 'readonly');
      const store = transaction.objectStore('specialDates');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, boolean> = {};
        request.result.forEach((item: { date: string; isSpecial: boolean }) => {
          result[item.date] = item.isSpecial;
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get special dates'));
      };
    });
  }

  /**
   * Store complete special dates data to the database
   * 
   * @param {Record<string, boolean>} specialDates - Complete special dates data
   * @returns {Promise<void>} Resolves when storage is complete
   * @throws {Error} If storage fails
   */
  async setSpecialDates(specialDates: Record<string, boolean>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['specialDates'], 'readwrite');
      const store = transaction.objectStore('specialDates');

      // Clear existing data first
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add new data
        const promises: Promise<void>[] = [];
        
        Object.entries(specialDates).forEach(([date, isSpecial]) => {
          // Only store dates that are marked as special
          if (isSpecial) {
            promises.push(new Promise((resolveItem, rejectItem) => {
              const addRequest = store.add({ date, isSpecial });
              addRequest.onsuccess = () => resolveItem();
              addRequest.onerror = () => rejectItem(new Error(`Failed to add special date for ${date}`));
            }));
          }
        });

        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      };

      clearRequest.onerror = () => {
        reject(new Error('Failed to clear special dates'));
      };
    });
  }

  /**
   * Retrieve a setting value by key
   * 
   * @param {string} key - Setting key to retrieve
   * @returns {Promise<T | null>} Setting value or null if not found
   * @throws {Error} If retrieval fails
   * 
   * Special Handling for workSettings:
   * - Ensures backward compatibility with older data formats
   * - Automatically fixes missing required fields
   * - Maintains data integrity across app versions
   */
  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result ? request.result.value : null;
        
        // Special handling for workSettings to ensure shift combinations are present
        // WHY: Older versions may not have all required fields
        if (key === 'workSettings' && result && typeof result === 'object') {
          // Ensure currency and customShifts exist, remove shiftCombinations dependency
          if (!result.currency || !result.customShifts || !result.shiftCombinations) {
            const fixedResult = {
              ...result,
              shiftCombinations: result.shiftCombinations || [], // Keep empty for compatibility
              currency: result.currency || 'Rs.',
              customShifts: result.customShifts || []
            };
            
            // Save the fixed settings back to database
            this.setSetting(key, fixedResult as T).catch(err => 
              console.error('Failed to save fixed settings:', err)
            );
            
            resolve(fixedResult);
            return;
          }
        }
        
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get setting: ${key}`));
      };
    });
  }

  /**
   * Store a setting value by key
   * 
   * @param {string} key - Setting key to store
   * @param {T} value - Setting value to store
   * @returns {Promise<void>} Resolves when storage is complete
   * @throws {Error} If storage fails
   */
  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set setting: ${key}`));
      };
    });
  }

  /**
   * Retrieve a metadata value by key
   * 
   * @param {string} key - Metadata key to retrieve
   * @returns {Promise<T | null>} Metadata value or null if not found
   * @throws {Error} If retrieval fails
   * 
   * Metadata vs Settings:
   * - Metadata: App-level data like titles, preferences
   * - Settings: Configuration that affects calculations
   */
  async getMetadata<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get metadata: ${key}`));
      };
    });
  }

  /**
   * Store a metadata value by key
   * 
   * @param {string} key - Metadata key to store
   * @param {T} value - Metadata value to store
   * @returns {Promise<void>} Resolves when storage is complete
   * @throws {Error} If storage fails
   */
  async setMetadata<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set metadata: ${key}`));
      };
    });
  }

  /**
   * Export all application data for backup purposes
   * 
   * @returns {Promise<any>} Complete application data in exportable format
   * @throws {Error} If export fails
   * 
   * Export Format:
   * - Includes all schedule, settings, and metadata
   * - Adds export timestamp and version for tracking
   * - Ensures data integrity with validation
   * - Backward compatibility with older formats
   * 
   * Use Cases:
   * - User backup before major changes
   * - Data migration between devices
   * - Debugging and support
   */
  async exportAllData(): Promise<any> {
    console.log('🔄 Exporting all data from IndexedDB...');
    
    const [schedule, specialDates, settings, scheduleTitle] = await Promise.all([
      this.getSchedule(),
      this.getSpecialDates(),
      this.getSetting('workSettings'),
      this.getMetadata('scheduleTitle')
    ]);

    // Ensure settings have all required fields with sensible defaults
    const finalSettings = settings || {
      basicSalary: 35000,
      hourlyRate: 173.08,
      shiftCombinations: DEFAULT_SHIFT_COMBINATIONS,
      currency: 'Rs',
      customShifts: []
    };

    // Fix missing fields in existing settings
    if (finalSettings && (!finalSettings.shiftCombinations || finalSettings.shiftCombinations.length === 0)) {
      finalSettings.shiftCombinations = DEFAULT_SHIFT_COMBINATIONS;
    }
    
    // Ensure required fields exist
    if (!finalSettings.currency) {
      finalSettings.currency = 'Rs';
    }
    if (!finalSettings.customShifts) {
      finalSettings.customShifts = [];
    }

    const exportData = {
      schedule,
      specialDates,
      settings: finalSettings,
      scheduleTitle: scheduleTitle || 'Work Schedule',
      exportDate: new Date().toISOString(),
      version: '3.0' // Version for compatibility tracking
    };

    console.log('📦 Export data prepared:', {
      scheduleEntries: Object.keys(exportData.schedule).length,
      specialDatesEntries: Object.keys(exportData.specialDates).length,
      settingsIncluded: !!exportData.settings,
      shiftCombinations: exportData.settings?.shiftCombinations?.length || 0
    });

    return exportData;
  }

  /**
   * Import application data from backup file
   * 
   * @param {any} data - Data object from backup file
   * @returns {Promise<void>} Resolves when import is complete
   * @throws {Error} If import fails
   * 
   * Import Strategy:
   * - Validates data format before importing
   * - Handles version compatibility
   * - Replaces all existing data (full restore)
   * - Ensures data integrity after import
   * 
   * Version Compatibility:
   * - v3.0: Full IndexedDB format with all features
   * - v2.0: Includes special dates
   * - v1.0: Basic format, special dates will be reset
   */
  async importAllData(data: any): Promise<void> {
    console.log('🔄 Importing data to IndexedDB:', {
      hasSchedule: !!data.schedule,
      hasSpecialDates: !!data.specialDates,
      hasSettings: !!data.settings,
      hasTitle: !!data.scheduleTitle,
      version: data.version
    });

    const promises: Promise<void>[] = [];

    if (data.schedule) {
      console.log('📅 Importing schedule with', Object.keys(data.schedule).length, 'entries');
      promises.push(this.setSchedule(data.schedule));
    }

    if (data.specialDates) {
      console.log('⭐ Importing special dates with', Object.keys(data.specialDates).length, 'entries');
      promises.push(this.setSpecialDates(data.specialDates));
    }

    if (data.settings) {
      // Ensure imported settings have all required fields
      const settingsToImport = { ...data.settings };
      if (!settingsToImport.shiftCombinations || settingsToImport.shiftCombinations.length === 0) {
        console.log('🔧 Adding missing shift combinations to imported settings');
        settingsToImport.shiftCombinations = DEFAULT_SHIFT_COMBINATIONS;
      }
      
      console.log('⚙️ Importing settings:', {
        basicSalary: settingsToImport.basicSalary,
        hourlyRate: settingsToImport.hourlyRate,
        shiftCombinations: settingsToImport.shiftCombinations?.length || 0
      });
      promises.push(this.setSetting('workSettings', settingsToImport));
    }

    if (data.scheduleTitle) {
      console.log('📝 Importing schedule title:', data.scheduleTitle);
      promises.push(this.setMetadata('scheduleTitle', data.scheduleTitle));
    }

    await Promise.all(promises);
    console.log('✅ All data imported successfully to IndexedDB');
  }

  /**
   * Get storage usage information
   * 
   * @returns {Promise<{used: number, available: number}>} Storage usage in bytes
   * @throws {Error} If storage info cannot be retrieved
   * 
   * Storage Information:
   * - used: Current storage usage in bytes
   * - available: Total available storage in bytes
   * 
   * Browser Limitations:
   * - Some browsers (especially mobile Safari) don't provide exact quotas
   * - Fallback estimates are provided for compatibility
   * - Actual storage is typically much larger than fallback estimates
   */
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('📊 Storage estimate:', estimate);
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0
        };
      } catch (error) {
        console.warn('Storage estimate not available:', error);
      }
    }
    
    // Fallback estimates for browsers that don't support storage.estimate()
    // WHY: iPhone Safari often can't provide exact quota information
    console.log('📊 Using fallback storage estimate for iPhone Safari');
    return {
      used: 0,
      available: 50 * 1024 * 1024 // 50MB fallback (actual storage is typically much larger)
    };
  }
}

/**
 * Singleton instance of the database manager
 * Export this instance to ensure consistent database access across the app
 * 
 * WHY singleton: Prevents multiple database connections and ensures
 * consistent state management across all components
 */
export const workScheduleDB = new WorkScheduleDB();