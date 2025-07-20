/**
 * FILE: src/utils/dateUtils.ts
 * 
 * =============================================================================
 * DATE UTILITY FUNCTIONS FOR WORK SCHEDULE APPLICATION
 * =============================================================================
 * 
 * OVERVIEW:
 * This utility module provides comprehensive date manipulation and formatting
 * functions specifically designed for the Work Schedule application. It handles
 * date parsing, day-of-week calculations, formatting, and business logic
 * related to work scheduling and calendar operations.
 * 
 * PRIMARY FUNCTIONS:
 * 1. Day-of-week calculations for shift scheduling rules
 * 2. Date formatting for user interface display
 * 3. Date validation and parsing utilities
 * 4. Business logic helpers for work schedule management
 * 
 * DESIGN PRINCIPLES:
 * - Consistent date handling across the entire application
 * - Timezone-aware operations where necessary
 * - Error-resistant functions with graceful fallbacks
 * - Performance-optimized for frequent calendar operations
 * - Internationalization support for date formatting
 * 
 * DATE FORMAT STANDARDS:
 * - Internal storage: YYYY-MM-DD (ISO 8601 format)
 * - User display: Localized formats based on user preferences
 * - API communication: ISO 8601 format for consistency
 * - Database storage: YYYY-MM-DD string format
 * 
 * BUSINESS CONTEXT:
 * The Work Schedule application needs to handle various date-related
 * business rules such as:
 * - Sunday shifts have different pay rates
 * - Special dates (holidays) affect shift availability
 * - Week boundaries for payroll calculations
 * - Month boundaries for reporting and summaries
 * 
 * =============================================================================
 * DAY-OF-WEEK CALCULATION FUNCTIONS
 * =============================================================================
 */

/**
 * GET THE DAY OF THE WEEK FOR A GIVEN DATE STRING
 * 
 * PURPOSE:
 * Converts a date string in YYYY-MM-DD format to a numeric day-of-week
 * value. This is fundamental for implementing business rules that depend
 * on which day of the week a shift is scheduled.
 * 
 * BUSINESS APPLICATIONS:
 * - Determining if Sunday premium rates apply
 * - Checking shift availability rules by day
 * - Calculating weekly summaries and reports
 * - Implementing day-specific shift restrictions
 * - Payroll calculations that vary by day of week
 * 
 * DAY NUMBERING SYSTEM:
 * Uses JavaScript's standard Date.getDay() numbering:
 * - 0 = Sunday (important for premium pay calculations)
 * - 1 = Monday (start of business week)
 * - 2 = Tuesday
 * - 3 = Wednesday
 * - 4 = Thursday
 * - 5 = Friday (end of business week)
 * - 6 = Saturday (weekend rates may apply)
 * 
 * DATE PARSING BEHAVIOR:
 * The function creates a Date object from the input string. JavaScript's
 * Date constructor interprets YYYY-MM-DD as a local date, which is the
 * desired behavior for work scheduling (we want the day of week in the
 * user's local timezone, not UTC).
 * 
 * ERROR HANDLING:
 * - Invalid date strings return NaN from getDay()
 * - Calling code should validate the result
 * - Consider using isValidDate() helper for validation
 * 
 * @param dateString - Date string in YYYY-MM-DD format (ISO 8601 date only)
 * @returns Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * 
 * EXAMPLE USAGE:
 * getDayOfWeek('2024-01-15')  // Returns 1 (Monday)
 * getDayOfWeek('2024-01-14')  // Returns 0 (Sunday)
 * getDayOfWeek('2024-01-20')  // Returns 6 (Saturday)
 * 
 * INTEGRATION WITH BUSINESS LOGIC:
 * const dayOfWeek = getDayOfWeek(selectedDate);
 * if (dayOfWeek === 0) {
 *   // Apply Sunday premium rates
 *   applyPremiumRates();
 * }
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Date object creation is relatively fast
 * - getDay() is a native operation with O(1) complexity
 * - Consider caching results for frequently accessed dates
 * - Suitable for real-time calendar operations
 */
