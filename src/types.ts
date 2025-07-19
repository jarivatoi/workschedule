export interface Shift {
  id: string;
  label: string;
  time: string;
  color: string;
  displayColor: string;
}

export interface DaySchedule {
  [key: string]: string[]; // date string -> array of shift IDs
}

export interface SpecialDates {
  [key: string]: boolean; // date string -> is special date
}

export interface ShiftCombination {
  id: string;
  combination: string;
  hours: number;
  enabled: boolean;
  isCustom?: boolean;
}

export interface Settings {
  basicSalary: number;
  hourlyRate: number;
  overtimeMultiplier?: number;
  shiftCombinations: ShiftCombination[];
  currency: string;
  customShifts: CustomShift[];
}

export interface CustomShift {
  id: string;
  label: string;
  fromTime: string;
  toTime: string;
  hours: number;
  normalHours?: number;
  overtimeHours?: number;
  normalAllowanceHours?: number;
  overtimeAllowanceHours?: number;
  enabled: boolean;
  applicableDays?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
    specialDay: boolean;
  };
}

export interface ExportData {
  schedule: DaySchedule;
  specialDates: SpecialDates;
  settings: Settings;
  scheduleTitle: string;
  exportDate: string;
  version: string;
}