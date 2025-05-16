
import React, { useEffect, useState } from "react";
import { NostrEvent } from "@/lib/nostr/types";
import ArticleList from "./ArticleList";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { ArticleSearchParams } from "@/lib/nostr/types/article";

interface ArticleFeedProps {
  type: "latest" | "trending" | "following" | "search";
  searchQuery?: string;
  hashtag?: string;
  authorPubkey?: string;
  limit?: number;
}

const ArticleFeed: React.FC<ArticleFeedProps> = ({
  type,
  searchQuery = "",
  hashtag,
  authorPubkey,
  limit = 20
}) => {
  const [articles, setArticles] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!nostrAdapter.publicKey;
  
  useEffect(() => {
    setLoading(true);
    console.log(`Fetching ${type} articles...`);
    
    const fetchArticles = async () => {
      try {
        let fetchedArticles: NostrEvent[] = [];
        
        const params: ArticleSearchParams = {
          limit,
          // Default sort by recent
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30, // Last 30 days
        };
        
        switch (type) {
          case "latest":
            console.log("Fetching latest articles with params:", params);
            fetchedArticles = await nostrAdapter.article.searchArticles(params);
            break;
            
          case "trending":
            // For trending, we'll simulate with most recent for now
            console.log("Fetching trending articles");
            fetchedArticles = await nostrAdapter.article.searchArticles({
              ...params,
              since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 7, // Last 7 days
            });
            break;
            
          case "following":
            if (isLoggedIn) {
              console.log("Fetching following articles");
              // Get users the current user is following
              const following = nostrAdapter.social.following || [];
              
              if (following.length > 0) {
                params.author = following.join('|'); // This is simplified; real impl would need multiple queries
                fetchedArticles = await nostrAdapter.article.searchArticles(params);
              }
            }
            break;
            
          case "search":
            console.log("Searching articles with params:", { searchQuery, hashtag, authorPubkey });
            if (searchQuery) {
              params.query = searchQuery;
            }
            if (hashtag) {
              params.hashtag = hashtag;
            }
            if (authorPubkey) {
              params.author = authorPubkey;
            }
            fetchedArticles = await nostrAdapter.article.searchArticles(params);
            break;
        }
        
        console.log(`Found ${fetchedArticles.length} articles for ${type}`, fetchedArticles);
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, [type, searchQuery, hashtag, authorPubkey, isLoggedIn, limit]);
  
  let emptyMessage = "No articles found";
  
  switch (type) {
    case "latest":
      emptyMessage = "No recent articles found";
      break;
    case "trending":
      emptyMessage = "No trending articles found";
      break;
    case "following":
      emptyMessage = isLoggedIn 
        ? "No articles from people you follow" 
        : "Login to see articles from people you follow";
      break;
    case "search":
      emptyMessage = searchQuery
        ? `No articles found for "${searchQuery}"`
        : hashtag
          ? `No articles found with tag #${hashtag}`
          : "No articles found";
      break;
  }
  
  return (
    <ArticleList 
      articles={articles} 
      loading={loading} 
      emptyMessage={emptyMessage}
    />
  );
};

export default ArticleFeed;
