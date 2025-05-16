
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { NostrEvent } from "@/lib/nostr/types";
import ArticleList from "@/components/articles/ArticleList";
import LoginPrompt from "@/components/articles/LoginPrompt";

const MyArticlesPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!nostrAdapter.publicKey;
  
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    nostrAdapter.getArticlesByAuthor(nostrAdapter.publicKey!)
      .then(result => {
        setArticles(result);
      })
      .catch(err => {
        console.error("Error fetching articles:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isLoggedIn]);
  
  if (!isLoggedIn) {
    return <LoginPrompt message="Login to view your articles" />;
  }
  
  return (
    <div className="container max-w-7xl mx-auto px-4 py-6">
      <PageHeader 
        title="My Articles" 
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
          <h2 className="text-2xl font-bold">Your Published Articles</h2>
          <Button variant="outline" asChild>
            <Link to="/articles/drafts">View Drafts</Link>
          </Button>
        </div>
        
        <ArticleList 
          articles={articles}
          loading={loading}
          emptyMessage="You haven't published any articles yet."
          showAuthor={false}
          isEditable={true}
        />
      </div>
    </div>
  );
};

export default MyArticlesPage;
