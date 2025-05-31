import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { coreNostrService } from "@/lib/nostr/core-service";
import { NostrEvent } from "@/lib/nostr/types";
import ArticleList from "@/components/articles/ArticleList";
import LoginPrompt from "@/components/articles/LoginPrompt";

const MyArticlesPage: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!coreNostrService.getPublicKey();
  
  useEffect(() => {
    const loadMyArticles = async () => {
      const userPubkey = coreNostrService.getPublicKey();
      if (!userPubkey) return;
      
      setLoading(true);
      
      try {
        const result = await coreNostrService.getArticlesByAuthor(userPubkey);
        setArticles(result);
      } catch (error) {
        console.error("Failed to load articles:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMyArticles();
  }, []);
  
  if (!isLoggedIn) {
    return <LoginPrompt message="Login to view your articles" />;
  }
  
  return (
    <div className="px-4 py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/articles"><ArrowLeft size={16} /> Back</Link>
          </Button>
          <h1 className="text-2xl font-bold">My Articles</h1>
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
          <h2 className="text-xl font-semibold">Your Published Articles</h2>
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

