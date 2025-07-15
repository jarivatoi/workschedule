import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Plus, Edit } from 'lucide-react';
import { CustomShift } from '../types';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: CustomShift) => void;
  editingShift?: CustomShift | null;
  settings: any;
  hourlyRate?: number;
  overtimeRate?: number;
}

export const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingShift,
  settings,
  hourlyRate = 0,
  overtimeRate = 0
}) => {
  const [formData, setFormData] = useState({
    label: '',
    fromTime: '',
    toTime: '',
    normalHours: 0,
    overtimeHours: 0,
    applicableDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
      specialDay: true
    }
  });

  const [error, setError] = useState<string | null>(null);

  // Calculate total hours between start and end time
  const calculateTimeDifference = (fromTime: string, toTime: string): number => {
    if (!fromTime || !toTime) return 0;
    
    const [fromHour, fromMin] = fromTime.split(':').map(Number);
    const [toHour, toMin] = toTime.split(':').map(Number);
    
    const fromMinutes = fromHour * 60 + fromMin;
    let toMinutes = toHour * 60 + toMin;
    
    // Handle overnight shifts
    if (toMinutes <= fromMinutes) {
      toMinutes += 24 * 60;
    }
    
    return (toMinutes - fromMinutes) / 60;
  };

  // Validate that total hours don't exceed time difference
  const validateHours = (normalHours: number, overtimeHours: number, fromTime: string, toTime: string): string | null => {
    const totalHours = normalHours + overtimeHours;
    const timeDifference = calculateTimeDifference(fromTime, toTime);
    
    if (totalHours > timeDifference) {
      return `Total hours (${totalHours}) cannot exceed time difference (${timeDifference.toFixed(1)} hours)`;
    }
    
    return null;
  };

  // Reset form when modal opens/closes or editing shift changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editingShift) {
        setFormData({
          label: editingShift.label,
          fromTime: editingShift.fromTime,
          toTime: editingShift.toTime,
          normalHours: editingShift.normalHours || 0,
          overtimeHours: editingShift.overtimeHours || 0,
          applicableDays: editingShift.applicableDays || {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true,
            specialDay: true
          }
        });
      } else {
        setFormData({
          label: '',
          fromTime: '',
          toTime: '',
          normalHours: 0,
          overtimeHours: 0,
          applicableDays: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true,
            specialDay: true
          }
        });
      }
    }
  }, [isOpen, editingShift]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateShiftTimes = (fromTime: string, toTime: string): string | null => {
    if (!fromTime || !toTime) return 'Both from and to times are required';
    
    const [fromHour, fromMin] = fromTime.split(':').map(Number);
    const [toHour, toMin] = toTime.split(':').map(Number);
    
    const fromMinutes = fromHour * 60 + fromMin;
    let toMinutes = toHour * 60 + toMin;
    
    // Handle overnight shifts
    if (toMinutes <= fromMinutes) {
      toMinutes += 24 * 60;
    }
    
    const hours = (toMinutes - fromMinutes) / 60;
    if (hours <= 0) return 'End time must be after start time';
    if (hours > 24) return 'Shift cannot exceed 24 hours';
    
    return null;
  };

  const checkForDuplicateTimes = (fromTime: string, toTime: string): string | null => {
    if (!settings?.customShifts) return null;
    
    // Check if any existing shift has the same times (excluding the one being edited)
    const duplicateShift = settings.customShifts.find(shift => {
      // Skip the shift being edited
      if (editingShift && shift.id === editingShift.id) return false;
      
      return shift.fromTime === fromTime && shift.toTime === toTime;
    });
    
    if (duplicateShift) {
      return `A shift with times ${fromTime} to ${toTime} already exists: "${duplicateShift.label}"`;
    }
    
    return null;
  };

  const formatShiftDisplay = (fromTime: string, toTime: string): string => {
    return `${fromTime} to ${toTime}`;
  };

  const calculateAmount = (normalHours: number, overtimeHours: number) => {
    return (normalHours * hourlyRate) + (overtimeHours * overtimeRate);
  };

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs.';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleSave = () => {
    const validation = validateShiftTimes(formData.fromTime, formData.toTime);
    if (validation) {
      setError(`Validation Error: ${validation}`);
      return;
    }

    const duplicateCheck = checkForDuplicateTimes(formData.fromTime, formData.toTime);
    if (duplicateCheck) {
      setError(`Duplicate Times Error: ${duplicateCheck}`);
      return;
    }

    if (!formData.label.trim()) {
      setError('Validation Error: Shift label is required');
      return;
    }

    if (formData.normalHours <= 0 && formData.overtimeHours <= 0) {
      setError('Validation Error: Total hours must be greater than 0');
      return;
    }
    
    // Validate hours don't exceed time difference
    const hoursValidation = validateHours(formData.normalHours, formData.overtimeHours, formData.fromTime, formData.toTime);
    if (hoursValidation) {
      setError(`Hours Validation Error: ${hoursValidation}`);
      return;
    }
    
    if (editingShift) {
      // Update existing shift
      const updatedShift: CustomShift = {
        ...editingShift,
        label: formData.label.trim(),
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        normalHours: formData.normalHours,
        overtimeHours: formData.overtimeHours,
        hours: formData.normalHours + formData.overtimeHours, // Keep for compatibility
        applicableDays: formData.applicableDays
      };
      onSave(updatedShift);
    } else {
      // Add new shift
      const newShift: CustomShift = {
        id: `shift-${Date.now()}`,
        label: formData.label.trim(),
        fromTime: formData.fromTime,
        toTime: formData.toTime,
        normalHours: formData.normalHours,
        overtimeHours: formData.overtimeHours,
        hours: formData.normalHours + formData.overtimeHours, // Keep for compatibility
        enabled: true,
        applicableDays: formData.applicableDays
      };
      onSave(newShift);
    }
    
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 my-8 select-none"
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          height: '100vh',
          maxHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          margin: '0 auto',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          borderRadius: '0',
          maxWidth: '100vw'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 z-10"
            style={{
              minWidth: '40px',
              minHeight: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              {editingShift ? <Edit className="w-6 h-6 text-indigo-600" /> : <Plus className="w-6 h-6 text-indigo-600" />}
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">
            {editingShift ? 'Edit Shift' : 'Add New Shift'}
          </h3>
        </div>

        {/* Content */}
        <div 
          className="p-6 overflow-y-auto flex-1"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            minHeight: 0
          }}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-2 flex-1">
                  <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700 flex-1 leading-relaxed">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-2 p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors duration-200 flex-shrink-0 w-6 h-6 flex items-center justify-center"
                  title="Close error"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shift Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Morning Shift"
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
                .hours-input[type=number] {
                  -moz-appearance: textfield !important;
                }
              `}</style>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
                <input
                  type="time"
                  value={formData.fromTime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fromTime: e.target.value }));
                    
                    // Clear hours validation error when time changes
                    if (error && error.includes('Hours Validation Error')) {
                      setError(null);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
                <input
                  type="time"
                  value={formData.toTime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, toTime: e.target.value }));
                    
                    // Clear hours validation error when time changes
                    if (error && error.includes('Hours Validation Error')) {
                      setError(null);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Normal Hours</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.normalHours || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
                    setFormData(prev => ({ ...prev, normalHours: numericValue }));
                    
                    // Clear error if hours are now valid
                    if (error && error.includes('Hours Validation Error')) {
                      const hoursValidation = validateHours(numericValue, formData.overtimeHours, formData.fromTime, formData.toTime);
                      if (!hoursValidation) {
                        setError(null);
                      }
                    }
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0' || e.target.value === '0.00') {
                      e.target.select();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                  placeholder="8.00"
                  step="0.01"
                  min="0"
                  max="24"
                  style={{ textAlign: 'center' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overtime Hours</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={formData.overtimeHours || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
                    setFormData(prev => ({ ...prev, overtimeHours: numericValue }));
                    
                    // Clear error if hours are now valid
                    if (error && error.includes('Hours Validation Error')) {
                      const hoursValidation = validateHours(formData.normalHours, numericValue, formData.fromTime, formData.toTime);
                      if (!hoursValidation) {
                        setError(null);
                      }
                    }
                  }}
                  onFocus={(e) => {
                    if (e.target.value === '0' || e.target.value === '0.00') {
                      e.target.select();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="24"
                  style={{ textAlign: 'center' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-gray-700 mb-3 text-center">Applicable Days</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'monday', label: 'Monday' },
                  { key: 'tuesday', label: 'Tuesday' },
                  { key: 'wednesday', label: 'Wednesday' },
                  { key: 'thursday', label: 'Thursday' },
                  { key: 'friday', label: 'Friday' },
                  { key: 'saturday', label: 'Saturday' },
                  { key: 'sunday', label: 'Sunday' },
                  { key: 'specialDay', label: 'Special Day' }
                ].map(day => (
                  <label key={day.key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.applicableDays[day.key as keyof typeof formData.applicableDays]}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          applicableDays: {
                            ...prev.applicableDays,
                            [day.key]: e.target.checked
                          }
                        }));
                      }}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2 rounded"
                    />
                    <span className="text-sm text-gray-700">{day.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select which days this shift can be scheduled on
              </p>
            </div>
            
            {/* Time difference info */}
            {formData.fromTime && formData.toTime && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700 text-center">
                Time difference: {calculateTimeDifference(formData.fromTime, formData.toTime).toFixed(1)} hours
                {formData.normalHours + formData.overtimeHours > 0 && (
                  <span className="ml-2">
                    | Total entered: {(formData.normalHours + formData.overtimeHours).toFixed(1)} hours
                  </span>
                )}
              </div>
            )}
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">Preview:</div>
              <div className="text-sm space-y-1">
                <div>{formatShiftDisplay(formData.fromTime, formData.toTime)}</div>
                <div>Normal: {formData.normalHours}h × {formatCurrency(hourlyRate)} = {formatCurrency((formData.normalHours || 0) * hourlyRate)}</div>
                <div>Overtime: {formData.overtimeHours}h × {formatCurrency(overtimeRate)} = {formatCurrency((formData.overtimeHours || 0) * overtimeRate)}</div>
                <div className="font-semibold border-t pt-2">Total: {formatCurrency(calculateAmount(formData.normalHours || 0, formData.overtimeHours || 0))}</div>
              </div>
            </div>
          </div>
          
          <div className="h-8" />
        </div>
        
        <div className="p-6 pt-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.label || !formData.fromTime || !formData.toTime || (formData.normalHours <= 0 && formData.overtimeHours <= 0)}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingShift ? 'Update Shift' : 'Add Shift'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};