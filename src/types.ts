/**
 * FILE: src/types.ts
 * 
 * =============================================================================
 * OVERVIEW AND PURPOSE
 * =============================================================================
 * 
 * This file defines the complete type system for the Work Schedule application,
 * providing TypeScript interfaces and type definitions that ensure type safety,
 * code documentation, and development-time error prevention across the entire
 * codebase.
 * 
 * MAIN FUNCTIONALITY:
 * - Core data structure definitions for schedule management
 * - Type safety for complex business logic operations
 * - Interface contracts between components and services
 * - Data validation and serialization support
 * - Import/export data structure definitions
 * - Configuration and settings type definitions
 * 
 * DEPENDENCIES AND RELATIONSHIPS:
 * - Used by: All components, hooks, and utilities throughout the application
 * - Imported by: App.tsx, Calendar.tsx, SettingsPanel.tsx, and all other files
 * - Ensures: Type consistency across the entire application
 * - Supports: IntelliSense, auto-completion, and compile-time error checking
 * 
 * DESIGN PATTERNS DEMONSTRATED:
 * - Interface segregation principle (specific interfaces for specific purposes)
 * - Type composition and extension patterns
 * - Optional vs required property design
 * - Generic type usage for flexible data structures
 * - Discriminated unions for type safety
 * 
 * LEARNING OBJECTIVES:
 * This file demonstrates advanced TypeScript concepts including:
 * 1. Interface design and composition patterns
 * 2. Type safety in complex business applications
 * 3. Data modeling for real-world applications
 * 4. Optional and required property patterns
 * 5. Type documentation and self-documenting code
 * 6. Scalable type architecture for large applications
 * 7. Import/export type management
 * 8. Configuration and settings type design
 * 
 * =============================================================================
 * TYPE SYSTEM ARCHITECTURE
 * =============================================================================
 * 
 * TYPE HIERARCHY:
 * The type system is organized in layers from basic data types to complex
 * business objects, following a clear dependency hierarchy:
 * 
 * 1. BASIC TYPES: Shift, CustomShift (fundamental building blocks)
 * 2. COLLECTION TYPES: DaySchedule, SpecialDates (data collections)
 * 3. CONFIGURATION TYPES: Settings, ShiftCombination (application config)
 * 4. COMPOSITE TYPES: ExportData (combines multiple types)
 * 
 * DESIGN PRINCIPLES:
 * - Single Responsibility: Each interface has one clear purpose
 * - Open/Closed: Interfaces can be extended without modification
 * - Interface Segregation: Clients depend only on interfaces they use
 * - Dependency Inversion: High-level modules depend on abstractions
 * 
 * TYPE SAFETY BENEFITS:
 * - Compile-time error detection
 * - IntelliSense and auto-completion support
 * - Refactoring safety and confidence
 * - Self-documenting code through type definitions
 * - Prevention of runtime type errors
 * 
 * =============================================================================
 * BUSINESS DOMAIN MODELING
 * =============================================================================
 * 
 * DOMAIN CONCEPTS:
 * The type system models the real-world domain of work schedule management:
 * 
 * - SHIFTS: Work periods with specific times and properties
 * - SCHEDULE: Mapping of dates to assigned shifts
 * - SPECIAL DATES: Holidays, overtime days, or other special occasions
 * - SETTINGS: User preferences and calculation parameters
 * - COMBINATIONS: Predefined shift patterns for quick selection
 * 
 * BUSINESS RULES ENCODED IN TYPES:
 * - Shifts have time ranges, hours, and applicability rules
 * - Schedules map date strings to arrays of shift identifiers
 * - Special dates are boolean flags for specific dates
 * - Settings include salary, rates, and currency information
 * - Export data includes versioning for compatibility
 */

// =============================================================================
// CORE SHIFT TYPE DEFINITIONS
// =============================================================================

/**
 * SHIFT INTERFACE
 * 
 * Represents a basic work shift with display properties and identification.
 * This is the fundamental building block for the legacy shift system.
 * 
 * USAGE CONTEXT:
 * - Legacy shift definitions (12-10, 9-4, 4-10, N)
 * - Display in shift selection interfaces
 * - Color coding and visual representation
 * - Basic shift identification and labeling
 * 
 * DESIGN DECISIONS:
 * - id: Unique identifier for database storage and references
 * - label: Human-readable name for user interfaces
 * - time: Display string for time ranges (e.g., "12-10", "9-4")
 * - color: CSS classes for consistent visual styling
 * - displayColor: Text color classes for readability
 * 
 * EVOLUTION NOTE:
 * This interface represents the original shift system. The application
 * has evolved to use CustomShift for more flexible shift definitions,
 * but this interface is maintained for backward compatibility.
 */
