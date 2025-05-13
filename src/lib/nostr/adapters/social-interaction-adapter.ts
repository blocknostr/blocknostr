
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for social interaction operations (interests, muting, blocking)
 */
export class SocialInteractionAdapter extends BaseAdapter {
  // Interest methods
  async addInterest(topic: string): Promise<boolean> {
    const interestService = this.service.socialInteractionService;
    if (!interestService) return false;
    return interestService.addInterest(topic);
  }
  
  async removeInterest(topic: string): Promise<boolean> {
    const interestService = this.service.socialInteractionService;
    if (!interestService) return false;
    return interestService.removeInterest(topic);
  }
  
  async getInterests(): Promise<string[]> {
    const interestService = this.service.socialInteractionService;
    if (!interestService) return [];
    return interestService.getInterests();
  }
  
  async hasInterest(topic: string): Promise<boolean> {
    const interestService = this.service.socialInteractionService;
    if (!interestService) return false;
    return interestService.hasInterest(topic);
  }
  
  // Mute list methods
  async muteUser(pubkey: string): Promise<boolean> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return false;
    return socialService.muteUser(pubkey);
  }
  
  async unmuteUser(pubkey: string): Promise<boolean> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return false;
    return socialService.unmuteUser(pubkey);
  }
  
  async getMuteList(): Promise<string[]> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return [];
    return socialService.getMuteList();
  }
  
  async isUserMuted(pubkey: string): Promise<boolean> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return false;
    return socialService.isUserMuted(pubkey);
  }
  
  // Block list methods
  async blockUser(pubkey: string): Promise<boolean> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return false;
    return socialService.blockUser(pubkey);
  }
  
  async unblockUser(pubkey: string): Promise<boolean> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return false;
    return socialService.unblockUser(pubkey);
  }
  
  async getBlockList(): Promise<string[]> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return [];
    return socialService.getBlockList();
  }
  
  async isUserBlocked(pubkey: string): Promise<boolean> {
    const socialService = this.service.socialInteractionService;
    if (!socialService) return false;
    return socialService.isUserBlocked(pubkey);
  }
}
