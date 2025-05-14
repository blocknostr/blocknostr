
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
        
        // Still loading but user sees something immediately
        setLoading(false);
        
        // Continue fetching in background for fresh data
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
        
        // Use a promise race with timeout to ensure we get some data quickly
        const profileData = await Promise.race([
          nostrService.getUserProfile(pubkey),
          new Promise<Record<string, any> | null>((resolve) => {
            // If no data after 2s, resolve with null to avoid blocking UI
            setTimeout(() => resolve(null), 2000);
          })
        ]);
        
        if (profileData) {
          // Cache the profile data
          cacheManager.set(`profile:${pubkey}`, profileData, 5 * 60 * 1000); // 5 minutes
          
          // Update state
          setProfile(profileData);
          setError(null);
        } else {
          // If race timed out, try again in background
          setTimeout(() => {
            nostrService.getUserProfile(pubkey).then(data => {
              if (data) {
                cacheManager.set(`profile:${pubkey}`, data, 5 * 60 * 1000);
                setProfile(data);
                setError(null);
              }
            }).catch(e => console.error("Background profile fetch failed:", e));
          }, 0);
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