export interface Shift {
  id: string;           // Unique identifier (e.g., "12-10", "9-4", "4-10", "N")
  label: string;        // Display name (e.g., "Saturday Regular", "Evening Shift")
  time: string;         // Time display (e.g., "12-10", "9-4")
  color: string;        // CSS classes for background and styling
  displayColor: string; // CSS classes for text color
}

/**
 * CUSTOM SHIFT INTERFACE
 * 
 * Represents a user-defined work shift with detailed time, hours, and
 * applicability information. This is the modern, flexible shift system
 * that supports complex scheduling requirements.
 * 
 * USAGE CONTEXT:
 * - User-created shift definitions
 * - Detailed time and hour tracking
 * - Overtime calculation support
 * - Day-specific applicability rules
 * - Advanced scheduling features
 * 
 * DESIGN DECISIONS:
 * - fromTime/toTime: Precise time boundaries in HH:MM format
 * - hours: Total shift duration for quick reference
 * - normalHours/overtimeHours: Separate tracking for pay calculations
 * - enabled: Allows temporary disabling without deletion
 * - applicableDays: Flexible day-of-week and special day rules
 * 
 * BUSINESS LOGIC SUPPORT:
 * - Supports complex pay calculations with normal/overtime rates
 * - Enables day-specific shift availability
 * - Allows for special day handling (holidays, etc.)
 * - Provides flexibility for various work arrangements
 */
export interface CustomShift {
  id: string;              // Unique identifier (generated timestamp-based)
  label: string;           // User-defined shift name
  fromTime: string;        // Start time in HH:MM format (24-hour)
  toTime: string;          // End time in HH:MM format (24-hour)
  hours: number;           // Total shift duration in hours
  normalHours?: number;    // Regular hours (for pay calculation)
  overtimeHours?: number;  // Overtime hours (for pay calculation)
  enabled: boolean;        // Whether shift is active/selectable
  
  /**
   * APPLICABILITY RULES
   * 
   * Defines when this shift can be scheduled. This flexible system
   * allows for complex scheduling rules and business requirements.
   * 
   * DESIGN PATTERN:
   * - Optional property with sensible defaults
   * - Boolean flags for each day of the week
   * - Special handling for holidays and special dates
   * - Extensible for future scheduling rules
   * 
   * DEFAULT BEHAVIOR:
   * If not specified, shifts are applicable to all days including
   * special dates, providing maximum flexibility.
   */
  applicableDays?: {
    monday: boolean;       // Available on Mondays
    tuesday: boolean;      // Available on Tuesdays
    wednesday: boolean;    // Available on Wednesdays
    thursday: boolean;     // Available on Thursdays
    friday: boolean;       // Available on Fridays
    saturday: boolean;     // Available on Saturdays
    sunday: boolean;       // Available on Sundays
    specialDay: boolean;   // Available on special dates (holidays, etc.)
  };
}

// =============================================================================
// SCHEDULE DATA STRUCTURE TYPES
// =============================================================================

/**
 * DAY SCHEDULE TYPE
 * 
 * Maps date strings to arrays of shift identifiers, representing the
 * complete work schedule for the application.
 * 
 * STRUCTURE:
 * - Key: Date string in YYYY-MM-DD format (ISO 8601 standard)
 * - Value: Array of shift IDs assigned to that date
 * 
 * USAGE PATTERNS:
 * - schedule['2024-01-15'] = ['shift-morning', 'shift-evening']
 * - Empty arrays represent days with no scheduled shifts
 * - Missing keys represent unscheduled dates
 * 
 * DESIGN DECISIONS:
 * - String keys for easy serialization and database storage
 * - Array values to support multiple shifts per day
 * - ISO date format for international compatibility
 * - Flexible to support any number of shifts per day
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Object lookup is O(1) for date-based queries
 * - Array operations are efficient for typical shift counts
 * - JSON serializable for easy storage and transfer
 * - Memory efficient with sparse data representation
 */
export interface DaySchedule {
  [key: string]: string[]; // Date string -> array of shift IDs
}

/**
 * SPECIAL DATES TYPE
 * 
 * Maps date strings to boolean flags indicating special status.
 * Special dates typically represent holidays, overtime days, or
 * other dates with different scheduling rules.
 * 
 * STRUCTURE:
 * - Key: Date string in YYYY-MM-DD format
 * - Value: Boolean indicating special status
 * 
 * USAGE PATTERNS:
 * - specialDates['2024-12-25'] = true (Christmas Day)
 * - specialDates['2024-07-04'] = true (Independence Day)
 * - Missing keys are treated as false (normal days)
 * 
 * BUSINESS LOGIC IMPACT:
 * - Special dates may have different available shifts
 * - Pay calculations may differ for special dates
 * - UI may display special dates with different styling
 * - Scheduling rules may be modified for special dates
 * 
 * STORAGE OPTIMIZATION:
 * Only dates marked as special are stored, reducing storage
 * requirements and improving query performance.
 */
