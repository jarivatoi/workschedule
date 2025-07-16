import React, { useState, useRef } from 'react';
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
  const [offset, setOffset] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const startX = useRef(0);
  const currentOffset = useRef(0);
  
  const MAX_OFFSET = 120;
  const THRESHOLD = 60;

  // Simple mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('🖱️ Mouse down at:', e.clientX);
    setIsDragging(true);
    startX.current = e.clientX;
    currentOffset.current = offset;
    
    // Add global listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = startX.current - e.clientX; // Left drag = positive
    const newOffset = Math.max(0, Math.min(MAX_OFFSET, currentOffset.current + deltaX));
    
    console.log('🖱️ Moving:', { deltaX, newOffset });
    setOffset(newOffset);
  };

  const handleMouseUp = () => {
    console.log('🖱️ Mouse up, offset:', offset);
    setIsDragging(false);
    
    // Snap to position
    if (offset > THRESHOLD) {
      setOffset(MAX_OFFSET);
      setShowActions(true);
    } else {
      setOffset(0);
      setShowActions(false);
    }
    
    // Remove global listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    console.log('👆 Touch start at:', touch.clientX);
    setIsDragging(true);
    startX.current = touch.clientX;
    currentOffset.current = offset;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = startX.current - touch.clientX; // Left drag = positive
    const newOffset = Math.max(0, Math.min(MAX_OFFSET, currentOffset.current + deltaX));
    
    console.log('👆 Touch moving:', { deltaX, newOffset });
    setOffset(newOffset);
    
    if (newOffset > 0) {
      e.preventDefault(); // Prevent scrolling when swiping
    }
  };

  const handleTouchEnd = () => {
    console.log('👆 Touch end, offset:', offset);
    setIsDragging(false);
    
    // Snap to position
    if (offset > THRESHOLD) {
      setOffset(MAX_OFFSET);
      setShowActions(true);
    } else {
      setOffset(0);
      setShowActions(false);
    }
  };

  // Double click for easy access on desktop
  const handleDoubleClick = () => {
    console.log('🖱️ Double click');
    if (showActions) {
      setOffset(0);
      setShowActions(false);
    } else {
      setOffset(MAX_OFFSET);
      setShowActions(true);
    }
  };

  // Close actions
  const closeActions = () => {
    setOffset(0);
    setShowActions(false);
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Action buttons - positioned absolutely behind the card */}
      <div 
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: MAX_OFFSET }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
            closeActions();
          }}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            closeActions();
          }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content */}
      <div
        className={`relative bg-white p-4 transition-transform duration-200 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          transform: `translateX(-${offset}px)`,
          userSelect: 'none',
          // Visual debugging
          border: isDragging ? '2px solid red' : 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        onClick={closeActions}
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
        <div className="mt-2 text-center text-xs text-gray-500">
          💻 Double-click or 📱 Swipe left to edit
        </div>
      </div>
    </div>
  );
};