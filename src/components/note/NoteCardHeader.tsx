import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatPubkey, getNpubFromHex } from '@/lib/nostr/utils/keys';
import { Skeleton } from "@/components/ui/skeleton";
import { unifiedProfileService } from "@/lib/services/UnifiedProfileService";

interface NoteCardHeaderProps {
  pubkey: string;
  createdAt: number;
  profileData?: Record<string, any>;
}

const NoteCardHeader = ({ pubkey, createdAt, profileData }: NoteCardHeaderProps) => {
  // Local state for profile data
  const [localProfileData, setLocalProfileData] = useState<Record<string, any> | null>(
    profileData || null
  );
  const [isLoading, setIsLoading] = useState(!profileData && !!pubkey);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  
  // Refs for stable handling of profile updates
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const initialRenderRef = useRef<boolean>(true);
  
  // Effect to fetch profile data if not provided
  useEffect(() => {
    // Update local state if profile data prop changes
    if (profileData) {
      if (initialRenderRef.current) {
        // First render with profileData, set immediately
        setLocalProfileData(profileData);
        setIsLoading(false);
        initialRenderRef.current = false;
      } else {
        // On subsequent profile updates, debounce the update
        if (updateTimeoutRef.current) {
          window.clearTimeout(updateTimeoutRef.current);
        }
        
        updateTimeoutRef.current = window.setTimeout(() => {
          setLocalProfileData(profileData);
          setIsLoading(false);
        }, 300); // Debounce for 300ms
      }
      return;
    }
    
    if (!pubkey) {
      setIsLoading(false);
      return;
    }
    
    // First render without profileData
    if (initialRenderRef.current) {
      console.log(`[NoteCardHeader] No profile data provided for ${pubkey.substring(0, 8)}, fetching...`);
      setIsLoading(true);
      initialRenderRef.current = false;
    }
    
    // Fetch profile if not provided
    const fetchProfile = async () => {
      try {
        const profile = await unifiedProfileService.getProfile(pubkey);
        
        if (profile) {
          // Set profile data with debounce to prevent flickering
          if (updateTimeoutRef.current) {
            window.clearTimeout(updateTimeoutRef.current);
          }
          
          updateTimeoutRef.current = window.setTimeout(() => {
            setLocalProfileData(profile);
            setIsLoading(false);
          }, 300);
        } else {
          // If profile is null, increment fetch attempts
          setFetchAttempts(prev => prev + 1);
          
          // After 3 attempts, give up on loading state but keep subscribed to updates
          if (fetchAttempts >= 2) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error(`[NoteCardHeader] Error fetching profile for ${pubkey}:`, error);
        setFetchAttempts(prev => prev + 1);
        
        // After 3 attempts, give up on loading state
        if (fetchAttempts >= 2) {
          setIsLoading(false);
        }
      }
    };
    
    fetchProfile();
    
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Subscribe to profile updates with debouncing
    unsubscribeRef.current = unifiedProfileService.subscribeToUpdates(pubkey, (profile) => {
      if (!profile) return;
      
      // Debounce profile updates
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = window.setTimeout(() => {
        setLocalProfileData(profile);
        setIsLoading(false);
      }, 300);
    });
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      if (updateTimeoutRef.current) {
        window.clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [pubkey, profileData, fetchAttempts]);
  
  // Ensure we have a valid pubkey
  const hexPubkey = pubkey || '';
  
  // Use our improved utility functions with built-in validation and fallbacks
  let npub = '';
  let shortNpub = '';
  
  try {
    if (hexPubkey) {
      // Use the enhanced getNpubFromHex with built-in validation
      npub = getNpubFromHex(hexPubkey);
      
      // Handle short display of npub (first 9 and last 5 chars)
      // This will always work since our utility returns valid strings even for errors
      shortNpub = `${npub.substring(0, 9)}...${npub.substring(npub.length - 5)}`;
    } else {
      // Consistent fallbacks for empty input
      npub = 'npub1unknown';
      shortNpub = 'unknown';
    }
  } catch (error) {
    // Extra safety in case of unexpected errors
    console.error('Error in NoteCardHeader with pubkey:', hexPubkey, error);
    npub = 'npub1unknown';
    shortNpub = 'unknown';
  }
  
  // Get profile info if available
  const name = localProfileData?.name || shortNpub;
  const displayName = localProfileData?.display_name || name;
  const picture = localProfileData?.picture || '';
  
  // Get the first character of the display name for the avatar fallback
  const avatarFallback = displayName ? displayName.charAt(0).toUpperCase() : 'N';
  
  // Format the created at timestamp
  let timeAgo = 'some time ago';
  try {
    if (createdAt && createdAt > 0) {
      timeAgo = formatDistanceToNow(
        new Date(createdAt * 1000),
        { addSuffix: true }
      );
    }
  } catch (error) {
    console.error('Error formatting time:', error);
  }

  return (
    <div className="flex justify-between">
      <div className="flex">
        <Link to={`/profile/${npub}`} className="mr-3 shrink-0">
          <Avatar className="h-11 w-11 border border-muted">
            {isLoading ? (
              <AvatarFallback className="bg-muted animate-pulse">
                <span className="opacity-0">{avatarFallback}</span>
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={picture} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
              </>
            )}
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-1 flex-wrap">
            <Link to={`/profile/${npub}`} className="font-bold truncate hover:underline transition-all duration-300">
              {isLoading ? (
                <Skeleton className="h-4 w-20 rounded inline-block" />
              ) : (
                <span className="transition-all duration-300">{displayName}</span>
              )}
            </Link>
            
            <span className="text-muted-foreground text-sm truncate">@{shortNpub}</span>
            <span className="text-muted-foreground text-sm mx-0.5">·</span>
            <span className="text-muted-foreground text-sm hover:underline cursor-pointer">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteCardHeader;
