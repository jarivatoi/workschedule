/**
 * Date utility functions
 */

/**
 * Get the day of the week for a given date string
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString);
  return date.getDay();
}

/**
 * Check if a given date is a Sunday
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns True if the date is a Sunday
 */
export function isSunday(dateString: string): boolean {
  return getDayOfWeek(dateString) === 0;
}

/**
 * Format a date string for display
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${month} ${day}, ${year}`;
}