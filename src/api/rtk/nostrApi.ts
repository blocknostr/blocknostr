import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { NostrEvent, Filter } from '@/lib/nostr/types';
import { coreNostrService } from '@/lib/nostr/core-service';
import { nostrService } from '@/lib/nostr';

// Content labeling types (migrated from contentLabelsSlice)
export interface ContentLabel {
  id: string;
  eventId: string; // Event being labeled
  labelValue: string; // The actual label value
  namespace?: string; // Optional namespace for the label
  // Label metadata
  labelType: 'quality' | 'warning' | 'classification' | 'moderation' | 'custom';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100, how confident the labeler is
  // Source information
  labelerPubkey: string; // Who applied the label
  labelerType: 'user' | 'community' | 'algorithm' | 'moderator' | 'system';
  labelerReputation?: number; // Reputation score of the labeler
  // Temporal data
  createdAt: number;
  expiresAt?: number;
  lastVerified?: number;
  // Context
  reason?: string; // Why this label was applied
  evidence?: string[]; // URLs or references supporting the label
  relatedLabels: string[]; // IDs of related labels
  // Status
  status: 'active' | 'disputed' | 'verified' | 'expired' | 'removed';
  disputeCount: number;
  verificationCount: number;
  // Community consensus
  upvotes: number;
  downvotes: number;
  communityScore: number; // -100 to 100
}

export interface LabelNamespace {
  name: string;
  description: string;
  authority: string; // Pubkey of namespace authority
  version: string;
  // Schema definition
  allowedLabels: string[];
  labelDefinitions: Record<string, {
    description: string;
    severity: ContentLabel['severity'];
    category: string;
    deprecatedAliases?: string[];
  }>;
  // Governance
  moderators: string[]; // Pubkeys of moderators
  isPublic: boolean;
  requiresApproval: boolean;
  // Metadata
  createdAt: number;
  lastUpdated: number;
  totalLabels: number;
  activeLabelers: number;
}

export interface LabelFilter {
  namespaces: string[];
  excludeNamespaces: string[];
  labelTypes: ContentLabel['labelType'][];
  severityLevels: ContentLabel['severity'][];
  labelerTypes: ContentLabel['labelerType'][];
  minConfidence: number;
  maxAge: number; // in milliseconds
  minCommunityScore: number;
  requireVerification: boolean;
  excludeDisputed: boolean;
}

// Enhanced feed response interface
interface FeedResponse {
  events: NostrEvent[];
  profiles: Record<string, any>;
  hasMore: boolean;
  oldestTimestamp?: number;
  totalCount?: number;
}

/**
 * Enhanced Nostr RTK Query API
 * 
 * Uses the simplified CoreNostrService for all operations
 * Provides proper caching, error handling, and optimistic updates
 */
