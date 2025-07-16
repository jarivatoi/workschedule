import React, { useState, useCallback, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Clock, DollarSign, Edit, Calculator } from 'lucide-react';
import { Settings, CustomShift } from '../types';
import { CURRENCY_OPTIONS } from '../constants';
import { AddShiftModal } from './AddShiftModal';
import { ToastNotification } from './ToastNotification';
import { SwipeableShiftCard } from './SwipeableShiftCard';

interface SettingsPanelProps {
  settings: Settings;
  onUpdateBasicSalary: (salary: number) => void;
  onUpdateCurrency: (currency: string) => void;
  onAddCustomShift: (shift: CustomShift) => void;
  onUpdateCustomShift: (shiftId: string, shift: CustomShift) => void;
  onDeleteCustomShift: (shiftId: string) => void;
  onUpdateHourlyRate?: (rate: number) => void;
  onUpdateOvertimeMultiplier?: (multiplier: number) => void;
  onUpdateShiftHours?: (combinationId: string, hours: number) => void;
  onUpdateShiftEnabled?: (combinationId: string, enabled: boolean) => void;
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
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<CustomShift | null>(null);
  const [hourlyRateFormula, setHourlyRateFormula] = useState('');
  const [hourlyRateValue, setHourlyRateValue] = useState(settings.hourlyRate || 0);
  const [formulaError, setFormulaError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setHourlyRateValue(settings.hourlyRate || 0);
  }, [settings.hourlyRate]);

  const parseHourlyRateFormula = useCallback((formula: string, basicSalary: number): number => {
    try {
      const expression = formula.toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');
      const result = Function(`"use strict"; return (${basicSalary} ${expression})`)();
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch {
      return 0;
    }
  }, []);

  const validateFormula = useCallback((formula: string): boolean => {
    try {
      const expression = formula.toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');
      const testResult = Function(`"use strict"; return (1000 ${expression})`)();
      return !isNaN(testResult) && isFinite(testResult);
    } catch {
      return false;
    }
  }, []);

  const handleBasicSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, ''); // Only digits, no decimals
    const numericValue = parseInt(value) || 0;
    onUpdateBasicSalary(numericValue);
    
    if (hourlyRateFormula) {
      const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, numericValue);
      setHourlyRateValue(newHourlyRate);
      onUpdateHourlyRate?.(newHourlyRate);
    }
  };

  const handleBasicSalaryFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = settings.basicSalary.toString(); // No decimals for whole numbers
  };

  const handleBasicSalaryBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = settings.basicSalary.toLocaleString('en-US'); // No decimal places for whole numbers
  };

  const handleHourlyRateFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formula = e.target.value;
    setHourlyRateFormula(formula);
    setFormulaError('');
  };

  const handleHourlyRateFormulaKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (hourlyRateFormula && !validateFormula(hourlyRateFormula)) {
        setFormulaError('Invalid formula syntax. Use operators: +, -, *, /, x, ÷');
        return;
      }
      
      if (hourlyRateFormula) {
        const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, settings.basicSalary);
        setHourlyRateValue(newHourlyRate);
        onUpdateHourlyRate?.(newHourlyRate);
      }
    }
  };

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid decimal numbers with up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      setHourlyRateValue(numericValue);
      onUpdateHourlyRate?.(numericValue);
      setHourlyRateFormula('');
    }
  };

  const handleHourlyRateFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Show the actual numeric value when focused (remove formatting)
    e.target.value = hourlyRateValue.toString();
  };

  const handleHourlyRateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Format to 2 decimal places when focus is lost
    const numericValue = parseFloat(e.target.value) || 0;
    setHourlyRateValue(value);
    onUpdateHourlyRate?.(value);
    e.target.value = numericValue.toFixed(2);
  };

  const handleOvertimeMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 1;
    onUpdateOvertimeMultiplier?.(value);
  };

  const handleAddShift = (shift: CustomShift) => {
    onAddCustomShift(shift);
    setIsAddShiftModalOpen(false);
    setToast({ message: 'Custom shift added successfully!', type: 'success' });
  };

  const handleEditShift = (shift: CustomShift) => {
    setEditingShift(shift);
    setIsAddShiftModalOpen(true);
  };

  const handleUpdateShift = (shift: CustomShift) => {
    if (editingShift) {
      onUpdateCustomShift(editingShift.id, shift);
      setEditingShift(null);
      setIsAddShiftModalOpen(false);
      setToast({ message: 'Custom shift updated successfully!', type: 'success' });
    }
  };

  const handleDeleteShift = (shiftId: string) => {
    onDeleteCustomShift(shiftId);
    setToast({ message: 'Custom shift deleted successfully!', type: 'success' });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-center space-x-3 mb-8">
        <SettingsIcon className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900 text-center">Settings</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Basic Salary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Basic Salary
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
              <span className="text-gray-500 font-medium">{settings.currency}</span>
            </div>
            <input
              type="text"
              defaultValue={settings.basicSalary.toLocaleString('en-US')} // No decimals
              onChange={handleBasicSalaryChange}
              onFocus={handleBasicSalaryFocus}
              onBlur={handleBasicSalaryBlur}
              placeholder="0"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-lg"
            />
          </div>
        </div>

        {/* Currency Selection */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => onUpdateCurrency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency.code} value={currency.symbol}>
                {currency.symbol} - {currency.name}
              </option>
            ))}
          </select>
        </div>

        {/* Hourly Rate */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Hourly Rate
          </label>
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                <span className="text-gray-500 font-medium">{settings.currency}</span>
              </div>
              <input
                type="number"
                value={hourlyRateValue}
                onChange={handleHourlyRateChange}
                onFocus={handleHourlyRateFocus}
                onBlur={handleHourlyRateBlur}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
              />
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">OR</span>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                value={hourlyRateFormula}
                onChange={handleHourlyRateFormulaChange}
                onKeyDown={handleHourlyRateFormulaKeyDown}
                placeholder="e.g., x12/52/40 (multiply by 12, divide by 52, divide by 40)"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center ${
                  formulaError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formulaError && (
                <p className="text-red-500 text-sm text-center">{formulaError}</p>
              )}
              {hourlyRateFormula && !formulaError && (
                <p className="text-gray-500 text-sm text-center">
                  Formula: Basic Salary {hourlyRateFormula.replace(/x/g, ' × ').replace(/\//g, ' ÷ ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Overtime Settings */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overtime Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Multiplier
              </label>
              <input
                type="number"
                value={parseFloat((settings.overtimeMultiplier || 1.5).toString())}
                onChange={handleOvertimeMultiplierChange}
                step="0.1"
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overtime Rate
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                  <span className="text-gray-500 font-medium">{settings.currency}</span>
                </div>
                <input
                  type="number"
                  value={((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5)).toFixed(2)}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Custom Shifts */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Custom Shifts</h3>
            <button
              onClick={() => setIsAddShiftModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 font-medium w-full"
            >
              <Plus className="w-4 h-4" />
              <span>Add Shift</span>
            </button>
          </div>
          
          {!settings.customShifts || settings.customShifts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No custom shifts added yet</p>
              <p className="text-gray-400 text-sm">Click "Add Shift" to create your first custom shift</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {settings.customShifts.map((shift) => (
                <SwipeableShiftCard
                  key={shift.id}
                  shift={shift}
                  settings={settings}
                  onEdit={() => handleEditShift(shift)}
                  onDelete={() => handleDeleteShift(shift.id)}
                  formatTime={formatTime}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Shift Modal */}
      {isAddShiftModalOpen && (
        <AddShiftModal
          isOpen={isAddShiftModalOpen}
          onClose={() => {
            setIsAddShiftModalOpen(false);
            setEditingShift(null);
          }}
          onSave={editingShift ? handleUpdateShift : handleAddShift}
          editingShift={editingShift}
          settings={settings}
          hourlyRate={settings.hourlyRate || 0}
          overtimeRate={(settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          isOpen={!!toast}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};