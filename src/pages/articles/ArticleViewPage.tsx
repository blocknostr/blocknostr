
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "@/components/navigation/PageHeader";
import { Button } from "@/components/ui/button";
import { Pencil, Share2, Bookmark, Heart, MessageCircle } from "lucide-react";
import ArticleReader from "@/components/articles/ArticleReader";
import ArticleAuthorCard from "@/components/articles/ArticleAuthorCard";
import RelatedArticles from "@/components/articles/RelatedArticles";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { NostrEvent } from "@/lib/nostr/types";
import { toast } from "sonner";
import { getTagValue } from "@/lib/nostr/utils/nip/nip10";
import { Separator } from "@/components/ui/separator";

const ArticleViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<NostrEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const isLoggedIn = !!nostrAdapter.publicKey;
  const isAuthor = article ? article.pubkey === nostrAdapter.publicKey : false;
  
  useEffect(() => {
    if (!id) {
      setError("No article ID provided");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    nostrAdapter.getArticleById(id)
      .then(result => {
        if (result) {
          setArticle(result);
        } else {
          setError("Article not found");
        }
      })
      .catch(err => {
        console.error("Error fetching article:", err);
        setError("Failed to load article");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);
  
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to like articles");
      return;
    }
    
    if (!article) return;
    
    try {
      await nostrAdapter.social.reactToEvent(article.id, "+");
      setLiked(true);
      toast.success("Article liked!");
    } catch (error) {
      console.error("Failed to like article:", error);
      toast.error("Failed to like article");
    }
  };
  
  const handleShare = () => {
    if (!article) return;
    
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !article) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Error</h1>
          <p className="mt-4">{error || "Failed to load article"}</p>
          <Button asChild className="mt-4">
            <Link to="/articles">Back to Articles</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Extract article metadata from tags
  const title = getTagValue(article, 'title') || "Untitled";
  const image = getTagValue(article, 'image');
  const summary = getTagValue(article, 'summary');
  const publishedAt = article.created_at * 1000; // Convert to milliseconds
  const hashtags = article.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1]);
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <PageHeader 
        title="Article" 
        showBackButton={true} 
        fallbackPath="/articles"
        rightContent={
          isAuthor && (
            <Button variant="outline" asChild>
              <Link to={`/articles/edit/${article.id}`} className="flex items-center gap-2">
                <Pencil size={16} />
                Edit
              </Link>
            </Button>
          )
        }
      />
      
      <div className="max-w-4xl mx-auto mt-8">
        <ArticleReader 
          article={article}
          title={title}
          image={image}
          publishedAt={publishedAt}
          hashtags={hashtags}
        />
        
        <div className="flex justify-between items-center mt-8 border-t border-b py-4">
          <div className="flex gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex items-center gap-2 ${liked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <Heart size={18} className={liked ? 'fill-red-500' : ''} />
              Like
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleShare}
            >
              <Share2 size={18} />
              Share
            </Button>
            
            {isLoggedIn && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <Bookmark size={18} />
                Save
              </Button>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2"
            asChild
          >
            <Link to={`/post/${article.id}`}>
              <MessageCircle size={18} />
              Comments
            </Link>
          </Button>
        </div>
        
        <div className="my-8">
          <ArticleAuthorCard pubkey={article.pubkey} />
        </div>
        
        <Separator className="my-8" />
        
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
          <RelatedArticles hashtags={hashtags} excludeId={article.id} />
        </div>
      </div>
    </div>
  );
};

export default ArticleViewPage;