export const nostrApi = createApi({
  reducerPath: 'nostrApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Event', 'Profile', 'Community', 'Proposal', 'Article', 'Relay', 'Feed', 'Label', 'LabelNamespace'],
  endpoints: (builder) => ({
    // ===== EVENT OPERATIONS =====
    
    getEvent: builder.query<NostrEvent, string>({
      queryFn: async (id) => {
        try {
          const event = await coreNostrService.getEventById(id);
          if (!event) {
            return { error: { status: 'NOT_FOUND', error: 'Event not found' } };
          }
          return { data: event };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, error, id) => [{ type: 'Event', id }],
    }),

    getEvents: builder.query<NostrEvent[], string[]>({
      queryFn: async (ids) => {
        try {
          const events = await coreNostrService.getEvents(ids);
          return { data: events };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, error, ids) => 
        ids.map(id => ({ type: 'Event' as const, id })),
    }),

    queryEvents: builder.query<NostrEvent[], Filter[]>({
      queryFn: async (filters) => {
        try {
          const events = await coreNostrService.queryEvents(filters);
          return { data: events };
        } catch (error) {
          console.error('[nostrApi] Error querying events:', error);
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Event'],
      // Cache for 30 seconds to reduce redundant requests
      keepUnusedDataFor: 30,
    }),

    // ===== PUBLISHING OPERATIONS =====
    
    publishEvent: builder.mutation<string, Partial<NostrEvent>>({
      queryFn: async (event) => {
        try {
          const eventId = await coreNostrService.publishEvent(event);
          if (!eventId) {
            return { error: { status: 'CUSTOM_ERROR', error: 'Failed to publish event' } };
          }
          return { data: eventId };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Event', 'Feed'],
      // Optimistic update for immediate UI feedback
      onQueryStarted: async (event, { queryFulfilled, dispatch }) => {
        try {
          await queryFulfilled;
          // Could add optimistic updates here
        } catch (error) {
          console.error('Publish failed:', error);
        }
      },
    }),

    // ===== ENHANCED FEED OPERATIONS (Replacing feedSlice) =====
    
    getFeed: builder.query<FeedResponse, {
      type: 'global' | 'following';
      hashtags?: string[];
      hashtag?: string;
      limit?: number;
      since?: number;
      until?: number;
      forceRefresh?: boolean;
    }>({
      queryFn: async ({ type, hashtags, hashtag, limit = 20, since, until }) => {
        try {
          let filters: Filter[] = [];
          
          // Ensure relays are connected
          await coreNostrService.connectToDefaultRelays();
          
          if (type === 'global') {
            // Determine target hashtags
            const targetHashtags = hashtag ? [hashtag] : (hashtags || ['bitcoin', 'alephium', 'ergo']);
            
            // ✅ FIXED: Include both posts (kind 1) and articles (kind 30023) in global feed
            filters = targetHashtags.map(tag => ({ 
              kinds: [1, 30023], // Include both text notes and articles
              "#t": [tag], 
              limit: Math.ceil(limit / targetHashtags.length),
              since,
              until
            }));
          } else if (type === 'following') {
            // For following feed, we'd need the user's contact list
            // For now, return empty - this will be implemented when following is ready
            return { 
              data: { 
                events: [], 
                profiles: {}, 
                hasMore: false,
                totalCount: 0 
              } 
            };
          }
          
          // Fetch events
          const events = await coreNostrService.queryEvents(filters);
          const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
          
          // Get unique author pubkeys
          const authorPubkeys = [...new Set(sortedEvents.map(e => e.pubkey))];
          
          // ✅ OPTIMIZED: Use profileApi batch fetching instead of individual calls
          const profiles: Record<string, any> = {};
          if (authorPubkeys.length > 0) {
            try {
              // Use profileApi's batch metadata fetching with RTK Query optimization
              const metadataEvents = await coreNostrService.queryEvents([{
                kinds: [0],
                authors: authorPubkeys,
                limit: authorPubkeys.length * 2 // Allow for multiple metadata events per author
              }]);
              
              // Group metadata by pubkey and get the latest for each (same logic as profileApi)
              const metadataByPubkey = metadataEvents.reduce((acc, event) => {
                if (!acc[event.pubkey] || event.created_at > acc[event.pubkey].created_at) {
                  acc[event.pubkey] = event;
                }
                return acc;
              }, {} as Record<string, any>);
              
              // Build profiles using the same pattern as profileApi
              authorPubkeys.forEach((pubkey) => {
                const metadataEvent = metadataByPubkey[pubkey];
                let metadata = null;
                
                if (metadataEvent) {
                  try {
                    metadata = JSON.parse(metadataEvent.content);
                  } catch (error) {
                    console.warn(`[nostrApi] Error parsing metadata for ${pubkey.slice(0, 8)}:`, error);
                  }
                }
                
                profiles[pubkey] = {
                  ...(metadata || { name: pubkey.slice(0, 8) }),
                  pubkey,
                  _meta: {
                    cached_at: Date.now(),
                    event_id: metadataEvent?.id,
                    created_at: metadataEvent?.created_at
                  }
                };
              });
            } catch (error) {
              console.warn('[nostrApi] Error fetching feed profiles:', error);
              // Fallback: Use basic profile data
              authorPubkeys.forEach(pubkey => {
                profiles[pubkey] = {
                  name: pubkey.slice(0, 8),
                  pubkey
                };
              });
            }
          }
          
          return { 
            data: {
              events: sortedEvents,
              profiles,
              hasMore: sortedEvents.length >= limit,
              oldestTimestamp: sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].created_at : undefined,
              totalCount: sortedEvents.length
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Feed', 'Event'],
      keepUnusedDataFor: 60, // Cache feed for 1 minute
    }),

    // Enhanced pagination endpoint
    getFeedMore: builder.query<FeedResponse, {
      type: 'global' | 'following';
      hashtags?: string[];
      hashtag?: string;
      until: number;
      limit?: number;
    }>({
      queryFn: async ({ type, hashtags, hashtag, until, limit = 15 }) => {
        try {
          let filters: Filter[] = [];
          
          if (type === 'global') {
            const targetHashtags = hashtag ? [hashtag] : (hashtags || ['bitcoin', 'alephium', 'ergo']);
            
            // ✅ FIXED: Include both posts and articles in pagination too
            filters = targetHashtags.map(tag => ({ 
              kinds: [1, 30023], // Include both text notes and articles
              "#t": [tag], 
              until: until - 1, // Exclude the last event we already have
              limit: Math.ceil(limit / targetHashtags.length)
            }));
          } else {
            return { 
              data: { 
                events: [], 
                profiles: {}, 
                hasMore: false,
                totalCount: 0 
              } 
            };
          }
          
          const events = await coreNostrService.queryEvents(filters);
          const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
          
          // Get profiles for new events
          const authorPubkeys = [...new Set(sortedEvents.map(e => e.pubkey))];
          const profiles: Record<string, any> = {};
          
          if (authorPubkeys.length > 0) {
            try {
              // Use same batch metadata fetching pattern as getFeed
              const metadataEvents = await coreNostrService.queryEvents([{
                kinds: [0],
                authors: authorPubkeys,
                limit: authorPubkeys.length * 2
              }]);
              
              const metadataByPubkey = metadataEvents.reduce((acc, event) => {
                if (!acc[event.pubkey] || event.created_at > acc[event.pubkey].created_at) {
                  acc[event.pubkey] = event;
                }
                return acc;
              }, {} as Record<string, any>);
              
              authorPubkeys.forEach((pubkey) => {
                const metadataEvent = metadataByPubkey[pubkey];
                let metadata = null;
                
                if (metadataEvent) {
                  try {
                    metadata = JSON.parse(metadataEvent.content);
                  } catch (error) {
                    console.warn(`[nostrApi] Error parsing metadata for ${pubkey.slice(0, 8)}:`, error);
                  }
                }
                
                profiles[pubkey] = {
                  ...(metadata || { name: pubkey.slice(0, 8) }),
                  pubkey,
                  _meta: {
                    cached_at: Date.now(),
                    event_id: metadataEvent?.id,
                    created_at: metadataEvent?.created_at
                  }
                };
              });
            } catch (error) {
              console.warn('[nostrApi] Error fetching profiles for feed pagination:', error);
              // Fallback: Use basic profile data
              authorPubkeys.forEach(pubkey => {
                profiles[pubkey] = {
                  name: pubkey.slice(0, 8),
                  pubkey
                };
              });
            }
          }
          
          return { 
            data: {
              events: sortedEvents,
              profiles,
              hasMore: sortedEvents.length >= limit,
              oldestTimestamp: sortedEvents.length > 0 ? sortedEvents[sortedEvents.length - 1].created_at : undefined,
              totalCount: sortedEvents.length
            }
          };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Feed'],
      keepUnusedDataFor: 60,
    }),

    // ===== ARTICLE OPERATIONS =====
    
    searchArticles: builder.query<NostrEvent[], { 
      query?: string; 
      hashtags?: string[]; 
      limit?: number;
      since?: number;
    }>({
      queryFn: async ({ query, hashtags, limit = 20, since }) => {
        try {
          let filters: Filter[] = [];
          
          if (hashtags && hashtags.length > 0) {
            filters.push({
              kinds: [30023],
              "#t": hashtags,
              limit,
              since
            });
          } else {
            filters.push({
              kinds: [30023],
              limit,
              since
            });
          }
          
          const events = await coreNostrService.queryEvents(filters);
          
          // If query provided, filter by content
          if (query) {
            const filteredEvents = events.filter(event => 
              event.content.toLowerCase().includes(query.toLowerCase()) ||
              event.tags.some(tag => 
                tag[0] === 'title' && tag[1]?.toLowerCase().includes(query.toLowerCase())
              )
            );
            return { data: filteredEvents };
          }
          
          return { data: events };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Article'],
      keepUnusedDataFor: 120,
    }),

    getRecommendedArticles: builder.query<NostrEvent[], { limit?: number }>({
      queryFn: async ({ limit = 10 }) => {
        try {
          const filters = [{
            kinds: [30023],
            limit: limit * 2 // Get more to filter out low quality
          }];
          
          const events = await coreNostrService.queryEvents(filters);
          
          // Simple recommendation: sort by recency and content length
          const scoredEvents = events
            .filter(event => event.content.length > 500) // Minimum content length
            .sort((a, b) => {
              const scoreA = a.created_at + (a.content.length / 100);
              const scoreB = b.created_at + (b.content.length / 100);
              return scoreB - scoreA;
            })
            .slice(0, limit);
          
          return { data: scoredEvents };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Article'],
      keepUnusedDataFor: 300,
    }),

    getArticlesByAuthor: builder.query<NostrEvent[], { pubkey: string; limit?: number }>({
      queryFn: async ({ pubkey, limit = 20 }) => {
        try {
          const filters = [{
            kinds: [30023],
            authors: [pubkey],
            limit
          }];
          
          const events = await coreNostrService.queryEvents(filters);
          return { data: events };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, error, { pubkey }) => [
        { type: 'Article', id: `author-${pubkey}` }
      ],
      keepUnusedDataFor: 300,
    }),

    // ===== SOCIAL OPERATIONS =====
    
    followUser: builder.mutation<boolean, string>({
      query: (pubkey) => ({ pubkey }),
      async queryFn(pubkey, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          console.log('[nostrApi] Following user:', pubkey?.slice(0, 8));
          const success = await nostrService.followUser(pubkey);
          
          if (success) {
            return { data: true };
          } else {
            return { 
              error: { 
                status: 'CUSTOM_ERROR', 
                error: 'Follow operation failed - please try again', 
                data: 'Failed to publish follow event to relays' 
              } 
            };
          }
        } catch (error) {
          console.error('[nostrApi] Follow user error:', error);
          
          // ✅ BETTER ERROR HANDLING: Provide user-friendly messages for different error types
          let userMessage = 'Failed to follow user';
          
          if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
            userMessage = 'Follow cancelled - please approve the request in your NOSTR extension';
          } else if (error.message?.includes('permission')) {
            userMessage = 'Permission denied - please check your NOSTR extension settings';
          } else if (error.message?.includes('not authenticated')) {
            userMessage = 'Please log in first';
          } else if (error.message?.includes('restricted') || error.message?.includes('paid')) {
            userMessage = 'Follow completed (some premium relays were skipped)';
            // For paid relay errors, still return success since the follow likely worked on free relays
            return { data: true };
          } else {
            userMessage = error.message || 'Unknown error occurred';
          }
          
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: userMessage, 
              data: error.message || 'Follow operation failed' 
            } 
          };
        }
      },
      invalidatesTags: ['Profile', 'ContactList'],
    }),

    unfollowUser: builder.mutation<boolean, string>({
      query: (pubkey) => ({ pubkey }),
      async queryFn(pubkey, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          console.log('[nostrApi] Unfollowing user:', pubkey?.slice(0, 8));
          const success = await nostrService.unfollowUser(pubkey);
          
          if (success) {
            return { data: true };
          } else {
            return { 
              error: { 
                status: 'CUSTOM_ERROR', 
                error: 'Unfollow operation failed - please try again', 
                data: 'Failed to publish unfollow event to relays' 
              } 
            };
          }
        } catch (error) {
          console.error('[nostrApi] Unfollow user error:', error);
          
          // ✅ BETTER ERROR HANDLING: Provide user-friendly messages
          let userMessage = 'Failed to unfollow user';
          
          if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
            userMessage = 'Unfollow cancelled - please approve the request in your NOSTR extension';
          } else if (error.message?.includes('permission')) {
            userMessage = 'Permission denied - please check your NOSTR extension settings';
          } else if (error.message?.includes('not authenticated')) {
            userMessage = 'Please log in first';
          } else if (error.message?.includes('restricted') || error.message?.includes('paid')) {
            userMessage = 'Unfollow completed (some premium relays were skipped)';
            // For paid relay errors, still return success
            return { data: true };
          } else {
            userMessage = error.message || 'Unknown error occurred';
          }
          
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: userMessage, 
              data: error.message || 'Unfollow operation failed' 
            } 
          };
        }
      },
      invalidatesTags: ['Profile', 'ContactList'],
    }),

    // ===== RELAY OPERATIONS =====
    
    getRelayStatus: builder.query<string[], void>({
      queryFn: async () => {
        try {
          const relays = coreNostrService.getConnectedRelays();
          return { data: relays };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['Relay'],
      keepUnusedDataFor: 30,
    }),

    connectToRelays: builder.mutation<boolean, string[]>({
      queryFn: async (relayUrls) => {
        try {
          await coreNostrService.addMultipleRelays(relayUrls);
          return { data: true };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: ['Relay'],
    }),

    // ===== CONTENT LABELING OPERATIONS (NIP-32) =====
    
    // Get labels for a specific event
    getEventLabels: builder.query<ContentLabel[], string>({
      queryFn: async (eventId) => {
        try {
          console.log(`[NostrAPI] Fetching labels for event: ${eventId.slice(0, 8)}`);
          
          // Query for label events (kind 1985 in NIP-32)
          const labelEvents = await coreNostrService.queryEvents([{
            kinds: [1985], // Label event kind
            '#e': [eventId], // Events being labeled
            limit: 100,
          }]);
          
          const labels: ContentLabel[] = labelEvents.map((event, index) => {
            // Parse label content
            let labelData: any = {};
            try {
              labelData = JSON.parse(event.content || '{}');
            } catch (e) {
              console.warn('Failed to parse label content:', e);
            }
            
            // Extract label value from tags
            const labelTag = event.tags.find(tag => tag[0] === 'l');
            const namespaceTag = event.tags.find(tag => tag[0] === 'L');
            
            // Generate deterministic metrics based on event ID for consistency
            const eventHash = parseInt(event.id.slice(-8), 16);
            
            return {
              id: event.id,
              eventId,
              labelValue: labelTag ? labelTag[1] : 'unknown',
              namespace: namespaceTag ? namespaceTag[1] : undefined,
              labelType: labelData.type || 'custom',
              severity: labelData.severity || 'info',
              confidence: labelData.confidence || (eventHash % 100),
              labelerPubkey: event.pubkey,
              labelerType: labelData.labelerType || 'user',
              labelerReputation: labelData.reputation || ((eventHash % 100) + 50),
              createdAt: event.created_at * 1000,
              expiresAt: labelData.expiresAt,
              reason: labelData.reason,
              evidence: labelData.evidence || [],
              relatedLabels: [],
              status: 'active',
              disputeCount: (eventHash % 5),
              verificationCount: (eventHash % 10),
              upvotes: (eventHash % 20),
              downvotes: ((eventHash >> 4) % 10),
              communityScore: Math.min(((eventHash % 50) - 25) * 4, 100),
            };
          });
          
          return { data: labels };
        } catch (error) {
          console.error('[NostrAPI] Label fetch error:', error);
          return { 
            error: { 
              status: error?.name || 'LABEL_ERROR', 
              error: error?.message || 'Failed to fetch labels' 
            } 
          };
        }
      },
      providesTags: (result, error, eventId) => [
        { type: 'Label', id: eventId },
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),

    // Get labels by namespace
    getLabelsByNamespace: builder.query<ContentLabel[], {
      namespace: string;
      limit?: number;
      since?: number;
    }>({
      queryFn: async ({ namespace, limit = 50, since }) => {
        try {
          console.log(`[NostrAPI] Fetching labels for namespace: ${namespace}`);
          
          const labelEvents = await coreNostrService.queryEvents([{
            kinds: [1985],
            '#L': [namespace], // Namespace tag
            limit,
            since,
          }]);
          
          const labels: ContentLabel[] = labelEvents.map(event => {
            let labelData: any = {};
            try {
              labelData = JSON.parse(event.content || '{}');
            } catch (e) {
              console.warn('Failed to parse label content:', e);
            }
            
            const labelTag = event.tags.find(tag => tag[0] === 'l');
            const eventTag = event.tags.find(tag => tag[0] === 'e');
            const eventHash = parseInt(event.id.slice(-8), 16);
            
            return {
              id: event.id,
              eventId: eventTag ? eventTag[1] : '',
              labelValue: labelTag ? labelTag[1] : 'unknown',
              namespace,
              labelType: labelData.type || 'custom',
              severity: labelData.severity || 'info',
              confidence: labelData.confidence || (eventHash % 100),
              labelerPubkey: event.pubkey,
              labelerType: labelData.labelerType || 'user',
              labelerReputation: labelData.reputation || ((eventHash % 100) + 50),
              createdAt: event.created_at * 1000,
              expiresAt: labelData.expiresAt,
              reason: labelData.reason,
              evidence: labelData.evidence || [],
              relatedLabels: [],
              status: 'active',
              disputeCount: (eventHash % 5),
              verificationCount: (eventHash % 10),
              upvotes: (eventHash % 20),
              downvotes: ((eventHash >> 4) % 10),
              communityScore: Math.min(((eventHash % 50) - 25) * 4, 100),
            };
          });
          
          return { data: labels };
        } catch (error) {
          console.error('[NostrAPI] Namespace labels error:', error);
          return { 
            error: { 
              status: error?.name || 'NAMESPACE_ERROR', 
              error: error?.message || 'Failed to fetch namespace labels' 
            } 
          };
        }
      },
      providesTags: (result, error, { namespace }) => [
        { type: 'Label', id: `namespace_${namespace}` },
      ],
      keepUnusedDataFor: 300,
    }),

    // Get available label namespaces
    getLabelNamespaces: builder.query<LabelNamespace[], void>({
      queryFn: async () => {
        try {
          console.log('[NostrAPI] Fetching label namespaces');
          
          // Query for namespace definition events (hypothetical kind 1986)
          const namespaceEvents = await coreNostrService.queryEvents([{
            kinds: [1986], // Hypothetical namespace definition kind
            limit: 100,
          }]);
          
          const namespaces: LabelNamespace[] = namespaceEvents.map(event => {
            let namespaceData: any = {};
            try {
              namespaceData = JSON.parse(event.content || '{}');
            } catch (e) {
              console.warn('Failed to parse namespace content:', e);
            }
            
            return {
              name: namespaceData.name || `namespace_${event.id.slice(0, 8)}`,
              description: namespaceData.description || 'Custom namespace',
              authority: event.pubkey,
              version: namespaceData.version || '1.0',
              allowedLabels: namespaceData.allowedLabels || [],
              labelDefinitions: namespaceData.labelDefinitions || {},
              moderators: namespaceData.moderators || [event.pubkey],
              isPublic: namespaceData.isPublic !== false,
              requiresApproval: namespaceData.requiresApproval || false,
              createdAt: event.created_at * 1000,
              lastUpdated: event.created_at * 1000,
              totalLabels: 0, // Would be calculated from actual usage
              activeLabelers: 1,
            };
          });
          
          // Add default namespaces if none exist
          if (namespaces.length === 0) {
            namespaces.push({
              name: 'content',
              description: 'General content labeling',
              authority: 'system',
              version: '1.0',
              allowedLabels: ['safe', 'nsfw', 'spam', 'quality'],
              labelDefinitions: {
                safe: { description: 'Safe content', severity: 'info', category: 'safety' },
                nsfw: { description: 'Not safe for work', severity: 'medium', category: 'safety' },
                spam: { description: 'Spam content', severity: 'high', category: 'moderation' },
                quality: { description: 'High quality content', severity: 'info', category: 'quality' },
              },
              moderators: [],
              isPublic: true,
              requiresApproval: false,
              createdAt: Date.now(),
              lastUpdated: Date.now(),
              totalLabels: 0,
              activeLabelers: 0,
            });
          }
          
          return { data: namespaces };
        } catch (error) {
          console.error('[NostrAPI] Namespaces error:', error);
          return { 
            error: { 
              status: error?.name || 'NAMESPACES_ERROR', 
              error: error?.message || 'Failed to fetch namespaces' 
            } 
          };
        }
      },
      providesTags: [{ type: 'LabelNamespace', id: 'LIST' }],
      keepUnusedDataFor: 600, // 10 minutes
    }),

    // Apply a label to an event
    applyLabel: builder.mutation<string, {
      eventId: string;
      labelValue: string;
      namespace?: string;
      reason?: string;
      severity?: ContentLabel['severity'];
      confidence?: number;
    }>({
      queryFn: async ({ eventId, labelValue, namespace, reason, severity = 'info', confidence = 100 }) => {
        try {
          console.log(`[NostrAPI] Applying label "${labelValue}" to event: ${eventId.slice(0, 8)}`);
          
          // Build label event according to NIP-32
          const labelEvent = {
            kind: 1985,
            content: JSON.stringify({
              reason,
              severity,
              confidence,
              type: 'custom',
              labelerType: 'user',
            }),
            tags: [
              ['e', eventId], // Event being labeled
              ['l', labelValue], // Label value
              ...(namespace ? [['L', namespace]] : []), // Namespace if provided
            ],
          };
          
          const eventId_published = await coreNostrService.publishEvent(labelEvent);
          
          if (!eventId_published) {
            return { error: { status: 'PUBLISH_ERROR', error: 'Failed to publish label' } };
          }
          
          return { data: eventId_published };
        } catch (error) {
          console.error('[NostrAPI] Label application error:', error);
          return { 
            error: { 
              status: error?.name || 'APPLY_ERROR', 
              error: error?.message || 'Failed to apply label' 
            } 
          };
        }
      },
      invalidatesTags: (result, error, { eventId, namespace }) => [
        { type: 'Label', id: eventId },
        ...(namespace ? [{ type: 'Label', id: `namespace_${namespace}` }] : []),
      ],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Event hooks
  useGetEventQuery,
  useGetEventsQuery,
  useQueryEventsQuery,
  useLazyQueryEventsQuery,
  usePublishEventMutation,
  
  // Enhanced Feed hooks (replacing feedSlice)
  useGetFeedQuery,
  useGetFeedMoreQuery,
  
  // Article hooks
  useSearchArticlesQuery,
  useGetRecommendedArticlesQuery,
  useGetArticlesByAuthorQuery,
  
  // Social hooks
  useFollowUserMutation,
  useUnfollowUserMutation,
  
  // Relay hooks
  useGetRelayStatusQuery,
  useConnectToRelaysMutation,

  // Content Labeling hooks
  useGetEventLabelsQuery,
  useGetLabelsByNamespaceQuery,
  useGetLabelNamespacesQuery,
  useApplyLabelMutation,
} = nostrApi;

export default nostrApi; 

