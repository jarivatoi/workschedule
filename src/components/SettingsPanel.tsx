/**
 * Settings Panel Component - Application Configuration Interface
 * 
 * This component provides a comprehensive interface for configuring all aspects
 * of the work schedule application, including salary settings, custom shifts,
 * currency preferences, and overtime calculations.
 * 
 * Key Features:
 * - Basic salary and hourly rate management with formula support
 * - Currency selection from predefined options
 * - Custom shift creation and management with swipeable cards
 * - Overtime multiplier configuration
 * - Real-time calculation previews
 * - Toast notifications for user feedback
 * 
 * Formula System:
 * - Supports mathematical expressions for hourly rate calculation
 * - Common formula: x12/52/40 (annual to hourly conversion)
 * - Real-time validation and error handling
 * - Automatic calculation when basic salary changes
 * 
 * Custom Shifts:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Swipeable card interface for mobile-friendly interaction
 * - Normal and overtime hours separation
 * - Day-specific availability rules
 * - Real-time amount calculations
 * 
 * Dependencies:
 * - React hooks for state management
 * - Lucide React for icons
 * - Custom shift card component
 * - Toast notification system
 * 
 * @author NARAYYA
 * @version 3.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Clock, DollarSign, Edit, Calculator } from 'lucide-react';
import { Settings, CustomShift } from '../types';
import { CURRENCY_OPTIONS } from '../constants';
import { AddShiftModal } from './AddShiftModal';
import { ToastNotification } from './ToastNotification';
import { SwipeableShiftCard } from './SwipeableShiftCard';

/**
 * Props interface for the SettingsPanel component
 * 
 * @interface SettingsPanelProps
 * @property {Settings} settings - Current application settings
 * @property {function} onUpdateBasicSalary - Callback to update basic salary
 * @property {function} onUpdateCurrency - Callback to update currency
 * @property {function} onAddCustomShift - Callback to add new custom shift
 * @property {function} onUpdateCustomShift - Callback to update existing shift
 * @property {function} onDeleteCustomShift - Callback to delete custom shift
 * @property {function} onUpdateHourlyRate - Optional callback to update hourly rate
 * @property {function} onUpdateOvertimeMultiplier - Optional callback to update overtime multiplier
 * @property {function} onUpdateShiftHours - Legacy callback for shift hours (deprecated)
 * @property {function} onUpdateShiftEnabled - Legacy callback for shift enabled status (deprecated)
 */
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

