import React, { useState, useEffect } from "react";
import { NostrEvent } from "@/lib/nostr/types";
import { useSearchArticlesQuery, useGetRecommendedArticlesQuery, useGetArticlesByAuthorQuery } from "@/api/rtk/nostrApi";
import ArticleList from "./ArticleList";

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
  // Use RTK Query hooks based on feed type
  const searchParams = { 
    hashtag, 
    query: searchQuery,
    limit 
  };
  
  const {
    data: searchArticles = [],
    isLoading: searchLoading,
    error: searchError
  } = useSearchArticlesQuery(
    searchParams, 
    { skip: type !== "search" && type !== "latest" && !hashtag }
  );
  
  const {
    data: recommendedArticles = [],
    isLoading: recommendedLoading,
    error: recommendedError
  } = useGetRecommendedArticlesQuery(
    limit,
    { skip: type !== "trending" && type !== "following" }
  );
  
  const {
    data: authorArticles = [],
    isLoading: authorLoading,
    error: authorError
  } = useGetArticlesByAuthorQuery(
    { pubkey: authorPubkey!, limit },
    { skip: !authorPubkey }
  );

  // Select appropriate data based on type
  const getArticlesData = () => {
    switch (type) {
      case "search":
      case "latest":
        return {
          articles: searchArticles,
          loading: searchLoading,
          error: searchError
        };
      case "trending":
      case "following":
        return {
          articles: recommendedArticles,
          loading: recommendedLoading,
          error: recommendedError
        };
      default:
        if (authorPubkey) {
          return {
            articles: authorArticles,
            loading: authorLoading,
            error: authorError
          };
        }
        return { articles: [], loading: false, error: null };
    }
  };

  const { articles, loading, error } = getArticlesData();
  
  const getEmptyMessage = () => {
    switch (type) {
      case "search":
        return searchQuery ? `No articles found for "${searchQuery}"` : "Enter a search term";
      case "trending":
        return "No trending articles available";
      case "following":
        return "No articles from people you follow";
      case "latest":
        return "No articles available";
      default:
        return "No articles found";
    }
  };

  return (
    <ArticleList 
      articles={articles} 
      loading={loading} 
      emptyMessage={getEmptyMessage()}
      error={error ? "Failed to load articles" : undefined}
    />
  );
};

export default ArticleFeed;

