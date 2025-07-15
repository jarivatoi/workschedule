import { useState, useEffect, useCallback } from 'react';
import { workScheduleDB } from '../utils/indexedDB';
import { DEFAULT_SHIFT_COMBINATIONS } from '../constants';

export function useIndexedDB<T>(
  key: string,
  initialValue: T,
  storageType: 'setting' | 'metadata' = 'setting'
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load value from IndexedDB
  const loadValue = useCallback(async () => {
    try {
      console.log(`🔄 Loading ${storageType} "${key}" from IndexedDB...`);
      setIsLoading(true);
      setError(null);
      
      await workScheduleDB.init();
      
      const storedValue = storageType === 'setting' 
        ? await workScheduleDB.getSetting<T>(key)
        : await workScheduleDB.getMetadata<T>(key);
      
      console.log(`📦 Retrieved ${storageType} "${key}":`, storedValue);
      
      if (storedValue !== null) {
        // Special handling for workSettings to ensure shift combinations are present
        if (key === 'workSettings' && typeof storedValue === 'object' && storedValue !== null) {
          const settings = storedValue as any;
          
          // Check if shift combinations are missing or empty
          if (!settings.shiftCombinations || settings.shiftCombinations.length === 0) {
            console.log(`🔧 Fixing missing shift combinations for ${key}`);
            const fixedSettings = {
              currency: result.currency || 'Rs',
              shiftCombinations: DEFAULT_SHIFT_COMBINATIONS
            };
            
            // Save the fixed settings back to IndexedDB
            await workScheduleDB.setSetting(key, fixedSettings as T);
            setValue(fixedSettings as T);
            console.log(`✅ Fixed and saved ${key} with default shift combinations`);
          } else {
            setValue(storedValue);
            console.log(`✅ Loaded ${storageType} "${key}" successfully`);
          }
        } else {
          setValue(storedValue);
          console.log(`✅ Loaded ${storageType} "${key}" successfully`);
        }
      } else {
        // If no stored value, use the initial value and save it
        console.log(`🆕 No stored value for ${storageType} "${key}", using initial value:`, initialValue);
        setValue(initialValue);
        if (storageType === 'setting') {
          await workScheduleDB.setSetting(key, initialValue);
        } else {
          await workScheduleDB.setMetadata(key, initialValue);
        }
        console.log(`💾 Saved initial value for ${storageType} "${key}"`);
      }
    } catch (err) {
      console.error(`❌ Error loading ${key} from IndexedDB:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // On error, still set the initial value so the app doesn't break
      setValue(initialValue);
    } finally {
      setIsLoading(false);
    }
  }, [key, storageType, JSON.stringify(initialValue)]); // Include serialized initialValue

  // Load initial value from IndexedDB
  useEffect(() => {
    loadValue();
  }, [loadValue]);

  // Update value and save to IndexedDB
  const updateValue = useCallback(async (newValue: T | ((prev: T) => T)) => {
    try {
      setError(null);
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value) 
        : newValue;
      
      console.log(`💾 Saving ${storageType} "${key}":`, valueToStore);
      setValue(valueToStore);
      
      if (storageType === 'setting') {
        await workScheduleDB.setSetting(key, valueToStore);
      } else {
        await workScheduleDB.setMetadata(key, valueToStore);
      }
      console.log(`✅ Saved ${storageType} "${key}" successfully`);
    } catch (err) {
      console.error(`❌ Error saving ${key} to IndexedDB:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [key, value, storageType]);

  return [value, updateValue, { isLoading, error, refresh: loadValue }] as const;
}

export function useScheduleData() {
  const [schedule, setSchedule] = useState<Record<string, string[]>>({});
  const [specialDates, setSpecialDates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      console.log('🔄 Loading schedule data from IndexedDB...');
      setIsLoading(true);
      setError(null);
      
      await workScheduleDB.init();
      
      const [scheduleData, specialDatesData] = await Promise.all([
        workScheduleDB.getSchedule(),
        workScheduleDB.getSpecialDates()
      ]);
      
      console.log('📦 Retrieved schedule data:', {
        scheduleEntries: Object.keys(scheduleData).length,
        specialDatesEntries: Object.keys(specialDatesData).length
      });
      
      setSchedule(scheduleData);
      setSpecialDates(specialDatesData);
      console.log('✅ Schedule data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading schedule data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSchedule = useCallback(async (newSchedule: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => {
    try {
      setError(null);
      const scheduleToStore = typeof newSchedule === 'function' 
        ? newSchedule(schedule) 
        : newSchedule;
      
      console.log('💾 Saving schedule data:', {
        entries: Object.keys(scheduleToStore).length
      });
      setSchedule(scheduleToStore);
      await workScheduleDB.setSchedule(scheduleToStore);
      console.log('✅ Schedule data saved successfully');
    } catch (err) {
      console.error('❌ Error saving schedule:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [schedule]);

  const updateSpecialDates = useCallback(async (newSpecialDates: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    try {
      setError(null);
      const specialDatesToStore = typeof newSpecialDates === 'function' 
        ? newSpecialDates(specialDates) 
        : newSpecialDates;
      
      console.log('💾 Saving special dates data:', {
        entries: Object.keys(specialDatesToStore).length
      });
      setSpecialDates(specialDatesToStore);
      await workScheduleDB.setSpecialDates(specialDatesToStore);
      console.log('✅ Special dates data saved successfully');
    } catch (err) {
      console.error('❌ Error saving special dates:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [specialDates]);

  return {
    schedule,
    specialDates,
    setSchedule: updateSchedule,
    setSpecialDates: updateSpecialDates,
    isLoading,
    error,
    refreshData: loadData // Export the refresh function
  };
}