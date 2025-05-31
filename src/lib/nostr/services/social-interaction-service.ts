
import { SimplePool } from 'nostr-tools';
import { MuteListService, BlockListService } from './user-list';

/**
 * Facade service that provides social interaction capabilities
 * Handles user muting and blocking using specialized services
 */
export class SocialInteractionService {
  private muteListService: MuteListService;
  private blockListService: BlockListService;

  constructor(
    pool: SimplePool,
    getPublicKey: () => string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    this.muteListService = new MuteListService(pool, getPublicKey, getConnectedRelayUrls);
    this.blockListService = new BlockListService(pool, getPublicKey, getConnectedRelayUrls);
  }

  // Mute list methods
  async muteUser(pubkey: string): Promise<boolean> {
    return this.muteListService.muteUser(pubkey);
  }

  async unmuteUser(pubkey: string): Promise<boolean> {
    return this.muteListService.unmuteUser(pubkey);
  }

  async getMuteList(): Promise<string[]> {
    return this.muteListService.getMuteList();
  }

  async isUserMuted(pubkey: string): Promise<boolean> {
    return this.muteListService.isUserMuted(pubkey);
  }

  // Block list methods
  async blockUser(pubkey: string): Promise<boolean> {
    return this.blockListService.blockUser(pubkey);
  }

  async unblockUser(pubkey: string): Promise<boolean> {
    return this.blockListService.unblockUser(pubkey);
  }

  async getBlockList(): Promise<string[]> {
    return this.blockListService.getBlockList();
  }

  async isUserBlocked(pubkey: string): Promise<boolean> {
    return this.blockListService.isUserBlocked(pubkey);
  }
}

