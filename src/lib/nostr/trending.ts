
import { SimplePool } from 'nostr-tools';
import { NostrEvent, NostrProfileMetadata } from './types';
import { EVENT_KINDS } from './constants';

interface TrendingUser {
  pubkey: string;
  score: number;
  mentions: number;
  reactions: number;
  reposts: number;
  metadata?: NostrProfileMetadata;
}

export interface FetchTrendingUsersOptions {
  limit?: number;
  timeframe?: 'day' | 'week' | 'month';
  excludePubkeys?: string[];
}

export class TrendingUsersManager {
  private profileCache: Map<string, NostrProfileMetadata> = new Map();
  private trendingCache: Map<string, TrendingUser[]> = new Map();
  private lastFetchTime: Map<string, number> = new Map();
  private CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes
  
  // Calculate trending score based on various metrics
  private calculateScore(user: TrendingUser): number {
    // Weight different types of engagement
    const mentionWeight = 2;
    const reactionWeight = 1;
    const repostWeight = 3;
    
    return (
      user.mentions * mentionWeight + 
      user.reactions * reactionWeight + 
      user.reposts * repostWeight
    );
  }
  
  // Get cache key based on options
  private getCacheKey(options: FetchTrendingUsersOptions): string {
    const { timeframe = 'week', limit = 10 } = options;
    return `trending-${timeframe}-${limit}`;
  }
  
  // Check if cache is valid
  private isCacheValid(cacheKey: string): boolean {
    const lastFetch = this.lastFetchTime.get(cacheKey);
    if (!lastFetch) return false;
    
    return (Date.now() - lastFetch) < this.CACHE_LIFETIME && 
           this.trendingCache.has(cacheKey);
  }
  
  // Get since timestamp based on timeframe
  private getSinceTimestamp(timeframe: 'day' | 'week' | 'month'): number {
    const now = Date.now() / 1000;
    switch (timeframe) {
      case 'day':
        return now - (24 * 60 * 60);
      case 'week':
        return now - (7 * 24 * 60 * 60);
      case 'month':
        return now - (30 * 24 * 60 * 60);
      default:
        return now - (7 * 24 * 60 * 60);
    }
  }
  
  // Extract user pubkeys from tags
  private extractUserPubkeysFromTags(tags: string[][]): string[] {
    return tags
      .filter(tag => tag[0] === 'p')
      .map(tag => tag[1]);
  }

  // Fetch trending users from the Nostr network
  async fetchTrendingUsers(
    pool: SimplePool,
    relays: string[],
    options: FetchTrendingUsersOptions = {}
  ): Promise<TrendingUser[]> {
    const { 
      limit = 10, 
      timeframe = 'week', 
      excludePubkeys = [] 
    } = options;
    
    const cacheKey = this.getCacheKey(options);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      const cachedData = this.trendingCache.get(cacheKey) || [];
      return cachedData;
    }
    
    // Prepare to collect data
    const userEngagement: Map<string, TrendingUser> = new Map();
    const sinceTimestamp = this.getSinceTimestamp(timeframe);
    
