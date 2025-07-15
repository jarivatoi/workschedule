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
    const value = e.target.value.replace(/[^\d]/g, '');
    const numericValue = parseInt(value, 10) || 0;
    onUpdateBasicSalary(numericValue);
    
    if (hourlyRateFormula) {
      const newHourlyRate = parseHourlyRateFormula(hourlyRateFormula, numericValue);
      setHourlyRateValue(newHourlyRate);
      onUpdateHourlyRate?.(newHourlyRate);
    }
  };

  const handleBasicSalaryFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = settings.basicSalary.toString();
  };

  const handleBasicSalaryBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = settings.basicSalary.toLocaleString('en-US');
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
    const value = parseFloat(e.target.value) || 0;
    setHourlyRateValue(value);
    onUpdateHourlyRate?.(value);
    setHourlyRateFormula('');
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

  const calculateShiftHours = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60;
    }
    
    const diffMinutes = endTotalMinutes - startTotalMinutes;
    return (diffMinutes / 60).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
      </div>

      {/* Basic Salary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Basic Salary
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
            <span className="text-gray-500 font-medium">{settings.currency}</span>
          </div>
          <input
            type="text"
            defaultValue={settings.basicSalary.toLocaleString('en-US')}
            onChange={handleBasicSalaryChange}
            onFocus={handleBasicSalaryFocus}
            onBlur={handleBasicSalaryBlur}
            placeholder="0"
            className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
          />
        </div>
      </div>

      {/* Currency Selection */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Currency
        </label>
        <select
          value={settings.currency}
          onChange={(e) => onUpdateCurrency(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {CURRENCY_OPTIONS.map((currency) => (
            <option key={currency.code} value={currency.symbol}>
              {currency.symbol} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Hourly Rate */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hourly Rate
        </label>
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-500 font-medium">{settings.currency}</span>
            </div>
            <input
              type="number"
              value={hourlyRateValue}
              onChange={handleHourlyRateChange}
              step="0.01"
              min="0"
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            />
          </div>
          
          <div className="text-xs text-gray-500 text-center">OR</div>
          
          <div className="space-y-2">
            <input
              type="text"
              value={hourlyRateFormula}
              onChange={handleHourlyRateFormulaChange}
              onKeyDown={handleHourlyRateFormulaKeyDown}
              placeholder="e.g., x12/52/40 (multiply by 12, divide by 52, divide by 40)"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center ${
                formulaError ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formulaError && (
              <p className="text-red-500 text-xs text-center">{formulaError}</p>
            )}
            {hourlyRateFormula && !formulaError && (
              <p className="text-gray-500 text-xs text-center">
                Formula: Basic Salary {hourlyRateFormula.replace(/x/g, ' × ').replace(/\//g, ' ÷ ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Overtime Settings */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Overtime Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Overtime Multiplier
            </label>
            <input
              type="number"
              value={settings.overtimeMultiplier || 1.5}
              onChange={handleOvertimeMultiplierChange}
              step="0.1"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Overtime Rate
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-500 font-medium">{settings.currency}</span>
              </div>
              <input
                type="number"
                value={((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5)).toFixed(2)}
                readOnly
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Shifts */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Custom Shifts</h3>
          <button
            onClick={() => setIsAddShiftModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
        
        {settings.customShifts.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No custom shifts added yet
          </p>
        ) : (
          <div className="space-y-2">
            {settings.customShifts.map((shift) => (
              <div
                key={shift.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{shift.name}</span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {calculateShiftHours(shift.startTime, shift.endTime)}h
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {settings.currency}{shift.rate}/hr
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditShift(shift)}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Shift Modal */}
      {isAddShiftModalOpen && (
        <AddShiftModal
          shift={editingShift}
          currency={settings.currency}
          onSave={editingShift ? handleUpdateShift : handleAddShift}
          onClose={() => {
            setIsAddShiftModalOpen(false);
            setEditingShift(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};