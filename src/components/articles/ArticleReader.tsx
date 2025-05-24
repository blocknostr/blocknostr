
import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NostrEvent } from "@/lib/nostr/types";
import { formatPubkey } from "@/lib/nostr/utils/keys";
import MarkdownRenderer from "@/components/articles/MarkdownRenderer";
import { getImageUrlsFromEvent, getMediaItemsFromEvent, MediaItem } from "@/lib/nostr/utils/media/media-extraction";

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
  
  // Get all media items from the article
  const mediaItems = getMediaItemsFromEvent(article);
  const imageItems = mediaItems.filter(item => item.type === 'image');
  
  // If we have the main image passed in, filter it out from the others
  const contentImages = image 
    ? imageItems.filter(item => item.url !== image)
    : imageItems;
  
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
      
      {/* Main featured image */}
      {image && (
        <div className="my-6 overflow-hidden rounded-lg">
          <img 
            src={image} 
            alt={title} 
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      <div className="mt-4">
        <MarkdownRenderer content={article.content} />
      </div>
      
      {/* Display additional images that weren't already shown as the featured image */}
      {contentImages.length > 0 && (
        <div className="my-6 space-y-4">
          {contentImages.map((item, index) => (
            <figure key={index} className="overflow-hidden rounded-lg">
              <img 
                src={item.url} 
                alt={item.alt || `Image ${index + 1}`} 
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              {item.alt && (
                <figcaption className="text-sm text-center mt-2 text-muted-foreground">
                  {item.alt}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
      
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
