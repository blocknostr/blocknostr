
import { NostrEvent } from "../types";
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";

/**
 * Cache service for thread data
 */
export class ThreadCache extends BaseCache<NostrEvent[]> {
  constructor(config: CacheConfig) {
    super(config);
  }
}
