
import { NostrEvent } from '../types';

/**
 * Extracts image URLs from Nostr events
 */
export function extractImagesFromEvents(events: NostrEvent[]): string[] {
  const images: string[] = [];
  
  for (const event of events) {
    // Extract images from content
    const imgUrls = extractImageUrlsFromContent(event.content);
    images.push(...imgUrls);
    
    // Extract images from tags
    const tagImages = event.tags
      .filter(tag => tag[0] === 'image' || tag[0] === 'img')
      .map(tag => tag[1])
      .filter(isValidImageUrl);
    
    images.push(...tagImages);
  }
  
  // Remove duplicates and return
  return [...new Set(images)];
}

/**
 * Extracts image URLs from text content
 */
function extractImageUrlsFromContent(content: string): string[] {
  const images: string[] = [];
  
  // Check for markdown image syntax ![alt](url)
  const markdownPattern = /!\[.*?\]\((https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|webp)(\?[^\s)]*)?)\)/gi;
  let match;
  while ((match = markdownPattern.exec(content)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  
  // Check for plain URLs that end with image extensions
  const plainUrlPattern = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi;
  while ((match = plainUrlPattern.exec(content)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  
  return images;
}

/**
 * Checks if a URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if URL is valid
  try {
    new URL(url);
  } catch {
    return false;
  }
  
  // Check if URL ends with image extension or contains image service domains
  const imageExtRegex = /\.(jpg|jpeg|png|gif|webp)($|\?)/i;
  const imageServices = [
    'imgur.com',
    'i.imgur.com',
    'cloudinary.com',
    'res.cloudinary.com',
    'unsplash.com',
    'images.unsplash.com',
    'nostr.build'
  ];
  
  // Check if URL ends with an image extension
  if (imageExtRegex.test(url)) {
    return true;
  }
  
  // Check if URL is from a known image hosting service
  if (imageServices.some(service => url.includes(service))) {
    return true;
  }
  
  return false;
}

/**
 * Get the first image from a post content
 */
export function extractFirstImageFromContent(content: string): string | null {
  const images = extractImageUrlsFromContent(content);
  return images.length > 0 ? images[0] : null;
}