export function getDayOfWeek(dateString: string): number {
  // Create Date object from YYYY-MM-DD string
  // JavaScript interprets this as local date (not UTC)
  const date = new Date(dateString);
  
  // Return the day of week (0-6, where 0 = Sunday)
  return date.getDay();
}

/**
 * =============================================================================
 * SUNDAY DETECTION FUNCTION
 * =============================================================================
 */

/**
 * CHECK IF A GIVEN DATE IS A SUNDAY
 * 
 * PURPOSE:
 * Provides a convenient boolean check for Sunday dates, which is frequently
 * needed in the Work Schedule application due to special Sunday pay rates
 * and shift availability rules.
 * 
 * BUSINESS SIGNIFICANCE:
 * Sunday is particularly important in work scheduling because:
 * - Many jurisdictions have premium pay rates for Sunday work
 * - Religious and cultural considerations affect Sunday scheduling
 * - Weekend shift patterns often treat Sunday differently from Saturday
 * - Overtime calculations may have special Sunday rules
 * - Union contracts often specify Sunday premium rates
 * 
 * IMPLEMENTATION STRATEGY:
 * Uses the getDayOfWeek function internally for consistency and to
 * maintain a single source of truth for day-of-week calculations.
 * This ensures that any improvements or bug fixes to date parsing
 * automatically benefit all day-checking functions.
 * 
 * PERFORMANCE OPTIMIZATION:
 * While this function could be inlined, keeping it separate provides:
 * - Better code readability and intent expression
 * - Easier testing and validation
 * - Consistent behavior across the application
 * - Future extensibility for Sunday-specific logic
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns True if the date is a Sunday, false otherwise
 * 
 * EXAMPLE USAGE:
 * isSunday('2024-01-14')  // Returns true (Sunday)
 * isSunday('2024-01-15')  // Returns false (Monday)
 * isSunday('2024-01-21')  // Returns true (Sunday)
 * 
 * BUSINESS LOGIC INTEGRATION:
 * if (isSunday(shiftDate)) {
 *   hourlyRate = baseRate * sundayMultiplier;
 *   availableShifts = sundayShifts;
 * }
 * 
 * CONDITIONAL RENDERING:
 * const dayStyle = isSunday(date) ? 'text-red-600 font-bold' : 'text-gray-900';
 * 
 * VALIDATION AND FILTERING:
 * const sundayShifts = allShifts.filter(shift => isSunday(shift.date));
 */
export function isSunday(dateString: string): boolean {
  // Use getDayOfWeek for consistency and maintainability
  return getDayOfWeek(dateString) === 0;
}

/**
 * =============================================================================
 * DATE DISPLAY FORMATTING FUNCTION
 * =============================================================================
 */

/**
 * FORMAT A DATE STRING FOR USER-FRIENDLY DISPLAY
 * 
 * PURPOSE:
 * Converts internal YYYY-MM-DD date format to a human-readable format
 * suitable for user interfaces, reports, and displays. This function
 * provides consistent, professional date formatting throughout the
 * application.
 * 
 * OUTPUT FORMAT:
 * "DayName, Month Day, Year"
 * Examples:
 * - "Monday, January 15, 2024"
 * - "Sunday, December 31, 2023"
 * - "Friday, July 4, 2024"
 * 
 * FORMATTING COMPONENTS:
 * 1. Day Name: Full day name (Monday, Tuesday, etc.)
 * 2. Month Name: Full month name (January, February, etc.)
 * 3. Day Number: Numeric day without leading zero (1, 15, 31)
 * 4. Year: Full 4-digit year (2024, 2025, etc.)
 * 
 * LOCALIZATION CONSIDERATIONS:
 * Currently uses English day and month names. For international
 * support, this function could be extended to use:
 * - Intl.DateTimeFormat for locale-specific formatting
 * - User preference settings for date format
 * - Browser locale detection for automatic formatting
 * 
 * ACCESSIBILITY BENEFITS:
 * - Screen readers can properly pronounce formatted dates
 * - Clear, unambiguous date representation
 * - Consistent formatting reduces cognitive load
 * - Professional appearance for business applications
 * 
 * PERFORMANCE CHARACTERISTICS:
 * - Array lookups are O(1) operations
 * - String concatenation is optimized by modern JavaScript engines
 * - Date object creation is the primary performance cost
 * - Suitable for real-time formatting in UI components
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string in "DayName, Month Day, Year" format
 * 
 * EXAMPLE USAGE:
 * formatDateDisplay('2024-01-15')  // "Monday, January 15, 2024"
 * formatDateDisplay('2024-07-04')  // "Thursday, July 4, 2024"
 * formatDateDisplay('2024-12-25')  // "Wednesday, December 25, 2024"
 * 
 * COMPONENT INTEGRATION:
 * const DateHeader = ({ date }) => (
 *   <h2 className="text-xl font-bold">
 *     {formatDateDisplay(date)}
 *   </h2>
 * );
 * 
 * MODAL AND DIALOG USAGE:
 * const confirmMessage = `Delete all shifts for ${formatDateDisplay(selectedDate)}?`;
 * 
 * REPORT GENERATION:
 * const reportTitle = `Work Schedule Report for ${formatDateDisplay(reportDate)}`;
 */
