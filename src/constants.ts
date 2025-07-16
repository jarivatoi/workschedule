/**
 * FILE: src/constants.ts
 * 
 * =============================================================================
 * OVERVIEW AND PURPOSE
 * =============================================================================
 * 
 * This file contains all application-wide constants, default values, and
 * configuration data for the Work Schedule application. It serves as the
 * single source of truth for static data, ensuring consistency across
 * components and providing easy maintenance of application defaults.
 * 
 * MAIN FUNCTIONALITY:
 * - Default shift definitions and configurations
 * - Currency options and formatting data
 * - Application-wide styling and color schemes
 * - Business logic constants and rules
 * - Configuration defaults for new installations
 * - Internationalization support data
 * 
 * DEPENDENCIES AND RELATIONSHIPS:
 * - Imported by: App.tsx, SettingsPanel.tsx, IndexedDB utilities
 * - Used by: All components requiring default values
 * - Supports: Data migration and backward compatibility
 * - Provides: Type-safe constant definitions
 * 
 * DESIGN PATTERNS DEMONSTRATED:
 * - Centralized configuration management
 * - Immutable data structures
 * - Type-safe constant definitions
 * - Separation of concerns (data vs logic)
 * - Single source of truth principle
 * 
 * LEARNING OBJECTIVES:
 * This file demonstrates important concepts including:
 * 1. Application configuration management
 * 2. Default value strategies and patterns
 * 3. Data structure design for UI components
 * 4. Internationalization preparation
 * 5. Business rule centralization
 * 6. Type safety in configuration data
 * 7. Maintainable constant organization
 * 8. Color scheme and theming systems
 * 
 * =============================================================================
 * CONFIGURATION MANAGEMENT PRINCIPLES
 * =============================================================================
 * 
 * CENTRALIZATION BENEFITS:
 * - Single location for all default values
 * - Easy maintenance and updates
 * - Consistent behavior across components
 * - Reduced code duplication
 * - Simplified testing and validation
 * 
 * IMMUTABILITY STRATEGY:
 * - Constants are read-only after definition
 * - Prevents accidental modification
 * - Enables safe sharing across components
 * - Supports functional programming patterns
 * - Improves debugging and predictability
 * 
 * TYPE SAFETY APPROACH:
 * - All constants use proper TypeScript types
 * - Interface compliance is enforced
 * - Compile-time validation of data structures
 * - IntelliSense support for developers
 * - Prevention of runtime type errors
 * 
 * =============================================================================
 * BUSINESS DOMAIN MODELING
 * =============================================================================
 * 
 * SHIFT SYSTEM DESIGN:
 * The default shifts represent common work patterns in many industries:
 * - Regular shifts (12-10): Standard full-day work periods
 * - Special shifts (9-4): Holiday or reduced hour periods
 * - Evening shifts (4-10): Second shift or evening coverage
 * - Night duty (N): Overnight or extended coverage
 * 
 * COLOR CODING STRATEGY:
 * Each shift type has distinct colors for visual identification:
 * - Gray: Regular/standard shifts (neutral, professional)
 * - Red: Special/holiday shifts (attention-grabbing, important)
 * - Blue: Evening shifts (calm, professional)
 * - Green: Night duty (distinctive, easy to spot)
 * 
 * CURRENCY SUPPORT:
 * International currency support with proper symbols and names:
 * - Primary: Mauritian Rupees (Rs) for the target market
 * - International: USD, EUR, GBP for global users
 * - Regional: Various currencies for localization
 * - Extensible: Easy to add new currencies
 */

import { Shift, ShiftCombination } from './types';

// =============================================================================
// DEFAULT SHIFT DEFINITIONS
// =============================================================================

/**
 * DEFAULT SHIFTS ARRAY
 * 
 * Defines the standard shift types available in the application.
 * These represent common work patterns and provide a foundation
 * for schedule management.
 * 
 * SHIFT DESIGN PRINCIPLES:
 * - Clear, descriptive labels for user understanding
 * - Consistent time format for easy parsing
 * - Distinct color schemes for visual differentiation
 * - Professional appearance suitable for workplace use
 * 
 * COLOR SCHEME RATIONALE:
 * - Uses Tailwind CSS utility classes for consistency
 * - Follows accessibility guidelines for contrast
 * - Provides both background and text color variants
 * - Maintains visual hierarchy and importance
 * 
 * BUSINESS LOGIC INTEGRATION:
 * - IDs match legacy system for backward compatibility
 * - Time strings are parseable for calculations
 * - Labels are user-friendly and professional
 * - Colors support theming and customization
 */
