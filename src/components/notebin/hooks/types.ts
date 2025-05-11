
export interface Note {
  id: string;
  title: string;
  content: string;
  language: string;
  publishedAt: string;
  author: string;
  event: any;
  tags?: string[];
}
