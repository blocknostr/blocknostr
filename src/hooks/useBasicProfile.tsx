
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { cacheManager } from '@/lib/utils/cacheManager';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';

export function useBasicProfile(npub: string | undefined) {
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!npub) {
      setLoading(false);
      return;
    }
    
    let hexPubkey: string;
    let isMounted = true;
    
    try {
      hexPubkey = nostrService.getHexFromNpub(npub);
    } catch (error) {
      console.error('Invalid npub:', error);
      setError('Invalid profile identifier');
      setLoading(false);
      return;
    }
    
    const loadProfile = async () => {
      setLoading(true);
      
      try {
        // First try to get from UnifiedProfileService (includes its own cache check)
        const profileData = await unifiedProfileService.getProfile(hexPubkey);
        
        if (profileData && isMounted) {
          setProfile(profileData);
          setError(null);
          setLoading(false);
        } else {
          // If not available through UnifiedProfileService, fetch directly
          await fetchProfileData(hexPubkey);
        }
      } catch (err) {
        // If UnifiedProfileService fails, fetch directly
        await fetchProfileData(hexPubkey);
      }
    };
    
    const fetchProfileData = async (pubkey: string) => {
      try {
        // Make sure we're connected to relays
        await nostrService.connectToUserRelays();
        
        // Fetch profile data directly
        const profileData = await nostrService.getUserProfile(pubkey);
        
        if (profileData && isMounted) {
          // Cache the profile data
          cacheManager.set(`profile:${pubkey}`, profileData, 5 * 60 * 1000); // 5 minutes
          
          // Update state
          setProfile(profileData);
          setError(null);
        } else if (isMounted) {
          console.warn(`[useBasicProfile] No profile data found for ${pubkey.substring(0, 8)}`);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        if (isMounted) {
          setError('Failed to load profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadProfile();
    
    // Clean-up function
    return () => {
      isMounted = false;
    };
  }, [npub]);
  
  return { profile, loading, error };
}
