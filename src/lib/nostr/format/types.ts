
import React from 'react';

export interface FormattedSegment {
  type: 'text' | 'mention' | 'hashtag' | 'url' | 'media-url';
  content: string;
  data?: string;
  shouldRender?: boolean;
}

export interface ContentFormatterInterface {
  parseContent: (content: string, mediaUrls?: string[]) => FormattedSegment[];
  extractMentionedPubkeys: (content: string, tags: string[][]) => string[];
  formatContent: (content: string, mediaUrls?: string[]) => JSX.Element;
}
