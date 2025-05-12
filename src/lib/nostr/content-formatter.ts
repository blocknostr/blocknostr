
/**
 * Utility for formatting Nostr content
 * Handles formatting of text, mentions, links, etc.
 */
export class ContentFormatter {
  /**
   * Format text content with mentions, links, etc.
   * @param content Raw text content
   * @param tags Tags from the event
   * @returns Formatted content
   */
  formatContent(content: string, tags: string[][]): string {
    if (!content) return '';
    
    let formattedContent = content;
    
    // Format mentions
    formattedContent = this.formatMentions(formattedContent, tags);
    
    // Format links
    formattedContent = this.formatLinks(formattedContent);
    
    // Format hashtags
    formattedContent = this.formatHashtags(formattedContent);
    
    return formattedContent;
  }
  
  /**
   * Format mentions in content (#[0], #[1], etc.)
   * @param content Raw text content
   * @param tags Tags from the event
   * @returns Content with formatted mentions
   */
  formatMentions(content: string, tags: string[][]): string {
    if (!content || !tags || tags.length === 0) return content;
    
    // Replace mentions like #[0], #[1], etc. with proper names or pubkeys
    return content.replace(/#\[(\d+)\]/g, (match, index) => {
      const idx = parseInt(index, 10);
      if (isNaN(idx) || idx >= tags.length) return match;
      
      const tag = tags[idx];
      if (!tag || tag.length < 2) return match;
      
      const type = tag[0];
      const value = tag[1];
      
      if (type === 'p') {
        // Person mention
        return `@${value.slice(0, 8)}`;
      } else if (type === 'e') {
        // Event mention
        return `note ${value.slice(0, 8)}`;
      } else {
        return match;
      }
    });
  }
  
  /**
   * Format links in content
   * @param content Raw text content
   * @returns Content with formatted links
   */
  formatLinks(content: string): string {
    if (!content) return '';
    
    // Find URLs and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }
  
  /**
   * Format hashtags in content
   * @param content Raw text content
   * @returns Content with formatted hashtags
   */
  formatHashtags(content: string): string {
    if (!content) return '';
    
    // Find hashtags and make them clickable
    const hashtagRegex = /#(\w+)/g;
    return content.replace(hashtagRegex, (match, tag) => {
      return `<a href="#/tag/${tag}" class="hashtag">#${tag}</a>`;
    });
  }
  
  /**
   * Format a date for display
   * @param timestamp Unix timestamp
   * @returns Formatted date string
   */
  formatDate(timestamp: number): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
      return `${diffSec}s`;
    } else if (diffMin < 60) {
      return `${diffMin}m`;
    } else if (diffHour < 24) {
      return `${diffHour}h`;
    } else if (diffDay < 7) {
      return `${diffDay}d`;
    } else {
      return date.toLocaleDateString();
    }
  }
  
  /**
   * Process content before sending
   * @param content Raw text content to process
   * @returns Processed content
   */
  processContent(content: string): string {
    // This is used in useMessageSender.ts
    return content.trim();
  }
}

// Export singleton instance for ease of use
export const contentFormatter = new ContentFormatter();