export function formatDateDisplay(dateString: string): string {
  // ==========================================================================
  // DATE OBJECT CREATION AND VALIDATION
  // ==========================================================================
  
  /**
   * CREATE DATE OBJECT FROM INPUT STRING
   * 
   * JavaScript's Date constructor handles YYYY-MM-DD format reliably
   * across different browsers and platforms. The date is interpreted
   * as a local date, which is appropriate for work scheduling.
   */
  const date = new Date(dateString);
  
  // ==========================================================================
  // DAY AND MONTH NAME ARRAYS
  // ==========================================================================
  
  /**
   * DAY NAMES ARRAY
   * 
   * Full English day names in the order returned by Date.getDay():
   * Index 0 = Sunday, Index 1 = Monday, etc.
   * 
   * FUTURE ENHANCEMENT:
   * Could be replaced with Intl.DateTimeFormat for localization:
   * const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' })
   *   .format(date);
   */
  const dayNames = [
    'Sunday',    // 0
    'Monday',    // 1
    'Tuesday',   // 2
    'Wednesday', // 3
    'Thursday',  // 4
    'Friday',    // 5
    'Saturday'   // 6
  ];
  
  /**
   * MONTH NAMES ARRAY
   * 
   * Full English month names in the order returned by Date.getMonth():
   * Index 0 = January, Index 1 = February, etc.
   * 
   * FUTURE ENHANCEMENT:
   * Could be replaced with Intl.DateTimeFormat for localization:
   * const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' })
   *   .format(date);
   */
  const monthNames = [
    'January',   // 0
    'February',  // 1
    'March',     // 2
    'April',     // 3
    'May',       // 4
    'June',      // 5
    'July',      // 6
    'August',    // 7
    'September', // 8
    'October',   // 9
    'November',  // 10
    'December'   // 11
  ];
  
  // ==========================================================================
  // DATE COMPONENT EXTRACTION
  // ==========================================================================
  
  /**
   * EXTRACT DATE COMPONENTS
   * 
   * Uses native Date methods to extract individual components:
   * - getDay(): Day of week (0-6)
   * - getDate(): Day of month (1-31)
   * - getMonth(): Month (0-11)
   * - getFullYear(): Full year (e.g., 2024)
   */
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  // ==========================================================================
  // FORMATTED STRING CONSTRUCTION
  // ==========================================================================
  
  /**
   * CONSTRUCT FORMATTED DATE STRING
   * 
   * Combines all components into a professional, readable format:
   * "DayName, Month Day, Year"
   * 
   * FORMATTING CHOICES:
   * - Comma after day name for proper grammar
   * - Space after month name for readability
   * - Comma before year following standard conventions
   * - No leading zeros on day numbers (15, not 015)
   */
  return `${dayName}, ${month} ${day}, ${year}`;
}

/**
 * =============================================================================
 * ADDITIONAL DATE UTILITY FUNCTIONS
 * =============================================================================
 */

