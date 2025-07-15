import React, { useState, useEffect, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { DaySchedule, SpecialDates, Settings } from '../types';
import { getDayOfWeek } from '../utils/dateUtils';

interface ShiftModalProps {
  selectedDate: string | null;
  schedule: DaySchedule;
  specialDates: SpecialDates;
  settings: Settings;
  onToggleShift: (shiftId: string) => void;
  onToggleSpecialDate: (dateKey: string, isSpecial: boolean) => void;
  onClose: () => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  selectedDate,
  schedule,
  specialDates,
  settings,
  onToggleShift,
  onToggleSpecialDate,
  onClose
}) => {
  const [isSpecialDate, setIsSpecialDate] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);

  // Initialize special date state when modal opens
  useEffect(() => {
    if (selectedDate) {
      setIsSpecialDate(specialDates[selectedDate] === true);
      setSelectedShifts(schedule[selectedDate] || []);
    }
  }, [selectedDate, specialDates, schedule]);

  // Function to scroll back to the edited date when modal closes
  const handleCloseWithFocus = useCallback(() => {
    if (selectedDate) {
      // Parse the date to get the day number
      const dateObj = new Date(selectedDate);
      const dayNumber = dateObj.getDate();
      
      // Close the modal first
      onClose();
      
      // Use setTimeout to ensure modal is closed before scrolling
      setTimeout(() => {
        // Find the date element using the data-day attribute
        const dateElement = document.querySelector(`[data-day="${dayNumber}"]`) as HTMLElement;
        
        if (dateElement) {
          console.log(`📍 Scrolling back to date ${dayNumber}`);
          
          // Scroll the element into view with smooth behavior
          dateElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',    // Center the element vertically
            inline: 'center'    // Center the element horizontally
          });
          
          // Optional: Add a brief highlight effect to show which date was edited
          dateElement.style.transition = 'all 0.3s ease';
          dateElement.style.transform = 'scale(1.05)';
          dateElement.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.5)';
          
          // Remove highlight after animation
          setTimeout(() => {
            dateElement.style.transform = '';
            dateElement.style.boxShadow = '';
          }, 600);
        } else {
          console.warn(`⚠️ Could not find date element for day ${dayNumber}`);
        }
      }, 100); // Small delay to ensure modal close animation completes
    } else {
      // Fallback to normal close if no selected date
      onClose();
    }
  }, [selectedDate, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedDate) {
      // Disable body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.bottom = '0';
    }

    return () => {
      // Re-enable body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
    };
  }, [selectedDate]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseWithFocus();
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseWithFocus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleCloseWithFocus]);

  if (!selectedDate) return null;

  // Get available shifts from settings
  const getAvailableShifts = () => {
    const shifts = [];
    
    // Get day of week for the selected date (0 = Sunday, 1 = Monday, etc.)
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[dayOfWeek];
    
    // Check if it's a special date
    const isSpecial = specialDates[selectedDate] === true;
    
    // Add all custom shifts from settings
    if (settings.customShifts) {
      settings.customShifts.forEach(shift => {
        if (shift.enabled) {
          // Check if shift is applicable for this day
          const applicableDays = shift.applicableDays || {
            monday: true, tuesday: true, wednesday: true, thursday: true,
            friday: true, saturday: true, sunday: true, specialDay: true
          };
          
          // Show shift if it's applicable for current day OR if it's a special day and shift allows special days
          const isApplicableForDay = applicableDays[currentDayName as keyof typeof applicableDays];
          const isApplicableForSpecial = isSpecial && applicableDays.specialDay;
          
          if (isApplicableForDay || isApplicableForSpecial) {
            shifts.push({
              id: shift.id,
              label: shift.label,
              time: `${shift.fromTime} to ${shift.toTime}`,
              hours: shift.hours,
              color: 'bg-blue-100 text-blue-800 border-blue-200'
            });
          }
        }
      });
    }
    
    return shifts;
  };

  const availableShifts = getAvailableShifts();
  
  const checkTimeOverlap = (shift1: any, shift2: any) => {
    // Simple overlap check - can be enhanced based on actual time ranges
    return false; // For now, allow all combinations
  };

  const canSelectShift = (shiftId: string) => {
    if (selectedShifts.includes(shiftId)) return true;
    if (selectedShifts.length >= 3) return false;
    
    const currentShift = availableShifts.find(s => s.id === shiftId);
    if (!currentShift) return false;
    
    // Check for overlaps with already selected shifts
    for (const selectedId of selectedShifts) {
      const selectedShift = availableShifts.find(s => s.id === selectedId);
      if (selectedShift && checkTimeOverlap(currentShift, selectedShift)) {
        return false;
      }
    }
    
    return true;
  };
  
  const handleShiftToggle = (shiftId: string) => {
    const newSelectedShifts = selectedShifts.includes(shiftId)
      ? selectedShifts.filter(id => id !== shiftId)
      : [...selectedShifts, shiftId];
    
    setSelectedShifts(newSelectedShifts);
    onToggleShift(shiftId);
  };
  
  const calculateTotalAmount = () => {
    let total = 0;
    selectedShifts.forEach(shiftId => {
      const shift = availableShifts.find(s => s.id === shiftId);
      if (shift) {
        total += shift.hours * (settings.hourlyRate || 0);
      }
    });
    return total;
  };
  
  const formatCurrency = (amount: number) => {
    const currency = settings.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return {
      dayName,
      dateString: `${day}-${month}-${year}`
    };
  };

  const handleSpecialDateToggle = async () => {
    const newSpecialState = !isSpecialDate;
    setIsSpecialDate(newSpecialState);
    
    // Update parent state immediately
    onToggleSpecialDate(selectedDate, newSpecialState);
    
    const currentShifts = schedule[selectedDate] || [];
    
    if (newSpecialState) {
      // If we're ENABLING special date status, remove any 12-10 shifts (not allowed on special dates)
      if (currentShifts.includes('12-10')) {
        onToggleShift('12-10'); // This will remove the 12-10 shift
      }
    } else {
      // If we're DISABLING special date status, remove any 9-4 shifts that are no longer valid
      const dayOfWeek = getDayOfWeek(selectedDate);
      
      // If it's not Sunday and we're removing special date status, remove 9-4 shifts
      if (dayOfWeek !== 0 && currentShifts.includes('9-4')) {
        onToggleShift('9-4'); // This will remove the 9-4 shift
      }
    }
  };

  const { dayName, dateString } = formatDateDisplay(selectedDate);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999, // Higher z-index to ensure it's above everything
        // CRITICAL: Enable touch scrolling on the backdrop
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y' // Allow vertical panning (scrolling)
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full select-none" 
        style={{ 
          userSelect: 'none', 
          WebkitUserSelect: 'none',
          // Ensure modal is properly centered and doesn't overlap calendar
          position: 'relative',
          maxHeight: '90vh',
          margin: 'auto',
          // Prevent any positioning issues
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden'
        }}
        onClick={(e) => {
          // Prevent modal from closing when clicking inside
          e.stopPropagation();
        }}
      >
        {/* Header with close button and auto-save indicator */}
        <div className="relative p-6 pb-4 border-b border-gray-200">
          <button
            onClick={handleCloseWithFocus}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-200 select-none z-10"
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Auto-save indicator */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600 font-medium select-none">Changes saved automatically</span>
          </div>

          {/* Date info - centered */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-1 select-none">
              {dayName}
            </h3>
            <p className="text-lg text-gray-700 select-none">
              {dateString}
            </p>
          </div>
        </div>

        {/* Scrollable content with ENHANCED TOUCH SUPPORT */}
        <div 
          className="overflow-y-auto max-h-[70vh] p-6"
          style={{
            // CRITICAL: Enable smooth touch scrolling
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y', // Allow vertical panning (scrolling)
            overscrollBehavior: 'contain' // Prevent scroll chaining to parent
          }}
        >
          {/* Special Date Checkbox - only show if not Sunday */}
          <div className="flex items-center justify-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isSpecialDate}
                onChange={handleSpecialDateToggle}
                className="w-4 h-4 text-yellow-600 focus:ring-yellow-500 focus:ring-2 rounded"
              />
              <span className="text-sm font-medium text-yellow-800 select-none">
                Special Date
              </span>
            </label>
          </div>
          
          {/* Shift Selection Info */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg mb-4">
            <p className="text-sm text-gray-700 text-center select-none">
              <strong>Shift Selection ({selectedShifts.length}/3)</strong>
            </p>
            {selectedShifts.length > 0 && (
              <p className="text-sm text-indigo-600 text-center mt-1 font-medium">
                Total: {formatCurrency(calculateTotalAmount())}
              </p>
            )}
          </div>

          {/* Scrollable Shift List */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3 text-center">Available Shifts ({availableShifts.length})</h4>
            <div className="max-h-64 overflow-y-auto space-y-3 border border-gray-200 rounded-lg p-3">
            {availableShifts.map(shift => {
              const isSelected = selectedShifts.includes(shift.id);
              const canSelect = isSelected || selectedShifts.length < 3;
              const isDisabled = !isSelected && !canSelect;

              return (
                <div key={shift.id}>
                  <button
                    onClick={() => handleShiftToggle(shift.id)}
                    disabled={isDisabled}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all duration-200 select-none ${
                      isSelected
                        ? `${shift.color} border-current shadow-md transform scale-[1.02]`
                        : isDisabled
                          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                    style={{ 
                      userSelect: 'none', 
                      WebkitUserSelect: 'none',
                      touchAction: 'manipulation'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="relative">
                          <input
                            type="radio"
                            name={`shift-${shift.id}`}
                            checked={isSelected}
                            onChange={() => {}}
                            disabled={isDisabled}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
                          />
                        </div>
                        <div className="flex-1">
                        <div className="font-semibold select-none">{shift.label}</div>
                          <div className="text-xs text-gray-600 select-none">{shift.hours}h</div>
                        </div>
                      </div>
                      {isDisabled && selectedShifts.length >= 3 && (
                            <div className="text-center select-none truncate px-0.5">{customShift ? customShift.label : shiftId}</div>
                          Maximum 3 shifts allowed
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
            </div>
          </div>

          {availableShifts.length === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 font-medium">No shifts available</p>
              <p className="text-yellow-700 text-sm mt-1">Please add shifts in the Settings section first.</p>
            </div>
          )}

          {/* Add extra padding at bottom to ensure all content is accessible */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};