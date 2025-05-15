
import { BaseAdapter } from './base-adapter';
import { EVENT_KINDS } from '../constants';
import { validateCommunityEvent } from '../utils/nip/nip172';
import type { ProposalCategory } from '@/types/community';

/**
 * Adapter for community operations following NIP-172
 * @see https://github.com/nostr-protocol/nips/blob/master/172.md
 */
export class CommunityAdapter extends BaseAdapter {
  // Create community compliant with NIP-172
  async createCommunity(name: string, description: string) {
    return this.service.createCommunity(name, description);
  }
  
  // Create proposal compliant with NIP-172
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string) {
    console.log("Creating proposal via adapter:", { communityId, title, description, options, category });
    
    // Ensure proper handling of ProposalCategory
    const validCategory = this.ensureValidProposalCategory(category);
    
    if (!communityId) {
      console.error("Missing communityId in createProposal adapter call");
      throw new Error("Community ID is required to create a proposal");
    }
    
    if (!this.service.publicKey) {
      console.error("Missing public key in createProposal adapter call");
      throw new Error("You must be logged in to create a proposal");
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
      throw error;
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
    return this.service.voteOnProposal(proposalId, optionIndex);
  }
  
  // Validate if a community event follows NIP-172
  validateCommunity(event: any) {
    return validateCommunityEvent(event);
  }
  
  get communityManager() {
    return this.service.communityManager;
  }
}
