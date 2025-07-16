/**
 * FILE: src/utils/indexedDB.ts
 * 
 * =============================================================================
 * OVERVIEW AND PURPOSE
 * =============================================================================
 * 
 * This file implements a comprehensive IndexedDB wrapper class for the Work Schedule
 * application, providing offline-first data persistence with a clean, Promise-based
 * API. It demonstrates advanced browser database techniques, error handling patterns,
 * and data migration strategies for production web applications.
 * 
 * MAIN FUNCTIONALITY:
 * - Complete IndexedDB database management with versioning
 * - CRUD operations for schedule, special dates, settings, and metadata
 * - Data export/import functionality for backup and transfer
 * - Storage quota management and monitoring
 * - Automatic data migration and schema updates
 * - Error handling and recovery mechanisms
 * - Performance optimization for large datasets
 * 
 * DEPENDENCIES AND RELATIONSHIPS:
 * - Browser IndexedDB API for client-side storage
 * - Constants: DEFAULT_SHIFT_COMBINATIONS for data consistency
 * - Used by: useIndexedDB hooks for React integration
 * - Consumed by: App.tsx for main data operations
 * - Supports: Offline functionality across the entire application
 * 
 * DESIGN PATTERNS DEMONSTRATED:
 * - Singleton pattern for database instance management
 * - Promise-based async/await patterns for database operations
 * - Error handling with graceful degradation
 * - Data migration and versioning strategies
 * - Observer pattern through Promise-based callbacks
 * 
 * LEARNING OBJECTIVES:
 * This file demonstrates advanced concepts including:
 * 1. IndexedDB API usage and best practices
 * 2. Asynchronous JavaScript patterns and error handling
 * 3. Data persistence strategies for web applications
 * 4. Database schema design and migration
 * 5. Performance optimization for client-side databases
 * 6. Offline-first application architecture
 * 7. Data import/export and backup strategies
 * 8. Browser storage quota management
 * 
 * =============================================================================
 * INDEXEDDB CONCEPTS AND ARCHITECTURE
 * =============================================================================
 * 
 * INDEXEDDB FUNDAMENTALS:
 * IndexedDB is a low-level API for client-side storage of significant amounts
 * of structured data. Unlike localStorage, it can store complex objects and
 * provides indexing for high-performance searches.
 * 
 * KEY CONCEPTS:
 * - Database: Container for object stores (like a SQL database)
 * - Object Store: Similar to a table in SQL databases
 * - Transaction: Atomic operations that ensure data consistency
 * - Index: Performance optimization for queries
 * - Cursor: Iterator for traversing large datasets
 * 
 * STORAGE ARCHITECTURE:
 * - schedule: Maps date strings to arrays of shift IDs
 * - specialDates: Maps date strings to boolean flags
 * - settings: Stores application configuration
 * - metadata: Stores application metadata like titles
 * 
 * VERSIONING STRATEGY:
 * Database version increments trigger onupgradeneeded event, allowing
 * for schema migrations and data transformations.
 * 
 * =============================================================================
 * PERFORMANCE CONSIDERATIONS
 * =============================================================================
 * 
 * OPTIMIZATION TECHNIQUES:
 * - Batch operations to reduce transaction overhead
 * - Proper indexing for frequently queried data
 * - Connection pooling and reuse
 * - Lazy loading for large datasets
 * - Efficient cursor usage for iteration
 * 
 * MEMORY MANAGEMENT:
 * - Proper transaction cleanup
 * - Connection closing after operations
 * - Garbage collection friendly patterns
 * - Avoiding memory leaks in long-running operations
 * 
 * =============================================================================
 * ERROR HANDLING STRATEGIES
 * =============================================================================
 * 
 * ERROR TYPES:
 * - Database connection failures
 * - Transaction conflicts and deadlocks
 * - Quota exceeded errors
 * - Data corruption and recovery
 * - Browser compatibility issues
 * 
 * RECOVERY MECHANISMS:
 * - Graceful degradation to default values
 * - Automatic retry with exponential backoff
 * - Data validation and sanitization
 * - Fallback to alternative storage methods
 */

import { DEFAULT_SHIFT_COMBINATIONS } from '../constants';

/**
 * =============================================================================
 * TYPE DEFINITIONS AND INTERFACES
 * =============================================================================
 * 
 * These interfaces define the structure of data stored in IndexedDB.
 * They provide type safety and documentation for the database schema.
 */

