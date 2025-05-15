
import React, { useMemo } from 'react';
import { ContentFormatterInterface, FormattedSegment } from './types';
import { getHexFromNostrUrl, getProfileUrl, getEventUrl, shortenIdentifier, isNostrUrl } from '../utils/nip/nip27';
import { extractMediaUrls } from '../utils/media-extraction';

/**
 * LightweightFormatter: Performance-optimized content formatter for Nostr
 * Reduces React element creation and optimizes string manipulation
 */
export const lightweightFormatter: ContentFormatterInterface = {
  /**
   * Parse content into segments for efficient rendering
   */
  parseContent(content: string, mediaUrls?: string[]): FormattedSegment[] {
    if (!content || typeof content !== 'string') return [];
    
    try {
      const segments: FormattedSegment[] = [];
      
      // Efficient regex pattern that matches all entities in one pass
      // This avoids multiple regex executions across the content
      const entityPattern = /(@\w+)|(#\w+)|(https?:\/\/\S+)|(nostr:(?:npub|note|nevent|nprofile)1\w+)/gi;
      
      let lastIndex = 0;
      let match;
      
      while ((match = entityPattern.exec(content)) !== null) {
        // Add text before the match as a text segment
        if (match.index > lastIndex) {
          segments.push({
            type: 'text',
            content: content.substring(lastIndex, match.index)
          });
        }
        
        const matchedText = match[0];
        
        // Determine segment type based on the match
        if (matchedText.startsWith('@')) {
          // @mention
          segments.push({
            type: 'mention',
            content: matchedText,
            data: matchedText.substring(1) // Remove @ symbol
          });
        } else if (matchedText.startsWith('#')) {
          // #hashtag
          segments.push({
            type: 'hashtag',
            content: matchedText,
            data: matchedText.substring(1) // Remove # symbol
          });
        } else if (matchedText.startsWith('nostr:')) {
          // nostr: URL (NIP-27)
          segments.push({
            type: 'mention',
            content: matchedText,
            data: matchedText
          });
        } else if (matchedText.match(/^https?:\/\//i)) {
          // Regular URL
          // Check if this is a media URL
          const isMediaUrl = mediaUrls?.includes(matchedText) || 
            /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)(\?[^\s]*)?$/i.test(matchedText);
            
          segments.push({
            type: isMediaUrl ? 'media-url' : 'url',
            content: matchedText,
            data: matchedText
          });
        }
        
        lastIndex = match.index + matchedText.length;
      }
      
      // Add any remaining text
      if (lastIndex < content.length) {
        segments.push({
          type: 'text',
          content: content.substring(lastIndex)
        });
      }
      
      return segments;
    } catch (error) {
      console.error('Error parsing content:', error);
      return [{ type: 'text', content }];
    }
  },
  
  /**
   * Format content with minimal React element creation
   */
  formatContent(content: string, mediaUrls?: string[]): React.JSX.Element {
    if (!content || typeof content !== 'string') return <></>;
    
    try {
      // Parse content into segments
      const segments = this.parseContent(content, mediaUrls);
      
      // Render segments with minimal element creation
      const elements = segments.map((segment, index) => {
        switch (segment.type) {
          case 'mention':
            if (segment.content.startsWith('nostr:')) {
              const identifier = segment.content.substring(6);
              
              if (identifier.startsWith('npub') || identifier.startsWith('nprofile')) {
                return (
                  <a 
                    key={index} 
                    href={getProfileUrl(identifier)}
                    className="text-primary hover:underline"
                  >
                    @{shortenIdentifier(identifier)}
                  </a>
                );
              } else if (identifier.startsWith('note') || identifier.startsWith('nevent')) {
                return (
                  <a 
                    key={index} 
                    href={getEventUrl(identifier)}
                    className="text-primary hover:underline"
                  >
                    #{shortenIdentifier(identifier)}
                  </a>
                );
              }
              return <span key={index}>{segment.content}</span>;
            } else {
              return (
                <span key={index} className="text-primary cursor-pointer hover:underline">
                  {segment.content}
                </span>
              );
            }
            
          case 'hashtag':
            return (
              <span key={index} className="text-primary cursor-pointer hover:underline">
                {segment.content}
              </span>
            );
            
          case 'url':
            return (
              <a 
                key={index} 
                href={segment.content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {segment.content}
              </a>
            );
            
          case 'media-url':
            // Don't render media URLs as links - they're handled separately
            return <span key={index}>{segment.content}</span>;
            
          case 'text':
          default:
            return <span key={index}>{segment.content}</span>;
        }
      });
      
      return <>{elements}</>;
    } catch (error) {
      console.error('Error formatting content:', error);
      // Fallback to plain text
      return <>{content}</>;
    }
  },
  
  /**
   * Format a Nostr event content with additional processing
   */
  formatEventContent(content: string, eventReferences?: Record<string, any>): React.JSX.Element {
    // For simplicity in the lightweight version, we just use the standard formatter
    return this.formatContent(content);
  },
  
  /**
   * Process content and return string version (non-React)
   */
  processContent(content: string): string {
    if (!content || typeof content !== 'string') return '';
    
    // Simple processing without React elements
    return content;
  },
  
  /**
   * Extract mentioned pubkeys from content and tags
   */
  extractMentionedPubkeys(content: string, tags: string[][]): string[] {
    const pubkeys: string[] = [];
    
    try {
      // Extract from p tags
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (Array.isArray(tag) && tag[0] === 'p' && tag[1]) {
            pubkeys.push(tag[1]);
          }
        });
      }
      
      // Extract from nostr: URLs
      if (content && typeof content === 'string') {
        const matches = content.match(/nostr:(?:npub|nprofile)1[a-zA-Z0-9]+/gi);
        
        if (matches) {
          matches.forEach(match => {
            try {
              const pubkey = getHexFromNostrUrl(match);
              if (pubkey && !pubkeys.includes(pubkey)) {
                pubkeys.push(pubkey);
              }
            } catch (error) {
              console.error('Error extracting pubkey from nostr URL:', error);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error extracting mentioned pubkeys:', error);
    }
    
    return pubkeys;
  }
};

/**
 * React hook for memoized content formatting
 * Prevents unnecessary re-renders when content hasn't changed
 */
export function useFormattedContent(content: string, mediaUrls?: string[]) {
  return useMemo(() => {
    return lightweightFormatter.formatContent(content, mediaUrls);
  }, [content, mediaUrls]);
}

/**
 * React hook for memoized content parsing
 */
export function useParsedContent(content: string, mediaUrls?: string[]) {
  return useMemo(() => {
    return lightweightFormatter.parseContent(content, mediaUrls);
  }, [content, mediaUrls]);
}