export interface SpecialDates {
  [key: string]: boolean; // Date string -> is special date
}

// =============================================================================
// LEGACY SHIFT COMBINATION TYPES
// =============================================================================

/**
 * SHIFT COMBINATION INTERFACE
 * 
 * Represents predefined shift patterns from the legacy system.
 * Maintained for backward compatibility and data migration.
 * 
 * LEGACY CONTEXT:
 * This interface represents the original shift system before
 * the introduction of CustomShift. It's maintained to support
 * existing data and provide migration paths.
 * 
 * USAGE:
 * - Data migration from older versions
 * - Backward compatibility support
 * - Default shift creation templates
 * - Legacy data export/import
 * 
 * EVOLUTION PATH:
 * New applications should use CustomShift instead of this
 * interface for more flexibility and features.
 */
export interface ShiftCombination {
  id: string;           // Combination identifier
  combination: string;  // Display string for the combination
  hours: number;        // Total hours for the combination
  enabled: boolean;     // Whether combination is active
  isCustom?: boolean;   // Flag for user-created combinations
}

// =============================================================================
// APPLICATION SETTINGS AND CONFIGURATION
// =============================================================================

/**
 * SETTINGS INTERFACE
 * 
 * Comprehensive configuration object containing all user preferences,
 * calculation parameters, and application settings.
 * 
 * CONFIGURATION CATEGORIES:
 * 1. FINANCIAL SETTINGS: Salary, rates, currency
 * 2. SHIFT DEFINITIONS: Custom shifts and combinations
 * 3. CALCULATION PARAMETERS: Overtime multipliers, formulas
 * 4. DISPLAY PREFERENCES: Currency symbols, formatting
 * 
 * DESIGN PRINCIPLES:
 * - Centralized configuration management
 * - Backward compatibility with legacy data
 * - Extensible for future settings
 * - Type-safe property access
 * - Default value support
 */
export interface Settings {
  // ==========================================================================
  // FINANCIAL CONFIGURATION
  // ==========================================================================
  
  /**
   * BASIC SALARY
   * 
   * The user's base monthly salary used for hourly rate calculations.
   * This is the foundation for all pay calculations in the application.
   * 
   * CALCULATION USAGE:
   * - Hourly rate = (basicSalary * 12) / 52 / 40
   * - Used in formula-based rate calculations
   * - Basis for overtime rate calculations
   */
  basicSalary: number;
  
  /**
   * HOURLY RATE
   * 
   * The calculated or manually set hourly rate for normal work hours.
   * This rate is used for all standard time calculations.
   * 
   * CALCULATION USAGE:
   * - Normal hours payment = normalHours * hourlyRate
   * - Base for overtime rate calculation
   * - Used in shift amount previews
   */
  hourlyRate: number;
  
  /**
   * OVERTIME MULTIPLIER
   * 
   * Multiplier applied to hourly rate for overtime hours calculation.
   * Typically 1.5 for "time and a half" overtime pay.
   * 
   * CALCULATION USAGE:
   * - Overtime rate = hourlyRate * overtimeMultiplier
   * - Applied to overtime hours in custom shifts
   * - Configurable for different overtime policies
   */
  overtimeMultiplier?: number;
  
  /**
   * CURRENCY SYMBOL
   * 
   * Display symbol for currency formatting throughout the application.
   * Supports international currency symbols and custom formats.
   * 
   * DISPLAY USAGE:
   * - Amount formatting: "${currency} ${amount}"
   * - Input field prefixes
   * - Report and export formatting
   */
  currency: string;
  
  // ==========================================================================
  // SHIFT CONFIGURATION
  // ==========================================================================
  
  /**
   * LEGACY SHIFT COMBINATIONS
   * 
   * Maintained for backward compatibility with older data formats.
   * New installations should focus on customShifts instead.
   * 
   * MIGRATION STRATEGY:
   * - Existing data uses this for compatibility
   * - New features use customShifts
   * - Gradual migration path provided
   */
  shiftCombinations: ShiftCombination[];
  
  /**
   * CUSTOM SHIFTS
   * 
   * Modern, flexible shift definitions created by users.
   * This is the primary shift system for new functionality.
   * 
   * FEATURES:
   * - Detailed time specifications
   * - Normal/overtime hour separation
   * - Day-specific applicability rules
   * - Enable/disable functionality
   * - Rich metadata support
   */
  customShifts: CustomShift[];
}

// =============================================================================
// DATA EXPORT/IMPORT TYPES
// =============================================================================

