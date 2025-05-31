import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Share2, Heart, MessageCircle, Eye } from "lucide-react";
import NoteCard from "@/components/note/NoteCard";
import ArticleReader from "@/components/articles/ArticleReader";
import ArticleAuthorCard from "@/components/articles/ArticleAuthorCard";
import RelatedArticles from "@/components/articles/RelatedArticles";
import BackButton from "@/components/navigation/BackButton";
import { coreNostrService } from "@/lib/nostr/core-service";
import { NostrEvent } from "@/lib/nostr/types";
import { toast } from "@/lib/toast";
// Toaster now imported globally
import { getTagValue } from "@/lib/nostr/utils/nip/nip10";
import { Separator } from "@/components/ui/separator";
import { EVENT_KINDS } from "@/lib/nostr/constants";
import { useArticles } from "@/hooks/useArticles";
import { useProfilesBatch } from "@/hooks/api/useProfileMigrated";

export interface UnifiedContentViewerProps {
  contentType?: 'post' | 'article';
  layoutType?: 'sidebar' | 'container';
  showRelatedContent?: boolean;
  backPath?: string;
  backLabel?: string;
}

/**
 * Unified Content Viewer - Consolidates PostPage and ArticleViewPage
 * 
 * Features:
 * - Handles both posts (kind 1) and articles (kind 30023)
 * - Flexible layout (sidebar or container)
 * - Unified loading and error states
 * - Smart content detection based on event kind
 * - Optional related content suggestions
 * - Consistent interaction buttons (like, share, comment)
 * - Author information display
 * - Edit capabilities for authors
 * Profile dependency removed to eliminate race conditions
 */
