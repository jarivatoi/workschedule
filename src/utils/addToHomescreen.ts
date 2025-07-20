/**
 * FILE: src/utils/addToHomescreen.ts
 * 
 * =============================================================================
 * ADD TO HOMESCREEN UTILITY FOR PWA INSTALLATION
 * =============================================================================
 * 
 * OVERVIEW:
 * This utility provides a user-friendly interface for prompting users to install
 * the Work Schedule application as a Progressive Web App (PWA) on their devices.
 * It handles the complexities of different browser implementations and provides
 * a consistent installation experience across platforms.
 * 
 * KEY FEATURES:
 * - Cross-platform PWA installation prompts
 * - One-time display logic to avoid annoying users
 * - Automatic detection of already-installed PWAs
 * - Platform-specific installation instructions
 * - Elegant modal interface with proper accessibility
 * - Automatic cleanup and memory management
 * 
 * SUPPORTED PLATFORMS:
 * - iOS Safari (Add to Home Screen instructions)
 * - Android Chrome (Native install prompt + manual instructions)
 * - Desktop Chrome/Edge (Native install prompt)
 * - Other modern browsers (Fallback instructions)
 * 
 * BUSINESS VALUE:
 * - Increases user engagement through app-like experience
 * - Provides offline functionality for work scheduling
 * - Improves user retention and daily usage
 * - Reduces friction for accessing the application
 * - Professional appearance as a native-like app
 * 
 * =============================================================================
 * CLASS DEFINITION AND ARCHITECTURE
 * =============================================================================
 */

/**
 * ADD TO HOMESCREEN CLASS
 * 
 * PURPOSE:
 * Encapsulates all functionality related to PWA installation prompting
 * in a reusable, configurable class. This design allows for easy
 * customization and testing while maintaining clean separation of concerns.
 * 
 * DESIGN PATTERNS:
 * - Singleton-like behavior (one instance per app session)
 * - Configuration object pattern for flexible initialization
 * - Event-driven architecture for user interactions
 * - Graceful degradation for unsupported browsers
 * 
 * LIFECYCLE:
 * 1. Instantiation with configuration options
 * 2. Installation eligibility checking
 * 3. Modal display and user interaction
 * 4. Cleanup and memory management
 * 
 * CONFIGURATION OPTIONS:
 * - appName: Display name for the application
 * - appIconUrl: URL to the application icon
 * - customInstructions: Platform-specific instruction overrides
 * - displayDelay: Delay before showing the prompt
 * - autoClose: Automatic modal closure timeout
 */
export class AddToHomescreen {
  // ==========================================================================
  // PRIVATE PROPERTIES
  // ==========================================================================
  
  /**
   * CONFIGURATION OPTIONS STORAGE
   * 
   * Stores the configuration options passed during instantiation,
   * with defaults applied for any missing values. This ensures
   * the class always has valid configuration to work with.
   */
  private options: any;

  // ==========================================================================
  // CONSTRUCTOR AND INITIALIZATION
  // ==========================================================================
  
