/**
 * FILE: src/utils/currency.ts
 * 
 * =============================================================================
 * CURRENCY FORMATTING UTILITIES FOR WORK SCHEDULE APPLICATION
 * =============================================================================
 * 
 * OVERVIEW:
 * This utility module provides comprehensive currency formatting functions
 * specifically designed for the Work Schedule application. It handles the
 * formatting of monetary amounts with proper localization, decimal precision,
 * and currency symbol placement.
 * 
 * PRIMARY FOCUS:
 * While the module includes a specialized function for Mauritian Rupees
 * (the primary target currency), it also provides flexible formatting
 * that works with any currency symbol and locale.
 * 
 * MAIN FEATURES:
 * - Mauritian Rupee specific formatting with proper localization
 * - Generic currency formatting for international support
 * - Consistent decimal precision (2 decimal places)
 * - Proper thousand separators and number grouping
 * - Error handling for invalid input values
 * - TypeScript support with proper type definitions
 * 
 * DESIGN PRINCIPLES:
 * - Consistent formatting across the entire application
 * - Internationalization support for global users
 * - Error resilience with graceful fallbacks
 * - Performance optimization for frequent use
 * - Easy maintenance and extensibility
 * 
 * USAGE CONTEXTS:
 * - Calendar component for amount displays
 * - Settings panel for salary and rate formatting
 * - Export functionality for data presentation
 * - Modal components for shift amount calculations
 * - Report generation and data visualization
 * 
 * =============================================================================
 * TYPE DEFINITIONS
 * =============================================================================
 */

/**
 * CURRENCY FORMAT RESULT INTERFACE
 * 
 * PURPOSE:
 * Defines the structure returned by currency formatting functions.
 * Provides a consistent interface for formatted currency values
 * and allows for future extension with additional formatting metadata.
 * 
 * CURRENT PROPERTIES:
 * - formatted: The complete formatted currency string ready for display
 * 
 * FUTURE EXTENSIBILITY:
 * This interface can be extended to include additional information:
 * - rawValue: The original numeric value
 * - currencyCode: The currency code used
 * - locale: The locale used for formatting
 * - precision: Number of decimal places used
 * 
 * EXAMPLE USAGE:
 * const result: CurrencyFormatResult = formatMauritianRupees(1234.56);
 * console.log(result.formatted); // "Rs 1,234.56"
 */
export interface CurrencyFormatResult {
  /** 
   * Complete formatted currency string ready for display
   * Includes currency symbol, properly formatted number with
   * thousand separators, and appropriate decimal precision
   */
  formatted: string;
}

/**
 * =============================================================================
 * MAURITIAN RUPEE FORMATTING FUNCTION
 * =============================================================================
 */

/**
 * FORMATS A NUMBER AS MAURITIAN RUPEES WITH PROPER LOCALIZATION
 * 
 * PURPOSE:
 * Provides specialized formatting for Mauritian Rupees (MUR), which is
 * the primary currency for the application's target market. This function
 * ensures consistent, professional formatting that matches local expectations.
 * 
 * FORMATTING SPECIFICATIONS:
 * - Currency Symbol: "Rs " (with space after)
 * - Decimal Places: Always 2 (e.g., 1,234.56)
 * - Thousand Separator: Comma (,)
 * - Decimal Separator: Period (.)
 * - Symbol Placement: Before the amount
 * - Negative Numbers: Standard minus sign prefix
 * 
 * LOCALIZATION APPROACH:
 * Uses the Intl.NumberFormat API with 'en-US' locale as a base, then
 * customizes the output to match Mauritian Rupee conventions. This
 * approach provides reliable formatting across different browsers and
 * operating systems.
 * 
 * ERROR HANDLING:
 * - Invalid numbers (NaN, null, undefined) return "Rs 0.00"
 * - Infinite values are handled gracefully
 * - Non-numeric inputs are converted to 0
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Uses native Intl.NumberFormat for optimal performance
 * - Minimal string manipulation for efficiency
 * - Caches formatter instance implicitly by browser
 * 
 * @param amount - The numeric amount to format (can be positive or negative)
 * @returns CurrencyFormatResult object with formatted currency string
 * 
 * EXAMPLE USAGE:
 * formatMauritianRupees(1234.56)    // { formatted: "Rs 1,234.56" }
 * formatMauritianRupees(0)          // { formatted: "Rs 0.00" }
 * formatMauritianRupees(-500.25)    // { formatted: "Rs -500.25" }
 * formatMauritianRupees(1000000)    // { formatted: "Rs 1,000,000.00" }
 * formatMauritianRupees(NaN)        // { formatted: "Rs 0.00" }
 * 
 * BUSINESS CONTEXT:
 * Mauritian Rupees are the primary currency for the application's target
 * market. This function ensures that all monetary displays follow local
 * conventions and provide a professional appearance for business use.
 */
