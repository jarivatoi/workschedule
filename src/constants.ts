/**
 * FILE: src/constants.ts
 * 
 * =============================================================================
 * APPLICATION CONSTANTS AND CONFIGURATION VALUES
 * =============================================================================
 * 
 * OVERVIEW:
 * This file contains all constant values, default configurations, and static
 * data used throughout the Work Schedule application. Centralizing constants
 * here makes the application easier to maintain, configure, and customize.
 * 
 * MAIN CATEGORIES:
 * 1. Predefined shift definitions (SHIFTS)
 * 2. Default shift combinations for backward compatibility
 * 3. Currency options for international support
 * 4. Application-wide configuration values
 * 
 * DESIGN PRINCIPLES:
 * - Single source of truth for configuration values
 * - Easy customization without code changes
 * - Type-safe constant definitions
 * - Backward compatibility preservation
 * - Internationalization support
 * 
 * USAGE PATTERNS:
 * - Import specific constants where needed
 * - Use as default values in components
 * - Reference in validation logic
 * - Provide fallback configurations
 * 
 * =============================================================================
 * PREDEFINED SHIFT DEFINITIONS
 * =============================================================================
 */

import { Shift, ShiftCombination } from './types';

/**
 * PREDEFINED SHIFTS ARRAY
 * 
 * PURPOSE:
 * Defines the built-in shift types that come with the application.
 * These are legacy shifts maintained for backward compatibility and
 * as examples for users creating custom shifts.
 * 
 * SHIFT CATEGORIES:
 * 1. Regular shifts (12-10) - Standard work periods
 * 2. Special shifts (9-4) - Holiday/overtime periods  
 * 3. Evening shifts (4-10) - Late day coverage
 * 4. Night shifts (N) - Overnight coverage
 * 
 * COLOR CODING SYSTEM:
 * - Gray: Regular/standard shifts
 * - Red: Special/holiday shifts (higher pay)
 * - Blue: Evening shifts
 * - Green: Night shifts (premium pay)
 * 
 * VISUAL CONSISTENCY:
 * Each shift has two color properties:
 * - color: Full Tailwind classes for badges/buttons
 * - displayColor: Text color for consistent theming
 * 
 * USAGE IN APPLICATION:
 * - Calendar component uses for shift display
 * - ShiftModal references for shift selection
 * - Settings panel shows as examples
 * - Migration logic converts to custom shifts
 */
export const SHIFTS: Shift[] = [
  { 
    /**
     * SATURDAY REGULAR SHIFT (12-10)
     * 
     * CHARACTERISTICS:
     * - Standard weekend shift
     * - 10-hour duration (12:00 PM to 10:00 PM)
     * - Regular pay rate
     * - Gray color scheme for neutral appearance
     * 
     * BUSINESS RULES:
     * - Cannot be combined with 9-4 shifts (conflict)
     * - Cannot be combined with 4-10 shifts (overlap)
     * - Available on most days except special holidays
     */
    id: '12-10', 
    label: 'Saturday Regular', 
    time: '12-10', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    displayColor: 'text-gray-800'
  },
  { 
    /**
     * SUNDAY/HOLIDAY/SPECIAL SHIFT (9-4)
     * 
     * CHARACTERISTICS:
     * - Premium pay shift for special days
     * - 7-hour duration (9:00 AM to 4:00 PM)
     * - Higher pay rate due to special day status
     * - Red color scheme to indicate premium/special status
     * 
     * BUSINESS RULES:
     * - Only available on Sundays or special marked days
     * - Cannot be combined with 12-10 shifts (conflict)
     * - Automatically gets special day pay multiplier
     * - Preferred shift for holiday coverage
     */
    id: '9-4', 
    label: 'Sunday/Public Holiday/Special', 
    time: '9-4', 
    color: 'bg-red-100 text-red-800 border-red-200',
    displayColor: 'text-red-600'
  },
  { 
    /**
     * EVENING SHIFT (4-10)
     * 
     * CHARACTERISTICS:
     * - Late day coverage shift
     * - 6-hour duration (4:00 PM to 10:00 PM)
     * - Standard pay rate
     * - Blue color scheme for evening identification
     * 
     * BUSINESS RULES:
     * - Cannot be combined with 12-10 shifts (time overlap)
     * - Can be combined with morning shifts for split coverage
     * - Popular for part-time or supplemental hours
     */
    id: '4-10', 
    label: 'Evening Shift', 
    time: '4-10', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    displayColor: 'text-blue-600'
  },
  { 
    /**
     * NIGHT DUTY SHIFT (N)
     * 
     * CHARACTERISTICS:
     * - Overnight coverage shift
     * - 11-hour duration (typically 10:00 PM to 9:00 AM)
     * - Premium pay rate for night work
     * - Green color scheme to indicate night/premium status
     * 
     * BUSINESS RULES:
     * - Highest pay rate due to night differential
     * - Can be combined with other shifts for extended coverage
     * - May include sleep time or break allowances
     * - Special overtime calculations may apply
     */
    id: 'N', 
    label: 'Night Duty', 
    time: 'N', 
    color: 'bg-green-100 text-green-800 border-green-200',
    displayColor: 'text-green-600'
  }
];

