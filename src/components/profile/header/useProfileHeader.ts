
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

export function useProfileHeader(profile: any, npub: string, pubkeyHex: string) {
  const [nip05Verified, setNip05Verified] = useState<boolean>(false);
  const [verifyingNip05, setVerifyingNip05] = useState<boolean>(false);
  const [xVerified, setXVerified] = useState<boolean>(false);
  const [xVerifiedInfo, setXVerifiedInfo] = useState<any>(null);
  
  // Create a shortened display version of the npub
  const shortNpub = `${npub.substring(0, 8)}...${npub.substring(npub.length - 4)}`;
  
  // Estimate creation time based on pubkey (this is just an approximation)
  const creationDate = new Date().toLocaleDateString();
  
  // Verify NIP-05 identifier if available
  useEffect(() => {
    const verifyNip05 = async () => {
      if (!profile?.nip05 || !pubkeyHex) return;
      
      setVerifyingNip05(true);
      try {
        const isVerified = await nostrService.verifyNip05(pubkeyHex, profile.nip05);
        setNip05Verified(isVerified);
      } catch (error) {
        console.error('Error verifying NIP-05:', error);
        setNip05Verified(false);
      } finally {
        setVerifyingNip05(false);
      }
    };
    
    verifyNip05();
  }, [profile?.nip05, pubkeyHex]);
  
  // Check for X/Twitter verification from profile tags (NIP-39)
  useEffect(() => {
    if (!profile?.tags) return;
    
    const identityTags = profile.tags.filter(
      (tag: any[]) => tag[0] === 'i' && tag[1]?.startsWith('twitter:')
    );
    
    if (identityTags.length > 0) {
      const twitterTag = identityTags[0];
      // Format is ["i", "twitter:username", "proof_url", "sig"]
      if (twitterTag.length >= 4) {
        setXVerified(true);
        setXVerifiedInfo({
          username: twitterTag[1].replace('twitter:', ''),
          proofUrl: twitterTag[2],
          signature: twitterTag[3]
        });
      }
    }
  }, [profile?.tags]);
  
  return {
    nip05Verified,
    verifyingNip05,
    xVerified,
    xVerifiedInfo,
    shortNpub,
    creationDate
  };
}
