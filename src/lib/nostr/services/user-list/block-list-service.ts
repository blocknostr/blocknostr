
import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS, LIST_IDENTIFIERS } from '../../constants';
import { contentCache } from '../../cache/content-cache';
import { UserListBase } from './user-list-base';

/**
 * Service for managing user block lists following NIP-51 pattern
 */
export class BlockListService extends UserListBase {
  constructor(
    pool: SimplePool,
    getPublicKey: () => string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    super(pool, getPublicKey, getConnectedRelayUrls, {
      kind: EVENT_KINDS.LIST,
      identifier: LIST_IDENTIFIERS.BLOCK,
      cacheGetter: () => contentCache.getBlockList(),
      cacheSetter: (list: string[]) => contentCache.cacheBlockList(list)
    });
  }

  /**
   * Blocks a user - adds the user to the block list
   * @param pubkeyToBlock The pubkey of the user to block
   * @returns Whether the operation was successful
   */
  async blockUser(pubkeyToBlock: string): Promise<boolean> {
    return this.addUserToList(pubkeyToBlock);
  }

  /**
   * Unblocks a user - removes the user from the block list
   * @param pubkeyToUnblock The pubkey of the user to unblock
   * @returns Whether the operation was successful
   */
  async unblockUser(pubkeyToUnblock: string): Promise<boolean> {
    return this.removeUserFromList(pubkeyToUnblock);
  }

  /**
   * Gets the current block list for the user
   * @returns Array of pubkeys that are blocked
   */
  async getBlockList(): Promise<string[]> {
    return this.getUserList();
  }

  /**
   * Checks if a user is blocked
   * @param pubkey The pubkey to check
   * @returns True if the user is blocked
   */
  async isUserBlocked(pubkey: string): Promise<boolean> {
    return this.isUserInList(pubkey);
  }
}
