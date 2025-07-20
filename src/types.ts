/**
 * FILE: src/types.ts
 * 
 * =============================================================================
 * TYPE DEFINITIONS FOR WORK SCHEDULE APPLICATION
 * =============================================================================
 * 
 * OVERVIEW:
 * This file contains all TypeScript type definitions and interfaces used throughout
 * the Work Schedule application. These types ensure type safety, provide better
 * IDE support, and serve as documentation for the data structures used in the app.
 * 
 * MAIN CATEGORIES:
 * 1. Shift-related types (Shift, CustomShift)
 * 2. Schedule data types (DaySchedule, SpecialDates)
 * 3. Configuration types (ShiftCombination, Settings)
 * 4. Data export/import types (ExportData)
 * 
 * DESIGN PRINCIPLES:
 * - Strict typing for better error prevention
 * - Optional properties where appropriate for flexibility
 * - Clear naming conventions for easy understanding
 * - Backward compatibility considerations
 * - Extensible structures for future enhancements
 * 
 * RELATIONSHIPS:
 * - Used by all components for type checking
 * - Imported by hooks for data validation
 * - Referenced by utility functions for consistency
 * - Guides database schema design
 * 
 * =============================================================================
 * SHIFT INTERFACE - PREDEFINED SHIFT TYPES
 * =============================================================================
 */

/**
 * Represents a predefined shift type with visual styling information
 * 
 * PURPOSE:
 * Defines the structure for built-in shift types that come with the application.
 * These are the default shifts like "Morning", "Evening", "Night" that users
 * can select from without creating custom shifts.
 * 
 * USAGE CONTEXT:
 * - Used in constants.ts for DEFAULT_SHIFTS
 * - Referenced by Calendar component for shift display
 * - Used by ShiftModal for shift selection
 * 
 * PROPERTIES EXPLAINED:
 * - id: Unique identifier for the shift (used in schedule data)
 * - label: Human-readable name displayed in UI
 * - time: Time range display text (e.g., "9-4", "12-10")
 * - color: Tailwind CSS classes for background and text styling
 * - displayColor: Specific text color class for consistent theming
 * 
 * EXAMPLE USAGE:
 * const morningShift: Shift = {
 *   id: '9-4',
 *   label: 'Morning Shift',
 *   time: '9-4',
 *   color: 'bg-blue-100 text-blue-800 border-blue-200',
 *   displayColor: 'text-blue-600'
 * };
 */
export interface Shift {
  /** Unique identifier for the shift, used as key in schedule data */
  id: string;
  
  /** Human-readable label displayed in the user interface */
  label: string;
  
  /** Time range display text (e.g., "9-4", "12-10", "N" for night) */
  time: string;
  
  /** Tailwind CSS classes for styling the shift badge/button */
  color: string;
  
  /** Specific text color class for consistent theming across components */
  displayColor: string;
}

/**
 * =============================================================================
 * DAY SCHEDULE INTERFACE - DAILY SHIFT ASSIGNMENTS
 * =============================================================================
 */

/**
 * Maps dates to arrays of shift IDs for schedule management
 * 
 * PURPOSE:
 * This is the core data structure that stores which shifts are scheduled
 * on which dates. It uses a string-to-array mapping for efficient lookups
 * and flexible shift combinations.
 * 
 * KEY FORMAT:
 * Date keys must be in YYYY-MM-DD format (ISO 8601 date format)
 * Examples: "2024-01-15", "2024-12-31"
 * 
 * VALUE FORMAT:
 * Array of shift IDs that can include both predefined and custom shift IDs
 * Examples: ["9-4"], ["12-10", "4-10"], ["custom-shift-123"]
 * 
 * USAGE PATTERNS:
 * - Empty array [] means no shifts scheduled for that date
 * - Missing key means no data for that date (treated as no shifts)
 * - Multiple shift IDs allow for split shifts or overtime combinations
 * 
 * EXAMPLE DATA:
 * {
 *   "2024-01-15": ["9-4"],                    // Single morning shift
 *   "2024-01-16": ["12-10", "4-10"],         // Split shift day
 *   "2024-01-17": ["custom-shift-123"],      // Custom shift
 *   "2024-01-18": []                         // No shifts (could be omitted)
 * }
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Object lookup is O(1) for date access
 * - Array operations are O(n) where n is shifts per day (typically 1-3)
 * - Memory efficient as only scheduled dates are stored
 */
export interface DaySchedule {
  /** Date string in YYYY-MM-DD format mapped to array of shift IDs */
  [key: string]: string[];
}

/**
 * =============================================================================
 * SPECIAL DATES INTERFACE - HOLIDAY AND SPECIAL DAY MARKING
 * =============================================================================
 */

