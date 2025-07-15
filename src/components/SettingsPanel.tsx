import React, { useState, useCallback, useEffect } from 'react';
import { Settings as SettingsIcon, Plus, Trash2, Clock, DollarSign, Edit } from 'lucide-react';
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
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateBasicSalary,
  onUpdateCurrency,
  onAddCustomShift,
  onUpdateCustomShift,
  onDeleteCustomShift
}) => {
  const [salaryDisplayValue, setSalaryDisplayValue] = useState('');
  const [showAddShift, setShowAddShift] = useState(false);
  const [editingShift, setEditingShift] = useState<CustomShift | null>(null);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const formatCurrency = (amount: number) => {
    const currency = settings?.currency || 'Rs';
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatHourlyRate = (rate: number) => {
    const currencyOption = CURRENCY_OPTIONS.find(c => c.code === settings.currency) || { symbol: 'Rs' };
    return `${currencyOption.symbol} ${rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatSalaryWithCommas = (value: number) => {
    return value.toLocaleString('en-US');
  };

  const parseSalaryFromDisplay = (displayValue: string) => {
    return parseInt(displayValue.replace(/,/g, ''), 10) || 0;
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanValue = inputValue.replace(/[^\d,]/g, '');
    const numericValue = parseSalaryFromDisplay(cleanValue);
    const formattedValue = formatSalaryWithCommas(numericValue);
    setSalaryDisplayValue(formattedValue);
    onUpdateBasicSalary(numericValue);
  };

  const handleSalaryFocus = () => {
    setSalaryDisplayValue(formatSalaryWithCommas(settings.basicSalary || 0));
  };

  const handleSalaryBlur = () => {
    setSalaryDisplayValue('');
  };

  const getSalaryInputValue = () => {
    const currencyOption = CURRENCY_OPTIONS.find(c => c.code === settings.currency) || { symbol: 'Rs' };
    return salaryDisplayValue || `${currencyOption.symbol} ${formatSalaryWithCommas(settings.basicSalary || 0)}`;
  };

  const calculateAmount = (hours: number) => {
    return hours * (settings?.hourlyRate || 0);
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

  const handleShiftHoursChange = (shiftId: string, hours: number) => {
    const shift = settings.customShifts?.find(s => s.id === shiftId);
    if (shift) {
      onUpdateCustomShift(shiftId, { ...shift, hours });
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
  const [hoursInputValues, setHoursInputValues] = useState<Record<string, string>>({});

  const handleHoursInputChange = (shiftId: string, value: string) => {
    // Allow empty string or valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setHoursInputValues(prev => ({ ...prev, [shiftId]: value }));
      
      // Update the actual hours value
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      handleShiftHoursChange(shiftId, numericValue);
    }
  };

  const handleHoursInputBlur = (shiftId: string, inputElement: HTMLInputElement) => {
    const value = hoursInputValues[shiftId] || '';
    
    // If empty or zero, show as placeholder
    if (value === '' || value === '0') {
      inputElement.value = '';
      inputElement.placeholder = '0';
      inputElement.style.color = '#9CA3AF';
      handleShiftHoursChange(shiftId, 0);
    } else {
      inputElement.style.color = '#374151';
      inputElement.placeholder = '';
    }
    
    // Clean up the input state
    setHoursInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[shiftId];
      return newValues;
    });
  };

  const getHoursDisplayValue = (shift: any) => {
    // If we're editing this field, show the input value
    const inputValue = hoursInputValues[shift.id];
    if (inputValue !== undefined) {
      return inputValue;
    }
    
    // For display, show empty if zero (will show placeholder)
    const hours = shift.hours || 0;
    return hours === 0 ? '' : hours.toString();
  };

  const canAddMoreShifts = () => {
    return (settings.customShifts?.length || 0) < 4;
  };

  const getShiftCount = () => {
    return settings.customShifts?.length || 0;
  };

  // Mobile swipe handlers
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

      {/* Basic Salary Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 text-center">Salary Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Basic Salary (Monthly)
            </label>
            <div className="relative max-w-xs mx-auto">
              <input
                type="text"
                value={getSalaryInputValue()}
                onChange={handleSalaryChange}
                onFocus={handleSalaryFocus}
                onBlur={handleSalaryBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-base font-medium"
                placeholder="30,000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Hourly Rate (Auto-calculated)
            </label>
            <div className="relative max-w-xs mx-auto">
              <input
                type="text"
                value={formatHourlyRate(settings.hourlyRate || 0)}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 text-center text-base font-medium"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Formula: Basic Salary × 12 ÷ 52 ÷ 40
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
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={getHoursDisplayValue(shift)}
                          placeholder={shift.hours === 0 ? '0' : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow digits and one decimal point
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              handleHoursInputChange(shift.id, value);
                            }
                          }}
                          onFocus={(e) => {
                            const input = e.target as HTMLInputElement;
                            const currentValue = shift.hours || 0;
                            
                            // If the value is 0, keep it empty with placeholder
                            if (currentValue === 0) {
                              input.value = '';
                              input.placeholder = '0';
                              input.style.color = '#9CA3AF';
                              setHoursInputValues(prev => ({ ...prev, [shift.id]: '' }));
                            } else {
                              input.value = currentValue.toString();
                              input.placeholder = '';
                              input.style.color = '#374151';
                              setHoursInputValues(prev => ({ ...prev, [shift.id]: currentValue.toString() }));
                            }
                          }}
                          onBlur={(e) => {
                            handleHoursInputBlur(shift.id, e.target as HTMLInputElement);
                          }}
                          className="w-full px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-sm hours-input"
                          style={{
                            color: shift.hours === 0 ? '#9CA3AF' : '#374151'
                          }}
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
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                        <span className="px-2 py-2 bg-gray-100 rounded text-center text-sm font-mono text-gray-700 block">
                          {formatCurrency(calculateAmount(shift.hours || 0))}
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
      />
      
      {/* Toast Notification */}
      <ToastNotification
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        duration={3000}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};