
import React from "react";
import { NostrEvent } from "@/lib/nostr/types";
import { ArticleCard } from "./ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleListProps {
  articles: NostrEvent[];
  loading?: boolean;
  showAuthor?: boolean;
  isEditable?: boolean;
  emptyMessage?: string;
  onDelete?: (id: string) => void;
}

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  loading = false,
  showAuthor = true,
  isEditable = false,
  emptyMessage = "No articles found",
  onDelete
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <Skeleton className="w-full h-40" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map(article => (
        <ArticleCard 
          key={article.id}
          article={article}
          showAuthor={showAuthor}
          isEditable={isEditable}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ArticleList;
