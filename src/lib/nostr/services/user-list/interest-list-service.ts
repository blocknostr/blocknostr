
import { SimplePool } from 'nostr-tools';
import { EVENT_KINDS, LIST_IDENTIFIERS } from '../../constants';
import { UserListBase } from './user-list-base';

/**
 * Service for managing user interest lists following NIP-51 pattern
 */
export class InterestListService extends UserListBase {
  constructor(
    pool: SimplePool,
    getPublicKey: () => string | null,
    getConnectedRelayUrls: () => string[]
  ) {
    super(pool, getPublicKey, getConnectedRelayUrls, {
      kind: EVENT_KINDS.LIST,
      identifier: LIST_IDENTIFIERS.INTERESTS,
      cacheGetter: () => [], // No cache yet for interests
      cacheSetter: () => {} // No cache yet for interests
    });
  }

  /**
   * Adds a topic to the interests list
   * @param topic The topic tag to add (usually a hashtag without the # symbol)
   * @returns Whether the operation was successful
   */
  async addInterest(topic: string): Promise<boolean> {
    return this.addTagToList('t', topic);
  }

  /**
   * Removes a topic from the interests list
   * @param topic The topic tag to remove
   * @returns Whether the operation was successful
   */
  async removeInterest(topic: string): Promise<boolean> {
    return this.removeTagFromList('t', topic);
  }

  /**
   * Gets the current interests list for the user
   * @returns Array of topic tags
   */
  async getInterests(): Promise<string[]> {
    return this.getTagList('t');
  }

  /**
   * Checks if a topic is in the interests list
   * @param topic The topic to check
   * @returns True if the topic is in the interests list
   */
  async hasInterest(topic: string): Promise<boolean> {
    return this.isTagInList('t', topic);
  }
}
