
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { ProfileUtils } from '@/lib/nostr/utils/profileUtils';

interface UseProfileMetadataProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileMetadata({ npub, currentUserPubkey }: UseProfileMetadataProps) {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Determine if this is the current user's profile
  // If npub starts with 'npub1', convert it to hex first for comparison
  const hexNpub = npub && npub.startsWith('npub1') ? nostrService.getHexFromNpub(npub) : npub;
  const isCurrentUser = currentUserPubkey && hexNpub === currentUserPubkey;
  
  // Function to refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!hexNpub) return;
    
    try {
      setLoading(true);
      toast.loading("Refreshing profile data...");
      
      const freshProfile = await ProfileUtils.refreshProfile(hexNpub);
      
      if (freshProfile) {
        setProfileData(freshProfile);
        toast.success("Profile updated successfully");
      } else {
        toast.error("Could not update profile");
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast.error("Failed to refresh profile");
    } finally {
      setLoading(false);
    }
  }, [hexNpub]);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!npub && !currentUserPubkey) return;
      
      try {
        setLoading(true);
        
        // Connect to relays if not already connected
        await nostrService.connectToUserRelays();
        
        // Convert npub to hex if needed
        let hexPubkey = '';
        
        if (npub) {
          // If npub is provided, use it (convert from npub1 format if needed)
          hexPubkey = npub.startsWith('npub1') ? nostrService.getHexFromNpub(npub) : npub;
        } else if (currentUserPubkey) {
          // Fallback to current user if no npub provided
          hexPubkey = currentUserPubkey;
        }
        
        if (!hexPubkey) {
          toast.error("Invalid profile identifier");
          setLoading(false);
          return;
        }
        
        // Fetch profile using enhanced utility with caching
        const profileMetadata = await ProfileUtils.fetchProfile(hexPubkey, {
          cachePriority: "high",
          includeRelays: true
        });
        
        if (profileMetadata) {
          setProfileData(profileMetadata);
        } else {
          // If no profile found, set minimal data
          setProfileData({
            pubkey: hexPubkey,
            created_at: Math.floor(Date.now() / 1000)
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile metadata:", error);
        toast.error("Could not load profile data. Please try again.");
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [npub, currentUserPubkey]);

  return {
    profileData,
    loading,
    isCurrentUser,
    hexNpub,
    refreshProfile
  };
}