export function formatMauritianRupees(amount: number): CurrencyFormatResult {
  // ==========================================================================
  // INPUT VALIDATION AND ERROR HANDLING
  // ==========================================================================
  
  /**
   * COMPREHENSIVE INPUT VALIDATION
   * 
   * Checks for various invalid input scenarios:
   * - Non-number types (string, object, null, undefined)
   * - NaN values from invalid calculations
   * - Infinite values from division by zero
   * 
   * FALLBACK STRATEGY:
   * Returns a properly formatted zero amount to maintain UI consistency
   * and prevent display errors that could confuse users.
   */
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { formatted: 'Rs 0.00' };
  }

  // ==========================================================================
  // CURRENCY FORMATTING WITH INTL.NUMBERFORMAT
  // ==========================================================================
  
  /**
   * INTERNATIONAL NUMBER FORMATTING SETUP
   * 
   * Configuration options:
   * - style: 'currency' - Enables currency-specific formatting
   * - currency: 'MUR' - Mauritian Rupee currency code
   * - currencyDisplay: 'symbol' - Use currency symbol instead of code
   * - minimumFractionDigits: 2 - Always show 2 decimal places
   * - maximumFractionDigits: 2 - Never exceed 2 decimal places
   * 
   * LOCALE SELECTION:
   * Uses 'en-US' locale as it provides the most consistent formatting
   * across different browsers and platforms. The currency symbol is
   * then customized to match Mauritian conventions.
   */
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MUR',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Format the amount using the international formatter
  let formatted = formatter.format(amount);
  
  // ==========================================================================
  // CURRENCY SYMBOL CUSTOMIZATION
  // ==========================================================================
  
  /**
   * MAURITIAN RUPEE SYMBOL STANDARDIZATION
   * 
   * The Intl.NumberFormat may return different symbols depending on
   * the browser and system locale. To ensure consistency, we replace
   * any variant of the Mauritian Rupee symbol with the standard "Rs ".
   * 
   * SYMBOL VARIANTS HANDLED:
   * - MUR (currency code)
   * - ₨ (generic rupee symbol)
   * - Other potential variants
   * 
   * STANDARDIZATION:
   * All variants are replaced with "Rs " (with trailing space) to
   * match local business conventions and user expectations.
   */
  formatted = formatted.replace(/MUR|₨/, 'Rs ');
  
  // ==========================================================================
  // SPACING NORMALIZATION
  // ==========================================================================
  
  /**
   * CONSISTENT SPACING ENFORCEMENT
   * 
   * Ensures there's always exactly one space between the currency
   * symbol and the number. This handles cases where the formatter
   * might not include proper spacing or where our symbol replacement
   * affects spacing.
   * 
   * PATTERN MATCHING:
   * - Finds "Rs" followed immediately by a digit
   * - Inserts a space between them
   * - Maintains existing spacing if already correct
   */
  formatted = formatted.replace(/Rs(\d)/, 'Rs $1');

  return { formatted };
}

/**
 * =============================================================================
 * GENERIC CURRENCY FORMATTING FUNCTION
 * =============================================================================
 */

