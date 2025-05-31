import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../index';

/**
 * Middleware for handling Nostr real-time event updates
 */
const nostrRealtimeMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);
  
  // Handle real-time event updates
  if (action.type === 'nostrEvents/eventReceived') {
    const state = store.getState();
    
    // Update performance metrics
    store.dispatch({
      type: 'app/updatePerformanceMetrics',
      payload: {
        totalQueries: (state.app.performance.totalQueries || 0) + 1,
        lastQueryTime: Date.now(),
      },
    });
    
    // Emit to event bus for components that need real-time updates
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('nostr-event-received', {
        detail: action.payload.event,
      }));
    }
  }
  
  return result;
};

export default nostrRealtimeMiddleware; 
