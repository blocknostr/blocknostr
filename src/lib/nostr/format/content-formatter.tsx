
import React from 'react';
import { ContentFormatterInterface } from './types';
import { isNostrUrl, getHexFromNostrUrl, getProfileUrl, getEventUrl, shortenIdentifier } from '../utils/nip/nip27';
import UrlRegistry from '../utils/media/url-registry';

// Simple content formatter that handles basic Nostr content formatting
export const contentFormatter: ContentFormatterInterface = {
  /**
   * Format Nostr content, processing hashtags, mentions, and URLs
   */
  formatContent: (content: string, mediaUrls?: string[]): React.JSX.Element => {
    if (!content) return <></>;
    
    // Split content by spaces to identify potential entities
    const parts = content.split(/(\s+)/);
    
    // Process each part
    const formattedParts = parts.map((part, index) => {
      // Skip URLs that are already registered as media or links
      if (part.match(/^https?:\/\//i) && UrlRegistry.isUrlRegistered(part)) {
        // Return empty for URLs that are rendered elsewhere
        return null;
      }
      
      // Detect nostr: URLs (NIP-27)
      if (part.startsWith('nostr:')) {
        const identifier = part.substring(6); // Remove 'nostr:'
        
        if (identifier.startsWith('npub') || identifier.startsWith('nprofile')) {
          // Profile mention
          return (
            <a 
              key={index} 
              href={getProfileUrl(identifier)}
              className="text-primary font-medium hover:underline"
            >
              @{shortenIdentifier(identifier)}
            </a>
          );
        } else if (identifier.startsWith('note') || identifier.startsWith('nevent')) {
          // Event mention
          return (
            <a 
              key={index} 
              href={getEventUrl(identifier)}
              className="text-primary font-medium hover:underline"
            >
              #{shortenIdentifier(identifier)}
            </a>
          );
        }
      }
      
      // Detect @ mentions
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span key={index} className="text-primary font-medium cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      
      // Detect hashtags
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span key={index} className="text-primary cursor-pointer hover:underline">
            {part}
          </span>
        );
      }
      
      // Detect URLs that are not already being rendered elsewhere
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
    
    // Filter out null values (for already registered URLs)
    return <>{formattedParts.filter(Boolean)}</>;
  },
  
  /**
   * Format a Nostr event content with additional processing for note references
   */
  formatEventContent: (content: string, eventReferences?: Record<string, any>): React.JSX.Element => {
    return contentFormatter.formatContent(content);
  },

  /**
   * Process content and return a string (non-React version)
   * This is used for plain text operations like sending messages
   */
  processContent: (content: string): string => {
    // For now, we'll just return the content as is
    // In a more advanced implementation, we could add automatic tagging
    // based on @mentions in the content
    return content;
  },

  /**
   * Parse content and break it into segments for more advanced processing
   */
  parseContent: (content: string, mediaUrls?: string[]) => {
    if (!content) return [];
    
    // Extract mentions from content
    const segments = [];
    let remainingContent = content;
    
    // Find all nostr: URLs and @ mentions
    const mentionRegex = /(@\w+|nostr:(npub|note|nevent|nprofile)1[a-z0-9]+)/gi;
    let match;
    let lastIndex = 0;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text segment before the current match
      if (match.index > lastIndex) {
        segments.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Add mention segment
      const mention = match[0];
      if (mention.startsWith('@')) {
        segments.push({
          type: 'mention',
          content: mention,
          data: mention.substring(1) // Remove @ symbol
        });
      } else if (mention.startsWith('nostr:')) {
        segments.push({
          type: 'mention',
          content: mention,
          data: mention // Keep full nostr: URL
        });
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    return segments.length > 0 ? segments : [{
      type: 'text',
      content: content
    }];
  },

  /**
   * Extract mentioned pubkeys from content and tags
   */
  extractMentionedPubkeys: (content: string, tags: string[][]) => {
    // First get pubkeys from p tags
    const pubkeys: string[] = [];
    
    if (tags && Array.isArray(tags)) {
      tags.forEach(tag => {
        if (tag[0] === 'p' && tag[1]) {
          pubkeys.push(tag[1]);
        }
      });
    }
    
    // Then extract pubkeys from nostr: URLs in content
    if (content) {
      const nostrRegex = /nostr:npub1[a-z0-9]+/gi;
      const matches = content.match(nostrRegex);
      
      if (matches) {
        matches.forEach(match => {
          const pubkey = getHexFromNostrUrl(match);
          if (pubkey && !pubkeys.includes(pubkey)) {
            pubkeys.push(pubkey);
          }
        });
      }
    }
    
    return pubkeys;
  }
};
