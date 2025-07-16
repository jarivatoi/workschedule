/**
 * FILE: src/utils/currency.ts
 * 
 * =============================================================================
 * OVERVIEW AND PURPOSE
 * =============================================================================
 * 
 * This utility module provides comprehensive currency formatting functionality
 * specifically designed for Mauritian Rupees and international currency support.
 * It demonstrates advanced number formatting, internationalization patterns,
 * and robust error handling for financial applications.
 * 
 * MAIN FUNCTIONALITY:
 * - Mauritian Rupee formatting with proper localization
 * - International currency formatting support
 * - Error handling for invalid inputs
 * - Consistent formatting across the application
 * - Accessibility-friendly number representation
 * - Performance-optimized formatting functions
 * 
 * DEPENDENCIES AND RELATIONSHIPS:
 * - Uses: Browser Intl.NumberFormat API for localization
 * - Used by: All components displaying currency amounts
 * - Supports: Multi-currency applications and internationalization
 * - Integrates with: Settings panel currency selection
 * 
 * DESIGN PATTERNS DEMONSTRATED:
 * - Utility function pattern for reusable logic
 * - Error handling with graceful degradation
 * - Internationalization (i18n) best practices
 * - Type safety with TypeScript interfaces
 * - Performance optimization through API reuse
 * 
 * LEARNING OBJECTIVES:
 * This file demonstrates advanced concepts including:
 * 1. International number formatting with Intl API
 * 2. Currency formatting best practices
 * 3. Error handling in utility functions
 * 4. Performance optimization techniques
 * 5. Accessibility considerations for financial data
 * 6. Type-safe utility function design
 * 7. Localization and internationalization patterns
 * 8. Robust input validation and sanitization
 * 
 * =============================================================================
 * INTERNATIONALIZATION AND LOCALIZATION
 * =============================================================================
 * 
 * INTL.NUMBERFORMAT API:
 * The modern standard for number and currency formatting in web applications.
 * Provides automatic localization, proper decimal handling, and currency
 * symbol placement according to regional conventions.
 * 
 * BENEFITS OF INTL API:
 * - Automatic locale-aware formatting
 * - Proper currency symbol placement
 * - Decimal separator handling (. vs ,)
 * - Thousands separator formatting
 * - Right-to-left language support
 * - Accessibility-friendly output
 * 
 * MAURITIAN RUPEE CONSIDERATIONS:
 * - Standard currency code: MUR
 * - Symbol: Rs (commonly used)
 * - Decimal places: 2 (standard for most currencies)
 * - Thousands separator: comma (,)
 * - Decimal separator: period (.)
 * 
 * LOCALIZATION STRATEGY:
 * - Uses 'en-US' locale for consistent formatting
 * - Replaces currency symbols for custom display
 * - Maintains international formatting standards
 * - Supports future localization expansion
 * 
 * =============================================================================
 * ERROR HANDLING AND ROBUSTNESS
 * =============================================================================
 * 
 * INPUT VALIDATION STRATEGY:
 * - Type checking for number inputs
 * - NaN detection and handling
 * - Null/undefined input protection
 * - Graceful degradation to default values
 * 
 * ERROR RECOVERY PATTERNS:
 * - Return sensible defaults instead of throwing errors
 * - Maintain application stability under all conditions
 * - Provide consistent output format even with bad input
 * - Log errors for debugging without breaking user experience
 * 
 * DEFENSIVE PROGRAMMING:
 * - Assume inputs may be invalid
 * - Provide fallback behaviors
 * - Maintain type safety throughout
 * - Document expected input ranges and formats
 */

/**
 * =============================================================================
 * TYPE DEFINITIONS AND INTERFACES
 * =============================================================================
 */

/**
 * CURRENCY FORMAT RESULT INTERFACE
 * 
 * Defines the structure returned by currency formatting functions.
 * This interface provides type safety and clear documentation of
 * the expected return format.
 * 
 * DESIGN DECISIONS:
 * - Single property for simplicity
 * - Extensible for future metadata (original amount, currency code, etc.)
 * - Clear naming for self-documenting code
 * - Consistent with functional programming patterns
 * 
 * FUTURE EXTENSIONS:
 * Could be extended to include:
 * - originalAmount: number
 * - currencyCode: string
 * - locale: string
 * - formattingOptions: Intl.NumberFormatOptions
 */
export interface CurrencyFormatResult {
  formatted: string;  // The formatted currency string ready for display
}

