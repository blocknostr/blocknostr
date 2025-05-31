import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { coreNostrService } from "@/lib/nostr/core-service";
import { ArticleDraft } from "@/lib/nostr/types/article";
import LoginPrompt from "@/components/articles/LoginPrompt";
import DraftsList from "@/components/articles/DraftsList";

const ArticleDraftsPage: React.FC = () => {
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!coreNostrService.getPublicKey();
  
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    
    // Load drafts from local storage
    const allDrafts = nostrAdapter.getAllDrafts();
    setDrafts(allDrafts);
    setLoading(false);
  }, [isLoggedIn]);
  
  const handleDeleteDraft = (draftId: string) => {
    nostrAdapter.deleteDraft(draftId);
    setDrafts(prev => prev.filter(draft => draft.id !== draftId));
  };
  
  if (!isLoggedIn) {
    return <LoginPrompt message="Login to view your drafts" />;
  }
  
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/articles"><ArrowLeft size={16} /> Back</Link>
          </Button>
          <h1 className="text-2xl font-bold">Draft Articles</h1>
        </div>
        <Button asChild>
          <Link to="/articles/create" className="flex items-center gap-2">
            <Plus size={16} />
            New Article
          </Link>
        </Button>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Draft Articles</h2>
          <Button variant="outline" asChild>
            <Link to="/articles/me">Published Articles</Link>
          </Button>
        </div>
        
        <DraftsList 
          drafts={drafts}
          loading={loading}
          onDelete={handleDeleteDraft}
        />
      </div>
    </div>
  );
};

export default ArticleDraftsPage;

