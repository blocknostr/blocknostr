
import { useCallback } from 'react';

// Export the navigation hooks
export const useRouter = () => {
  const router = {
    back: useCallback(() => {
      window.history.back();
    }, []),
    
    forward: useCallback(() => {
      window.history.forward();
    }, []),
    
    refresh: useCallback(() => {
      window.location.reload();
    }, []),
    
    push: useCallback((href: string) => {
      window.history.pushState({}, '', href);
      
      // Dispatch a custom event to notify components of navigation
      window.dispatchEvent(new CustomEvent('route-change', { 
        detail: { url: href, type: 'push' } 
      }));
    }, []),
    
    replace: useCallback((href: string) => {
      window.history.replaceState({}, '', href);
      
      // Dispatch a custom event to notify components of navigation
      window.dispatchEvent(new CustomEvent('route-change', { 
        detail: { url: href, type: 'replace' } 
      }));
    }, []),
    
    prefetch: useCallback((href: string) => {
      // No-op in this implementation
      console.log(`Prefetching ${href}`);
    }, [])
  };
  
  return router;
};

export const usePathname = () => {
  return window.location.pathname;
};

export const useSearchParams = () => {
  return new URLSearchParams(window.location.search);
};

// Default export for convenience
const nextCompat = {
  useRouter,
  usePathname,
  useSearchParams
};

export default nextCompat;