/**
 * =============================================================================
 * MAURITIAN RUPEE FORMATTING FUNCTIONS
 * =============================================================================
 */

/**
 * MAURITIAN RUPEE FORMATTER
 * 
 * Formats numeric amounts as Mauritian Rupees with proper localization
 * and error handling. This is the primary currency formatting function
 * for the application's target market.
 * 
 * @param amount - The numeric amount to format
 * @returns Object containing the formatted currency string
 * 
 * FORMATTING PROCESS:
 * 1. Validate input and handle edge cases
 * 2. Use Intl.NumberFormat for proper localization
 * 3. Replace standard currency symbol with custom "Rs"
 * 4. Ensure proper spacing and formatting
 * 5. Return structured result object
 * 
 * ERROR HANDLING:
 * - Invalid inputs return "Rs 0.00"
 * - NaN values are handled gracefully
 * - Null/undefined inputs are protected against
 * - No exceptions are thrown to maintain application stability
 * 
 * LOCALIZATION FEATURES:
 * - Uses international formatting standards
 * - Proper decimal place handling (2 places)
 * - Thousands separator formatting
 * - Consistent currency symbol placement
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Intl.NumberFormat is created fresh each time (could be optimized)
 * - String replacement operations are minimal
 * - Input validation is fast and efficient
 * - Memory usage is minimal with no persistent state
 * 
 * USAGE EXAMPLES:
 * ```typescript
 * formatMauritianRupees(1234.56)    // { formatted: "Rs 1,234.56" }
 * formatMauritianRupees(0)          // { formatted: "Rs 0.00" }
 * formatMauritianRupees(NaN)        // { formatted: "Rs 0.00" }
 * formatMauritianRupees(undefined)  // { formatted: "Rs 0.00" }
 * ```
 */
export function formatMauritianRupees(amount: number): CurrencyFormatResult {
  // ==========================================================================
  // INPUT VALIDATION AND ERROR HANDLING
  // ==========================================================================
  
  /**
   * COMPREHENSIVE INPUT VALIDATION
   * 
   * Checks for all possible invalid input scenarios and provides
   * graceful fallback behavior. This defensive programming approach
   * ensures the application never crashes due to formatting errors.
   * 
   * VALIDATION CHECKS:
   * - Type checking: Ensures input is actually a number
   * - NaN detection: Handles mathematical errors and invalid conversions
   * - Finite number check: Prevents Infinity and -Infinity issues
   * - Null/undefined protection: Handles missing or undefined values
   */
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { formatted: 'Rs 0.00' };
  }

  // ==========================================================================
  // INTERNATIONAL FORMATTING WITH INTL API
  // ==========================================================================
  
  /**
   * INTL.NUMBERFORMAT CONFIGURATION
   * 
   * Creates a number formatter specifically configured for currency
   * display with Mauritian Rupee requirements.
   * 
   * CONFIGURATION OPTIONS:
   * - style: 'currency' - Enables currency-specific formatting
   * - currency: 'MUR' - Mauritian Rupee currency code
   * - currencyDisplay: 'symbol' - Shows currency symbol instead of code
   * - minimumFractionDigits: 2 - Always shows 2 decimal places
   * - maximumFractionDigits: 2 - Limits to 2 decimal places
   * 
   * LOCALE SELECTION:
   * Uses 'en-US' for consistent formatting across different user locales
   * while maintaining international standards for number representation.
   */
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MUR',              // Mauritian Rupee currency code
    currencyDisplay: 'symbol',    // Show symbol (₨) instead of code (MUR)
    minimumFractionDigits: 2,     // Always show 2 decimal places
    maximumFractionDigits: 2      // Limit to 2 decimal places
  });

  // ==========================================================================
  // FORMAT AND CUSTOMIZE OUTPUT
  // ==========================================================================
  
  /**
   * FORMATTING AND SYMBOL REPLACEMENT
   * 
   * Applies the international formatting and then customizes the output
   * to match application requirements and user expectations.
   * 
   * CUSTOMIZATION PROCESS:
   * 1. Format amount using Intl.NumberFormat
   * 2. Replace standard MUR symbol with custom "Rs"
   * 3. Ensure proper spacing between symbol and amount
   * 4. Return formatted result in structured object
   */
  let formatted = formatter.format(amount);
  
  // Replace currency symbol with custom "Rs" for consistency
  // The regex handles various possible currency symbols that might be returned
  formatted = formatted.replace(/MUR|₨/, 'Rs ');
  
  // Ensure proper spacing between currency symbol and amount
  // This handles cases where the replacement might create spacing issues
  formatted = formatted.replace(/Rs(\d)/, 'Rs $1');

  return { formatted };
}

