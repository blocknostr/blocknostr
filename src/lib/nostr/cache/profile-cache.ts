
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";

/**
 * Cache service for profile data
 */
export class ProfileCache extends BaseCache<any> {
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.PROFILES);
    this.loadFromStorage();
  }
}
