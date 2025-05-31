import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Share2, LogIn, RefreshCw } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { useIsMobile } from "@/hooks/ui/use-mobile";
import { toast } from "@/lib/toast";

// Profile components
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileActivity from '@/components/profile/ProfileActivity';

// ✅ MIGRATED: Use the same working hook as world chat
import { useProfilesBatch } from '@/hooks/api/useProfileMigrated';
import { useAppDispatch } from '@/hooks/redux';
import { profileApiUtils, useUpdateProfileMutation } from '@/api/rtk/profileApi';

// Performance monitoring
import { usePerformanceMonitor } from "@/lib/utils/performance";

/**
 * 🚀 MIGRATED ProfilePageRedux - Now Using World Chat's Working Flow
 * Uses useProfilesBatch to match the working implementation in world chat
 * Simple data extraction like world chat: profile?.metadata?.display_name
 */
const ProfilePageRedux: React.FC = () => {
  const { pubkey: urlPubkey } = useParams<{ pubkey: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const dispatch = useAppDispatch();

  // ✅ RTK MUTATION: Use profile update mutation for publishing to NOSTR
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();

  // Performance monitoring
  const performanceTracker = usePerformanceMonitor('ProfilePageRedux');

  // Get current user from auth
  const currentUserPubkey = nostrService.publicKey;
  const targetPubkey = urlPubkey || currentUserPubkey || '';
  
  // Debug pubkey validation
  useEffect(() => {
    console.log('[ProfilePageRedux] Pubkey Debug:', {
      urlPubkey,
      currentUserPubkey,
      targetPubkey,
      targetPubkeyLength: targetPubkey.length,
      isValidLength: targetPubkey.length === 64,
      isValidHex: /^[0-9a-f]+$/i.test(targetPubkey),
      skipCondition: !targetPubkey || targetPubkey.length !== 64,
    });
  }, [urlPubkey, currentUserPubkey, targetPubkey]);
  
  // Determine if this is the user's own profile
  const isOwnProfile = useMemo(() => {
    return (!!currentUserPubkey && !urlPubkey) || // Case 1: /profile route
           (!!currentUserPubkey && urlPubkey === currentUserPubkey); // Case 2: /profile/own-pubkey
  }, [currentUserPubkey, urlPubkey]);

  // ✅ USE WORLD CHAT'S WORKING FLOW: Use useProfilesBatch like world chat does
  const { 
    profilesMap, 
    isLoading, 
    error, 
    refetch 
  } = useProfilesBatch(targetPubkey && targetPubkey.length === 64 ? [targetPubkey] : []);
  
  // ✅ EXTRACT DATA SAME AS WORLD CHAT: Direct access to metadata with fallbacks
  const profile = targetPubkey ? profilesMap[targetPubkey] : null;
  const displayName = profile?.metadata?.display_name || profile?.metadata?.name || `User ${targetPubkey.slice(0,8)}`;
  const name = profile?.metadata?.name || '';
  const about = profile?.metadata?.about || '';
  const picture = profile?.metadata?.picture || '';
  const banner = profile?.metadata?.banner || '';
  const website = profile?.metadata?.website || '';
  const lud16 = profile?.metadata?.lud16 || '';
  
  // Calculated fields
  const followerCount = profile?.derived?.followerCount || 0;
  const followingCount = profile?.derived?.followingCount || 0;
  const noteCount = profile?.derived?.noteCount || 0;
  const hasData = !!profile;

  // Check if profile is for current user or another user
  const isCurrentUser = useMemo(() => {
    return currentUserPubkey === targetPubkey;
  }, [currentUserPubkey, targetPubkey]);
  
  // Redirect users viewing their own profile via URL to cleaner /profile route
  useEffect(() => {
    if (urlPubkey && currentUserPubkey && urlPubkey === currentUserPubkey) {
      console.log('[ProfilePageRedux] Redirecting user from own pubkey URL to /profile');
      navigate('/profile', { replace: true });
    }
  }, [urlPubkey, currentUserPubkey, navigate]);

  // Performance tracking
  useEffect(() => {
    performanceTracker.trackDOMNodes();
    performanceTracker.trackMemory();
  }, [performanceTracker]);

  // Debug logging - now using world chat's working approach
  useEffect(() => {
    console.log('[ProfilePageRedux] Profile state (world chat flow):', {
      urlPubkey: urlPubkey,
      currentUserPubkey: currentUserPubkey,
      targetPubkey: targetPubkey.slice(0, 8),
      isOwnProfile,
      isCurrentUser,
      hasData,
      displayName,
      name,
      picture,
      banner,
      isLoading,
      error,
      followerCount,
      followingCount,
      noteCount,
      // Debug the actual profile object structure
      fullProfile: profile,
      profileMetadata: profile?.metadata,
    });
  }, [urlPubkey, currentUserPubkey, targetPubkey, isOwnProfile, isCurrentUser, hasData, displayName, name, picture, banner, isLoading, error, followerCount, followingCount, noteCount, profile]);

  // Check if user is trying to view their own profile but isn't logged in
  const needsLogin = useMemo(() => {
    return !urlPubkey && !currentUserPubkey;
  }, [urlPubkey, currentUserPubkey]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleShareProfile = useCallback(() => {
    if (targetPubkey) {
      const profileUrl = `${window.location.origin}/profile/${targetPubkey}`;
      navigator.clipboard.writeText(profileUrl);
      toast.success("Profile URL copied to clipboard!");
    }
  }, [targetPubkey]);

  const handleRefresh = useCallback(() => {
    console.log('[ProfilePageRedux] Force refreshing profile for:', targetPubkey.slice(0, 8));
    refetch();
    toast.success("Refreshing profile...");
  }, [refetch, targetPubkey]);

  // ✅ ADDED: Force cache invalidation and hard refresh for debugging
  const handleHardRefresh = useCallback(() => {
    console.log('[ProfilePageRedux] 🔥 HARD REFRESH: Clearing all cache for:', targetPubkey.slice(0, 8));
    
    // Force invalidate all related cache tags using the proper utility
    dispatch(profileApiUtils.invalidateProfile(targetPubkey));
    
    // Wait a bit then refetch
    setTimeout(() => {
      refetch();
      toast.success("🔥 Hard refresh complete!");
    }, 200);
  }, [targetPubkey, refetch, dispatch]);

  const handleUpdate = useCallback(async (updates: any) => {
    try {
      console.log('[ProfilePageRedux] Publishing profile update to NOSTR:', updates);
      
      // ✅ PUBLISH TO NOSTR: Use RTK mutation to publish profile metadata event
      await updateProfile({
        pubkey: targetPubkey,
        metadata: updates
      }).unwrap();
      
      // ✅ AGGRESSIVE CACHE INVALIDATION: Force refresh all profile-related cache
      console.log('[ProfilePageRedux] Profile published successfully, invalidating all caches...');
      dispatch(profileApiUtils.invalidateProfile(targetPubkey));
      dispatch(profileApiUtils.invalidateAllProfiles()); // Also invalidate batch profiles cache
      
      // ✅ FORCE FRESH FETCH: Wait for relays to propagate, then force refetch
      setTimeout(() => {
        console.log('[ProfilePageRedux] Forcing fresh profile refetch...');
        refetch(); // This will fetch fresh data since cache was invalidated
      }, 1000); // Increased delay to 1 second for better relay propagation
      
      toast.success("Profile updated and published to NOSTR!");
    } catch (error) {
      console.error('[ProfilePageRedux] Profile update failed:', error);
      toast.error(`Failed to update profile: ${error?.message || 'Unknown error'}`);
      throw error; // Re-throw so ProfileHeader can handle the error
    }
  }, [updateProfile, targetPubkey, dispatch, refetch]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleLoginReload = useCallback(() => {
    window.location.reload();
  }, []);

  const handleNavigateHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Show login prompt if user is trying to view their own profile but isn't logged in
  if (needsLogin) {
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <LogIn className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Login Required</h2>
            <p className="text-muted-foreground">
              You need to log in with your NOSTR account to view your profile.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleNavigateHome} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleLoginReload}>
              <LogIn className="h-4 w-4 mr-2" />
              Login with NOSTR
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state - show loading only if no cached data
  if (isLoading && !hasData) {
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Navigation skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-10 w-20 bg-muted rounded" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-muted rounded" />
            </div>
          </div>
          
          {/* Profile header skeleton */}
          <div className="bg-muted rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex flex-col items-center sm:items-start">
                <div className="h-24 w-24 bg-muted-foreground/20 rounded-full mb-4" />
                <div className="h-4 w-32 bg-muted-foreground/20 rounded mb-2" />
                <div className="h-3 w-24 bg-muted-foreground/20 rounded" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-muted-foreground/20 rounded" />
                  <div className="h-4 w-32 bg-muted-foreground/20 rounded" />
                </div>
                
                <div className="space-y-2">
                  <div className="h-4 w-full bg-muted-foreground/20 rounded" />
                  <div className="h-4 w-3/4 bg-muted-foreground/20 rounded" />
                </div>
                
                <div className="flex gap-6">
                  <div className="h-4 w-16 bg-muted-foreground/20 rounded" />
                  <div className="h-4 w-20 bg-muted-foreground/20 rounded" />
                  <div className="h-4 w-18 bg-muted-foreground/20 rounded" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Activity skeleton */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-muted-foreground/20 rounded" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 bg-muted-foreground/20 rounded" />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !hasData) {
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <Card className="p-8 text-center border-destructive">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-4">
            {error}. Please try again.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleGoBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleRefresh}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {isMobile ? "" : "Back"}
        </Button>
        
        <div className="flex items-center gap-2">
          {/* Cache Status Indicator */}
          {hasData && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-green-500'}`} />
              <span>{isLoading ? 'Refreshing' : 'Fresh'}</span>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            title="Refresh Profile"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* ✅ DEBUG: Hard refresh button for cache testing */}
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleHardRefresh} 
              title="🔥 Hard Refresh (Clear Cache)"
              disabled={isLoading}
              className="text-xs"
            >
              🔥
            </Button>
          )}
          
          <Button variant="ghost" size="icon" onClick={handleShareProfile}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Header */}
        <ProfileHeader 
          pubkey={targetPubkey}
          isOwnProfile={isOwnProfile}
          onUpdate={handleUpdate}
          onRefresh={handleRefresh}
          profile={profile}
          isLoading={isLoading}
          isError={!!error}
          displayName={displayName}
          name={name}
          about={about}
          picture={picture}
          banner={banner}
          website={website}
          lud16={lud16}
          followerCount={followerCount}
          followingCount={followingCount}
          noteCount={noteCount}
        />

        {/* Profile Activity with Internal Tabs */}
        <Card className="p-6 overflow-hidden">
          <ProfileActivity 
            pubkey={targetPubkey}
            limit={50}
          />
        </Card>
      </div>
    </div>
  );
};

export default ProfilePageRedux; 