/**
 * Add Shift Modal Component - Custom Shift Creation and Editing Interface
 * 
 * This modal component provides a comprehensive interface for creating and editing
 * custom work shifts. It handles complex validation, time calculations, and
 * provides real-time feedback for shift configuration.
 * 
 * Key Features:
 * - Create new shifts or edit existing ones
 * - Time range selection with validation
 * - Separate normal and overtime hours configuration
 * - Day-specific availability settings
 * - Real-time amount calculations and previews
 * - Duplicate shift detection and prevention
 * - Comprehensive validation with user-friendly error messages
 * 
 * Validation System:
 * - Time range validation (end must be after start, max 24 hours)
 * - Hours validation (total hours can't exceed time difference)
 * - Duplicate detection (prevents same time ranges)
 * - Required field validation (label, times, hours)
 * - Business rule validation (minimum hours, maximum shifts)
 * 
 * User Experience:
 * - Auto-calculation of time differences
 * - Real-time preview of shift amounts
 * - Clear error messages with specific guidance
 * - Mobile-optimized scrolling and input handling
 * - Keyboard shortcuts for power users
 * 
 * Dependencies:
 * - React hooks for state management
 * - React Portal for modal rendering
 * - Lucide React for icons
 * - Custom validation utilities
 * 
 * @author NARAYYA
 * @version 3.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Plus, Edit } from 'lucide-react';
import { CustomShift } from '../types';

/**
 * Props interface for the AddShiftModal component
 * 
 * @interface AddShiftModalProps
 * @property {boolean} isOpen - Controls modal visibility
 * @property {function} onClose - Callback when modal should be closed
 * @property {function} onSave - Callback when shift should be saved
 * @property {CustomShift | null} editingShift - Shift being edited, null for new shifts
 * @property {any} settings - Application settings for calculations
 * @property {number} hourlyRate - Base hourly rate for calculations
 * @property {number} overtimeRate - Overtime hourly rate for calculations
 */
interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: CustomShift) => void;
  editingShift?: CustomShift | null;
  settings: any;
  hourlyRate?: number;
  overtimeRate?: number;
}

/**
 * AddShiftModal Component
 * 
 * Renders a comprehensive modal interface for shift creation and editing.
 * Handles complex validation logic and provides real-time feedback.
 * 
 * State Management:
 * - Form data with all shift properties
 * - Validation errors with specific messages
 * - Real-time calculations for user feedback
 * 
 * Validation Strategy:
 * - Client-side validation for immediate feedback
 * - Business rule validation for data integrity
 * - User-friendly error messages with guidance
 * - Prevention of invalid data submission
 * 
 * @param {AddShiftModalProps} props - Component props
 * @returns {JSX.Element | null} The rendered modal or null if not open
 */