export const SHIFTS: Shift[] = [
  { 
    id: '12-10',                                    // Unique identifier for database storage
    label: 'Saturday Regular',                     // User-friendly display name
    time: '12-10',                                 // Time range display string
    color: 'bg-gray-100 text-gray-800 border-gray-200',  // Tailwind CSS classes for styling
    displayColor: 'text-gray-800'                 // Text color for readability
  },
  { 
    id: '9-4', 
    label: 'Sunday/Public Holiday/Special',        // Descriptive label for special occasions
    time: '9-4', 
    color: 'bg-red-100 text-red-800 border-red-200',     // Red indicates special/important
    displayColor: 'text-red-600'
  },
  { 
    id: '4-10', 
    label: 'Evening Shift',                        // Clear identification of shift type
    time: '4-10', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',  // Blue for professional evening work
    displayColor: 'text-blue-600'
  },
  { 
    id: 'N', 
    label: 'Night Duty',                           // Concise but clear night shift label
    time: 'N',                                     // Abbreviated time for night duty
    color: 'bg-green-100 text-green-800 border-green-200', // Green for distinctive identification
    displayColor: 'text-green-600'
  }
];

// =============================================================================
// LEGACY SHIFT COMBINATIONS
// =============================================================================

/**
 * DEFAULT SHIFT COMBINATIONS
 * 
 * Legacy shift combination definitions maintained for backward compatibility
 * and data migration support. These represent the original shift system
 * before the introduction of custom shifts.
 * 
 * BACKWARD COMPATIBILITY:
 * - Maintains existing user data integrity
 * - Supports migration from older versions
 * - Provides fallback for missing custom shifts
 * - Ensures smooth application updates
 * 
 * HOUR CALCULATIONS:
 * - Based on standard work hour calculations
 * - Includes break time considerations
 * - Reflects real-world shift durations
 * - Supports payroll and time tracking
 * 
 * MIGRATION STRATEGY:
 * These combinations serve as templates for creating custom shifts
 * when users upgrade from older versions of the application.
 */
export const DEFAULT_SHIFT_COMBINATIONS: ShiftCombination[] = [
  { 
    id: '9-4',              // Matches shift ID for consistency
    combination: '9-4',     // Display string for user interface
    hours: 6.5,            // Total hours including break considerations
    enabled: true          // Active by default for immediate use
  },
  { 
    id: '12-10', 
    combination: '12-10', 
    hours: 9.5,            // Full day shift with break time
    enabled: true 
  },
  { 
    id: '4-10', 
    combination: '4-10', 
    hours: 5.5,            // Evening shift duration
    enabled: true 
  },
  { 
    id: 'N', 
    combination: 'N', 
    hours: 11,             // Extended night duty hours
    enabled: true 
  }
];

// =============================================================================
// CURRENCY CONFIGURATION
// =============================================================================

/**
 * CURRENCY OPTIONS ARRAY
 * 
 * Comprehensive list of supported currencies with proper symbols,
 * codes, and display names. Designed for international use and
 * easy localization.
 * 
 * INTERNATIONALIZATION SUPPORT:
 * - Standard currency codes (ISO 4217 where applicable)
 * - Proper currency symbols for display
 * - Full currency names for user selection
 * - Regional currency support
 * 
 * DESIGN CONSIDERATIONS:
 * - Primary currency (Rs) listed first for target market
 * - Major international currencies included
 * - Proper symbol representation for all currencies
 * - Extensible structure for adding new currencies
 * 
 * USAGE PATTERNS:
 * - Dropdown selection in settings
 * - Amount formatting throughout application
 * - Export/import data compatibility
 * - Multi-currency support preparation
 */
export const CURRENCY_OPTIONS = [
  { 
    code: 'Rs',           // Application-specific code for Mauritian Rupees
    symbol: 'Rs',         // Display symbol for amounts
    name: 'Rupees'        // User-friendly name for selection
  },
  { 
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar' 
  },
  { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro' 
  },
  { 
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound' 
  },
  { 
    code: 'JPY', 
    symbol: '¥', 
    name: 'Japanese Yen' 
  },
  { 
    code: 'CAD', 
    symbol: 'C$',         // Prefixed to distinguish from USD
    name: 'Canadian Dollar' 
  },
  { 
    code: 'AUD', 
    symbol: 'A$',         // Prefixed to distinguish from USD
    name: 'Australian Dollar' 
  },
  { 
    code: 'CHF', 
    symbol: 'CHF',        // Standard abbreviation used as symbol
    name: 'Swiss Franc' 
  },
  { 
    code: 'CNY', 
    symbol: '¥',          // Same symbol as JPY but different currency
    name: 'Chinese Yuan' 
  },
  { 
    code: 'INR', 
    symbol: '₹',          // Proper Indian Rupee symbol
    name: 'Indian Rupee' 
  }
];

