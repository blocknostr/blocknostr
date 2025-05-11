
export interface Note {
  id: string;
  title: string;
  content: string;
  language: string;
  publishedAt: string;
  author: string;
  event: any;
  tags?: string[];
  summary?: string;
  image?: string;
  slug?: string;
  version?: number;
}

// NIP-23 specific types
export interface Nip23Note extends Note {
  summary: string;
  slug: string;
  image?: string;
}

// NIP-33 versioning support
export interface NoteVersion {
  version: number;
  content: string;
  publishedAt: string;
  summary?: string;
}
