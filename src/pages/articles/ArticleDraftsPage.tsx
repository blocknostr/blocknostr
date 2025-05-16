
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { ArticleDraft } from "@/lib/nostr/types/article";
import LoginPrompt from "@/components/articles/LoginPrompt";
import DraftsList from "@/components/articles/DraftsList";

const ArticleDraftsPage: React.FC = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!nostrAdapter.publicKey;
  
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
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <PageHeader 
        title="Draft Articles" 
        showBackButton={true}
        fallbackPath="/articles"
        rightContent={
          <Button asChild>
            <Link to="/articles/create" className="flex items-center gap-2">
              <Plus size={16} />
              New Article
            </Link>
          </Button>
        }
      />
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Draft Articles</h2>
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
