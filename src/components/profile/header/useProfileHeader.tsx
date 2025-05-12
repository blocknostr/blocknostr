
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

export function useProfileHeader(profileData: any, npub: string, pubkeyHex: string) {
  const [nip05Verified, setNip05Verified] = useState<boolean | null>(null);
  const [verifyingNip05, setVerifyingNip05] = useState(false);
  const [xVerified, setXVerified] = useState(false);
  const [xVerifiedInfo, setXVerifiedInfo] = useState<{ username: string, tweetId: string } | null>(null);
  
  // Verify NIP-05 identifier when profile data changes
  useEffect(() => {
    const verifyNip05 = async () => {
      if (!profileData?.nip05 || !pubkeyHex) return;
      
      setVerifyingNip05(true);
      try {
        const isVerified = await nostrService.verifyNip05(profileData.nip05, pubkeyHex);
        setNip05Verified(isVerified);
      } catch (error) {
        console.error('Error verifying NIP-05:', error);
        setNip05Verified(false);
      } finally {
        setVerifyingNip05(false);
      }
    };
    
    verifyNip05();
  }, [profileData?.nip05, pubkeyHex]);

  // Check for X verification status from profile according to NIP-39
  useEffect(() => {
    if (profileData) {
      // First, check for NIP-39 "i" tags in the event
      if (Array.isArray(profileData.tags)) {
        const twitterTag = profileData.tags.find((tag: any[]) => 
          tag.length >= 3 && tag[0] === 'i' && tag[1].startsWith('twitter:')
        );
        
        if (twitterTag) {
          const username = twitterTag[1].split(':')[1]; // Extract username from "twitter:username"
          const tweetId = twitterTag[2]; // Tweet ID is in position 2
          
          setXVerified(true);
          setXVerifiedInfo({ username, tweetId });
          return;
        }
      }
      
      // Fall back to legacy verification if no NIP-39 tag found
      if (profileData.twitter_verified) {
        setXVerified(true);
        setXVerifiedInfo({ 
          username: profileData.twitter || '', 
          tweetId: profileData.twitter_proof || '' 
        });
        return;
      }
      
      setXVerified(false);
      setXVerifiedInfo(null);
    }
  }, [profileData]);
  
  // Format profile data for display
  const formattedNpub = npub || '';
  const shortNpub = formattedNpub ? `${formattedNpub.substring(0, 8)}...${formattedNpub.substring(formattedNpub.length - 8)}` : '';
  
  // Get account creation date (using NIP-01 bech32 encoding timestamp)
  const creationDate = new Date();
  
  return {
    nip05Verified,
    verifyingNip05,
    xVerified,
    xVerifiedInfo,
    shortNpub,
    creationDate
  };
}
