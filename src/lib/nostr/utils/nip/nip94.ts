
/**
 * NIP-94: File Metadata
 * Defines kind 1063 for handling file metadata
 * https://github.com/nostr-protocol/nips/blob/master/94.md
 */

import { NostrEvent } from "@/lib/nostr/types";
import { isValidMediaUrl } from "../media/media-validation";

// Define NIP-94 specific types
export interface FileMetadata {
  url: string;
  mimeType: string;
  hash?: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  alt?: string;
  blurhash?: string;
  description?: string;
}

/**
 * Extract file metadata from a NIP-94 event (kind 1063)
 */
export const extractFileMetadata = (event: NostrEvent): FileMetadata | null => {
  if (event.kind !== 1063) return null;
  
  try {
    // Parse the event content as JSON
    const metadata = JSON.parse(event.content);
    
    // Required fields for NIP-94
    if (!metadata.url || !metadata.mime) {
      console.warn('Invalid NIP-94 event, missing required fields');
      return null;
    }
    
    // Validate URL
    if (!isValidMediaUrl(metadata.url)) {
      console.warn('Invalid media URL in NIP-94 event:', metadata.url);
      return null;
    }
    
    return {
      url: metadata.url,
      mimeType: metadata.mime,
      hash: metadata.hash,
      size: metadata.size,
      dimensions: metadata.dim ? {
        width: metadata.dim.w,
        height: metadata.dim.h
      } : undefined,
      alt: metadata.alt,
      blurhash: metadata.blurhash,
      description: metadata.description
    };
  } catch (error) {
    console.error('Error parsing NIP-94 file metadata:', error);
    return null;
  }
};

/**
 * Check if an event is a valid NIP-94 file metadata event
 */
export const isNip94FileEvent = (event: NostrEvent): boolean => {
  return event.kind === 1063 && !!extractFileMetadata(event);
};

/**
 * Create a NIP-94 file metadata event
 */
export const createFileMetadataEvent = (metadata: FileMetadata, tags: string[][] = []): Partial<NostrEvent> => {
  const content = JSON.stringify({
    url: metadata.url,
    mime: metadata.mimeType,
    ...(metadata.hash && { hash: metadata.hash }),
    ...(metadata.size && { size: metadata.size }),
    ...(metadata.dimensions && { 
      dim: {
        w: metadata.dimensions.width,
        h: metadata.dimensions.height
      }
    }),
    ...(metadata.alt && { alt: metadata.alt }),
    ...(metadata.blurhash && { blurhash: metadata.blurhash }),
    ...(metadata.description && { description: metadata.description })
  });
  
  return {
    kind: 1063,
    content,
    tags: [...tags]
  };
};

/**
 * Extract media URL from a NIP-94 event
 */
export const getMediaUrlFromNip94 = (event: NostrEvent): string | null => {
  const metadata = extractFileMetadata(event);
  return metadata?.url || null;
};

/**
 * Get alt text from a NIP-94 event
 */
export const getAltTextFromNip94 = (event: NostrEvent): string | null => {
  const metadata = extractFileMetadata(event);
  return metadata?.alt || null;
};

/**
 * Check if a NIP-94 event contains an image
 */
export const isNip94Image = (event: NostrEvent): boolean => {
  const metadata = extractFileMetadata(event);
  return !!metadata && metadata.mimeType.startsWith('image/');
};

/**
 * Check if a NIP-94 event contains a video
 */
export const isNip94Video = (event: NostrEvent): boolean => {
  const metadata = extractFileMetadata(event);
  return !!metadata && metadata.mimeType.startsWith('video/');
};

/**
 * Check if a NIP-94 event contains audio
 */
export const isNip94Audio = (event: NostrEvent): boolean => {
  const metadata = extractFileMetadata(event);
  return !!metadata && metadata.mimeType.startsWith('audio/');
};