/**
 * =============================================================================
 * DEFAULT SHIFT COMBINATIONS - LEGACY COMPATIBILITY
 * =============================================================================
 */

/**
 * DEFAULT SHIFT COMBINATIONS ARRAY
 * 
 * PURPOSE:
 * Provides backward compatibility with older versions of the application
 * that used the ShiftCombination system instead of CustomShift system.
 * These are automatically converted to CustomShift format on app startup.
 * 
 * MIGRATION STRATEGY:
 * 1. Check if user has existing custom shifts
 * 2. If not, convert these defaults to CustomShift format
 * 3. Preserve user's existing data if already migrated
 * 4. Maintain these constants for new installations
 * 
 * HOUR CALCULATIONS:
 * - 9-4: 7 hours (9 AM to 4 PM with 1-hour break)
 * - 12-10: 9.5 hours (12 PM to 10 PM with 0.5-hour break)
 * - 4-10: 5.5 hours (4 PM to 10 PM with 0.5-hour break)
 * - N: 11 hours (night shift with sleep allowance)
 * 
 * DEPRECATION TIMELINE:
 * - Version 3.0+: Legacy support maintained
 * - Future versions: May remove after full migration
 * - New features: Use CustomShift exclusively
 */
export const DEFAULT_SHIFT_COMBINATIONS: ShiftCombination[] = [
  { 
    /**
     * SUNDAY/HOLIDAY SHIFT COMBINATION
     * 
     * LEGACY MAPPING:
     * - Maps to 9-4 predefined shift
     * - 6.5 hours total (reduced from 7 for break time)
     * - Enabled by default for immediate use
     * - Converted to CustomShift with special day availability
     */
    id: '9-4', 
    combination: '9-4', 
    hours: 6.5, 
    enabled: true 
  },
  { 
    /**
     * SATURDAY REGULAR SHIFT COMBINATION
     * 
     * LEGACY MAPPING:
     * - Maps to 12-10 predefined shift
     * - 9.5 hours total (10 hours minus break time)
     * - Enabled by default for immediate use
     * - Converted to CustomShift with weekend availability
     */
    id: '12-10', 
    combination: '12-10', 
    hours: 9.5, 
    enabled: true 
  },
  { 
    /**
     * EVENING SHIFT COMBINATION
     * 
     * LEGACY MAPPING:
     * - Maps to 4-10 predefined shift
     * - 5.5 hours total (6 hours minus break time)
     * - Enabled by default for immediate use
     * - Converted to CustomShift with evening availability
     */
    id: '4-10', 
    combination: '4-10', 
    hours: 5.5, 
    enabled: true 
  },
  { 
    /**
     * NIGHT DUTY SHIFT COMBINATION
     * 
     * LEGACY MAPPING:
     * - Maps to N predefined shift
     * - 11 hours total (includes sleep/break allowances)
     * - Enabled by default for immediate use
     * - Converted to CustomShift with night differential
     */
    id: 'N', 
    combination: 'N', 
    hours: 11, 
    enabled: true 
  }
];

