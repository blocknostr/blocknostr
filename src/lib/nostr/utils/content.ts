
/**
 * Extract image URLs from events
 * @param events Array of Nostr events
 * @returns Array of image objects with URL and event ID
 */
export function extractImagesFromEvents(events: any[]): { url: string; eventId: string; }[] {
  const images: { url: string; eventId: string; }[] = [];
  
  for (const event of events) {
    try {
      // Try to extract image URLs from content
      const content = event.content || '';
      
      // Look for image URLs in content
      const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/gi;
      const matches = content.match(urlRegex);
      
      if (matches) {
        for (const url of matches) {
          images.push({
            url,
            eventId: event.id
          });
        }
      }
      
      // Also check for image URLs in tags (NIP-108, etc.)
      if (event.tags && Array.isArray(event.tags)) {
        for (const tag of event.tags) {
          if (tag[0] === 'image' || tag[0] === 'media') {
            if (tag[1] && typeof tag[1] === 'string') {
              images.push({
                url: tag[1],
                eventId: event.id
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting images from event:', error);
    }
  }
  
  // Remove duplicates
  const uniqueImages = images.filter((img, index, self) =>
    index === self.findIndex((i) => i.url === img.url)
  );
  
  return uniqueImages;
}
