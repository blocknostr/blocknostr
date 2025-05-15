
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for community-related operations
 */
export class CommunityAdapter extends BaseAdapter {
  /**
   * Create a new community
   */
  async createCommunity(name: string, description: string): Promise<string | null> {
    return this.service.createCommunity(name, description);
  }
  
  /**
   * Create a proposal in a community
   */
  async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: string
  ): Promise<string | null> {
    return this.service.createProposal(communityId, title, description, options, category);
  }
  
  /**
   * Vote on a proposal
   */
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean> {
    return this.service.voteOnProposal(proposalId, optionIndex);
  }
  
  /**
   * Get the community manager from the service
   */
  get communityManager() {
    return this.service.getCommunityManager();
  }
}
