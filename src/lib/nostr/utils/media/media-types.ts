
/**
 * Media item type definitions for consistent usage across components
 */

/**
 * MediaItem represents any media resource that can be rendered in a note
 */
export interface MediaItem {
  /**
   * URL of the media resource
   */
  url: string;
  
  /**
   * Type of the media for proper rendering
   */
  type: 'image' | 'video' | 'audio' | 'embed' | 'url';
  
  /**
   * Alternative text description for media (accessibility)
   */
  alt?: string;
  
  /**
   * Dimensions for images/videos when available
   */
  dimensions?: {
    width?: number;
    height?: number;
  };
  
  /**
   * Video poster image URL
   */
  poster?: string;
  
  /**
   * Audio cover art URL
   */
  coverArt?: string;
  
  /**
   * Source platform (youtube, vimeo, etc.)
   */
  platform?: string;
  
  /**
   * Platform-specific ID
   */
  platformId?: string;
  
  /**
   * Flag indicating sensitive content
   */
  sensitiveContent?: boolean;
  
  /**
   * Description for the content (distinct from alt)
   */
  description?: string;
  
  /**
   * Blurhash for progressive image loading
   */
  blurhash?: string;
  
  /**
   * Media file size in bytes when available
   */
  size?: number;
  
  /**
   * Media length in seconds (for video/audio)
   */
  duration?: number;
  
  /**
   * Metadata from the platform
   */
  metadata?: Record<string, any>;
}

/**
 * Simplified media item type for internal processing
 */
export type SimpleMediaItem = Pick<MediaItem, 'url' | 'type' | 'alt'>;

/**
 * Media rendering options for UI components
 */
export interface MediaRenderOptions {
  /**
   * Maximum number of media items to show
   */
  maxItems?: number;
  
  /**
   * Should show media controls
   */
  controls?: boolean;
  
  /**
   * Whether to mute audio by default
   */
  muted?: boolean;
  
  /**
   * Whether media should autoplay
   */
  autoplay?: boolean;
  
  /**
   * Whether to loop media
   */
  loop?: boolean;
  
  /**
   * Aspect ratio for media container
   */
  aspectRatio?: 'square' | '16:9' | '4:3' | '1:1' | 'auto';
  
  /**
   * Fit mode for media content
   */
  objectFit?: 'cover' | 'contain' | 'fill';
  
  /**
   * Preload strategy for media
   */
  preload?: 'auto' | 'metadata' | 'none';
  
  /**
   * Quality level for video playback
   */
  quality?: 'auto' | 'low' | 'medium' | 'high';
}

/**
 * Common media service providers
 */
export type MediaPlatform = 
  | 'youtube'
  | 'vimeo'
  | 'cloudinary'
  | 'soundcloud'
  | 'spotify'
  | 'twitter'
  | 'giphy'
  | 'imgur'
  | 'generic';
