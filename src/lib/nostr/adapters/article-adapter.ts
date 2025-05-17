import { NostrEvent } from '../types';
import { ArticleDraft, ArticleMetadata, ArticleSearchParams, ArticleVersion } from '../types/article';
import { getTagValue } from '../utils/nip/nip10';

/**
 * Adapter for handling NIP-23 long-form content (Articles)
 */
export class ArticleAdapter {
  private service: any;
  private storagePrefix = 'blocknoster_article_draft_';
  
  constructor(service: any) {
    this.service = service;
  }
  
  /**
   * Publish a new article or update existing one
   * Implements NIP-23 long-form content
   */
  async publishArticle(
    title: string,
    content: string,
    metadata: Partial<ArticleMetadata> = {},
    tags: string[][] = [],
    articleId?: string // if updating existing article
  ): Promise<string | null> {
    if (!this.service.publicKey) {
      console.error('Cannot publish article: User not logged in');
      return null;
    }
    
    if (!title || !content) {
      console.error('Cannot publish article: Title and content are required');
      return null;
    }
    
    try {
      // Prepare the event according to NIP-23
      const event: any = {
        kind: 30023, // NIP-23 long-form content
        content: content,
        tags: [
          ['title', title],
          ...tags
        ]
      };
      
      // Add optional metadata as tags
      if (metadata.summary) event.tags.push(['summary', metadata.summary]);
      if (metadata.image) event.tags.push(['image', metadata.image]);
      if (metadata.published_at) event.tags.push(['published_at', metadata.published_at.toString()]);
      
      // Add hashtags
      if (metadata.hashtags && metadata.hashtags.length > 0) {
        metadata.hashtags.forEach(tag => {
          event.tags.push(['t', tag]);
        });
      }
      
      // For article updates, reference the previous version
      if (articleId) {
        event.tags.push(['e', articleId, '', 'root']);
      }
      
      console.log('Publishing article with event:', event);
      
      // Publish the event
      const eventId = await this.service.publishEvent(event);
      
      if (eventId) {
        console.log(`Article published successfully with event ID: ${eventId}`);
        return eventId;
      } else {
        console.warn('Failed to publish article');
        return null;
      }
    } catch (error) {
      console.error('Error publishing article:', error);
      return null;
    }
  }
  
  /**
   * Get an article by its event ID
   */
  async getArticleById(id: string): Promise<NostrEvent | null> {
    try {
      return await this.service.getEventById(id);
    } catch (error) {
      console.error(`Error fetching article with ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Get articles authored by a specific user
   */
  async getArticlesByAuthor(pubkey: string, limit: number = 10): Promise<NostrEvent[]> {
    try {
      console.log(`Fetching articles by author ${pubkey}`);
      const filters = [
        {
          authors: [pubkey],
          kinds: [30023], // NIP-23 long-form content
          limit
        }
      ];
      
      // Use the pool to query events from relays
      const events = await this.service.queryEvents(filters);
      console.log(`Found ${events.length} articles by author ${pubkey}`);
      return events;
    } catch (error) {
      console.error(`Error fetching articles by author ${pubkey}:`, error);
      return [];
    }
  }
  
  /**
   * Search for articles using various criteria
   */
  async searchArticles(params: ArticleSearchParams): Promise<NostrEvent[]> {
    try {
      const { query, author, hashtag, since, until, limit = 20 } = params;
      console.log("ArticleAdapter: Searching articles with params:", params);
      
      // Build the filter
      const filter: any = {
        kinds: [30023], // NIP-23 long-form content
        limit
      };
      
      if (author) filter.authors = [author];
      if (since) filter.since = since;
      if (until) filter.until = until;
      
      // Add tag filtering if hashtag is specified
      if (hashtag) {
        filter['#t'] = [hashtag];
      }
      
      console.log("Using filter:", filter);
      
      // Execute the query
      let events = await this.service.queryEvents([filter]);
      console.log(`Query returned ${events.length} articles`);
      
      // If there's a text query, filter results client-side
      if (query && query.trim().length > 0) {
        const lowerQuery = query.toLowerCase();
        events = events.filter((event: NostrEvent) => {
          // Check the title tag
          const title = getTagValue(event, 'title')?.toLowerCase();
          if (title && title.includes(lowerQuery)) return true;
          
          // Check the summary tag
          const summary = getTagValue(event, 'summary')?.toLowerCase();
          if (summary && summary.includes(lowerQuery)) return true;
          
          // Check the content
          return event.content.toLowerCase().includes(lowerQuery);
        });
        console.log(`After text filtering, found ${events.length} articles`);
      }
      
      return events;
    } catch (error) {
      console.error("Error searching articles:", error);
      return [];
    }
  }
  
  /**
   * Get recommended articles based on user preferences
   */
  async getRecommendedArticles(limit: number = 10): Promise<NostrEvent[]> {
    // Start with a general recent articles search
    const recentArticles = await this.searchArticles({
      limit,
      since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 7, // Last week
    });
    
    // TODO: Implement more sophisticated recommendation algorithm based on:
    // 1. User's followed authors
    // 2. Hashtags user has interacted with
    // 3. Popularity metrics
    
    return recentArticles;
  }
  
  /**
   * Save article draft to local storage
   */
  saveDraft(draft: ArticleDraft): string {
    const id = draft.id || `draft_${Date.now()}`;
    const draftWithId = { ...draft, id, updatedAt: Date.now() };
    
    localStorage.setItem(
      `${this.storagePrefix}${id}`,
      JSON.stringify(draftWithId)
    );
    
    return id;
  }
  
  /**
   * Get a specific draft by ID
   */
  getDraft(id: string): ArticleDraft | null {
    const draft = localStorage.getItem(`${this.storagePrefix}${id}`);
    return draft ? JSON.parse(draft) : null;
  }
  
  /**
   * List all saved drafts
   */
  getAllDrafts(): ArticleDraft[] {
    const drafts: ArticleDraft[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const draft = localStorage.getItem(key);
        if (draft) {
          drafts.push(JSON.parse(draft));
        }
      }
    }
    
    // Sort by updatedAt, newest first
    return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * Delete a draft
   */
  deleteDraft(id: string): boolean {
    localStorage.removeItem(`${this.storagePrefix}${id}`);
    return true;
  }
  
  /**
   * Get previous versions of an article
   * Using NIP-10 (e tag with reply marker) to find versions
   */
  async getArticleVersions(articleId: string): Promise<ArticleVersion[]> {
    try {
      // Find all events that reference this article
      const filter = {
        kinds: [30023],
        '#e': [articleId]
      };
      
      const events = await this.service.queryEvents([filter]);
      
      // Parse into version objects
      const versions: ArticleVersion[] = events.map((event: NostrEvent) => ({
        eventId: event.id,
        createdAt: event.created_at,
        title: getTagValue(event, 'title') || 'Untitled',
        summary: getTagValue(event, 'summary')
      }));
      
      // Sort by creation date, newest first
      return versions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error(`Error fetching article versions for ${articleId}:`, error);
      return [];
    }
  }
}