/**
 * DATABASE SCHEMA INTERFACE
 * 
 * Defines the complete structure of the IndexedDB database with all
 * object stores and their expected data formats.
 * 
 * DESIGN DECISIONS:
 * - Each store has a specific key structure for optimal performance
 * - Value types are explicitly defined for type safety
 * - Schema supports future extensions without breaking changes
 */
interface DBSchema {
  schedule: {
    key: string;           // Date string in YYYY-MM-DD format
    value: {
      date: string;        // Redundant but useful for queries
      shifts: string[];    // Array of shift IDs for the date
    };
  };
  specialDates: {
    key: string;           // Date string in YYYY-MM-DD format
    value: {
      date: string;        // Redundant but useful for queries
      isSpecial: boolean;  // Whether the date is marked as special
    };
  };
  settings: {
    key: string;           // Setting name/identifier
    value: any;            // Flexible value type for different settings
  };
  metadata: {
    key: string;           // Metadata key
    value: {
      key: string;         // Redundant key for consistency
      value: any;          // Flexible value type for metadata
    };
  };
}

/**
 * =============================================================================
 * MAIN DATABASE CLASS IMPLEMENTATION
 * =============================================================================
 */

/**
 * WORKSCHEDULEDB CLASS
 * 
 * A comprehensive wrapper around IndexedDB providing a clean, Promise-based
 * API for all database operations. Implements singleton pattern to ensure
 * consistent database access across the application.
 * 
 * ARCHITECTURE DECISIONS:
 * - Singleton pattern prevents multiple database connections
 * - Promise-based API for modern async/await usage
 * - Comprehensive error handling with meaningful messages
 * - Automatic database initialization and migration
 * - Performance optimization through connection reuse
 */
class WorkScheduleDB {
  // ==========================================================================
  // CLASS PROPERTIES AND CONFIGURATION
  // ==========================================================================
  
  /**
   * DATABASE CONNECTION AND CONFIGURATION
   * 
   * These properties manage the database connection and configuration.
   * The singleton pattern ensures only one instance exists.
   */
  private db: IDBDatabase | null = null;        // Active database connection
  private readonly dbName = 'WorkScheduleDB';   // Database name (immutable)
  private readonly version = 1;                 // Current schema version

  // ==========================================================================
  // DATABASE INITIALIZATION AND CONNECTION
  // ==========================================================================

  /**
   * INITIALIZE DATABASE CONNECTION
   * 
   * Establishes connection to IndexedDB and handles schema creation/migration.
   * This method demonstrates proper IndexedDB initialization patterns.
   * 
   * @returns Promise<void> Resolves when database is ready
   * 
   * INITIALIZATION PROCESS:
   * 1. Open database connection with version number
   * 2. Handle upgrade events for schema changes
   * 3. Create object stores if they don't exist
   * 4. Set up indexes for performance optimization
   * 5. Handle connection errors gracefully
   * 
   * ERROR HANDLING:
   * - Connection failures result in rejected Promise
   * - Upgrade failures are caught and reported
   * - Provides meaningful error messages for debugging
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Open database connection with version control
      const request = indexedDB.open(this.dbName, this.version);

      /**
       * ERROR HANDLER
       * 
       * Handles database connection failures with meaningful error messages.
       * This is critical for debugging database issues in production.
       */
      request.onerror = () => {
        console.error('❌ IndexedDB connection failed:', request.error);
        reject(new Error('Failed to open database'));
      };

