
import { useState, useEffect, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatPubkey, getNpubFromHex } from '@/lib/nostr/utils/keys';
import { Skeleton } from "@/components/ui/skeleton";
import { unifiedProfileService } from "@/lib/services/UnifiedProfileService";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
  const [shouldFetch, setShouldFetch] = useState(false);
  
  // Generate stable npub and display values upfront, avoiding regeneration on re-renders
  const stableValues = useMemo(() => {
    let npub = '';
    let shortNpub = '';
    let displayName = '';
    let avatarFallback = '';
    
    try {
      // Generate consistent values even before profile loads
      if (pubkey) {
        npub = getNpubFromHex(pubkey);
        shortNpub = npub ? `${npub.substring(0, 7)}...${npub.substring(npub.length - 4)}` : 'unknown';
        displayName = shortNpub;
        avatarFallback = displayName.charAt(0).toUpperCase();
      } else {
        npub = 'npub1unknown';
        shortNpub = 'unknown';
        displayName = 'Unknown';
        avatarFallback = 'U';
      }
    } catch (error) {
      console.error('Error in NoteCardHeader with pubkey:', pubkey, error);
      npub = 'npub1unknown';
      shortNpub = 'unknown';
      displayName = 'Unknown';
      avatarFallback = 'U';
    }
    
    return { npub, shortNpub, displayName, avatarFallback };
  }, [pubkey]);
  
  // Effect to handle intersection observer for lazy fetching
  useEffect(() => {
    // Initialize shouldFetch based on whether profileData was provided
    if (profileData || !pubkey) {
      setShouldFetch(false);
      return;
    }
    
    // Set up intersection observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldFetch(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    const element = document.getElementById(`note-header-${pubkey.substring(0, 8)}`);
    if (element) {
      observer.observe(element);
    }
    
    return () => {
      observer.disconnect();
    };
  }, [pubkey, profileData]);
  
  // Effect to fetch profile data only when shouldFetch is true
  useEffect(() => {
    let isMounted = true;
    
    // Update local state if profile data prop changes (immediate update)
    if (profileData) {
      setLocalProfileData(profileData);
      setIsLoading(false);
      return;
    }
    
    if (!pubkey || !shouldFetch) {
      if (!pubkey) {
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);
    
    // Fetch profile if not provided
    const fetchProfile = async () => {
      try {
        const profile = await unifiedProfileService.getProfile(pubkey);
        
        if (profile && isMounted) {
          setLocalProfileData(profile);
          setIsLoading(false);
        } else if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`[NoteCardHeader] Error fetching profile for ${pubkey}:`, error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchProfile();
    
    // Subscribe to profile updates
    const unsubscribe = unifiedProfileService.subscribeToUpdates(pubkey, (profile) => {
      if (profile && isMounted) {
        setLocalProfileData(profile);
        setIsLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [pubkey, profileData, shouldFetch]);
  
  // Format the created at timestamp
  const timeAgo = useMemo(() => {
    try {
      if (createdAt && createdAt > 0) {
        return formatDistanceToNow(
          new Date(createdAt * 1000),
          { addSuffix: true }
        );
      }
      return 'some time ago';
    } catch (error) {
      return 'some time ago';
    }
  }, [createdAt]);

  // Get profile info if available
  const name = localProfileData?.name || stableValues.shortNpub;
  const displayName = localProfileData?.display_name || name;
  const picture = localProfileData?.picture || '';

  return (
    <div className="flex justify-between" id={`note-header-${pubkey.substring(0, 8)}`}>
      <div className="flex">
        <Link 
          to={`/profile/${stableValues.npub}`} 
          className="mr-3 shrink-0 touch-target"
          onClick={() => setShouldFetch(true)} // Ensure profile loads on click
        >
          <Avatar className="h-11 w-11 border border-muted transition-opacity duration-300">
            {isLoading ? (
              <AvatarFallback className="bg-muted/50">
                {stableValues.avatarFallback}
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage 
                  src={picture} 
                  alt={displayName} 
                  className="transition-opacity duration-300"
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {stableValues.avatarFallback}
                </AvatarFallback>
              </>
            )}
          </Avatar>
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-x-1 flex-wrap">
            <Link 
              to={`/profile/${stableValues.npub}`} 
              className="font-bold truncate hover:underline touch-target"
              onClick={() => setShouldFetch(true)} // Ensure profile loads on click
            >
              <span className="transition-all duration-300">{displayName}</span>
            </Link>
            
            <span className="text-muted-foreground text-sm truncate">
              @{stableValues.shortNpub}
            </span>
            <span className="text-muted-foreground text-sm mx-0.5">·</span>
            <span className="text-muted-foreground text-sm hover:underline cursor-pointer touch-target">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteCardHeader;
