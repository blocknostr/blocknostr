
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { cacheManager } from '@/lib/utils/cacheManager';

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
      
      // Check cache first for immediate rendering
      const cachedProfile = cacheManager.get<Record<string, any>>(`profile:${hexPubkey}`);
      if (cachedProfile) {
        console.log(`[useBasicProfile] Using cached profile for ${hexPubkey.substring(0, 8)}`);
        setProfile(cachedProfile);
        
        // Update loading state immediately
        setLoading(false);
        
        // Still fetch in background for fresh data without waiting
        fetchProfileData(hexPubkey).catch(err => 
          console.warn("Background profile refresh failed:", err));
        return;
      }
      
      // No cache hit, fetch directly
      await fetchProfileData(hexPubkey);
    };
    
    const fetchProfileData = async (pubkey: string) => {
      try {
        // Make sure we're connected to relays
        await nostrService.connectToUserRelays();
        
        // Fetch profile data directly without timeout race
        const profileData = await nostrService.getUserProfile(pubkey);
        
        if (profileData) {
          // Cache the profile data
          cacheManager.set(`profile:${pubkey}`, profileData, 5 * 60 * 1000); // 5 minutes
          
          // Update state
          setProfile(profileData);
          setError(null);
        } else {
          console.warn(`[useBasicProfile] No profile data found for ${pubkey.substring(0, 8)}`);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [npub]);
  
  return { profile, loading, error };
}
