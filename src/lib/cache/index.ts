// Unified caching system - All profile caching now handled by RTK Query
// This file maintains exports for backward compatibility but most caching
// is now automatic through RTK Query in useProfileMigrated

// ✅ CLEANED UP: Removed obsolete CachePreloader
// Profile caching is now fully handled by RTK Query with automatic:
// - Request deduplication
// - Background updates  
// - Optimal cache invalidation
// - Memory management

// Legacy cache monitoring (can be removed in future cleanup)
export { default as CacheMonitor } from '../components/CacheMonitor';

// Note: All profile caching is now consolidated into RTK Query via useProfileMigrated
// No manual cache management needed - everything is automatic!

// Type exports for external use
export type { ProfileData } from '@/lib/services/profile/types';

// Previous systems removed:
// - AggressiveProfileCache (replaced by Redux with IndexedDB persistence)
// - RTKCacheIntegration (replaced by unified ProfileSlice)
// - ProfileCacheAdapter (no longer needed)
// 
// Benefits:
// ✅ Single source of truth for profile data
// ✅ No race conditions between cache layers
// ✅ Better request deduplication
// ✅ Unified error handling and loading states 
