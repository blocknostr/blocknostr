
import React from 'react';
import { FormattedSegment, ContentFormatterInterface } from './types';
import { segmentParser } from './parsers/segment-parser';
import { extractMentionedPubkeys } from './extractors/mention-extractor';
import { renderSegment } from './renderers/segment-renderer';

/**
 * Content formatter that parses and formats note content
 */
export class ContentFormatter implements ContentFormatterInterface {
  /**
   * Parse content into formatted segments
   */
  parseContent(content: string, mediaUrls?: string[]): FormattedSegment[] {
    // Parse content into segments
    const segments = segmentParser(content);
    
    // Hide media URLs from display if they exist in the mediaUrls array
    if (mediaUrls && mediaUrls.length > 0) {
      return segments.map(segment => {
        if (segment.type === 'url' && mediaUrls.includes(segment.data || '')) {
          return { ...segment, shouldRender: false };
        }
        return segment;
      });
    }
    
    return segments;
  }
  
  /**
   * Extract pubkeys mentioned in content and tags
   */
  extractMentionedPubkeys(content: string, tags: string[][]): string[] {
    return extractMentionedPubkeys(content, tags);
  }
  
  /**
   * Format content into React elements
   */
  formatContent(content: string, mediaUrls?: string[]): JSX.Element {
    const segments = this.parseContent(content, mediaUrls);
    
    return (
      <>
        {segments.map((segment, index) => renderSegment(segment, index))}
      </>
    );
  }
}

// Create and export a singleton instance
export const contentFormatter = new ContentFormatter();
