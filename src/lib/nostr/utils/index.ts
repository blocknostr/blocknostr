
// src/lib/nostr/utils/index.ts

// Export all NIP-related utilities
export * from './nip';

// Re-export media detection utilities
export {
  extractUrlsFromContent,
  extractAllUrls,
  isMediaUrl
} from './media/media-detection';

// Re-export media validation
export {
  isValidMediaUrl,
  isVideoUrl,
  isImageUrl,
  isAudioUrl,
  isSecureUrl
} from './media/media-validation';

// Re-export media extraction utilities
export {
  extractMediaItems,
  extractMediaFromTags,
  extractFirstImageUrl,
  extractMediaUrls,
  extractLinkPreviewUrls,
  getMediaUrlsFromEvent,
  getLinkPreviewUrlsFromEvent,
  getMediaItemsFromEvent,
  getFirstImageUrlFromEvent
} from './media/media-extractors';
