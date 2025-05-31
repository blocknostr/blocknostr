
/**
 * Type definitions for media extraction utilities
 */

export interface MediaItem {
  url: string;
  type: 'image' | 'video' | 'audio' | 'url';
  alt?: string;
  dimensions?: {
    width?: number;
    height?: number;
  };
  blurhash?: string;
  metadata?: Record<string, any>;
}

