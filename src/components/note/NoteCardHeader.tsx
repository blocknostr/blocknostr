
import { useState, useEffect } from "react";
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
  
  // Effect to fetch profile data if not provided
  useEffect(() => {
    // Update local state if profile data prop changes
    if (profileData) {
      console.log(`[NoteCardHeader] Received profileData for ${pubkey?.substring(0, 8)}:`, 
        profileData.name || profileData.display_name);
      setLocalProfileData(profileData);
      setIsLoading(false);
      return;
    }
    
    if (!pubkey) {
      setIsLoading(false);
      return;
    }
    
    console.log(`[NoteCardHeader] No profile data provided for ${pubkey.substring(0, 8)}, fetching...`);
    setIsLoading(true);
    
    // Fetch profile if not provided
    const fetchProfile = async () => {
      try {
        const profile = await unifiedProfileService.getProfile(pubkey);
        console.log(`[NoteCardHeader] Fetched profile for ${pubkey.substring(0, 8)}:`, 
          profile?.name || profile?.display_name || 'No name');
        setLocalProfileData(profile);
      } catch (error) {
        console.error(`[NoteCardHeader] Error fetching profile for ${pubkey}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
    
    // Subscribe to profile updates
    const unsubscribe = unifiedProfileService.subscribeToUpdates(pubkey, (profile) => {
      console.log(`[NoteCardHeader] Profile update for ${pubkey.substring(0, 8)}:`, 
        profile?.name || profile?.display_name);
      setLocalProfileData(profile);
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [pubkey, profileData]);
  
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
                <AvatarImage src={picture} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
              </>
            )}
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-1 flex-wrap">
            <Link to={`/profile/${npub}`} className="font-bold truncate hover:underline">
              {isLoading ? (
                <Skeleton className="h-4 w-20 rounded inline-block" />
              ) : (
                displayName
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
