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
  const [salaryDisplayValue, setSalaryDisplayValue] = useState('');
  const [salaryInputFocused, setSalaryInputFocused] = useState(false);
  const [hourlyRateFormula, setHourlyRateFormula] = useState('');
  const [hourlyRateInputFocused, setHourlyRateInputFocused] = useState(false);
  const [hourlyRateValue, setHourlyRateValue] = useState(0);
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(1.5);
  const [showAddShift, setShowAddShift] = useState(false);
  const [editingShift, setEditingShift] = useState<CustomShift | null>(null);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  // Initialize hourly rate and overtime multiplier from settings
  useEffect(() => {
    if (settings) {
      setHourlyRateValue(settings.hourlyRate || 0);
      setOvertimeMultiplier(settings.overtimeMultiplier || 1.5);
      
      // Check if hourly rate was calculated from basic salary
      if (settings.basicSalary && settings.hourlyRate) {
        const calculatedRate = (settings.basicSalary * 12) / 52 / 40;
        if (Math.abs(calculatedRate - settings.hourlyRate) < 0.01) {
          setHourlyRateFormula('x12/52/40');
        }
      }
    }
  }, [settings]);

  const formatCurrency = (amount: number, includeCurrency: boolean = true) => {
    const currency = settings?.currency || 'Rs';
    const currencyOption = CURRENCY_OPTIONS.find(c => c.code === currency);
    
    // Special formatting for Indian currency (no decimals)
    if (currency === 'INR') {
      const formatted = Math.round(amount).toLocaleString('en-IN');
      return includeCurrency ? `${currencyOption?.symbol || '₹'} ${formatted}` : formatted;
    }
    
    // US format with 2 decimal places for all other currencies
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return includeCurrency ? `${currencyOption?.symbol || currency} ${formatted}` : formatted;
  };

  const formatSalaryWithCommas = (value: number) => {
    return value.toLocaleString('en-US');
  };

  const parseSalaryFromDisplay = (displayValue: string) => {
    // Remove commas and parse as integer
    return parseInt(displayValue.replace(/,/g, ''), 10) || 0;
  };

  const parseHourlyRateFormula = (formula: string, basicSalary: number): number => {
    if (!formula.trim()) return 0;
    
    // Handle direct numeric input
    const directValue = parseFloat(formula);
    if (!isNaN(directValue) && !formula.includes('x') && !formula.includes('/')) {
      return directValue;
    }
    
    if (formula === 'x12/52/40') {
      return (basicSalary * 12) / 52 / 40;
    }
    
    // Handle other formula patterns
    if (formula.includes('x') && formula.includes('/')) {
      try {
        // Replace 'x' with '*' for evaluation
        const mathExpression = formula.replace(/x/g, '*');
        // Simple evaluation for basic formulas
        const parts = mathExpression.split('*');
        if (parts.length === 2 && parts[0] === '' && parts[1].includes('/')) {
          const divisionParts = parts[1].split('/');
          let result = basicSalary;
          for (const part of divisionParts) {
            if (part) {
              result = result / parseFloat(part);
            }
          }
          return result;
        }
      } catch (error) {
        console.error('Error parsing formula:', error);
        return 0;
      }
    }
    
    return 0;
  };

  const formatFormulaDisplay = (formula: string): string => {
    if (formula === 'x12/52/40') {
      return 'Basic Salary × 12 ÷ 52 ÷ 40';
    }
    
    // Replace 'x' with '×' and '/' with '÷' for display
    return formula.replace(/x/g, '×').replace(/\//g, '÷');
  };
  const validateFormula = (formula: string): string | null => {
    if (!formula.trim()) return null;
    
    // Allow direct numbers
    const directValue = parseFloat(formula);
    if (!isNaN(directValue) && !formula.includes('x') && !formula.includes('/')) {
      return null;
    }
    
    // Validate formula patterns
    if (formula.includes('x') || formula.includes('/')) {
      // Check for valid formula structure
      if (formula === 'x12/52/40') return null;
      
      // Check for other valid patterns
      const formulaPattern = /^x\d+(\.\d+)?(\/\d+(\.\d+)?)*$/;
      if (formulaPattern.test(formula)) return null;
      
      return 'Invalid formula syntax. Use format like "x12/52/40" or enter a direct number.';
    }
    
    return 'Invalid input. Enter a number or formula starting with "x".';
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // If focused, allow typing and clear previous formatting
    if (salaryInputFocused) {
      // Remove everything except digits, but preserve the input as string for length checking
      const cleanValue = inputValue.replace(/[^\d]/g, '');
      
      // Validate maximum 7 digits by string length, not numeric value
      if (cleanValue.length > 7) {
        return; // Don't update if exceeds maximum
      }
      
      const numericValue = parseInt(cleanValue, 10) || 0;
      
      // Store raw input for editing
      setSalaryDisplayValue(cleanValue);
      onUpdateBasicSalary(numericValue);
      
      // Recalculate hourly rate if using formula
      if (hourlyRateFormula) {
        const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, numericValue);
        setHourlyRateValue(newHourlyRate);
        onUpdateHourlyRate?.(newHourlyRate);
      }
      return;
    }
    
    // If not focused, handle formatted input
    const cleanValue = inputValue.replace(/[^\d]/g, '');
    
    // Validate maximum 7 digits by string length
    if (cleanValue.length > 7) {
    const rawInput = e.target.value;
    
    // Allow only digits - remove any non-digit characters
    const digitsOnly = rawInput.replace(/[^\d]/g, '');
    
    // Convert to number (empty string becomes 0)
    const numericValue = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
    
    // Update the salary value
    onUpdateBasicSalary(numericValue);
    
    // Update the input field with formatted value only if there are digits
    if (digitsOnly !== '') {
      e.target.value = numericValue.toLocaleString('en-US');
    } else {
      e.target.value = '';
    }
    
    // Recalculate hourly rate if using formula
    if (hourlyRateFormula && numericValue > 0) {
      const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, numericValue);
      setHourlyRateValue(newHourlyRate);
      onUpdateHourlyRate?.(newHourlyRate);
    }
  };

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHourlyRateFormula(value);
    
    // Validate formula syntax
    const error = validateFormula(value);
    setFormulaError(error);
    
    if (value) {
      const newRate = parseHourlyRateFormula(value, settings.basicSalary || 0);
      setHourlyRateValue(newRate);
      onUpdateHourlyRate?.(newRate);
    } else {
      setHourlyRateValue(0);
      onUpdateHourlyRate?.(0);
    }
  };

  const handleOvertimeMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setOvertimeMultiplier(value);
    onUpdateOvertimeMultiplier?.(value);
  };

  const handleSalaryFocus = () => {
    setSalaryInputFocused(true);
    // Show raw numeric value for editing
    const currentValue = settings.basicSalary || 0;
    setSalaryDisplayValue(currentValue > 0 ? currentValue.toString() : '');
  };

  const handleSalaryBlur = () => {
    setSalaryInputFocused(false);
    // Clear display value to show formatted version
    setSalaryDisplayValue('');
  };
  
  const handleHourlyRateFocus = () => {
    setHourlyRateInputFocused(true);
  };
  
  const handleHourlyRateBlur = () => {
    setHourlyRateInputFocused(false);
  };

  const getSalaryInputValue = () => {
    // If focused, show raw input value
    if (salaryInputFocused && salaryDisplayValue !== '') {
      return salaryDisplayValue;
    }
    
    // If not focused, show formatted value
    if (!salaryInputFocused) {
      const currentValue = settings.basicSalary || 0;
      return currentValue > 0 ? formatSalaryWithCommas(currentValue) : '';
    }
    
    // Otherwise show the formatted current value
    const currentValue = settings.basicSalary || 0;
    return salaryDisplayValue || (currentValue > 0 ? currentValue.toString() : '');
  };
  
  const getHourlyRateDisplayValue = () => {
    // If focused, show the formula for editing
    if (hourlyRateInputFocused) {
      return hourlyRateFormula;
    }
    
    // If not focused and has formula, show calculated amount
    if (hourlyRateFormula && hourlyRateValue > 0) {
      return formatCurrency(hourlyRateValue);
    }
    
    // If no formula, show empty
    return '';
  };

  const getOvertimeRate = () => {
    return hourlyRateValue * overtimeMultiplier;
  };

  const calculateShiftAmount = (normalHours: number, overtimeHours: number) => {
    return (normalHours * hourlyRateValue) + (overtimeHours * getOvertimeRate());
  };

  const openAddShiftModal = () => {
    setEditingShift(null);
    setShowAddShift(true);
  };

  const openEditShiftModal = (shift: CustomShift) => {
    setEditingShift(shift);
    setShowAddShift(true);
  };

  const handleSaveShift = (shift: CustomShift) => {
    const isEditing = !!editingShift;
    
    if (editingShift) {
      onUpdateCustomShift(editingShift.id, shift);
    } else {
      onAddCustomShift(shift);
    }
    setEditingShift(null);
    
    // Show success toast
    setToast({
      isOpen: true,
      message: isEditing ? 'Shift updated successfully!' : 'Shift added successfully!',
      type: 'success'
    });
    
    // Close all swipe actions after saving
    const shiftElements = document.querySelectorAll('.shift-item');
    shiftElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const actionsDiv = htmlElement.querySelector('.swipe-actions') as HTMLElement;
      if (actionsDiv) {
        htmlElement.style.transform = 'translateX(0)';
        actionsDiv.style.opacity = '0';
        actionsDiv.style.display = 'none';
      }
    });
    
    // Force refresh calculations after adding/updating shift
    setTimeout(() => {
      window.dispatchEvent(new Event('shiftUpdated'));
    }, 100);
  };

  const handleShiftHoursChange = (shiftId: string, normalHours: number, overtimeHours: number) => {
    const shift = settings.customShifts?.find(s => s.id === shiftId);
    if (shift) {
      const updatedShift = {
        ...shift,
        normalHours: normalHours,
        overtimeHours: overtimeHours,
        hours: normalHours + overtimeHours // Keep total for compatibility
      };
      onUpdateCustomShift(shiftId, updatedShift);
    }
  };

  const handleDeleteShift = (shiftId: string) => {
    // Close all swipe actions before deleting
    const shiftElements = document.querySelectorAll('.shift-item');
    shiftElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const actionsDiv = htmlElement.querySelector('.swipe-actions') as HTMLElement;
      if (actionsDiv) {
        htmlElement.style.transform = 'translateX(0)';
        actionsDiv.style.opacity = '0';
        actionsDiv.style.display = 'none';
      }
    });
    
    // Delete the shift
    onDeleteCustomShift(shiftId);
  };

  // Track input values to prevent leading zeros
  const [hoursInputValues, setHoursInputValues] = useState<Record<string, { normal: string; overtime: string }>>({});

  const handleHoursInputChange = (shiftId: string, type: 'normal' | 'overtime', value: string) => {
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setHoursInputValues(prev => ({
        ...prev,
        [shiftId]: {
          ...prev[shiftId],
          [type]: value
        }
      }));
      
      // Update the actual hours value
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      const currentShift = settings.customShifts?.find(s => s.id === shiftId);
      if (currentShift) {
        const normalHours = type === 'normal' ? numericValue : (currentShift.normalHours || 0);
        const overtimeHours = type === 'overtime' ? numericValue : (currentShift.overtimeHours || 0);
        handleShiftHoursChange(shiftId, normalHours, overtimeHours);
      }
    }
  };

  const handleHoursInputBlur = (shiftId: string, type: 'normal' | 'overtime', inputElement: HTMLInputElement) => {
    const value = hoursInputValues[shiftId]?.[type] || '';
    
    // If empty or zero, show as placeholder
    if (value === '' || value === '0') {
      inputElement.value = '';
      inputElement.placeholder = '0';
      inputElement.style.color = '#9CA3AF';
    } else {
      inputElement.style.color = '#374151';
      inputElement.placeholder = '';
    }
    
    // Clean up the input state
    setHoursInputValues(prev => {
      const newValues = { ...prev };
      if (newValues[shiftId]) {
        delete newValues[shiftId][type];
        if (Object.keys(newValues[shiftId]).length === 0) {
          delete newValues[shiftId];
        }
      }
      return newValues;
    });
  };

  const getHoursDisplayValue = (shift: any, type: 'normal' | 'overtime') => {
    // If we're editing this field, show the input value
    const inputValue = hoursInputValues[shift.id]?.[type];
    if (inputValue !== undefined) {
      return inputValue;
    }
    
    // For display, show empty if zero (will show placeholder)
    const hours = type === 'normal' ? (shift.normalHours || 0) : (shift.overtimeHours || 0);
    return hours === 0 ? '' : hours.toString();
  };

  const canAddMoreShifts = () => {
    return (settings.customShifts?.length || 0) < 4;
  };

  const getShiftCount = () => {
    return settings.customShifts?.length || 0;
  };

  // Mobile swipe handlers (keeping existing implementation)
  const handleTouchStart = (e: React.TouchEvent, shiftId: string) => {
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    
    element.setAttribute('data-start-x', touch.clientX.toString());
    element.setAttribute('data-start-y', touch.clientY.toString());
    element.setAttribute('data-swiping', 'false');
  };

  const handleTouchMove = (e: React.TouchEvent, shiftId: string) => {
    const touch = e.touches[0];
    const element = e.currentTarget as HTMLElement;
    const startX = parseFloat(element.getAttribute('data-start-x') || '0');
    const startY = parseFloat(element.getAttribute('data-start-y') || '0');
    
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
      element.setAttribute('data-swiping', 'true');
      
      // Show delete/edit buttons when swiping left
      if (deltaX < -30) {
        const translateX = Math.max(deltaX, -100);
        element.style.transform = `translateX(${translateX}px)`;
        const actionsDiv = element.querySelector('.swipe-actions') as HTMLElement;
        if (actionsDiv) {
          const opacity = Math.min(Math.abs(translateX) / 100, 1);
          actionsDiv.style.opacity = opacity.toString();
          actionsDiv.style.display = opacity > 0.3 ? 'flex' : 'none';
        }
      } else {
        element.style.transform = 'translateX(0)';
        const actionsDiv = element.querySelector('.swipe-actions') as HTMLElement;
        if (actionsDiv) {
          actionsDiv.style.opacity = '0';
          actionsDiv.style.display = 'none';
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, shiftId: string) => {
    const element = e.currentTarget as HTMLElement;
    const isSwiping = element.getAttribute('data-swiping') === 'true';
    const actionsDiv = element.querySelector('.swipe-actions') as HTMLElement;
    const currentOpacity = parseFloat(actionsDiv?.style.opacity || '0');
    
    if (!isSwiping || currentOpacity < 0.3) {
      // Reset if not swiped enough
      element.style.transform = 'translateX(0)';
      if (actionsDiv) {
        actionsDiv.style.opacity = '0';
        actionsDiv.style.display = 'none';
      }
    } else {
      // Keep actions visible and snap to position
      element.style.transform = 'translateX(-100px)';
      if (actionsDiv) {
        actionsDiv.style.opacity = '1';
        actionsDiv.style.display = 'flex';
      }
    }
    
    element.removeAttribute('data-start-x');
    element.removeAttribute('data-start-y');
    element.removeAttribute('data-swiping');
  };

  // Desktop click handlers
  const handleShiftClick = (e: React.MouseEvent, shiftId: string) => {
    // Only handle click if not on mobile (no touch events)
    if ('ontouchstart' in window) return;
    
    const element = e.currentTarget as HTMLElement;
    const actionsDiv = element.querySelector('.swipe-actions') as HTMLElement;
    
    if (actionsDiv) {
      const isVisible = actionsDiv.style.display === 'flex' && actionsDiv.style.opacity === '1';
      
      if (isVisible) {
        // Hide actions
        element.style.transform = 'translateX(0)';
        actionsDiv.style.opacity = '0';
        actionsDiv.style.display = 'none';
      } else {
        // Show actions
        element.style.transform = 'translateX(-100px)';
        actionsDiv.style.opacity = '1';
        actionsDiv.style.display = 'flex';
      }
    }
  };

  // Close actions when clicking outside
  const handleDocumentClick = useCallback((e: MouseEvent) => {
    const shiftElements = document.querySelectorAll('.shift-item');
    shiftElements.forEach(element => {
      if (!element.contains(e.target as Node)) {
        const htmlElement = element as HTMLElement;
        const actionsDiv = htmlElement.querySelector('.swipe-actions') as HTMLElement;
        if (actionsDiv) {
          htmlElement.style.transform = 'translateX(0)';
          actionsDiv.style.opacity = '0';
          actionsDiv.style.display = 'none';
        }
      }
    });
  }, []);

  // Close actions when touching outside (mobile)
  const handleDocumentTouch = useCallback((e: TouchEvent) => {
    const shiftElements = document.querySelectorAll('.shift-item');
    shiftElements.forEach(element => {
      if (!element.contains(e.target as Node)) {
        const htmlElement = element as HTMLElement;
        const actionsDiv = htmlElement.querySelector('.swipe-actions') as HTMLElement;
        if (actionsDiv && actionsDiv.style.display === 'flex') {
          htmlElement.style.transform = 'translateX(0)';
          actionsDiv.style.opacity = '0';
          actionsDiv.style.display = 'none';
        }
      }
    });
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentTouch);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentTouch);
    };
  }, [handleDocumentClick, handleDocumentTouch]);

  // Show error if settings are not properly loaded
  if (!settings) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-red-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-red-900 text-center">Settings Loading Error</h2>
        </div>
        <div className="text-center p-6 bg-red-50 rounded-lg">
          <p className="text-red-700 mb-4">Settings data is not available.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-center space-x-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-indigo-600" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">Settings & Configuration</h2>
      </div>

      {/* Currency Selection */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 text-center flex items-center justify-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <span>Currency Settings</span>
        </h3>
        <div className="max-w-xs mx-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            Select Currency
          </label>
          <select
            value={settings.currency || 'Rs'}
            onChange={(e) => onUpdateCurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-base font-medium bg-white"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} - {currency.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Salary and Rate Configuration */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 text-center">Salary & Rate Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Basic Salary (Monthly)
            </label>
            <div className="relative max-w-xs mx-auto">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                {CURRENCY_OPTIONS.find(c => c.code === settings.currency)?.symbol || 'Rs'}
              </div>
              <input
                type="text"
                inputMode="numeric"
                defaultValue={settings.basicSalary > 0 ? settings.basicSalary.toLocaleString('en-US') : ''}
                onChange={handleSalaryChange}
                onFocus={(e) => {
                  // Show raw number when focused for easier editing
                  if (settings.basicSalary > 0) {
                    e.target.value = settings.basicSalary.toString();
                  }
                }}
                onBlur={(e) => {
                  // Format with commas when focus is lost
                  const value = e.target.value.replace(/[^\d]/g, '');
                  if (value !== '' && value !== '0') {
                    e.target.value = parseInt(value, 10).toLocaleString('en-US');
                  } else {
                    e.target.value = '';
                  }
                }}
                onFocus={handleSalaryFocus}
                onBlur={handleSalaryBlur}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-base font-medium"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Maximum: 9,999,999 (7 digits)
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Hourly Rate
            </label>
            <div className="relative max-w-xs mx-auto mb-2">
              {hourlyRateInputFocused && (
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                  Basic Salary
                </div>
              )}
              <input
                type="text"
                value={getHourlyRateDisplayValue()}
                onChange={handleHourlyRateChange}
                onFocus={handleHourlyRateFocus}
                onBlur={handleHourlyRateBlur}
                className={`w-full pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base font-medium ${
                  hourlyRateInputFocused ? 'pl-24 text-center' : 'pl-4 text-center'
                } ${formulaError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                placeholder={hourlyRateInputFocused ? "" : "Enter formula or amount"}
                style={{
                  color: (hourlyRateInputFocused ? hourlyRateFormula : hourlyRateValue > 0) ? '#374151' : '#9CA3AF'
                }}
              />
            </div>
            
            {/* Formula Error */}
            {formulaError && (
              <div className="text-xs text-red-600 text-center mb-2">
                {formulaError}
              </div>
            )}
            
            {/* Formula Display */}
            {hourlyRateFormula && (
              <div className="text-xs text-gray-600 text-center mb-2">
                Formula: {formatFormulaDisplay(hourlyRateFormula)}
              </div>
            )}
            
            {/* Calculated Value Display */}
            {!hourlyRateInputFocused && hourlyRateValue > 0 && (
              <div className="text-sm font-medium text-center text-indigo-600">
                = {formatCurrency(hourlyRateValue)}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1 text-center">
              Enter formula (e.g., x12/52/40) or direct value
            </p>
          </div>
        </div>
        
        {/* Overtime Rate */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Overtime Rate Multiplier
            </label>
            <div className="relative max-w-xs mx-auto">
              <input
                type="number"
                step="0.1"
                min="1"
                value={overtimeMultiplier}
                onChange={handleOvertimeMultiplierChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-base font-medium"
                placeholder="1.5"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Standard overtime is 1.5x regular rate
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Overtime Rate
            </label>
            <div className="relative max-w-xs mx-auto">
              <input
                type="text"
                value={formatCurrency(getOvertimeRate())}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-center text-base font-medium"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Hourly Rate × Overtime Multiplier
            </p>
          </div>
        </div>
      </div>

      {/* Shift Management */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Shift Management{getShiftCount() > 0 ? ` (${getShiftCount()})` : ''}</span>
          </h3>
        </div>

        {/* Shift List */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="max-h-80 overflow-y-auto space-y-3">
            {settings.customShifts && settings.customShifts.length > 0 ? (
              settings.customShifts.map((shift) => (
                <div 
                  key={shift.id} 
                  className="shift-item relative overflow-hidden rounded-lg border bg-white cursor-pointer"
                  onClick={(e) => handleShiftClick(e, shift.id)}
                  onTouchStart={(e) => handleTouchStart(e, shift.id)}
                  onTouchMove={(e) => handleTouchMove(e, shift.id)}
                  onTouchEnd={(e) => handleTouchEnd(e, shift.id)}
                  style={{ 
                    transition: 'transform 0.2s ease-out',
                    touchAction: 'none',
                    userSelect: 'none'
                  }}
                >
                  {/* Swipe Actions Background */}
                  <div className="swipe-actions absolute inset-y-0 right-0 flex items-center justify-center space-x-2 px-3 bg-gradient-to-l from-red-500 to-blue-500"
                       style={{ 
                         opacity: 0,
                         display: 'none',
                         width: '100px',
                         zIndex: 10
                       }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        openEditShiftModal(shift);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        openEditShiftModal(shift);
                      }}
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                      style={{ 
                        minWidth: '44px', 
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteShift(shift.id);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteShift(shift.id);
                      }}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
                      style={{ 
                        minWidth: '44px', 
                        minHeight: '44px',
                        touchAction: 'manipulation',
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Shift content */}
                  <div className="relative bg-white p-4" style={{ zIndex: 5 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold text-gray-800">{shift.label}</span>
                        <div className="text-sm text-gray-600">
                          {shift.fromTime} to {shift.toTime}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {shift.applicableDays ? (
                            Object.entries(shift.applicableDays)
                              .filter(([_, enabled]) => enabled)
                              .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1))
                              .join(', ')
                          ) : (
                            'All days'
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Normal Hours</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getHoursDisplayValue(shift, 'normal')}
                          placeholder={shift.normalHours === 0 ? '0' : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              handleHoursInputChange(shift.id, 'normal', value);
                            }
                          }}
                          onFocus={(e) => {
                            const input = e.target as HTMLInputElement;
                            const currentValue = shift.normalHours || 0;
                            
                            if (currentValue === 0) {
                              input.value = '';
                              input.placeholder = '0';
                              input.style.color = '#9CA3AF';
                              setHoursInputValues(prev => ({ 
                                ...prev, 
                                [shift.id]: { ...prev[shift.id], normal: '' }
                              }));
                            } else {
                              input.value = currentValue.toString();
                              input.placeholder = '';
                              input.style.color = '#374151';
                              setHoursInputValues(prev => ({ 
                                ...prev, 
                                [shift.id]: { ...prev[shift.id], normal: currentValue.toString() }
                              }));
                            }
                          }}
                          onBlur={(e) => {
                            handleHoursInputBlur(shift.id, 'normal', e.target as HTMLInputElement);
                          }}
                          className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-sm hours-input"
                          style={{
                            color: (shift.normalHours || 0) === 0 ? '#9CA3AF' : '#374151'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Overtime Hours</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getHoursDisplayValue(shift, 'overtime')}
                          placeholder={shift.overtimeHours === 0 ? '0' : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              handleHoursInputChange(shift.id, 'overtime', value);
                            }
                          }}
                          onFocus={(e) => {
                            const input = e.target as HTMLInputElement;
                            const currentValue = shift.overtimeHours || 0;
                            
                            if (currentValue === 0) {
                              input.value = '';
                              input.placeholder = '0';
                              input.style.color = '#9CA3AF';
                              setHoursInputValues(prev => ({ 
                                ...prev, 
                                [shift.id]: { ...prev[shift.id], overtime: '' }
                              }));
                            } else {
                              input.value = currentValue.toString();
                              input.placeholder = '';
                              input.style.color = '#374151';
                              setHoursInputValues(prev => ({ 
                                ...prev, 
                                [shift.id]: { ...prev[shift.id], overtime: currentValue.toString() }
                              }));
                            }
                          }}
                          onBlur={(e) => {
                            handleHoursInputBlur(shift.id, 'overtime', e.target as HTMLInputElement);
                          }}
                          className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-sm hours-input"
                          style={{
                            color: (shift.overtimeHours || 0) === 0 ? '#9CA3AF' : '#374151'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Total Amount</label>
                        <span className="px-2 py-2 bg-gray-100 rounded text-center text-sm font-mono text-gray-700 block">
                          {formatCurrency(calculateShiftAmount(shift.normalHours || 0, shift.overtimeHours || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No shifts configured</p>
                <p className="text-sm">Add your first shift to get started</p>
              </div>
            )}
          </div>

          {/* Add Shift Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {canAddMoreShifts() ? (
              <button
                onClick={openAddShiftModal}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Shift</span>
              </button>
            ) : (
              <div className="text-center text-sm text-gray-500 py-2">
                Maximum 4 shifts reached
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Shift Modal Component */}
      <AddShiftModal
        isOpen={showAddShift}
        onClose={() => {
          setShowAddShift(false);
          setEditingShift(null);
        }}
        onSave={handleSaveShift}
        editingShift={editingShift}
        settings={settings}
        hourlyRate={hourlyRateValue}
        overtimeRate={getOvertimeRate()}
      />
      
      {/* Toast Notification */}
      <ToastNotification
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
      
      <style jsx>{`
        .hours-input {
          -webkit-appearance: none !important;
          -moz-appearance: textfield !important;
          appearance: none !important;
        }
        .hours-input::-webkit-outer-spin-button,
        .hours-input::-webkit-inner-spin-button {
          -webkit-appearance: none !important;
          display: none !important;
          margin: 0 !important;
        }
        .hours-input[type=text] {
          -moz-appearance: textfield !important;
        }
        .hours-input::placeholder {
          text-align: center !important;
        }
        .hours-input::-webkit-input-placeholder {
          text-align: center !important;
        }
        .hours-input::-moz-placeholder {
          text-align: center !important;
        }
      `}</style>
    </div>
  );
};