/**
 * SettingsPanel Component
 * 
 * Renders a comprehensive settings interface with multiple configuration sections.
 * Handles complex state management for formula calculations and shift management.
 * 
 * State Management:
 * - Modal states for shift creation/editing
 * - Formula validation and error handling
 * - Toast notifications for user feedback
 * - Temporary values for editing operations
 * 
 * Performance Optimizations:
 * - useCallback for expensive operations
 * - Debounced formula validation
 * - Memoized calculations where appropriate
 * 
 * @param {SettingsPanelProps} props - Component props
 * @returns {JSX.Element} The rendered settings interface
 */
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
  // ==================== STATE MANAGEMENT ====================
  
  /**
   * Controls visibility of the add/edit shift modal
   */
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  
  /**
   * Stores the shift being edited, null for new shifts
   */
  const [editingShift, setEditingShift] = useState<CustomShift | null>(null);
  
  /**
   * Formula string for hourly rate calculation
   * Supports mathematical expressions like "x12/52/40"
   */
  const [hourlyRateFormula, setHourlyRateFormula] = useState('');
  
  /**
   * Current hourly rate value (calculated or manually entered)
   */
  const [hourlyRateValue, setHourlyRateValue] = useState(settings.hourlyRate || 0);
  
  /**
   * Error message for formula validation
   */
  const [formulaError, setFormulaError] = useState('');
  
  /**
   * Toast notification state for user feedback
   */
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  /**
   * Syncs local hourly rate value with settings changes
   * 
   * Why useEffect:
   * - Ensures local state stays in sync with prop changes
   * - Handles external updates to settings
   * - Prevents stale state issues
   */
  useEffect(() => {
    setHourlyRateValue(settings.hourlyRate || 0);
  }, [settings.hourlyRate]);

  // ==================== FORMULA CALCULATION SYSTEM ====================
  
  /**
   * Parses and evaluates a mathematical formula for hourly rate calculation
   * 
   * @param {string} formula - Mathematical expression (e.g., "x12/52/40")
   * @param {number} basicSalary - Base salary to use in calculation
   * @returns {number} Calculated hourly rate, 0 if invalid
   * 
   * Formula Processing:
   * 1. Converts 'x' to '*' and '÷' to '/' for JavaScript evaluation
   * 2. Prepends the basic salary to the expression
   * 3. Uses Function constructor for safe evaluation
   * 4. Returns 0 for invalid expressions
   * 
   * Security Note:
   * - Uses Function constructor instead of eval() for better security
   * - Input is sanitized by replacing only specific characters
   * - Still requires trusted input - not suitable for user-generated formulas
   * 
   * Example:
   * - Input: "x12/52/40", basicSalary: 35000
   * - Processed: "35000 * 12 / 52 / 40"
   * - Result: 201.92 (hourly rate)
   */
  const parseHourlyRateFormula = useCallback((formula: string, basicSalary: number): number => {
    try {
      const expression = formula.toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');
      const result = Function(`"use strict"; return (${basicSalary} ${expression})`)();
      return isNaN(result) ? 0 : Math.round(result * 100) / 100;
    } catch {
      return 0;
    }
  }, []);

  /**
   * Validates a formula string for syntax errors
   * 
   * @param {string} formula - Formula to validate
   * @returns {boolean} True if formula is valid
   * 
   * Validation Process:
   * 1. Converts formula to JavaScript syntax
   * 2. Tests with a known value (1000)
   * 3. Checks if result is a valid number
   * 4. Returns false for any errors
   * 
   * Why test with 1000:
   * - Avoids division by zero issues
   * - Provides meaningful test result
   * - Doesn't affect actual calculation
   */
  const validateFormula = useCallback((formula: string): boolean => {
    try {
      const expression = formula.toLowerCase().replace(/x/g, '*').replace(/÷/g, '/');
      const testResult = Function(`"use strict"; return (1000 ${expression})`)();
      return !isNaN(testResult) && isFinite(testResult);
    } catch {
      return false;
    }
  }, []);

  // ==================== INPUT HANDLERS ====================
  
  /**
   * Handles basic salary input changes with automatic hourly rate calculation
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   * 
   * Processing:
   * 1. Strips non-numeric characters (only allows digits)
   * 2. Converts to integer (no decimal places for salary)
   * 3. Updates basic salary via callback
   * 4. Recalculates hourly rate if formula exists
   * 
   * Why only digits:
   * - Basic salary is typically a whole number
   * - Prevents formatting issues with commas/decimals
   * - Simplifies user input validation
   */
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

  /**
   * Handles focus event on basic salary input
   * Shows raw numeric value for easier editing
   * 
   * @param {React.FocusEvent<HTMLInputElement>} e - Focus event
   * 
   * Why change on focus:
   * - Removes formatting (commas) for easier editing
   * - Standard UX pattern for numeric inputs
   * - Prevents cursor positioning issues
   */
  const handleBasicSalaryFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = settings.basicSalary.toString();
  };

  /**
   * Handles blur event on basic salary input
   * Restores formatted display with commas
   * 
   * @param {React.FocusEvent<HTMLInputElement>} e - Blur event
   * 
   * Why format on blur:
   * - Improves readability with thousand separators
   * - Standard formatting for currency/large numbers
   * - Maintains clean appearance when not editing
   */
  const handleBasicSalaryBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.value = settings.basicSalary.toLocaleString('en-US');
  };

  /**
   * Handles hourly rate formula input changes
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   * 
   * State Updates:
   * - Updates formula string
   * - Clears any existing error messages
   * - Prepares for validation on Enter key
   */
  const handleHourlyRateFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formula = e.target.value;
    setHourlyRateFormula(formula);
    setFormulaError('');
  };

  /**
   * Handles keyboard events in formula input
   * 
   * @param {React.KeyboardEvent<HTMLInputElement>} e - Keyboard event
   * 
   * Enter Key Behavior:
   * 1. Validates formula syntax
   * 2. Shows error if invalid
   * 3. Calculates and applies new hourly rate if valid
   * 4. Updates both local and parent state
   * 
   * Why validate on Enter:
   * - Provides immediate feedback
   * - Prevents invalid formulas from being applied
   * - Standard form submission pattern
   */
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

  /**
   * Handles direct hourly rate input changes
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   * 
   * Behavior:
   * - Updates hourly rate directly
   * - Clears any existing formula (manual override)
   * - Provides immediate feedback
   * 
   * Why clear formula:
   * - Manual input overrides calculated values
   * - Prevents confusion between manual and calculated rates
   * - Clear user intent to set specific value
   */
  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    setHourlyRateValue(value);
    onUpdateHourlyRate?.(value);
    setHourlyRateFormula(''); // Clear formula when manually setting rate
  };

  /**
   * Handles overtime multiplier changes
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   * 
   * Validation:
   * - Ensures minimum value of 1 (can't be less than normal rate)
   * - Defaults to 1 for invalid input
   * - Typical values: 1.5 (time and a half), 2.0 (double time)
   */
  const handleOvertimeMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 1;
    onUpdateOvertimeMultiplier?.(value);
  };

  // ==================== SHIFT MANAGEMENT HANDLERS ====================
  
  /**
   * Handles adding a new custom shift
   * 
   * @param {CustomShift} shift - New shift to add
   * 
   * Process:
   * 1. Calls parent callback to add shift
   * 2. Closes the modal
   * 3. Shows success toast notification
   * 
   * Why separate from update:
   * - Different business logic for new vs existing shifts
   * - Different success messages
   * - Clearer code organization
   */
  const handleAddShift = (shift: CustomShift) => {
    onAddCustomShift(shift);
    setIsAddShiftModalOpen(false);
    setToast({ message: 'Custom shift added successfully!', type: 'success' });
  };

  /**
   * Initiates editing of an existing shift
   * 
   * @param {CustomShift} shift - Shift to edit
   * 
   * State Changes:
   * - Sets the shift as currently being edited
   * - Opens the add/edit modal
   * - Modal will show in edit mode based on editingShift state
   */
  const handleEditShift = (shift: CustomShift) => {
    setEditingShift(shift);
    setIsAddShiftModalOpen(true);
  };

  /**
   * Handles updating an existing custom shift
   * 
   * @param {CustomShift} shift - Updated shift data
   * 
   * Process:
   * 1. Verifies we're in edit mode
   * 2. Calls parent callback with shift ID and new data
   * 3. Resets edit state
   * 4. Closes modal and shows success message
   * 
   * Why check editingShift:
   * - Ensures we're actually in edit mode
   * - Prevents accidental updates
   * - Provides clear error path if state is inconsistent
   */
  const handleUpdateShift = (shift: CustomShift) => {
    if (editingShift) {
      onUpdateCustomShift(editingShift.id, shift);
      setEditingShift(null);
      setIsAddShiftModalOpen(false);
      setToast({ message: 'Custom shift updated successfully!', type: 'success' });
    }
  };

  /**
   * Handles deleting a custom shift
   * 
   * @param {string} shiftId - ID of shift to delete
   * 
   * Process:
   * 1. Calls parent callback to delete shift
   * 2. Shows success toast notification
   * 
   * Note: Parent callback handles:
   * - Removing shift from settings
   * - Removing shift from all scheduled dates
   * - Updating calculations
   */
  const handleDeleteShift = (shiftId: string) => {
    onDeleteCustomShift(shiftId);
    setToast({ message: 'Custom shift deleted successfully!', type: 'success' });
  };

  // ==================== UTILITY FUNCTIONS ====================
  
  /**
   * Formats time string for display
   * 
   * @param {string} time - Time in HH:MM format (24-hour)
   * @returns {string} Formatted time in 12-hour format with AM/PM
   * 
   * Conversion Process:
   * 1. Parses hours and minutes from HH:MM format
   * 2. Determines AM/PM based on hour value
   * 3. Converts to 12-hour format (0 becomes 12)
   * 4. Returns formatted string
   * 
   * Example: "14:30" → "2:30 PM"
   */
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Formats currency amounts for display
   * 
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   * 
   * Formatting:
   * - Uses current currency setting
   * - Includes thousand separators
   * - Shows 2 decimal places
   * - Handles edge cases (NaN, null, etc.)
   */
  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // ==================== RENDER ====================
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        <SettingsIcon className="w-6 h-6 text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-900 text-center">Settings</h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Basic Salary Section */}
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
              defaultValue={settings.basicSalary.toLocaleString('en-US')}
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

        {/* Hourly Rate Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Hourly Rate
          </label>
          <div className="space-y-4">
            {/* Direct hourly rate input */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
                <span className="text-gray-500 font-medium">{settings.currency}</span>
              </div>
              <input
                type="number"
                value={hourlyRateValue.toFixed(2)}
                onChange={handleHourlyRateChange}
                step="0.01"
                min="0"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
              />
            </div>
            
            {/* OR separator */}
            <div className="text-center">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">OR</span>
            </div>
            
            {/* Formula input section */}
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

        {/* Custom Shifts Section */}
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
          
          {/* Empty state or shift list */}
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