
'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname as nextUsePathname, useRouter as nextUseRouter } from "next/navigation";

interface NavigationContextType {
  history: string[];
  goBack: () => void;
  canGoBack: boolean;
  parentRoute: string | null;
  getParentRoute: (path: string) => string;
}

const NavigationContext = createContext<NavigationContextType>({
  history: [],
  goBack: () => {},
  canGoBack: false,
  parentRoute: null,
  getParentRoute: () => "/"
});

export const useNavigation = () => useContext(NavigationContext);

// Define the route hierarchy for the application
const routeHierarchy: Record<string, string> = {
  "/profile": "/",
  "/settings": "/",
  "/communities": "/",
  "/messages": "/",
  "/notifications": "/",
  "/post": "/",
  "/notebin": "/",
  "/wallets": "/",
  "/premium": "/",
  // Define deeper hierarchies
  "/communities/": "/communities"
};

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<string[]>([]);
  const pathname = nextUsePathname();
  const router = nextUseRouter();
  const [parentRoute, setParentRoute] = useState<string | null>(null);

  // Get parent route based on current path
  const getParentRoute = (path: string): string => {
    // First check for exact match
    if (routeHierarchy[path]) {
      return routeHierarchy[path];
    }

    // Then check for path patterns
    for (const routePattern in routeHierarchy) {
      // Skip the exact matches we already checked
      if (!routePattern.endsWith('/')) continue;

      // Check if the current path starts with the pattern
      if (path.startsWith(routePattern)) {
        return routeHierarchy[routePattern];
      }
    }

    // Default to home if no parent is found
    return "/";
  };

  // Update history and parentRoute when location changes
  useEffect(() => {
    if (!pathname) return;
    
    setHistory(prev => {
      // Don't add duplicate entries for the same path
      if (prev.length > 0 && prev[prev.length - 1] === pathname) {
        return prev;
      }
      return [...prev, pathname];
    });

    // Update the parent route based on current path
    setParentRoute(getParentRoute(pathname));
  }, [pathname]);

  const goBack = () => {
    if (history.length > 1) {
      // Remove current page from history
      const newHistory = [...history];
      newHistory.pop();
      const previousPage = newHistory[newHistory.length - 1];
      
      // Update history and navigate
      setHistory(newHistory);
      router.push(previousPage);
    } else {
      // If no previous page in history, go to parent route
      const parent = getParentRoute(pathname || '/');
      router.push(parent);
    }
  };

  return (
    <NavigationContext.Provider 
      value={{ 
        history, 
        goBack, 
        canGoBack: history.length > 1,
        parentRoute,
        getParentRoute
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
