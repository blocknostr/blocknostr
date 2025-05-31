import React from "react";
import { useSearchArticlesQuery } from '@/api/rtk/nostrApi';
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
  // Use the first hashtag as the primary filter
  const primaryHashtag = hashtags[0];
  
  const {
    data: articles = [],
    isLoading: loading,
    error
  } = useSearchArticlesQuery(
    {
      hashtag: primaryHashtag,
      limit: limit + 1 // Fetch extra in case we need to exclude current
    },
    { skip: !hashtags.length }
  );
  
  // Filter out the current article and limit results
  const filteredArticles = excludeId 
    ? articles.filter(article => article.id !== excludeId).slice(0, limit)
    : articles.slice(0, limit);
  
  if (!hashtags.length) {
    return (
      <ArticleList 
        articles={[]} 
        loading={false} 
        emptyMessage="No hashtags provided"
      />
    );
  }
  
  return (
    <ArticleList 
      articles={filteredArticles} 
      loading={loading} 
      emptyMessage="No related articles found"
      error={error ? "Failed to load related articles" : undefined}
    />
  );
};

export default RelatedArticles;