    try {
      // 1. Fetch recent notes to analyze engagement
      console.log(`Fetching notes since ${new Date(sinceTimestamp * 1000).toLocaleString()}`);
      
      // Use the correct API method: pool.sub() instead of pool.list()
      const events: NostrEvent[] = await new Promise((resolve) => {
        const events: NostrEvent[] = [];
        
        const sub = pool.sub(relays, [
          {
            kinds: [EVENT_KINDS.TEXT_NOTE, EVENT_KINDS.REACTION],
            since: sinceTimestamp,
            limit: 500 // Limit to 500 recent events for analysis
          }
        ]);
        
        sub.on('event', (event: NostrEvent) => {
          events.push(event);
        });
        
        // Close subscription after some time to gather enough events
        setTimeout(() => {
          sub.unsub();
          resolve(events);
        }, 3000); // Wait 3 seconds to collect events
      });
      
      console.log(`Analyzing ${events.length} events for trending users`);
      
      // 2. Process events to track mentions and reactions
      events.forEach(event => {
        // Track mentions in posts
        if (event.kind === EVENT_KINDS.TEXT_NOTE) {
          const mentionedPubkeys = this.extractUserPubkeysFromTags(event.tags);
          
          // Increment mention count for each mentioned user
          mentionedPubkeys.forEach(pubkey => {
            if (!userEngagement.has(pubkey)) {
              userEngagement.set(pubkey, { 
                pubkey, 
                score: 0, 
                mentions: 0, 
                reactions: 0, 
                reposts: 0 
              });
            }
            
            const userData = userEngagement.get(pubkey)!;
            userData.mentions += 1;
          });
          
          // Track the post author too (they're creating content)
          const authorPubkey = event.pubkey;
          if (!userEngagement.has(authorPubkey)) {
            userEngagement.set(authorPubkey, { 
              pubkey: authorPubkey, 
              score: 0, 
              mentions: 0, 
              reactions: 0, 
              reposts: 0 
            });
          }
        }
        
        // Track reactions (kind 7)
        if (event.kind === EVENT_KINDS.REACTION) {
          const targetPubkeys = this.extractUserPubkeysFromTags(event.tags);
          
          // Increment reaction count for each target user
          targetPubkeys.forEach(pubkey => {
            if (!userEngagement.has(pubkey)) {
              userEngagement.set(pubkey, { 
                pubkey, 
                score: 0, 
                mentions: 0, 
                reactions: 0, 
                reposts: 0 
              });
            }
            
            const userData = userEngagement.get(pubkey)!;
            userData.reactions += 1;
          });
        }
      });
      
      // 3. Calculate scores and sort users
      const trendingUsers = Array.from(userEngagement.values())
        .map(user => {
          user.score = this.calculateScore(user);
          return user;
        })
        .filter(user => !excludePubkeys.includes(user.pubkey))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // 4. Cache the results
      this.trendingCache.set(cacheKey, trendingUsers);
      this.lastFetchTime.set(cacheKey, Date.now());
      
      console.log(`Found ${trendingUsers.length} trending users`);
      return trendingUsers;
    } catch (error) {
      console.error("Error fetching trending users:", error);
      return [];
    }
  }
  
  // Fetch profile metadata for a trending user
  async fetchUserProfiles(
    pool: SimplePool,
    relays: string[],
    users: TrendingUser[]
  ): Promise<TrendingUser[]> {
    const pubkeysToFetch = users
      .filter(user => !this.profileCache.has(user.pubkey))
      .map(user => user.pubkey);
    
    if (pubkeysToFetch.length === 0) {
      // All profiles already in cache
      return users.map(user => ({
        ...user,
        metadata: this.profileCache.get(user.pubkey)
      }));
    }
    
    // Fetch profiles for users not in cache
    try {
      // Use the correct API method: pool.sub() instead of pool.list()
      const events: NostrEvent[] = await new Promise((resolve) => {
        const events: NostrEvent[] = [];
        
        const sub = pool.sub(relays, [
          {
            kinds: [EVENT_KINDS.META],
            authors: pubkeysToFetch
          }
        ]);
        
        sub.on('event', (event: NostrEvent) => {
          events.push(event);
        });
        
        // Close subscription after some time
        setTimeout(() => {
          sub.unsub();
          resolve(events);
        }, 3000); // Wait 3 seconds to collect profile events
      });
      
      // Process events and update cache
      events.forEach(event => {
        try {
          const metadata = JSON.parse(event.content);
          this.profileCache.set(event.pubkey, metadata);
        } catch (e) {
          console.error(`Error parsing profile for ${event.pubkey}:`, e);
        }
      });
      
      // Return users with metadata
      return users.map(user => ({
        ...user,
        metadata: this.profileCache.get(user.pubkey)
      }));
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      return users;
    }
  }
}