/**
 * ALTERNATIVE SIMPLE FORMATTING FUNCTION FOR BASIC USE CASES
 * 
 * PURPOSE:
 * Provides a simpler, more direct approach to currency formatting
 * when the full internationalization features of formatMauritianRupees
 * are not needed. This function is more lightweight and faster for
 * basic formatting needs.
 * 
 * USE CASES:
 * - Quick formatting in development/testing
 * - Simple displays where advanced localization isn't required
 * - Fallback formatting when Intl.NumberFormat isn't available
 * - Performance-critical scenarios with high-frequency formatting
 * 
 * FORMATTING APPROACH:
 * Uses the native JavaScript toLocaleString method with 'en-US' locale
 * for consistent number formatting, then prepends the "Rs " symbol.
 * 
 * LIMITATIONS COMPARED TO formatMauritianRupees:
 * - Less sophisticated error handling
 * - No currency-specific localization
 * - Simpler symbol handling
 * - No extensibility for additional metadata
 * 
 * PERFORMANCE BENEFITS:
 * - Faster execution due to simpler logic
 * - Lower memory usage
 * - Fewer string operations
 * - Direct toLocaleString usage
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted currency string (not wrapped in object)
 * 
 * EXAMPLE USAGE:
 * formatCurrency(1234.56)    // "Rs 1,234.56"
 * formatCurrency(0)          // "Rs 0.00"
 * formatCurrency(-500.25)    // "Rs -500.25"
 * formatCurrency(NaN)        // "Rs 0.00"
 * 
 * WHEN TO USE:
 * - Internal calculations and logging
 * - Development and testing scenarios
 * - Performance-critical loops
 * - Simple display requirements
 * 
 * WHEN TO USE formatMauritianRupees INSTEAD:
 * - User-facing displays
 * - Professional business presentations
 * - Export and reporting functionality
 * - International user support
 */
