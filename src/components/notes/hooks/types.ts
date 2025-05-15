
// Add or update the Note interface to include all required fields
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
  event: any; // Make event required, not optional
  slug?: string; // Add slug field for compatibility with notes
  encryptionMetadata?: {
    contentSalt?: string;
    titleSalt?: string;
    method?: string;
  };
}
