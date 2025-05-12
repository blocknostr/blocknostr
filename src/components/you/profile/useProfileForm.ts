
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { nostrService } from '@/lib/nostr';
import { verifyNip05Identifier, verifyNip05ForCurrentUser, nip05Utils } from './profileUtils';
import { isValidNip05Format } from '@/lib/nostr/utils/nip/nip05';

// Form schema based on NIP-01 metadata fields
const profileFormSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z.string().url().optional().or(z.string().length(0)),
  banner: z.string().url().optional().or(z.string().length(0)),
  website: z.string().url().optional().or(z.string().length(0)),
  nip05: z.string().optional()
    .refine(val => !val || isValidNip05Format(val), {
      message: "Invalid NIP-05 format. Should be username@domain.tld"
    }),
  lud16: z.string().optional(), // Lightning address
  twitter: z.string().optional(), // Twitter without @
  github: z.string().optional(),
  mastodon: z.string().optional(),
  nostr: z.string().optional()
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UseProfileFormProps {
  profileData: any;
}

export function useProfileForm({ profileData }: UseProfileFormProps) {
  const [isNip05Verified, setIsNip05Verified] = useState<boolean | null>(null);
  const [isNip05Verifying, setIsNip05Verifying] = useState(false);

  // Initialize form with existing profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profileData?.name || '',
      display_name: profileData?.display_name || '',
      about: profileData?.about || '',
      picture: profileData?.picture || '',
      banner: profileData?.banner || '',
      website: profileData?.website || '',
      nip05: profileData?.nip05 || '',
      lud16: profileData?.lud16 || '',
      twitter: profileData?.twitter || '',
      github: profileData?.github || '',
      mastodon: profileData?.mastodon || '',
      nostr: profileData?.nostr || ''
    }
  });

  // Handle nip05 verification when value changes
  const nip05Value = form.watch('nip05');
  
  useEffect(() => {
    let timeoutId: number | null = null;
    
    if (nip05Value) {
      // Only verify if the format is valid
      if (isValidNip05Format(nip05Value)) {
        setIsNip05Verifying(true);
        timeoutId = window.setTimeout(async () => {
          const isValid = await verifyNip05ForCurrentUser(nip05Value);
          setIsNip05Verified(isValid);
          setIsNip05Verifying(false);
        }, 800); // Debounce verification
      } else {
        setIsNip05Verified(false);
      }
    } else {
      setIsNip05Verified(null);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [nip05Value]);

  // Function to verify NIP-05 identifier
  async function verifyNip05ForUser(identifier: string) {
    if (!identifier || !nostrService.publicKey) {
      setIsNip05Verified(null);
      return false;
    }
    
    try {
      setIsNip05Verifying(true);
      
      // Call the utility function to verify NIP-05
      const isValid = await verifyNip05ForCurrentUser(identifier);
      setIsNip05Verified(isValid);
      return isValid;
    } catch (error) {
      console.error("Error verifying NIP-05:", error);
      setIsNip05Verified(false);
      return false;
    } finally {
      setIsNip05Verifying(false);
    }
  }

  return {
    form,
    isNip05Verified,
    isNip05Verifying,
    setIsNip05Verified,
    verifyNip05: verifyNip05ForUser
  };
}
