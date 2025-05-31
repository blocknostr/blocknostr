import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, 
  Eye, 
  Heart, 
  MessageSquare, 
  FileText,
  Edit3,
  ArrowLeft,
  Calendar,
  User,
  Hash,
  Image as ImageIcon,
  Save,
  Send,
  FileEdit,
  BookOpen,
  Trash2
} from "lucide-react";
import { useArticles } from "@/hooks/useArticles";
import { Article, ArticleFormData } from "@/lib/nostr/types/article";
import { toast } from "@/lib/toast";
import { formatDistanceToNow } from "date-fns";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  type: 'draft' | 'article';
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ isOpen, onClose, onConfirm, title, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Delete {type === 'draft' ? 'Draft' : 'Article'}
        </h3>
        <p className="text-muted-foreground mb-6">
          Are you sure you want to delete "{title}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ArticlesPage() {
  const navigate = useNavigate();
  const {
    drafts,
    published,
    selectedArticle,
    metrics,
    isLoading,
    isPublishing,
    activeTab,
    deleteArticleById,
    publishArticle,
    selectArticleById,
    setActiveTab,
    createArticle,
    saveDraft,
    forceRefresh
  } = useArticles();

  // ✅ FIXED: Local state for UI management
  const [selectedDraftForViewing, setSelectedDraftForViewing] = useState<Article | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    article: Article | null;
  }>({ isOpen: false, article: null });

  // ✅ ENHANCED: Debug logging
  useEffect(() => {
    console.log('[ArticlesPage] Component state:', {
      draftsCount: drafts.length,
      publishedCount: published.length,
      activeTab,
      selectedDraftForViewing: selectedDraftForViewing?.title
    });
  }, [drafts.length, published.length, activeTab, selectedDraftForViewing]);

  // ✅ FIXED: Create new article
  const handleCreateArticle = useCallback(() => {
    const formData: ArticleFormData = {
      title: "New Article",
      content: "Start writing your article here...",
      hashtags: [],
      summary: ""
    };
    
    const newArticle = createArticle(formData, true);
    navigate(`/articles/edit/${newArticle.localId}`);
  }, [createArticle, navigate]);

  // ✅ FIXED: Edit article by localId
  const handleEditArticle = useCallback((article: Article) => {
    navigate(`/articles/edit/${article.localId}`);
  }, [navigate]);

  // ✅ FIXED: View article details
  const handleViewArticle = useCallback((article: Article) => {
    if (article.status === 'draft') {
      setSelectedDraftForViewing(article);
    } else {
      navigate(`/articles/view/${article.localId}`);
    }
  }, [navigate]);

  // ✅ ENHANCED: Delete with confirmation
  const handleDeleteClick = useCallback((article: Article) => {
    setDeleteDialog({ isOpen: true, article });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteDialog.article) {
      console.log(`🗑️ [ArticlesPage] Deleting article: ${deleteDialog.article.title} [${deleteDialog.article.localId}]`);
      await deleteArticleById(deleteDialog.article.localId);
      setDeleteDialog({ isOpen: false, article: null });
      
      // ✅ ENHANCED: Force refresh to ensure UI updates
      setTimeout(() => {
        forceRefresh();
      }, 100);
    }
  }, [deleteDialog.article, deleteArticleById, forceRefresh]);

  // ✅ FIXED: Publish article
  const handlePublishArticle = useCallback(async (article: Article) => {
    console.log(`📤 [ArticlesPage] Publishing article: ${article.title} [${article.localId}]`);
    const success = await publishArticle(article);
    if (success) {
      setSelectedDraftForViewing(null);
      setActiveTab('published');
      
      // ✅ ENHANCED: Force refresh to ensure UI updates
      setTimeout(() => {
        forceRefresh();
      }, 100);
    }
  }, [publishArticle, setActiveTab, forceRefresh]);

  // ✅ FIXED: Close draft viewer
  const handleCloseDraftViewer = useCallback(() => {
    setSelectedDraftForViewing(null);
  }, []);

  // ✅ ENHANCED: Get metrics for article
  const getArticleMetrics = useCallback((article: Article) => {
    if (article.status === 'published' && article.publishedEventId) {
      return metrics[article.publishedEventId] || {
        eventId: article.publishedEventId,
        likes: 0,
        reposts: 0,
        replies: 0,
        zaps: 0,
        zapAmount: 0
      };
    }
    return null;
  }, [metrics]);

  // ✅ ENHANCED: Render article card
  const renderArticleCard = useCallback((article: Article) => {
    const articleMetrics = getArticleMetrics(article);
    
    return (
      <Card 
        key={article.localId} 
        className="mb-2 cursor-pointer transition-all hover:shadow-md"
        onClick={() => handleViewArticle(article)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">
              {article.title}
            </h3>
            <div className="flex items-center gap-1 ml-2">
              {article.status === 'draft' && (
                <Badge variant="secondary" className="text-xs">
                  Draft
                </Badge>
              )}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditArticle(article);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(article);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {article.summary && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {article.summary}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
              </span>
            </div>
            
            {articleMetrics && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  <span>{articleMetrics.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{articleMetrics.replies}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{articleMetrics.views || 0}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }, [getArticleMetrics, handleViewArticle, handleEditArticle, handleDeleteClick]);

  // ✅ ENHANCED: Draft viewer component
  const renderDraftViewer = () => {
    if (!selectedDraftForViewing) return null;

    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleCloseDraftViewer}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Articles
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleEditArticle(selectedDraftForViewing)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit Draft
              </Button>
              <Button
                onClick={() => handlePublishArticle(selectedDraftForViewing)}
                disabled={isPublishing}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isPublishing ? 'Publishing...' : 'Publish as Article'}
              </Button>
            </div>
          </div>

          <article className="prose prose-lg max-w-none">
            <h1>{selectedDraftForViewing.title}</h1>
            {selectedDraftForViewing.subtitle && (
              <p className="text-xl text-gray-600 font-medium">
                {selectedDraftForViewing.subtitle}
              </p>
            )}
            <div className="whitespace-pre-wrap">
              {selectedDraftForViewing.content}
            </div>
          </article>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-semibold">Content Hub</h1>
          <Button
            onClick={handleCreateArticle}
            className="flex items-center gap-2 ml-4"
            size="sm"
          >
            <PlusCircle className="h-4 w-4" />
            New Article
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="published" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Published ({published.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              Drafts ({drafts.length})
            </TabsTrigger>
          </TabsList>

          {/* Published Articles Tab */}
          <TabsContent value="published" className="flex-1 overflow-y-auto mt-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading articles...</div>
                </div>
              ) : published.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No published articles yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create your first article and publish it to share with the world.
                  </p>
                  <Button onClick={handleCreateArticle} className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Article
                  </Button>
                </div>
              ) : (
                published.map(renderArticleCard)
              )}
            </div>
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="flex-1 overflow-y-auto mt-0 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="p-2">
              {drafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileEdit className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No drafts yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start writing and save drafts to continue later.
                  </p>
                  <Button onClick={handleCreateArticle} className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Create Draft
                  </Button>
                </div>
              ) : (
                drafts.map(renderArticleCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Draft Viewer Modal */}
      {renderDraftViewer()}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, article: null })}
        onConfirm={handleDeleteConfirm}
        title={deleteDialog.article?.title || ''}
        type={deleteDialog.article?.status === 'draft' ? 'draft' : 'article'}
      />
    </div>
  );
}

