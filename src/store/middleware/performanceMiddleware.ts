import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';

/**
 * Middleware for monitoring Redux performance
 */
const performanceMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return next(action);
  }
  
  const startTime = performance.now();
  const result = next(action);
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Log slow actions
  if (duration > 10) {
    console.warn(`🐌 Slow Redux action: ${action.type} took ${duration.toFixed(2)}ms`);
  }
  
  // Track Redux performance metrics
  if (action.type?.startsWith('app/updatePerformanceMetrics')) {
    // Skip recursive performance tracking
    return result;
  }
  
  // Update performance metrics periodically
  const state = store.getState();
  const currentMetrics = state.app.performance;
  const now = Date.now();
  
  // Update every 5 seconds
  if (!currentMetrics.lastReset || (now - currentMetrics.lastReset) > 5000) {
    const stateSize = JSON.stringify(state).length;
    const actionCount = (currentMetrics.totalActions || 0) + 1;
    
    store.dispatch({
      type: 'app/updatePerformanceMetrics',
      payload: {
        totalActions: actionCount,
        averageActionTime: ((currentMetrics.averageActionTime || 0) + duration) / 2,
        stateSize,
        lastReset: now,
      },
    });
  }
  
  return result;
};

export default performanceMiddleware; 
