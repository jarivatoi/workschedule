/**
 * Tab Navigation Component - Animated Tab Switching Interface
 * 
 * This component provides a sleek, animated tab navigation system for switching
 * between the main application views (Calendar, Settings, Data). It features
 * smooth animations, visual feedback, and mobile-optimized interactions.
 * 
 * Key Features:
 * - Smooth sliding background animation between tabs
 * - Icon animations with hover and active states
 * - Text labels that slide in/out based on interaction
 * - Mobile-optimized touch interactions
 * - Hardware-accelerated animations for smooth performance
 * - Visual indicators for active and interactive states
 * 
 * Animation System:
 * - Background slides smoothly between active tabs
 * - Icons scale and pulse to indicate interactivity
 * - Text labels expand/collapse with smooth transitions
 * - Click animations provide immediate feedback
 * - CSS animations for optimal performance
 * 
 * Mobile Optimizations:
 * - Touch-friendly interaction targets
 * - Immediate feedback on touch events
 * - Proper touch action handling
 * - Webkit tap highlight removal
 * 
 * Dependencies:
 * - React hooks for state management
 * - GSAP for advanced animations
 * - Lucide React for icons
 * 
 * @author NARAYYA
 * @version 3.0
 */

import React, { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { Calendar, Settings, Database } from 'lucide-react';

/**
 * Tab configuration interface
 * 
 * @interface Tab
 * @property {string} id - Unique identifier for the tab
 * @property {React.ComponentType} icon - Lucide React icon component
 * @property {string} label - Display label for the tab
 */
interface Tab {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

/**
 * Props interface for the TabNavigation component
 * 
 * @interface TabNavigationProps
 * @property {string} activeTab - Currently active tab ID
 * @property {function} onTabChange - Callback when tab selection changes
 */
interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * TabNavigation Component
 * 
 * Renders an animated tab navigation bar with smooth transitions and visual feedback.
 * Handles both mouse and touch interactions with appropriate animations for each.
 * 
 * Animation Strategy:
 * - Uses CSS animations for icon effects (better performance)
 * - GSAP for complex click animations and scaling
 * - Hardware acceleration for smooth mobile performance
 * - Staggered animations for visual hierarchy
 * 
 * State Management:
 * - Tracks hovered tab for preview effects
 * - Maintains local active tab for immediate feedback
 * - Syncs with parent state for actual navigation
 * 
 * @param {TabNavigationProps} props - Component props
 * @returns {JSX.Element} The rendered tab navigation interface
 */
const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  // ==================== CSS ANIMATION SETUP ====================
  
  /**
   * Injects CSS animations for icon effects
   * 
   * Why inject CSS:
   * - Better performance than JavaScript animations for simple effects
   * - Runs on compositor thread (hardware accelerated)
   * - Doesn't block main thread during animations
   * - More reliable across different devices
   * 
   * Animation Types:
   * - iconPulse: Subtle breathing effect for inactive icons
   * - iconBounce: Playful bounce effect for interactions
   * 
   * Cleanup:
   * - Removes style element on component unmount
   * - Prevents memory leaks and style conflicts
   */
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes iconPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.7;
        }
        50% {
          transform: scale(1.05);
          opacity: 1;
        }
      }
      
      @keyframes iconBounce {
        0%, 20%, 50%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-2px);
        }
        60% {
          transform: translateY(-1px);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // ==================== STATE MANAGEMENT ====================
  
  /**
   * Tracks which tab is currently being hovered
   * Used for preview effects and text label animations
   */
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  
  /**
   * Local active tab state for immediate UI feedback
   * Synced with parent prop but allows for optimistic updates
   */
  const [localActiveTab, setLocalActiveTab] = useState<string>(activeTab);
  
  /**
   * Syncs local state with parent prop changes
   * 
   * Why useEffect:
   * - Ensures local state stays in sync with external changes
   * - Handles cases where parent changes active tab programmatically
   * - Maintains consistency between local and global state
   */
  useEffect(() => {
    setLocalActiveTab(activeTab);
  }, [activeTab]);
  
  // ==================== TAB CONFIGURATION ====================
  
  /**
   * Tab configuration array
   * Defines all available tabs with their icons and labels
   * 
   * Order matters:
   * - Determines visual layout
   * - Affects animation calculations
   * - Should match logical user workflow
   */
  const tabs: Tab[] = [
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'data', icon: Database, label: 'Data' }
  ];

  /**
   * Helper functions for tab positioning calculations
   * Used by background animation and visual effects
   */
  const getTabIndex = (tabId: string) => tabs.findIndex(tab => tab.id === tabId);
  const activeIndex = getTabIndex(localActiveTab);
  const backgroundIndex = activeIndex;
  const showBackground = backgroundIndex !== -1;

  // ==================== INTERACTION HANDLERS ====================
  
  /**
   * Handles tab click with advanced animations
   * 
   * @param {string} tabId - ID of the clicked tab
   * 
   * Animation Sequence:
   * 1. Immediate icon scale animation for feedback
   * 2. Background transition animation
   * 3. State updates for UI changes
   * 4. Parent callback with slight delay for smooth UX
   * 
   * Why staggered updates:
   * - Provides immediate visual feedback
   * - Allows animations to complete smoothly
   * - Prevents jarring state changes
   * - Creates more polished user experience
   */
  const handleTabClick = (tabId: string) => {
    if (tabId === localActiveTab) return; // Prevent clicking same tab
    
    // Add click animation to the clicked tab icon
    const clickedTabButton = document.querySelector(`[data-tab-id="${tabId}"] .tab-icon`);
    if (clickedTabButton) {
      gsap.to(clickedTabButton, {
        scale: 1.2,
        duration: 0.15,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        force3D: true
      });
    }
    
    // Animate background transition
    const background = document.querySelector('.tab-background');
    if (background) {
      gsap.to(background, {
        scale: 0.95,
        opacity: 0.7,
        duration: 0.1,
        ease: "power2.out",
        force3D: true,
        onComplete: () => {
          // Update state after brief animation
          setLocalActiveTab(tabId);
          
          // Animate background back
          gsap.to(background, {
            scale: 1,
            opacity: 1,
            duration: 0.2,
            ease: "power2.out",
            force3D: true
          });
        }
      });
    } else {
      // Fallback if background not found
      setLocalActiveTab(tabId);
    }
    
    // Call parent handler with slight delay for smoother UX
    setTimeout(() => {
      onTabChange(tabId);
    }, 50);
  };
  
  /**
   * Handles touch start events for mobile optimization
   * 
   * @param {string} tabId - ID of the touched tab
   * 
   * Mobile-Specific Behavior:
   * - Faster animation timing for immediate feedback
   * - Simplified animation to reduce complexity
   * - Immediate state updates for responsiveness
   * 
   * Why separate from click:
   * - Touch events have different timing requirements
   * - Mobile users expect immediate feedback
   * - Prevents double-handling of events
   */
  const handleTouchStart = (tabId: string) => {
    if (tabId === localActiveTab) return; // Prevent touching same tab
    
    // Mobile-optimized touch animation
    const touchedTabButton = document.querySelector(`[data-tab-id="${tabId}"] .tab-icon`);
    if (touchedTabButton) {
      gsap.to(touchedTabButton, {
        scale: 1.15,
        duration: 0.1,
        ease: "power2.out",
        force3D: true,
        onComplete: () => {
          gsap.to(touchedTabButton, {
            scale: 1,
            duration: 0.15,
            ease: "power2.out",
            force3D: true
          });
        }
      });
    }
    
    // Update state immediately for mobile responsiveness
    setLocalActiveTab(tabId);
    onTabChange(tabId);
  };

  // ==================== RENDER ====================
  
  return (
    <div className="flex justify-center mb-6">
      <div className="relative bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-2">
        {/* Tab buttons container */}
        <div className="relative grid grid-cols-3 w-80">
          {/* Animated background that slides between tabs */}
          {showBackground && (
            <div 
              className="tab-background absolute inset-y-0 bg-blue-500/10 rounded-xl transition-all duration-300 ease-out"
              style={{
                width: 'calc(33.333% - 8px)',
                left: `calc(${backgroundIndex * 33.333}% + 4px)`,
                top: '0px',
                bottom: '0px'
              }}
            />
          )}
          
          {/* Top indicator line for active tab */}
          {activeIndex !== -1 && (
            <div 
              className="absolute top-1 h-0.5 bg-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{
                width: 'calc(33.333% - 48px)',
                left: `calc(${activeIndex * 33.333}% + 24px)`
              }}
            />
          )}

          {/* Tab buttons */}
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = tab.id === localActiveTab;
            const isHovered = hoveredTab === tab.id;
            const showText = isActive || isHovered;

            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => handleTabClick(tab.id)}
                onTouchStart={() => handleTouchStart(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className="relative h-12 flex items-center transition-all duration-200 rounded-xl overflow-hidden px-2 pt-2"
                style={{
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Icon and text container */}
                <div className={`flex items-center h-full w-full transition-all duration-300 ${
                  showText ? 'justify-center space-x-2' : 'justify-center'
                }`}>
                  {/* Icon with animations */}
                  <Icon 
                    className="tab-icon w-5 h-5 transition-all duration-300 flex-shrink-0 hover:scale-[1.4] active:scale-95"
                    style={{
                      color: isActive ? '#2563eb' : isHovered ? '#3b82f6' : '#4b5563',
                      animation: !isActive ? 'iconPulse 2s ease-in-out infinite' : 'none'
                    }}
                  />
                  
                  {/* Text label with slide animation */}
                  <div className={`overflow-hidden transition-all duration-300 ${
                    showText ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0'
                  }`}>
                    <span 
                      className={`text-xs font-medium whitespace-nowrap block transition-all duration-300 ${
                        isActive ? 'text-blue-600' : isHovered ? 'text-blue-500' : 'text-gray-600'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;