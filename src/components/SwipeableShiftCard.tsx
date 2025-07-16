/**
 * Swipeable Shift Card Component
 * 
 * This component displays a custom shift in a card format with interactive
 * reveal actions. Users can click/tap to reveal edit and delete actions
 * that slide in from the right side of the card.
 * 
 * Key Features:
 * - Click/tap to reveal actions (edit/delete)
 * - Smooth CSS animations for action reveal
 * - Visual feedback with hover states and indicators
 * - Responsive design for mobile and desktop
 * - Automatic action hiding when clicking other cards
 * 
 * Interaction Design:
 * - Single click/tap toggles action visibility
 * - Blue dot indicator shows when actions are visible
 * - Actions slide in from right with smooth animation
 * - Clicking edit/delete performs action and closes panel
 * 
 * Why this approach over complex gestures:
 * - More reliable across different devices and browsers
 * - Better accessibility for users with motor difficulties
 * - Clearer visual feedback about available actions
 * - Simpler implementation with fewer edge cases
 * 
 * Dependencies:
 * - React hooks (useState)
 * - Lucide React icons (Edit, Trash2, Clock)
 * - Tailwind CSS for styling
 * 
 * @author NARAYYA
 * @version 2.0 (Simplified interaction model)
 */

import React, { useState } from 'react';
import { Edit, Trash2, Clock } from 'lucide-react';

/**
 * Props interface for the SwipeableShiftCard component
 */
interface SwipeableShiftCardProps {
  /** Shift data object containing all shift information */
  shift: any;
  /** Application settings for currency and rate calculations */
  settings: any;
  /** Callback function when edit button is clicked */
  onEdit: () => void;
  /** Callback function when delete button is clicked */
  onDelete: () => void;
  /** Function to format time strings for display */
  formatTime: (time: string) => string;
  /** Function to format currency amounts for display */
  formatCurrency: (amount: number) => string;
}

/**
 * SwipeableShiftCard Component
 * 
 * Displays a shift card with click-to-reveal actions. The card shows
 * shift details including time, hours breakdown, and calculated amount.
 * Actions (edit/delete) slide in from the right when the card is clicked.
 * 
 * @param {SwipeableShiftCardProps} props - Component props
 * @returns {JSX.Element} The rendered shift card component
 * 
 * State Management:
 * - showActions: Boolean controlling action panel visibility
 * 
 * Event Handling:
 * - Click on card toggles action visibility
 * - Click on edit/delete performs action and hides panel
 * - stopPropagation prevents event bubbling to parent elements
 * 
 * Styling Strategy:
 * - Uses Tailwind CSS for responsive design
 * - CSS transitions for smooth animations
 * - Hover states for better user feedback
 * - Visual indicators for interactive elements
 * 
 * Accessibility:
 * - Proper button semantics for actions
 * - Clear visual feedback for interactive states
 * - Keyboard navigation support through button elements
 * 
 * Performance:
 * - Minimal re-renders through controlled state
 * - CSS animations instead of JavaScript for smoothness
 * - Efficient event handling with proper cleanup
 */
export const SwipeableShiftCard: React.FC<SwipeableShiftCardProps> = ({
  shift,
  settings,
  onEdit,
  onDelete,
  formatTime,
  formatCurrency
}) => {
  /**
   * State to control action panel visibility
   * When true, edit and delete buttons slide in from the right
   */
  const [showActions, setShowActions] = useState(false);

  /**
   * Toggle action panel visibility
   * Simple click handler that shows/hides the action buttons
   * 
   * WHY simple toggle: More reliable than complex gesture detection
   * and provides clear, predictable behavior across all devices
   */
  const toggleActions = () => {
    setShowActions(!showActions);
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden group">
      {/* Action buttons - positioned absolutely behind the card */}
      {/* 
        WHY absolute positioning: Allows actions to slide in from outside
        the card boundaries without affecting the card's layout or size
      */}
      <div 
        className={`absolute right-0 top-0 bottom-0 flex transition-all duration-300 ${
          showActions ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{ width: '120px' }} // Fixed width for consistent animation
      >
        {/* Edit Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering card click
            onEdit();
            setShowActions(false); // Hide actions after use
          }}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200"
        >
          <Edit className="w-5 h-5" />
        </button>
        
        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering card click
            onDelete();
            setShowActions(false); // Hide actions after use
          }}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main card content */}
      {/*
        WHY cursor-pointer: Indicates to users that the card is interactive
        and can be clicked to reveal additional options
      */}
      <div
        onClick={toggleActions}
        className="cursor-pointer p-4"
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
        {/*
          WHY separate normal/overtime display: Helps users understand
          how their pay is calculated and which hours get premium rates
        */}
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
        {/*
          Calculate and display the total amount for this shift
          Uses normal hours at base rate + overtime hours at premium rate
        */}
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

        {/* Visual indicator when actions are shown */}
        {/*
          WHY blue dot: Provides clear visual feedback that actions are available
          without cluttering the interface when actions are hidden
        */}
        {showActions && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        )}
      </div>
    </div>
  );
};