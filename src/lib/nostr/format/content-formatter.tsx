
import React from 'react';

// Simple content formatter that handles basic Nostr content formatting
export const contentFormatter = {
  /**
   * Format Nostr content, processing hashtags, mentions, and URLs
   */
  formatContent: (content: string): React.ReactNode => {
    if (!content) return null;
    
    // Split content by spaces to identify potential entities
    const parts = content.split(/(\s+)/);
    
    // Process each part
    const formattedParts = parts.map((part, index) => {
      // Detect hashtags
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span key={index} className="text-primary cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      
      // Detect mentions (npub or nprofile)
      if (part.startsWith('@') || part.startsWith('nostr:npub') || part.startsWith('nostr:nprofile')) {
        return (
          <span key={index} className="text-primary cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      
      // Detect URLs
      if (part.match(/^https?:\/\//i)) {
        return (
          <a 
            key={index} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {part}
          </a>
        );
      }
      
      // Return regular text
      return part;
    });
    
    return <>{formattedParts}</>;
  },
  
  /**
   * Format a Nostr event content with additional processing for note references
   */
  formatEventContent: (content: string, eventReferences?: Record<string, any>): React.ReactNode => {
    return contentFormatter.formatContent(content);
  }
};
