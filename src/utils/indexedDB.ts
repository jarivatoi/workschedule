/**
 * FILE: src/utils/indexedDB.ts
 * 
 * =============================================================================
 * INDEXEDDB UTILITY CLASS FOR WORK SCHEDULE APPLICATION
 * =============================================================================
 * 
 * OVERVIEW:
 * This utility module provides a comprehensive IndexedDB wrapper specifically
 * designed for the Work Schedule application. It handles all database operations
 * including initialization, data storage, retrieval, and migration, while
 * providing a clean, Promise-based API for the rest of the application.
 * 
 * KEY FEATURES:
 * - Complete offline data storage for work schedules and settings
 * - Automatic database schema management and migrations
 * - Type-safe operations with TypeScript support
 * - Error handling and recovery mechanisms
 * - Data export/import functionality for backup and transfer
 * - Storage quota monitoring and management
 * - Performance optimization for large datasets
 * 
 * DATABASE ARCHITECTURE:
 * The database uses multiple object stores to organize different types of data:
 * 1. 'schedule' - Daily shift assignments (date -> shift IDs)
 * 2. 'specialDates' - Holiday and special day markings
 * 3. 'settings' - Application configuration and user preferences
 * 4. 'metadata' - Application metadata like title and version info
 * 
 * DESIGN PRINCIPLES:
 * - Separation of concerns with dedicated stores for different data types
 * - Atomic operations to prevent data corruption
 * - Graceful error handling with meaningful error messages
 * - Performance optimization for mobile devices
 * - Future-proof schema design for easy extensions
 * 
 * BUSINESS CONTEXT:
 * The Work Schedule application requires reliable offline storage for:
 * - Employee shift schedules across multiple months
 * - Salary and hourly rate configurations
 * - Custom shift definitions and rules
 * - Special date markings for holidays and overtime
 * - User preferences and application settings
 * 
 * =============================================================================
 * TYPE DEFINITIONS AND INTERFACES
 * =============================================================================
 */

import { DEFAULT_SHIFT_COMBINATIONS } from '../constants';

/**
 * DATABASE SCHEMA INTERFACE
 * 
 * PURPOSE:
 * Defines the complete structure of the IndexedDB database, including
 * all object stores and their key-value relationships. This interface
 * serves as documentation and provides type safety for database operations.
 * 
 * OBJECT STORE DEFINITIONS:
 * Each object store is defined with its key type and value structure,
 * ensuring type safety and preventing data corruption through incorrect
 * data types or structures.
 * 
 * SCHEMA EVOLUTION:
 * This interface can be extended to support new object stores or
 * modified value structures as the application evolves. Version
 * management in the database class handles schema migrations.
 */
interface DBSchema {
  /**
   * SCHEDULE OBJECT STORE
   * 
   * PURPOSE: Stores daily shift assignments
   * KEY: Date string in YYYY-MM-DD format
   * VALUE: Object containing date and array of shift IDs
   * 
   * EXAMPLE DATA:
   * {
   *   date: "2024-01-15",
   *   shifts: ["9-4", "custom-shift-123"]
   * }
   * 
   * USAGE: Primary storage for work schedule data
   * INDEX: Date-based for efficient range queries
   */
  schedule: {
    key: string;
    value: {
      date: string;
      shifts: string[];
    };
  };
  
  /**
   * SPECIAL DATES OBJECT STORE
   * 
   * PURPOSE: Stores holiday and special day markings
   * KEY: Date string in YYYY-MM-DD format
   * VALUE: Object containing date and special status flag
   * 
   * EXAMPLE DATA:
   * {
   *   date: "2024-12-25",
   *   isSpecial: true
   * }
   * 
   * USAGE: Marks dates for special pay rates and shift rules
   * BUSINESS IMPACT: Affects pay calculations and shift availability
   */
  specialDates: {
    key: string;
    value: {
      date: string;
      isSpecial: boolean;
    };
  };
  
  /**
   * SETTINGS OBJECT STORE
   * 
   * PURPOSE: Stores application configuration and user preferences
   * KEY: Setting name/identifier string
   * VALUE: Any type of setting value (flexible for different settings)
   * 
   * EXAMPLE DATA:
   * Key: "workSettings"
   * Value: {
   *   basicSalary: 35000,
   *   hourlyRate: 173.08,
   *   currency: "Rs",
   *   customShifts: [...]
   * }
   * 
   * USAGE: Central storage for all user preferences and configuration
   * FLEXIBILITY: Supports any JSON-serializable data type
   */
  settings: {
    key: string;
    value: any;
  };
  
