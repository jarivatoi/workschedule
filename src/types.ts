/**
 * TypeScript Type Definitions for Work Schedule Application
 * 
 * This file contains all the TypeScript interfaces and types used throughout
 * the work schedule application. These types ensure type safety, provide
 * better IDE support, and serve as documentation for the data structures.
 * 
 * Type Categories:
 * - Core Data Types: Basic entities like shifts and schedules
 * - Configuration Types: Settings and application configuration
 * - UI Types: Component props and state interfaces
 * - Data Exchange Types: Import/export data structures
 * 
 * Design Principles:
 * - Explicit over implicit: All properties are clearly defined
 * - Optional properties marked with ? for flexibility
 * - Consistent naming conventions across all types
 * - Backward compatibility considerations for data migration
 * 
 * Dependencies:
 * - None (pure TypeScript definitions)
 * 
 * @author NARAYYA
 * @version 3.0
 */

/**
 * Legacy Shift Interface
 * 
 * Represents a basic shift type with display properties.
 * This is primarily used for UI display and backward compatibility.
 * 
 * @deprecated Use CustomShift for new implementations
 */
export interface Shift {
  /** Unique identifier for the shift */
  id: string;
  /** Human-readable label for the shift */
  label: string;
  /** Time range display string (e.g., "9-4", "12-10") */
  time: string;
  /** CSS classes for background color and styling */
  color: string;
  /** CSS classes for text color */
  displayColor: string;
}

/**
 * Day Schedule Type
 * 
 * Maps date strings to arrays of shift IDs for that date.
 * This is the core data structure for storing scheduled shifts.
 * 
 * Key Format: YYYY-MM-DD (ISO 8601 date format)
 * Value Format: Array of shift IDs that are scheduled for that date
 * 
 * Example:
 * {
 *   "2024-01-15": ["shift-morning", "shift-evening"],
 *   "2024-01-16": ["shift-night"]
 * }
 * 
 * Why this structure:
 * - Efficient lookups by date
 * - Easy to serialize/deserialize
 * - Supports multiple shifts per day
 * - Date keys ensure consistent formatting
 */
export interface DaySchedule {
  [key: string]: string[]; // date string -> array of shift IDs
}

/**
 * Special Dates Type
 * 
 * Maps date strings to boolean flags indicating special date status.
 * Special dates may have different shift availability or calculation rules.
 * 
 * Key Format: YYYY-MM-DD (ISO 8601 date format)
 * Value Format: Boolean indicating if the date is special
 * 
 * Example:
 * {
 *   "2024-01-01": true,  // New Year's Day
 *   "2024-12-25": true   // Christmas Day
 * }
 * 
 * Use Cases:
 * - Public holidays with different shift rules
 * - Special events requiring different scheduling
 * - Days with premium pay rates
 */
export interface SpecialDates {
  [key: string]: boolean; // date string -> is special date
}

/**
 * Legacy Shift Combination Interface
 * 
 * Represents predefined shift combinations with hours and enabled status.
 * Kept for backward compatibility with older data formats.
 * 
 * @deprecated Use CustomShift for new implementations
 */
export interface ShiftCombination {
  /** Unique identifier for the combination */
  id: string;
  /** Combination identifier (often same as id) */
  combination: string;
  /** Total hours for this combination */
  hours: number;
  /** Whether this combination is currently enabled */
  enabled: boolean;
  /** Flag indicating if this is a custom combination */
  isCustom?: boolean;
}

/**
 * Application Settings Interface
 * 
 * Contains all configuration data that affects calculations and app behavior.
 * This is the central configuration object for the entire application.
 * 
 * Critical for:
 * - Salary and rate calculations
 * - Currency display formatting
 * - Available shift definitions
 * - Overtime calculation rules
 */
export interface Settings {
  /** Annual basic salary used for hourly rate calculation */
  basicSalary: number;
  
  /** Hourly rate for normal time (can be calculated or manually set) */
  hourlyRate: number;
  
  /** 
   * Multiplier for overtime rate calculation (typically 1.5)
   * Overtime rate = hourlyRate * overtimeMultiplier
   */
  overtimeMultiplier?: number;
  
  /** 
   * Legacy shift combinations array
   * @deprecated Kept for backward compatibility only
   */
  shiftCombinations: ShiftCombination[];
  
  /** Currency symbol or code for display (e.g., "Rs", "$", "€") */
  currency: string;
  
  /** Array of user-defined custom shifts */
  customShifts: CustomShift[];
}

/**
 * Custom Shift Interface
 * 
 * Represents a user-defined shift with detailed time and hour specifications.
 * This is the primary shift definition format for the current version.
 * 
 * Features:
 * - Separate normal and overtime hours for accurate pay calculation
 * - Flexible time ranges (can span midnight)
 * - Day-specific availability rules
 * - Enable/disable functionality
 */
export interface CustomShift {
  /** Unique identifier for the shift */
  id: string;
  
  /** Human-readable label for the shift */
  label: string;
  
  /** Start time in HH:MM format (24-hour) */
  fromTime: string;
  
  /** End time in HH:MM format (24-hour) */
  toTime: string;
  
  /** 
   * Total hours for the shift
   * @deprecated Use normalHours + overtimeHours instead
   */
  hours: number;
  
  /** Hours paid at normal rate */
  normalHours?: number;
  
  /** Hours paid at overtime rate */
  overtimeHours?: number;
  
  /** Whether this shift is currently enabled for selection */
  enabled: boolean;
  
  /**
   * Days when this shift can be scheduled
   * Allows fine-grained control over shift availability
   */
  applicableDays?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    /** Special flag for dates marked as special */
    specialDay: boolean;
  };
}

/**
 * Export Data Interface
 * 
 * Defines the structure for data export/import operations.
 * Used for backup files and data migration between devices.
 * 
 * Version History:
 * - v3.0: Current IndexedDB format with all features
 * - v2.0: Added special dates support
 * - v1.0: Basic format without special dates
 * 
 * Backward Compatibility:
 * - Import process handles all versions
 * - Missing fields are filled with sensible defaults
 * - Version field allows format-specific handling
 */
export interface ExportData {
  /** Complete schedule data */
  schedule: DaySchedule;
  
  /** Special date markings */
  specialDates: SpecialDates;
  
  /** Application settings and configuration */
  settings: Settings;
  
  /** User-customizable schedule title */
  scheduleTitle: string;
  
  /** ISO timestamp of when export was created */
  exportDate: string;
  
  /** Data format version for compatibility handling */
  version: string;
}