/**
 * Maps dates to boolean flags indicating special day status
 * 
 * PURPOSE:
 * Tracks which dates are marked as "special" (holidays, overtime days, etc.)
 * This affects pay calculations, shift availability, and visual indicators.
 * 
 * BUSINESS LOGIC IMPACT:
 * - Special dates may have different pay rates
 * - Certain shifts may only be available on special dates
 * - Visual indicators help users identify special days
 * - May affect overtime calculations and bonuses
 * 
 * KEY FORMAT:
 * Same as DaySchedule - YYYY-MM-DD format for consistency
 * 
 * VALUE MEANING:
 * - true: Date is marked as special
 * - false: Date is explicitly marked as NOT special
 * - undefined/missing: No special status (treated as normal day)
 * 
 * EXAMPLE DATA:
 * {
 *   "2024-01-01": true,    // New Year's Day
 *   "2024-07-04": true,    // Independence Day
 *   "2024-12-25": true,    // Christmas
 *   "2024-01-02": false    // Explicitly marked as normal day
 * }
 * 
 * USAGE IN CALCULATIONS:
 * - Used by useScheduleCalculations hook for pay computation
 * - Referenced by Calendar component for visual styling
 * - Checked by ShiftModal for shift availability rules
 */
export interface SpecialDates {
  /** Date string in YYYY-MM-DD format mapped to special day flag */
  [key: string]: boolean;
}

/**
 * =============================================================================
 * SHIFT COMBINATION INTERFACE - LEGACY SHIFT CONFIGURATION
 * =============================================================================
 */

/**
 * Represents a legacy shift combination configuration
 * 
 * DEPRECATION NOTICE:
 * This interface is maintained for backward compatibility but is being
 * phased out in favor of the more flexible CustomShift interface.
 * New features should use CustomShift instead.
 * 
 * PURPOSE:
 * Originally used to define predefined shift combinations with fixed
 * hours and enable/disable states. Replaced by more flexible custom shifts.
 * 
 * MIGRATION PATH:
 * - Existing ShiftCombination data is converted to CustomShift format
 * - New installations use CustomShift exclusively
 * - Legacy data is preserved during app updates
 * 
 * PROPERTIES:
 * - id: Unique identifier matching shift IDs
 * - combination: Display text for the shift combination
 * - hours: Total hours for this shift
 * - enabled: Whether this shift is available for selection
 * - isCustom: Flag indicating if this is a custom-created shift
 */
export interface ShiftCombination {
  /** Unique identifier for the shift combination */
  id: string;
  
  /** Display text for the shift combination (e.g., "Morning 9-4") */
  combination: string;
  
  /** Total hours for this shift combination */
  hours: number;
  
  /** Whether this shift combination is enabled/available */
  enabled: boolean;
  
  /** Optional flag indicating if this is a custom-created shift */
  isCustom?: boolean;
}

/**
 * =============================================================================
 * SETTINGS INTERFACE - APPLICATION CONFIGURATION
 * =============================================================================
 */

/**
 * Main application settings and configuration data
 * 
 * PURPOSE:
 * Centralizes all user-configurable settings including salary information,
 * pay rates, currency preferences, and custom shift definitions. This is
 * the primary configuration object for the entire application.
 * 
 * PERSISTENCE:
 * - Stored in IndexedDB for offline access
 * - Automatically synced across app sessions
 * - Included in data export/import operations
 * - Backed up with schedule data
 * 
 * CALCULATION DEPENDENCIES:
 * - basicSalary and hourlyRate are used for all pay calculations
 * - overtimeMultiplier affects overtime pay computation
 * - customShifts define available work shifts
 * - currency affects display formatting
 * 
 * MIGRATION CONSIDERATIONS:
 * - shiftCombinations maintained for backward compatibility
 * - New features should use customShifts array
 * - Default values provided for missing properties
 */
export interface Settings {
  /** 
   * Annual basic salary amount
   * Used as base for hourly rate calculations when using formula mode
   * Typically entered as whole number (e.g., 35000 for $35,000/year)
   */
  basicSalary: number;
  
  /** 
   * Hourly pay rate for regular hours
   * Can be calculated from basicSalary using formula or set directly
   * Used as base rate for all hour-based calculations
   */
  hourlyRate: number;
  
  /** 
   * Multiplier for overtime pay calculation
   * Standard value is 1.5 for "time and a half"
   * Applied to hourlyRate for overtime hours
   * Optional - defaults to 1.5 if not specified
   */
  overtimeMultiplier?: number;
  
