
/**
 * Shared types for the cache system
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  important?: boolean; // Flag for content that should be kept longer
}

export interface CacheConfig {
  standardExpiry: number;
  offlineExpiry: number;
}

export interface StorageKeys {
  [key: string]: string;
}
