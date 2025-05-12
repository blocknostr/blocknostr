
// Add or update the Note interface to include createdAt
export interface Note {
  id: string;
  author: string;
  content: string;
  title?: string;
  language?: string;
  publishedAt?: string;
  tags?: string[];
  encrypted?: boolean;
  createdAt?: number; // Add this field for compatibility
  event?: any; // Add event field to store the original NostrEvent
}