/**
 * VALIDATE DATE STRING FORMAT
 * 
 * PURPOSE:
 * Checks if a string is in valid YYYY-MM-DD format and represents
 * a real date. Useful for form validation and data integrity checks.
 * 
 * @param dateString - String to validate
 * @returns True if valid YYYY-MM-DD date, false otherwise
 * 
 * VALIDATION CRITERIA:
 * - Matches YYYY-MM-DD pattern exactly
 * - Creates a valid Date object
 * - Date object represents the same date as input
 * 
 * EXAMPLE USAGE:
 * isValidDateString('2024-01-15')  // true
 * isValidDateString('2024-13-01')  // false (invalid month)
 * isValidDateString('2024-02-30')  // false (invalid day)
 * isValidDateString('24-01-15')    // false (wrong format)
 */
export function isValidDateString(dateString: string): boolean {
  // Check format with regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // Check if it creates a valid date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Check if the date represents the same values as input
  const [year, month, day] = dateString.split('-').map(Number);
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day;
}

/**
 * GET CURRENT DATE IN YYYY-MM-DD FORMAT
 * 
 * PURPOSE:
 * Returns today's date in the standard internal format used throughout
 * the application. Useful for default values and current date comparisons.
 * 
 * @returns Current date in YYYY-MM-DD format
 * 
 * TIMEZONE BEHAVIOR:
 * Uses local timezone, which is appropriate for work scheduling
 * applications where "today" means today in the user's location.
 * 
 * EXAMPLE USAGE:
 * const today = getCurrentDateString();
 * const isToday = (date) => date === getCurrentDateString();
 */
export function getCurrentDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ADD DAYS TO A DATE STRING
 * 
 * PURPOSE:
 * Adds a specified number of days to a date and returns the result
 * in YYYY-MM-DD format. Handles month and year boundaries correctly.
 * 
 * @param dateString - Starting date in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @returns New date in YYYY-MM-DD format
 * 
 * EXAMPLE USAGE:
 * addDays('2024-01-31', 1)   // '2024-02-01'
 * addDays('2024-01-15', -7)  // '2024-01-08'
 * addDays('2024-12-31', 1)   // '2025-01-01'
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET WEEK START DATE (MONDAY)
 * 
 * PURPOSE:
 * Returns the Monday of the week containing the given date.
 * Useful for weekly reports and payroll calculations.
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Monday of that week in YYYY-MM-DD format
 * 
 * WEEK DEFINITION:
 * Uses Monday as the first day of the week, which is common
 * in business applications and international standards.
 * 
 * EXAMPLE USAGE:
 * getWeekStart('2024-01-17')  // '2024-01-15' (Wednesday -> Monday)
 * getWeekStart('2024-01-15')  // '2024-01-15' (Monday -> same Monday)
 */
export function getWeekStart(dateString: string): string {
  const date = new Date(dateString);
  const dayOfWeek = date.getDay();
  
  // Calculate days to subtract to get to Monday
  // Sunday = 0, so we need to go back 6 days
  // Monday = 1, so we need to go back 0 days
  // Tuesday = 2, so we need to go back 1 day, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  return addDays(dateString, -daysToSubtract);
}

/**
 * GET MONTH START DATE
 * 
 * PURPOSE:
 * Returns the first day of the month containing the given date.
 * Useful for monthly reports and calculations.
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @returns First day of that month in YYYY-MM-DD format
 * 
 * EXAMPLE USAGE:
 * getMonthStart('2024-01-17')  // '2024-01-01'
 * getMonthStart('2024-02-29')  // '2024-02-01'
 */