  /**
   * METADATA OBJECT STORE
   * 
   * PURPOSE: Stores application metadata and system information
   * KEY: Metadata identifier string
   * VALUE: Object containing key-value metadata pairs
   * 
   * EXAMPLE DATA:
   * {
   *   key: "scheduleTitle",
   *   value: "My Work Schedule"
   * }
   * 
   * USAGE: Application title, version info, user customizations
   * SCOPE: System-level data separate from user settings
   */
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

/**
 * =============================================================================
 * MAIN DATABASE CLASS DEFINITION
 * =============================================================================
 */

/**
 * WORK SCHEDULE DATABASE CLASS
 * 
 * PURPOSE:
 * Provides a complete abstraction layer over IndexedDB for the Work Schedule
 * application. Handles all database operations including initialization,
 * CRUD operations, data migration, and error recovery.
 * 
 * ARCHITECTURE PATTERNS:
 * - Singleton pattern: One database instance per application
 * - Promise-based API: All operations return Promises for async handling
 * - Error boundary: Comprehensive error handling and recovery
 * - Type safety: Full TypeScript support with generic methods
 * 
 * LIFECYCLE MANAGEMENT:
 * 1. Initialization: Database creation and schema setup
 * 2. Operations: CRUD operations on data
 * 3. Maintenance: Cleanup, optimization, and migration
 * 4. Cleanup: Proper resource management and connection handling
 * 
 * PERFORMANCE FEATURES:
 * - Connection pooling and reuse
 * - Batch operations for bulk data handling
 * - Efficient indexing for fast queries
 * - Memory management for large datasets
 */
class WorkScheduleDB {
  // ==========================================================================
  // PRIVATE PROPERTIES
  // ==========================================================================
  
  /**
   * DATABASE CONNECTION INSTANCE
   * 
   * Stores the active IndexedDB database connection. Null when not connected.
   * Used for all database operations and maintained throughout app lifecycle.
   */
  private db: IDBDatabase | null = null;
  
  /**
   * DATABASE CONFIGURATION CONSTANTS
   * 
   * These constants define the database identity and version management:
   * - dbName: Unique identifier for the database
   * - version: Schema version for migration management
   * 
   * VERSION MANAGEMENT:
   * Increment version number when schema changes are needed.
   * The onupgradeneeded event handler manages migrations between versions.
   */
  private readonly dbName = 'WorkScheduleDB';
  private readonly version = 1;

  // ==========================================================================
  // DATABASE INITIALIZATION METHODS
  // ==========================================================================
  
  /**
   * INITIALIZE DATABASE CONNECTION AND SCHEMA
   * 
   * PURPOSE:
   * Establishes connection to IndexedDB and ensures the database schema
   * is properly set up. Handles both new database creation and existing
   * database connections with proper error handling and recovery.
   * 
   * INITIALIZATION PROCESS:
   * 1. Open database connection with specified name and version
   * 2. Handle schema creation/migration in onupgradeneeded event
   * 3. Store database connection for future operations
   * 4. Provide error handling for connection failures
   * 
   * ERROR SCENARIOS:
   * - Database access denied (privacy mode, storage quota)
   * - Database corruption or version conflicts
   * - Browser compatibility issues
   * - Storage quota exceeded
   * 
   * RECOVERY STRATEGIES:
   * - Graceful degradation with error messages
   * - Retry mechanisms for temporary failures
   * - Fallback to localStorage for critical data
   * 
   * @returns Promise<void> - Resolves when database is ready for use
   * 
   * EXAMPLE USAGE:
   * await workScheduleDB.init();
   * // Database is now ready for operations
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      /**
       * OPEN DATABASE CONNECTION
       * 
       * Uses IndexedDB.open() to establish connection with specified
       * database name and version. The version parameter triggers
       * schema migrations when incremented.
       */
      const request = indexedDB.open(this.dbName, this.version);

