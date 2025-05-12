import { useState, useEffect, useRef } from 'react';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { contentCache } from '@/lib/nostr';

interface UseProfileMetadataProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

export function useProfileMetadata({ npub, currentUserPubkey }: UseProfileMetadataProps) {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  
  // Keep track of component mounting state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  
  // Convert npub to hex, handling errors properly
  const getHexPubkey = (input: string | undefined): string | null => {
    if (!input) return null;
    
    try {
      // If input is already in hex format (64 chars)
      if (input.length === 64 && /^[0-9a-f]+$/i.test(input)) {
        return input;
      }
      
      // If input starts with npub1, convert to hex
      if (input.startsWith('npub1')) {
        return nostrService.getHexFromNpub(input);
      }
      
      // Try to convert, assuming it's npub1 format
      return nostrService.getHexFromNpub(input);
    } catch (error) {
      console.error("Invalid pubkey format:", error);
      return null;
    }
  };
  
  // Determine if this is the current user's profile
  // If npub starts with 'npub1', convert it to hex first for comparison
  const hexNpub = getHexPubkey(npub);
  const isCurrentUser = currentUserPubkey && hexNpub === currentUserPubkey;
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const fetchProfileData = async () => {
      if (!npub && !currentUserPubkey) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Convert npub to hex if needed
        let hexPubkey: string | null = null;
        
        if (npub) {
          // If npub is provided, use it (convert from npub1 format if needed)
          hexPubkey = getHexPubkey(npub);
          console.log(`Converting ${npub} to hex: ${hexPubkey}`);
        } else if (currentUserPubkey) {
          // Fallback to current user if no npub provided
          hexPubkey = currentUserPubkey;
        }
        
        if (!hexPubkey) {
          toast.error("Invalid profile identifier");
          setError("Invalid profile identifier");
          setLoading(false);
          return;
        }
        
        console.log("Fetching profile for hex pubkey:", hexPubkey);
        
        // Check cache first
        const cachedProfile = contentCache.getProfile(hexPubkey);
        if (cachedProfile) {
          console.log("Found cached profile:", cachedProfile.name || cachedProfile.display_name || hexPubkey);
          if (mountedRef.current) {
            setProfileData(cachedProfile);
            setLoading(false);
          }
        }
        
        // Connect to relays if not already connected
        try {
          await nostrService.connectToUserRelays();
          
          // Add some popular relays to increase chances of finding the profile
          const additionalRelays = ["wss://relay.damus.io", "wss://relay.nostr.band", "wss://nos.lol"];
          await nostrService.addMultipleRelays(additionalRelays);
          
          console.log("Connected to relays, fetching profile...");
          
          // Fetch profile metadata directly
          const profileMetadata = await nostrService.getUserProfile(hexPubkey);
          if (profileMetadata) {
            console.log("Profile found:", profileMetadata.name || profileMetadata.display_name || hexPubkey);
            
            if (mountedRef.current) {
              setProfileData(profileMetadata);
              
              // Cache the profile
              try {
                contentCache.cacheProfile(hexPubkey, profileMetadata, true);
              } catch (cacheError) {
                console.warn("Failed to cache profile:", cacheError);
              }
            }
          } else {
            console.warn("No profile data returned for pubkey:", hexPubkey);
            
            // If no profile found, set minimal data
            if (mountedRef.current && !profileData) {
              const minimalData = {
                pubkey: hexPubkey,
                created_at: Math.floor(Date.now() / 1000)
              };
              
              setProfileData(minimalData);
            }
          }
        } catch (connectionError) {
          console.error("Error connecting to relays:", connectionError);
          
          // If we have cached data, we can still show it
          if (cachedProfile) {
            console.log("Using cached profile data due to connection error");
            // We already set this above
          } else if (mountedRef.current) {
            // Create minimal profile data
            setProfileData({
              pubkey: hexPubkey,
              created_at: Math.floor(Date.now() / 1000)
            });
            
            toast.error("Could not connect to relays");
          }
        }
        
        // Always set loading to false
        if (mountedRef.current) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching profile metadata:", error);
        if (mountedRef.current) {
          setError("Failed to load profile");
          toast.error("Could not load profile data. Please try again.");
          setLoading(false);
        }
      }
    };
    
    fetchProfileData();
    
    // Set a timeout to ensure loading state doesn't hang indefinitely
    timeoutRef.current = window.setTimeout(() => {
      if (mountedRef.current && loading) {
        console.log("Profile metadata loading timeout");
        setLoading(false);
        
        if (!profileData) {
          setError("Profile loading timed out");
          toast.error("Profile loading timed out. Please try again.");
        }
      }
    }, 15000);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [npub, currentUserPubkey]);

  return {
    profileData,
    loading,
    isCurrentUser,
    hexNpub,
    error,
    refetch: () => {
      if (mountedRef.current) {
        setLoading(true);
        setError(null);
        
        // Force a refetch by triggering a custom event
        const event = new CustomEvent('refetchProfile', { 
          detail: { npub, currentUserPubkey } 
        });
        window.dispatchEvent(event);
      }
    }
  };
}
