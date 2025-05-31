
/**
 * Helper utility functions for Nostr
 */

import { NostrEvent } from '../types';

/**
 * Formats a pubkey for display by taking the first and last few characters
 */
export const shortenPubkey = (pubkey: string, prefixLength = 4, suffixLength = 4): string => {
  if (!pubkey || pubkey.length <= prefixLength + suffixLength) return pubkey;
  return `${pubkey.substring(0, prefixLength)}...${pubkey.substring(pubkey.length - suffixLength)}`;
};

/**
 * Returns true if an event is newer than another based on created_at timestamp
 */
export const isNewerEvent = (event1: NostrEvent, event2: NostrEvent): boolean => {
  return event1.created_at > event2.created_at;
};

/**
 * Sorts events by created_at timestamp (newest first)
 */
export const sortEventsByDate = (events: NostrEvent[]): NostrEvent[] => {
  return [...events].sort((a, b) => b.created_at - a.created_at);
};

/**
 * Formats a timestamp into a human-readable relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  
  // Format as date for older posts
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

