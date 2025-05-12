import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { nostrService } from '@/lib/nostr';
import { verifyNip05Identifier, verifyNip05ForCurrentUser, nip05Utils } from './profileUtils';
import { isValidNip05Format } from '@/lib/nostr/utils/nip/nip05';

// Form schema based on NIP-01 metadata fields with stricter validation
const profileFormSchema = z
  .object({
    name: z.string().max(50, 'Name must be 50 characters or less').optional(),
    display_name: z.string().max(100, 'Display name must be 100 characters or less').optional(),
    about: z.string().max(500, 'About must be 500 characters or less').optional(),
    picture: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith('http') || val.startsWith('data:'),
        'Picture must be a valid URL or data URL'
      ),
    banner: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.startsWith('http') || val.startsWith('data:'),
        'Banner must be a valid URL or data URL'
      ),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    nip05: z
      .string()
      .optional()
      .refine((val) => !val || isValidNip05Format(val), {
        message: 'Invalid NIP-05 format. Should be username@domain.tld',
      }),
    lud16: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(val),
        'Invalid Lightning address format'
      ),
    twitter: z
      .string()
      .max(15, 'Twitter handle must be 15 characters or less')
      .optional()
      .transform((val) => (val ? val.replace(/^@/, '') : val)), // Remove @ if present
    github: z
      .string()
      .max(39, 'GitHub username must be 39 characters or less')
      .optional()
      .refine(
        (val) => !val || /^[a-zA-Z0-9-]+$/.test(val),
        'GitHub username can only contain letters, numbers, and hyphens'
      ),
    mastodon: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^@[a-zA-Z0-9_]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
        'Invalid Mastodon handle format (e.g., @username@domain.tld)'
      ),
    nostr: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^npub1[0-9a-zA-Z]{58}$/.test(val),
        'Invalid Nostr npub key'
      ),
  })
  .transform((data) => {
    // Trim and remove empty strings
    const cleaned: Record<string, string> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim() !== '') {
        cleaned[key] = value.trim();
      }
    });
    return cleaned;
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
      nostr: profileData?.nostr || '',
    },
    mode: 'onChange',
  });

  // Reset form with new profile data when it changes
  useEffect(() => {
    if (profileData) {
      form.reset({
        name: profileData.name || '',
        display_name: profileData.display_name || '',
        about: profileData.about || '',
        picture: profileData.picture || '',
        banner: profileData.banner || '',
        website: profileData.website || '',
        nip05: profileData.nip05 || '',
        lud16: profileData.lud16 || '',
        twitter: profileData.twitter || '',
        github: profileData.github || '',
        mastodon: profileData.mastodon || '',
        nostr: profileData.nostr || '',
      });
    }
  }, [profileData, form]);

  // Handle nip05 verification when value changes
  const nip05Value = form.watch('nip05');

  useEffect(() => {
    let timeoutId: number | null = null;

    if (nip05Value) {
      if (isValidNip05Format(nip05Value)) {
        setIsNip05Verifying(true);
        timeoutId = window.setTimeout(async () => {
          try {
            const isValid = await verifyNip05ForCurrentUser(nip05Value);
            setIsNip05Verified(isValid);
          } catch (error) {
            console.error('[NIP-05] Verification error:', error);
            setIsNip05Verified(false);
          } finally {
            setIsNip05Verifying(false);
          }
        }, 800); // Debounce verification
      } else {
        setIsNip05Verified(false);
        setIsNip05Verifying(false);
      }
    } else {
      setIsNip05Verified(null);
      setIsNip05Verifying(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [nip05Value]);

  // Function to manually verify NIP-05 identifier
  async function verifyNip05ForUser(identifier: string) {
    if (!identifier || !nostrService.publicKey) {
      setIsNip05Verified(null);
      setIsNip05Verifying(false);
      return false;
    }

    try {
      setIsNip05Verifying(true);
      const isValid = await verifyNip05ForCurrentUser(identifier);
      setIsNip05Verified(isValid);
      return isValid;
    } catch (error) {
      console.error('[NIP-05] Error verifying NIP-05:', error);
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
    verifyNip05: verifyNip05ForUser,
  };
}