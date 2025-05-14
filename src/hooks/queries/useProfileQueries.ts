import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { nostrService } from '@/lib/nostr'; // Corrected import
import type { NostrProfileMetadata } from '@/lib/nostr'; // Ensured this is the type used for profile data

// Query key factory for profiles
export const profileQueryKeys = {
    all: ['profiles'] as const,
    detail: (pubkey: string) => [...profileQueryKeys.all, pubkey] as const,
    list: (pubkeys: string[]) => [...profileQueryKeys.all, 'list', pubkeys.sort().join(',')] as const,
};

/**
 * Fetches a single user profile.
 *
 * @param pubkey The public key of the user profile to fetch.
 * @param options.enabled Whether the query should be enabled.
 * @param options.staleTime The time in ms until the data is considered stale.
 */
export const useUserProfile = (
    pubkey: string | undefined,
    options?: { enabled?: boolean; staleTime?: number }
) => {
    return useQuery<NostrProfileMetadata | null, Error>({
        queryKey: profileQueryKeys.detail(pubkey!),
        queryFn: async () => {
            if (!pubkey) return null;
            try {
                const profile = await nostrService.getUserProfile(pubkey); // Use nostrService
                // Explicitly check for undefined, though type expects NostrProfileMetadata | null
                if (profile === undefined) {
                    console.warn(`[useUserProfile] nostrService.getUserProfile returned undefined for pubkey ${pubkey}. Returning null.`);
                    return null;
                }
                return profile;
            } catch (error) {
                console.error(`[useUserProfile] Error fetching profile for ${pubkey}:`, error);
                // Workaround for specific destructuring error, likely from nostrService.getUserProfile
                if (error instanceof TypeError && (error as TypeError).message.includes("Cannot destructure property 'pubkeys' of 'undefined'")) {
                    console.error(`[useUserProfile] Suppressing 'pubkeys' destructuring error for pubkey ${pubkey}. Returning null. Error: ${(error as TypeError).message}`);
                    return null;
                }
                throw error;
            }
        },
        enabled: !!pubkey && (options?.enabled !== undefined ? options.enabled : true),
        staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Fetches multiple user profiles.
 * The queryFn for each query already correctly returns Promise<NostrProfileMetadata | null>
 * as per adaptedNostrService.getUserProfile.
 *
 * @param pubkeys An array of public keys to fetch.
 * @param options.enabled Whether the queries should be enabled.
 * @param options.staleTime The time in ms until data for each profile is considered stale.
 */
export const useUserProfiles = (
    pubkeys: string[] | undefined,
    options?: { enabled?: boolean; staleTime?: number }
) => {
    const uniquePubkeys = pubkeys ? [...new Set(pubkeys)].filter(Boolean) : [];

    return useQueries({
        queries: uniquePubkeys.map((pubkey) => ({
            queryKey: profileQueryKeys.detail(pubkey),
            queryFn: async () => {
                try {
                    const profile = await nostrService.getUserProfile(pubkey); // Use nostrService
                    // Explicitly check for undefined, though type expects NostrProfileMetadata | null
                    if (profile === undefined) {
                        console.warn(`[useUserProfiles] nostrService.getUserProfile returned undefined for pubkey ${pubkey}. Returning null.`);
                        return null;
                    }
                    return profile;
                } catch (error) {
                    console.error(`[useUserProfiles] Error fetching profile for ${pubkey}:`, error);
                    // Workaround for specific destructuring error, likely from nostrService.getUserProfile
                    if (error instanceof TypeError && (error as TypeError).message.includes("Cannot destructure property 'pubkeys' of 'undefined'")) {
                        console.error(`[useUserProfiles] Suppressing 'pubkeys' destructuring error for pubkey ${pubkey}. Returning null. Error: ${(error as TypeError).message}`);
                        return null;
                    }
                    throw error;
                }
            },
            enabled: !!pubkey && (options?.enabled !== undefined ? options.enabled : true),
            staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
        })),
    });
};

/**
 * Updates a user profile.
 *
 * @param pubkey The public key of the user whose profile is to be updated.
 */
export const useUpdateUserProfile = (pubkey: string | undefined) => {
    const queryClient = useQueryClient();

    return useMutation<boolean, Error, NostrProfileMetadata>({
        mutationFn: async (profileMetadata: NostrProfileMetadata) => {
            if (!pubkey) {
                throw new Error('Public key is undefined. Cannot update profile.');
            }
            const success = await nostrService.publishProfileMetadata(profileMetadata); // Use nostrService
            if (!success) {
                throw new Error('Failed to publish profile metadata.');
            }
            return success;
        },
        onSuccess: (data, variables, context) => {
            if (pubkey) {
                queryClient.invalidateQueries({ queryKey: profileQueryKeys.detail(pubkey) });
            }
        },
        onError: (error) => {
            console.error('[useUpdateUserProfile] Error updating profile:', error);
        },
    });
};
