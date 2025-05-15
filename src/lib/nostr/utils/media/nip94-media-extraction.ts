
/**
 * NIP-94 Media Extraction Utilities
 * 
 * This module provides functions for extracting media information
 * from Nostr events according to the NIP-94 specification.
 */
import { NostrEvent } from '@/lib/nostr';
import { MediaItem } from './media-types';
import { isImageUrl, isVideoUrl, isAudioUrl } from './media-validation';

/**
 * Extract media items from event tags following NIP-94 format
 * @param event Nostr event with possible media tags
 * @returns Array of media items with metadata
 */
export const extractNip94Media = (event: NostrEvent): MediaItem[] => {
  if (!event || !Array.isArray(event.tags)) return [];
  
  const mediaItems: MediaItem[] = [];
  
  // Process tags according to NIP-94
  for (const tag of event.tags) {
    if (!Array.isArray(tag) || tag.length < 2) continue;
    
    const [tagType, url, ...rest] = tag;
    
    if (!url) continue;
    
    // Process the different media tag types
    if (['image', 'img', 'imeta'].includes(tagType)) {
      let alt: string | undefined;
      let dimensions: { width?: number, height?: number } | undefined;
      
      // Get alt text (position 2)
      if (rest.length >= 1 && typeof rest[0] === 'string') {
        alt = rest[0];
      }
      
      // Get dimensions (position 3)
      if (rest.length >= 2 && typeof rest[1] === 'string' && rest[1].includes('x')) {
        try {
          const [width, height] = rest[1].split('x').map(Number);
          if (!isNaN(width) && !isNaN(height)) {
            dimensions = { width, height };
          }
        } catch (e) {
          console.warn('Failed to parse image dimensions:', e);
        }
      }
      
      mediaItems.push({
        type: 'image',
        url,
        alt,
        dimensions
      });
    } 
    else if (tagType === 'video') {
      let alt: string | undefined;
      let poster: string | undefined;
      
      // Get alt/description text (position 2)
      if (rest.length >= 1 && typeof rest[0] === 'string') {
        alt = rest[0];
      }
      
      // Get poster image URL (position 3)
      if (rest.length >= 2 && typeof rest[1] === 'string') {
        poster = rest[1];
      }
      
      mediaItems.push({
        type: 'video',
        url,
        alt,
        poster
      });
    }
    else if (tagType === 'audio') {
      let alt: string | undefined;
      let coverArt: string | undefined;
      
      // Get alt/description text (position 2)
      if (rest.length >= 1 && typeof rest[0] === 'string') {
        alt = rest[0];
      }
      
      // Get cover art URL (position 3)
      if (rest.length >= 2 && typeof rest[1] === 'string') {
        coverArt = rest[1];
      }
      
      mediaItems.push({
        type: 'audio',
        url,
        alt,
        coverArt
      });
    }
    else if (tagType === 'media') {
      // Generic media tag - determine type from URL
      const type = determineMediaTypeFromUrl(url);
      let alt: string | undefined;
      
      if (rest.length >= 1 && typeof rest[0] === 'string') {
        alt = rest[0];
      }
      
      mediaItems.push({
        type,
        url,
        alt
      });
    }
  }
  
  return mediaItems;
};

/**
 * Determine media type from URL
 */
const determineMediaTypeFromUrl = (url: string): MediaItem['type'] => {
  if (isYoutubeUrl(url) || isVimeoUrl(url) || url.includes('twitter.com/') || url.includes('x.com/')) {
    return 'embed';
  }
  if (isImageUrl(url)) {
    return 'image';
  }
  if (isVideoUrl(url)) {
    return 'video';
  }
  if (isAudioUrl(url)) {
    return 'audio';
  }
  return 'url';
};

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export const extractYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // Handle various YouTube URL formats:
    // - youtube.com/watch?v=VIDEO_ID
    // - youtu.be/VIDEO_ID
    // - youtube.com/shorts/VIDEO_ID
    // - youtube.com/embed/VIDEO_ID
    // - youtube.com/v/VIDEO_ID
    
    let videoId: string | null = null;
    
    // youtube.com/watch?v=ID format
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v');
    }
    // youtu.be/ID format
    else if (url.includes('youtu.be/')) {
      const urlParts = url.split('youtu.be/');
      if (urlParts.length > 1) {
        videoId = urlParts[1].split('?')[0].split('#')[0];
      }
    }
    // youtube.com/shorts/ID format
    else if (url.includes('youtube.com/shorts/')) {
      const urlParts = url.split('youtube.com/shorts/');
      if (urlParts.length > 1) {
        videoId = urlParts[1].split('?')[0].split('#')[0];
      }
    }
    // youtube.com/embed/ID format
    else if (url.includes('youtube.com/embed/')) {
      const urlParts = url.split('youtube.com/embed/');
      if (urlParts.length > 1) {
        videoId = urlParts[1].split('?')[0].split('#')[0];
      }
    }
    // youtube.com/v/ID format
    else if (url.includes('youtube.com/v/')) {
      const urlParts = url.split('youtube.com/v/');
      if (urlParts.length > 1) {
        videoId = urlParts[1].split('?')[0].split('#')[0];
      }
    }
    
    // Validate video ID format (should be 11 characters)
    if (videoId && videoId.length === 11) {
      return videoId;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting YouTube video ID:', error);
    return null;
  }
};

