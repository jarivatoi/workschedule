import React, { useState, useRef, useEffect } from 'react';
import { Clock, Edit, Trash2 } from 'lucide-react';

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
  const isHorizontalGesture = useRef(false);
  const dragStarted = useRef(false);
  const isDragging = useRef(false);

  const SWIPE_THRESHOLD = 50;
  const MAX_SWIPE = 120;

  // Reset swipe
  const resetSwipe = () => {
    setTranslateX(0);
    setShowActions(false);
    setIsDragging(false);
    isHorizontalGesture.current = false;
    dragStarted.current = false;
  };

  // Universal start handler
  const handleStart = (clientX: number, clientY: number) => {
    console.log('🎯 Start drag at:', { x: clientX, y: clientY });
    startX.current = clientX;
    startY.current = clientY;
    currentX.current = clientX;
    setIsDragging(true);
    isHorizontalGesture.current = false;
    dragStarted.current = false;
  };

  // Universal move handler
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    currentX.current = clientX;
    const deltaX = currentX.current - startX.current; // Right movement = positive, Left movement = negative
    const deltaY = Math.abs(startY.current - clientY);
    
    console.log('🎯 Move:', { 
      deltaX, 
      deltaY, 
      isDragging, 
      startX: startX.current, 
      currentX: currentX.current,
      direction: deltaX > 0 ? 'right' : 'left'
    });
    
    // Determine if this is a horizontal gesture
    if (Math.abs(deltaX) > 5 && Math.abs(deltaX) > deltaY) {
      isHorizontalGesture.current = true;
      dragStarted.current = true;
      
      // Only allow left swipe (negative deltaX, but we want positive translateX)
      if (deltaX < 0) {
        const clampedOffset = Math.min(Math.abs(deltaX), MAX_SWIPE);
        setTranslateX(clampedOffset);
        console.log('🎯 Setting translateX:', clampedOffset, 'from deltaX:', deltaX);
      } else {
        setTranslateX(0);
        console.log('🎯 Resetting translateX (wrong direction)');
      }
    }
  };

  // Universal end handler
  const handleEnd = () => {
    console.log('🎯 End drag, translateX:', translateX, 'threshold:', SWIPE_THRESHOLD, 'showActions will be:', translateX > SWIPE_THRESHOLD);
    setIsDragging(false);
    
    if (isHorizontalGesture.current && dragStarted.current) {
      if (translateX > SWIPE_THRESHOLD) {
        // Show actions
        setTranslateX(MAX_SWIPE);
        setShowActions(true);
        console.log('🎯 Showing actions');
      } else {
        // Snap back
        setTranslateX(0);
        setShowActions(false);
        console.log('🎯 Snapping back');
      }
    } else {
      resetSwipe();
    }
    
    isHorizontalGesture.current = false;
    dragStarted.current = false;
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('🖱️ Mouse down');
    handleStart(e.clientX, e.clientY);
    
    // Add global mouse event listeners
    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault();
      handleMove(event.clientX, event.clientY);
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      console.log('🖱️ Mouse up');
      handleEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    console.log('👆 Touch start');
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    console.log('👆 Touch end');
    handleEnd();
  };

  const handleEdit = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onEdit();
    resetSwipe();
  };

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onDelete();
    resetSwipe();
  };

  const handleClickOutside = (e: MouseEvent | TouchEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      resetSwipe();
    }
  };

  useEffect(() => {
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
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
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
          onTouchEnd={handleEdit}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200"
          style={{ minWidth: '60px' }}
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={handleDelete}
          onTouchEnd={handleDelete}
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
          cursor: isDragging ? 'grabbing' : 'grab',
          border: isDragging ? '2px solid red' : 'none'
        }}
        onMouseDown={handleMouseDown}
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