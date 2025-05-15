
import React from 'react';
import { ContentFormatterInterface } from './types';
import { 
  isNostrUrl, 
  getHexFromNostrUrl, 
  getProfileUrl, 
  getEventUrl, 
  shortenIdentifier 
} from '../utils/nip/nip27';
import { mapMentionPositions, isPotentialMention } from '../utils/nip/nip08';
import ProfileHoverCard from '@/components/profile/ProfileHoverCard';
import { Link } from 'react-router-dom';
import { NostrEvent } from '../types';

// Simple content formatter that handles basic Nostr content formatting
export const contentFormatter: ContentFormatterInterface = {
  /**
   * Format Nostr content, processing hashtags, mentions, and URLs
   */
  formatContent: (content: string, event?: NostrEvent): React.JSX.Element => {
    if (!content || typeof content !== 'string') return <></>;
    
    try {
      // Get tags from the event if available
      const tags = event?.tags || [];
      
      // Map p-tag mentions to positions in the content (NIP-08)
      const mentionPositions = mapMentionPositions(content, tags);
      
      // Get all p-tags for reference
      const pTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'p');
      
      // Split content by spaces to identify potential entities
      const parts = content.split(/(\s+)/);
      
      // Process each part
      const formattedParts = parts.map((part, index) => {
        if (!part) return null;
        
        try {
          // Detect nostr: URLs (NIP-27)
          if (part.startsWith('nostr:')) {
            const identifier = part.substring(6); // Remove 'nostr:'
            
            if (identifier.startsWith('npub') || identifier.startsWith('nprofile')) {
              // Profile mention
              let pubkey;
              try {
                pubkey = getHexFromNostrUrl(part);
              } catch (e) {
                pubkey = null;
              }
              
              return (
                <ProfileHoverCard 
                  key={`mention-${index}`}
                  pubkey={pubkey || ''}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  <Link to={getProfileUrl(identifier)}>
                    @{shortenIdentifier(identifier)}
                  </Link>
                </ProfileHoverCard>
              );
            } else if (identifier.startsWith('note') || identifier.startsWith('nevent')) {
              // Event mention
              return (
                <Link 
                  key={`note-${index}`}
                  to={getEventUrl(identifier)}
                  className="text-primary font-medium hover:underline"
                >
                  #{shortenIdentifier(identifier)}
                </Link>
              );
            }
          }
          
          // Detect @ mentions and match with p-tags
          if (part.startsWith('@') && part.length > 1) {
            // Try to find a matching p-tag for this @ mention
            // This is a heuristic and not exact, but works for many cases
            const username = part.substring(1);
            
            // Check if we have any p-tags that might match this username
            // In a perfect implementation, we'd have a mapping from usernames to pubkeys
            // For now, we'll just link to the @ mention without a profile hover
            
            // If we have p-tags, try to use the first one as a fallback
            if (pTags.length > 0) {
              const pubkey = pTags[0][1]; // Just use the first p-tag's pubkey
              
              return (
                <ProfileHoverCard 
                  key={`mention-${index}`}
                  pubkey={pubkey}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  {part}
                </ProfileHoverCard>
              );
            }
            
            // Regular @ mention without hover
            return (
              <span key={`mention-${index}`} className="text-primary font-medium cursor-pointer hover:underline">
                {part}
              </span>
            );
          }
          
          // Detect hashtags
          if (part.startsWith('#') && part.length > 1) {
            return (
              <span key={`hashtag-${index}`} className="text-primary cursor-pointer hover:underline">
                {part}
              </span>
            );
          }
          
          // Detect URLs
          if (part.match(/^https?:\/\//i)) {
            return (
              <a 
                key={`url-${index}`}
                href={part} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {part}
              </a>
            );
          }
          
          // Check for NIP-08 position-based mentions
          // This would iterate through each character and check if it's a mention position
          // But for simplicity we're not implementing the full algorithm here
          
          // Check beginning of this part for potential mention positions
          const partStartPosition = content.indexOf(part);
          if (partStartPosition >= 0 && mentionPositions.has(partStartPosition)) {
            const pubkey = mentionPositions.get(partStartPosition);
            if (pubkey) {
              return (
                <ProfileHoverCard 
                  key={`position-mention-${index}`}
                  pubkey={pubkey}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  {part}
                </ProfileHoverCard>
              );
            }
          }
        } catch (error) {
          console.error('Error processing content part:', part, error);
          // Return the part as plain text if processing fails
          return part;
        }
        
        // Return regular text
        return part;
      });
      
      return <>{formattedParts}</>;
    } catch (error) {
      console.error('Error formatting content:', error);
      // Return content as plain text if processing fails
      return <>{content}</>;
    }
  },
  
  /**
   * Format a Nostr event content with additional processing for note references
   */
  formatEventContent: (content: string, event?: NostrEvent): React.JSX.Element => {
    try {
      return contentFormatter.formatContent(content, event);
    } catch (error) {
      console.error('Error formatting event content:', error);
      return <>{content}</>;
    }
  },

  /**
   * Process content and return a string (non-React version)
   * This is used for plain text operations like sending messages
   */
  processContent: (content: string): string => {
    if (!content || typeof content !== 'string') return '';
    
    try {
      // For now, we'll just return the content as is
      // In a more advanced implementation, we could add automatic tagging
      // based on @mentions in the content
      return content;
    } catch (error) {
      console.error('Error processing content:', error);
      return content;
    }
  },

  /**
   * Parse content and break it into segments for more advanced processing
   */
  parseContent: (content: string, event?: NostrEvent) => {
    if (!content || typeof content !== 'string') return [];
    
    try {
      // Extract mentions from content
      const segments = [];
      
      // Get tags from the event if available
      const tags = event?.tags || [];
      
      // Map p-tag mentions to positions in the content (NIP-08)
      const mentionPositions = mapMentionPositions(content, tags);
      
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
          // Try to find a matching p-tag for this @ mention
          const username = mention.substring(1);
          // In a proper implementation, we'd map this username to a pubkey if possible
          
          segments.push({
            type: 'mention',
            content: mention,
            data: username // Remove @ symbol
          });
        } else if (mention.startsWith('nostr:')) {
          let pubkey = null;
          try {
            pubkey = getHexFromNostrUrl(mention);
          } catch (e) {
            // Ignore errors
          }
          
          segments.push({
            type: 'mention',
            content: mention,
            data: mention, // Keep full nostr: URL
            pubkey: pubkey
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
      
      // Process NIP-08 position-based mentions
      // This would be more complex, checking positions and inserting appropriate segments
      
      return segments.length > 0 ? segments : [{
        type: 'text',
        content: content
      }];
    } catch (error) {
      console.error('Error parsing content:', error);
      return [{
        type: 'text',
        content: content
      }];
    }
  },

  /**
   * Extract mentioned pubkeys from content and tags
   */
  extractMentionedPubkeys: (content: string, tags: string[][]) => {
    // First get pubkeys from p tags
    const pubkeys: string[] = [];
    
    try {
      if (tags && Array.isArray(tags)) {
        tags.forEach(tag => {
          if (Array.isArray(tag) && tag[0] === 'p' && tag[1]) {
            pubkeys.push(tag[1]);
          }
        });
      }
      
      // Then extract pubkeys from nostr: URLs in content
      if (content && typeof content === 'string') {
        const nostrRegex = /nostr:npub1[a-z0-9]+/gi;
        const matches = content.match(nostrRegex);
        
        if (matches) {
          matches.forEach(match => {
            try {
              const pubkey = getHexFromNostrUrl(match);
              if (pubkey && !pubkeys.includes(pubkey)) {
                pubkeys.push(pubkey);
              }
            } catch (error) {
              console.error('Error extracting pubkey from nostr URL:', match, error);
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
