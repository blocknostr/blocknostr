
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";

/**
 * Cache service for feed data
 */
export class FeedCache extends BaseCache<string[]> {
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.FEEDS);
    this.loadFromStorage();
  }
}
