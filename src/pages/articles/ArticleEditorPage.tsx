
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/navigation/PageHeader";
import ArticleEditor from "@/components/articles/ArticleEditor";
import { ArticleDraft } from "@/lib/nostr/types/article";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { toast } from "sonner";

const ArticleEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [draft, setDraft] = useState<ArticleDraft>({
    title: "",
    content: "",
    hashtags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    published: false
  });
  
  useEffect(() => {
    // If we have an ID, try to load the draft or published article
    if (id) {
      const existingDraft = nostrAdapter.getDraft(id);
      
      if (existingDraft) {
        setDraft(existingDraft);
      } else {
        // It might be a published article we're editing
        setLoading(true);
        
        nostrAdapter.getArticleById(id)
          .then(article => {
            if (article) {
              // Convert the article to a draft format
              const title = article.tags.find(tag => tag[0] === 'title')?.[1] || '';
              const hashtags = article.tags
                .filter(tag => tag[0] === 't')
                .map(tag => tag[1]);
              const summary = article.tags.find(tag => tag[0] === 'summary')?.[1] || '';
              const image = article.tags.find(tag => tag[0] === 'image')?.[1] || '';
              
              setDraft({
                id: `edit_${article.id}`,
                title,
                content: article.content,
                hashtags,
                summary,
                image,
                createdAt: article.created_at * 1000,
                updatedAt: Date.now(),
                published: true,
                publishedId: article.id
              });
            } else {
              toast.error("Could not find the article to edit.");
              navigate("/articles");
            }
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [id, navigate]);
  
  const handleSaveDraft = (updatedDraft: ArticleDraft) => {
    try {
      const savedId = nostrAdapter.saveDraft(updatedDraft);
      toast.success("Draft saved successfully");
      
      if (!updatedDraft.id) {
        setDraft(prev => ({ ...prev, id: savedId }));
      }
      
      return true;
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
      return false;
    }
  };
  
  const handlePublish = async (articleDraft: ArticleDraft) => {
    try {
      setLoading(true);
      
      // Prepare metadata from the draft
      const metadata = {
        summary: articleDraft.summary,
        image: articleDraft.image,
        hashtags: articleDraft.hashtags,
        published_at: Math.floor(Date.now() / 1000)
      };
      
      // Prepare tags array for the event
      const tags: string[][] = [];
      
      // If this is an update to a published article, add a reference
      if (articleDraft.publishedId) {
        tags.push(['e', articleDraft.publishedId, '', 'root']);
      }
      
      // Publish the article
      const eventId = await nostrAdapter.publishArticle(
        articleDraft.title,
        articleDraft.content,
        metadata,
        tags
      );
      
      if (eventId) {
        // Update the draft to mark as published
        const updatedDraft = {
          ...articleDraft,
          published: true,
          publishedId: eventId,
          updatedAt: Date.now()
        };
        
        // Save the updated draft
        nostrAdapter.saveDraft(updatedDraft);
        
        toast.success("Article published successfully!");
        
        // Navigate to the published article
        navigate(`/articles/view/${eventId}`);
        return true;
      } else {
        throw new Error("Failed to publish article");
      }
    } catch (error) {
      console.error("Error publishing article:", error);
      toast.error("Failed to publish article");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-6">
      <PageHeader 
        title={id ? "Edit Article" : "Create Article"} 
        showBackButton={true}
        fallbackPath="/articles"
      />
      
      <div className="mt-6">
        <ArticleEditor 
          draft={draft}
          loading={loading}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
        />
      </div>
    </div>
  );
};

export default ArticleEditorPage;
