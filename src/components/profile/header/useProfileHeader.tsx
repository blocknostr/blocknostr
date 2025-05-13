
import { useState, useEffect, useRef } from 'react';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr/cache/content-cache'; 
import { verifyNip05, checkXVerification } from '@/lib/nostr/utils/nip-utilities';
import { toast } from 'sonner';

export function useProfileHeader(profileData: any, npub: string, pubkeyHex: string) {
  const [nip05Verified, setNip05Verified] = useState<boolean | null>(null);
  const [verifyingNip05, setVerifyingNip05] = useState(false);
  const [xVerified, setXVerified] = useState(false);
  const [xVerifiedInfo, setXVerifiedInfo] = useState<{ username: string, tweetId: string } | null>(null);
  const [creationDate, setCreationDate] = useState<Date>(new Date());
  
  // Track if the component is mounted to avoid state updates after unmount
  const isMounted = useRef(true);
  
  // Set up the mounted ref
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Verify NIP-05 identifier when profile data changes
  useEffect(() => {
    const verifyIdentifier = async () => {
      if (!profileData?.nip05 || !pubkeyHex) return;
      
      let abortController: AbortController | null = new AbortController();
      setVerifyingNip05(true);
      
      try {
        const isVerified = await verifyNip05(profileData.nip05, pubkeyHex);
        if (isMounted.current) {
          setNip05Verified(isVerified);
        }
      } catch (error) {
        console.error('Error verifying NIP-05:', error);
        if (isMounted.current) {
          setNip05Verified(false);
        }
      } finally {
        if (isMounted.current) {
          setVerifyingNip05(false);
        }
        abortController = null;
      }
    };
    
    verifyIdentifier();
  }, [profileData?.nip05, pubkeyHex]);

  // Check for X verification status from profile according to NIP-39
  useEffect(() => {
    if (profileData) {
      // Add null check for tags before processing
      const verification = checkXVerification(profileData);
      if (isMounted.current) {
        setXVerified(verification.xVerified);
        setXVerifiedInfo(verification.xVerifiedInfo);
      }
    }
  }, [profileData]);
  
  // Get account creation timestamp from earliest metadata event (NIP-01)
  useEffect(() => {
    const fetchAccountCreationDate = async () => {
      if (!pubkeyHex) return;
      
      let activeSubscriptions: string[] = [];
      
      try {
        // Use cached profile timestamp if available
        const cachedProfile = contentCache.getProfile(pubkeyHex);
        if (cachedProfile && cachedProfile._createdAt) {
          setCreationDate(new Date(cachedProfile._createdAt * 1000));
          return;
        }
        
        // Use the ProfileService for fetching account creation date
        const creationTimestamp = await nostrService.getAccountCreationDate(pubkeyHex);
        
        if (creationTimestamp && isMounted.current) {
          setCreationDate(new Date(creationTimestamp * 1000));
          
          // Cache this timestamp for future reference
          if (contentCache.getProfile(pubkeyHex)) {
            const existingProfile = contentCache.getProfile(pubkeyHex);
            contentCache.cacheProfile(pubkeyHex, {
              ...existingProfile,
              _createdAt: creationTimestamp
            });
          }
        } else if (isMounted.current) {
          // If no creation date found, use current timestamp as fallback
          console.warn('No account creation date found for', pubkeyHex);
        }
      } catch (error) {
        console.error("Error fetching account creation date:", error);
        if (isMounted.current) {
          toast.error("Could not determine account age");
        }
      } finally {
        // Clean up any subscriptions that might have been created
        activeSubscriptions.forEach(subId => {
          if (nostrService.unsubscribe) {
            nostrService.unsubscribe(subId);
          }
        });
      }
    };
    
    fetchAccountCreationDate();
    
    return () => {
      // No additional cleanup needed here as we're using the isMounted pattern
    };
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
