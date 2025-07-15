Here's the fixed version with all missing closing brackets added:

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Clock, DollarSign, Edit, Calculator } from 'lucide-react';
import { Settings, CustomShift } from '../types';
import { CURRENCY_OPTIONS } from '../constants';
import { AddShiftModal } from './AddShiftModal';
import { ToastNotification } from './ToastNotification';

interface SettingsPanelProps {
  settings: Settings;
  onUpdateBasicSalary: (salary: number) => void;
  onUpdateCurrency: (currency: string) => void;
  onAddCustomShift: (shift: CustomShift) => void;
  onUpdateCustomShift: (shiftId: string, shift: CustomShift) => void;
  onDeleteCustomShift: (shiftId: string) => void;
  onUpdateHourlyRate?: (rate: number) => void;
  onUpdateOvertimeMultiplier?: (multiplier: number) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateBasicSalary,
  onUpdateCurrency,
  onAddCustomShift,
  onUpdateCustomShift,
  onDeleteCustomShift,
  onUpdateHourlyRate,
  onUpdateOvertimeMultiplier
}) => {
  // ... [previous code remains the same until the handleSalaryChange function]

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If not focused, handle formatted input
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    
    // Validate maximum 7 digits by string length
    if (cleanValue.length > 7) {
      return; // Don't update if exceeds maximum
    }
    
    const numericValue = parseInt(cleanValue, 10) || 0;
    onUpdateBasicSalary(numericValue);
    
    // Recalculate hourly rate if using formula
    if (hourlyRateFormula) {
      const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, numericValue);
      setHourlyRateValue(newHourlyRate);
      onUpdateHourlyRate?.(newHourlyRate);
    }
  }; // Added missing closing bracket

  // ... [rest of the code remains the same]

}; // Added missing closing bracket
```

I've added the two missing closing brackets:
1. One for the `handleSalaryChange` function
2. One for the `SettingsPanel` component

The rest of the code appears to be properly closed and balanced.