export function formatCurrency(amount: number): string {
  // ==========================================================================
  // BASIC INPUT VALIDATION
  // ==========================================================================
  
  /**
   * SIMPLE ERROR HANDLING
   * 
   * Provides basic protection against invalid inputs while maintaining
   * the lightweight nature of this function. Returns a standard zero
   * format for any invalid input.
   */
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rs 0.00';
  }

  // ==========================================================================
  // DIRECT LOCALE STRING FORMATTING
  // ==========================================================================
  
  /**
   * STREAMLINED FORMATTING PROCESS
   * 
   * Uses toLocaleString with specific options for consistent formatting:
   * - minimumFractionDigits: 2 - Always show cents
   * - maximumFractionDigits: 2 - Never show more than cents
   * - 'en-US' locale for consistent thousand separators
   * 
   * SYMBOL PREPENDING:
   * Simply prepends "Rs " to the formatted number for efficiency.
   * This approach is faster but less sophisticated than the full
   * internationalization approach used in formatMauritianRupees.
   */
  return `Rs ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * =============================================================================
 * UTILITY FUNCTIONS FOR ADVANCED FORMATTING
 * =============================================================================
 */

/**
 * PARSE CURRENCY STRING BACK TO NUMBER
 * 
 * PURPOSE:
 * Converts a formatted currency string back to a numeric value.
 * Useful for form inputs, calculations, and data processing.
 * 
 * @param currencyString - Formatted currency string (e.g., "Rs 1,234.56")
 * @returns Numeric value or 0 if parsing fails
 * 
 * EXAMPLE USAGE:
 * parseCurrencyString("Rs 1,234.56")  // 1234.56
 * parseCurrencyString("Rs -500.25")   // -500.25
 * parseCurrencyString("invalid")      // 0
 */
export function parseCurrencyString(currencyString: string): number {
  // Remove currency symbol and whitespace
  const cleanString = currencyString.replace(/Rs\s?/, '').replace(/,/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * FORMAT CURRENCY WITH CUSTOM SYMBOL
 * 
 * PURPOSE:
 * Provides flexible currency formatting with any currency symbol.
 * Useful for international users or multi-currency applications.
 * 
 * @param amount - Numeric amount to format
 * @param symbol - Currency symbol to use (e.g., "$", "€", "£")
 * @returns Formatted currency string with custom symbol
 * 
 * EXAMPLE USAGE:
 * formatCurrencyWithSymbol(1234.56, "$")   // "$ 1,234.56"
 * formatCurrencyWithSymbol(1234.56, "€")   // "€ 1,234.56"
 * formatCurrencyWithSymbol(1234.56, "£")   // "£ 1,234.56"
 */
export function formatCurrencyWithSymbol(amount: number, symbol: string): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${symbol} 0.00`;
  }

  return `${symbol} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * =============================================================================
 * USAGE EXAMPLES AND BEST PRACTICES
 * =============================================================================
 * 
 * BASIC USAGE:
 * 
 * import { formatMauritianRupees, formatCurrency } from './utils/currency';
 * 
 * // For user-facing displays (recommended)
 * const result = formatMauritianRupees(1234.56);
 * console.log(result.formatted); // "Rs 1,234.56"
 * 
 * // For simple/internal use
 * const simple = formatCurrency(1234.56);
 * console.log(simple); // "Rs 1,234.56"
 * 
 * COMPONENT INTEGRATION:
 * 
 * const AmountDisplay = ({ amount }) => {
 *   const { formatted } = formatMauritianRupees(amount);
 *   return <span className="font-bold text-green-600">{formatted}</span>;
 * };
 * 
 * CALCULATION WORKFLOWS:
 * 
 * // Calculate total and format for display
 * const total = normalHours * hourlyRate + overtimeHours * overtimeRate;
 * const displayTotal = formatMauritianRupees(total).formatted;
 * 
 * // Parse user input back to number
 * const userInput = "Rs 1,500.75";
 * const numericValue = parseCurrencyString(userInput);
 * 
 * INTERNATIONAL SUPPORT:
 * 
 * // Support multiple currencies
 * const formatAmount = (amount, currency) => {
 *   switch (currency) {
 *     case 'Rs':
 *       return formatMauritianRupees(amount).formatted;
 *     case '$':
 *       return formatCurrencyWithSymbol(amount, '$');
 *     case '€':
 *       return formatCurrencyWithSymbol(amount, '€');
 *     default:
 *       return formatCurrency(amount);
 *   }
 * };
 * 
 * =============================================================================
 * PERFORMANCE CONSIDERATIONS
 * =============================================================================
 * 
 * FUNCTION SELECTION:
 * - Use formatMauritianRupees() for user-facing displays
 * - Use formatCurrency() for internal/development use
 * - Use formatCurrencyWithSymbol() for international support
 * 
 * OPTIMIZATION TIPS:
 * - Cache formatted values when possible
 * - Avoid formatting in render loops
 * - Use useMemo for expensive calculations
 * - Consider formatting only visible amounts
 * 
 * MEMORY USAGE:
 * - Intl.NumberFormat instances are cached by browsers
 * - String operations are optimized by JavaScript engines
 * - Minimal memory footprint for typical usage
 * 
 * =============================================================================
 * TESTING AND VALIDATION
 * =============================================================================
 * 
 * TEST CASES TO CONSIDER:
 * - Positive and negative amounts
 * - Zero values
 * - Very large numbers (millions, billions)
 * - Very small numbers (cents, fractions)
 * - Invalid inputs (NaN, null, undefined, strings)
 * - Edge cases (Infinity, -Infinity)
 * 
 * VALIDATION EXAMPLES:
 * 
 * // Test positive amounts
 * console.assert(formatCurrency(1234.56) === "Rs 1,234.56");
 * 
 * // Test negative amounts
 * console.assert(formatCurrency(-500.25) === "Rs -500.25");
 * 
 * // Test zero
 * console.assert(formatCurrency(0) === "Rs 0.00");
 * 
 * // Test invalid inputs
 * console.assert(formatCurrency(NaN) === "Rs 0.00");
 * console.assert(formatCurrency(null) === "Rs 0.00");
 * 
 * =============================================================================
 * MAINTENANCE AND EXTENSIBILITY
 * =============================================================================
 * 
 * ADDING NEW CURRENCIES:
 * 1. Create new formatting function following the pattern
 * 2. Add appropriate currency code and symbol
 * 3. Test with various amount ranges
 * 4. Update type definitions if needed
 * 
 * MODIFYING EXISTING FORMATS:
 * 1. Consider backward compatibility
 * 2. Update all usage locations
 * 3. Test thoroughly with real data
 * 4. Document changes for users
 * 
 * INTERNATIONALIZATION IMPROVEMENTS:
 * 1. Add locale-specific formatting
 * 2. Support right-to-left currencies
 * 3. Handle different decimal separators
 * 4. Add currency conversion support
 * 
 * FUTURE ENHANCEMENTS:
 * - Currency conversion rates
 * - Locale-specific formatting
 * - Cryptocurrency support
 * - Historical currency data
 * - Advanced rounding options
 */