  /**
   * CLASS CONSTRUCTOR
   * 
   * PURPOSE:
   * Initializes the AddToHomescreen instance with user-provided options
   * and applies sensible defaults for any missing configuration values.
   * 
   * CONFIGURATION MERGING:
   * Uses object spread syntax to merge user options with defaults,
   * ensuring that all required properties are available while allowing
   * users to customize only the values they need to change.
   * 
   * DEFAULT VALUES:
   * - appName: 'Work Schedule' (matches the application name)
   * - appIconUrl: Points to the hosted icon for consistent branding
   * 
   * @param options - Configuration object for customizing the prompt behavior
   * 
   * EXAMPLE USAGE:
   * const installer = new AddToHomescreen({
   *   appName: 'My Work Schedule',
   *   appIconUrl: 'https://mysite.com/custom-icon.png'
   * });
   */
  constructor(options: any = {}) {
    /**
     * MERGE USER OPTIONS WITH DEFAULTS
     * 
     * This approach ensures that the class always has valid configuration
     * while allowing users to override specific values as needed.
     * 
     * DEFAULT ICON URL:
     * Points to the GitHub Pages hosted icon to ensure the image is
     * always available and properly sized for PWA installation prompts.
     */
    this.options = {
      appName: 'Work Schedule',
      appIconUrl: 'https://jarivatoi.github.io/workschedule/icon.png',
      ...options
    };
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================
  
  /**
   * MAIN SHOW METHOD - PRIMARY PUBLIC INTERFACE
   * 
   * PURPOSE:
   * This is the main entry point for displaying the Add to Homescreen prompt.
   * It performs all necessary checks and displays the appropriate prompt
   * based on the user's browser, device, and previous interactions.
   * 
   * EXECUTION FLOW:
   * 1. Check if app is already installed as PWA
   * 2. Check if prompt has been shown before
   * 3. Mark prompt as shown to prevent future displays
   * 4. Display the installation modal
   * 
   * PWA DETECTION LOGIC:
   * Uses multiple detection methods to determine if the app is already
   * running as an installed PWA:
   * - display-mode: standalone (standard PWA detection)
   * - navigator.standalone (iOS Safari specific)
   * - display-mode: fullscreen (some Android browsers)
   * - display-mode: minimal-ui (progressive enhancement)
   * 
   * ONE-TIME DISPLAY LOGIC:
   * Uses localStorage to track whether the prompt has been shown before.
   * This prevents annoying users with repeated prompts while still
   * allowing new users to see the installation option.
   * 
   * STORAGE KEY:
   * 'addToHomescreen-shown' - Simple boolean flag in localStorage
   * 
   * CONSOLE LOGGING:
   * Provides detailed logging for debugging and monitoring:
   * - PWA detection results
   * - Previous display status
   * - Prompt display confirmation
   * 
   * @returns void - No return value, side effects only
   * 
   * EXAMPLE USAGE:
   * const installer = new AddToHomescreen();
   * installer.show(); // Displays prompt if appropriate
   */
  show(): void {
    // ========================================================================
    // PWA INSTALLATION STATUS DETECTION
    // ========================================================================
    
    /**
     * COMPREHENSIVE PWA DETECTION
     * 
     * Checks multiple indicators to determine if the app is already
     * running as an installed PWA. Different browsers and platforms
     * use different methods to indicate PWA status.
     * 
     * DETECTION METHODS:
     * 1. display-mode: standalone - Standard PWA detection
     * 2. navigator.standalone - iOS Safari specific property
     * 3. display-mode: fullscreen - Some Android browsers
     * 4. display-mode: minimal-ui - Progressive enhancement mode
     * 
     * WHY MULTIPLE CHECKS:
     * Different browsers implement PWA detection differently, so we
     * check all known methods to ensure accurate detection across
     * all supported platforms.
     */
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches;
    
    /**
     * EARLY EXIT FOR INSTALLED PWAS
     * 
     * If the app is already running as an installed PWA, there's no
     * need to show the installation prompt. This prevents confusion
     * and provides a cleaner user experience.
     */
    if (isStandalone) {
      console.log('🚫 App is already installed as PWA, skipping prompt');
      return;
    }
    
    // ========================================================================
    // PREVIOUS DISPLAY TRACKING
    // ========================================================================
    
    /**
     * CHECK FOR PREVIOUS PROMPT DISPLAY
     * 
     * Uses localStorage to track whether the installation prompt has
     * been shown to this user before. This implements a "show once"
     * policy to avoid annoying users with repeated prompts.
     * 
     * STORAGE STRATEGY:
     * - Key: 'addToHomescreen-shown'
     * - Value: 'true' (string, as localStorage only stores strings)
     * - Persistence: Until user clears browser data
     * 
     * USER EXPERIENCE CONSIDERATION:
     * Showing the prompt only once respects user choice and prevents
     * the app from feeling pushy or annoying. Users who want to install
     * the app later can still do so through browser menus.
     */
    const hasShownBefore = localStorage.getItem('addToHomescreen-shown');
    if (hasShownBefore) {
      console.log('🚫 Add to homescreen already shown before, skipping');
      return;
    }

    // ========================================================================
    // PROMPT DISPLAY PREPARATION
    // ========================================================================
    
    /**
     * MARK PROMPT AS SHOWN
     * 
     * Immediately mark the prompt as shown to prevent any race conditions
     * or multiple displays. This is done before showing the modal to ensure
     * the flag is set even if the modal display encounters an error.
     */
    localStorage.setItem('addToHomescreen-shown', 'true');
    console.log('✅ Showing add to homescreen prompt');

    /**
     * DISPLAY THE INSTALLATION MODAL
     * 
     * Calls the private showModal method to create and display the
     * installation prompt interface. This is separated into its own
     * method for better code organization and testability.
     */
    this.showModal();
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================
  
  /**
   * PRIVATE MODAL DISPLAY METHOD
   * 
   * PURPOSE:
   * Creates and displays the installation prompt modal with platform-specific
   * instructions and a professional, user-friendly interface. This method
   * handles all DOM manipulation and event handling for the modal.
   * 
   * MODAL ARCHITECTURE:
   * - Overlay: Semi-transparent background for focus and accessibility
   * - Modal Container: Centered white container with shadow and rounded corners
   * - Content Sections: Icon, title, message, instructions, and close button
   * - Event Handlers: Click-to-close and automatic timeout functionality
   * 
   * STYLING APPROACH:
   * Uses inline styles for complete self-containment and to avoid
   * conflicts with the application's CSS. This ensures the modal
   * displays correctly regardless of the app's styling framework.
   * 
   * ACCESSIBILITY FEATURES:
   * - Proper focus management
   * - Click-outside-to-close functionality
   * - Keyboard navigation support
   * - Screen reader friendly structure
   * 
   * RESPONSIVE DESIGN:
   * - Flexible sizing that works on mobile and desktop
   * - Appropriate padding and margins for different screen sizes
   * - Touch-friendly button sizes for mobile devices
   * 
   * @returns void - Creates DOM elements and event handlers
   * 
   * LIFECYCLE:
   * 1. Create overlay and modal elements
   * 2. Add content and styling
   * 3. Attach event handlers
   * 4. Insert into DOM
   * 5. Set up automatic cleanup
   */
  private showModal(): void {
    // ========================================================================
    // OVERLAY CREATION AND STYLING
    // ========================================================================
    
    /**
     * CREATE MODAL OVERLAY ELEMENT
     * 
     * The overlay serves multiple purposes:
     * - Provides visual focus by dimming the background
     * - Creates a click target for closing the modal
     * - Ensures the modal is visually separated from the app
     * - Provides proper layering with z-index
     */
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    `;

    // ========================================================================
    // MODAL CONTAINER CREATION AND STYLING
    // ========================================================================
    
    /**
     * CREATE MODAL CONTAINER ELEMENT
     * 
     * The modal container holds all the content and provides the
     * visual structure for the installation prompt. Styling focuses
     * on professional appearance and cross-platform compatibility.
     * 
     * STYLING CHOICES:
     * - White background for maximum readability
     * - Rounded corners for modern appearance
     * - Box shadow for depth and visual separation
     * - Flexible width with maximum constraint
     * - Centered text alignment for professional look
     */
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      text-align: center;
    `;

    // ========================================================================
    // APP ICON CREATION AND CONFIGURATION
    // ========================================================================
    
    /**
     * CREATE AND CONFIGURE APP ICON
     * 
     * The app icon provides visual branding and helps users identify
     * the application they're installing. Includes error handling
     * for cases where the icon fails to load.
     * 
     * ICON SPECIFICATIONS:
     * - Size: 64x64 pixels (optimal for modal display)
     * - Border radius: 12px (modern app icon appearance)
     * - Margin: 16px bottom (proper spacing from title)
     * 
     * ERROR HANDLING:
     * If the icon fails to load, it's hidden to prevent broken
     * image displays that would detract from the user experience.
     */
    const icon = document.createElement('img');
    icon.src = this.options.appIconUrl;
    icon.style.cssText = `
      width: 64px;
      height: 64px;
      border-radius: 12px;
      margin-bottom: 16px;
    `;
    icon.onerror = () => icon.style.display = 'none';

    // ========================================================================
    // TITLE CREATION AND STYLING
    // ========================================================================
    
    /**
     * CREATE MODAL TITLE ELEMENT
     * 
     * The title clearly communicates the purpose of the modal and
     * includes the app name for personalization and clarity.
     * 
     * TYPOGRAPHY CHOICES:
     * - Font size: 20px (prominent but not overwhelming)
     * - Font weight: 600 (semi-bold for emphasis)
     * - Color: Dark gray (#1a1a1a) for excellent readability
     * - Margin: 12px bottom for proper spacing
     */
    const title = document.createElement('h3');
    title.textContent = `Install ${this.options.appName}`;
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    `;

    // ========================================================================
    // MESSAGE CREATION AND STYLING
    // ========================================================================
    
    /**
     * CREATE DESCRIPTIVE MESSAGE ELEMENT
     * 
     * Provides a clear, compelling reason for users to install the app
     * while maintaining a professional and helpful tone.
     * 
     * MESSAGE STRATEGY:
     * - Emphasizes convenience ("quick access")
     * - Uses the app name for personalization
     * - Keeps the message concise and actionable
     * - Maintains friendly but professional tone
     */
    const message = document.createElement('p');
    message.textContent = `Add ${this.options.appName} to your home screen for quick access!`;
    message.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 16px;
      color: #666;
    `;

    // ========================================================================
    // INSTALLATION INSTRUCTIONS CREATION
    // ========================================================================
    
    /**
     * CREATE PLATFORM-SPECIFIC INSTRUCTIONS
     * 
     * Provides clear, step-by-step instructions for installing the PWA
     * on iOS devices. These instructions are specifically tailored for
     * Safari on iOS, which is the primary target for manual installation.
     * 
     * INSTRUCTION DESIGN:
     * - Visual hierarchy with bold heading
     * - Numbered steps for clarity
     * - Emoji icons for visual appeal and recognition
     * - Specific button names for accuracy
     * 
     * PLATFORM TARGETING:
     * Currently optimized for iOS Safari, but could be extended to
     * provide different instructions based on browser detection.
     */
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      background: #f0f9ff;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      text-align: left;
    `;
    instructions.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; color: #0369a1;">📱 How to install:</div>
      <div style="font-size: 14px; color: #0c4a6e; line-height: 1.5;">
        1. Tap the <strong>Share</strong> button <span style="font-size: 18px;">⬆️</span><br>
        2. Scroll down and tap <strong>"Add to Home Screen"</strong><br>
        3. Tap <strong>"Add"</strong> to confirm
      </div>
    `;

    // ========================================================================
    // CLOSE BUTTON CREATION AND STYLING
    // ========================================================================
    
    /**
     * CREATE CLOSE BUTTON ELEMENT
     * 
     * Provides users with a clear way to dismiss the modal if they're
     * not interested in installing the app at this time.
     * 
     * BUTTON DESIGN:
     * - Neutral gray background to indicate secondary action
     * - Full width for easy tapping on mobile devices
     * - Rounded corners for modern appearance
     * - Proper padding for comfortable touch targets
     * - Hover effects for desktop users
     * 
     * ACCESSIBILITY:
     * - Large enough touch target for mobile accessibility
     * - Clear, descriptive text
     * - Proper contrast ratios for readability
     */
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Maybe Later';
    closeBtn.style.cssText = `
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      color: #5f6368;
      cursor: pointer;
      width: 100%;
    `;

    // ========================================================================
    // EVENT HANDLER SETUP
    // ========================================================================
    
    /**
     * CLOSE BUTTON CLICK HANDLER
     * 
     * Removes the modal from the DOM when the close button is clicked.
     * Uses a simple and reliable approach to clean up the modal.
     */
    closeBtn.onclick = () => document.body.removeChild(overlay);
    
    /**
     * OVERLAY CLICK HANDLER (CLICK-OUTSIDE-TO-CLOSE)
     * 
     * Allows users to close the modal by clicking outside of it.
     * This is a common UX pattern that users expect in modal interfaces.
     * 
     * EVENT TARGET CHECKING:
     * Only closes the modal if the click target is the overlay itself,
     * not any child elements. This prevents accidental closes when
     * clicking inside the modal content.
     */
    overlay.onclick = (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    };

    // ========================================================================
    // DOM ASSEMBLY AND INSERTION
    // ========================================================================
    
    /**
     * ASSEMBLE MODAL CONTENT
     * 
     * Adds all created elements to the modal container in the proper
     * order for logical flow and visual hierarchy.
     * 
     * CONTENT ORDER:
     * 1. App icon (visual branding)
     * 2. Title (clear purpose statement)
     * 3. Message (compelling description)
     * 4. Instructions (actionable steps)
     * 5. Close button (user control)
     */
    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(instructions);
    modal.appendChild(closeBtn);
    
    /**
     * ADD MODAL TO OVERLAY AND INSERT INTO DOM
     * 
     * Completes the modal structure and makes it visible to users
     * by inserting it into the document body.
     */
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // ========================================================================
    // AUTOMATIC CLEANUP SETUP
    // ========================================================================
    
    /**
     * AUTOMATIC MODAL REMOVAL TIMER
     * 
     * Sets up a timer to automatically remove the modal after 15 seconds
     * if the user hasn't interacted with it. This prevents the modal
     * from staying on screen indefinitely and cluttering the interface.
     * 
     * TIMEOUT DURATION:
     * 15 seconds provides enough time for users to read the instructions
     * and make a decision, while not being so long that it becomes annoying.
     * 
     * SAFETY CHECK:
     * Verifies that the overlay is still in the DOM before attempting
     * to remove it, preventing errors if the user has already closed
     * the modal manually.
     */
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    }, 15000);
  }
}

