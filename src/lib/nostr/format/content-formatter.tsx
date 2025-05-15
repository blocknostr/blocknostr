
import React from 'react';
import { ContentFormatterInterface, FormattedSegment } from './types';
import { 
  isNostrUrl, 
  getHexFromNostrUrl, 
  getProfileUrl, 
  getEventUrl, 
  shortenIdentifier,
  normalizeToHexPubkey,
  resolvePubkeyFromUsername
} from '../utils/nip/nip27';
import { 
  mapMentionPositions, 
  isPotentialMention, 
  parseMentions,
  getTaggedPubkeys,
  findAtMentions 
} from '../utils/nip/nip08';
import ProfileHoverCard from '@/components/profile/ProfileHoverCard';
import { Link } from 'react-router-dom';
import { NostrEvent } from '../types';
import { isValidHexPubkey } from '../utils/keys';

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
      
      // Parse out mentions according to standards
      const parsedMentions = parseMentions(content, tags);
      
      // Split content by spaces to identify potential entities
      const parts = content.split(/(\s+)/);
      
      // Process each part
      const formattedParts = parts.map((part, index) => {
        if (!part) return null;
        
        try {
          // Detect nostr: URLs (NIP-27)
          if (part.startsWith('nostr:')) {
            const identifier = part.substring(6); // Remove 'nostr:'
            
            // Handle profile-type identifiers
            if (identifier.startsWith('npub') || identifier.startsWith('nprofile') || 
                (identifier.length === 64 && /^[0-9a-f]{64}$/i.test(identifier))) {
              // Get the hex pubkey from the identifier
              let pubkey;
              try {
                pubkey = normalizeToHexPubkey(identifier);
              } catch (e) {
                pubkey = null;
              }
              
              // Only render as a profile if we have a valid pubkey
              if (pubkey && isValidHexPubkey(pubkey)) {
                return (
                  <ProfileHoverCard 
                    key={`mention-${index}`}
                    pubkey={pubkey}
                    className="text-primary font-medium hover:underline cursor-pointer"
                  >
                    <Link to={getProfileUrl(identifier)}>
                      @{shortenIdentifier(identifier)}
                    </Link>
                  </ProfileHoverCard>
                );
              }
            } 
            // Handle note/event-type identifiers
            else if (identifier.startsWith('note') || identifier.startsWith('nevent')) {
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
            const username = part.substring(1);
            let matchedPubkey = null;
            
            // First, check if we have any p-tags that match this username
            for (const tag of pTags) {
              // Check if tag has a suggested NIP-05 identifier that matches
              if (tag.length >= 3 && tag[2] && tag[2].includes('@')) {
                const parts = tag[2].split('@');
                if (parts[0] === username) {
                  matchedPubkey = tag[1];
                  break;
                }
              }
            }
            
            // If we found a match, render with ProfileHoverCard
            if (matchedPubkey && isValidHexPubkey(matchedPubkey)) {
              return (
                <ProfileHoverCard 
                  key={`mention-${index}`}
                  pubkey={matchedPubkey}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  {part}
                </ProfileHoverCard>
              );
            }
            
            // If no direct match, use first p-tag as fallback
            // This is not ideal but better than nothing for backward compatibility
            if (pTags.length > 0) {
              const pubkey = pTags[0][1];
              if (isValidHexPubkey(pubkey)) {
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
            }
            
            // Regular @ mention without hover if no match found
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
          // The content.indexOf(part) finds the starting position of this part in the original string
          const partStartPosition = content.indexOf(part);
          if (partStartPosition >= 0) {
            // Check if any of our mention positions match the beginning of this part
            for (const [position, pubkey] of mentionPositions.entries()) {
              // If the position is within this part's range (+/- 1 character for fuzzy matching)
              if (position >= partStartPosition - 1 && position <= partStartPosition + 1) {
                // Make sure the pubkey is valid
                if (isValidHexPubkey(pubkey)) {
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
  parseContent: (content: string, event?: NostrEvent): FormattedSegment[] => {
    if (!content || typeof content !== 'string') return [];
    
    try {
      // Extract mentions from content
      const segments = [];
      
      // Get tags from the event if available
      const tags = event?.tags || [];
      
      // Map p-tag mentions to positions in the content (NIP-08)
      const mentionPositions = mapMentionPositions(content, tags);
      
      // Find all nostr: URLs and @ mentions using improved regex patterns
      const mentionRegex = /(@\w+|nostr:(npub|note|nevent|nprofile)1[a-z0-9]+|nostr:[0-9a-f]{64})/gi;
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
      // We can enhance this in the future to better handle position-based mentions
      
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
  extractMentionedPubkeys: (content: string, tags: string[][]): string[] => {
    const pubkeys: string[] = [];
    
    try {
      // First get pubkeys from p tags
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          if (Array.isArray(tag) && tag[0] === 'p' && tag[1]) {
            const pubkey = normalizeToHexPubkey(tag[1]);
            if (pubkey && !pubkeys.includes(pubkey)) {
              pubkeys.push(pubkey);
            }
          }
        }
      }
      
      // Then extract pubkeys from nostr: URLs in content
      if (content && typeof content === 'string') {
        // Use the improved regex pattern that handles all valid formats
        const nostrRegex = /nostr:(npub1[a-z0-9]+|[0-9a-f]{64})/gi;
        const matches = content.match(nostrRegex);
        
        if (matches) {
          for (const match of matches) {
            try {
              const pubkey = getHexFromNostrUrl(match);
              if (pubkey && isValidHexPubkey(pubkey) && !pubkeys.includes(pubkey)) {
                pubkeys.push(pubkey);
              }
            } catch (error) {
              console.error('Error extracting pubkey from nostr URL:', match, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error extracting mentioned pubkeys:', error);
    }
    
    return pubkeys;
  }
};
