import { useMemo, useCallback, useEffect } from 'react';
import { useGetProfileQuery, useGetProfilesQuery, useGetProfileStatsQuery } from '@/api/rtk/profileApi';
import { useAppDispatch } from '@/hooks/redux';
import { profileSynced } from '@/store/slices/profileSlice';

/**
 * 🚀 MIGRATED PROFILE HOOK - RACE CONDITIONS ELIMINATED
 * 
 * This hook replaces all other profile hooks and eliminates race conditions by:
 * 1. Using RTK Query as the SINGLE source of truth
 * 2. Eliminating duplicate Redux slice fetching
 * 3. Providing automatic caching and deduplication
 * 4. Optimistic updates for better UX
 */

interface UseProfileMigratedOptions {
  /** Skip the query entirely (useful for conditional rendering) */
  skip?: boolean;
  /** Polling interval in milliseconds (default: none) */
  pollingInterval?: number;
  /** Refetch on mount (default: false for better performance) */
  refetchOnMountOrArgChange?: boolean;
  /** Manual cache time in seconds (default: 30 minutes) */
  cacheTime?: number;
  /** Force fresh data (bypasses cache) - useful after updates */
  forceFresh?: boolean;
}

export function useProfileMigrated(
  pubkey: string | null | undefined,
  options: UseProfileMigratedOptions = {}
) {
  const {
    skip = false,
    pollingInterval,
    refetchOnMountOrArgChange = false,
    cacheTime = 30 * 60, // 30 minutes
    forceFresh = false,
  } = options;

  const dispatch = useAppDispatch();

  // ✅ SINGLE SOURCE OF TRUTH: Only use RTK Query
  const {
    data: profile,
    isLoading,
    isFetching,
    error,
    refetch,
    isSuccess,
    isError,
  } = useGetProfileQuery(pubkey || '', {
    skip: !pubkey || skip,
    pollingInterval,
    refetchOnMountOrArgChange: refetchOnMountOrArgChange || forceFresh,
    // RTK Query handles all caching and deduplication automatically
    // No need for manual condition checks or request tracking
  });

  // ✅ PERFORMANCE: Load expensive stats separately and asynchronously
  const {
    data: profileStats,
    isLoading: isLoadingStats,
    isFetching: isFetchingStats,
  } = useGetProfileStatsQuery(pubkey || '', {
    skip: !pubkey || skip || !profile, // Only load stats after profile loads
  });

  // ✅ OPTIMISTIC SYNC: Keep Redux slice in sync for other parts of the app
  // This runs only when we successfully get new data, preventing race conditions
  const syncToRedux = useCallback((profileData: any) => {
    if (profileData && pubkey) {
      dispatch(profileSynced({
        pubkey,
        ...profileData,
        // Ensure compatibility with existing Redux profile format
        displayName: profileData.metadata?.display_name || profileData.metadata?.name,
        name: profileData.metadata?.name,
        about: profileData.metadata?.about,
        picture: profileData.metadata?.picture,
        banner: profileData.metadata?.banner,
        lud16: profileData.metadata?.lud16,
        website: profileData.metadata?.website,
        followerCount: profileData.stats?.followerCount || 0,
        followingCount: profileData.stats?.followingCount || 0,
        postCount: profileData.stats?.noteCount || 0,
        npub: pubkey, // Will be converted properly in the slice
        lastSeen: Date.now(),
        createdAt: profileData.createdAt || 0,
        mutualConnections: 0,
        influenceScore: 0,
        metadata: profileData.metadata,
        hasMetadata: !!profileData.metadata,
        isFollowing: profileData.isFollowing || false,
      }));
    }
  }, [dispatch, pubkey]);

  // ✅ FIX RENDER PHASE UPDATES: Move sync to useEffect instead of useMemo
  useEffect(() => {
    if (isSuccess && profile) {
      syncToRedux(profile);
    }
  }, [isSuccess, profile, syncToRedux]);

  // ✅ RACE CONDITION DETECTOR: Warn about stale data in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && profile?.lastUpdated) {
      const ageInMinutes = (Date.now() - profile.lastUpdated) / (1000 * 60);
      if (ageInMinutes > 2) { // Warn if data is older than 2 minutes
        console.warn(`[useProfileMigrated] 🚨 POTENTIALLY STALE DATA for ${pubkey?.slice(0, 8)}:`, {
          ageInMinutes: Math.round(ageInMinutes),
          lastUpdated: new Date(profile.lastUpdated).toISOString(),
          displayName: profile.metadata?.display_name,
          suggestion: 'Consider calling refetch() or using forceFresh option'
        });
      }
    }
  }, [profile, pubkey]);

  // ✅ NORMALIZED RETURN: Consistent interface regardless of data source
  return useMemo(() => {
    const profileData = profile;
    
    // ✅ PERFORMANCE: Merge profile with async stats when available
    const finalProfileData = profileData ? {
      ...profileData,
      stats: {
        ...profileData.stats,
        // Override with async stats when available
        ...(profileStats && {
          noteCount: profileStats.noteCount,
          replyCount: profileStats.replyCount,
          followerCount: profileStats.followerCount
        })
      }
    } : null;
    
    // ✅ ENHANCED FALLBACK: Show meaningful fallback data when no metadata exists
    // This handles cases where users haven't published profile metadata yet
    const shouldShowFallback = !isLoading && !isFetching && !finalProfileData;
    const shouldShowData = !!finalProfileData || shouldShowFallback;
    
    // ✅ CRITICAL FIX: Always use finalProfileData if available, fallback otherwise
    const displayData = finalProfileData || (shouldShowFallback ? {
      pubkey,
      metadata: {
        name: '',
        display_name: '',
        about: '',
        picture: '',
        banner: '',
        website: '',
        lud16: '',
        nip05: '',
      },
      stats: {
        noteCount: 0,
        replyCount: 0,
        followerCount: 0,
        followingCount: 0,
      },
      createdAt: Date.now() - (365 * 24 * 60 * 60 * 1000), // Default to 1 year ago
      isFollowing: false,
      lastUpdated: Date.now(),
    } : null);

    // ✅ ENHANCED DEBUG: Log data extraction in development
    if (process.env.NODE_ENV === 'development' && pubkey) {
      console.log(`[useProfileMigrated] Data extraction for ${pubkey.slice(0, 8)}:`, {
        hasRawProfile: !!profile,
        hasFinalProfileData: !!finalProfileData,
        hasDisplayData: !!displayData,
        shouldShowFallback,
        shouldShowData,
        rawMetadata: profile?.metadata,
        finalMetadata: finalProfileData?.metadata,
        displayMetadata: displayData?.metadata,
        extractedDisplayName: displayData?.metadata?.display_name,
        extractedName: displayData?.metadata?.name,
        extractedPicture: displayData?.metadata?.picture,
      });
    }
    
    return {
      // Core profile data
      profile: finalProfileData,
      isLoading,
      isFetching: isFetching || isFetchingStats, // Include stats loading
      isSuccess,
      isError,
      error: error ? (error as any)?.error || 'Failed to fetch profile' : null,
      
      // Actions
      refetch,
      
      // ✅ ENHANCED DERIVED DATA: Always provide meaningful values
      // Show fallback data immediately when no profile metadata exists
      displayName: (() => {
        if (!displayData) return null;
        
        // Try display_name first, then name, then fallback
        const metaDisplayName = displayData?.metadata?.display_name;
        const metaName = displayData?.metadata?.name;
        
        if (metaDisplayName && metaDisplayName.trim()) {
          return metaDisplayName.trim();
        }
        
        if (metaName && metaName.trim()) {
          return metaName.trim();
        }
        
        // Only show fallback if we have actual data or should show fallback
        return shouldShowData ? `User ${pubkey?.slice(0, 8)}` : null;
      })(),
      name: displayData?.metadata?.name || '',
      about: displayData?.metadata?.about || '',
      picture: displayData?.metadata?.picture || '',
      banner: displayData?.metadata?.banner || '',
      website: displayData?.metadata?.website || '',
      lud16: displayData?.metadata?.lud16 || '',
      nip05: displayData?.metadata?.nip05 || '',
      
      // Stats (with async loading)
      noteCount: displayData?.stats?.noteCount || 0,
      replyCount: displayData?.stats?.replyCount || 0,
      followerCount: displayData?.stats?.followerCount || 0,
      followingCount: displayData?.stats?.followingCount || 0,
      
      // Relationships
      isFollowing: displayData?.isFollowing || false,
      
      // Cache info
      hasData: !!finalProfileData || shouldShowFallback,
      isCached: isSuccess && !isFetching,
      
      // ✅ LOADING STATES: Better granular loading state
      isInitialLoad: isLoading && !finalProfileData,
      isRefreshing: isFetching && !!finalProfileData,
      isLoadingStats, // Separate loading state for stats
      
      // Debug info (development only)
      ...(process.env.NODE_ENV === 'development' && {
        _debug: {
          pubkey: pubkey?.slice(0, 8),
          hookSource: 'useProfileMigrated',
          rtkQueryState: { isLoading, isFetching, isSuccess, isError },
          hasProfileData: !!finalProfileData,
          hasStats: !!profileStats,
          syncedToRedux: isSuccess && !!profile,
          shouldShowFallback,
          shouldShowData,
          forceFresh,
          // ✅ ENHANCED DEBUGGING: More detailed state info
          rawProfileMetadata: finalProfileData?.metadata,
          fallbackUsed: shouldShowFallback,
          noMetadataFound: !finalProfileData && !isLoading && !isFetching,
          // ✅ RACE CONDITION DETECTOR: Warn if showing old data
          cacheAge: finalProfileData?.lastUpdated ? Math.round((Date.now() - finalProfileData.lastUpdated) / 1000) : 0,
          isStaleData: finalProfileData?.lastUpdated ? (Date.now() - finalProfileData.lastUpdated) > (60 * 1000) : false, // > 1 minute
        }
      }),
    };
  }, [
    profile,
    profileStats, // Include stats in dependencies
    isLoading,
    isFetching,
    isFetchingStats, // Include stats loading state
    isLoadingStats,
    isSuccess,
    isError,
    error,
    refetch,
    pubkey,
  ]);
}