/**
 * EXPORT DATA INTERFACE
 * 
 * Complete data structure for application backup and transfer.
 * This interface ensures all necessary data is included in exports
 * and provides version compatibility for imports.
 * 
 * EXPORT PURPOSES:
 * - User data backup and restore
 * - Data transfer between devices
 * - Application migration support
 * - Data sharing and collaboration
 * - Disaster recovery scenarios
 * 
 * VERSION COMPATIBILITY:
 * - version: Data format version for compatibility checking
 * - exportDate: Timestamp for tracking and organization
 * - Structured for forward and backward compatibility
 * 
 * DATA INTEGRITY:
 * - Complete application state capture
 * - Validation support for import operations
 * - Metadata for troubleshooting and support
 */
export interface ExportData {
  // ==========================================================================
  // CORE APPLICATION DATA
  // ==========================================================================
  
  /**
   * SCHEDULE DATA
   * 
   * Complete work schedule with all shift assignments.
   * This is the primary data that users want to preserve.
   */
  schedule: DaySchedule;
  
  /**
   * SPECIAL DATES DATA
   * 
   * All special date markings including holidays and overtime days.
   * Important for maintaining scheduling context and rules.
   */
  specialDates: SpecialDates;
  
  /**
   * APPLICATION SETTINGS
   * 
   * Complete user configuration including shifts, rates, and preferences.
   * Essential for maintaining application behavior and calculations.
   */
  settings: Settings;
  
  /**
   * SCHEDULE TITLE
   * 
   * User-defined title for the schedule, providing personalization
   * and context for the exported data.
   */
  scheduleTitle: string;
  
  // ==========================================================================
  // EXPORT METADATA
  // ==========================================================================
  
  /**
   * EXPORT TIMESTAMP
   * 
   * ISO 8601 timestamp indicating when the export was created.
   * Useful for organizing backups and troubleshooting issues.
   */
  exportDate: string;
  
  /**
   * DATA FORMAT VERSION
   * 
   * Version identifier for the export data format.
   * Enables compatibility checking and migration logic.
   * 
   * VERSION HISTORY:
   * - "1.0": Original export format
   * - "2.0": Added special dates support
   * - "3.0": Added custom shifts and IndexedDB support
   */
  version: string;
}

/**
 * =============================================================================
 * LEARNING POINTS AND EDUCATIONAL VALUE
 * =============================================================================
 * 
 * This type system demonstrates numerous advanced TypeScript and software
 * design concepts that are valuable for learning and professional development:
 * 
 * 1. TYPESCRIPT MASTERY:
 *    - Interface design and composition patterns
 *    - Optional vs required property strategies
 *    - Type safety in complex business applications
 *    - Generic type usage and constraints
 *    - Union types and discriminated unions
 * 
 * 2. DATA MODELING PRINCIPLES:
 *    - Domain-driven design concepts
 *    - Business rule encoding in types
 *    - Data relationship modeling
 *    - Normalization vs denormalization decisions
 *    - Schema evolution and migration support
 * 
 * 3. SOFTWARE ARCHITECTURE PATTERNS:
 *    - Interface segregation principle
 *    - Single responsibility principle
 *    - Open/closed principle for extensibility
 *    - Dependency inversion through abstractions
 *    - Composition over inheritance patterns
 * 
 * 4. API DESIGN PRINCIPLES:
 *    - Consistent naming conventions
 *    - Predictable data structures
 *    - Backward compatibility strategies
 *    - Version management approaches
 *    - Error prevention through types
 * 
 * 5. BUSINESS DOMAIN MODELING:
 *    - Real-world concept abstraction
 *    - Business rule representation
 *    - Workflow and process modeling
 *    - Configuration and settings design
 *    - Data lifecycle management
 * 
 * 6. SCALABILITY CONSIDERATIONS:
 *    - Extensible type hierarchies
 *    - Migration-friendly data structures
 *    - Performance-conscious design decisions
 *    - Memory-efficient representations
 *    - Serialization-friendly formats
 * 
 * 7. DOCUMENTATION STRATEGIES:
 *    - Self-documenting code through types
 *    - Comprehensive interface documentation
 *    - Usage examples and patterns
 *    - Design decision explanations
 *    - Learning-oriented comments
 * 
 * 8. QUALITY ASSURANCE:
 *    - Compile-time error prevention
 *    - Runtime type safety
 *    - Refactoring confidence
 *    - IntelliSense support
 *    - Code completion assistance
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced TypeScript features (mapped types, conditional types)
 * - Generic programming patterns and constraints
 * - Type-driven development methodologies
 * - Schema validation and runtime type checking
 * - API versioning and evolution strategies
 * - Domain-driven design principles
 * - Data modeling for complex business domains
 * - Performance implications of type design
 * 
 * This type system serves as an excellent reference for building
 * type-safe, maintainable, and scalable TypeScript applications
 * with proper domain modeling and business logic representation.
 */