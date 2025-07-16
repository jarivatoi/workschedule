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
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const SWIPE_THRESHOLD = 50;
  const MAX_SWIPE = 120;

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = touch.clientX;
    setIsDragging(true);
    isHorizontalSwipe.current = false;
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    currentX.current = touch.clientX;
    
    const deltaX = startX.current - currentX.current;
    const deltaY = Math.abs(startY.current - touch.clientY);
    
    // Determine if this is a horizontal swipe
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > deltaY * 2) {
      isHorizontalSwipe.current = true;
      e.preventDefault(); // Prevent scrolling when swiping horizontally
      
      // Only allow left swipe (positive deltaX)
      if (deltaX > 0) {
        const clampedOffset = Math.min(deltaX, MAX_SWIPE);
        setTranslateX(clampedOffset);
      } else {
        setTranslateX(0);
      }
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (isHorizontalSwipe.current) {
      if (translateX > SWIPE_THRESHOLD) {
        // Show actions
        setTranslateX(MAX_SWIPE);
        setShowActions(true);
      } else {
        // Snap back
        setTranslateX(0);
        setShowActions(false);
      }
    }
    
    isHorizontalSwipe.current = false;
  };

  // Reset swipe
  const resetSwipe = () => {
    setTranslateX(0);
    setShowActions(false);
  };

  // Handle action clicks
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetSwipe();
    onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetSwipe();
    onDelete();
  };

  // Close swipe when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        resetSwipe();
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showActions]);

  return (
    <div 
      ref={cardRef}
      className="relative bg-white border border-gray-200 rounded-lg overflow-hidden select-none"
      style={{
        touchAction: 'pan-y', // Allow vertical scrolling
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {/* Action buttons background */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex"
        style={{
          width: `${MAX_SWIPE}px`,
          transform: `translateX(${MAX_SWIPE - translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          zIndex: 1
        }}
      >
        <button
          onClick={handleEdit}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200"
          style={{ minWidth: '60px' }}
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
          style={{ minWidth: '60px' }}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content */}
      <div
        className="relative bg-white p-4 cursor-pointer select-none"
        style={{
          transform: `translateX(-${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          zIndex: 2
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
            <span className="text-xs text-indigo-600 font-medium">Total Amount</span>
          </div>
          <div className="text-lg font-bold text-indigo-800">
            {formatCurrency(
              (shift.normalHours || 0) * (settings.hourlyRate || 0) +
              (shift.overtimeHours || 0) * ((settings.hourlyRate || 0) * (settings.overtimeMultiplier || 1.5))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};