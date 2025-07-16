import React, { useState } from 'react';
import { Edit, Trash2, Clock } from 'lucide-react';

interface SwipeableShiftCardProps {
  shift: any;
  settings: any;
  onEdit: () => void;
  onDelete: () => void;
  formatTime: (time: string) => string;
  formatCurrency: (amount: number) => string;
}

export const SwipeableShiftCard: React.FC<SwipeableShiftCardProps> = ({
  shift,
  settings,
  onEdit,
  onDelete,
  formatTime,
  formatCurrency
}) => {
  const [showActions, setShowActions] = useState(false);

  // Simple toggle for actions
  const toggleActions = () => {
    setShowActions(!showActions);
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden group">
      {/* Action buttons - positioned absolutely behind the card */}
      <div 
        className={`absolute right-0 top-0 bottom-0 flex transition-all duration-300 ${
          showActions ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{ width: '120px' }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
            setShowActions(false);
          }}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            setShowActions(false);
          }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content */}
      <div
        onClick={toggleActions}
        className="cursor-pointer"
      >
        {/* Shift Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800 text-lg">{shift.label}</h4>
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full font-medium">
            {shift.hours}h
          </span>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-center mb-3 p-2 bg-gray-50 rounded-lg">
          <Clock className="w-4 h-4 text-gray-600 mr-2" />
          <span className="font-medium text-gray-800">
            {formatTime(shift.fromTime)} - {formatTime(shift.toTime)}
          </span>
        </div>

        {/* Hours Breakdown */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <div className="text-xs text-green-600 font-medium">Normal</div>
            <div className="text-sm font-bold text-green-800">{shift.normalHours || 0}h</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg">
            <div className="text-xs text-orange-600 font-medium">Overtime</div>
            <div className="text-sm font-bold text-orange-800">{shift.overtimeHours || 0}h</div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <span className="text-xs text-indigo-600 font-medium">Total Amount</span>
          </div>
          <div className="text-lg font-bold text-indigo-800">
            {formatCurrency(
              (shift.normalHours || 0) * (settings.hourlyRate || 0) +
              (shift.overtimeHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-2 text-center text-xs text-gray-500 select-none">
          {showActions ? 'Tap Edit or Delete' : 'Tap to show actions'}
        </div>

        {/* Visual indicator when actions are shown */}
        {showActions && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};