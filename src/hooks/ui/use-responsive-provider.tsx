import { useEffect } from "react";
import { useResponsive } from "./use-responsive";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateResponsiveState, selectCurrentBreakpoint } from "@/store/slices/uiSlice";

/**
 * Responsive Provider Hook
 * 
 * Connects the useResponsive hook with Redux state management.
 * Automatically updates the Redux store when breakpoint changes occur.
 * 
 * This hook should be used once at the app level (in MainLayout)
 * to ensure responsive state is synced across the application.
 */
export function useResponsiveProvider() {
  const dispatch = useAppDispatch();
  const currentBreakpoint = useAppSelector(selectCurrentBreakpoint);
  const { breakpoint, dimensions, isTouch } = useResponsive();

  // Sync responsive state with Redux when breakpoint changes
  useEffect(() => {
    // Only update Redux if breakpoint actually changed (performance optimization)
    if (breakpoint !== currentBreakpoint) {
      dispatch(updateResponsiveState({
        breakpoint,
        dimensions,
        isTouch,
      }));
    }
  }, [breakpoint, dimensions, isTouch, currentBreakpoint, dispatch]);

  return {
    breakpoint,
    dimensions,
    isTouch,
  };
}

/**
 * Hook to get responsive state from Redux
 * 
 * Use this in components that need responsive information.
 * This avoids prop drilling and provides consistent state.
 */
export function useResponsiveState() {
  const responsiveState = useAppSelector((state) => state.ui.responsive);
  
  return {
    breakpoint: responsiveState.breakpoint,
    dimensions: responsiveState.dimensions,
    isTouch: responsiveState.isTouch,
    layoutMode: responsiveState.layoutMode,
    // Convenience flags
    isMobile: responsiveState.breakpoint === 'mobile',
    isTablet: responsiveState.breakpoint === 'tablet', 
    isLaptop: responsiveState.breakpoint === 'laptop',
    isDesktop: responsiveState.breakpoint === 'desktop',
  };
} 