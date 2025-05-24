
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { nostrService } from "@/lib/nostr";

/**
 * Service to handle profile social relations (followers/following)
 */
export class ProfileRelationsService {
  private emitter: BrowserEventEmitter;
  
  constructor(emitter: BrowserEventEmitter) {
    this.emitter = emitter;
  }
  
  /**
   * Load social relations for a profile
   */
  public async loadRelations(pubkey: string, isCurrentUser: boolean, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // Update loading state
      loadingStatus.relations = 'loading';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
      
      const followersList: string[] = [];
      const followingList: string[] = [];
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Get following list first
      if (isCurrentUser && nostrService.following) {
        // Use the service's following list for better performance
        followingList.push(...nostrService.following);
      } else {
        // Fetch contact list from relays
        const contactsSubPromise = new Promise<void>(resolve => {
          const subId = nostrService.subscribe(
            [
              {
                kinds: [3], // Contact Lists (NIP-02)
                authors: [pubkey],
                limit: 5
              }
            ],
            (event) => {
              try {
                // Extract pubkeys from p tags
                const pubkeys = event.tags
                  .filter(tag => tag.length >= 2 && tag[0] === 'p')
                  .map(tag => tag[1]);
                
                followingList.push(...pubkeys);
              } catch (e) {
                console.error('Failed to parse contacts:', e);
              }
            }
          );
          
          // Set timeout to ensure we don't wait forever
          setTimeout(() => {
            nostrService.unsubscribe(subId);
            resolve();
          }, 5000);
        });
        
        await contactsSubPromise;
      }
      
      // Get followers
      const followersSubPromise = new Promise<void>(resolve => {
        const subId = nostrService.subscribe(
          [
            {
              kinds: [3], // Contact Lists (NIP-02)
              "#p": [pubkey], // Filter for contact lists that contain this pubkey
              limit: 50
            }
          ],
          (event) => {
            const followerPubkey = event.pubkey;
            if (!followersList.includes(followerPubkey)) {
              followersList.push(followerPubkey);
            }
          }
        );
        
        // Set timeout to ensure we don't wait forever
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          resolve();
        }, 5000);
      });
      
      await followersSubPromise;
      
      // Emit updated data
      this.emitter.emit('followers-received', pubkey, [...new Set(followersList)]);
      this.emitter.emit('following-received', pubkey, [...new Set(followingList)]);
      
      // Update loading state
      loadingStatus.relations = 'success';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile relations:", error);
      loadingStatus.relations = 'error';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    }
  }
}
