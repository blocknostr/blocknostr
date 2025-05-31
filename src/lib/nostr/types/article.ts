import { NostrEvent } from './index';

/**
 * ✅ FIXED: Unified Article type with proper ID management
 */
export interface Article {
  // ✅ CRITICAL: Stable local ID that never changes
  id: string;                    // Local UUID that stays consistent
  
  // ✅ CRITICAL: Separate tracking for Nostr events
  localId: string;              // Same as id, for clarity
  publishedEventId?: string;    // Nostr event ID when published (different from id)
  
  // Author
  authorPubkey: string;
  
  // Content
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  image?: string;
  hashtags: string[];
  language?: string;
  category?: string;
  
  // ✅ CRITICAL: Clear status tracking
  status: 'draft' | 'published';
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;         // When it was published to Nostr
  
  // Nostr integration
  nostrEvent?: NostrEvent;      // Full Nostr event for published articles
  
  // Local features
  encrypted?: boolean;
  tags?: string[];
}

/**
 * ✅ ID Generation utilities
 */
export const generateArticleId = (): string => {
  return `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Article creation/editing form data
 */
export interface ArticleFormData {
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  image?: string;
  hashtags: string[];
  language?: string;
  category?: string;
}

/**
 * Article analytics data
 */
export interface ArticleMetrics {
  eventId: string;
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  views?: number;
}

/**
 * Article search/filter parameters
 */
export interface ArticleSearchParams {
  query?: string;
  status?: 'draft' | 'published' | 'all';
  hashtag?: string;
  category?: string;
  since?: number;
  until?: number;
  limit?: number;
  sortBy?: 'newest' | 'oldest' | 'updated' | 'title';
}

/**
 * Legacy interfaces for backwards compatibility
 */
export interface ArticleMetadata {
  title: string;
  summary?: string;
  published_at?: number;
  image?: string;
  hashtags?: string[];
  category?: string;
  subtitle?: string;
  language?: string;
  geo?: string;
}

// @deprecated Use Article instead
export interface ArticleDraft {
  id?: string;
  title: string;
  subtitle?: string;
  content: string;
  summary?: string;
  image?: string;
  hashtags: string[];
  createdAt: number;
  updatedAt: number;
  published: boolean;
  publishedId?: string;
  originalDraftId?: string;
}

export interface ArticleVersion {
  eventId: string;
  createdAt: number;
  title: string;
  summary?: string;
}