export function getMonthStart(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * =============================================================================
 * USAGE EXAMPLES AND BEST PRACTICES
 * =============================================================================
 * 
 * BASIC DATE OPERATIONS:
 * 
 * import { getDayOfWeek, isSunday, formatDateDisplay } from './utils/dateUtils';
 * 
 * // Check day of week for business rules
 * const dayOfWeek = getDayOfWeek('2024-01-15');
 * if (dayOfWeek === 0 || dayOfWeek === 6) {
 *   applyWeekendRates();
 * }
 * 
 * // Sunday premium check
 * if (isSunday(shiftDate)) {
 *   hourlyRate *= sundayMultiplier;
 * }
 * 
 * // Format for display
 * const displayDate = formatDateDisplay('2024-01-15');
 * // "Monday, January 15, 2024"
 * 
 * COMPONENT INTEGRATION:
 * 
 * const ShiftCard = ({ date, shifts }) => {
 *   const isWeekend = [0, 6].includes(getDayOfWeek(date));
 *   const displayDate = formatDateDisplay(date);
 *   
 *   return (
 *     <div className={isWeekend ? 'bg-blue-50' : 'bg-white'}>
 *       <h3>{displayDate}</h3>
 *       {shifts.map(shift => <ShiftItem key={shift.id} shift={shift} />)}
 *     </div>
 *   );
 * };
 * 
 * BUSINESS LOGIC IMPLEMENTATION:
 * 
 * const calculateShiftPay = (date, hours, baseRate) => {
 *   let rate = baseRate;
 *   
 *   // Apply Sunday premium
 *   if (isSunday(date)) {
 *     rate *= 1.5;
 *   }
 *   
 *   // Apply weekend differential
 *   const dayOfWeek = getDayOfWeek(date);
 *   if (dayOfWeek === 6) { // Saturday
 *     rate *= 1.25;
 *   }
 *   
 *   return hours * rate;
 * };
 * 
 * VALIDATION AND ERROR HANDLING:
 * 
 * const processShiftDate = (dateString) => {
 *   if (!isValidDateString(dateString)) {
 *     throw new Error(`Invalid date format: ${dateString}`);
 *   }
 *   
 *   const dayOfWeek = getDayOfWeek(dateString);
 *   if (isNaN(dayOfWeek)) {
 *     throw new Error(`Unable to determine day of week for: ${dateString}`);
 *   }
 *   
 *   return {
 *     date: dateString,
 *     dayOfWeek,
 *     isSunday: isSunday(dateString),
 *     displayDate: formatDateDisplay(dateString)
 *   };
 * };
 * 
 * =============================================================================
 * PERFORMANCE CONSIDERATIONS
 * =============================================================================
 * 
 * OPTIMIZATION STRATEGIES:
 * - Cache formatted dates for frequently displayed dates
 * - Use memoization for expensive date calculations
 * - Batch date operations when processing multiple dates
 * - Consider using date libraries for complex operations
 * 
 * MEMORY USAGE:
 * - Date objects are lightweight and garbage collected efficiently
 * - String operations are optimized by modern JavaScript engines
 * - Array lookups for day/month names are O(1) operations
 * 
 * BROWSER COMPATIBILITY:
 * - All functions use standard JavaScript Date API
 * - Compatible with all modern browsers
 * - No external dependencies required
 * - Consistent behavior across platforms
 * 
 * =============================================================================
 * TESTING AND VALIDATION
 * =============================================================================
 * 
 * TEST CASES TO CONSIDER:
 * - All days of the week (Sunday through Saturday)
 * - Month boundaries (last day of month, first day of month)
 * - Year boundaries (December 31, January 1)
 * - Leap year dates (February 29)
 * - Invalid date strings
 * - Edge cases (empty strings, null values)
 * 
 * EXAMPLE TESTS:
 * 
 * // Test Sunday detection
 * console.assert(isSunday('2024-01-14') === true);
 * console.assert(isSunday('2024-01-15') === false);
 * 
 * // Test day of week calculation
 * console.assert(getDayOfWeek('2024-01-15') === 1); // Monday
 * console.assert(getDayOfWeek('2024-01-14') === 0); // Sunday
 * 
 * // Test date formatting
 * console.assert(formatDateDisplay('2024-01-15') === 'Monday, January 15, 2024');
 * 
 * =============================================================================
 * FUTURE ENHANCEMENTS
 * =============================================================================
 * 
 * INTERNATIONALIZATION:
 * - Add locale-specific date formatting
 * - Support different calendar systems
 * - Handle right-to-left languages
 * - Add timezone support
 * 
 * BUSINESS FEATURES:
 * - Holiday detection and handling
 * - Fiscal year calculations
 * - Payroll period calculations
 * - Shift pattern recognition
 * 
 * PERFORMANCE IMPROVEMENTS:
 * - Date calculation caching
 * - Lazy loading of locale data
 * - Web Worker support for bulk operations
 * - Memory optimization for large date ranges
 */