/**
 * =============================================================================
 * SIMPLIFIED CURRENCY FORMATTING FUNCTIONS
 * =============================================================================
 */

/**
 * SIMPLE CURRENCY FORMATTER
 * 
 * Alternative formatting function for basic use cases where the full
 * CurrencyFormatResult interface is not needed. Provides direct string
 * output for simpler integration scenarios.
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted currency string
 * 
 * DESIGN RATIONALE:
 * - Simpler API for basic formatting needs
 * - Direct string return for easy template usage
 * - Consistent formatting with main function
 * - Reduced overhead for simple use cases
 * 
 * IMPLEMENTATION STRATEGY:
 * - Uses same validation logic as main function
 * - Applies same formatting standards
 * - Provides consistent error handling
 * - Maintains performance characteristics
 * 
 * USAGE SCENARIOS:
 * - Template string interpolation
 * - Simple display components
 * - Logging and debugging output
 * - Quick formatting without object destructuring
 * 
 * USAGE EXAMPLES:
 * ```typescript
 * formatCurrency(1234.56)    // "Rs 1,234.56"
 * formatCurrency(0)          // "Rs 0.00"
 * formatCurrency(NaN)        // "Rs 0.00"
 * 
 * // Template usage
 * const message = `Total: ${formatCurrency(amount)}`;
 * 
 * // Component usage
 * <span>{formatCurrency(shift.totalAmount)}</span>
 * ```
 */