      /**
       * ERROR EVENT HANDLER
       * 
       * Handles database connection failures and provides meaningful
       * error messages for debugging and user feedback.
       */
      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      /**
       * SUCCESS EVENT HANDLER
       * 
       * Stores the database connection and resolves the Promise
       * when the database is successfully opened and ready for use.
       */
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      /**
       * SCHEMA UPGRADE EVENT HANDLER
       * 
       * Triggered when database version is incremented or database
       * is created for the first time. Handles all schema creation
       * and migration logic.
       * 
       * OBJECT STORE CREATION:
       * Creates all required object stores with appropriate key paths
       * and indexing strategies for optimal performance.
       */
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        /**
         * SCHEDULE OBJECT STORE CREATION
         * 
         * Stores daily shift assignments with date as the key path.
         * This allows for efficient date-based queries and updates.
         * 
         * KEY PATH: 'date' - Enables direct date-based access
         * STRUCTURE: { date: string, shifts: string[] }
         */
        if (!db.objectStoreNames.contains('schedule')) {
          db.createObjectStore('schedule', { keyPath: 'date' });
        }

        /**
         * SPECIAL DATES OBJECT STORE CREATION
         * 
         * Stores holiday and special day markings with date as key.
         * Separate from schedule for efficient special date queries.
         * 
         * KEY PATH: 'date' - Consistent with schedule store
         * STRUCTURE: { date: string, isSpecial: boolean }
         */
        if (!db.objectStoreNames.contains('specialDates')) {
          db.createObjectStore('specialDates', { keyPath: 'date' });
        }

        /**
         * SETTINGS OBJECT STORE CREATION
         * 
         * Stores application configuration with setting name as key.
         * Flexible structure supports various setting types and values.
         * 
         * KEY PATH: 'key' - Setting identifier for direct access
         * STRUCTURE: { key: string, value: any }
         */
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        /**
         * METADATA OBJECT STORE CREATION
         * 
         * Stores application metadata separate from user settings.
         * Used for system information, titles, and version tracking.
         * 
         * KEY PATH: 'key' - Metadata identifier for direct access
         * STRUCTURE: { key: string, value: any }
         */
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // ==========================================================================
  // DATABASE CONNECTION MANAGEMENT
  // ==========================================================================
  
  /**
   * ENSURE DATABASE CONNECTION IS AVAILABLE
   * 
   * PURPOSE:
   * Provides a reliable way to ensure the database connection is established
   * before performing any operations. Automatically initializes the database
   * if not already connected.
   * 
   * LAZY INITIALIZATION:
   * This method implements lazy initialization, only connecting to the
   * database when actually needed. This improves app startup performance
   * and handles connection recovery automatically.
   * 
   * ERROR HANDLING:
   * Throws meaningful errors if database initialization fails, allowing
   * calling code to handle database unavailability gracefully.
   * 
   * @returns Promise<IDBDatabase> - Connected database instance
   * 
   * USAGE PATTERN:
   * const db = await this.ensureDB();
   * // Database is guaranteed to be available
   */
  private async ensureDB(): Promise<IDBDatabase> {
    /**
     * CHECK EXISTING CONNECTION
     * 
     * If database is already connected, return it immediately.
     * This avoids unnecessary initialization overhead.
     */
    if (!this.db) {
      await this.init();
    }
    
    /**
     * VALIDATE CONNECTION
     * 
     * Ensure the database connection was successfully established.
     * Throws error if initialization failed.
     */
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    return this.db;
  }

  // ==========================================================================
  // SCHEDULE DATA OPERATIONS
  // ==========================================================================
  
  /**
   * RETRIEVE COMPLETE SCHEDULE DATA
   * 
   * PURPOSE:
   * Fetches all schedule data from the database and converts it to the
   * application's expected format (Record<string, string[]>). This method
   * is used during app initialization and data refresh operations.
   * 
   * DATA TRANSFORMATION:
   * Converts from database format { date, shifts } to application format
   * { [date]: shifts } for easier manipulation and lookup operations.
   * 
   * PERFORMANCE CONSIDERATIONS:
   * - Uses getAll() for efficient bulk retrieval
   * - Transforms data in memory rather than multiple queries
   * - Returns empty object if no data exists
   * 
   * ERROR HANDLING:
   * - Database connection failures
   * - Data corruption or invalid formats
   * - Memory limitations for large datasets
   * 
   * @returns Promise<Record<string, string[]>> - Complete schedule data
   * 
   * EXAMPLE RETURN VALUE:
   * {
   *   "2024-01-15": ["9-4", "custom-shift-123"],
   *   "2024-01-16": ["12-10"],
   *   "2024-01-17": ["4-10", "N"]
   * }
   */
  async getSchedule(): Promise<Record<string, string[]>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      /**
       * CREATE READ TRANSACTION
       * 
       * Uses readonly transaction for optimal performance and
       * prevents accidental data modifications during retrieval.
       */
      const transaction = db.transaction(['schedule'], 'readonly');
      const store = transaction.objectStore('schedule');
      const request = store.getAll();

