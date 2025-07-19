// Add to Home Screen functionality based on philfung/add-to-homescreen
// https://github.com/philfung/add-to-homescreen

interface AddToHomescreenOptions {
  appName?: string;
  appIconUrl?: string;
  maxModalDisplayCount?: number;
  skipFirstVisit?: boolean;
  startDelay?: number;
  lifespan?: number;
  displayPace?: number;
  mustShowCustomPrompt?: boolean;
}

interface AddToHomescreenInstance {
  show: (message?: string) => void;
  clearModalDisplayCount: () => void;
  isStandalone: () => boolean;
  canPrompt: () => boolean;
}

declare global {
  interface Window {
    addToHomescreen: (options?: AddToHomescreenOptions) => AddToHomescreenInstance;
  }
}

export class AddToHomescreen {
  private options: AddToHomescreenOptions;
  private modalDisplayCount: number = 0;
  private maxModalDisplayCount: number;
  private isIOS: boolean;
  private isAndroid: boolean;
  private isStandaloneMode: boolean;
  private isMobile: boolean;
  private isChrome: boolean;
  private isSafari: boolean;
  private isFirefox: boolean;
  private isEdge: boolean;
  private isOpera: boolean;
  private isSamsung: boolean;

  constructor(options: AddToHomescreenOptions = {}) {
    this.options = {
      appName: 'Work Schedule',
      appIconUrl: '/workschedule/icon.png',
      maxModalDisplayCount: 3,
      skipFirstVisit: false,
      startDelay: 2000,
      lifespan: 15000,
      displayPace: 1440, // 24 hours in minutes
      mustShowCustomPrompt: false, // Don't force show by default
      ...options
    };
    
    this.maxModalDisplayCount = this.options.maxModalDisplayCount || 3;
    
    // Enhanced device detection like philfung
    const ua = navigator.userAgent;
    
    this.isIOS = /iPad|iPhone|iPod/.test(ua);
    this.isAndroid = /Android/.test(ua);
    this.isMobile = this.isIOS || this.isAndroid;
    this.isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
    this.isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    this.isFirefox = /Firefox/.test(ua);
    this.isEdge = /Edge/.test(ua);
    this.isOpera = /Opera/.test(ua) || /OPR/.test(ua);
    this.isSamsung = /SamsungBrowser/.test(ua);
    
    this.isStandaloneMode = this.isStandalone();
    
    console.log('🔍 AddToHomescreen Detection:', {
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      isMobile: this.isMobile,
      isChrome: this.isChrome,
      isSafari: this.isSafari,
      isStandalone: this.isStandaloneMode,
      userAgent: ua
    });
    
    // Load display count from localStorage
    const stored = localStorage.getItem('addToHomescreenModalCount');
    this.modalDisplayCount = stored ? parseInt(stored, 10) : 0;
    
    // Check if we should skip first visit
    if (this.options.skipFirstVisit) {
      const firstVisit = localStorage.getItem('addToHomescreenFirstVisit');
      if (!firstVisit) {
        localStorage.setItem('addToHomescreenFirstVisit', 'true');
        console.log('🚫 Skipping first visit');
        return;
      }
    }
  }

  isStandalone(): boolean {
    // Multiple checks for standalone mode like philfung
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidStandalone = document.referrer.includes('android-app://');
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // Check if launched from home screen (PWA context)
    const isPWAContext = window.matchMedia('(display-mode: standalone)').matches ||
                        window.matchMedia('(display-mode: fullscreen)').matches ||
                        window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // Check URL parameters that might indicate PWA launch
    const urlParams = new URLSearchParams(window.location.search);
    const isPWALaunch = urlParams.has('source') && urlParams.get('source') === 'pwa';
    
    // Check if running in a PWA-like environment
    const hasNavigatorStandalone = 'standalone' in window.navigator;
    const isIOSPWA = hasNavigatorStandalone && (window.navigator as any).standalone;
    
    // Additional check for installed PWA on desktop
    const isDesktopPWA = window.matchMedia('(display-mode: standalone)').matches && 
                        !('ontouchstart' in window);
    
    console.log('📱 Standalone Detection:', {
      isStandaloneDisplay,
      isIOSStandalone,
      isAndroidStandalone,
      isFullscreen,
      isMinimalUI,
      isPWAContext,
      isPWALaunch,
      isIOSPWA,
      isDesktopPWA,
      userAgent: navigator.userAgent.substring(0, 50) + '...'
    });
    
    return isStandaloneDisplay || isIOSStandalone || isAndroidStandalone || 
           isFullscreen || isMinimalUI || isPWAContext || isIOSPWA || isDesktopPWA;
  }