/**
 * 🚀 BATCH PROFILE HOOK - For fetching multiple profiles efficiently
 * 
 * This eliminates the N+1 query problem and race conditions when loading
 * multiple profiles (e.g., in chat, note lists, DAO member lists)
 */
export function useProfilesBatch(pubkeys: string[] = []) {
  // ✅ DEDUPLICATE: Filter and dedupe pubkeys
  const validPubkeys = useMemo(() => {
    const unique = Array.from(new Set(pubkeys.filter(pk => pk && pk.length === 64)));
    return unique;
  }, [pubkeys]);

  // ✅ BATCH FETCH: Single request for all profiles
  const {
    data: profilesMap,
    isLoading,
    isFetching,
    error,
    refetch,
    isSuccess,
  } = useGetProfilesQuery(validPubkeys, {
    skip: validPubkeys.length === 0,
  });

  // ✅ NORMALIZE: Convert map to array format
  const profiles = useMemo(() => {
    if (!profilesMap) return [];
    return validPubkeys.map(pubkey => profilesMap[pubkey]).filter(Boolean);
  }, [profilesMap, validPubkeys]);

  return useMemo(() => ({
    profiles,
    profilesMap: profilesMap || {},
    isLoading,
    isFetching,
    error: error ? (error as any)?.error || 'Failed to fetch profiles' : null,
    refetch,
    hasData: isSuccess && profiles.length > 0,
    
    // Helper to get specific profile
    getProfile: (pubkey: string) => profilesMap?.[pubkey] || null,
    
    // Debug info
    ...(process.env.NODE_ENV === 'development' && {
      _debug: {
        requestedCount: pubkeys.length,
        validCount: validPubkeys.length,
        receivedCount: profiles.length,
        hookSource: 'useProfilesBatch',
      }
    }),
  }), [profiles, profilesMap, isLoading, isFetching, error, refetch, isSuccess, pubkeys.length, validPubkeys.length]);
}

/**
 * 🚀 SMART PROFILE HOOK - Backward compatible with legacy components
 * 
 * This can be used as a drop-in replacement for existing useProfile hooks
 */
export function useSmartProfile(pubkey: string | null | undefined) {
  const result = useProfileMigrated(pubkey);
  
  // ✅ BACKWARD COMPATIBILITY: Return format matching legacy hooks
  return useMemo(() => ({
    profile: result.profile,
    loading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
    
    // Legacy field mappings
    data: result.profile,
    isLoading: result.isLoading,
    displayName: result.displayName,
    name: result.name,
    picture: result.picture,
    
    // Migration status
    isMigrated: true,
    hookVersion: 'migrated-v1',
  }), [result]);
}

export default useProfileMigrated; 
