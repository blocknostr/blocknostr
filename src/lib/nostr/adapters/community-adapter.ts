
import { BaseAdapter } from './base-adapter';
import { EventAdapter } from './event-adapter';
import { toast } from 'sonner';

/**
 * Adapter for community operations
 * Extends EventAdapter to ensure it has event publishing capabilities
 */
export class CommunityAdapter extends EventAdapter {
  // Community methods with proper authentication and error handling
  async createCommunity(name: string, description: string) {
    if (!this.service.isLoggedIn()) {
      toast.error("You must be logged in to create a community");
      return null;
    }
    
    if (!this.service.hasConnectedRelays()) {
      toast.warning("Connecting to relays...");
      await this.service.connectToUserRelays();
      
      if (!this.service.hasConnectedRelays()) {
        toast.error("Failed to connect to relays. Please try again.");
        return null;
      }
    }
    
    try {
      const result = await this.service.createCommunity(name, description);
      if (!result) {
        toast.error("Failed to create community. Please try again.");
      }
      return result;
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("An error occurred while creating the community");
      return null;
    }
  }
  
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string) {
    if (!this.service.isLoggedIn()) {
      toast.error("You must be logged in to create a proposal");
      return null;
    }
    
    if (!this.service.hasConnectedRelays()) {
      toast.warning("Connecting to relays...");
      await this.service.connectToUserRelays();
      
      if (!this.service.hasConnectedRelays()) {
        toast.error("Failed to connect to relays. Please try again.");
        return null;
      }
    }
    
    try {
      const result = await this.service.createProposal(communityId, title, description, options, category as any);
      if (!result) {
        toast.error("Failed to create proposal. Please try again.");
      }
      return result;
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("An error occurred while creating the proposal");
      return null;
    }
  }

  async voteOnProposal(proposalId: string, optionIndex: number) {
    if (!this.service.isLoggedIn()) {
      toast.error("You must be logged in to vote on proposals");
      return null;
    }
    
    if (!this.service.hasConnectedRelays()) {
      toast.warning("Connecting to relays...");
      await this.service.connectToUserRelays();
      
      if (!this.service.hasConnectedRelays()) {
        toast.error("Failed to connect to relays. Please try again.");
        return null;
      }
    }
    
    try {
      const result = await this.service.voteOnProposal(proposalId, optionIndex);
      if (!result) {
        toast.error("Failed to record your vote. Please try again.");
      }
      return result;
    } catch (error) {
      console.error("Error voting on proposal:", error);
      toast.error("An error occurred while recording your vote");
      return null;
    }
  }
  
  get communityManager() {
    return this.service.communityManager;
  }
}
