
import { NostrEvent } from "../types";
import { nostrService } from "../service";
import { validateEvent } from "../utils/nip/validator";

export interface SocialManager {
  // NIP-25: Reactions
  reactToEvent(eventId: string, reaction?: string): Promise<string | null>;
  
  // NIP-18: Reposts (combination with Kind 6)
  repostEvent(event: NostrEvent): Promise<string | null>;
  
  // NIP-10: Thread replies 
  replyToEvent(event: NostrEvent, content: string): Promise<string | null>;
  
  // NIP-01: Basic events - text notes
  publishTextNote(content: string, tags?: string[][]): Promise<string | null>;
  
  // NIP-36: Content warnings
  publishWithContentWarning(content: string, warningType: string): Promise<string | null>;
  
  // Follow functionality
  followUser(pubkey: string): Promise<boolean>;
  unfollowUser(pubkey: string): Promise<boolean>;
  isFollowing(pubkey: string): boolean;
  
  // User list management (followers/following)
  getFollowingList(): string[];
  getFollowersList(): Promise<string[]>;
  
  // Validation method
  validateInteraction(event: NostrEvent): { valid: boolean, errors: Record<string, string[]> };
}

export class SocialManager implements SocialManager {
  constructor(private service: typeof nostrService) {}
  
  // Implement methods according to NIP standards
  async reactToEvent(eventId: string, reaction: string = "+"): Promise<string | null> {
    if (!this.service.publicKey) return null;
    
    try {
      // Get the event we're reacting to
      const event = await this.service.getEventById(eventId);
      if (!event) return null;
      
      // Create a NIP-25 compliant reaction
      const reactionEvent = {
        kind: 7, // Reaction kind as per NIP-25
        content: reaction,
        tags: [
          ["e", eventId], // Reference to the event
          ["p", event.pubkey] // Reference to the original author
        ]
      };
      
      // Publish the reaction
      return await this.service.publishEvent(reactionEvent);
    } catch (error) {
      console.error("Error creating reaction:", error);
      return null;
    }
  }
  
  async repostEvent(event: NostrEvent): Promise<string | null> {
    if (!this.service.publicKey) return null;
    
    try {
      // Create a Kind 6 repost as commonly used (though not formally part of a NIP)
      const repostEvent = {
        kind: 6, // Repost
        content: event.content, // Include original content
        tags: [
          ["e", event.id, "", "root"], // Reference to the event with root marker per NIP-10
          ["p", event.pubkey] // Reference to the original author
        ]
      };
      
      // Publish the repost
      return await this.service.publishEvent(repostEvent);
    } catch (error) {
      console.error("Error reposting event:", error);
      return null;
    }
  }
  
  async replyToEvent(event: NostrEvent, content: string): Promise<string | null> {
    if (!this.service.publicKey || !content.trim()) return null;
    
    try {
      // Create a proper reply event according to NIP-10
      const tags: string[][] = [
        // Root event reference - find actual root or use current event
        ["e", event.id, "", "root"]
      ];
      
      // Add reference to the event we're directly replying to
      tags.push(["e", event.id, "", "reply"]);
      
      // Always include author reference
      tags.push(["p", event.pubkey]);
      
      // Create the reply event
      const replyEvent = {
        kind: 1, // Text note
        content,
        tags
      };
      
      // Publish the reply
      return await this.service.publishEvent(replyEvent);
    } catch (error) {
      console.error("Error creating reply:", error);
      return null;
    }
  }
  
  async publishTextNote(content: string, tags: string[][] = []): Promise<string | null> {
    if (!this.service.publicKey || !content.trim()) return null;
    
    try {
      // Create a NIP-01 compliant text note
      const noteEvent = {
        kind: 1, // Text note
        content,
        tags
      };
      
      // Publish the note
      return await this.service.publishEvent(noteEvent);
    } catch (error) {
      console.error("Error publishing note:", error);
      return null;
    }
  }
  
  async publishWithContentWarning(content: string, warningType: string = ""): Promise<string | null> {
    if (!this.service.publicKey || !content.trim()) return null;
    
    try {
      // Create tags with content warning according to NIP-36
      const tags: string[][] = [["content-warning", warningType]];
      
      // Create the note with content warning
      const noteEvent = {
        kind: 1, // Text note
        content,
        tags
      };
      
      // Publish the note
      return await this.service.publishEvent(noteEvent);
    } catch (error) {
      console.error("Error publishing note with content warning:", error);
      return null;
    }
  }
  
  // Follow functionality
  async followUser(pubkey: string): Promise<boolean> {
    // Implement according to NIP-02 (contact list)
    // This would follow the NIP-02 standard for contact lists
    return this.service.addContact?.(pubkey) || false;
  }
  
  async unfollowUser(pubkey: string): Promise<boolean> {
    // Implement according to NIP-02 (contact list)
    return this.service.removeContact?.(pubkey) || false;
  }
  
  isFollowing(pubkey: string): boolean {
    return this.service.following?.includes(pubkey) || false;
  }
  
  // User list management
  getFollowingList(): string[] {
    return this.service.following || [];
  }
  
  async getFollowersList(): Promise<string[]> {
    // This would usually require querying other users' contact lists
    // Implementation would depend on relay querying capabilities
    return [];
  }
  
  // Validation method
  validateInteraction(event: NostrEvent): { valid: boolean, errors: Record<string, string[]> } {
    const validationResults = validateEvent(event);
    
    // Convert validation results to required format
    const errors: Record<string, string[]> = {};
    let valid = true;
    
    for (const [nip, result] of Object.entries(validationResults)) {
      if (!result.valid) {
        errors[nip] = result.errors;
        valid = false;
      }
    }
    
    return { valid, errors };
  }
}