const UnifiedContentViewer: React.FC<UnifiedContentViewerProps> = ({
  contentType,
  layoutType = 'auto',
  showRelatedContent = true,
  backPath,
  backLabel
}) => {
  const { id, eventId } = useParams<{ id?: string; eventId?: string }>();
  const navigate = useNavigate();
  const { allArticles } = useArticles();
  
  // State management
  const [content, setContent] = useState<NostrEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  
  // ✅ FIXED: Add profile fetching for ArticleReader
  const { 
    profilesMap, 
    isLoading: profileLoading 
  } = useProfilesBatch(content?.pubkey && content.pubkey.length === 64 ? [content.pubkey] : []);
  
  // Profile management removed to eliminate race conditions
  // Content viewing can work without profile data being managed here
  const profiles = {};
  
  // ✅ EXTRACT PROFILE DATA: Same approach as ProfilePageRedux and ArticleAuthorCard
  const authorProfile = content?.pubkey ? profilesMap[content.pubkey] : null;
  const authorData = authorProfile ? {
    name: authorProfile.metadata?.name || '',
    display_name: authorProfile.metadata?.display_name || authorProfile.metadata?.name || '',
    picture: authorProfile.metadata?.picture || ''
  } : undefined;
  
  // Computed values
  const contentId = id || eventId;
  const isLoggedIn = !!coreNostrService.getPublicKey();
  const isAuthor = content ? content.pubkey === coreNostrService.getPublicKey() : false;
  
  // Content type detection
  const isArticle = content?.kind === EVENT_KINDS.ARTICLE || contentType === 'article';
  const isPost = content?.kind === EVENT_KINDS.TEXT_NOTE || contentType === 'post';
  
  // Layout detection
  const shouldUseSidebar = layoutType === 'sidebar' || (layoutType === 'auto' && isPost);
  const shouldUseContainer = layoutType === 'container' || (layoutType === 'auto' && isArticle);
  
  // Back navigation
  const getBackPath = () => {
    if (backPath) return backPath;
    if (isArticle) return '/articles';
    return '/';
  };
  
  const getBackLabel = () => {
    if (backLabel) return backLabel;
    if (isArticle) return 'Back to Articles';
    return 'Back';
  };

  // Content fetching logic
  const fetchContent = useCallback(async () => {
    if (!contentId) {
      setError("No content ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 [UnifiedContentViewer] Fetching content with ID: ${contentId}, contentType: ${contentType}`);
      
      // ✅ FIXED: Handle articles differently - look up by localId first, then by Nostr event ID
      if (contentType === 'article') {
        console.log(`📖 [UnifiedContentViewer] Looking for article with ID: ${contentId}`);
        
        // First, try to find article in Redux state by localId (for locally managed articles)
        let article = allArticles.find(a => a.localId === contentId);
        
        if (article) {
          console.log(`✅ [UnifiedContentViewer] Found article in Redux by localId:`, article);
          
          // If it's published, fetch the actual Nostr event
          if (article.status === 'published' && article.publishedEventId) {
            console.log(`🌐 [UnifiedContentViewer] Fetching Nostr event: ${article.publishedEventId}`);
            
            try {
              const nostrEvent = await coreNostrService.getEventById(article.publishedEventId);
              if (nostrEvent) {
                console.log(`✅ [UnifiedContentViewer] Found Nostr event`);
                setContent(nostrEvent);
              } else {
                console.warn(`⚠️ [UnifiedContentViewer] Nostr event not found: ${article.publishedEventId}`);
                // Fallback: use article data to create a mock event for display
                const mockEvent: NostrEvent = {
                  id: article.publishedEventId,
                  pubkey: article.authorPubkey,
                  created_at: Math.floor((article.publishedAt || article.createdAt) / 1000),
                  kind: EVENT_KINDS.ARTICLE,
                  tags: [
                    ['title', article.title],
                    ...(article.summary ? [['summary', article.summary]] : []),
                    ...(article.subtitle ? [['subtitle', article.subtitle]] : []),
                    ...(article.image ? [['image', article.image]] : []),
                    ...article.hashtags.map(tag => ['t', tag])
                  ],
                  content: article.content,
                  sig: ''
                };
                setContent(mockEvent);
              }
            } catch (nostrError) {
              console.error(`❌ [UnifiedContentViewer] Error fetching Nostr event:`, nostrError);
              // Fallback: create mock event from article data
              const mockEvent: NostrEvent = {
                id: article.publishedEventId,
                pubkey: article.authorPubkey,
                created_at: Math.floor((article.publishedAt || article.createdAt) / 1000),
                kind: EVENT_KINDS.ARTICLE,
                tags: [
                  ['title', article.title],
                  ...(article.summary ? [['summary', article.summary]] : []),
                  ...(article.subtitle ? [['subtitle', article.subtitle]] : []),
                  ...(article.image ? [['image', article.image]] : []),
                  ...article.hashtags.map(tag => ['t', tag])
                ],
                content: article.content,
                sig: ''
              };
              setContent(mockEvent);
            }
          } else if (article.status === 'draft') {
            // For drafts, create a mock event for display
            const mockEvent: NostrEvent = {
              id: article.localId,
              pubkey: article.authorPubkey,
              created_at: Math.floor(article.createdAt / 1000),
              kind: EVENT_KINDS.ARTICLE,
              tags: [
                ['title', article.title],
                ...(article.summary ? [['summary', article.summary]] : []),
                ...(article.subtitle ? [['subtitle', article.subtitle]] : []),
                ...(article.image ? [['image', article.image]] : []),
                ...article.hashtags.map(tag => ['t', tag])
              ],
              content: article.content,
              sig: ''
            };
            setContent(mockEvent);
          } else {
            console.error(`❌ [UnifiedContentViewer] Article has no publishedEventId:`, article);
            setError("Article not properly published");
          }
        } else {
          // ✅ NEW: If not found by localId, try direct Nostr lookup (for articles from global feed)
          console.log(`🌐 [UnifiedContentViewer] Article not found in Redux, trying direct Nostr lookup: ${contentId}`);
          
          try {
            const nostrEvent = await coreNostrService.getEventById(contentId);
            
            if (nostrEvent && nostrEvent.kind === EVENT_KINDS.ARTICLE) {
              console.log(`✅ [UnifiedContentViewer] Found article via Nostr lookup`);
              setContent(nostrEvent);
            } else {
              console.error(`❌ [UnifiedContentViewer] Article not found via Nostr lookup: ${contentId}`);
              setError("Article not found");
            }
          } catch (nostrError) {
            console.error(`❌ [UnifiedContentViewer] Error in Nostr lookup:`, nostrError);
            setError("Failed to load article");
          }
        }
      } else {
        // ✅ For posts, use direct Nostr lookup (existing behavior)
        console.log(`📝 [UnifiedContentViewer] Fetching post from Nostr: ${contentId}`);
        
        const result = await coreNostrService.getEventById(contentId);

        if (result) {
          console.log(`✅ [UnifiedContentViewer] Found post event`);
          setContent(result);
        } else {
          console.error(`❌ [UnifiedContentViewer] Post not found: ${contentId}`);
          setError("Post not found");
        }
      }
      
    } catch (err) {
      console.error("❌ [UnifiedContentViewer] Error fetching content:", err);
      setError(isArticle ? "Failed to load article" : "Failed to load post");
      if (isPost) {
        toast.error("Failed to load post.");
      }
    } finally {
      setLoading(false);
    }
  }, [contentId, contentType, allArticles]);

  // Load content on mount or ID change
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Interaction handlers
  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error(`You must be logged in to like ${isArticle ? 'articles' : 'posts'}`);
      return;
    }
    
    if (!content) return;
    
    try {
      // Create a reaction event using CoreNostrService
      await coreNostrService.publishEvent({
        kind: 7, // Reaction event kind
        content: "+",
        tags: [
          ["e", content.id],
          ["p", content.pubkey]
        ]
      });
      setLiked(true);
      toast.success(`${isArticle ? 'Article' : 'Post'} liked!`);
    } catch (error) {
      console.error("Failed to like content:", error);
      toast.error(`Failed to like ${isArticle ? 'article' : 'post'}`);
    }
  };
  
  const handleShare = () => {
    if (!content) return;
    
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  // Loading state
  if (loading) {
    const LoadingContent = () => (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );

    if (shouldUseSidebar) {
      return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <BackButton fallbackPath={getBackPath()} />
          <div className="text-center mt-10">Loading {isArticle ? 'article' : 'post'}...</div>
        </div>
      );
    } else {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <LoadingContent />
        </div>
      );
    }
  }

  // Error state
  if (error || !content) {
    const ErrorContent = () => (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
                    <p className="mt-4">{typeof error === 'string' ? error : `Failed to load ${isArticle ? 'article' : 'post'}`}</p>
        <Button asChild className="mt-4">
          <Link to={getBackPath()}>{getBackLabel()}</Link>
        </Button>
      </div>
    );

    if (shouldUseSidebar) {
      return (
        <div className="px-4 py-6 max-w-7xl mx-auto">
          <BackButton fallbackPath={getBackPath()} />
          <div className="mt-10">
            <ErrorContent />
          </div>
        </div>
      );
    } else {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-12">
          <ErrorContent />
        </div>
      );
    }
  }

  // Article metadata extraction
  const title = getTagValue(content, 'title') || "Untitled";
  const image = getTagValue(content, 'image');
  const summary = getTagValue(content, 'summary');
  const publishedAt = content.created_at * 1000;
  const hashtags = content.tags
    .filter(tag => tag[0] === 't')
    .map(tag => tag[1]);

  // ✅ DEBUG: Log render data to understand blank page issue
  console.log('🎨 [UnifiedContentViewer] Rendering with data:', {
    hasContent: !!content,
    contentId: content?.id,
    title,
    isArticle,
    isPost,
    shouldUseSidebar,
    shouldUseContainer,
    contentKind: content?.kind,
    contentLength: content?.content?.length
  });

  // Render content based on layout type
  if (shouldUseSidebar) {
    // Post layout with sidebar
    console.log('🎨 [UnifiedContentViewer] Rendering sidebar layout');
    return (
      <div className="px-4 py-6 max-w-7xl mx-auto">
        <BackButton fallbackPath={getBackPath()} />
        <NoteCard
          event={content}
          profileData={profiles[content.pubkey]}
        />
      </div>
    );
  } else {
    // Article layout with container
    console.log('🎨 [UnifiedContentViewer] Rendering container layout for article');
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={getBackPath()}>
              <ArrowLeft size={16} /> {getBackLabel()}
            </Link>
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto mt-8">
          {isArticle ? (
            <>
              {console.log('🎨 [UnifiedContentViewer] Rendering ArticleReader with:', { title, image, publishedAt, hashtags })}
              <ArticleReader 
                article={content}
                title={title}
                image={image}
                publishedAt={publishedAt}
                hashtags={hashtags}
                authorProfile={authorData}
              />
            </>
          ) : (
            <>
              {console.log('🎨 [UnifiedContentViewer] Rendering NoteCard')}
              <NoteCard
                event={content}
                profileData={profiles[content.pubkey]}
              />
            </>
          )}
          
          <div className="flex justify-between items-center mt-8 border-t border-b py-4">
            <div className="flex gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                asChild
              >
                <Link to={`/post/${content.id}`}>
                  <MessageCircle size={18} />
                  Comments
                </Link>
              </Button>
              
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
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                disabled
              >
                <Eye size={18} />
                Views
              </Button>
              
              {isAuthor && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2"
                  asChild
                >
                  <Link to={`/articles/edit/${content.id}`}>
                    <Pencil size={16} />
                    Edit
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          <div className="my-8">
            <ArticleAuthorCard pubkey={content.pubkey} />
          </div>
          
          {showRelatedContent && isArticle && hashtags.length > 0 && (
            <>
              <Separator className="my-8" />
              <div className="mt-12">
                <h3 className="text-xl font-semibold mb-4">Related Articles</h3>
                <RelatedArticles hashtags={hashtags} excludeId={content.id} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
};

export default UnifiedContentViewer; 

