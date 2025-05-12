
import { BaseCache } from "./base-cache";
import { CacheConfig } from "./types";
import { STORAGE_KEYS } from "./config";
import { NostrProfileMetadata } from "../types";
import { cacheManager } from "@/lib/utils/cacheManager";

/**
 * Enhanced cache service for profile data
 * Implements NIP-01 compliant caching with IndexedDB backing
 */
export class ProfileCache extends BaseCache<NostrProfileMetadata> {
  private readonly CACHE_PREFIX = 'profile:';
  private readonly VERIFICATION_PREFIX = 'verification:';
  private memoryCache: Map<string, NostrProfileMetadata> = new Map();
  
  constructor(config: CacheConfig) {
    super(config, STORAGE_KEYS.PROFILES);
    this.loadFromStorage();
  }
  
  /**
   * Get a profile from cache with optimized lookup
   * @param pubkey - The public key to look up
   */
  getProfile(pubkey: string): NostrProfileMetadata | null {
    // First check memory cache (fastest)
    const memProfile = this.memoryCache.get(pubkey);
    if (memProfile) return memProfile;
    
    // Then check base cache
    const profile = this.getItem(pubkey);
    if (profile) {
      // Update memory cache for faster subsequent lookups
      this.memoryCache.set(pubkey, profile);
      return profile;
    }
    
    // Finally check IndexedDB cache (async, but result will be cached for next time)
    this.loadFromIndexedDB(pubkey).then(dbProfile => {
      if (dbProfile) {
        this.cacheProfile(pubkey, dbProfile, true);
      }
    });
    
    return null;
  }
  
  /**
   * Cache a profile with proper metadata handling
   * @param pubkey - The public key of the profile
   * @param profile - The profile data to cache
   * @param important - Whether this profile should be persisted long-term
   */
  cacheProfile(pubkey: string, profile: NostrProfileMetadata, important: boolean = false): void {
    // Validate and sanitize profile data before caching
    const sanitizedProfile = this.sanitizeProfileData(profile);
    
    // Update caches
    this.memoryCache.set(pubkey, sanitizedProfile);
    this.cacheItem(pubkey, sanitizedProfile, important);
    
    // For important profiles, also store in IndexedDB for persistence
    if (important) {
      this.saveToIndexedDB(pubkey, sanitizedProfile);
    }
  }
  
  /**
   * Store verification status for a profile's NIP-05 identifier
   * @param identifier - The NIP-05 identifier
   * @param pubkey - The verified public key
   * @param verified - Whether verification succeeded
   */
  cacheVerification(identifier: string, pubkey: string, verified: boolean): void {
    const key = `${this.VERIFICATION_PREFIX}${identifier}`;
    cacheManager.set(key, { pubkey, verified }, 24 * 60 * 60 * 1000); // 24 hour TTL
  }
  
  /**
   * Get cached verification status
   * @param identifier - The NIP-05 identifier
   * @param pubkey - The public key to check against
   */
  getVerification(identifier: string, pubkey: string): boolean | null {
    const key = `${this.VERIFICATION_PREFIX}${identifier}`;
    const cached = cacheManager.get<{ pubkey: string, verified: boolean }>(key);
    
    if (cached && cached.pubkey === pubkey) {
      return cached.verified;
    }
    
    return null;
  }
  
  /**
   * Invalidate a profile cache entry
   * @param pubkey - The public key to invalidate
   */
  invalidateProfile(pubkey: string): void {
    this.memoryCache.delete(pubkey);
    this.cache.delete(pubkey);
    this.deleteFromIndexedDB(pubkey);
  }
  
  /**
   * Clear all profile caches
   */
  clear(): void {
    this.memoryCache.clear();
    super.clear();
  }
  
  /**
   * Sanitize profile data to prevent XSS and other security issues
   * @param profile - Raw profile data
   */
  private sanitizeProfileData(profile: NostrProfileMetadata): NostrProfileMetadata {
    if (!profile) return {};
    
    // Create a copy to avoid mutating the original
    const sanitized: NostrProfileMetadata = { ...profile };
    
    // Sanitize text fields
    if (sanitized.name) sanitized.name = this.sanitizeText(sanitized.name);
    if (sanitized.display_name) sanitized.display_name = this.sanitizeText(sanitized.display_name);
    if (sanitized.about) sanitized.about = this.sanitizeText(sanitized.about, 500);
    if (sanitized.nip05) sanitized.nip05 = this.sanitizeText(sanitized.nip05);
    
    // Validate URLs
    if (sanitized.picture && !this.isValidUrl(sanitized.picture)) delete sanitized.picture;
    if (sanitized.banner && !this.isValidUrl(sanitized.banner)) delete sanitized.banner;
    if (sanitized.website && !this.isValidUrl(sanitized.website)) delete sanitized.website;
    
    return sanitized;
  }
  
  /**
   * Simple text sanitization
   */
  private sanitizeText(text: string, maxLength: number = 100): string {
    if (!text) return '';
    // Basic sanitization - remove HTML/script tags
    const sanitized = text
      .replace(/<\/?[^>]+(>|$)/g, '')
      .trim();
    
    // Truncate if too long
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
  }
  
  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Save profile to IndexedDB for persistence
   */
  private saveToIndexedDB(pubkey: string, profile: NostrProfileMetadata): void {
    try {
      const key = `${this.CACHE_PREFIX}${pubkey}`;
      const value = {
        profile,
        timestamp: Date.now()
      };
      
      cacheManager.set(key, value, 7 * 24 * 60 * 60 * 1000); // 7 days TTL
    } catch (error) {
      console.error('Failed to save profile to IndexedDB:', error);
    }
  }
  
  /**
   * Load profile from IndexedDB
   */
  private async loadFromIndexedDB(pubkey: string): Promise<NostrProfileMetadata | null> {
    try {
      const key = `${this.CACHE_PREFIX}${pubkey}`;
      const cached = cacheManager.get<{ profile: NostrProfileMetadata, timestamp: number }>(key);
      
      if (cached && cached.profile) {
        return cached.profile;
      }
    } catch (error) {
      console.error('Failed to load profile from IndexedDB:', error);
    }
    
    return null;
  }
  
  /**
   * Delete profile from IndexedDB
   */
  private deleteFromIndexedDB(pubkey: string): void {
    try {
      const key = `${this.CACHE_PREFIX}${pubkey}`;
      cacheManager.delete(key);
    } catch (error) {
      console.error('Failed to delete profile from IndexedDB:', error);
    }
  }
}
