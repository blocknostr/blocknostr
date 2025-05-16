
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NostrEvent } from "@/lib/nostr/types";
import { formatPubkey } from "@/lib/nostr/utils/keys";
import MarkdownRenderer from "@/components/articles/MarkdownRenderer";

interface ArticleReaderProps {
  article: NostrEvent;
  title: string;
  image?: string;
  publishedAt: number;
  hashtags?: string[];
}

const ArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  title,
  image,
  publishedAt,
  hashtags = []
}) => {
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return (
    <article className="prose dark:prose-invert max-w-none">
      <h1 className="text-4xl font-bold tracking-tight mt-2 mb-4">
        {title}
      </h1>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link 
          to={`/profile/${article.pubkey}`}
          className="font-medium no-underline hover:underline"
        >
          {formatPubkey(article.pubkey)}
        </Link>
        <span>•</span>
        <time dateTime={new Date(publishedAt).toISOString()}>
          {formattedDate}
        </time>
      </div>
      
      {image && (
        <div className="my-6 overflow-hidden rounded-lg">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-auto object-cover"
          />
        </div>
      )}
      
      <div className="mt-4">
        <MarkdownRenderer content={article.content} />
      </div>
      
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {hashtags.map(tag => (
            <Badge key={tag} variant="secondary" className="cursor-pointer">
              <Link to={`/articles?tag=${tag}`} className="no-underline">
                #{tag}
              </Link>
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
};

export default ArticleReader;
