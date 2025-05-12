
import { verifyNip05 } from '@/lib/nostr/nip05';
import { nostrService } from '@/lib/nostr';

/**
 * Verifies a NIP-05 identifier against the current user's pubkey
 * @param identifier The NIP-05 identifier to verify
 * @returns True if the identifier resolves to the current user's pubkey
 */
export async function verifyNip05Identifier(identifier: string): Promise<boolean> {
  if (!identifier || !nostrService.publicKey) return false;
  
  try {
    // Call verifyNip05 with only one argument (the identifier)
    const pubkey = await verifyNip05(identifier);
    
    // Check if the returned pubkey matches the current user's pubkey
    return pubkey === nostrService.publicKey;
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return false;
  }
}
