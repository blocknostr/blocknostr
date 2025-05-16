
import React, { useEffect, useState } from "react";
import { NostrEvent } from "@/lib/nostr/types";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import ArticleList from "./ArticleList";

interface RelatedArticlesProps {
  hashtags: string[];
  excludeId?: string;
  limit?: number;
}

const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  hashtags,
  excludeId,
  limit = 3
}) => {
  const [articles, setArticles] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!hashtags.length) {
      setLoading(false);
      return;
    }
    
    const fetchRelatedArticles = async () => {
      try {
        // Use the first hashtag as the primary filter
        const relatedArticles = await nostrAdapter.searchArticles({
          hashtag: hashtags[0],
          limit: limit + 1 // Fetch extra in case we need to exclude current
        });
        
        // Filter out the current article
        const filteredArticles = excludeId 
          ? relatedArticles.filter(article => article.id !== excludeId)
          : relatedArticles;
        
        setArticles(filteredArticles.slice(0, limit));
      } catch (error) {
        console.error("Error fetching related articles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelatedArticles();
  }, [hashtags, excludeId, limit]);
  
  return (
    <ArticleList 
      articles={articles} 
      loading={loading} 
      emptyMessage="No related articles found"
    />
  );
};

export default RelatedArticles;
