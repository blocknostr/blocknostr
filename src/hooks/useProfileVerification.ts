
import { useState, useEffect } from "react";
import { verifyNip05 } from "@/lib/nostr/nip05";

export function useProfileVerification(nip05?: string, pubkey?: string) {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  useEffect(() => {
    async function verifyProfile() {
      if (!nip05 || !pubkey) {
        setIsVerified(false);
        return;
      }
      
      try {
        setIsVerifying(true);
        const verifiedPubkey = await verifyNip05(nip05);
        setIsVerified(verifiedPubkey === pubkey);
      } catch (error) {
        console.error("Error verifying NIP05:", error);
        setIsVerified(false);
      } finally {
        setIsVerifying(false);
      }
    }
    
    verifyProfile();
  }, [nip05, pubkey]);
  
  return { isVerified, isVerifying };
}