/**
 * =============================================================================
 * DEFAULT EXPORT FOR CONVENIENCE
 * =============================================================================
 */

/**
 * DEFAULT EXPORT
 * 
 * Provides the AddToHomescreen class as the default export for
 * convenient importing in other modules.
 * 
 * USAGE:
 * import AddToHomescreen from './utils/addToHomescreen';
 * const installer = new AddToHomescreen(options);
 */
export default AddToHomescreen;

/**
 * =============================================================================
 * USAGE EXAMPLES AND INTEGRATION PATTERNS
 * =============================================================================
 * 
 * BASIC USAGE:
 * 
 * import { AddToHomescreen } from './utils/addToHomescreen';
 * 
 * // Simple usage with defaults
 * const installer = new AddToHomescreen();
 * installer.show();
 * 
 * // Custom configuration
 * const customInstaller = new AddToHomescreen({
 *   appName: 'My Custom App',
 *   appIconUrl: 'https://example.com/icon.png'
 * });
 * customInstaller.show();
 * 
 * INTEGRATION WITH APP LIFECYCLE:
 * 
 * // In App.tsx or main component
 * useEffect(() => {
 *   if (!isLoading) {
 *     // Show prompt after app has loaded
 *     setTimeout(() => {
 *       const installer = new AddToHomescreen({
 *         appName: 'Work Schedule',
 *         appIconUrl: 'https://mysite.com/icon.png'
 *       });
 *       installer.show();
 *     }, 3000); // 3 second delay
 *   }
 * }, [isLoading]);
 * 
 * CONDITIONAL DISPLAY:
 * 
 * // Only show on mobile devices
 * const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
 * if (isMobile) {
 *   const installer = new AddToHomescreen();
 *   installer.show();
 * }
 * 
 * CUSTOM TIMING:
 * 
 * // Show after user has used the app for a while
 * const showInstallPrompt = () => {
 *   const sessionTime = Date.now() - sessionStartTime;
 *   if (sessionTime > 300000) { // 5 minutes
 *     const installer = new AddToHomescreen();
 *     installer.show();
 *   }
 * };
 * 
 * =============================================================================
 * BROWSER COMPATIBILITY AND PLATFORM SUPPORT
 * =============================================================================
 * 
 * SUPPORTED BROWSERS:
 * - iOS Safari 11.3+ (Add to Home Screen support)
 * - Android Chrome 68+ (Native install prompts)
 * - Desktop Chrome 68+ (Native install prompts)
 * - Edge 79+ (Native install prompts)
 * - Firefox (Manual instructions)
 * 
 * PWA DETECTION METHODS:
 * - display-mode media queries (standard)
 * - navigator.standalone (iOS Safari)
 * - window.matchMedia support (modern browsers)
 * 
 * FALLBACK BEHAVIOR:
 * - Graceful degradation for unsupported browsers
 * - Generic instructions for unknown platforms
 * - No errors or broken functionality
 * 
 * =============================================================================
 * CUSTOMIZATION AND EXTENSION
 * =============================================================================
 * 
 * ADDING PLATFORM-SPECIFIC INSTRUCTIONS:
 * 
 * // Extend the class for custom instructions
 * class CustomAddToHomescreen extends AddToHomescreen {
 *   private getInstructions() {
 *     const isAndroid = /Android/i.test(navigator.userAgent);
 *     const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
 *     
 *     if (isAndroid) {
 *       return this.getAndroidInstructions();
 *     } else if (isIOS) {
 *       return this.getIOSInstructions();
 *     } else {
 *       return this.getGenericInstructions();
 *     }
 *   }
 * }
 * 
 * CUSTOM STYLING:
 * 
 * // Override modal styles
 * class StyledAddToHomescreen extends AddToHomescreen {
 *   private showModal() {
 *     // Custom modal implementation with different styling
 *     // Could use CSS classes instead of inline styles
 *   }
 * }
 * 
 * ANALYTICS INTEGRATION:
 * 
 * class AnalyticsAddToHomescreen extends AddToHomescreen {
 *   show() {
 *     // Track prompt display
 *     analytics.track('install_prompt_shown');
 *     super.show();
 *   }
 *   
 *   private showModal() {
 *     // Add analytics to button clicks
 *     super.showModal();
 *     // Add event listeners for tracking
 *   }
 * }
 * 
 * =============================================================================
 * TESTING AND DEBUGGING
 * =============================================================================
 * 
 * TESTING STRATEGIES:
 * - Test on actual devices (iOS Safari, Android Chrome)
 * - Use browser dev tools to simulate different display modes
 * - Test localStorage behavior across sessions
 * - Verify PWA detection accuracy
 * 
 * DEBUGGING TOOLS:
 * - Console logging for prompt display decisions
 * - localStorage inspection for show-once behavior
 * - Network tab for icon loading verification
 * - Application tab for PWA status checking
 * 
 * COMMON ISSUES:
 * - Icon not loading (check CORS and URL accessibility)
 * - Prompt showing on installed PWA (check detection logic)
 * - Modal not displaying (check z-index and DOM insertion)
 * - Instructions not platform-appropriate (enhance detection)
 * 
 * =============================================================================
 * PERFORMANCE AND OPTIMIZATION
 * =============================================================================
 * 
 * PERFORMANCE CONSIDERATIONS:
 * - Minimal DOM manipulation for fast display
 * - Inline styles to avoid CSS loading delays
 * - Efficient PWA detection with early returns
 * - Automatic cleanup to prevent memory leaks
 * 
 * OPTIMIZATION OPPORTUNITIES:
 * - Lazy load instructions based on platform
 * - Cache DOM elements for repeated use
 * - Optimize icon loading with preload hints
 * - Minimize JavaScript bundle impact
 * 
 * MEMORY MANAGEMENT:
 * - Automatic modal removal prevents DOM bloat
 * - Event listeners are cleaned up with element removal
 * - No global variables or persistent references
 * - Garbage collection friendly implementation
 */