
import { cacheClearingService } from './cacheClearingService';

/**
 * Sets up event listeners for Lovable version control operations
 * This connects to Lovable-specific events for branch switching, version reverts, and code restoration
 */
export function setupVersionControlListeners() {
  console.log("Setting up version control listeners for cache clearing");
  
  // Listen for custom events from Lovable platform
  window.addEventListener('lovable:branch-switch', (event) => {
    console.log("📣 Git branch switch detected", event);
    cacheClearingService.clearAllCaches();
  });
  
  window.addEventListener('lovable:version-revert', (event) => {
    console.log("📣 Version revert operation detected", event);
    cacheClearingService.clearAllCaches();
  });
  
  window.addEventListener('lovable:code-restore', (event) => {
    console.log("📣 Code restoration from previous edit detected", event);
    cacheClearingService.clearAllCaches();
  });
  
  // For unknown or non-standard version control events, create a fallback
  window.addEventListener('lovable:version-change', (event) => {
    console.log("📣 Generic version change detected", event);
    cacheClearingService.clearAllCaches();
  });
  
  // For navigation events that might indicate version changes
  window.addEventListener('popstate', () => {
    const url = window.location.href;
    // Check if URL indicates a version control operation
    if (url.includes('/history/') || url.includes('/version/')) {
      console.log("📣 Navigation to version history detected");
      cacheClearingService.clearRuntimeCaches();
    }
  });
  
  // For page reload events which might happen after version control operations
  window.addEventListener('beforeunload', () => {
    // Store a flag in sessionStorage indicating possible version change
    sessionStorage.setItem('possibleVersionChange', 'true');
  });
  
  // Add a manual cache clearing option via browser devtools console
  // @ts-ignore - Adding to window for developer convenience
  window.clearAllCaches = cacheClearingService.clearAllCaches;
  // @ts-ignore - Adding to window for developer convenience
  window.clearRuntimeCaches = cacheClearingService.clearRuntimeCaches;
  
  // Check for previous page reload indicator
  if (sessionStorage.getItem('possibleVersionChange') === 'true') {
    console.log("📣 Page reload after possible version change detected");
    cacheClearingService.clearRuntimeCaches();
    sessionStorage.removeItem('possibleVersionChange');
  }
  
  console.log("✅ Version control listeners setup complete");
}
