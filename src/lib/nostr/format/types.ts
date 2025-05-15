
export interface FormattedSegment {
  type: 'text' | 'mention' | 'hashtag' | 'url' | 'media-url';
  content: string;
  data?: string;
  shouldRender?: boolean;
}

export interface ContentFormatterInterface {
  parseContent(content: string, mediaUrls?: string[]): FormattedSegment[];
  extractMentionedPubkeys(content: string, tags: string[][]): string[];
  formatContent(content: string, mediaUrls?: string[]): React.JSX.Element;
  formatEventContent(content: string, eventReferences?: Record<string, any>): React.JSX.Element;
  // Add a new method to process content and return a string
  processContent(content: string): string;
}
