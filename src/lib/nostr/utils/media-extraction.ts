
/**
 * Utility functions for extracting media URLs from Nostr events
 * Following NIP-94 recommendations for media content
 * 
 * This file re-exports all media extraction utilities from the media/ folder
 */

// Re-export all types
export * from './media/media-types';

// Re-export media detection functions but NOT the conflicting functions
export {
  mediaRegex,
  isMediaUrl
} from './media/media-detection';

// Re-export validation functions
export * from './media/media-validation';

// Re-export extraction functions
export * from './media/media-extractors';

// Export the URL registry
export { default as UrlRegistry } from './media/url-registry';
