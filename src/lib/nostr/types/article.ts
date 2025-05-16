
export interface ArticleMetadata {
  title: string;
  summary?: string;
  published_at?: number;  // timestamp
  image?: string;         // URL to cover image
  hashtags?: string[];    // list of tags/topics
  category?: string;      // primary category
  subtitle?: string;      // optional subtitle
  language?: string;      // content language (ISO)
  geo?: string;           // optional geolocation
}

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
  publishedId?: string;   // ID of the published article event
}

export interface ArticleVersion {
  eventId: string;
  createdAt: number;
  title: string;
  summary?: string;
}

export interface ArticleSearchParams {
  query?: string;
  author?: string;
  hashtag?: string;
  category?: string;
  since?: number;
  until?: number;
  limit?: number;
}
