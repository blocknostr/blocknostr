
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NostrEvent } from "@/lib/nostr/types";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { getTagValue } from "@/lib/nostr/utils/nip/nip10";
import { formatPubkey } from "@/lib/nostr/utils/keys";

const ArticleFeatured: React.FC = () => {
  const [featuredArticle, setFeaturedArticle] = useState<NostrEvent | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchFeaturedArticle = async () => {
      try {
        // For now, just get the most recent article as featured
        const articles = await nostrAdapter.searchArticles({
          limit: 1,
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 7 // Last week
        });
        
        if (articles.length > 0) {
          setFeaturedArticle(articles[0]);
        }
      } catch (error) {
        console.error("Error fetching featured article:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedArticle();
  }, []);
  
  if (loading) {
    return (
      <Card className="bg-accent/20">
        <div className="animate-pulse p-8 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2">
            <div className="h-8 bg-accent/30 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-accent/30 rounded w-1/2 mb-6"></div>
            <div className="h-4 bg-accent/30 rounded w-full mb-2"></div>
            <div className="h-4 bg-accent/30 rounded w-full mb-2"></div>
            <div className="h-4 bg-accent/30 rounded w-3/4 mb-6"></div>
            <div className="h-10 bg-accent/30 rounded w-32"></div>
          </div>
          <div className="w-full md:w-1/2 h-64 bg-accent/30 rounded"></div>
        </div>
      </Card>
    );
  }
  
  if (!featuredArticle) {
    return null; // Don't show any featured section if no article found
  }
  
  // Extract article details
  const title = getTagValue(featuredArticle, 'title') || "Untitled Article";
  const summary = getTagValue(featuredArticle, 'summary') || featuredArticle.content.slice(0, 200);
  const image = getTagValue(featuredArticle, 'image');
  const hashtags = featuredArticle.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1]);
  
  return (
    <Card className="overflow-hidden bg-accent/20">
      <CardContent className="p-0">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 space-y-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">
                <Link to={`/articles/view/${featuredArticle.id}`} className="hover:underline">
                  {title}
                </Link>
              </h2>
              
              <Link 
                to={`/profile/${featuredArticle.pubkey}`}
                className="text-sm font-medium hover:underline text-muted-foreground"
              >
                By {formatPubkey(featuredArticle.pubkey, 'short')}
              </Link>
            </div>
            
            <p className="text-muted-foreground line-clamp-4">
              {summary}
            </p>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {hashtags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
            
            <Button asChild className="mt-2">
              <Link to={`/articles/view/${featuredArticle.id}`}>
                Read Article
              </Link>
            </Button>
          </div>
          
          {image && (
            <div className="w-full md:w-1/2">
              <Link to={`/articles/view/${featuredArticle.id}`} className="block">
                <div className="aspect-[4/3] overflow-hidden rounded-md">
                  <img 
                    src={image} 
                    alt={title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticleFeatured;
