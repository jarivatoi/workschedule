import { DEFAULT_SHIFT_COMBINATIONS } from '../constants';

interface DBSchema {
  schedule: {
    key: string;
    value: {
      date: string;
      shifts: string[];
    };
  };
  specialDates: {
    key: string;
    value: {
      date: string;
      isSpecial: boolean;
    };
  };
  settings: {
    key: string;
    value: any;
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

class WorkScheduleDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'WorkScheduleDB';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('schedule')) {
          db.createObjectStore('schedule', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('specialDates')) {
          db.createObjectStore('specialDates', { keyPath: 'date' });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async getSchedule(): Promise<Record<string, string[]>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['schedule'], 'readonly');
      const store = transaction.objectStore('schedule');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, string[]> = {};
        request.result.forEach((item: { date: string; shifts: string[] }) => {
          result[item.date] = item.shifts;
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get schedule'));
      };
    });
  }

  async setSchedule(schedule: Record<string, string[]>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['schedule'], 'readwrite');
      const store = transaction.objectStore('schedule');

      // Clear existing data
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add new data
        const promises: Promise<void>[] = [];
        
        Object.entries(schedule).forEach(([date, shifts]) => {
          if (shifts.length > 0) {
            promises.push(new Promise((resolveItem, rejectItem) => {
              const addRequest = store.add({ date, shifts });
              addRequest.onsuccess = () => resolveItem();
              addRequest.onerror = () => rejectItem(new Error(`Failed to add schedule for ${date}`));
            }));
          }
        });

        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      };

      clearRequest.onerror = () => {
        reject(new Error('Failed to clear schedule'));
      };
    });
  }

  async getSpecialDates(): Promise<Record<string, boolean>> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['specialDates'], 'readonly');
      const store = transaction.objectStore('specialDates');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, boolean> = {};
        request.result.forEach((item: { date: string; isSpecial: boolean }) => {
          result[item.date] = item.isSpecial;
        });
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error('Failed to get special dates'));
      };
    });
  }

  async setSpecialDates(specialDates: Record<string, boolean>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['specialDates'], 'readwrite');
      const store = transaction.objectStore('specialDates');

      // Clear existing data
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add new data
        const promises: Promise<void>[] = [];
        
        Object.entries(specialDates).forEach(([date, isSpecial]) => {
          if (isSpecial) {
            promises.push(new Promise((resolveItem, rejectItem) => {
              const addRequest = store.add({ date, isSpecial });
              addRequest.onsuccess = () => resolveItem();
              addRequest.onerror = () => rejectItem(new Error(`Failed to add special date for ${date}`));
            }));
          }
        });

        Promise.all(promises)
          .then(() => resolve())
          .catch(reject);
      };

      clearRequest.onerror = () => {
        reject(new Error('Failed to clear special dates'));
      };
    });
  }

  async getSetting<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result ? request.result.value : null;
        
        // Special handling for workSettings to ensure shift combinations are present
        if (key === 'workSettings' && result && typeof result === 'object') {
          // Ensure currency and customShifts exist, remove shiftCombinations dependency
          if (!result.currency || !result.customShifts || !result.shiftCombinations) {
            const fixedResult = {
              ...result,
              shiftCombinations: result.shiftCombinations || [], // Keep empty for compatibility
              currency: result.currency || 'Rs.',
              customShifts: result.customShifts || []
            };
            
            this.setSetting(key, fixedResult as T).catch(err => 
              console.error('Failed to save fixed settings:', err)
            );
            
            resolve(fixedResult);
            return;
          }
        }
        
        resolve(result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get setting: ${key}`));
      };
    });
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set setting: ${key}`));
      };
    });
  }

  async getMetadata<T>(key: string): Promise<T | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get metadata: ${key}`));
      };
    });
  }

  async setMetadata<T>(key: string, value: T): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to set metadata: ${key}`));
      };
    });
  }

  async exportAllData(): Promise<any> {
    console.log('🔄 Exporting all data from IndexedDB...');
    
    const [schedule, specialDates, settings, scheduleTitle] = await Promise.all([
      this.getSchedule(),
      this.getSpecialDates(),
      this.getSetting('workSettings'),
      this.getMetadata('scheduleTitle')
    ]);

    // Ensure settings have shift combinations
    const finalSettings = settings || {
      basicSalary: 35000,
      hourlyRate: 173.08,
      shiftCombinations: DEFAULT_SHIFT_COMBINATIONS,
      currency: 'Rs',
      customShifts: []
    };

    // If settings exist but don't have shift combinations, add them
    if (finalSettings && (!finalSettings.shiftCombinations || finalSettings.shiftCombinations.length === 0)) {
      finalSettings.shiftCombinations = DEFAULT_SHIFT_COMBINATIONS;
    }
    
    // Ensure currency and customShifts exist
    if (!finalSettings.currency) {
      finalSettings.currency = 'Rs';
    }
    if (!finalSettings.customShifts) {
      finalSettings.customShifts = [];
    }

    const exportData = {
      schedule,
      specialDates,
      settings: finalSettings,
      scheduleTitle: scheduleTitle || 'Work Schedule',
      exportDate: new Date().toISOString(),
      version: '3.0'
    };

    console.log('📦 Export data prepared:', {
      scheduleEntries: Object.keys(exportData.schedule).length,
      specialDatesEntries: Object.keys(exportData.specialDates).length,
      settingsIncluded: !!exportData.settings,
      shiftCombinations: exportData.settings?.shiftCombinations?.length || 0
    });

    return exportData;
  }

  async importAllData(data: any): Promise<void> {
    console.log('🔄 Importing data to IndexedDB:', {
      hasSchedule: !!data.schedule,
      hasSpecialDates: !!data.specialDates,
      hasSettings: !!data.settings,
      hasTitle: !!data.scheduleTitle,
      version: data.version
    });

    const promises: Promise<void>[] = [];

    if (data.schedule) {
      console.log('📅 Importing schedule with', Object.keys(data.schedule).length, 'entries');
      promises.push(this.setSchedule(data.schedule));
    }

    if (data.specialDates) {
      console.log('⭐ Importing special dates with', Object.keys(data.specialDates).length, 'entries');
      promises.push(this.setSpecialDates(data.specialDates));
    }

    if (data.settings) {
      // Ensure imported settings have shift combinations
      const settingsToImport = { ...data.settings };
      if (!settingsToImport.shiftCombinations || settingsToImport.shiftCombinations.length === 0) {
        console.log('🔧 Adding missing shift combinations to imported settings');
        settingsToImport.shiftCombinations = DEFAULT_SHIFT_COMBINATIONS;
      }
      
      console.log('⚙️ Importing settings:', {
        basicSalary: settingsToImport.basicSalary,
        hourlyRate: settingsToImport.hourlyRate,
        shiftCombinations: settingsToImport.shiftCombinations?.length || 0
      });
      promises.push(this.setSetting('workSettings', settingsToImport));
    }

    if (data.scheduleTitle) {
      console.log('📝 Importing schedule title:', data.scheduleTitle);
      promises.push(this.setMetadata('scheduleTitle', data.scheduleTitle));
    }

    await Promise.all(promises);
    console.log('✅ All data imported successfully to IndexedDB');
  }

  async getStorageInfo(): Promise<{ used: number; available: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        console.log('📊 Storage estimate:', estimate);
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0
        };
      } catch (error) {
        console.warn('Storage estimate not available:', error);
      }
    }
    
    // Fallback estimates - iPhone Safari often can't provide exact quota
    console.log('📊 Using fallback storage estimate for iPhone Safari');
    return {
      used: 0,
      available: 50 * 1024 * 1024 // 50MB fallback (actual is much more)
    };
  }
}

export const workScheduleDB = new WorkScheduleDB();