
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { nostrService } from '@/lib/nostr';
import { verifyNip05Identifier } from './profileUtils';

// Form schema based on NIP-01 metadata fields
const profileFormSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z.string().url().optional().or(z.string().length(0)),
  banner: z.string().url().optional().or(z.string().length(0)),
  website: z.string().url().optional().or(z.string().length(0)),
  nip05: z.string().optional(),
  lud16: z.string().optional(), // Lightning address
  twitter: z.string().optional(),
  github: z.string().optional(),
  mastodon: z.string().optional(),
  nostr: z.string().optional()
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function useProfileForm(profileData: any) {
  const [isNip05Verified, setIsNip05Verified] = useState<boolean | null>(null);
  const [isNip05Verifying, setIsNip05Verifying] = useState(false);

  // Initialize form with existing profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profileData.profileData?.name || '',
      display_name: profileData.profileData?.display_name || '',
      about: profileData.profileData?.about || '',
      picture: profileData.profileData?.picture || '',
      banner: profileData.profileData?.banner || '',
      website: profileData.profileData?.website || '',
      nip05: profileData.profileData?.nip05 || '',
      lud16: profileData.profileData?.lud16 || '',
      twitter: profileData.profileData?.twitter || '',
      github: profileData.profileData?.github || '',
      mastodon: profileData.profileData?.mastodon || '',
      nostr: profileData.profileData?.nostr || ''
    }
  });

  // Handle nip05 verification when value changes
  const nip05Value = form.watch('nip05');
  
  useEffect(() => {
    if (nip05Value) {
      const timeoutId = setTimeout(async () => {
        await checkNip05(nip05Value);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsNip05Verified(null);
    }
  }, [nip05Value]);

  // Function to verify NIP-05 identifier
  async function checkNip05(identifier: string) {
    if (!identifier || !nostrService.publicKey) {
      setIsNip05Verified(null);
      return false;
    }
    
    setIsNip05Verifying(true);
    setIsNip05Verified(null);
    
    try {
      // Call the utility function with one argument (the identifier)
      const isValid = await verifyNip05Identifier(identifier);
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
    verifyNip05Identifier: checkNip05 // Rename to prevent confusion with imported function
  };
}
