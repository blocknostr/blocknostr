/**
 * Utilities for extracting media from Nostr events
 */
import { NostrEvent } from '@/lib/nostr';
import { MediaItem } from '../media-types';
import UrlRegistry from '../url-registry';
import { isMediaUrl } from '../media-detection';
import { extractAllUrls } from '../media-detection';
import { extractMediaFromTags } from './tag-extractors';
import { extractMediaItems } from './content-extractors';
import { extractMediaUrls, extractLinkPreviewUrls, extractFirstImageUrl } from './core';

/**
 * Helper function to extract media URLs from both content and tags
 * For backward compatibility, with URL registry integration
 */
export const getMediaUrlsFromEvent = (event: NostrEvent | { content: string, tags?: string[][] }): string[] => {
  const content = event.content || '';
  const tags = event.tags || [];

  if (!content && (!tags || !Array.isArray(tags))) return [];

  const urls: Set<string> = new Set();

  // First prioritize structured data from tags
  if (Array.isArray(tags)) {
    const mediaTags = tags.filter(tag =>
      Array.isArray(tag) &&
      tag.length >= 2 &&
      ['media', 'image', 'imeta', 'video', 'audio'].includes(tag[0])
    );

    mediaTags.forEach(tag => {
      // if (tag[1] && !UrlRegistry.isUrlRegistered(tag[1])) { // Original
      if (tag[1]) { // Modified: Bypass UrlRegistry check
        urls.add(tag[1]);
      }
    });
  }

  // Then extract URLs from content, filtering out already registered ones
  if (content) {
    const contentUrls = extractMediaUrls(content);
    contentUrls.forEach(url => {
      // if (!UrlRegistry.isUrlRegistered(url)) { // Original
      // Modified: Bypass UrlRegistry check (implicit as we just add all)
      urls.add(url);
      // }
    });
  }

  // Register all found URLs as media
  const mediaUrls = [...urls];
  // UrlRegistry.registerUrls(mediaUrls, 'media'); // Modified: Temporarily comment out registration

  console.log('[event-extractors] getMediaUrlsFromEvent extracted:', mediaUrls); // Added logging
  return mediaUrls;
};

/**
 * Helper function to extract link preview URLs from both content and tags
 * For backward compatibility, with URL registry integration
 */
export const getLinkPreviewUrlsFromEvent = (event: NostrEvent | { content: string, tags?: string[][] }): string[] => {
  const content = event.content || '';
  const tags = event.tags || [];

  if (!content) return [];

  // Get all URLs from content
  const allUrls = extractAllUrls(content);

  // Get media URLs that we don't want to show as link previews
  const mediaUrls = new Set(getMediaUrlsFromEvent(event));

  // Filter out media URLs and already registered URLs to get only regular links for previews
  const linkUrls = allUrls.filter(url =>
    !mediaUrls.has(url) &&
    !isMediaUrl(url) &&
    !UrlRegistry.isUrlRegistered(url)
  );

  // Register these URLs as links
  UrlRegistry.registerUrls(linkUrls, 'link');

  return linkUrls;
};

/**
 * Helper function to extract media items from both content and tags
 */
export const getMediaItemsFromEvent = (event: NostrEvent | { content: string, tags?: string[][] }): MediaItem[] => {
  const content = event.content || '';
  const tags = event.tags || [];

  if (!content && (!tags || !Array.isArray(tags))) return [];

  const mediaItems: MediaItem[] = [];
  const urls: Set<string> = new Set();

  // First prioritize structured data from tags
  if (Array.isArray(tags)) {
    const tagMediaItems = extractMediaFromTags(tags);
    tagMediaItems.forEach(item => {
      if (item && item.url) {
        mediaItems.push(item);
        urls.add(item.url);
      }
    });
  }

  // Then extract URLs from content as fallback
  if (content) {
    const contentItems = extractMediaItems(content);
    contentItems.forEach(item => {
      if (item && item.url && !urls.has(item.url)) {
        urls.add(item.url);
        mediaItems.push(item);
      }
    });
  }

  return mediaItems;
};

/**
 * Helper function to extract the first image URL from both content and tags
 */
export const getFirstImageUrlFromEvent = (event: NostrEvent | { content?: string, tags?: string[][] }): string | null => {
  const content = event?.content || '';
  const tags = event?.tags || [];

  // First check tags for a cleaner URL source
  if (Array.isArray(tags)) {
    const imageTag = tags.find(tag =>
      Array.isArray(tag) &&
      tag.length >= 2 &&
      (tag[0] === 'image' || tag[0] === 'imeta') &&
      tag[1]?.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)
    );

    if (imageTag && imageTag[1]) {
      return imageTag[1];
    }
  }

  return extractFirstImageUrl(content);
};
