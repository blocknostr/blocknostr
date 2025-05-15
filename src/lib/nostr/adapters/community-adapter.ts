
import { BaseAdapter } from './base-adapter';
import { EVENT_KINDS } from '../constants';
import { validateCommunityEvent } from '../utils/nip/nip172';
import type { ProposalCategory } from '@/types/community';
import { toast } from 'sonner';

/**
 * Adapter for community operations following NIP-172
 * @see https://github.com/nostr-protocol/nips/blob/master/172.md
 */
export class CommunityAdapter extends BaseAdapter {
  // Create community compliant with NIP-172
  async createCommunity(name: string, description: string) {
    console.log("Creating community via adapter:", { name });
    
    this.validateAuthentication("create a community");
    
    try {
      return await this.service.createCommunity(name, description);
    } catch (error) {
      console.error("Error in community adapter createCommunity:", error);
      throw error;
    }
  }
  
  // Create proposal compliant with NIP-172
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string) {
    console.log("Creating proposal via adapter:", { 
      communityId: communityId ? communityId.slice(0, 8) + '...' : 'undefined', 
      title, 
      category 
    });
    
    this.validateAuthentication("create a proposal");
    
    // Ensure proper handling of ProposalCategory
    const validCategory = this.ensureValidProposalCategory(category);
    
    if (!communityId) {
      console.error("Missing communityId in createProposal adapter call");
      throw new Error("Community ID is required to create a proposal");
    }
    
    try {
      return await this.service.createProposal(
        communityId, 
        title, 
        description, 
        options, 
        validCategory
      );
    } catch (error) {
      console.error("Error in community adapter createProposal:", error);
      
      // Provide clearer error messages for common failures
      if (error instanceof Error) {
        if (error.message.includes("relay") || error.message.includes("connection")) {
          throw new Error("Failed to connect to relays. Please check your network connection.");
        } else if (error.message.includes("logged in") || error.message.includes("pubkey")) {
          throw new Error("You must be logged in to create a proposal. Please sign in and try again.");
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  
  // Helper method to ensure the category is valid
  private ensureValidProposalCategory(category: string): ProposalCategory {
    const validCategories: ProposalCategory[] = ["governance", "feature", "poll", "other"];
    
    if (validCategories.includes(category as ProposalCategory)) {
      return category as ProposalCategory;
    }
    
    console.warn(`Invalid category "${category}", defaulting to "other"`);
    return "other";
  }

  // Vote on proposal compliant with NIP-172
  async voteOnProposal(proposalId: string, optionIndex: number) {
    this.validateAuthentication("vote on a proposal");
    return this.service.voteOnProposal(proposalId, optionIndex);
  }
  
  // Validate if a community event follows NIP-172
  validateCommunityEvent(event: any) {
    return validateCommunityEvent(event);
  }
  
  // Helper method to validate authentication and provide clear errors
  private validateAuthentication(action: string): void {
    if (!this.service.publicKey) {
      console.error(`Cannot ${action}: user not logged in`);
      const errorMessage = `You must be logged in to ${action}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    // Check relay connections
    const relays = this.service.getConnectedRelayUrls();
    if (!relays || relays.length === 0) {
      console.error(`Cannot ${action}: no relays connected`);
      const errorMessage = `No relays connected. Unable to ${action}.`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
  
  get communityManager() {
    return this.service.communityManager;
  }
}