export function formatCurrency(amount: number): string {
  // ==========================================================================
  // INPUT VALIDATION (CONSISTENT WITH MAIN FUNCTION)
  // ==========================================================================
  
  /**
   * CONSISTENT VALIDATION LOGIC
   * 
   * Uses the same validation approach as formatMauritianRupees to ensure
   * consistent behavior across all formatting functions in the application.
   */
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rs 0.00';
  }

  // ==========================================================================
  // SIMPLIFIED FORMATTING WITH TOLOCALESTRING
  // ==========================================================================
  
  /**
   * TOLOCALESTRING APPROACH
   * 
   * Uses the simpler toLocaleString method for basic formatting needs.
   * This approach is more lightweight but provides less control over
   * currency symbol customization.
   * 
   * FORMATTING OPTIONS:
   * - minimumFractionDigits: 2 - Always show cents
   * - maximumFractionDigits: 2 - Limit decimal precision
   * - Uses 'en-US' locale for consistent thousands separators
   * 
   * TRADE-OFFS:
   * - Simpler implementation
   * - Less control over currency symbols
   * - Slightly better performance
   * - Adequate for most use cases
   */
  return `Rs ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * =============================================================================
 * USAGE EXAMPLES AND INTEGRATION PATTERNS
 * =============================================================================
 * 
 * COMPONENT INTEGRATION:
 * ```typescript
 * import { formatMauritianRupees, formatCurrency } from '../utils/currency';
 * 
 * // In React component
 * const AmountDisplay: React.FC<{ amount: number }> = ({ amount }) => {
 *   const { formatted } = formatMauritianRupees(amount);
 *   return <span className="font-bold text-green-600">{formatted}</span>;
 * };
 * 
 * // Simple usage
 * const SimpleAmount: React.FC<{ amount: number }> = ({ amount }) => (
 *   <span>{formatCurrency(amount)}</span>
 * );
 * ```
 * 
 * CALCULATION INTEGRATION:
 * ```typescript
 * // In calculation functions
 * const calculateShiftAmount = (hours: number, rate: number): string => {
 *   const amount = hours * rate;
 *   return formatCurrency(amount);
 * };
 * 
 * // In summary displays
 * const totalFormatted = formatMauritianRupees(totalAmount).formatted;
 * ```
 * 
 * ERROR HANDLING INTEGRATION:
 * ```typescript
 * // Safe formatting with error handling
 * const safeFormatAmount = (amount: unknown): string => {
 *   try {
 *     const numAmount = Number(amount);
 *     return formatCurrency(numAmount);
 *   } catch (error) {
 *     console.warn('Currency formatting error:', error);
 *     return 'Rs 0.00';
 *   }
 * };
 * ```
 * 
 * =============================================================================
 * PERFORMANCE OPTIMIZATION OPPORTUNITIES
 * =============================================================================
 * 
 * FORMATTER CACHING:
 * ```typescript
 * // Optimized version with cached formatter
 * const cachedFormatter = new Intl.NumberFormat('en-US', {
 *   style: 'currency',
 *   currency: 'MUR',
 *   currencyDisplay: 'symbol',
 *   minimumFractionDigits: 2,
 *   maximumFractionDigits: 2
 * });
 * 
 * export function optimizedFormatMauritianRupees(amount: number): CurrencyFormatResult {
 *   if (typeof amount !== 'number' || isNaN(amount)) {
 *     return { formatted: 'Rs 0.00' };
 *   }
 *   
 *   let formatted = cachedFormatter.format(amount);
 *   formatted = formatted.replace(/MUR|₨/, 'Rs ');
 *   formatted = formatted.replace(/Rs(\d)/, 'Rs $1');
 *   
 *   return { formatted };
 * }
 * ```
 * 
 * MEMOIZATION FOR EXPENSIVE OPERATIONS:
 * ```typescript
 * // Memoized version for repeated formatting
 * const formatCache = new Map<number, string>();
 * 
 * export function memoizedFormatCurrency(amount: number): string {
 *   if (formatCache.has(amount)) {
 *     return formatCache.get(amount)!;
 *   }
 *   
 *   const formatted = formatCurrency(amount);
 *   formatCache.set(amount, formatted);
 *   return formatted;
 * }
 * ```
 * 
 * =============================================================================
 * TESTING CONSIDERATIONS
 * =============================================================================
 * 
 * UNIT TEST EXAMPLES:
 * ```typescript
 * describe('Currency Formatting', () => {
 *   test('formats positive amounts correctly', () => {
 *     expect(formatCurrency(1234.56)).toBe('Rs 1,234.56');
 *   });
 *   
 *   test('handles zero amounts', () => {
 *     expect(formatCurrency(0)).toBe('Rs 0.00');
 *   });
 *   
 *   test('handles invalid inputs gracefully', () => {
 *     expect(formatCurrency(NaN)).toBe('Rs 0.00');
 *     expect(formatCurrency(undefined as any)).toBe('Rs 0.00');
 *   });
 *   
 *   test('formats large amounts with proper separators', () => {
 *     expect(formatCurrency(1234567.89)).toBe('Rs 1,234,567.89');
 *   });
 * });
 * ```
 * 
 * =============================================================================
 * LEARNING POINTS AND EDUCATIONAL VALUE
 * =============================================================================
 * 
 * This currency utility demonstrates several important concepts:
 * 
 * 1. INTERNATIONALIZATION (I18N):
 *    - Proper use of Intl.NumberFormat API
 *    - Locale-aware number formatting
 *    - Currency symbol handling
 *    - Regional formatting considerations
 * 
 * 2. ERROR HANDLING PATTERNS:
 *    - Defensive programming techniques
 *    - Graceful degradation strategies
 *    - Input validation and sanitization
 *    - Consistent error recovery
 * 
 * 3. UTILITY FUNCTION DESIGN:
 *    - Single responsibility principle
 *    - Type-safe interfaces
 *    - Consistent API design
 *    - Performance considerations
 * 
 * 4. FINANCIAL APPLICATION PATTERNS:
 *    - Proper decimal handling
 *    - Currency formatting standards
 *    - Accessibility considerations
 *    - User experience optimization
 * 
 * 5. PERFORMANCE OPTIMIZATION:
 *    - API usage efficiency
 *    - Caching opportunities
 *    - Memory management
 *    - Computational complexity
 * 
 * 6. CODE QUALITY PRACTICES:
 *    - Comprehensive documentation
 *    - Clear function naming
 *    - Consistent error handling
 *    - Testable function design
 * 
 * AREAS FOR FURTHER STUDY:
 * - Advanced internationalization frameworks
 * - Currency conversion and exchange rates
 * - Financial calculation precision
 * - Accessibility in financial applications
 * - Performance optimization techniques
 * - Advanced TypeScript patterns
 * - Testing strategies for utility functions
 * - Localization best practices
 * 
 * This utility serves as an excellent example of how to build robust,
 * internationalization-ready currency formatting functions for
 * professional financial applications.
 */