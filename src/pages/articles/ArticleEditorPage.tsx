import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Article, ArticleFormData } from "@/lib/nostr/types/article";
import ArticleEditor from "@/components/articles/ArticleEditor";
import { toast } from "@/lib/toast";

const ArticleEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    allArticles,
    createArticle,
    saveDraft,
    publishArticle,
    updateExistingArticle,
    isPublishing
  } = useArticles();

  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Load article by ID when component mounts
  useEffect(() => {
    if (id) {
      // Find article in Redux state
      const article = allArticles.find(a => a.localId === id);
      
      if (article) {
        console.log(`📝 [ArticleEditorPage] Loading article for editing: ${article.title} [${id}]`);
        setCurrentArticle(article);
      } else {
        console.warn(`❌ [ArticleEditorPage] Article with ID ${id} not found`);
        toast.error("Article not found");
        navigate("/articles");
      }
    } else {
      // Create new article
      console.log("📝 [ArticleEditorPage] Creating new article");
      const formData: ArticleFormData = {
        title: "",
        content: "",
        hashtags: [],
        summary: ""
      };
      
      const newArticle = createArticle(formData, true);
      setCurrentArticle(newArticle);
    }
  }, [id, allArticles, createArticle, navigate]);

  // ✅ Handle saving draft
  const handleSaveDraft = (updatedData: Partial<Article>): boolean => {
    if (!currentArticle) return false;

    try {
      const updatedArticle: Article = {
        ...currentArticle,
        ...updatedData,
        updatedAt: Date.now()
      };

      // Update in Redux
      updateExistingArticle(currentArticle.localId, updatedData);
      
      // Update local state
      setCurrentArticle(updatedArticle);
      
      toast.success("Draft saved successfully");
      return true;
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error("Failed to save draft");
      return false;
    }
  };

  // ✅ Handle publishing
  const handlePublish = async (updatedData: Partial<Article>): Promise<boolean> => {
    if (!currentArticle) return false;

    try {
      // First save the current changes
      const updatedArticle: Article = {
        ...currentArticle,
        ...updatedData,
        updatedAt: Date.now()
      };

      // Update in Redux
      updateExistingArticle(currentArticle.localId, updatedData);
      
      // Publish the article
      const success = await publishArticle(updatedArticle);
      
      if (success) {
        toast.success("Article published successfully!");
        navigate("/articles");
        return true;
      } else {
        toast.error("Failed to publish article");
        return false;
      }
    } catch (error) {
      console.error("Failed to publish article:", error);
      toast.error("Failed to publish article");
      return false;
    }
  };

  // ✅ Convert Article to legacy ArticleDraft format for existing ArticleEditor component
  const articleToLegacyDraft = (article: Article) => {
    return {
      id: article.localId,
      title: article.title,
      subtitle: article.subtitle,
      content: article.content,
      summary: article.summary,
      image: article.image,
      hashtags: article.hashtags,
      published: article.status === 'published',
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      publishedId: article.publishedEventId
    };
  };

  // ✅ Handle changes from ArticleEditor
  const handleDraftChange = (draft: any) => {
    if (!currentArticle) return false;

    return handleSaveDraft({
      title: draft.title,
      subtitle: draft.subtitle,
      content: draft.content,
      summary: draft.summary,
      image: draft.image,
      hashtags: draft.hashtags || []
    });
  };

  // ✅ Handle publish from ArticleEditor
  const handlePublishDraft = async (draft: any): Promise<boolean> => {
    if (!currentArticle) return false;

    return handlePublish({
      title: draft.title,
      subtitle: draft.subtitle,
      content: draft.content,
      summary: draft.summary,
      image: draft.image,
      hashtags: draft.hashtags || []
    });
  };

  if (!currentArticle) {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading article...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-4">
          <Link to="/articles">
            <ArrowLeft size={16} className="mr-2" />
            Back to Articles
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          {currentArticle.status === 'published' ? "Edit Article" : "Edit Draft"}
        </h1>
      </div>

      <div className="mt-6">
        <ArticleEditor 
          draft={articleToLegacyDraft(currentArticle)}
          loading={loading || isPublishing}
          onSaveDraft={handleDraftChange}
          onPublish={handlePublishDraft}
        />
      </div>
    </div>
  );
};

export default ArticleEditorPage;