  canPrompt(): boolean {
    // Check if app is already installed (standalone mode)
    if (this.isStandaloneMode) {
      console.log('🚫 App already installed in standalone mode');
      return false;
    }
    
    // Additional check: if we're in a browser with specific PWA indicators
    const isPWABrowser = window.matchMedia('(display-mode: browser)').matches;
    const hasInstallPrompt = 'onbeforeinstallprompt' in window;
    
    console.log('🔍 PWA Browser Check:', {
      isPWABrowser,
      hasInstallPrompt,
      currentDisplayMode: this.getCurrentDisplayMode(),
      userAgent: navigator.userAgent.substring(0, 50)
    });
    
    // Check display count limit only if maxModalDisplayCount is reasonable (not 999)
    if (this.maxModalDisplayCount < 999 && this.modalDisplayCount >= this.maxModalDisplayCount) {
      console.log('🚫 Maximum display count reached');
      return false;
    }
    
    // Check if enough time has passed since last display
    const lastDisplayTime = localStorage.getItem('addToHomescreenLastDisplay');
    if (lastDisplayTime) {
      const timeSinceLastDisplay = Date.now() - parseInt(lastDisplayTime, 10);
      const minInterval = (this.options.displayPace || 0) * 60 * 1000; // Convert minutes to milliseconds
      
      // Only check time interval if displayPace is greater than 0
      if (this.options.displayPace > 0 && timeSinceLastDisplay < minInterval) {
        console.log(`🚫 Not enough time passed since last display (${Math.round(timeSinceLastDisplay / 1000)}s < ${minInterval / 1000}s)`);
        return false;
      }
    }
    
    const canShow = true;
    
    console.log('✅ Can Prompt Check:', {
      isStandalone: this.isStandaloneMode,
      displayCount: this.modalDisplayCount,
      maxCount: this.maxModalDisplayCount,
      isMobile: this.isMobile, 
      lastDisplayTime,
      canShow
    });
    
    return canShow;
  }

