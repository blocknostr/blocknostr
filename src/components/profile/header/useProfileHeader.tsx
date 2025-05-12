
import { useState, useEffect, useRef } from 'react';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr/cache/content-cache'; 
import { verifyNip05 } from '@/lib/nostr/utils/nip';
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
    // Guard clause - skip if no nip05 or pubkey
    if (!profileData?.nip05 || !pubkeyHex) return;
    
    let abortController: AbortController | null = new AbortController();
    setVerifyingNip05(true);
    
    const verifyIdentifier = async () => {
      try {
        // Fix: Call verifyNip05 and check if the returned pubkey matches our pubkeyHex
        const responsePubkey = await verifyNip05(profileData.nip05, pubkeyHex);
        if (isMounted.current) {
          // Set to true if the pubkeys match, false otherwise
          setNip05Verified(responsePubkey === pubkeyHex);
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
    
    // Clean up function
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [profileData?.nip05, pubkeyHex]);

  // Check for X verification status from profile according to NIP-39
  useEffect(() => {
    // Guard clause - skip if no profile data
    if (!profileData) return;
      
    // Safe check for tags before processing
    if (profileData.tags && Array.isArray(profileData.tags)) {
      const twitterTag = profileData.tags.find((tag: any[]) => 
        Array.isArray(tag) && tag.length >= 3 && tag[0] === 'i' && tag[1]?.startsWith('twitter:')
      );
      
      if (twitterTag) {
        const username = twitterTag[1].split(':')[1]; // Extract username from "twitter:username"
        const tweetId = twitterTag[2]; // Tweet ID is in position 2
        
        if (isMounted.current) {
          setXVerified(true);
          setXVerifiedInfo({ username, tweetId });
        }
        return;
      }
    }
    
    // Fall back to legacy verification if no NIP-39 tag found
    if (profileData.twitter_verified) {
      if (isMounted.current) {
        setXVerified(true);
        setXVerifiedInfo({ 
          username: profileData.twitter || '', 
          tweetId: profileData.twitter_proof || '' 
        });
      }
      return;
    }
    
    // No verification found
    if (isMounted.current) {
      setXVerified(false);
      setXVerifiedInfo(null);
    }
  }, [profileData]);
  
  // Get account creation timestamp from earliest metadata event (NIP-01)
  useEffect(() => {
    const fetchAccountCreationDate = async () => {
      // Guard clause - skip if no pubkey
      if (!pubkeyHex) return;
      
      try {
        // Use cached profile timestamp if available
        const cachedProfile = contentCache.getProfile(pubkeyHex);
        if (cachedProfile && cachedProfile._createdAt) {
          if (isMounted.current) {
            setCreationDate(new Date(cachedProfile._createdAt * 1000));
          }
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
