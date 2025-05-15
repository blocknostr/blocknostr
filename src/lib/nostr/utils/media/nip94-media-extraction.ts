import { NostrEvent } from '@/lib/nostr';
import { MediaItem, Nip94TagType, MediaMetadata } from './media-types';
import { isValidMediaUrl } from './media-validation';
import { getBaseUrl } from './media-detection';

/**
 * Extract media from an event following NIP-94 standards
 * https://github.com/nostr-protocol/nips/blob/master/94.md
 */
export function extractNip94Media(event: NostrEvent): MediaItem[] {
  if (!event || !event.tags) return [];

  const mediaItems: MediaItem[] = [];
  const processedUrls = new Set<string>();
  
  // Process NIP-94 media tags
  for (const tag of event.tags) {
    if (!Array.isArray(tag) || tag.length < 2) continue;
    
    const tagType = tag[0] as Nip94TagType;
    const url = tag[1];
    
    // Skip invalid URLs or already processed ones
    if (!isValidMediaUrl(url) || processedUrls.has(url)) continue;
    
    // Handle different NIP-94 tag types
    switch (tagType) {
      case 'image':
      case 'img': {
        const alt = tag.length > 2 ? tag[2] : undefined;
        const metadata = extractMediaMetadata(tag);
        
        mediaItems.push({
          url,
          type: 'image',
          alt,
          ...metadata
        });
        processedUrls.add(url);
        break;
      }
      
      case 'video': {
        const alt = tag.length > 2 ? tag[2] : undefined;
        const metadata = extractMediaMetadata(tag);
        
        mediaItems.push({
          url,
          type: 'video',
          alt,
          ...metadata
        });
        processedUrls.add(url);
        break;
      }
      
      case 'audio': {
        const alt = tag.length > 2 ? tag[2] : undefined;
        const metadata = extractMediaMetadata(tag);
        
        mediaItems.push({
          url,
          type: 'audio',
          alt,
          ...metadata
        });
        processedUrls.add(url);
        break;
      }
      
      case 'imeta': {
        // imeta tag: ["imeta", url, alt?, dimensions?, blurhash?]
        const metadata = extractMediaMetadata(tag);
        const matchingImage = mediaItems.find(item => 
          item.type === 'image' && getBaseUrl(item.url) === getBaseUrl(url)
        );
        
        // If we already have this image, enhance it with metadata
        if (matchingImage) {
          Object.assign(matchingImage, metadata);
        } else {
          // Otherwise add as a new image
          mediaItems.push({
            url,
            type: 'image',
            ...metadata
          });
          processedUrls.add(url);
        }
        break;
      }
      
      case 'media':
      case 'embed': {
        // Generic media or embedded content
        const alt = tag.length > 2 ? tag[2] : undefined;
        const metadata = extractMediaMetadata(tag);
        
        mediaItems.push({
          url,
          type: determineMediaType(url),
          alt,
          ...metadata
        });
        processedUrls.add(url);
        break;
      }
    }
  }
  
  return mediaItems;
}

/**
 * Extract media metadata from a NIP-94 tag
 */
function extractMediaMetadata(tag: string[]): Partial<MediaMetadata> {
  const metadata: Partial<MediaMetadata> = {};
  
  // Alt text is typically the 3rd element
  if (tag.length > 2 && tag[2]) {
    metadata.alt = tag[2];
  }
  
  // Check for dimensions in the 4th element
  if (tag.length > 3 && tag[3]) {
    try {
      // Format can be "WIDTHxHEIGHT" or just JSON
      if (tag[3].includes('x')) {
        const [width, height] = tag[3].split('x').map(Number);
        metadata.dimensions = { width, height };
      } else if (tag[3].startsWith('{')) {
        // Try to parse JSON dimensions
        const dimensionData = JSON.parse(tag[3]);
        if (dimensionData.width || dimensionData.height) {
          metadata.dimensions = {
            width: dimensionData.width,
            height: dimensionData.height
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse media dimensions:', e);
    }
  }
  
  // Check for blurhash in the 5th element
  if (tag.length > 4 && tag[4] && typeof tag[4] === 'string') {
    metadata.blurhash = tag[4];
  }
  
  // Check for description in the 6th element
  if (tag.length > 5 && tag[5]) {
    metadata.description = tag[5];
  }
  
  // Check for sensitive content flag
  if (tag.length > 6 && tag[6] === 'sensitive') {
    metadata.sensitiveContent = true;
  }
  
  return metadata;
}

/**
 * Determine the media type based on URL patterns
 */
function determineMediaType(url: string): MediaItem['type'] {
  // Check for YouTube
  if (url.includes('youtube.com/') || url.includes('youtu.be/')) {
    return 'embed';
  }
  
  // Check for Vimeo
  if (url.includes('vimeo.com/')) {
    return 'embed';
  }
  
  // Check for SoundCloud
  if (url.includes('soundcloud.com/')) {
    return 'embed';
  }
  
  // Check for Spotify
  if (url.includes('spotify.com/')) {
    return 'embed';
  }
  
  // Check for common image extensions
  if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)) {
    return 'image';
  }
  
  // Check for common video extensions
  if (url.match(/\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i)) {
    return 'video';
  }
  
  // Check for common audio extensions
  if (url.match(/\.(mp3|wav|ogg|flac|aac)(\?.*)?$/i)) {
    return 'audio';
  }
  
  // Default to URL for unknown types
  return 'url';
}

/**
 * Identify YouTube video ID from various URL formats
 */
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle youtu.be short URLs
  if (url.includes('youtu.be/')) {
    const match = url.match(/youtu\.be\/([^?&#]+)/);
    return match ? match[1] : null;
  }
  
  // Handle youtube.com URLs
  if (url.includes('youtube.com/')) {
    // Handle watch URLs
    if (url.includes('/watch')) {
      const match = url.match(/[?&]v=([^?&#]+)/);
      return match ? match[1] : null;
    }
    
    // Handle embed URLs
    if (url.includes('/embed/')) {
      const match = url.match(/\/embed\/([^?&#]+)/);
      return match ? match[1] : null;
    }
  }
  
  return null;
}

/**
 * Extract Cloudinary image ID and transformations
 */
export function extractCloudinaryData(url: string): { id: string | null, transformations: string | null } {
  if (!url || !url.includes('cloudinary.com')) {
    return { id: null, transformations: null };
  }
  
  try {
    // Extract the ID (format: cloudinary.com/[transformations]/[id])
    const match = url.match(/cloudinary\.com\/(?:.*?\/)?(?:v\d+\/)?(?:([^\/]+)\/)?([^\/]+)$/);
    const transformations = match?.[1] || null;
    const id = match?.[2] || null;
    
    return { id, transformations };
  } catch (e) {
    console.warn('Failed to extract Cloudinary data:', e);
    return { id: null, transformations: null };
  }
}

/**
 * Check if a URL is for embedded content (YouTube, etc.)
 */
export function isEmbeddedContent(url: string): boolean {
  return (
    url.includes('youtube.com/') || 
    url.includes('youtu.be/') ||
    url.includes('vimeo.com/') ||
    url.includes('soundcloud.com/') ||
    url.includes('spotify.com/') ||
    url.includes('twitch.tv/')
  );
}
