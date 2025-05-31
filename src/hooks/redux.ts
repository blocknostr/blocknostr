import { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { 
  selectFeatureFlags, 
  selectAppSettings, 
  selectDebugMode, 
  selectTheme, 
  selectPerformanceMetrics,
  selectConnectionStatus,
  selectNotifications
} from '../store/slices/appSlice';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook to access feature flags
 */
export const useFeatureFlags = () => {
  const featureFlags = useAppSelector(selectFeatureFlags);
  
  return {
    ...featureFlags,
    isUsingReduxForNostr: featureFlags.useReduxForNostr,
    isUsingReduxForWallet: featureFlags.useReduxForWallet,
    isUsingReduxForProfiles: featureFlags.useReduxForProfiles,
    isUsingReduxForUI: featureFlags.useReduxForUI,
    isUsingReduxForLocalStorage: featureFlags.useReduxForLocalStorage,
  };
};

/**
 * Hook to access app settings
 */
export const useAppSettings = () => {
  const debugMode = useAppSelector(selectDebugMode);
  const theme = useAppSelector(selectTheme);
  const performanceMetrics = useAppSelector(selectPerformanceMetrics);
  
  return {
    debugMode,
    theme,
    performanceMetrics,
  };
};

// Memoized selector hook - prevents unnecessary rerenders
export const useMemoizedSelector = <TSelected>(
  selector: (state: RootState) => TSelected,
  dependencies: any[] = []
): TSelected => {
  const memoizedSelector = useMemo(() => selector, dependencies);
  return useAppSelector(memoizedSelector);
};

// Selective rerender hook - only rerenders when specific paths change
export const useSelectiveSelector = <T>(
  selector: (state: RootState) => T,
  equalityFn?: (left: T, right: T) => boolean
) => {
  return useAppSelector(selector, equalityFn);
};

// Action dispatchers with type safety
export const useAppActions = () => {
  const dispatch = useAppDispatch();
  
  const setFeatureFlag = useCallback((flag: string, enabled: boolean) => {
    dispatch({ type: 'app/setFeatureFlag', payload: { flag, enabled } });
  }, [dispatch]);
  
  const setTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch({ type: 'app/setTheme', payload: theme });
  }, [dispatch]);
  
  const toggleDebugMode = useCallback(() => {
    dispatch({ type: 'app/toggleDebugMode' });
  }, [dispatch]);
  
  const updatePerformanceMetrics = useCallback((metrics: any) => {
    dispatch({ type: 'app/updatePerformanceMetrics', payload: metrics });
  }, [dispatch]);
  
  const resetPerformanceMetrics = useCallback(() => {
    dispatch({ type: 'app/resetPerformanceMetrics' });
  }, [dispatch]);
  
  const setOnlineStatus = useCallback((online: boolean) => {
    dispatch({ type: 'app/setOnlineStatus', payload: online });
  }, [dispatch]);
  
  return useMemo(() => ({
    setFeatureFlag,
    setTheme,
    toggleDebugMode,
    updatePerformanceMetrics,
    resetPerformanceMetrics,
    setOnlineStatus,
  }), [
    setFeatureFlag,
    setTheme,
    toggleDebugMode,
    updatePerformanceMetrics,
    resetPerformanceMetrics,
    setOnlineStatus,
  ]);
};

// Development-only hooks
export const useReduxDevTools = () => {
  const dispatch = useAppDispatch();
  const performanceMetrics = useAppSelector(selectPerformanceMetrics);
  
  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }
    
    return {
      clearCache: () => {
        dispatch({ type: 'api/resetApiState' });
      },
      
      getStateSnapshot: () => {
        return (dispatch as any).getState?.() || {};
      },
      
      runPerformanceDiagnostics: () => {
        return performanceMetrics;
      },
      
      testFeatureFlag: (flag: string, enabled: boolean) => {
        dispatch({ type: 'app/setFeatureFlag', payload: { flag, enabled } });
      },
    };
  }, [dispatch, performanceMetrics]);
};

// Hook for tracking component performance
export const useComponentPerformance = (componentName: string) => {
  return useMemo(() => ({
    markRenderStart: () => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(`${componentName}-render-start`);
      }
    },
    
    markRenderEnd: () => {
      if (process.env.NODE_ENV === 'development') {
        performance.mark(`${componentName}-render-end`);
        performance.measure(
          `${componentName}-render`,
          `${componentName}-render-start`,
          `${componentName}-render-end`
        );
      }
    },
  }), [componentName]);
}; 

