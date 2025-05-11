
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Helper function to detect iOS devices
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Add classes to the HTML element for platform-specific styling
if (isIOS()) {
  document.documentElement.classList.add('ios-device');
  
  // Add specific classes for different iOS versions
  if (window.navigator.userAgent.indexOf('OS 15_') >= 0) {
    document.documentElement.classList.add('ios-15');
  } else if (window.navigator.userAgent.indexOf('OS 16_') >= 0) {
    document.documentElement.classList.add('ios-16');
  } else if (window.navigator.userAgent.indexOf('OS 17_') >= 0) {
    document.documentElement.classList.add('ios-17');
  }
  
  // Add support for home indicator area in notched devices
  if (window.navigator.userAgent.indexOf('iPhone X') >= 0 || 
      window.navigator.userAgent.indexOf('iPhone 1') >= 0) {
    document.documentElement.classList.add('ios-notch');
  }
}

// Add dark mode class to html element by default
document.documentElement.classList.add('dark');

// Initialize touch handlers for iOS to prevent unwanted behaviors
document.addEventListener('touchstart', () => {}, { passive: true });

// Prevent overscroll/bounce at the top/bottom of the page on iOS
document.body.addEventListener('touchmove', (e) => {
  if (
    document.documentElement.scrollTop === 0 && 
    e.touches[0].clientY > 0
  ) {
    e.preventDefault();
  }
}, { passive: false });

// Initialize the app
createRoot(document.getElementById("root")!).render(<App />);
