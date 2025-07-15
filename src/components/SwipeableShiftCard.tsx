import React, { useState, useRef, useEffect } from 'react';
import { Clock, Calculator, DollarSign, Edit, Trash2 } from 'lucide-react';

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
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);

  const SWIPE_THRESHOLD = 60; // Minimum swipe distance to show actions
  const MAX_SWIPE = 120; // Maximum swipe distance

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.touches[0].clientX;
    const deltaX = startX.current - currentX.current;
    
    // Only allow left swipe (positive deltaX)
    if (deltaX > 0) {
      const clampedOffset = Math.min(deltaX, MAX_SWIPE);
      setSwipeOffset(clampedOffset);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      // Show actions
      setSwipeOffset(MAX_SWIPE);
      setShowActions(true);
    } else {
      // Snap back
      setSwipeOffset(0);
      setShowActions(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startX.current = e.clientX;
    currentX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    currentX.current = e.clientX;
    const deltaX = startX.current - currentX.current;
    
    if (deltaX > 0) {
      const clampedOffset = Math.min(deltaX, MAX_SWIPE);
      setSwipeOffset(clampedOffset);
    } else {
      setSwipeOffset(0);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (swipeOffset > SWIPE_THRESHOLD) {
      setSwipeOffset(MAX_SWIPE);
      setShowActions(true);
    } else {
      setSwipeOffset(0);
      setShowActions(false);
    }
  };

  const resetSwipe = () => {
    setSwipeOffset(0);
    setShowActions(false);
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        resetSwipe();
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  return (
    <div 
      ref={cardRef}
      className="relative bg-white border border-gray-200 rounded-lg overflow-hidden"
      style={{
        touchAction: 'pan-y', // Allow vertical scrolling but handle horizontal ourselves
      }}
    >
      {/* Action buttons background */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex items-center"
        style={{
          width: `${MAX_SWIPE}px`,
          transform: `translateX(${MAX_SWIPE - swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        <button
          onClick={onEdit}
          className="flex-1 h-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200"
          style={{ minWidth: '60px' }}
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={onDelete}
          className="flex-1 h-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
          style={{ minWidth: '60px' }}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content */}
      <div
        className="relative bg-white p-4 cursor-pointer select-none"
        style={{
          transform: `translateX(-${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={resetSwipe}
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
            <DollarSign className="w-4 h-4 text-indigo-600 mr-1" />
            <span className="text-xs text-indigo-600 font-medium">Total Amount</span>
          </div>
          <div className="text-lg font-bold text-indigo-800">
            {formatCurrency(
              (shift.normalHours || 0) * (settings.hourlyRate || 0) +
              (shift.overtimeHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5))
            )}
          </div>
        </div>

        {/* Swipe Hint */}
        {!showActions && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">
            <div className="text-xs">← Swipe</div>
          </div>
        )}
      </div>
    </div>
  );
};