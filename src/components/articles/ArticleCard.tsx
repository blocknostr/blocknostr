
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Pencil, Trash } from "lucide-react";
import { NostrEvent } from "@/lib/nostr/types";
import { getTagValue } from "@/lib/nostr/utils/nip/nip10";
import { formatPubkey } from "@/lib/nostr/utils/keys";
import { formatDistanceToNow } from "date-fns";
import { ArticleDraft } from "@/lib/nostr/types/article";

interface ArticleCardProps {
  article: NostrEvent;
  showAuthor?: boolean;
  isEditable?: boolean;
  onDelete?: (id: string) => void;
}

interface DraftCardProps {
  draft: ArticleDraft;
  onDelete?: (id: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  showAuthor = true,
  isEditable = false,
  onDelete
}) => {
  const title = getTagValue(article, 'title') || "Untitled Article";
  const summary = getTagValue(article, 'summary') || article.content.slice(0, 150);
  const image = getTagValue(article, 'image');
  const publishedAt = article.created_at * 1000;
  const hashtags = article.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1]);
  
  const timeAgo = formatDistanceToNow(publishedAt, { addSuffix: true });
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {image && (
        <Link to={`/articles/view/${article.id}`} className="block">
          <div className="aspect-video overflow-hidden">
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          </div>
        </Link>
      )}
      
      <CardContent className={`${image ? 'pt-6' : 'pt-6'} flex-grow`}>
        <Link to={`/articles/view/${article.id}`} className="block">
          <h3 className="text-xl font-bold line-clamp-2 hover:underline">{title}</h3>
        </Link>
        
        {showAuthor && (
          <div className="flex items-center gap-2 mt-2 mb-3">
            <Link 
              to={`/profile/${article.pubkey}`}
              className="text-sm font-medium hover:underline text-muted-foreground"
            >
              {formatPubkey(article.pubkey)}
            </Link>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        )}
        
        <p className="text-muted-foreground line-clamp-3 mt-2 text-sm">
          {summary}
        </p>
        
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {hashtags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {hashtags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{hashtags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      {isEditable && (
        <CardFooter className="border-t p-4">
          <div className="flex justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart size={14} />
                0
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={14} />
                0
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/articles/edit/${article.id}`}>
                  <Pencil size={14} />
                </Link>
              </Button>
              
              {onDelete && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-destructive"
                  onClick={() => onDelete(article.id)}
                >
                  <Trash size={14} />
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export const DraftCard: React.FC<DraftCardProps> = ({
  draft,
  onDelete
}) => {
  const timeAgo = formatDistanceToNow(draft.updatedAt, { addSuffix: true });
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <CardContent className="pt-6 flex-grow">
        <Link to={`/articles/edit/${draft.id}`} className="block">
          <h3 className="text-xl font-bold line-clamp-2 hover:underline">
            {draft.title || "Untitled Draft"}
          </h3>
        </Link>
        
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">Draft</Badge>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            Updated {timeAgo}
          </span>
        </div>
        
        <p className="text-muted-foreground line-clamp-3 mt-2 text-sm">
          {draft.summary || draft.content.slice(0, 150)}
        </p>
        
        {draft.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {draft.hashtags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {draft.hashtags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{draft.hashtags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <div className="flex justify-between w-full">
          <div className="text-sm text-muted-foreground">
            {draft.published ? (
              <Badge variant="default" className="bg-green-600">Published</Badge>
            ) : (
              <Badge variant="outline">Not Published</Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/articles/edit/${draft.id}`}>
                <Pencil size={14} />
              </Link>
            </Button>
            
            {onDelete && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-destructive"
                onClick={() => onDelete(draft.id || '')}
              >
                <Trash size={14} />
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ArticleCard;