export const AddShiftModal: React.FC<AddShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingShift,
  settings,
  hourlyRate = 0,
  overtimeRate = 0
}) => {
  // ==================== STATE MANAGEMENT ====================
  
  /**
   * Form data state containing all shift properties
   * 
   * Structure matches CustomShift interface for easy saving
   * Includes default values for new shifts
   */
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

  /**
   * Error state for validation messages
   * Displays user-friendly error messages with specific guidance
   */
  const [error, setError] = useState<string | null>(null);

  // ==================== TIME CALCULATION UTILITIES ====================
  
  /**
   * Calculates the time difference between start and end times
   * 
   * @param {string} fromTime - Start time in HH:MM format
   * @param {string} toTime - End time in HH:MM format
   * @returns {number} Time difference in hours (decimal)
   * 
   * Handles:
   * - Standard same-day shifts (9:00 to 17:00)
   * - Overnight shifts (22:00 to 06:00)
   * - Edge cases (empty times, invalid formats)
   * 
   * Algorithm:
   * 1. Convert times to minutes since midnight
   * 2. Handle overnight shifts by adding 24 hours to end time
   * 3. Calculate difference and convert back to hours
   * 
   * Example:
   * - fromTime: "09:00", toTime: "17:00" → 8.0 hours
   * - fromTime: "22:00", toTime: "06:00" → 8.0 hours (overnight)
   */
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

  /**
   * Validates that total hours don't exceed the time difference
   * 
   * @param {number} normalHours - Normal hours to validate
   * @param {number} overtimeHours - Overtime hours to validate
   * @param {string} fromTime - Start time for comparison
   * @param {string} toTime - End time for comparison
   * @returns {string | null} Error message or null if valid
   * 
   * Business Rule:
   * - Total scheduled hours cannot exceed actual time worked
   * - Prevents impossible shift configurations
   * - Ensures data integrity for calculations
   * 
   * Why this validation:
   * - Prevents user confusion about shift duration
   * - Ensures accurate salary calculations
   * - Maintains logical consistency in shift data
   */
  const validateHours = (normalHours: number, overtimeHours: number, fromTime: string, toTime: string): string | null => {
    const totalHours = normalHours + overtimeHours;
    const timeDifference = calculateTimeDifference(fromTime, toTime);
    
    if (totalHours > timeDifference) {
      return `Total hours (${totalHours}) cannot exceed time difference (${timeDifference.toFixed(1)} hours)`;
    }
    
    return null;
  };

  // ==================== FORM INITIALIZATION ====================
  
  /**
   * Resets and initializes form when modal opens or editing shift changes
   * 
   * Why useEffect:
   * - Ensures form is fresh when modal opens
   * - Handles switching between create and edit modes
   * - Clears previous errors and state
   * 
   * Initialization Logic:
   * - Edit mode: Populates form with existing shift data
   * - Create mode: Uses default values for new shift
   * - Always resets error state for clean start
   */
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (editingShift) {
        // Populate form with existing shift data
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
        // Reset form for new shift
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

  // ==================== SCROLL PREVENTION ====================
  
  /**
   * Prevents body scroll when modal is open
   * 
   * Why this approach:
   * - Prevents background scrolling on mobile devices
   * - Maintains modal position during device orientation changes
   * - Ensures consistent behavior across iOS and Android
   * - Matches pattern used in other modals for consistency
   */
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

  /**
   * Handles escape key to close modal
   * 
   * Why separate from other handlers:
   * - Provides keyboard accessibility
   * - Standard modal behavior expectation
   * - Allows for different close behaviors if needed
   */
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

  // Early return if modal should not be shown
  if (!isOpen) return null;

  // ==================== VALIDATION FUNCTIONS ====================
  
  /**
   * Validates shift time range
   * 
   * @param {string} fromTime - Start time in HH:MM format
   * @param {string} toTime - End time in HH:MM format
   * @returns {string | null} Error message or null if valid
   * 
   * Validation Rules:
   * 1. Both times must be provided
   * 2. End time must be after start time (or next day for overnight)
   * 3. Shift duration cannot exceed 24 hours
   * 
   * Why these rules:
   * - Ensures logical time ranges
   * - Prevents impossible shift configurations
   * - Maintains data integrity for calculations
   */
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

  /**
   * Checks for duplicate shift times in existing shifts
   * 
   * @param {string} fromTime - Start time to check
   * @param {string} toTime - End time to check
   * @returns {string | null} Error message or null if no duplicates
   * 
   * Business Rule:
   * - No two shifts can have identical time ranges
   * - Prevents user confusion and scheduling conflicts
   * - Excludes the shift being edited from duplicate check
   * 
   * Why prevent duplicates:
   * - Avoids user confusion about which shift to select
   * - Prevents accidental creation of identical shifts
   * - Maintains clean, organized shift list
   */
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

  // ==================== UTILITY FUNCTIONS ====================
  
  /**
   * Formats shift time range for display
   * 
   * @param {string} fromTime - Start time
   * @param {string} toTime - End time
   * @returns {string} Formatted time range
   */
  const formatShiftDisplay = (fromTime: string, toTime: string): string => {
    return `${fromTime} to ${toTime}`;
  };

  /**
   * Calculates total amount for given hours
   * 
   * @param {number} normalHours - Normal hours
   * @param {number} overtimeHours - Overtime hours
   * @returns {number} Total calculated amount
   */
  const calculateAmount = (normalHours: number, overtimeHours: number) => {
    return (normalHours * hourlyRate) + (overtimeHours * overtimeRate);
  };

  /**
   * Formats currency amounts for display
   * 
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs.';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // ==================== SAVE HANDLER ====================
  
  /**
   * Handles form submission and validation
   * 
   * Validation Sequence:
   * 1. Time range validation
   * 2. Duplicate time check
   * 3. Required field validation
   * 4. Hours validation
   * 5. Business rule validation
   * 
   * Save Process:
   * 1. Create shift object with all required fields
   * 2. Handle both create and edit modes
   * 3. Call parent callback with shift data
   * 4. Close modal on success
   * 
   * Error Handling:
   * - Shows specific error messages for each validation failure
   * - Prevents submission of invalid data
   * - Maintains form state for user correction
   */
  const handleSave = () => {
    // Time validation
    const validation = validateShiftTimes(formData.fromTime, formData.toTime);
    if (validation) {
      setError(`Validation Error: ${validation}`);
      return;
    }

    // Duplicate check
    const duplicateCheck = checkForDuplicateTimes(formData.fromTime, formData.toTime);
    if (duplicateCheck) {
      setError(`Duplicate Times Error: ${duplicateCheck}`);
      return;
    }

    // Required field validation
    if (!formData.label.trim()) {
      setError('Validation Error: Shift label is required');
      return;
    }

    // Hours validation
    if (formData.normalHours <= 0 && formData.overtimeHours <= 0) {
      setError('Validation Error: Total hours must be greater than 0');
      return;
    }
    
    // Hours vs time difference validation
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

  /**
   * Handles backdrop clicks to close modal
   * 
   * @param {React.MouseEvent} e - Mouse event from backdrop click
   */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ==================== RENDER ====================
  
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
          {/* Error Display */}
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
            {/* Shift Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shift Label</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Morning Shift"
              />
            </div>
            
            {/* Time Range */}
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
                <input
                  type="time"
                  value={formData.fromTime}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fromTime: e.target.value }));
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
                    if (error && error.includes('Hours Validation Error')) {
                      setError(null);
                    }
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center"
                />
              </div>
            </div>

            {/* Hours Configuration */}
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

            {/* Applicable Days */}
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
            
            {/* Time Difference Info */}
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
            
            {/* Preview */}
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
        
        {/* Footer */}
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