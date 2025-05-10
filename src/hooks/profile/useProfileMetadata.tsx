
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

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
        
        // Fetch profile metadata directly
        const profileMetadata = await nostrService.getUserProfile(hexPubkey);
        if (profileMetadata) {
          setProfileData(profileMetadata);
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
    hexNpub
  };
}