  /** 
   * Legacy shift combinations array
   * Maintained for backward compatibility with older app versions
   * New installations should use customShifts instead
   * May be empty array in newer app versions
   */
  shiftCombinations: ShiftCombination[];
  
  /** 
   * Currency symbol for display formatting
   * Examples: "Rs", "$", "€", "£"
   * Used throughout the app for amount display
   * Affects export formatting and user interface
   */
  currency: string;
  
  /** 
   * Array of user-defined custom shifts
   * Primary shift definition system for current app version
   * Supports complex shift configurations with normal/overtime hours
   * Replaces legacy shiftCombinations system
   */
  customShifts: CustomShift[];
}

/**
 * =============================================================================
 * CUSTOM SHIFT INTERFACE - FLEXIBLE SHIFT DEFINITION
 * =============================================================================
 */

/**
 * Comprehensive custom shift definition with advanced features
 * 
 * PURPOSE:
 * Provides a flexible system for defining work shifts with support for
 * normal hours, overtime hours, allowances, and day-specific availability.
 * This is the modern replacement for the legacy ShiftCombination system.
 * 
 * FEATURES:
 * - Separate normal and overtime hour tracking
 * - Allowance hours with different pay rates
 * - Day-specific availability rules
 * - Flexible time range definitions
 * - Enable/disable functionality
 * 
 * CALCULATION BREAKDOWN:
 * Total Pay = (normalHours × hourlyRate) + 
 *             (overtimeHours × hourlyRate × overtimeMultiplier) +
 *             (normalAllowanceHours × hourlyRate) +
 *             (overtimeAllowanceHours × hourlyRate × overtimeMultiplier)
 * 
 * DAY AVAILABILITY:
 * The applicableDays object controls which days of the week this shift
 * can be scheduled on, plus a special flag for holiday/special days.
 */
export interface CustomShift {
  /** 
   * Unique identifier for the custom shift
   * Generated using timestamp or UUID pattern
   * Used as key in schedule data and for updates/deletions
   */
  id: string;
  
  /** 
   * Human-readable label for the shift
   * Displayed in UI components and shift selection
   * Examples: "Morning Shift", "Night Duty", "Weekend Override"
   */
  label: string;
  
  /** 
   * Start time in 24-hour format (HH:MM)
   * Examples: "09:00", "14:30", "23:00"
   * Used for time range display and validation
   */
  fromTime: string;
  
  /** 
   * End time in 24-hour format (HH:MM)
   * Examples: "17:00", "22:30", "07:00"
   * Can be next day for overnight shifts
   */
  toTime: string;
  
  /** 
   * Total hours for the shift
   * Maintained for backward compatibility
   * Should equal sum of all hour components
   */
  hours: number;
  
  /** 
   * Regular work hours paid at standard rate
   * Typically the majority of shift hours
   * Paid at settings.hourlyRate
   */
  normalHours?: number;
  
  /** 
   * Overtime hours paid at premium rate
   * Paid at settings.hourlyRate × settings.overtimeMultiplier
   * Usually 1.5x or 2x normal rate
   */
  overtimeHours?: number;
  
  /** 
   * Allowance hours paid at normal rate
   * Additional compensation hours (breaks, travel, etc.)
   * Paid at settings.hourlyRate
   */
  normalAllowanceHours?: number;
  
  /** 
   * Allowance hours paid at overtime rate
   * Premium allowance compensation
   * Paid at settings.hourlyRate × settings.overtimeMultiplier
   */
  overtimeAllowanceHours?: number;
  
  /** 
   * Whether this shift is available for scheduling
   * Disabled shifts are hidden from selection but preserved in data
   * Useful for temporarily removing shifts without deletion
   */
  enabled: boolean;
  
  /** 
   * Day-specific availability configuration
   * Controls which days of the week this shift can be scheduled
   * Includes special day flag for holidays/overtime days
   */
  applicableDays?: {
    /** Available on Mondays */
    monday: boolean;
    /** Available on Tuesdays */
    tuesday: boolean;
    /** Available on Wednesdays */
    wednesday: boolean;
    /** Available on Thursdays */
    thursday: boolean;
    /** Available on Fridays */
    friday: boolean;
    /** Available on Saturdays */
    saturday: boolean;
    /** Available on Sundays */
    sunday: boolean;
    /** Available on special/holiday days */
    specialDay: boolean;
  };
}

/**
 * =============================================================================
 * EXPORT DATA INTERFACE - DATA BACKUP AND TRANSFER
 * =============================================================================
 */

