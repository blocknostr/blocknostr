import { useMemo, useCallback } from 'react';
import {
  useGetEventQuery,
  useGetEventsQuery,
  useQueryEventsQuery,
  useGetThreadQuery,
  useGetUserEventsQuery,
  usePublishEventMutation,
  useDeleteEventMutation,
  useSearchEventsQuery,
  useGetEventAnalyticsQuery,
  useGetFeedEventsQuery
} from '../../api/rtk/eventsApi';
import { NostrEvent, Filter } from '../../api/types/nostr.d';
import { useAppSelector } from '@/hooks/redux';
import { toast } from '@/lib/toast';

/**
 * Hook for fetching a single Nostr event
 */
export function useEventRTK(eventId?: string) {
  const { 
    data: event,
    isLoading,
    error,
    refetch,
  } = useGetEventQuery(eventId || '', { 
    skip: !eventId || eventId.length !== 64,
  });
  
  return useMemo(() => ({
    event,
    isLoading,
    error: error ? (error as any)?.error || 'Failed to fetch event' : null,
    refetch,
  }), [event, isLoading, error, refetch]);
}

/**
 * Hook for fetching multiple Nostr events by IDs
 */
export function useEventsRTK(eventIds: string[] = []) {
  // Filter out invalid IDs
  const validEventIds = useMemo(() => 
    (eventIds || []).filter(id => id?.length === 64),
    [eventIds]
  );
  
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useGetEventsQuery(validEventIds, {
    skip: validEventIds.length === 0,
  });
  
  return useMemo(() => ({
    events: events || [],
    isLoading,
    error: error ? (error as any)?.error || 'Failed to fetch events' : null,
    refetch,
  }), [events, isLoading, error, refetch]);
}

/**
 * Hook for querying Nostr events using filters
 */
export function useQueryEventsRTK(filters: Filter[] = [], options: { skip?: boolean } = {}) {
  const { skip = false } = options;
  
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useQueryEventsQuery(filters, {
    skip: skip || filters.length === 0,
  });
  
  return useMemo(() => ({
    events: events || [],
    isLoading,
    error: error ? (error as any)?.error || 'Failed to query events' : null,
    refetch,
  }), [events, isLoading, error, refetch]);
}

/**
 * Hook for fetching a thread (note + replies)
 */
export function useThreadRTK(threadId?: string) {
  const {
    data: thread,
    isLoading,
    error,
    refetch,
  } = useGetThreadQuery(threadId || '', {
    skip: !threadId || threadId.length !== 64,
  });
  
  return useMemo(() => ({
    rootEvent: thread?.root || null,
    replies: thread?.replies || [],
    isLoading,
    error: error ? (error as any)?.error || 'Failed to fetch thread' : null,
    refetch,
  }), [thread, isLoading, error, refetch]);
}

/**
 * Hook for fetching events by a specific user
 */
export function useUserEventsRTK(params: {
  pubkey?: string;
  limit?: number;
  kinds?: number[];
  since?: number;
  until?: number;
} = {}) {
  const { pubkey, limit = 20, kinds = [1], since, until } = params;
  
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useGetUserEventsQuery({
    pubkey: pubkey || '',
    limit,
    kinds,
    since,
    until,
  }, {
    skip: !pubkey || pubkey.length !== 64,
  });
  
  return useMemo(() => ({
    events: events || [],
    isLoading,
    error: error ? (error as any)?.error || 'Failed to fetch user events' : null,
    refetch,
  }), [events, isLoading, error, refetch]);
}

/**
 * Hook for Nostr event actions (publish, delete)
 */
export function useEventActions() {
  const [publishEventMutation, { isLoading: isPublishing }] = usePublishEventMutation();
  const [deleteEventMutation, { isLoading: isDeleting }] = useDeleteEventMutation();
  
  const publishEvent = useCallback(async (params: {
    content: string;
    kind: number;
    tags?: string[][];
    replyTo?: string;
  }) => {
    try {
      const result = await publishEventMutation(params).unwrap();
      toast.success('Event published successfully');
      return result;
    } catch (error) {
      console.error('Failed to publish event:', error);
      toast.error('Failed to publish event');
      return null;
    }
  }, [publishEventMutation]);
  
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      const result = await deleteEventMutation(eventId).unwrap();
      toast.success('Event deleted successfully');
      return result;
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
      return null;
    }
  }, [deleteEventMutation]);
  
  return useMemo(() => ({
    publishEvent,
    deleteEvent,
    isPublishing,
    isDeleting,
  }), [publishEvent, deleteEvent, isPublishing, isDeleting]);
}

/**
 * Migration-aware hook for events
 * 
 * Provides a consistent API whether using Redux or direct Nostr API
 */
export function useEvent(eventId?: string) {
  // Check if Redux for Nostr is enabled
  const useReduxForNostr = useAppSelector(
    state => state.app.featureFlags.useReduxForNostr
  );
  
  // Get from Redux event slice if available
  const reduxEvent = useAppSelector(
    state => eventId ? state.nostrEvents.entities[eventId] : undefined
  );
  
  // Use RTK Query hook if Redux is enabled but not found in store
  const rtkEvent = useEventRTK(eventId);
  
  // Determine which event data to use
  const isUsingRedux = useReduxForNostr;
  const effectiveEvent = isUsingRedux ? (reduxEvent || rtkEvent.event) : null;
  
  return {
    event: effectiveEvent,
    loading: isUsingRedux && !reduxEvent && rtkEvent.isLoading,
    error: isUsingRedux ? rtkEvent.error : null,
    refetch: isUsingRedux ? rtkEvent.refetch : () => Promise.resolve(),
    isReduxEnabled: useReduxForNostr,
  };
} 
