import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { NostrEvent, NostrFilter, Filter } from '../types';
import { coreNostrService } from '@/lib/nostr/core-service';

/**
 * RTK Query API for Nostr events
 * 
 * Provides a complete replacement for the nostrEventsSlice with better cache management,
 * optimized data fetching, and automatic invalidation
 */
export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Event', 'Thread', 'UserEvents', 'EventList', 'EventAnalytics', 'SearchResults'],
  
  endpoints: (builder) => ({
    // Get a single event by ID
    getEvent: builder.query<NostrEvent, string>({
      queryFn: async (id) => {
        try {
          // Validate input
          if (!id || id.length !== 64) {
            return { error: { status: 'INVALID_ID', error: 'Invalid event ID' } };
          }
          
          console.log('[EventsAPI] Fetching event:', id.slice(0, 8));
          
          const event = await coreNostrService.getEventById(id);
          
          if (!event) {
            return { error: { status: 'NOT_FOUND', error: 'Event not found' } };
          }
          
          return { data: event };
        } catch (error) {
          console.error('Error fetching event:', error);
          return { 
            error: { 
              status: error?.name || 'FETCH_ERROR', 
              error: error?.message || 'Failed to fetch event' 
            } 
          };
        }
      },
      providesTags: (result, error, id) => [
        { type: 'Event', id },
      ],
    }),
    
    // Get multiple events by IDs
    getEvents: builder.query<NostrEvent[], string[]>({
      queryFn: async (ids) => {
        try {
          if (!ids || ids.length === 0) {
            return { data: [] };
          }
          
          // Filter out invalid IDs
          const validIds = ids.filter(id => id?.length === 64);
          
          if (validIds.length === 0) {
            return { data: [] };
          }
          
          console.log(`[EventsAPI] Fetching ${validIds.length} events`);
          
          const events = await coreNostrService.getEvents(validIds);
          return { data: events };
        } catch (error) {
          return { 
            error: { 
              status: error?.name || 'FETCH_ERROR', 
              error: error?.message || 'Failed to fetch events' 
            } 
          };
        }
      },
      providesTags: (result, error, ids) => [
        ...ids.map(id => ({ type: 'Event' as const, id })),
        { type: 'EventList', id: ids.join() },
      ],
    }),
    
    // Query events using filters
    queryEvents: builder.query<NostrEvent[], Filter[]>({
      queryFn: async (filters) => {
        try {
          if (!filters || filters.length === 0) {
            return { data: [] };
          }
          
          console.log('[EventsAPI] Querying events with filters:', filters);
          
          const events = await coreNostrService.queryEvents(filters);
          return { data: events };
        } catch (error) {
          console.error('[EventsAPI] Error querying events:', error);
          return { 
            error: { 
              status: error?.name || 'FETCH_ERROR', 
              error: error?.message || 'Failed to query events' 
            } 
          };
        }
      },
      providesTags: (result) => [
        { type: 'EventList', id: 'QUERY' },
      ],
      // Cache for 30 seconds to reduce redundant requests
      keepUnusedDataFor: 30,
    }),
    
    // Get events for a thread (note + replies)
    getThread: builder.query<{
      root: NostrEvent | null;
      replies: NostrEvent[];
    }, string>({
      queryFn: async (eventId) => {
        try {
          if (!eventId || eventId.length !== 64) {
            return { 
              error: { 
                status: 'INVALID_ID', 
                error: 'Invalid event ID' 
              } 
            };
          }
          
          console.log('[EventsAPI] Fetching thread for event:', eventId.slice(0, 8));
          
          // Fetch the root event
          const rootEvent = await coreNostrService.getEventById(eventId);
          
          if (!rootEvent) {
            return { 
              error: { 
                status: 'NOT_FOUND', 
                error: 'Root event not found' 
              } 
            };
          }
          
          // Fetch replies to this event
          const repliesFilter: Filter = {
            kinds: [1],
            '#e': [eventId],
          };
          
          const replies = await coreNostrService.queryEvents([repliesFilter]);
          
          // Sort replies by creation time
          const sortedReplies = replies.sort((a, b) => a.created_at - b.created_at);
          
          return { 
            data: {
              root: rootEvent,
              replies: sortedReplies,
            }
          };
        } catch (error) {
          console.error('Error fetching thread:', error);
          return { 
            error: { 
              status: error?.name || 'FETCH_ERROR', 
              error: error?.message || 'Failed to fetch thread' 
            } 
          };
        }
      },
      providesTags: (result, error, eventId) => [
        { type: 'Thread', id: eventId },
        { type: 'Event', id: eventId },
      ],
    }),
    
    // Get events by a specific user
    getUserEvents: builder.query<NostrEvent[], {
      pubkey: string;
      limit?: number;
      since?: number;
      until?: number;
      kinds?: number[];
    }>({
      queryFn: async ({ pubkey, limit = 20, since, until, kinds = [1] }) => {
        try {
          if (!pubkey || pubkey.length !== 64) {
            return { 
              error: { 
                status: 'INVALID_PUBKEY', 
                error: 'Invalid pubkey format' 
              } 
            };
          }
          
          console.log(`[EventsAPI] Fetching events for user: ${pubkey.slice(0, 8)}`);
          
          const filter: Filter = {
            authors: [pubkey],
            kinds,
            limit,
            since,
            until,
          };
          
          const events = await coreNostrService.queryEvents([filter]);
          
          // Sort events by creation time (newest first)
          const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
          
          return { data: sortedEvents };
        } catch (error) {
          console.error('Error fetching user events:', error);
          return { 
            error: { 
              status: error?.name || 'FETCH_ERROR', 
              error: error?.message || 'Failed to fetch user events' 
            } 
          };
        }
      },
      providesTags: (result, error, { pubkey }) => [
        { type: 'UserEvents', id: pubkey },
      ],
      // Cache user events for 5 minutes
      keepUnusedDataFor: 300,
    }),
    
    // Publish an event
    publishEvent: builder.mutation<NostrEvent, {
      content: string;
      kind: number;
      tags?: string[][];
      replyTo?: string;
    }>({
      queryFn: async ({ content, kind, tags = [], replyTo }) => {
        try {
          // Create tags array
          let finalTags = [...tags];
          
          // Add reply tag if needed
          if (replyTo) {
            const replyEvent = await coreNostrService.getEventById(replyTo);
            if (replyEvent) {
              // Add e tag for the parent
              finalTags.push(['e', replyTo, '', 'reply']);
              
              // Add p tag for the author of parent
              finalTags.push(['p', replyEvent.pubkey]);
              
              // If parent has a root tag, also include that
              const rootTag = replyEvent.tags.find(t => t[0] === 'e' && t[3] === 'root');
              if (rootTag) {
                finalTags.push(['e', rootTag[1], '', 'root']);
              } 
              // If no root tag and this is a reply, set parent as root
              else {
                finalTags.push(['e', replyTo, '', 'root']);
              }
            }
          }
          
          // Publish event
          const event = await coreNostrService.publishEvent({
            kind,
            content,
            tags: finalTags,
          });
          
          return { data: event };
        } catch (error) {
          console.error('Error publishing event:', error);
          return { 
            error: { 
              status: error?.name || 'PUBLISH_ERROR', 
              error: error?.message || 'Failed to publish event' 
            } 
          };
        }
      },
      // Invalidate relevant cache items when publishing a new event
      invalidatesTags: (result, error, { replyTo }) => [
        // If this is a reply, invalidate the thread
        ...(replyTo ? [{ type: 'Thread', id: replyTo }] : []),
        // Invalidate the user's events
        { type: 'UserEvents', id: 'me' },
        // Invalidate general event lists
        { type: 'EventList', id: 'QUERY' },
      ],
    }),
    
    // Delete an event (actually publishes a deletion event as per NIP-09)
    deleteEvent: builder.mutation<NostrEvent, string>({
      queryFn: async (eventId) => {
        try {
          if (!eventId || eventId.length !== 64) {
            return { 
              error: { 
                status: 'INVALID_ID', 
                error: 'Invalid event ID' 
              } 
            };
          }
          
          // Create a deletion event (kind 5)
          const deletionEvent = await coreNostrService.publishEvent({
            kind: 5,
            content: '',
            tags: [['e', eventId]],
          });
          
          return { data: deletionEvent };
        } catch (error) {
          console.error('Error deleting event:', error);
          return { 
            error: { 
              status: error?.name || 'DELETE_ERROR', 
              error: error?.message || 'Failed to delete event' 
            } 
          };
        }
      },
      // Invalidate the deleted event and any threads containing it
      invalidatesTags: (result, error, eventId) => [
        { type: 'Event', id: eventId },
        { type: 'Thread', id: eventId },
        { type: 'UserEvents', id: 'me' },
      ],
    }),

    // Search events
    searchEvents: builder.query<NostrEvent[], {
      query: string;
      limit?: number;
      since?: number;
      until?: number;
      kinds?: number[];
    }>({
      queryFn: async ({ query, limit = 50, since, until, kinds = [1] }) => {
        try {
          if (!query?.trim()) {
            return { data: [] };
          }
          
          console.log(`[EventsAPI] Searching events for: "${query}"`);
          
          const searchFilters: Filter[] = [
            {
              kinds,
              search: query.trim(),
              limit,
              since,
              until,
            }
          ];
          
          const events = await coreNostrService.queryEvents(searchFilters);
          
          // Sort by relevance and recency
          const sortedEvents = events.sort((a, b) => {
            // Simple relevance scoring based on content match
            const aScore = (a.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
            const bScore = (b.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
            
            if (aScore !== bScore) {
              return bScore - aScore; // Higher score first
            }
            
            return b.created_at - a.created_at; // More recent first
          });
          
          return { data: sortedEvents };
        } catch (error) {
          console.error('[EventsAPI] Search error:', error);
          return { 
            error: { 
              status: error?.name || 'SEARCH_ERROR', 
              error: error?.message || 'Failed to search events' 
            } 
          };
        }
      },
      providesTags: (result, error, { query }) => [
        { type: 'SearchResults', id: query },
      ],
      // Cache search results for 2 minutes
      keepUnusedDataFor: 120,
    }),

    // Get event analytics
    getEventAnalytics: builder.query<{
      totalEvents: number;
      eventsByKind: Record<number, number>;
      topAuthors: Array<{
        pubkey: string;
        eventCount: number;
        totalEngagement: number;
      }>;
      trendingHashtags: Array<{
        tag: string;
        count: number;
        growth: number;
      }>;
      engagementMetrics: {
        averageLikes: number;
        averageReposts: number;
        averageReplies: number;
        totalZaps: number;
      };
    }, {
      timeframe?: 'hour' | 'day' | 'week' | 'month';
      limit?: number;
    }>({
      queryFn: async ({ timeframe = 'day', limit = 100 }) => {
        try {
          console.log(`[EventsAPI] Fetching analytics for ${timeframe}`);
          
          // Calculate time window
          const now = Math.floor(Date.now() / 1000);
          const timeWindows = {
            hour: now - (60 * 60),
            day: now - (24 * 60 * 60),
            week: now - (7 * 24 * 60 * 60),
            month: now - (30 * 24 * 60 * 60),
          };
          
          const since = timeWindows[timeframe];
          
          // Fetch recent events for analytics
          const analyticsFilter: Filter = {
            kinds: [1, 6, 7], // Notes, reposts, reactions
            since,
            limit: limit * 5, // Get more events for better analytics
          };
          
          const events = await coreNostrService.queryEvents([analyticsFilter]);
          
          // Process analytics
          const eventsByKind: Record<number, number> = {};
          const authorCounts: Record<string, number> = {};
          const hashtagCounts: Record<string, number> = {};
          let totalLikes = 0;
          let totalReposts = 0;
          let totalReplies = 0;
          let totalZaps = 0;
          
          events.forEach(event => {
            // Count by kind
            eventsByKind[event.kind] = (eventsByKind[event.kind] || 0) + 1;
            
            // Count by author
            authorCounts[event.pubkey] = (authorCounts[event.pubkey] || 0) + 1;
            
            // Extract hashtags
            const hashtags = (event.content.match(/#\w+/g) || [])
              .map(tag => tag.slice(1).toLowerCase());
            hashtags.forEach(tag => {
              hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
            });
            
            // Mock engagement metrics based on event hash for consistency
            const eventHash = parseInt(event.id.slice(-8), 16);
            totalLikes += eventHash % 50;
            totalReposts += (eventHash >> 4) % 20;
            totalReplies += (eventHash >> 8) % 30;
            totalZaps += (eventHash >> 12) % 10;
          });
          
          // Calculate top authors
          const topAuthors = Object.entries(authorCounts)
            .map(([pubkey, eventCount]) => ({
              pubkey,
              eventCount,
              totalEngagement: eventCount * 10, // Mock engagement
            }))
            .sort((a, b) => b.totalEngagement - a.totalEngagement)
            .slice(0, limit);
          
          // Calculate trending hashtags
          const trendingHashtags = Object.entries(hashtagCounts)
            .map(([tag, count]) => ({
              tag,
              count,
              growth: Math.random() * 100, // Mock growth rate
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
          
          const totalEvents = events.length;
          
          return {
            data: {
              totalEvents,
              eventsByKind,
              topAuthors,
              trendingHashtags,
              engagementMetrics: {
                averageLikes: totalEvents > 0 ? totalLikes / totalEvents : 0,
                averageReposts: totalEvents > 0 ? totalReposts / totalEvents : 0,
                averageReplies: totalEvents > 0 ? totalReplies / totalEvents : 0,
                totalZaps,
              },
            }
          };
        } catch (error) {
          console.error('[EventsAPI] Analytics error:', error);
          return { 
            error: { 
              status: error?.name || 'ANALYTICS_ERROR', 
              error: error?.message || 'Failed to fetch analytics' 
            } 
          };
        }
      },
      providesTags: [{ type: 'EventAnalytics', id: 'CURRENT' }],
      // Cache analytics for 10 minutes
      keepUnusedDataFor: 600,
    }),

    // Get feed events (global, following, mentions)
    getFeedEvents: builder.query<NostrEvent[], {
      feedType: 'global' | 'following' | 'mentions';
      limit?: number;
      since?: number;
      until?: number;
      userPubkey?: string;
    }>({
      queryFn: async ({ feedType, limit = 20, since, until, userPubkey }) => {
        try {
          console.log(`[EventsAPI] Fetching ${feedType} feed`);
          
          let filters: Filter[];
          
          switch (feedType) {
            case 'global':
              filters = [{
                kinds: [1], // Text notes only
                limit,
                since,
                until,
              }];
              break;
              
            case 'mentions':
              if (!userPubkey) {
                return { error: { status: 'MISSING_PUBKEY', error: 'User pubkey required for mentions feed' } };
              }
              filters = [{
                kinds: [1],
                '#p': [userPubkey],
                limit,
                since,
                until,
              }];
              break;
              
            case 'following':
              // TODO: Implement following list from contacts
              filters = [{
                kinds: [1],
                limit,
                since,
                until,
              }];
              break;
              
            default:
              return { error: { status: 'INVALID_FEED', error: 'Invalid feed type' } };
          }
          
          const events = await coreNostrService.queryEvents(filters);
          const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
          
          return { data: sortedEvents };
        } catch (error) {
          console.error(`[EventsAPI] ${feedType} feed error:`, error);
          return { 
            error: { 
              status: error?.name || 'FEED_ERROR', 
              error: error?.message || `Failed to fetch ${feedType} feed` 
            } 
          };
        }
      },
      providesTags: (result, error, { feedType }) => [
        { type: 'EventList', id: feedType.toUpperCase() },
      ],
      // Cache feeds for 1 minute
      keepUnusedDataFor: 60,
    }),
  }),
});

// Export hooks
export const {
  useGetEventQuery,
  useGetEventsQuery,
  useQueryEventsQuery,
  useLazyQueryEventsQuery,
  useGetThreadQuery,
  useGetUserEventsQuery,
  useSearchEventsQuery,
  useLazySearchEventsQuery,
  useGetEventAnalyticsQuery,
  useGetFeedEventsQuery,
  usePublishEventMutation,
  useDeleteEventMutation,
} = eventsApi; 
