
/**
 * Type definitions for NIP-94 compliant media handling
 */

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'embed' | 'url';
  alt?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  blurhash?: string;
  metadata?: Record<string, any>;
  // NIP-94 specific properties
  intentTag?: 'preview' | 'thumbnail' | 'original';
  sensitiveContent?: boolean;
  description?: string;
}

export interface MediaMetadata {
  alt?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  blurhash?: string;
  description?: string;
  sensitiveContent?: boolean;
}

// Supported media services
export const MEDIA_SERVICES = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  CLOUDINARY: 'cloudinary',
  IMGUR: 'imgur',
  GIPHY: 'giphy',
  SOUNDCLOUD: 'soundcloud',
  SPOTIFY: 'spotify',
  APPLE_MUSIC: 'apple_music',
  TWITCH: 'twitch'
};

// NIP-94 specific tag types
export type Nip94TagType = 'image' | 'img' | 'imeta' | 'video' | 'audio' | 'embed' | 'media';
