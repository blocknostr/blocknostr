/**
 * Content formatter for processing Nostr content
 * Handles mentions, links, and other formatting features according to NIPs
 */

// Pattern to match potential mentions
const mentionRegex = /(@npub[a-zA-Z0-9]{59})/g;
// Pattern to match hashtags according to NIP-12
const hashtagRegex = /#[^\s#]+/g;
// Pattern to match URLs
const urlRegex = /(https?:\/\/[^\s]+)/g;

class ContentFormatter {
  /**
   * Process content to convert mentions, links, and hashtags
   * @param content The raw content string
   * @returns Processed content string
   */
  processContent(content: string): string {
    if (!content) return '';
    
    // Process everything in order: URLs, mentions, then hashtags
    return content
      .replace(urlRegex, (url) => {
        try {
          // Try to create a valid URL and extract relevant parts
          const parsedUrl = new URL(url);
          const displayUrl = `${parsedUrl.hostname}${parsedUrl.pathname.slice(0, 15)}${parsedUrl.pathname.length > 15 ? '...' : ''}`;
          return url; // For now, just return the URL as is
        } catch (e) {
          return url;
        }
      })
      .replace(mentionRegex, (match) => {
        // Keep mentions for now
        return match;
      })
      .replace(hashtagRegex, (hashtag) => {
        // Keep hashtags for now
        return hashtag;
      });
  }

  /**
   * Render links from a piece of content
   * @param content The content to render
   * @returns The content with links rendered
   */
  renderLinks(content: string): string {
    if (!content) return '';
    
    return content.replace(urlRegex, (url) => {
      try {
        // Simple URL display
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
      } catch (e) {
        return url;
      }
    });
  }

  /**
   * Extract hashtags from content
   * @param content The content to extract hashtags from
   * @returns Array of hashtags without the # symbol
   */
  extractHashtags(content: string): string[] {
    if (!content) return [];
    
    const matches = content.match(hashtagRegex);
    if (!matches) return [];
    
    return matches.map(tag => tag.slice(1));
  }

  /**
   * Extract mentions from content
   * @param content The content to extract mentions from
   * @returns Array of mentioned pubkeys
   */
  extractMentions(content: string[]): string[] {
    if (!content) return [];
    
    const matches = content.match(mentionRegex);
    if (!matches) return [];
    
    return matches.map(mention => mention.slice(1)); // Remove @ symbol
  }
}

// Export a singleton instance
export const contentFormatter = new ContentFormatter();
