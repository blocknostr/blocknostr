import React from "react";
import { useGetRecommendedArticlesQuery } from '@/api/rtk/nostrApi';
import ArticleList from "./ArticleList";

const RecommendedArticles: React.FC = () => {
  const {
    data: articles = [],
    isLoading: loading,
    error
  } = useGetRecommendedArticlesQuery(6);
  
  return (
    <ArticleList 
      articles={articles} 
      loading={loading} 
      emptyMessage="No recommended articles available yet"
      error={error ? "Failed to load recommended articles" : undefined}
    />
  );
};

export default RecommendedArticles;

