
import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS } from '../../constants';
import { contentCache } from '../../cache/content-cache';
import { UserListBase } from './user-list-base';

/**
 * Service for managing user mute lists following NIP-51
 */
export class MuteListService extends UserListBase {
  constructor(
    pool: SimplePool,
    getPublicKey: () => string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    super(pool, getPublicKey, getConnectedRelayUrls, {
      kind: EVENT_KINDS.MUTE_LIST,
      identifier: 'mute-list',
      cacheGetter: () => contentCache.getMuteList(),
      cacheSetter: (list: string[]) => contentCache.cacheMuteList(list)
    });
  }

  /**
   * Mutes a user following NIP-51 - adds the user to the mute list
   * @param pubkeyToMute The pubkey of the user to mute
   * @returns Whether the operation was successful
   */
  async muteUser(pubkeyToMute: string): Promise<boolean> {
    return this.addUserToList(pubkeyToMute);
  }

  /**
   * Unmutes a user following NIP-51 - removes the user from the mute list
   * @param pubkeyToUnmute The pubkey of the user to unmute
   * @returns Whether the operation was successful
   */
  async unmuteUser(pubkeyToUnmute: string): Promise<boolean> {
    return this.removeUserFromList(pubkeyToUnmute);
  }

  /**
   * Gets the current mute list for the user
   * @returns Array of pubkeys that are muted
   */
  async getMuteList(): Promise<string[]> {
    return this.getUserList();
  }

  /**
   * Checks if a user is muted
   * @param pubkey The pubkey to check
   * @returns True if the user is muted
   */
  async isUserMuted(pubkey: string): Promise<boolean> {
    return this.isUserInList(pubkey);
  }
}