/**
 * =============================================================================
 * USAGE EXAMPLES AND PATTERNS
 * =============================================================================
 * 
 * IMPORTING CONSTANTS:
 * ```typescript
 * import { SHIFTS, DEFAULT_SHIFT_COMBINATIONS, CURRENCY_OPTIONS } from '../constants';
 * ```
 * 
 * USING SHIFT DEFINITIONS:
 * ```typescript
 * // Find a specific shift
 * const eveningShift = SHIFTS.find(shift => shift.id === '4-10');
 * 
 * // Render shift options
 * {SHIFTS.map(shift => (
 *   <div key={shift.id} className={shift.color}>
 *     {shift.label} ({shift.time})
 *   </div>
 * ))}
 * ```
 * 
 * USING CURRENCY OPTIONS:
 * ```typescript
 * // Render currency selector
 * <select>
 *   {CURRENCY_OPTIONS.map(currency => (
 *     <option key={currency.code} value={currency.symbol}>
 *       {currency.symbol} - {currency.name}
 *     </option>
 *   ))}
 * </select>
 * 
 * // Format currency amount
 * const formatAmount = (amount: number, currency: string) => {
 *   return `${currency} ${amount.toLocaleString()}`;
 * };
 * ```
 * 
 * USING SHIFT COMBINATIONS:
 * ```typescript
 * // Initialize default settings
 * const defaultSettings = {
 *   shiftCombinations: DEFAULT_SHIFT_COMBINATIONS,
 *   // ... other settings
 * };
 * 
 * // Migration from legacy data
 * if (!settings.customShifts || settings.customShifts.length === 0) {
 *   settings.shiftCombinations = DEFAULT_SHIFT_COMBINATIONS;
 * }
 * ```
 * 
 * =============================================================================
 * MAINTENANCE AND EXTENSION GUIDELINES
 * =============================================================================
 * 
 * ADDING NEW SHIFTS:
 * 1. Add new shift object to SHIFTS array
 * 2. Ensure unique ID that doesn't conflict with existing shifts
 * 3. Choose appropriate colors following the existing scheme
 * 4. Add corresponding entry to DEFAULT_SHIFT_COMBINATIONS if needed
 * 5. Update any business logic that depends on specific shift IDs
 * 
 * ADDING NEW CURRENCIES:
 * 1. Add new currency object to CURRENCY_OPTIONS array
 * 2. Use standard currency codes where possible
 * 3. Ensure proper symbol representation
 * 4. Test formatting with various amount values
 * 5. Consider regional preferences for symbol placement
 * 
 * COLOR SCHEME UPDATES:
 * 1. Maintain accessibility contrast ratios
 * 2. Test colors in both light and dark themes
 * 3. Ensure consistency with overall application design
 * 4. Consider color-blind accessibility
 * 5. Update all related color variants (background, text, border)
 * 
 * BACKWARD COMPATIBILITY:
 * 1. Never remove existing shift IDs without migration plan
 * 2. Maintain DEFAULT_SHIFT_COMBINATIONS for legacy support
 * 3. Test data migration with various legacy data formats
 * 4. Provide clear upgrade paths for existing users
 * 5. Document any breaking changes thoroughly
 * 
 * =============================================================================
 * LEARNING POINTS AND EDUCATIONAL VALUE
 * =============================================================================
 * 
 * This constants file demonstrates several important software development
 * concepts and best practices:
 * 
 * 1. CONFIGURATION MANAGEMENT:
 *    - Centralized constant definitions
 *    - Single source of truth principle
 *    - Easy maintenance and updates
 *    - Consistent behavior across components
 * 
 * 2. DATA STRUCTURE DESIGN:
 *    - Well-organized object structures
 *    - Consistent property naming
 *    - Type-safe definitions
 *    - Extensible architectures
 * 
 * 3. INTERNATIONALIZATION PREPARATION:
 *    - Multi-currency support
 *    - Proper symbol handling
 *    - Extensible language support
 *    - Cultural considerations
 * 
 * 4. BACKWARD COMPATIBILITY:
 *    - Legacy system support
 *    - Migration-friendly structures
 *    - Gradual upgrade paths
 *    - Data integrity preservation
 * 
 * 5. USER EXPERIENCE DESIGN:
 *    - Intuitive color coding
 *    - Clear labeling systems
 *    - Professional appearance
 *    - Accessibility considerations
 * 
 * 6. MAINTAINABILITY PATTERNS:
 *    - Clear documentation
 *    - Logical organization
 *    - Extension guidelines
 *    - Testing considerations
 * 
 * 7. BUSINESS DOMAIN MODELING:
 *    - Real-world concept representation
 *    - Industry-standard practices
 *    - Flexible business rules
 *    - Scalable architectures
 * 
 * 8. CODE QUALITY PRACTICES:
 *    - Comprehensive commenting
 *    - Consistent formatting
 *    - Meaningful naming
 *    - Type safety enforcement
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced configuration management systems
 * - Dynamic configuration loading
 * - Environment-specific constants
 * - Configuration validation patterns
 * - Internationalization frameworks
 * - Theme and styling systems
 * - Data migration strategies
 * - Backward compatibility techniques
 * 
 * This file serves as an excellent example of how to organize and
 * maintain application constants in a professional, scalable manner
 * while supporting business requirements and user experience goals.
 */