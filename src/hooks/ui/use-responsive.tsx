import { useState, useEffect, useMemo } from "react";

// Target breakpoints optimized for blocknostr
const BREAKPOINTS = {
  mobile: 375,   // Mobile (375×667) - Condensed experience
  tablet: 768,   // Tablet (768×1024) - Touch-optimized layout
  laptop: 1024,  // Laptop (1366×768) - Secondary optimization
  desktop: 1400, // Desktop (1920×1080) - Primary design target
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  breakpoint: Breakpoint;
  dimensions: {
    width: number;
    height: number;
  };
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isTouch: boolean;
}

export function useResponsive(): ResponsiveState {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  // Detect touch capability
  const isTouch = useMemo(() => {
    return typeof window !== 'undefined' && (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    );
  }, []);

  // Determine current breakpoint based on width
  const breakpoint = useMemo((): Breakpoint => {
    const { width } = dimensions;
    
    if (width < BREAKPOINTS.tablet) return 'mobile';
    if (width < BREAKPOINTS.laptop) return 'tablet';
    if (width < BREAKPOINTS.desktop) return 'laptop';
    return 'desktop';
  }, [dimensions.width]);

  // Convenience flags
  const responsiveFlags = useMemo(() => ({
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isLaptop: breakpoint === 'laptop',
    isDesktop: breakpoint === 'desktop',
  }), [breakpoint]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Use passive listener for better performance
    const options = { passive: true };
    window.addEventListener('resize', updateDimensions, options);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return {
    breakpoint,
    dimensions,
    ...responsiveFlags,
    isTouch,
  };
}

// Layout configuration for each breakpoint
export const getLayoutConfig = (breakpoint: Breakpoint) => {
  const configs = {
    mobile: {
      sidebarWidth: 'w-full',
      rightSidebarWidth: 'w-80', // For sheet sizing
      headerHeight: 'h-14',
      contentPadding: 'p-3',
      gridCols: 'grid-cols-1',
      feedLayout: 'single',
      containerMaxWidth: 'max-w-full',
      contentMaxWidth: 'max-w-full',
      hasRightSidebar: false,
    },
    tablet: {
      sidebarWidth: 'w-64',
      rightSidebarWidth: 'w-72',
      headerHeight: 'h-16',
      contentPadding: 'p-4',
      gridCols: 'grid-cols-1 md:grid-cols-2',
      feedLayout: 'dual',
      containerMaxWidth: 'max-w-full',
      contentMaxWidth: 'max-w-4xl',
      hasRightSidebar: false,
    },
    laptop: {
      sidebarWidth: 'w-56', // Reduced from w-64 for better balance
      rightSidebarWidth: 'w-64',
      headerHeight: 'h-16',
      contentPadding: 'p-6',
      gridCols: 'grid-cols-2 lg:grid-cols-3',
      feedLayout: 'dual',
      containerMaxWidth: 'max-w-6xl',
      contentMaxWidth: 'max-w-4xl', // Increased from max-w-3xl for wider content
      hasRightSidebar: true,
    },
    desktop: {
      sidebarWidth: 'w-64', // Reduced from w-80 to match Twitter's narrower left sidebar
      rightSidebarWidth: 'w-80',
      headerHeight: 'h-16',
      contentPadding: 'p-6',
      gridCols: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      feedLayout: 'triple',
      containerMaxWidth: 'max-w-7xl', // Twitter-style container
      contentMaxWidth: 'max-w-3xl', // Increased from max-w-2xl for wider content
      centerContent: true,
      hasRightSidebar: true,
    },
  } as const;

  return configs[breakpoint];
};

// Hook for backward compatibility with existing useIsMobile
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
} 