/**
 * Extract Vimeo video ID from various Vimeo URL formats
 */
export const extractVimeoVideoId = (url: string): string | null => {
  if (!url) return null;
  
  try {
    // Match Vimeo ID from common URL patterns
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|video\/|)(\d+)(?:[\/\?]?)/;
    const match = url.match(vimeoRegex);
    
    if (match && match[2]) {
      return match[2];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Vimeo video ID:', error);
    return null;
  }
};

/**
 * Extract SoundCloud data from URL
 */
export const extractSoundcloudData = (url: string): { user?: string, track?: string } | null => {
  if (!url || !url.includes('soundcloud.com')) return null;
  
  try {
    // Simple extraction for soundcloud.com/username/track-name pattern
    const match = url.match(/soundcloud\.com\/([^\/]+)\/([^\/\?#]+)/);
    
    if (match && match.length >= 3) {
      return {
        user: match[1],
        track: match[2]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting SoundCloud data:', error);
    return null;
  }
};

/**
 * Extract Spotify ID and type from URL
 */
export const extractSpotifyData = (url: string): { type: string, id: string } | null => {
  if (!url || !url.includes('spotify.com')) return null;
  
  try {
    // Match pattern like spotify.com/track/1234567890
    const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
    
    if (match && match.length >= 3) {
      return {
        type: match[1],
        id: match[2]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Spotify data:', error);
    return null;
  }
};

/**
 * Extract Twitter/X tweet ID from URL
 */
export const extractTwitterData = (url: string): { username?: string, tweetId?: string } | null => {
  if (!url) return null;
  if (!url.includes('twitter.com/') && !url.includes('x.com/')) return null;
  
  try {
    // Match for twitter.com/username/status/1234567890 pattern
    const twitterRegex = /(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/;
    const match = url.match(twitterRegex);
    
    if (match && match.length >= 3) {
      return {
        username: match[1],
        tweetId: match[2]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Twitter data:', error);
    return null;
  }
};

/**
 * Extract Cloudinary cloud name and asset ID from URL
 */
export const extractCloudinaryData = (url: string): { cloudName?: string, id?: string } | null => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    // Match pattern like res.cloudinary.com/cloud-name/image/upload/v1234567890/asset-id
    const cloudinaryRegex = /res\.cloudinary\.com\/([^\/]+)\/(image|video|audio)\/upload\/(?:v\d+\/)?([^\/\?]+)/;
    const match = url.match(cloudinaryRegex);
    
    if (match && match.length >= 4) {
      return {
        cloudName: match[1],
        id: match[3]
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Cloudinary data:', error);
    return null;
  }
};

/**
 * Determines if content is embedded from a platform rather than direct media
 */
export const isEmbeddedContent = (url: string): boolean => {
  if (!url) return false;
  
  return !!(
    isYoutubeUrl(url) ||
    isVimeoUrl(url) ||
    isSoundcloudUrl(url) ||
    isSpotifyUrl(url) ||
    isTwitterUrl(url)
  );
};

// Helper functions for URL detection specific to platforms
function isYoutubeUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
}

function isVimeoUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('vimeo.com');
}

function isSoundcloudUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('soundcloud.com');
}

function isSpotifyUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('spotify.com');
}

function isTwitterUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('twitter.com') || url.includes('x.com');
}
