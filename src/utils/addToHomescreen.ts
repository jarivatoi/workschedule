// Add to Home Screen functionality - Simple one-time prompt
// Shows only once at startup with 3 second delay

interface AddToHomescreenOptions {
  appName?: string;
  appIconUrl?: string;
  startDelay?: number;
  lifespan?: number;
}

interface AddToHomescreenInstance {
  show: (message?: string) => void;
  isStandalone: () => boolean;
}

declare global {
  interface Window {
    addToHomescreen: (options?: AddToHomescreenOptions) => AddToHomescreenInstance;
  }
}

export class AddToHomescreen {
  private options: AddToHomescreenOptions;
  private isIOS: boolean;
  private isAndroid: boolean;
  private isStandaloneMode: boolean;
  private isMobile: boolean;
  private isChrome: boolean;
  private isSafari: boolean;
  private static hasShownThisSession: boolean = false;

  constructor(options: AddToHomescreenOptions = {}) {
    this.options = {
      appName: 'Work Schedule',
      appIconUrl: 'https://jarivatoi.github.io/workschedule/icon.png',
      startDelay: 3000,
      lifespan: 15000,
      ...options
    };
    
    // Enhanced device detection
    const ua = navigator.userAgent;
    
    this.isIOS = /iPad|iPhone|iPod/.test(ua);
    this.isAndroid = /Android/.test(ua);
    this.isMobile = this.isIOS || this.isAndroid;
    this.isChrome = /Chrome/.test(ua) && !/Edge/.test(ua);
    this.isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    
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
  }

  isStandalone(): boolean {
    // Check if running in standalone mode (PWA)
    const isStandaloneDisplay = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidStandalone = document.referrer.includes('android-app://');
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    return isStandaloneDisplay || isIOSStandalone || isAndroidStandalone || 
           isFullscreen || isMinimalUI;
  }

  show(customMessage?: string): void {
    // Only show once per session and only if not in standalone mode
    if (AddToHomescreen.hasShownThisSession || this.isStandaloneMode) {
      console.log('🚫 Not showing prompt:', {
        hasShownThisSession: AddToHomescreen.hasShownThisSession,
        isStandalone: this.isStandaloneMode
      });
      return;
    }

    console.log('✅ Showing Add to Homescreen prompt');
    AddToHomescreen.hasShownThisSession = true;

    const message = customMessage || this.getDefaultMessage();
    this.showModal(message);
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
    // Create modal overlay
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

// Global function for easy access
window.addToHomescreen = (options?: AddToHomescreenOptions) => {
  return new AddToHomescreen(options);
};

export default AddToHomescreen;