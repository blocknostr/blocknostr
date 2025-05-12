
/**
 * Utility class for formatting Nostr content
 * Handles mentions, links, hashtags according to NIP-27
 */
class ContentFormatter {
  /**
   * Process content to format mentions, links, etc.
   * @param content Raw content
   * @returns Processed content
   */
  processContent(content: string): string {
    if (!content) return '';
    
    // Format mentions - nostr:npub... or #[0]
    const mentionFormatted = this.formatMentions(content);
    
    // Format links
    const linkFormatted = this.formatLinks(mentionFormatted);
    
    // Format hashtags
    const hashtagFormatted = this.formatHashtags(linkFormatted);
    
    return hashtagFormatted;
  }

  /**
   * Format mentions in content
   * @param content Content with raw mentions
   * @returns Content with formatted mentions
   */
  private formatMentions(content: string): string {
    // Replace nostr: protocol mentions
    let result = content.replace(
      /nostr:(npub[a-z0-9]+)/gi, 
      (match, npub) => `@${npub.substring(0, 8)}...`
    );
    
    // Replace #[index] mentions (would require tag context)
    // This is a simplified implementation 
    result = result.replace(
      /#\[(\d+)\]/g,
      (match, index) => `@user-${index}`
    );
    
    return result;
  }

  /**
   * Format links in content
   * @param content Content with raw links
   * @returns Content with formatted links
   */
  private formatLinks(content: string): string {
    // For now, just return the content as is
    // In a real implementation, this would detect URLs and format them
    return content;
  }

  /**
   * Format hashtags in content
   * @param content Content with raw hashtags
   * @returns Content with formatted hashtags
   */
  private formatHashtags(content: string): string {
    // Format hashtags like #nostr
    return content.replace(
      /(^|\s)#([a-z0-9_]+)/gi,
      (match, space, tag) => `${space}#${tag}`
    );
  }

  /**
   * Safely truncate content to a specified length
   * @param content Content to truncate
   * @param length Maximum length
   * @returns Truncated content
   */
  truncate(content: string, length: number = 100): string {
    if (!content || content.length <= length) {
      return content;
    }
    
    return content.substring(0, length) + '...';
  }
}

// Export a singleton instance
export const contentFormatter = new ContentFormatter();
