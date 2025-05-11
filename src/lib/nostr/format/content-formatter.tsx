
import React from 'react';
import { Link } from 'react-router-dom';
import { getNpubFromHex } from '../utils/keys';

interface FormattedSegment {
  type: 'text' | 'mention' | 'hashtag' | 'url';
  content: string;
  data?: string;
}

/**
 * Content formatter for Nostr posts
 * Implements NIP-27 for mentions, hashtags and URLs
 */
export class ContentFormatter {
  /**
   * Parse content and split into segments for formatting
   */
  parseContent(content: string): FormattedSegment[] {
    const segments: FormattedSegment[] = [];
    
    // Regular expressions for different content types
    const mentionRegex = /(nostr:npub[a-z0-9]{59,60})/g;
    const hashtagRegex = /#(\w+)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Combine all regex patterns
    const combinedPattern = new RegExp(
      `${mentionRegex.source}|${hashtagRegex.source}|${urlRegex.source}`,
      'g'
    );
    
    // Split the content based on matches
    let lastIndex = 0;
    let match;
    
    while ((match = combinedPattern.exec(content)) !== null) {
      const matchedString = match[0];
      const startIndex = match.index;
      
      // Add text before the match
      if (startIndex > lastIndex) {
        segments.push({
          type: 'text',
          content: content.slice(lastIndex, startIndex)
        });
      }
      
      // Determine the type of match and add it
      if (mentionRegex.test(matchedString)) {
        segments.push({
          type: 'mention',
          content: matchedString,
          data: matchedString.replace('nostr:', '')
        });
      } else if (hashtagRegex.test(matchedString)) {
        segments.push({
          type: 'hashtag',
          content: matchedString,
          data: matchedString.substring(1) // Remove # symbol
        });
      } else if (urlRegex.test(matchedString)) {
        segments.push({
          type: 'url',
          content: matchedString,
          data: matchedString
        });
      }
      
      lastIndex = startIndex + matchedString.length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      segments.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }
    
    return segments;
  }
  
  /**
   * Extract pubkeys from content mentions
   */
  extractMentionedPubkeys(content: string, tags: string[][]): string[] {
    const pubkeys: string[] = [];
    
    // Extract from nostr: mentions in content
    const mentionRegex = /nostr:npub([a-z0-9]{59,60})/g;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const npub = match[1];
      // Convert npub to hex pubkey
      try {
        const pubkey = npub; // Use getNpubFromHex utility if needed
        pubkeys.push(pubkey);
      } catch (error) {
        console.error("Invalid npub format:", error);
      }
    }
    
    // Extract from p tags (NIP-10)
    if (Array.isArray(tags)) {
      tags.forEach(tag => {
        if (Array.isArray(tag) && tag.length >= 2 && tag[0] === 'p') {
          pubkeys.push(tag[1]);
        }
      });
    }
    
    // Remove duplicates
    return [...new Set(pubkeys)];
  }
  
  /**
   * Format content for rendering
   */
  formatContent(content: string): JSX.Element {
    const segments = this.parseContent(content);
    
    return (
      <>
        {segments.map((segment, index) => {
          switch (segment.type) {
            case 'mention':
              return (
                <Link 
                  key={index} 
                  to={`/profile/${segment.data}`}
                  className="text-primary font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  @{segment.data?.substring(0, 8)}
                </Link>
              );
            case 'hashtag':
              return (
                <span 
                  key={index} 
                  className="text-primary font-medium hover:underline cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle hashtag click (implement later)
                  }}
                >
                  #{segment.data}
                </span>
              );
            case 'url':
              return (
                <a 
                  key={index} 
                  href={segment.data} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {segment.content}
                </a>
              );
            default:
              return <span key={index}>{segment.content}</span>;
          }
        })}
      </>
    );
  }
}

// Create a singleton instance
export const contentFormatter = new ContentFormatter();
