import { useMemo } from 'react';
import { DaySchedule, Settings, SpecialDates } from '../types';

export const useScheduleCalculations = (
  schedule: DaySchedule, 
  settings: Settings, 
  specialDates: SpecialDates,
  currentDate?: Date,
  refreshKey?: number // Add refresh key parameter
) => {
  const { totalAmount, monthToDateAmount } = useMemo(() => {
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
    const currentMonth = currentDate ? currentDate.getMonth() : today.getMonth();
    const currentYear = currentDate ? currentDate.getFullYear() : today.getFullYear();
    
    // Early return if no schedule data or settings
    if (!schedule || Object.keys(schedule).length === 0) {
      console.log('❌ No schedule data available');
      return { totalAmount: 0, monthToDateAmount: 0 };
    }
    
    if (!settings || !settings.customShifts || settings.customShifts.length === 0) {
      console.log('❌ No settings or custom shifts available');
      return { totalAmount: 0, monthToDateAmount: 0 };
    }

    console.log('✅ Processing schedule entries...');
    
    Object.entries(schedule).forEach(([dateKey, dayShifts]) => {
      if (!dayShifts || dayShifts.length === 0) return;
      
      console.log(`📅 Processing date ${dateKey} with shifts:`, dayShifts);
      
      // Parse the date to check if it belongs to the current month/year
      const workDate = new Date(dateKey);
      const workMonth = workDate.getMonth();
      const workYear = workDate.getFullYear();
      
      // Only include dates from the currently viewed month/year
      if (workMonth !== currentMonth || workYear !== currentYear) {
        console.log(`⏭️ Skipping ${dateKey} - not in current month/year`);
        return;
      }
      
      // Check if this date is marked as special
      const isSpecialDate = specialDates && specialDates[dateKey] === true;
      const dayOfWeek = workDate.getDay();
      
      console.log(`📊 Date ${dateKey}: dayOfWeek=${dayOfWeek}, isSpecial=${isSpecialDate}`);
      
      // Calculate each shift using custom shifts
      dayShifts.forEach(shiftId => {
        console.log(`💰 Calculating shift: ${shiftId}`);
        
        // Find the custom shift
        const customShift = settings.customShifts.find(shift => shift.id === shiftId);
        
        if (customShift && settings.hourlyRate) {
          const shiftAmount = customShift.hours * settings.hourlyRate;
          total += shiftAmount;
          
          console.log(`💰 Found custom shift ${customShift.label} (${customShift.hours}h) = Rs ${shiftAmount.toFixed(2)}`);
          
          // Check if this date is up to and INCLUDING today for month-to-date calculation
          if (workMonth === today.getMonth() && workYear === today.getFullYear() && workDate.getDate() <= today.getDate()) {
            monthToDate += shiftAmount;
            console.log(`📈 Added to month-to-date: Rs ${shiftAmount.toFixed(2)}`);
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
    // Add these to ensure recalculation when data structure changes
    JSON.stringify(schedule),
    JSON.stringify(settings?.customShifts),
    JSON.stringify(specialDates)
  ]);

  return { totalAmount, monthToDateAmount };
};