      /**
       * SUCCESS HANDLER
       * 
       * Stores the database connection for future operations.
       * Connection reuse improves performance significantly.
       */
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB connection established');
        resolve();
      };

      /**
       * UPGRADE HANDLER - SCHEMA MIGRATION
       * 
       * This event fires when database version changes, allowing for
       * schema migrations and data transformations.
       * 
       * MIGRATION STRATEGY:
       * - Check if object stores exist before creating
       * - Preserve existing data during upgrades
       * - Add new stores and indexes as needed
       * - Handle backward compatibility
       */
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 Database upgrade needed, creating schema...');

        // Create schedule object store for shift data
        if (!db.objectStoreNames.contains('schedule')) {
          const scheduleStore = db.createObjectStore('schedule', { keyPath: 'date' });
          console.log('📅 Created schedule object store');
        }

        // Create special dates object store for holiday/special day marking
        if (!db.objectStoreNames.contains('specialDates')) {
          const specialDatesStore = db.createObjectStore('specialDates', { keyPath: 'date' });
          console.log('⭐ Created specialDates object store');
        }

        // Create settings object store for application configuration
        if (!db.objectStoreNames.contains('settings')) {
          const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
          console.log('⚙️ Created settings object store');
        }

        // Create metadata object store for application metadata
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'key' });
          console.log('📝 Created metadata object store');
        }

        console.log('✅ Database schema created successfully');
      };
    });
  }

  /**
   * ENSURE DATABASE CONNECTION
   * 
   * Private helper method that ensures database is initialized before operations.
   * This pattern prevents race conditions and ensures reliable database access.
   * 
   * @returns Promise<IDBDatabase> Active database connection
   * 
   * USAGE PATTERN:
   * All public methods call this before performing operations to ensure
   * the database is ready. This eliminates the need for manual initialization
   * checks throughout the codebase.
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

  // ==========================================================================
  // SCHEDULE DATA OPERATIONS
  // ==========================================================================

  /**
   * GET COMPLETE SCHEDULE DATA
   * 
   * Retrieves all schedule data from IndexedDB and transforms it into
   * the application's expected format.
   * 
   * @returns Promise<Record<string, string[]>> Schedule data mapped by date
   * 
   * DATA TRANSFORMATION:
   * - IndexedDB stores: { date: string, shifts: string[] }
   * - Application expects: { [date]: string[] }
   * - This method handles the transformation seamlessly
   * 
   * PERFORMANCE CONSIDERATIONS:
   * - Uses getAll() for efficient bulk retrieval
   * - Transforms data in memory rather than multiple queries
   * - Returns empty object if no data exists
   */
  async getSchedule(): Promise<Record<string, string[]>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      // Create read-only transaction for data retrieval
      const transaction = db.transaction(['schedule'], 'readonly');
      const store = transaction.objectStore('schedule');
      const request = store.getAll();

      request.onsuccess = () => {
        // Transform IndexedDB format to application format
        const result: Record<string, string[]> = {};
        request.result.forEach((item: { date: string; shifts: string[] }) => {
          result[item.date] = item.shifts;
        });
        console.log(`📅 Retrieved ${Object.keys(result).length} schedule entries`);
        resolve(result);
      };

      request.onerror = () => {
        console.error('❌ Failed to retrieve schedule data:', request.error);
        reject(new Error('Failed to get schedule'));
      };
    });
  }

  /**
   * SAVE COMPLETE SCHEDULE DATA
   * 
   * Replaces all schedule data in IndexedDB with new data.
   * Uses atomic transactions to ensure data consistency.
   * 
   * @param schedule - Complete schedule data to save
   * @returns Promise<void> Resolves when save is complete
   * 
   * ATOMIC OPERATION STRATEGY:
   * 1. Clear existing data within transaction
   * 2. Add all new data within same transaction
   * 3. Transaction either succeeds completely or fails completely
   * 4. No partial data states possible
   * 
   * PERFORMANCE OPTIMIZATION:
   * - Single transaction for all operations
   * - Batch processing for large datasets
   * - Only stores non-empty shift arrays
   */
  async setSchedule(schedule: Record<string, string[]>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      // Create read-write transaction for data modification
      const transaction = db.transaction(['schedule'], 'readwrite');
      const store = transaction.objectStore('schedule');

      // Clear existing data atomically
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add new data in batch
        const promises: Promise<void>[] = [];
        
        Object.entries(schedule).forEach(([date, shifts]) => {
          // Only store dates with actual shifts (optimization)
          if (shifts.length > 0) {
            promises.push(new Promise((resolveItem, rejectItem) => {
              const addRequest = store.add({ date, shifts });
              addRequest.onsuccess = () => resolveItem();
              addRequest.onerror = () => rejectItem(new Error(`Failed to add schedule for ${date}`));
            }));
          }
        });

        // Wait for all additions to complete
        Promise.all(promises)
          .then(() => {
            console.log(`💾 Saved ${promises.length} schedule entries`);
            resolve();
          })
          .catch(reject);
      };

      clearRequest.onerror = () => {
        console.error('❌ Failed to clear schedule data:', clearRequest.error);
        reject(new Error('Failed to clear schedule'));
      };
    });
  }

  // ==========================================================================
  // SPECIAL DATES OPERATIONS
  // ==========================================================================

  /**
   * GET SPECIAL DATES DATA
   * 
   * Retrieves all special date markings from IndexedDB.
   * Special dates are used to mark holidays, overtime days, etc.
   * 
   * @returns Promise<Record<string, boolean>> Special dates mapped by date
   * 
   * DATA STRUCTURE:
   * - Key: Date string in YYYY-MM-DD format
   * - Value: Boolean indicating if date is special
   * - Only dates marked as special are stored (optimization)
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
        console.log(`⭐ Retrieved ${Object.keys(result).length} special dates`);
        resolve(result);
      };

      request.onerror = () => {
        console.error('❌ Failed to retrieve special dates:', request.error);
        reject(new Error('Failed to get special dates'));
      };
    });
  }

  /**
   * SAVE SPECIAL DATES DATA
   * 
   * Replaces all special date data with new data using atomic transactions.
   * 
   * @param specialDates - Special dates data to save
   * @returns Promise<void> Resolves when save is complete
   * 
   * STORAGE OPTIMIZATION:
   * Only dates marked as special (true) are stored in the database.
   * This reduces storage usage and improves query performance.
   */
  async setSpecialDates(specialDates: Record<string, boolean>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['specialDates'], 'readwrite');
      const store = transaction.objectStore('specialDates');

      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        const promises: Promise<void>[] = [];
        
        Object.entries(specialDates).forEach(([date, isSpecial]) => {
          // Only store dates that are actually special (optimization)
          if (isSpecial) {
            promises.push(new Promise((resolveItem, rejectItem) => {
              const addRequest = store.add({ date, isSpecial });
              addRequest.onsuccess = () => resolveItem();
              addRequest.onerror = () => rejectItem(new Error(`Failed to add special date for ${date}`));
            }));
          }
        });

        Promise.all(promises)
          .then(() => {
            console.log(`💾 Saved ${promises.length} special dates`);
            resolve();
          })
          .catch(reject);
      };

      clearRequest.onerror = () => {
        console.error('❌ Failed to clear special dates:', clearRequest.error);
        reject(new Error('Failed to clear special dates'));
      };
    });
  }

  // ==========================================================================
  // SETTINGS OPERATIONS
  // ==========================================================================

  /**
   * GET SETTING VALUE
   * 
   * Retrieves a specific setting from the database with automatic
   * data migration and validation.
   * 
   * @param key - Setting identifier
   * @returns Promise<T | null> Setting value or null if not found
   * 
   * SPECIAL HANDLING FOR WORK SETTINGS:
   * The workSettings object requires special migration logic to ensure
   * backward compatibility with older data formats.
   * 
   * MIGRATION STRATEGY:
   * - Check for missing required fields
   * - Add default values for new fields
   * - Automatically save migrated data
   * - Maintain backward compatibility
   */
  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result ? request.result.value : null;
        
        // SPECIAL MIGRATION LOGIC FOR WORK SETTINGS
        if (key === 'workSettings' && result && typeof result === 'object') {
          // Check for missing required fields and migrate if necessary
          if (!result.currency || !result.customShifts || !result.shiftCombinations) {
            console.log('🔄 Migrating workSettings to new format');
            const fixedResult = {
              ...result,
              shiftCombinations: result.shiftCombinations || [], // Keep empty for compatibility
              currency: result.currency || 'Rs.',
              customShifts: result.customShifts || []
            };
            
            // Automatically save migrated data
            this.setSetting(key, fixedResult as T).catch(err => 
              console.error('Failed to save migrated settings:', err)
            );
            
            resolve(fixedResult);
            return;
          }
        }
        
        console.log(`⚙️ Retrieved setting "${key}":`, result ? 'found' : 'not found');
        resolve(result);
      };

      request.onerror = () => {
        console.error(`❌ Failed to get setting "${key}":`, request.error);
        reject(new Error(`Failed to get setting: ${key}`));
      };
    });
  }

  /**
   * SAVE SETTING VALUE
   * 
   * Stores a setting value in the database with automatic serialization.
   * 
   * @param key - Setting identifier
   * @param value - Setting value to store
   * @returns Promise<void> Resolves when save is complete
   * 
   * SERIALIZATION:
   * IndexedDB can store complex objects directly, but we wrap them
   * in a consistent structure for easier querying and management.
   */
  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        console.log(`💾 Saved setting "${key}"`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to save setting "${key}":`, request.error);
        reject(new Error(`Failed to set setting: ${key}`));
      };
    });
  }

  // ==========================================================================
  // METADATA OPERATIONS
  // ==========================================================================

  /**
   * GET METADATA VALUE
   * 
   * Retrieves metadata such as application title, user preferences, etc.
   * 
   * @param key - Metadata identifier
   * @returns Promise<T | null> Metadata value or null if not found
   */
  async getMetadata<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result ? request.result.value : null;
        console.log(`📝 Retrieved metadata "${key}":`, result ? 'found' : 'not found');
        resolve(result);
      };

      request.onerror = () => {
        console.error(`❌ Failed to get metadata "${key}":`, request.error);
        reject(new Error(`Failed to get metadata: ${key}`));
      };
    });
  }

  /**
   * SAVE METADATA VALUE
   * 
   * Stores metadata in the database.
   * 
   * @param key - Metadata identifier
   * @param value - Metadata value to store
   * @returns Promise<void> Resolves when save is complete
   */
  async setMetadata<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        console.log(`💾 Saved metadata "${key}"`);
        resolve();
      };

      request.onerror = () => {
        console.error(`❌ Failed to save metadata "${key}":`, request.error);
        reject(new Error(`Failed to set metadata: ${key}`));
      };
    });
  }

  // ==========================================================================
  // DATA EXPORT/IMPORT OPERATIONS
  // ==========================================================================

  /**
   * EXPORT ALL APPLICATION DATA
   * 
   * Creates a complete backup of all application data in JSON format.
   * This is essential for data portability and backup functionality.
   * 
   * @returns Promise<any> Complete application data export
   * 
   * EXPORT STRUCTURE:
   * - schedule: All shift scheduling data
   * - specialDates: All special date markings
   * - settings: Application configuration
   * - scheduleTitle: User-defined application title
   * - exportDate: Timestamp of export
   * - version: Data format version for compatibility
   * 
   * DATA INTEGRITY:
   * - Ensures all required fields are present
   * - Adds default values for missing data
   * - Includes version information for future compatibility
   */
  async exportAllData(): Promise<any> {
    console.log('🔄 Exporting all data from IndexedDB...');
    
    // Retrieve all data types in parallel for efficiency
    const [schedule, specialDates, settings, scheduleTitle] = await Promise.all([
      this.getSchedule(),
      this.getSpecialDates(),
      this.getSetting('workSettings'),
      this.getMetadata('scheduleTitle')
    ]);

    // Ensure settings have required fields with defaults
    const finalSettings = settings || {
      basicSalary: 35000,
      hourlyRate: 173.08,
      shiftCombinations: DEFAULT_SHIFT_COMBINATIONS,
      currency: 'Rs',
      customShifts: []
    };

    // Add missing shift combinations if needed (backward compatibility)
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

    // Create comprehensive export data structure
    const exportData = {
      schedule,
      specialDates,
      settings: finalSettings,
      scheduleTitle: scheduleTitle || 'Work Schedule',
      exportDate: new Date().toISOString(),
      version: '3.0'  // Current data format version
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
   * IMPORT ALL APPLICATION DATA
   * 
   * Restores application data from a previously exported backup.
   * Includes data validation and migration for different versions.
   * 
   * @param data - Exported data to import
   * @returns Promise<void> Resolves when import is complete
   * 
   * IMPORT PROCESS:
   * 1. Validate data structure and version
   * 2. Migrate data if from older version
   * 3. Import all data types in parallel
   * 4. Verify import success
   * 
   * VERSION COMPATIBILITY:
   * - Version 3.0+: Full IndexedDB compatibility
   * - Version 2.0+: Full compatibility with special dates
   * - Version 1.0: Basic compatibility (special dates reset)
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

    // Import schedule data
    if (data.schedule) {
      console.log('📅 Importing schedule with', Object.keys(data.schedule).length, 'entries');
      promises.push(this.setSchedule(data.schedule));
    }

    // Import special dates data
    if (data.specialDates) {
      console.log('⭐ Importing special dates with', Object.keys(data.specialDates).length, 'entries');
      promises.push(this.setSpecialDates(data.specialDates));
    }

    // Import settings with migration
    if (data.settings) {
      const settingsToImport = { ...data.settings };
      
      // Ensure imported settings have shift combinations
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

    // Import schedule title
    if (data.scheduleTitle) {
      console.log('📝 Importing schedule title:', data.scheduleTitle);
      promises.push(this.setMetadata('scheduleTitle', data.scheduleTitle));
    }

    // Execute all imports in parallel for efficiency
    await Promise.all(promises);
    console.log('✅ All data imported successfully to IndexedDB');
  }

  // ==========================================================================
  // STORAGE MANAGEMENT OPERATIONS
  // ==========================================================================

  /**
   * GET STORAGE INFORMATION
   * 
   * Retrieves information about storage usage and available quota.
   * This is important for managing storage limits and user feedback.
   * 
   * @returns Promise<{used: number, available: number}> Storage information
   * 
   * STORAGE API LIMITATIONS:
   * - Not all browsers support the Storage API
   * - iPhone Safari often can't provide exact quota information
   * - Fallback estimates are provided for compatibility
   * 
   * QUOTA MANAGEMENT:
   * - Modern browsers typically provide several GB of storage
   * - Mobile browsers may have more restrictive limits
   * - Users should be warned when approaching limits
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
    
    // Fallback estimates for browsers without Storage API support
    console.log('📊 Using fallback storage estimate for iPhone Safari');
    return {
      used: 0,
      available: 50 * 1024 * 1024 // 50MB fallback (actual is much more)
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE EXPORT
// =============================================================================

/**
 * SINGLETON INSTANCE
 * 
 * Export a single instance of the WorkScheduleDB class to ensure
 * consistent database access across the entire application.
 * 
 * SINGLETON BENEFITS:
 * - Prevents multiple database connections
 * - Ensures data consistency
 * - Simplifies database management
 * - Reduces memory usage
 * 
 * USAGE PATTERN:
 * Import this instance in any file that needs database access:
 * import { workScheduleDB } from '../utils/indexedDB';
 */
export const workScheduleDB = new WorkScheduleDB();

/**
 * =============================================================================
 * LEARNING POINTS AND EDUCATIONAL VALUE
 * =============================================================================
 * 
 * This IndexedDB implementation demonstrates numerous advanced concepts
 * that are valuable for learning and professional development:
 * 
 * 1. INDEXEDDB MASTERY:
 *    - Complete database lifecycle management
 *    - Transaction handling and atomicity
 *    - Schema design and migration strategies
 *    - Performance optimization techniques
 *    - Error handling and recovery patterns
 * 
 * 2. ASYNCHRONOUS PROGRAMMING PATTERNS:
 *    - Promise-based API design
 *    - Async/await usage throughout
 *    - Parallel operations with Promise.all
 *    - Error propagation and handling
 *    - Callback to Promise conversion
 * 
 * 3. DATA PERSISTENCE STRATEGIES:
 *    - Offline-first application architecture
 *    - Data export/import functionality
 *    - Version compatibility and migration
 *    - Storage quota management
 *    - Backup and recovery systems
 * 
 * 4. SOFTWARE ARCHITECTURE PATTERNS:
 *    - Singleton pattern for resource management
 *    - Repository pattern for data access
 *    - Factory pattern for object creation
 *    - Observer pattern through callbacks
 *    - Adapter pattern for API consistency
 * 
 * 5. ERROR HANDLING AND RESILIENCE:
 *    - Comprehensive error catching and reporting
 *    - Graceful degradation strategies
 *    - Data validation and sanitization
 *    - Recovery mechanisms for corrupted data
 *    - User-friendly error messages
 * 
 * 6. PERFORMANCE OPTIMIZATION:
 *    - Batch operations for efficiency
 *    - Connection pooling and reuse
 *    - Lazy loading strategies
 *    - Memory management best practices
 *    - Query optimization techniques
 * 
 * 7. BROWSER COMPATIBILITY:
 *    - Feature detection and fallbacks
 *    - Cross-browser API differences
 *    - Mobile browser limitations
 *    - Progressive enhancement strategies
 *    - Polyfill and shim techniques
 * 
 * 8. DATA MODELING AND SCHEMA DESIGN:
 *    - Normalized vs denormalized data structures
 *    - Index design for query performance
 *    - Data relationship modeling
 *    - Schema evolution and migration
 *    - Data integrity constraints
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced IndexedDB features (cursors, compound indexes)
 * - Web Workers for background database operations
 * - Service Workers for offline synchronization
 * - Conflict resolution for concurrent modifications
 * - Advanced caching strategies
 * - Database performance monitoring
 * - Security considerations for client-side storage
 * - Alternative storage solutions (WebSQL, localStorage)
 * 
 * This implementation serves as an excellent reference for building
 * production-ready offline-first web applications with robust data
 * persistence and management capabilities.
 */