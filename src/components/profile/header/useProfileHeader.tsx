
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr/cache/content-cache'; 
import { verifyNip05, checkXVerification } from '@/lib/nostr/utils/nip-utilities';

export function useProfileHeader(profileData: any, npub: string, pubkeyHex: string) {
  const [nip05Verified, setNip05Verified] = useState<boolean | null>(null);
  const [verifyingNip05, setVerifyingNip05] = useState(false);
  const [xVerified, setXVerified] = useState(false);
  const [xVerifiedInfo, setXVerifiedInfo] = useState<{ username: string, tweetId: string } | null>(null);
  const [creationDate, setCreationDate] = useState<Date>(new Date());
  
  // Verify NIP-05 identifier when profile data changes
  useEffect(() => {
    const verifyIdentifier = async () => {
      if (!profileData?.nip05 || !pubkeyHex) return;
      
      setVerifyingNip05(true);
      try {
        const isVerified = await verifyNip05(profileData.nip05, pubkeyHex);
        setNip05Verified(isVerified);
      } catch (error) {
        console.error('Error verifying NIP-05:', error);
        setNip05Verified(false);
      } finally {
        setVerifyingNip05(false);
      }
    };
    
    verifyIdentifier();
  }, [profileData?.nip05, pubkeyHex]);

  // Check for X verification status from profile according to NIP-39
  useEffect(() => {
    if (profileData) {
      const verification = checkXVerification(profileData);
      setXVerified(verification.xVerified);
      setXVerifiedInfo(verification.xVerifiedInfo);
    }
  }, [profileData]);
  
  // Get account creation timestamp from earliest metadata event (NIP-01)
  useEffect(() => {
    const fetchAccountCreationDate = async () => {
      if (!pubkeyHex) return;
      
      try {
        // Use cached profile timestamp if available
        const cachedProfile = contentCache.getProfile(pubkeyHex);
        if (cachedProfile && cachedProfile._createdAt) {
          setCreationDate(new Date(cachedProfile._createdAt * 1000));
          return;
        }
        
        // Subscribe to oldest metadata events to find creation date
        const subId = nostrService.subscribe(
          [
            {
              kinds: [0], // Metadata events
              authors: [pubkeyHex],
              limit: 10,
              // Request oldest events first
              until: Math.floor(Date.now() / 1000)
            }
          ],
          (events) => {
            // If we received multiple events, sort them to find the oldest
            if (Array.isArray(events)) {
              events.sort((a, b) => a.created_at - b.created_at);
              if (events.length > 0) {
                const oldestEvent = events[0];
                setCreationDate(new Date(oldestEvent.created_at * 1000));
                
                // Cache this timestamp for future reference
                if (contentCache.getProfile(pubkeyHex)) {
                  const existingProfile = contentCache.getProfile(pubkeyHex);
                  contentCache.cacheProfile(pubkeyHex, {
                    ...existingProfile,
                    _createdAt: oldestEvent.created_at
                  });
                }
              }
            } else if (events?.created_at) {
              // Single event response
              setCreationDate(new Date(events.created_at * 1000));
            }
          }
        );
        
        // Cleanup subscription after a short time
        setTimeout(() => {
          nostrService.unsubscribe(subId);
        }, 5000);
      } catch (error) {
        console.error("Error fetching account creation date:", error);
      }
    };
    
    fetchAccountCreationDate();
  }, [pubkeyHex]);
  
  // Format profile data for display
  const formattedNpub = npub || '';
  const shortNpub = formattedNpub ? `${formattedNpub.substring(0, 8)}...${formattedNpub.substring(formattedNpub.length - 8)}` : '';
  
  return {
    nip05Verified,
    verifyingNip05,
    xVerified,
    xVerifiedInfo,
    shortNpub,
    creationDate
  };
}
