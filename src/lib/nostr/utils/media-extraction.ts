
import { NostrEvent } from '@/lib/nostr';

// Regular expression for matching URLs in content
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

// Regular expressions for image and video file extensions
const IMAGE_REGEX = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
const VIDEO_REGEX = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

// List of known image hosting domains
const IMAGE_DOMAINS = [
  'i.imgur.com',
  'imgur.com',
  'pbs.twimg.com',
  'cloudfront.net',
  'media.tenor.com',
  'giphy.com',
  'media.giphy.com',
  'imgflip.com',
  'i.redd.it',
  'i.pinimg.com',
  'cdn.discordapp.com',
  'media.discordapp.net'
];

/**
 * Extract all URLs from an event's content
 */
export const getUrlsFromContent = (content: string): string[] => {
  const urls = content.match(URL_REGEX);
  return urls ? urls : [];
};

/**
 * Extract media URLs from an event
 */
export const getMediaUrlsFromEvent = (event: NostrEvent): string[] => {
  // If no content, return empty array
  if (!event.content) return [];

  // Get all URLs from content
  const urls = getUrlsFromContent(event.content);
  
  // Filter for media URLs
  return urls.filter(url => isValidMediaUrl(url));
};

/**
 * Check if a URL is likely to be a media URL
 */
export const isValidMediaUrl = (url: string): boolean => {
  // Check for image or video file extensions
  if (IMAGE_REGEX.test(url) || VIDEO_REGEX.test(url)) {
    return true;
  }

  // Check if URL belongs to a known image hosting domain
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    for (const domain of IMAGE_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return true;
      }
    }
  } catch (e) {
    // Invalid URL format
    return false;
  }

  return false;
};
