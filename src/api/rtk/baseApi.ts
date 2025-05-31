import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TAG_TYPES, type TagType } from '../types';

// Performance tracking middleware
const performanceMiddleware = () => (next: any) => (action: any) => {
  const startTime = performance.now();
  const result = next(action);
  
  if (action.type?.endsWith('/fulfilled') || action.type?.endsWith('/rejected')) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log slow queries for debugging
    if (duration > 1000) {
      console.warn(`Slow query detected: ${action.type} took ${duration.toFixed(2)}ms`);
    }
    
    // Store performance metrics in localStorage for debugging
    const metrics = JSON.parse(localStorage.getItem('rtk-query-metrics') || '{}');
    metrics[action.type] = {
      lastDuration: duration,
      averageDuration: metrics[action.type]?.averageDuration
        ? (metrics[action.type].averageDuration + duration) / 2
        : duration,
      count: (metrics[action.type]?.count || 0) + 1,
    };
    localStorage.setItem('rtk-query-metrics', JSON.stringify(metrics));
  }
  
  return result;
};

// Base query with error handling and headers
const baseQuery = fetchBaseQuery({
  baseUrl: '/',
  prepareHeaders: (headers, { getState, endpoint }) => {
    // Add common headers
    headers.set('Content-Type', 'application/json');
    
    // Add authentication if available
    const state = getState() as any;
    const authToken = state.auth?.token;
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    
    // Add request ID for debugging
    headers.set('X-Request-ID', `${endpoint}-${Date.now()}`);
    
    return headers;
  },
});

// Enhanced base query with retry logic and error handling
const baseQueryWithRetry = async (args: any, api: any, extraOptions: any) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await baseQuery(args, api, extraOptions);
      
      // Handle HTTP errors
      if (result.error) {
        const { status } = result.error as any;
        
        // Don't retry client errors (4xx) except for specific cases
        if (status >= 400 && status < 500 && status !== 429) {
          return result;
        }
        
        // Retry server errors (5xx) and rate limiting (429)
        if (attempt < maxRetries - 1 && (status >= 500 || status === 429)) {
          attempt++;
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
      
      return result;
    } catch (error) {
      // Network errors or other exceptions
      if (attempt < maxRetries - 1) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      return {
        error: {
          status: 'FETCH_ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
  
  return {
    error: {
      status: 'FETCH_ERROR',
      error: 'Max retries exceeded',
    },
  };
};

// Base API slice
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: Object.values(TAG_TYPES) as TagType[],
  
  // Global cache configuration
  keepUnusedDataFor: 60 * 5, // 5 minutes
  refetchOnMountOrArgChange: 30, // 30 seconds
  refetchOnFocus: true,
  refetchOnReconnect: true,
  
  endpoints: () => ({}),
});

// Export hooks and utilities
export const {
  // These will be populated as we add endpoints in other API slices
  util: apiUtil,
} = baseApi;

// Helper function to invalidate tags by pattern
export const invalidateTagsByPattern = (dispatch: any, pattern: string) => {
  const allTags = Object.values(TAG_TYPES);
  const matchingTags = allTags.filter(tag => tag.includes(pattern));
  
  matchingTags.forEach(tag => {
    dispatch(baseApi.util.invalidateTags([tag as TagType]));
  });
};

// Helper function to get cache statistics
export const getCacheStats = (state: any) => {
  const apiState = state.api;
  const queries = apiState?.queries || {};
  const mutations = apiState?.mutations || {};
  
  const totalQueries = Object.keys(queries).length;
  const totalMutations = Object.keys(mutations).length;
  const cacheSize = JSON.stringify(apiState).length;
  
  return {
    totalQueries,
    totalMutations,
    cacheSize,
    queries: Object.entries(queries).map(([key, query]: [string, any]) => ({
      key,
      status: query.status,
      endpointName: query.endpointName,
      lastFetched: query.fulfilledTimeStamp,
    })),
  };
};

// Development helper to clear all cache
export const clearAllCache = (dispatch: any) => {
  if (process.env.NODE_ENV === 'development') {
    dispatch(baseApi.util.resetApiState());
    console.log('🧹 All RTK Query cache cleared');
  }
}; 

