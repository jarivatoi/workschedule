/**
 * Schedule Calculations Hook
 * 
 * This hook provides memoized calculations for work schedule amounts including
 * monthly totals and month-to-date calculations. It processes shift data against
 * custom shift definitions and salary settings to compute accurate earnings.
 * 
 * Key Features:
 * - Real-time calculation of monthly earnings
 * - Month-to-date calculations for current month tracking
 * - Support for normal and overtime hours with different rates
 * - Handles special date considerations
 * - Optimized with React.useMemo for performance
 * 
 * Calculation Logic:
 * - Normal hours: paid at base hourly rate
 * - Overtime hours: paid at base rate × overtime multiplier (typically 1.5x)
 * - Special dates: may affect which shifts are available but don't change rates
 * 
 * Dependencies:
 * - React hooks (useMemo)
 * - Custom types for schedule data structures
 * 
 * @author NARAYYA
 * @version 3.0
 */

import { useMemo } from 'react';
import { DaySchedule, Settings, SpecialDates } from '../types';

/**
 * Calculate total amounts for schedule data
 * 
 * This hook processes all scheduled shifts for a given month and calculates
 * both the total monthly amount and month-to-date amount based on current settings.
 * 
 * @param {DaySchedule} schedule - Object mapping date strings to arrays of shift IDs
 * @param {Settings} settings - Application settings including rates and custom shifts
 * @param {SpecialDates} specialDates - Object mapping date strings to special date flags
 * @param {Date} [currentDate] - Date representing the month/year to calculate for
 * @param {number} [refreshKey] - Key to force recalculation when incremented
 * 
 * @returns {Object} Object containing totalAmount and monthToDateAmount
 * @returns {number} returns.totalAmount - Total earnings for the entire month
 * @returns {number} returns.monthToDateAmount - Earnings from start of month to today
 * 
 * Performance Notes:
 * - Uses React.useMemo for expensive calculations
 * - Only recalculates when dependencies change
 * - Includes JSON.stringify dependencies to catch deep object changes
 * 
 * Business Logic:
 * - Only includes dates from the currently viewed month/year
 * - Month-to-date includes all dates up to and including today
 * - Handles both new format (normal/overtime hours) and legacy format (total hours)
 * 
 * Example Usage:
 * ```typescript
 * const { totalAmount, monthToDateAmount } = useScheduleCalculations(
 *   schedule,
 *   settings,
 *   specialDates,
 *   new Date(2024, 0, 1), // January 2024
 *   refreshKey
 * );
 * ```
 */