/**
 * =============================================================================
 * CURRENCY OPTIONS - INTERNATIONAL SUPPORT
 * =============================================================================
 */

/**
 * SUPPORTED CURRENCY OPTIONS ARRAY
 * 
 * PURPOSE:
 * Provides a comprehensive list of supported currencies for international
 * users. Each currency includes the symbol, code, and full name for
 * proper display and user selection.
 * 
 * SELECTION CRITERIA:
 * - Major world currencies
 * - Common business currencies
 * - Regional currencies for target markets
 * - Currencies with clear, recognizable symbols
 * 
 * USAGE IN APPLICATION:
 * - Settings panel currency selector
 * - Amount formatting throughout the app
 * - Export data currency identification
 * - User preference persistence
 * 
 * FORMATTING CONSIDERATIONS:
 * - Symbol placement varies by currency (before/after amount)
 * - Decimal precision varies (0, 2, or 3 decimal places)
 * - Thousand separators vary by locale
 * - Right-to-left language support for some currencies
 * 
 * EXTENSIBILITY:
 * - Easy to add new currencies by extending this array
 * - Each currency object is self-contained
 * - No code changes required for new currency support
 */
export const CURRENCY_OPTIONS = [
  { 
    /**
     * MAURITIAN RUPEE (PRIMARY CURRENCY)
     * 
     * CHARACTERISTICS:
     * - Primary currency for the application's target market
     * - Symbol: Rs (placed before amount)
     * - Standard decimal precision: 2 places
     * - Thousand separator: comma
     * 
     * USAGE CONTEXT:
     * - Default currency for new installations
     * - Most common currency in target user base
     * - Optimized formatting and display
     */
    code: 'Rs', 
    symbol: 'Rs', 
    name: 'Rupees' 
  },
  { 
    /**
     * US DOLLAR (INTERNATIONAL STANDARD)
     * 
     * CHARACTERISTICS:
     * - Most widely recognized international currency
     * - Symbol: $ (placed before amount)
     * - Standard decimal precision: 2 places
     * - Thousand separator: comma
     * 
     * USAGE CONTEXT:
     * - International users and businesses
     * - Multinational company payroll
     * - USD-based contracts and agreements
     */
    code: 'USD', 
    symbol: '$', 
    name: 'US Dollar' 
  },
  { 
    /**
     * EURO (EUROPEAN UNION)
     * 
     * CHARACTERISTICS:
     * - Major European currency
     * - Symbol: € (placement varies by locale)
     * - Standard decimal precision: 2 places
     * - Thousand separator: varies by country
     * 
     * USAGE CONTEXT:
     * - European users and businesses
     * - EU-based employment
     * - Euro-denominated contracts
     */
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro' 
  },
  { 
    /**
     * BRITISH POUND (UNITED KINGDOM)
     * 
     * CHARACTERISTICS:
     * - UK and Commonwealth currency
     * - Symbol: £ (placed before amount)
     * - Standard decimal precision: 2 places
     * - Thousand separator: comma
     * 
     * USAGE CONTEXT:
     * - UK users and businesses
     * - Commonwealth country users
     * - GBP-based employment contracts
     */
    code: 'GBP', 
    symbol: '£', 
    name: 'British Pound' 
  },
  { 
    /**
     * JAPANESE YEN (ASIA-PACIFIC)
     * 
     * CHARACTERISTICS:
     * - Major Asian currency
     * - Symbol: ¥ (placed before amount)
     * - No decimal places (whole numbers only)
     * - Thousand separator: comma
     * 
     * USAGE CONTEXT:
     * - Japanese users and businesses
     * - Asia-Pacific region employment
     * - Yen-based salary calculations
     */
    code: 'JPY', 
    symbol: '¥', 
    name: 'Japanese Yen' 
  },
  { 
    /**
     * CANADIAN DOLLAR (NORTH AMERICA)
     * 
     * CHARACTERISTICS:
     * - North American currency
     * - Symbol: C$ (to distinguish from USD)
     * - Standard decimal precision: 2 places
     * - Thousand separator: comma
     * 
     * USAGE CONTEXT:
     * - Canadian users and businesses
     * - North American employment
     * - CAD-based payroll systems
     */
    code: 'CAD', 
    symbol: 'C$', 
    name: 'Canadian Dollar' 
  },
  { 
    /**
     * AUSTRALIAN DOLLAR (OCEANIA)
     * 
     * CHARACTERISTICS:
     * - Oceania region currency
     * - Symbol: A$ (to distinguish from other dollars)
     * - Standard decimal precision: 2 places
     * - Thousand separator: comma
     * 
     * USAGE CONTEXT:
     * - Australian and New Zealand users
     * - Oceania region employment
     * - AUD-based salary systems
     */
    code: 'AUD', 
    symbol: 'A$', 
    name: 'Australian Dollar' 
  },
  { 
    /**
     * SWISS FRANC (SWITZERLAND)
     * 
     * CHARACTERISTICS:
     * - Swiss and Liechtenstein currency
     * - Symbol: CHF (currency code used as symbol)
     * - Standard decimal precision: 2 places
     * - Thousand separator: apostrophe or space
     * 
     * USAGE CONTEXT:
     * - Swiss users and businesses
     * - High-value employment contracts
     * - Banking and finance sector
     */
    code: 'CHF', 
    symbol: 'CHF', 
    name: 'Swiss Franc' 
  },
  { 
    /**
     * CHINESE YUAN (CHINA)
     * 
     * CHARACTERISTICS:
     * - Major Asian currency
     * - Symbol: ¥ (same as JPY but different currency)
     * - Standard decimal precision: 2 places
     * - Thousand separator: comma
     * 
     * USAGE CONTEXT:
     * - Chinese users and businesses
     * - Asia-Pacific region employment
     * - Yuan-based salary calculations
     */
    code: 'CNY', 
    symbol: '¥', 
    name: 'Chinese Yuan' 
  },
  { 
    /**
     * INDIAN RUPEE (INDIA)
     * 
     * CHARACTERISTICS:
     * - Major South Asian currency
     * - Symbol: ₹ (distinctive rupee symbol)
     * - Standard decimal precision: 2 places
     * - Thousand separator: comma (Indian numbering system)
     * 
     * USAGE CONTEXT:
     * - Indian users and businesses
     * - South Asian region employment
     * - INR-based payroll systems
     * - Large user base in target market
     */
    code: 'INR', 
    symbol: '₹', 
    name: 'Indian Rupee' 
  }
];

