
import { useCallback } from 'react';

// Define the NavigationType interface
export interface NavigationType {
  back: () => void;
  forward: () => void;
  refresh: () => void;
  push: (href: string) => void;
  replace: (href: string) => void;
  prefetch: (href: string) => void;
}

// Export individual hooks (avoiding circular dependencies)
export function usePathname(): string {
  return window.location.pathname;
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

// Define the Router interface and implementation
export function useRouter(): NavigationType {
  const router: NavigationType = {
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
}
