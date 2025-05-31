
import React from "react";
import { ArticleDraft } from "@/lib/nostr/types/article";
import { DraftCard } from "./ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";

interface DraftsListProps {
  drafts: ArticleDraft[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}

const DraftsList: React.FC<DraftsListProps> = ({
  drafts,
  loading = false,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden">
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
  
  if (drafts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have any draft articles yet.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {drafts.map(draft => (
        <DraftCard 
          key={draft.id}
          draft={draft}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default DraftsList;

