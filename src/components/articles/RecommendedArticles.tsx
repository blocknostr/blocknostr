
import React, { useEffect, useState } from "react";
import { NostrEvent } from "@/lib/nostr/types";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import ArticleList from "./ArticleList";

const RecommendedArticles: React.FC = () => {
  const [articles, setArticles] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecommendedArticles = async () => {
      try {
        const recommended = await nostrAdapter.getRecommendedArticles(6);
        setArticles(recommended);
      } catch (error) {
        console.error("Error fetching recommended articles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendedArticles();
  }, []);
  
  return (
    <ArticleList 
      articles={articles} 
      loading={loading} 
      emptyMessage="No recommended articles available yet"
    />
  );
};

export default RecommendedArticles;
