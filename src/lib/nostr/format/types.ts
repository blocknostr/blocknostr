
import { NostrEvent } from '@/lib/nostr';

export interface FormattedSegment {
  type: 'text' | 'mention' | 'hashtag' | 'url' | 'media-url';
  content: string;
  data?: string;
  shouldRender?: boolean;
}

export interface ContentFormatterInterface {
  parseContent(content: string, event?: NostrEvent): FormattedSegment[];
  extractMentionedPubkeys(content: string, tags: string[][]): string[];
  formatContent(content: string, event?: NostrEvent): React.JSX.Element;
  formatEventContent(content: string, event?: NostrEvent): React.JSX.Element;
  // Add a new method to process content and return a string
  processContent(content: string): string;
}
