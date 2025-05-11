
import { nostrService as originalNostrService } from '../service';

/**
 * Community-related adapter methods
 */
export class CommunityAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  // Community methods
  async createCommunity(name: string, description: string) {
    return this.service.createCommunity(name, description);
  }
  
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string) {
    return this.service.createProposal(communityId, title, description, options, category as any);
  }

  async voteOnProposal(proposalId: string, optionIndex: number) {
    return this.service.voteOnProposal(proposalId, optionIndex);
  }
  
  get communityManager() {
    return this.service.communityManager;
  }
}
