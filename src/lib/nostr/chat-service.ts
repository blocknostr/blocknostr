
import { SimplePool } from 'nostr-tools';
import { nostrService } from './service';
import { NostrServiceInterface } from './types/service-interface';

/**
 * Specialized service for chat functionality
 * This wraps the main nostrService but provides specialized methods for chat
 */
class ChatNostrService implements NostrServiceInterface {
  // Forward all properties from the main service
  get publicKey() { return nostrService.publicKey; }
  get following() { return nostrService.following; }
  get communityManager() { return nostrService.communityManager; }
  get socialManager() { return nostrService.socialManager; }
  get relayManager() { return nostrService.relayManager; }
  
  // Other required methods from the interface
  getPublicKey() { return nostrService.getPublicKey(); }
  setPublicKey(publicKey: string | null) { return nostrService.setPublicKey(publicKey); }
  setPrivateKey(privateKey: string | null) { return nostrService.setPrivateKey(privateKey); }
  
  // Event methods
  publishEvent(event: any) { return nostrService.publishEvent(event); }
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) { 
    return nostrService.subscribe(filters, onEvent, relays); 
  }
  unsubscribe(subId: string) { return nostrService.unsubscribe(subId); }
  
  // Relay methods
  getConnectedRelayUrls() { return nostrService.getConnectedRelayUrls(); }
  connectToUserRelays() { return nostrService.connectToUserRelays(); }
  getRelayStatus() { return nostrService.getRelayStatus(); }
  getRelayUrls() { return nostrService.getRelayUrls(); }
  addRelay(relayUrl: string, readWrite?: boolean) { return nostrService.addRelay(relayUrl, readWrite); }
  removeRelay(relayUrl: string) { return nostrService.removeRelay(relayUrl); }
  
  // Community methods
  createCommunity(name: string, description: string) { return nostrService.createCommunity(name, description); }
  createProposal(communityId: string, title: string, description: string, options: string[], category: any) {
    return nostrService.createProposal(communityId, title, description, options, category);
  }
  voteOnProposal(proposalId: string, optionIndex: number) { return nostrService.voteOnProposal(proposalId, optionIndex); }
  
  // Social methods
  isFollowing(pubkey: string) { return nostrService.isFollowing(pubkey); }
  followUser(pubkey: string) { return nostrService.followUser(pubkey); }
  unfollowUser(pubkey: string) { return nostrService.unfollowUser(pubkey); }
  sendDirectMessage(recipientPubkey: string, content: string) { return nostrService.sendDirectMessage(recipientPubkey, content); }
  reactToPost(id: string, emoji?: string) { return nostrService.reactToPost(id, emoji); }
  repostNote(id: string, pubkey: string) { return nostrService.repostNote(id, pubkey); }
  
  // Profile methods
  getUserProfile(pubkey: string) { return nostrService.getUserProfile(pubkey); }
  getProfilesByPubkeys(pubkeys: string[]) { return nostrService.getProfilesByPubkeys(pubkeys); }
  
  // Event data methods
  getEventById(id: string) { return nostrService.getEventById(id); }
  getEvents(ids: string[]) { return nostrService.getEvents(ids); }
  
  // Authentication methods
  login() { return nostrService.login(); }
  signOut() { return nostrService.signOut(); }
  
  // Verification methods
  verifyNip05(identifier: string, pubkey: string) { return nostrService.verifyNip05(identifier, pubkey); }
  getAccountCreationDate(pubkey: string) { return nostrService.getAccountCreationDate(pubkey); }
  
  // User moderation methods
  muteUser(pubkey: string) { return nostrService.muteUser(pubkey); }
  unmuteUser(pubkey: string) { return nostrService.unmuteUser(pubkey); }
  isUserMuted(pubkey: string) { return nostrService.isUserMuted(pubkey); }
  blockUser(pubkey: string) { return nostrService.blockUser(pubkey); }
  unblockUser(pubkey: string) { return nostrService.unblockUser(pubkey); }
  isUserBlocked(pubkey: string) { return nostrService.isUserBlocked(pubkey); }
  
  // Extended methods
  getRelaysForUser(pubkey: string) { return nostrService.getRelaysForUser(pubkey); }
  addMultipleRelays(relayUrls: string[]) { return nostrService.addMultipleRelays(relayUrls); }
  
  // Cleanup
  cleanup() { return nostrService.cleanup(); }
}

// Export a singleton instance for chat components to use
export const chatNostrService = new ChatNostrService();