/**
 * Complete data export structure for backup and transfer operations
 * 
 * PURPOSE:
 * Defines the structure for exporting all application data to a single
 * JSON file. Used for backup, data transfer between devices, and
 * disaster recovery scenarios.
 * 
 * EXPORT PROCESS:
 * 1. Collect all data from IndexedDB
 * 2. Package into ExportData structure
 * 3. Add metadata (timestamp, version)
 * 4. Serialize to JSON
 * 5. Provide as downloadable file
 * 
 * IMPORT PROCESS:
 * 1. Parse JSON file
 * 2. Validate structure and version
 * 3. Clear existing data (with user confirmation)
 * 4. Import all data to IndexedDB
 * 5. Refresh application state
 * 
 * VERSION COMPATIBILITY:
 * - Version 3.0+: Full feature support with IndexedDB
 * - Version 2.0+: Compatible with special dates
 * - Version 1.0: Basic compatibility (special dates reset)
 * 
 * SECURITY CONSIDERATIONS:
 * - No sensitive data included (passwords, tokens)
 * - All data is user-generated work schedule information
 * - File can be safely shared or stored in cloud services
 */
export interface ExportData {
  /** 
   * Complete schedule data mapping dates to shift arrays
   * Includes all scheduled shifts across all time periods
   */
  schedule: DaySchedule;
  
  /** 
   * Special date markings for holidays and overtime days
   * Affects pay calculations and shift availability
   */
  specialDates: SpecialDates;
  
  /** 
   * All application settings and configuration
   * Includes salary, rates, currency, and custom shifts
   */
  settings: Settings;
  
  /** 
   * User-customized application title
   * Displayed in header and export filename
   */
  scheduleTitle: string;
  
  /** 
   * ISO timestamp of when export was created
   * Used for file naming and import validation
   */
  exportDate: string;
  
  /** 
   * Export format version for compatibility checking
   * Current version: "3.0" (IndexedDB with full features)
   * Previous versions: "2.0" (with special dates), "1.0" (basic)
   */
  version: string;
}

/**
 * =============================================================================
 * TYPE USAGE EXAMPLES AND BEST PRACTICES
 * =============================================================================
 * 
 * EXAMPLE 1: Creating a new custom shift
 * 
 * const newShift: CustomShift = {
 *   id: `shift-${Date.now()}`,
 *   label: "Morning Shift",
 *   fromTime: "09:00",
 *   toTime: "17:00",
 *   hours: 8,
 *   normalHours: 8,
 *   overtimeHours: 0,
 *   normalAllowanceHours: 0,
 *   overtimeAllowanceHours: 0,
 *   enabled: true,
 *   applicableDays: {
 *     monday: true,
 *     tuesday: true,
 *     wednesday: true,
 *     thursday: true,
 *     friday: true,
 *     saturday: false,
 *     sunday: false,
 *     specialDay: false
 *   }
 * };
 * 
 * EXAMPLE 2: Updating schedule data
 * 
 * const updateSchedule = (schedule: DaySchedule, date: string, shiftIds: string[]) => {
 *   return {
 *     ...schedule,
 *     [date]: shiftIds
 *   };
 * };
 * 
 * EXAMPLE 3: Type-safe settings update
 * 
 * const updateSettings = (currentSettings: Settings, updates: Partial<Settings>): Settings => {
 *   return {
 *     ...currentSettings,
 *     ...updates
 *   };
 * };
 * 
 * =============================================================================
 * MIGRATION AND COMPATIBILITY NOTES
 * =============================================================================
 * 
 * LEGACY SUPPORT:
 * - ShiftCombination interface maintained for backward compatibility
 * - Old data automatically migrated to CustomShift format
 * - Export/import handles version differences gracefully
 * 
 * FUTURE EXTENSIBILITY:
 * - Optional properties allow for feature additions
 * - Version field in ExportData enables format evolution
 * - Interfaces can be extended without breaking existing code
 * 
 * TYPE SAFETY BENEFITS:
 * - Compile-time error checking prevents runtime issues
 * - IDE autocomplete improves development experience
 * - Refactoring is safer with type checking
 * - API contracts are clearly defined
 * 
 * =============================================================================
 * PERFORMANCE CONSIDERATIONS
 * =============================================================================
 * 
 * MEMORY USAGE:
 * - DaySchedule only stores dates with scheduled shifts
 * - SpecialDates only stores explicitly marked dates
 * - CustomShift arrays typically contain 5-20 items
 * 
 * LOOKUP PERFORMANCE:
 * - Object key lookups are O(1) for date-based access
 * - Array operations are O(n) where n is small (shifts per day)
 * - Type checking has no runtime performance impact
 * 
 * SERIALIZATION:
 * - All types are JSON-serializable for storage and export
 * - No circular references or complex objects
 * - Efficient IndexedDB storage and retrieval
 */