/**
 * =============================================================================
 * APPLICATION CONFIGURATION CONSTANTS
 * =============================================================================
 */

/**
 * DEFAULT APPLICATION SETTINGS
 * 
 * PURPOSE:
 * Provides fallback values when user settings are not available or
 * during initial application setup. These ensure the app functions
 * properly even without user configuration.
 */

/**
 * DEFAULT BASIC SALARY
 * 
 * Used as initial value for new installations
 * Based on average salary in target market
 * Can be customized by users in settings
 */
export const DEFAULT_BASIC_SALARY = 35000;

/**
 * DEFAULT HOURLY RATE CALCULATION
 * 
 * Formula: (Annual Salary × 12 months) ÷ 52 weeks ÷ 40 hours
 * Standard calculation for full-time employment
 * Automatically updated when basic salary changes
 */
export const DEFAULT_HOURLY_RATE = (DEFAULT_BASIC_SALARY * 12) / 52 / 40;

/**
 * DEFAULT OVERTIME MULTIPLIER
 * 
 * Standard "time and a half" overtime rate
 * Common in most employment jurisdictions
 * Can be customized for different overtime policies
 */
export const DEFAULT_OVERTIME_MULTIPLIER = 1.5;

/**
 * DEFAULT CURRENCY SYMBOL
 * 
 * Primary currency for target market
 * Matches most common user base
 * Easy to change in settings
 */
export const DEFAULT_CURRENCY = 'Rs';

/**
 * =============================================================================
 * VALIDATION CONSTANTS
 * =============================================================================
 */

/**
 * SHIFT VALIDATION LIMITS
 * 
 * PURPOSE:
 * Defines reasonable limits for shift duration and scheduling
 * to prevent data entry errors and ensure realistic schedules.
 */