export const useScheduleCalculations = (
  schedule: DaySchedule, 
  settings: Settings, 
  specialDates: SpecialDates,
  currentDate?: Date,
  refreshKey?: number // Force refresh parameter
) => {
  const { totalAmount, monthToDateAmount } = useMemo(() => {
    // Debug logging to help troubleshoot calculation issues
    console.log('🔄 Calculating amounts with data:', {
      scheduleKeys: Object.keys(schedule || {}),
      scheduleCount: Object.keys(schedule || {}).length,
      settingsBasicSalary: settings?.basicSalary,
      settingsHourlyRate: settings?.hourlyRate,
      customShifts: settings?.customShifts?.length,
      specialDatesCount: Object.keys(specialDates || {}).length,
      refreshKey
    });

    let total = 0;
    let monthToDate = 0;
    const today = new Date();
    
    // Get current month and year for filtering
    // WHY: We only want to calculate amounts for the currently viewed month
    const currentMonth = currentDate ? currentDate.getMonth() : today.getMonth();
    const currentYear = currentDate ? currentDate.getFullYear() : today.getFullYear();
    
    // Early return if no schedule data or settings
    // WHY: Prevents errors and unnecessary processing when data isn't ready
    if (!schedule || Object.keys(schedule).length === 0) {
      console.log('❌ No schedule data available');
      return { totalAmount: 0, monthToDateAmount: 0 };
    }
    
    if (!settings || !settings.customShifts || settings.customShifts.length === 0) {
      console.log('❌ No settings or custom shifts available');
      return { totalAmount: 0, monthToDateAmount: 0 };
    }

    console.log('✅ Processing schedule entries...');
    
    /**
     * Process each scheduled date and calculate earnings
     * Iterates through all schedule entries and sums up shift amounts
     */
    Object.entries(schedule).forEach(([dateKey, dayShifts]) => {
      if (!dayShifts || dayShifts.length === 0) return;
      
      console.log(`📅 Processing date ${dateKey} with shifts:`, dayShifts);
      
      // Parse the date to check if it belongs to the current month/year
      const workDate = new Date(dateKey);
      const workMonth = workDate.getMonth();
      const workYear = workDate.getFullYear();
      
      // Only include dates from the currently viewed month/year
      // WHY: Users expect calculations to be scoped to the visible month
      if (workMonth !== currentMonth || workYear !== currentYear) {
        console.log(`⏭️ Skipping ${dateKey} - not in current month/year`);
        return;
      }
      
      // Check if this date is marked as special (affects available shifts but not rates)
      const isSpecialDate = specialDates && specialDates[dateKey] === true;
      const dayOfWeek = workDate.getDay();
      
      console.log(`📊 Date ${dateKey}: dayOfWeek=${dayOfWeek}, isSpecial=${isSpecialDate}`);
      
      /**
       * Calculate earnings for each shift on this date
       * Looks up shift definition and applies appropriate rates
       */
      dayShifts.forEach(shiftId => {
        console.log(`💰 Calculating shift: ${shiftId}`);
        
        // Find the custom shift definition
        const customShift = settings.customShifts.find(shift => shift.id === shiftId);
        
        if (customShift && settings.hourlyRate) {
          // Calculate with normal and overtime hours if available (new format)
          const normalHours = customShift.normalHours || 0;
          const overtimeHours = customShift.overtimeHours || 0;
          const overtimeRate = settings.hourlyRate * (settings.overtimeMultiplier || 1.5);
          
          // Calculate amount using separate normal/overtime rates
          const shiftAmount = (normalHours * settings.hourlyRate) + (overtimeHours * overtimeRate);
          
          // Fallback to old calculation method if new fields not available
          // WHY: Maintains compatibility with shifts created before normal/overtime split
          const fallbackAmount = customShift.hours * settings.hourlyRate;
          const finalAmount = (normalHours > 0 || overtimeHours > 0) ? shiftAmount : fallbackAmount;
          
          total += finalAmount;
          
          console.log(`💰 Found custom shift ${customShift.label} (N:${normalHours}h, OT:${overtimeHours}h) = Rs ${finalAmount.toFixed(2)}`);
          
          // Check if this date is up to and INCLUDING today for month-to-date calculation
          // WHY: Month-to-date should include today's earnings if shifts are scheduled
          if (workMonth === today.getMonth() && workYear === today.getFullYear() && workDate.getDate() <= today.getDate()) {
            monthToDate += finalAmount;
            console.log(`📈 Added to month-to-date: Rs ${finalAmount.toFixed(2)}`);
          }
        } else {
          console.log(`❌ No custom shift found for ${shiftId}`);
        }
      });
    });
    
    console.log(`🎯 Final totals: Monthly=${total.toFixed(2)}, MTD=${monthToDate.toFixed(2)}`);
    
    return { totalAmount: total, monthToDateAmount: monthToDate };
  }, [
    schedule, 
    settings, 
    specialDates, 
    currentDate, 
    refreshKey,
    // Include serialized versions to catch deep object changes
    // WHY: React's dependency array doesn't detect changes inside objects/arrays
    JSON.stringify(schedule),
    JSON.stringify(settings?.customShifts),
    JSON.stringify(specialDates)
  ]);

  return { totalAmount, monthToDateAmount };
};