
import { nostrService } from "@/lib/nostr";

/**
 * Simple profile service stub that can be used as a placeholder
 * until a full profile implementation is created
 */
export class SimpleProfileService {
  /**
   * Get basic profile metadata for a user
   */
  public async getProfileMetadata(pubkeyOrNpub: string): Promise<any | null> {
    try {
      // Convert npub to hex if needed
      let pubkey = pubkeyOrNpub;
      if (pubkeyOrNpub.startsWith('npub1')) {
        pubkey = nostrService.getHexFromNpub(pubkeyOrNpub);
      }
      
      // Get basic profile data
      return await nostrService.getUserProfile(pubkey);
    } catch (error) {
      console.error("Error fetching profile metadata:", error);
      return null;
    }
  }

  /**
   * Check if a profile exists
   */
  public async profileExists(pubkeyOrNpub: string): Promise<boolean> {
    const profile = await this.getProfileMetadata(pubkeyOrNpub);
    return !!profile;
  }
  
  /**
   * Format a name for display purposes
   */
  public formatDisplayName(profile: any | null): string {
    if (!profile) return 'Unknown User';
    return profile.display_name || profile.name || 'Unknown User';
  }
}

// Export a singleton instance
export const simpleProfileService = new SimpleProfileService();
