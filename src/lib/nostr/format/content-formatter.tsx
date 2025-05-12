
import React from 'react';
import { ContentFormatterInterface } from './types';

// Simple content formatter that handles basic Nostr content formatting
export const contentFormatter: ContentFormatterInterface = {
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
  },

  /**
   * Process content and return a string (non-React version)
   * This is used for plain text operations like sending messages
   */
  processContent: (content: string): string => {
    // Just return the content as is for now - this could be enhanced later
    // to strip formatting markers or add processing
    return content;
  },

  /**
   * Parse content and break it into segments for more advanced processing
   */
  parseContent: (content: string, mediaUrls?: string[]) => {
    if (!content) return [];
    
    // Basic implementation that just returns text segments
    return [{
      type: 'text',
      content: content
    }];
  },

  /**
   * Extract mentioned pubkeys from content and tags
   */
  extractMentionedPubkeys: (content: string, tags: string[][]) => {
    // Simple implementation that returns pubkeys from p tags
    const pubkeys: string[] = [];
    
    if (tags && Array.isArray(tags)) {
      tags.forEach(tag => {
        if (tag[0] === 'p' && tag[1]) {
          pubkeys.push(tag[1]);
        }
      });
    }
    
    return pubkeys;
  }
};
