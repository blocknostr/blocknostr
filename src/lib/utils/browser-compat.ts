/**
 * Browser compatibility utilities
 * Helps handle various browser warnings and compatibility issues
 */

/**
 * Format cookie expiration date properly
 * Fixes the "invalid expires date format" warnings
 */
export function formatCookieExpires(date: Date): string {
  return date.toUTCString();
}

/**
 * Set a cookie with proper formatting
 * Prevents cookie format warnings
 */
export function setCookie(name: string, value: string, options: {
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
} = {}): void {
  let cookieString = `${name}=${value}`;
  
  if (options.expires) {
    cookieString += `; expires=${formatCookieExpires(options.expires)}`;
  }
  
  if (options.path) {
    cookieString += `; path=${options.path}`;
  }
  
  if (options.domain) {
    cookieString += `; domain=${options.domain}`;
  }
  
  if (options.secure) {
    cookieString += '; secure';
  }
  
  if (options.sameSite) {
    cookieString += `; samesite=${options.sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Check if we're in a cross-origin context
 * Helps with CORS-related warnings
 */
export function isCrossOrigin(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.origin !== window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Safe fetch wrapper that handles CORS issues
 * Prevents CORB (Cross-Origin Read Blocking) warnings
 */
export async function safeFetch(url: string, options: RequestInit = {}): Promise<Response | null> {
  try {
    // Add CORS headers for cross-origin requests
    if (isCrossOrigin(url)) {
      options.mode = options.mode || 'cors';
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };
    }
    
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    console.warn('Fetch failed, possibly due to CORS:', error);
    return null;
  }
}

/**
 * Detect browser type for compatibility checks
 */
export function getBrowserInfo(): {
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
  isMobile: boolean;
  isIOS: boolean;
} {
  const userAgent = navigator.userAgent;
  
  return {
    isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isEdge: /Edge/.test(userAgent),
    isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
    isIOS: /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream,
  };
}

/**
 * Apply CSS text-size-adjust fixes for better browser compatibility
 */
export function applyTextSizeAdjustFixes(): void {
  const style = document.createElement('style');
  style.textContent = `
    /* Fix for webkit-text-size-adjust compatibility */
    html, body {
      -webkit-text-size-adjust: 100% !important;
      -moz-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    /* Ensure form elements don't zoom on iOS */
    input, textarea, select, button {
      font-size: 16px !important;
      -webkit-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    
    /* Firefox min-height fixes */
    .firefox .min-h-auto,
    .firefox [style*="min-height: auto"] {
      min-height: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Apply browser-specific fixes
 */
export function applyBrowserFixes(): void {
  const browser = getBrowserInfo();
  
  // Apply text size adjustment fixes
  applyTextSizeAdjustFixes();
  
  // Fix for iOS viewport height
  if (browser.isMobile || browser.isIOS) {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Add iOS class for specific styling
    if (browser.isIOS) {
      document.documentElement.classList.add('ios');
      document.body.classList.add('ios-device');
    }
  }
  
  // Fix for Firefox min-height issues
  if (browser.isFirefox) {
    document.documentElement.classList.add('firefox');
  }
  
  // Fix for Safari specific issues
  if (browser.isSafari) {
    document.documentElement.classList.add('safari');
  }
  
  // Fix for Chrome specific issues
  if (browser.isChrome) {
    document.documentElement.classList.add('chrome');
  }
  
  // Fix for Edge specific issues
  if (browser.isEdge) {
    document.documentElement.classList.add('edge');
  }
} 