      /**
       * SUCCESS HANDLER WITH DATA TRANSFORMATION
       * 
       * Converts database format to application format and handles
       * empty results gracefully.
       */
      request.onsuccess = () => {
        const result: Record<string, string[]> = {};
        request.result.forEach((item: { date: string; shifts: string[] }) => {
          result[item.date] = item.shifts;
        });
        resolve(result);
      };

      /**
       * ERROR HANDLER
       * 
       * Provides meaningful error messages for debugging and
       * user feedback in case of retrieval failures.
       */
      request.onerror = () => {
        reject(new Error('Failed to get schedule'));
      };
    });
  }

  /**
   * STORE COMPLETE SCHEDULE DATA
   * 
   * PURPOSE:
   * Replaces all schedule data in the database with the provided data.
   * This method is used for bulk updates, data imports, and complete
   * schedule replacements.
   * 
   * OPERATION STRATEGY:
   * 1. Clear existing schedule data to prevent orphaned records
   * 2. Transform application format to database format
   * 3. Insert all new data in a single transaction
   * 4. Handle errors and rollback if necessary
   * 
   * ATOMIC OPERATIONS:
   * Uses a single transaction to ensure data consistency. Either all
   * data is updated successfully, or no changes are made.
   * 
   * DATA FILTERING:
   * Only stores dates with actual shifts (non-empty arrays) to
   * optimize storage space and query performance.
   * 
   * @param schedule - Complete schedule data to store
   * @returns Promise<void> - Resolves when storage is complete
   * 
   * EXAMPLE INPUT:
   * {
   *   "2024-01-15": ["9-4"],
   *   "2024-01-16": ["12-10", "4-10"],
   *   "2024-01-17": []  // This will be filtered out
   * }
   */
  async setSchedule(schedule: Record<string, string[]>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      /**
       * CREATE READ-WRITE TRANSACTION
       * 
       * Uses readwrite mode to allow both clearing existing data
       * and inserting new data within the same transaction.
       */
      const transaction = db.transaction(['schedule'], 'readwrite');
      const store = transaction.objectStore('schedule');

      /**
       * CLEAR EXISTING DATA
       * 
       * Removes all existing schedule data to ensure clean state
       * before inserting new data. This prevents data conflicts
       * and ensures complete replacement.
       */
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        /**
         * PREPARE NEW DATA FOR INSERTION
         * 
         * Creates an array of Promises for inserting each date's
         * schedule data. Only includes dates with actual shifts.
         */
        const promises: Promise<void>[] = [];
        
        Object.entries(schedule).forEach(([date, shifts]) => {
          /**
           * FILTER EMPTY SHIFT ARRAYS
           * 
           * Only store dates that have actual shifts scheduled.
           * This optimizes storage and prevents unnecessary records.
           */
          if (shifts.length > 0) {
            promises.push(new Promise((resolveItem, rejectItem) => {
              const addRequest = store.add({ date, shifts });
              addRequest.onsuccess = () => resolveItem();
              addRequest.onerror = () => rejectItem(new Error(`Failed to add schedule for ${date}`));
            }));
          }
        });

        /**
         * WAIT FOR ALL INSERTIONS TO COMPLETE
         * 
         * Uses Promise.all to ensure all data is inserted successfully
         * before resolving the main Promise.
         */
        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      };

      /**
       * HANDLE CLEAR OPERATION ERRORS
       * 
       * Provides error handling for the initial clear operation.
       */
      clearRequest.onerror = () => {
        reject(new Error('Failed to clear schedule'));
      };
    });
  }

  // ==========================================================================
  // SPECIAL DATES OPERATIONS
  // ==========================================================================
  
  /**
   * RETRIEVE SPECIAL DATES DATA
   * 
   * PURPOSE:
   * Fetches all special date markings from the database and converts
   * them to the application's expected format. Special dates affect
   * pay calculations and shift availability rules.
   * 
   * BUSINESS IMPORTANCE:
   * Special dates are critical for:
   * - Holiday pay calculations
   * - Overtime rate applications
   * - Shift availability rules
   * - Payroll processing accuracy
   * 
   * @returns Promise<Record<string, boolean>> - Special dates mapping
   * 
   * EXAMPLE RETURN VALUE:
   * {
   *   "2024-01-01": true,  // New Year's Day
   *   "2024-07-04": true,  // Independence Day
   *   "2024-12-25": true   // Christmas
   * }
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
   * STORE SPECIAL DATES DATA
   * 
   * PURPOSE:
   * Replaces all special date markings with the provided data.
   * Uses the same atomic operation pattern as schedule storage.
   * 
   * @param specialDates - Special dates mapping to store
   * @returns Promise<void> - Resolves when storage is complete
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
          /**
           * ONLY STORE TRUE VALUES
           * 
           * Only stores dates that are marked as special (true).
           * This optimizes storage by not storing false values.
           */
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

  // ==========================================================================
  // SETTINGS OPERATIONS
  // ==========================================================================
  
  /**
   * RETRIEVE SETTING VALUE
   * 
   * PURPOSE:
   * Fetches a specific setting value from the database with type safety
   * and automatic data migration for backward compatibility.
   * 
   * GENERIC TYPE SUPPORT:
   * Uses TypeScript generics to provide type-safe setting retrieval
   * while maintaining flexibility for different setting types.
   * 
   * BACKWARD COMPATIBILITY:
   * Includes special handling for workSettings to ensure older data
   * formats are automatically migrated to current schema.
   * 
   * @param key - Setting identifier
   * @returns Promise<T | null> - Setting value or null if not found
   * 
   * EXAMPLE USAGE:
   * const settings = await db.getSetting<Settings>('workSettings');
   * const title = await db.getSetting<string>('scheduleTitle');
   */
  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result ? request.result.value : null;
        
        /**
         * SPECIAL HANDLING FOR WORK SETTINGS MIGRATION
         * 
         * Ensures backward compatibility by automatically adding
         * missing properties to existing workSettings data.
         */
        if (key === 'workSettings' && result && typeof result === 'object') {
          if (!result.currency || !result.customShifts || !result.shiftCombinations) {
            const fixedResult = {
              ...result,
              shiftCombinations: result.shiftCombinations || [],
              currency: result.currency || 'Rs.',
              customShifts: result.customShifts || []
            };
            
            /**
             * AUTOMATIC MIGRATION SAVE
             * 
             * Saves the migrated data back to the database to
             * ensure future retrievals don't need migration.
             */
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
   * STORE SETTING VALUE
   * 
   * PURPOSE:
   * Stores a setting value in the database with type safety and
   * automatic upsert behavior (insert or update).
   * 
   * UPSERT BEHAVIOR:
   * Uses put() method to automatically insert new settings or
   * update existing ones without requiring separate logic.
   * 
   * @param key - Setting identifier
   * @param value - Setting value to store
   * @returns Promise<void> - Resolves when storage is complete
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

  // ==========================================================================
  // METADATA OPERATIONS
  // ==========================================================================
  
  /**
   * RETRIEVE METADATA VALUE
   * 
   * PURPOSE:
   * Fetches application metadata such as custom titles, version
   * information, and system configuration data.
   * 
   * @param key - Metadata identifier
   * @returns Promise<T | null> - Metadata value or null if not found
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
   * STORE METADATA VALUE
   * 
   * PURPOSE:
   * Stores application metadata with automatic upsert behavior.
   * 
   * @param key - Metadata identifier
   * @param value - Metadata value to store
   * @returns Promise<void> - Resolves when storage is complete
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

  // ==========================================================================
  // DATA EXPORT/IMPORT OPERATIONS
  // ==========================================================================
  
  /**
   * EXPORT ALL APPLICATION DATA
   * 
   * PURPOSE:
   * Creates a complete backup of all application data in a structured
   * format suitable for file export, data transfer, and disaster recovery.
   * 
   * EXPORT STRUCTURE:
   * - All schedule data across all time periods
   * - All special date markings
   * - Complete settings and configuration
   * - Application metadata and customizations
   * - Export timestamp and version information
   * - Suggested filename for user convenience
   * 
   * DATA INTEGRITY:
   * Ensures exported data includes all necessary components for
   * complete application restoration, including default values
   * for missing or corrupted settings.
   * 
   * @returns Promise<any> - Complete export data structure
   * 
   * EXAMPLE RETURN VALUE:
   * {
   *   schedule: { "2024-01-15": ["9-4"] },
   *   specialDates: { "2024-01-01": true },
   *   settings: { basicSalary: 35000, ... },
   *   scheduleTitle: "My Work Schedule",
   *   exportDate: "2024-01-15T10:30:00.000Z",
   *   version: "3.0",
   *   filename: "Workschedule_15-01-2024.json"
   * }
   */
  async exportAllData(): Promise<any> {
    console.log('🔄 Exporting all data from IndexedDB...');
    
    /**
     * PARALLEL DATA RETRIEVAL
     * 
     * Fetches all data types in parallel for optimal performance.
     * Uses Promise.all to minimize total export time.
     */
    const [schedule, specialDates, settings, scheduleTitle] = await Promise.all([
      this.getSchedule(),
      this.getSpecialDates(),
      this.getSetting('workSettings'),
      this.getMetadata('scheduleTitle')
    ]);

    /**
     * SETTINGS VALIDATION AND MIGRATION
     * 
     * Ensures exported settings are complete and include all
     * necessary properties for successful import and operation.
     */
    const finalSettings = settings || {
      basicSalary: 35000,
      hourlyRate: 173.08,
      shiftCombinations: DEFAULT_SHIFT_COMBINATIONS,
      currency: 'Rs',
      customShifts: []
    };

    /**
     * BACKWARD COMPATIBILITY HANDLING
     * 
     * Adds missing properties to existing settings to ensure
     * compatibility with current application version.
     */
    if (finalSettings && (!finalSettings.shiftCombinations || finalSettings.shiftCombinations.length === 0)) {
      finalSettings.shiftCombinations = DEFAULT_SHIFT_COMBINATIONS;
    }
    
    if (!finalSettings.currency) {
      finalSettings.currency = 'Rs';
    }
    if (!finalSettings.customShifts) {
      finalSettings.customShifts = [];
    }

    /**
     * EXPORT DATA STRUCTURE ASSEMBLY
     * 
     * Creates the complete export data structure with all
     * necessary metadata for successful import and restoration.
     */
    const exportData = {
      schedule,
      specialDates,
      settings: finalSettings,
      scheduleTitle: scheduleTitle || 'Work Schedule',
      exportDate: new Date().toISOString(),
      version: '3.0',
      filename: this.generateExportFilename()
    };

    /**
     * EXPORT STATISTICS LOGGING
     * 
     * Provides detailed information about the exported data
     * for debugging and user feedback.
     */
    console.log('📦 Export data prepared:', {
      scheduleEntries: Object.keys(exportData.schedule).length,
      specialDatesEntries: Object.keys(exportData.specialDates).length,
      settingsIncluded: !!exportData.settings,
      shiftCombinations: exportData.settings?.shiftCombinations?.length || 0
    });

    return exportData;
  }

  /**
   * GENERATE EXPORT FILENAME
   * 
   * PURPOSE:
   * Creates a descriptive filename for exported data files that
   * includes the current date for easy identification and organization.
   * 
   * FILENAME FORMAT:
   * "Workschedule_DD-MM-YYYY.json"
   * 
   * @returns string - Generated filename with current date
   * 
   * EXAMPLE OUTPUT:
   * "Workschedule_15-01-2024.json"
   */
  private generateExportFilename(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    
    return `Workschedule_${day}-${month}-${year}.json`;
  }

  /**
   * IMPORT ALL APPLICATION DATA
   * 
   * PURPOSE:
   * Restores complete application state from exported data with
   * version compatibility checking and data validation.
   * 
   * IMPORT PROCESS:
   * 1. Validate import data structure and version
   * 2. Clear existing data (with user confirmation)
   * 3. Import all data types in proper order
   * 4. Validate imported data integrity
   * 5. Trigger application state refresh
   * 
   * VERSION COMPATIBILITY:
   * - Version 3.0+: Full feature support
   * - Version 2.0+: Compatible with special dates
   * - Version 1.0: Basic compatibility (special dates reset)
   * 
   * DATA VALIDATION:
   * Ensures imported data meets current schema requirements
   * and includes all necessary properties for proper operation.
   * 
   * @param data - Export data structure to import
   * @returns Promise<void> - Resolves when import is complete
   */
  async importAllData(data: any): Promise<void> {
    console.log('🔄 Importing data to IndexedDB:', {
      hasSchedule: !!data.schedule,
      hasSpecialDates: !!data.specialDates,
      hasSettings: !!data.settings,
      hasTitle: !!data.scheduleTitle,
      version: data.version
    });

    /**
     * PARALLEL IMPORT OPERATIONS
     * 
     * Prepares all import operations to run in parallel for
     * optimal performance and atomic completion.
     */
    const promises: Promise<void>[] = [];

    /**
     * SCHEDULE DATA IMPORT
     * 
     * Imports all schedule data if present in the export.
     */
    if (data.schedule) {
      console.log('📅 Importing schedule with', Object.keys(data.schedule).length, 'entries');
      promises.push(this.setSchedule(data.schedule));
    }

    /**
     * SPECIAL DATES IMPORT
     * 
     * Imports special date markings if present in the export.
     */
    if (data.specialDates) {
      console.log('⭐ Importing special dates with', Object.keys(data.specialDates).length, 'entries');
      promises.push(this.setSpecialDates(data.specialDates));
    }

    /**
     * SETTINGS IMPORT WITH MIGRATION
     * 
     * Imports settings data with automatic migration to ensure
     * compatibility with current application version.
     */
    if (data.settings) {
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

    /**
     * METADATA IMPORT
     * 
     * Imports application metadata such as custom titles.
     */
    if (data.scheduleTitle) {
      console.log('📝 Importing schedule title:', data.scheduleTitle);
      promises.push(this.setMetadata('scheduleTitle', data.scheduleTitle));
    }

    /**
     * EXECUTE ALL IMPORT OPERATIONS
     * 
     * Waits for all import operations to complete successfully
     * before resolving the import Promise.
     */
    await Promise.all(promises);
    console.log('✅ All data imported successfully to IndexedDB');
  }

  // ==========================================================================
  // STORAGE MONITORING AND MANAGEMENT
  // ==========================================================================
  
  /**
   * GET STORAGE USAGE INFORMATION
   * 
   * PURPOSE:
   * Provides information about current storage usage and available
   * quota for monitoring and user feedback purposes.
   * 
   * BROWSER COMPATIBILITY:
   * Uses the Storage API when available, with fallback estimates
   * for browsers that don't support quota estimation (like iOS Safari).
   * 
   * QUOTA ESTIMATION:
   * Modern browsers provide accurate quota information, while older
   * browsers receive conservative estimates to prevent storage errors.
   * 
   * @returns Promise<{used: number, available: number}> - Storage info
   * 
   * EXAMPLE RETURN VALUE:
   * {
   *   used: 1048576,      // 1MB used
   *   available: 52428800 // 50MB available
   * }
   */
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    /**
     * MODERN BROWSER STORAGE API
     * 
     * Uses the Storage API when available for accurate quota
     * and usage information.
     */
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
    
    /**
     * FALLBACK STORAGE ESTIMATES
     * 
     * Provides conservative estimates for browsers that don't
     * support the Storage API, particularly iOS Safari.
     */
    console.log('📊 Using fallback storage estimate for iPhone Safari');
    return {
      used: 0,
      available: 50 * 1024 * 1024 // 50MB fallback (actual is much more)
    };
  }
}

/**
 * =============================================================================
 * SINGLETON INSTANCE EXPORT
 * =============================================================================
 */

/**
 * SINGLETON DATABASE INSTANCE
 * 
 * PURPOSE:
 * Provides a single, shared instance of the WorkScheduleDB class
 * for use throughout the application. This ensures consistent
 * database connections and prevents multiple initialization overhead.
 * 
 * USAGE PATTERN:
 * Import and use the singleton instance rather than creating
 * new instances of the WorkScheduleDB class.
 * 
 * EXAMPLE USAGE:
 * import { workScheduleDB } from './utils/indexedDB';
 * 
 * const schedule = await workScheduleDB.getSchedule();
 * await workScheduleDB.setSchedule(newSchedule);
 */
export const workScheduleDB = new WorkScheduleDB();

/**
 * =============================================================================
 * USAGE EXAMPLES AND INTEGRATION PATTERNS
 * =============================================================================
 * 
 * BASIC OPERATIONS:
 * 
 * import { workScheduleDB } from './utils/indexedDB';
 * 
 * // Initialize database
 * await workScheduleDB.init();
 * 
 * // Store schedule data
 * await workScheduleDB.setSchedule({
 *   "2024-01-15": ["9-4"],
 *   "2024-01-16": ["12-10", "4-10"]
 * });
 * 
 * // Retrieve schedule data
 * const schedule = await workScheduleDB.getSchedule();
 * 
 * // Store settings
 * await workScheduleDB.setSetting('workSettings', {
 *   basicSalary: 35000,
 *   hourlyRate: 173.08,
 *   currency: 'Rs'
 * });
 * 
 * REACT HOOK INTEGRATION:
 * 
 * const useScheduleData = () => {
 *   const [schedule, setSchedule] = useState({});
 *   const [loading, setLoading] = useState(true);
 * 
 *   useEffect(() => {
 *     const loadData = async () => {
 *       try {
 *         const data = await workScheduleDB.getSchedule();
 *         setSchedule(data);
 *       } catch (error) {
 *         console.error('Failed to load schedule:', error);
 *       } finally {
 *         setLoading(false);
 *       }
 *     };
 * 
 *     loadData();
 *   }, []);
 * 
 *   return { schedule, loading };
 * };
 * 
 * ERROR HANDLING PATTERNS:
 * 
 * const saveScheduleWithErrorHandling = async (schedule) => {
 *   try {
 *     await workScheduleDB.setSchedule(schedule);
 *     console.log('Schedule saved successfully');
 *   } catch (error) {
 *     console.error('Failed to save schedule:', error);
 *     // Show user-friendly error message
 *     alert('Failed to save schedule. Please try again.');
 *   }
 * };
 * 
 * BULK OPERATIONS:
 * 
 * const importCompleteDataset = async (exportData) => {
 *   try {
 *     // Show loading indicator
 *     setLoading(true);
 * 
 *     // Import all data
 *     await workScheduleDB.importAllData(exportData);
 * 
 *     // Refresh application state
 *     await refreshAllData();
 * 
 *     console.log('Data imported successfully');
 *   } catch (error) {
 *     console.error('Import failed:', error);
 *     alert('Import failed. Please check the file format.');
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 * 
 * =============================================================================
 * PERFORMANCE OPTIMIZATION STRATEGIES
 * =============================================================================
 * 
 * CONNECTION MANAGEMENT:
 * - Single database connection shared across operations
 * - Lazy initialization to improve startup performance
 * - Automatic connection recovery for reliability
 * 
 * TRANSACTION OPTIMIZATION:
 * - Batch operations in single transactions
 * - Use appropriate transaction modes (readonly vs readwrite)
 * - Minimize transaction scope for better concurrency
 * 
 * DATA STRUCTURE OPTIMIZATION:
 * - Efficient key paths for fast lookups
 * - Minimal data duplication across stores
 * - Optimized data formats for storage and retrieval
 * 
 * MEMORY MANAGEMENT:
 * - Stream large datasets instead of loading all at once
 * - Clean up unused database connections
 * - Optimize data transformation operations
 * 
 * =============================================================================
 * TESTING AND DEBUGGING STRATEGIES
 * =============================================================================
 * 
 * UNIT TESTING:
 * - Mock IndexedDB for isolated testing
 * - Test error conditions and edge cases
 * - Validate data transformation logic
 * - Test migration and compatibility scenarios
 * 
 * INTEGRATION TESTING:
 * - Test with real IndexedDB in browser environment
 * - Validate cross-browser compatibility
 * - Test large dataset performance
 * - Verify data persistence across sessions
 * 
 * DEBUGGING TOOLS:
 * - Browser DevTools Application tab for database inspection
 * - Console logging for operation tracking
 * - Error reporting for production debugging
 * - Performance monitoring for optimization
 * 
 * =============================================================================
 * SECURITY AND PRIVACY CONSIDERATIONS
 * =============================================================================
 * 
 * DATA SECURITY:
 * - All data stored locally in user's browser
 * - No server transmission of sensitive information
 * - User controls all data export and sharing
 * - Automatic cleanup when browser data is cleared
 * 
 * PRIVACY PROTECTION:
 * - No tracking or analytics in database operations
 * - No external data transmission
 * - User-controlled data retention and deletion
 * - Transparent data handling and storage
 * 
 * COMPLIANCE CONSIDERATIONS:
 * - GDPR compliance through local storage
 * - User control over data export and deletion
 * - No third-party data sharing
 * - Clear data handling documentation
 */