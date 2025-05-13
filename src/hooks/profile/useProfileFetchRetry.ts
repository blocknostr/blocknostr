
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr';
import { retry } from '@/lib/utils/retry';
import { ProfileData } from '@/components/you/EditProfileSection';

/**
 * Fetches a profile with retry mechanism
 */
export async function fetchProfileWithRetry(hexPubkey: string) {
  try {
    // Connect to relays if not already connected
    await nostrService.connectToUserRelays();

    // Add some popular relays to increase chances of finding the profile
    const additionalRelays = [
      "wss://relay.damus.io",
      "wss://relay.nostr.band",
      "wss://nos.lol",
      "wss://nostr-pub.wellorder.net",
      "wss://relay.nostr.info"
    ];
    await nostrService.addMultipleRelays(additionalRelays);

    console.log("Connected to relays, fetching profile...");

    // Use the retry utility for more resilient fetching
    const profileMetadata = await retry(
      () => nostrService.getUserProfile(hexPubkey),
      {
        maxAttempts: 3,
        baseDelay: 1000,
        onRetry: (attempt) => {
          console.log(`Retry attempt ${attempt} for profile ${hexPubkey}`);
        }
      }
    );

    // Create a safe default profile if no data returned
    if (!profileMetadata) {
      console.warn(`No profile metadata returned for ${hexPubkey}`);
      return createMinimalProfile(hexPubkey);
    }

    // Safely extract and type properties from profileMetadata
    const metadata = profileMetadata as Record<string, unknown>;
    const profileData: ProfileData = {
      name: typeof metadata.name === 'string' ? metadata.name : "Unknown",
      bio: typeof metadata.bio === 'string' ? metadata.bio : "",
      picture: typeof metadata.picture === 'string' ? metadata.picture : "",
      banner: typeof metadata.banner === 'string' ? metadata.banner : "",
      nip05: typeof metadata.nip05 === 'string' ? metadata.nip05 : undefined
    };

    return profileData;
  } catch (error) {
    console.error("Error in profile fetch with retry:", error);
    // Return a minimal profile on error instead of throwing
    return createMinimalProfile(hexPubkey);
  }
}

/**
 * Handle profile cache operations
 */
export function handleProfileCache(hexPubkey: string, profileMetadata: ProfileData) {
  if (!profileMetadata) return createMinimalProfile(hexPubkey);

  console.log("Profile found:", profileMetadata.name || hexPubkey);

  // Cache the profile
  try {
    contentCache.cacheProfile(hexPubkey, profileMetadata, true);
  } catch (cacheError) {
    console.warn("Failed to cache profile:", cacheError);
  }

  return profileMetadata;
}

/**
 * Create a minimal profile when no data is available
 */
export function createMinimalProfile(hexPubkey: string): ProfileData {
  return {
    name: "Unknown",
    bio: "",
    picture: "",
    banner: "",
    nip05: undefined // Optional property
  };
}