  private getCurrentDisplayMode(): string {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return 'standalone';
    }
    if (window.matchMedia('(display-mode: minimal-ui)').matches) {
      return 'minimal-ui';
    }
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      return 'fullscreen';
    }
    return 'browser';
  }

  show(customMessage?: string): void {
    console.log('🚀 Attempting to show Add to Homescreen prompt...');
    
    if (!this.canPrompt()) {
      console.log('🚫 AddToHomescreen: Cannot show prompt', {
        canPrompt: this.canPrompt(),
        displayCount: this.modalDisplayCount,
        maxCount: this.maxModalDisplayCount
      });
      return;
    }

    console.log('✅ Showing Add to Homescreen modal');
    this.modalDisplayCount++;
    localStorage.setItem('addToHomescreenModalCount', this.modalDisplayCount.toString());
    localStorage.setItem('addToHomescreenLastDisplay', Date.now().toString());

    const message = customMessage || this.getDefaultMessage();
    this.showModal(message);
  }

  clearModalDisplayCount(): void {
    this.modalDisplayCount = 0;
    localStorage.removeItem('addToHomescreenModalCount');
    localStorage.removeItem('addToHomescreenFirstVisit');
    localStorage.removeItem('addToHomescreenLastDisplay');
    console.log('🧹 Cleared Add to Homescreen display count');
  }

  // Debug method to manually check standalone status
  debugStandaloneStatus(): void {
    console.log('🔍 Debug Standalone Status:', {
      isStandalone: this.isStandalone(),
      displayMode: this.getCurrentDisplayMode(),
      canPrompt: this.canPrompt(),
      modalCount: this.modalDisplayCount,
      userAgent: navigator.userAgent
    });
  }

  private getDefaultMessage(): string {
    if (this.isIOS && this.isSafari) {
      return `Install ${this.options.appName} on your iPhone: tap the Share button and then "Add to Home Screen".`;
    } else if (this.isAndroid && this.isChrome) {
      return `Install ${this.options.appName} on your Android device: tap the menu button and then "Add to Home Screen" or "Install App".`;
    } else if (this.isAndroid) {
      return `Install ${this.options.appName} on your Android device: look for "Add to Home Screen" or "Install" in your browser menu.`;
    } else {
      return `Add ${this.options.appName} to your device for quick access!`;
    }
  }

  private showModal(message: string): void {
    // Create modal overlay with philfung styling approach
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      animation: fadeIn 0.3s ease-out;
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      text-align: center;
      position: relative;
      animation: slideUp 0.3s ease-out;
    `;

    // App icon
    const icon = document.createElement('img');
    icon.src = this.options.appIconUrl || '/icon.png';
    icon.style.cssText = `
      width: 64px;
      height: 64px;
      border-radius: 12px;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // Handle icon load error
    icon.onerror = () => {
      icon.style.display = 'none';
    };

    // Title
    const title = document.createElement('h3');
    title.textContent = `Install ${this.options.appName}`;
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    `;

    // Message
    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 16px;
      line-height: 1.5;
      color: #666;
    `;

    // Platform-specific instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = `
      background: ${this.isIOS ? '#f0f9ff' : this.isAndroid ? '#f0fdf4' : '#f3f4f6'};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      text-align: left;
    `;

    if (this.isIOS && this.isSafari) {
      instructions.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; color: #0369a1;">📱 How to install on iOS:</div>
        <div style="font-size: 14px; color: #0c4a6e; line-height: 1.5;">
          1. Tap the <strong>Share</strong> button <span style="font-size: 18px;">⬆️</span> in Safari<br>
          2. Scroll down and tap <strong>"Add to Home Screen"</strong><br>
          3. Tap <strong>"Add"</strong> to confirm installation
        </div>
      `;
    } else if (this.isAndroid) {
      instructions.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; color: #166534;">📱 How to install on Android:</div>
        <div style="font-size: 14px; color: #14532d; line-height: 1.5;">
          1. Tap the <strong>Menu</strong> button <span style="font-size: 18px;">⋮</span> in your browser<br>
          2. Look for <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong><br>
          3. Tap <strong>"Install"</strong> or <strong>"Add"</strong> to confirm
        </div>
      `;
    } else {
      instructions.innerHTML = `
        <div style="color: #374151; font-size: 14px; text-align: center;">
          Open this page in your mobile browser to install the app!
        </div>
      `;
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Maybe Later';
    closeBtn.style.cssText = `
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      color: #5f6368;
      cursor: pointer;
      width: 100%;
      transition: background-color 0.2s;
    `;

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    });

    closeBtn.addEventListener('mouseover', () => {
      closeBtn.style.backgroundColor = '#e5e7eb';
    });

    closeBtn.addEventListener('mouseout', () => {
      closeBtn.style.backgroundColor = '#f3f4f6';
    });

    // Assemble modal
    modal.appendChild(icon);
    modal.appendChild(title);
    modal.appendChild(messageEl);
    modal.appendChild(instructions);
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);

    // Add to DOM
    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
      }
    });

    // Auto-close after lifespan
    setTimeout(() => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
        document.head.removeChild(style);
      }
    }, this.options.lifespan || 15000);
  }
}

// Global function for easy access (like philfung)
window.addToHomescreen = (options?: AddToHomescreenOptions) => {
  return new AddToHomescreen(options);
};

export default AddToHomescreen;