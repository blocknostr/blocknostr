
import { useProfileCore } from './profile/useProfileCore';

interface UseProfileServiceProps {
  npub: string | undefined;
  currentUserPubkey: string | null;
}

/**
 * Main profile service hook that provides profile data and operations
 */
export function useProfileService({ npub, currentUserPubkey }: UseProfileServiceProps) {
  // Delegate to the core implementation
  return useProfileCore({ npub, currentUserPubkey });
}