/**
 * Maximum hours per shift
 * Prevents unrealistic shift durations
 * Complies with labor law limits
 */
export const MAX_SHIFT_HOURS = 24;

/**
 * Minimum hours per shift
 * Ensures meaningful work periods
 * Prevents accidental zero-hour shifts
 */
export const MIN_SHIFT_HOURS = 0.25; // 15 minutes minimum

/**
 * Maximum shifts per day
 * Prevents scheduling conflicts
 * Reasonable limit for split shifts
 */
export const MAX_SHIFTS_PER_DAY = 3;

/**
 * =============================================================================
 * UI CONFIGURATION CONSTANTS
 * =============================================================================
 */

/**
 * ANIMATION TIMING CONSTANTS
 * 
 * PURPOSE:
 * Standardizes animation durations across the application
 * for consistent user experience and performance.
 */

/**
 * Standard transition duration for UI elements
 * Balances responsiveness with smooth animation
 */
export const ANIMATION_DURATION_FAST = 200; // milliseconds

/**
 * Medium transition duration for complex animations
 * Used for modal transitions and page changes
 */
export const ANIMATION_DURATION_MEDIUM = 300; // milliseconds

/**
 * Slow transition duration for emphasis
 * Used for important state changes
 */
export const ANIMATION_DURATION_SLOW = 500; // milliseconds

/**
 * =============================================================================
 * DATA STORAGE CONSTANTS
 * =============================================================================
 */

/**
 * INDEXEDDB CONFIGURATION
 * 
 * PURPOSE:
 * Defines database names, versions, and storage limits
 * for consistent data persistence across the application.
 */

/**
 * IndexedDB database name
 * Unique identifier for the application's database
 */
export const DB_NAME = 'WorkScheduleDB';

/**
 * Current database version
 * Incremented when schema changes are needed
 */
export const DB_VERSION = 1;

/**
 * Export file version
 * Used for import/export compatibility checking
 */
export const EXPORT_VERSION = '3.0';

/**
 * =============================================================================
 * USAGE EXAMPLES AND BEST PRACTICES
 * =============================================================================
 * 
 * IMPORTING CONSTANTS:
 * 
 * // Import specific constants
 * import { SHIFTS, DEFAULT_CURRENCY } from './constants';
 * 
 * // Import all constants
 * import * as Constants from './constants';
 * 
 * USING IN COMPONENTS:
 * 
 * // Default values
 * const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
 * 
 * // Validation
 * if (hours > MAX_SHIFT_HOURS) {
 *   setError('Shift cannot exceed maximum hours');
 * }
 * 
 * // Configuration
 * const animationDuration = ANIMATION_DURATION_MEDIUM;
 * 
 * CUSTOMIZATION:
 * 
 * // Add new currency
 * CURRENCY_OPTIONS.push({
 *   code: 'BTC',
 *   symbol: '₿',
 *   name: 'Bitcoin'
 * });
 * 
 * // Modify defaults for different markets
 * const REGIONAL_BASIC_SALARY = 50000; // Higher cost of living area
 * 
 * =============================================================================
 * MAINTENANCE NOTES
 * =============================================================================
 * 
 * ADDING NEW CURRENCIES:
 * 1. Add to CURRENCY_OPTIONS array
 * 2. Test formatting in different locales
 * 3. Update currency formatting utilities
 * 4. Consider decimal precision requirements
 * 
 * MODIFYING SHIFT DEFINITIONS:
 * 1. Update SHIFTS array carefully (affects existing data)
 * 2. Consider migration path for existing users
 * 3. Update DEFAULT_SHIFT_COMBINATIONS if needed
 * 4. Test backward compatibility
 * 
 * CHANGING VALIDATION LIMITS:
 * 1. Consider impact on existing data
 * 2. Update validation logic in components
 * 3. Test edge cases thoroughly
 * 4. Document changes for users
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Constants are loaded once at startup
 * - Large arrays may impact initial load time
 * - Consider lazy loading for extensive data
 * - Memory usage is minimal for current size
 */