import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import {
  addArticle,
  updateArticle,
  deleteArticle,
  setArticles,
  markAsPublished,
  setPublishing,
  setArticleMetrics,
  updateArticleMetrics,
  setSelectedArticle,
  setLoading,
  setActiveTab,
  setView,
  setSearchParams,
  setError,
  clearError,
  mergePublishedArticles,
  refreshArticlesState,
  selectAllArticles,
  selectDraftArticles,
  selectPublishedArticles,
  selectSelectedArticle,
  selectArticleMetrics,
  selectArticlesLoading,
  selectArticlesPublishing,
  selectArticlesView,
  selectActiveTab,
  selectSearchParams,
  selectArticlesError
} from '@/store/slices/articlesSlice';
import { Article, ArticleFormData, ArticleMetrics, generateArticleId, generateDraftId } from '@/lib/nostr/types/article';
import { coreNostrService } from '@/lib/nostr/core-service';
import { getReactionCounts } from '@/lib/nostr/social/interactions/reactions';
import { toast } from '@/lib/toast';
import { classifyError } from '@/lib/nostr/utils/error-filter';

export const useArticles = () => {
  const dispatch = useAppDispatch();
  
  // ✅ FIXED: Add debug logging for state changes
  const allArticles = useAppSelector(selectAllArticles);
  const drafts = useAppSelector(selectDraftArticles);
  const published = useAppSelector(selectPublishedArticles);
  const selectedArticle = useAppSelector(selectSelectedArticle);
  const metrics = useAppSelector(selectArticleMetrics);
  const isLoading = useAppSelector(selectArticlesLoading);
  const isPublishing = useAppSelector(selectArticlesPublishing);
  const view = useAppSelector(selectArticlesView);
  const activeTab = useAppSelector(selectActiveTab);
  const searchParams = useAppSelector(selectSearchParams);
  const error = useAppSelector(selectArticlesError);

  // ✅ DEBUG: Log state changes to ensure Redux is updating
  useEffect(() => {
    console.log('[useArticles] State updated:', {
      totalArticles: allArticles.length,
      drafts: drafts.length,
      published: published.length,
      draftIds: drafts.map(d => ({ id: d.localId, title: d.title }))
    });
  }, [allArticles.length, drafts.length, published.length]);

  // ✅ FIXED: Create article with stable ID
  const createArticle = useCallback((formData: ArticleFormData, isDraft = true): Article => {
    const now = Date.now();
    const localId = isDraft ? generateDraftId() : generateArticleId();
    
    const article: Article = {
      id: localId,
      localId: localId,
      authorPubkey: coreNostrService.getPublicKey() || '',
      title: formData.title,
      subtitle: formData.subtitle,
      content: formData.content,
      summary: formData.summary,
      image: formData.image,
      hashtags: formData.hashtags,
      language: formData.language,
      category: formData.category,
      status: isDraft ? 'draft' : 'published',
      createdAt: now,
      updatedAt: now
    };

    dispatch(addArticle(article));
    return article;
  }, [dispatch]);

  // Save draft
  const saveDraft = useCallback((article: Article | ArticleFormData): Article => {
    try {
      let articleToSave: Article;
      
      if ('status' in article) {
        // It's already an Article
        articleToSave = { ...article, updatedAt: Date.now() };
      } else {
        // It's form data, create new article
        articleToSave = createArticle(article, true);
      }

      dispatch(addArticle(articleToSave));
      toast.success('Draft saved successfully');
      return articleToSave;
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      throw error;
    }
  }, [dispatch, createArticle]);

  // ✅ FIXED: Update by localId
  const updateExistingArticle = useCallback((localId: string, updates: Partial<Article>) => {
    dispatch(updateArticle({ localId, updates }));
  }, [dispatch]);

  // ✅ ENHANCED: Delete with immediate state verification
  const deleteArticleById = useCallback(async (localId: string) => {
    try {
      const article = allArticles.find(a => a.localId === localId);
      if (!article) {
        console.warn(`❌ Article with localId ${localId} not found`);
        toast.error('Article not found');
        return;
      }

      console.log(`🗑️ Deleting article: "${article.title}" (${article.status}) [${localId}]`);
      
      // ✅ CRITICAL: Clear any UI selections first
      if (selectedArticle?.localId === localId) {
        dispatch(setSelectedArticle(null));
      }

      // If it's published, try to publish deletion event to Nostr
      if (article.status === 'published' && article.publishedEventId) {
        try {
          const deletionEvent = {
            kind: 5,
            content: 'Article deleted',
            tags: [['e', article.publishedEventId]],
            created_at: Math.floor(Date.now() / 1000),
            pubkey: coreNostrService.getPublicKey()
          };

          if (window.nostr?.signEvent) {
            const signedEvent = await window.nostr.signEvent(deletionEvent);
            await coreNostrService.publishSignedEvent(signedEvent);
            console.log('✅ Published deletion event to Nostr');
          }
        } catch (nostrError) {
          console.warn('⚠️ Failed to publish deletion to Nostr:', nostrError);
          // Continue with local deletion even if Nostr deletion fails
        }
      }

      // ✅ CRITICAL: Delete from Redux state
      dispatch(deleteArticle(localId));
      
      // ✅ ENHANCED: Immediate verification
      const verifyTimeout = setTimeout(() => {
        const updatedArticles = allArticles.filter(a => a.localId !== localId);
        console.log(`✅ Article deleted. Remaining articles: ${updatedArticles.length}`);
      }, 100);

      toast.success(article.status === 'draft' ? 'Draft deleted successfully' : 'Article deleted successfully');
      
      return () => clearTimeout(verifyTimeout);
      
    } catch (error) {
      console.error('❌ Failed to delete article:', error);
      toast.error('Failed to delete article');
    }
  }, [dispatch, allArticles, selectedArticle]);

  // ✅ ENHANCED: Publish with proper editing support and NIP-09 compliance
  const publishArticle = useCallback(async (article: Article): Promise<boolean> => {
    if (!coreNostrService.getPublicKey()) {
      toast.error('You must be logged in to publish articles');
      return false;
    }

    dispatch(setPublishing(true));
    dispatch(clearError());

    try {
      // ✅ DEBUG: Log article details to understand the state
      console.log('🔍 [DEBUG] Article details:', {
        localId: article.localId,
        title: article.title,
        status: article.status,
        publishedEventId: article.publishedEventId,
        hasPublishedEventId: !!article.publishedEventId
      });

      // ✅ Check if this is editing an existing published article
      const isEditingPublished = article.status === 'published' && article.publishedEventId;
      const originalEventId = article.publishedEventId;

      console.log('🔍 [DEBUG] Editing check:', {
        isEditingPublished,
        statusCheck: article.status === 'published',
        eventIdCheck: !!article.publishedEventId,
        originalEventId
      });

      console.log(`📤 Publishing article: "${article.title}"`);
      if (isEditingPublished) {
        console.log(`✏️ Editing published article, will delete original: ${originalEventId}`);
      } else {
        console.log(`📝 Publishing new article (not editing)`);
      }

      // Prepare article tags
      const articleTags: string[][] = [
        ['title', article.title],
        ['d', `article-${Date.now()}`]
      ];

      if (article.summary) articleTags.push(['summary', article.summary]);
      if (article.subtitle) articleTags.push(['subtitle', article.subtitle]);
      if (article.image) articleTags.push(['image', article.image]);
      if (article.category) articleTags.push(['category', article.category]);
      if (article.language) articleTags.push(['language', article.language]);
      
      article.hashtags.forEach(tag => {
        articleTags.push(['t', tag]);
      });

      // Create Nostr event for new version
      const event = {
        kind: 30023,
        content: article.content,
        tags: articleTags,
        created_at: Math.floor(Date.now() / 1000),
        pubkey: coreNostrService.getPublicKey()
      };

      // Sign and publish new version
      if (!window.nostr?.signEvent) {
        throw new Error('No signing method available - please install a Nostr extension');
      }

      const signedEvent = await window.nostr.signEvent(event);
      const eventId = await coreNostrService.publishSignedEvent(signedEvent);

      if (!eventId) {
        throw new Error('Failed to publish article - no event ID returned');
      }

      console.log(`✅ Published new version: ${eventId}`);

      // ✅ NIP-09: If editing existing published article, delete the old version
      if (isEditingPublished && originalEventId) {
        try {
          console.log(`🗑️ [DEBUG] Starting deletion process for original article: ${originalEventId}`);
          
          const deletionEvent = {
            kind: 5, // NIP-09 deletion event
            content: 'Updated article - previous version deleted',
            tags: [['e', originalEventId]], // Reference to original event
            created_at: Math.floor(Date.now() / 1000),
            pubkey: coreNostrService.getPublicKey()
          };

          console.log('🗑️ [DEBUG] Deletion event created:', deletionEvent);

          console.log('🗑️ [DEBUG] Requesting signature for deletion event...');
          const signedDeletionEvent = await window.nostr.signEvent(deletionEvent);
          console.log('🗑️ [DEBUG] Deletion event signed:', !!signedDeletionEvent);

          console.log('🗑️ [DEBUG] Publishing deletion event to relays...');
          const deletionResult = await coreNostrService.publishSignedEvent(signedDeletionEvent);
          console.log('🗑️ [DEBUG] Deletion event published:', deletionResult);
          
          console.log('✅ Published deletion event for original article');
          
          // ✅ CRITICAL: Immediately remove old article from local state for instant feedback
          const oldArticle = allArticles.find(a => a.publishedEventId === originalEventId);
          if (oldArticle) {
            console.log(`🗑️ Removing old article from local state: ${oldArticle.localId}`);
            dispatch(deleteArticle(oldArticle.localId));
          }
          
          // ✅ CRITICAL: Refresh articles after successful deletion to update local state
          console.log('🔄 Refreshing articles list to reflect deletion...');
          setTimeout(() => {
            fetchPublishedArticles();
          }, 1000); // Small delay to allow relay propagation
          
          toast.success('Article updated successfully (original version deleted)');
        } catch (deletionError) {
          console.error('❌ [DEBUG] Deletion error details:', deletionError);
          console.warn('⚠️ Failed to delete original article:', deletionError);
          // Continue even if deletion fails - the new version is already published
          toast.warning('New version published, but failed to delete original');
        }
      } else {
        console.log('ℹ️ [DEBUG] Skipping deletion - not editing published article');
        toast.success('Article published successfully');
      }

      // ✅ CRITICAL: Update same article, don't create new one
      dispatch(markAsPublished({
        localId: article.localId, // ✅ Use localId for tracking
        eventId,
        nostrEvent: signedEvent
      }));

      return true;

    } catch (error) {
      console.error('Failed to publish article:', error);
      
      const classification = classifyError(error);
      if (classification.shouldDisplay) {
        toast.error(classification.userMessage);
      } else if (classification.type === 'info') {
        toast.warning('Article published to available free relays');
        return true;
      } else {
        toast.error('Failed to publish article');
      }
      
      dispatch(setError(error.message));
      return false;

    } finally {
      dispatch(setPublishing(false));
    }
  }, [dispatch]);

  // ✅ FIXED: Fetch published articles without ID conflicts
  const fetchPublishedArticles = useCallback(async () => {
    const userPubkey = coreNostrService.getPublicKey();
    if (!userPubkey) return;

    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      const publishedArticles = await coreNostrService.getArticlesByAuthor(userPubkey);
      
      // ✅ CRITICAL: Convert with proper ID management
      const articles: Article[] = publishedArticles.map(event => ({
        id: generateArticleId(),           // ✅ Generate local ID
        localId: generateArticleId(),      // ✅ Same as id
        publishedEventId: event.id,        // ✅ Separate Nostr event ID
        authorPubkey: event.pubkey,
        title: event.tags.find(t => t[0] === 'title')?.[1] || 'Untitled',
        subtitle: event.tags.find(t => t[0] === 'subtitle')?.[1],
        content: event.content,
        summary: event.tags.find(t => t[0] === 'summary')?.[1],
        image: event.tags.find(t => t[0] === 'image')?.[1],
        hashtags: event.tags.filter(t => t[0] === 't').map(t => t[1]),
        language: event.tags.find(t => t[0] === 'language')?.[1],
        category: event.tags.find(t => t[0] === 'category')?.[1],
        status: 'published' as const,
        publishedAt: event.created_at * 1000,
        createdAt: event.created_at * 1000,
        updatedAt: event.created_at * 1000,
        nostrEvent: event
      }));

      // ✅ CRITICAL: Use safe merging instead of replacement
      dispatch(mergePublishedArticles(articles));

    } catch (error) {
      console.error('Failed to fetch published articles:', error);
      dispatch(setError('Failed to load published articles'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Fetch article metrics
  const fetchArticleMetrics = useCallback(async () => {
    const publishedArticles = allArticles.filter(a => a.status === 'published' && a.publishedEventId);
    if (publishedArticles.length === 0) return;

    try {
      const pool = (coreNostrService as any).pool;
      const relays = coreNostrService.getConnectedRelays();
      const currentPubkey = coreNostrService.getPublicKey();

      const metricsPromises = publishedArticles.map(async (article) => {
        try {
          const reactionCounts = await getReactionCounts(
            pool,
            article.publishedEventId!,
            relays,
            currentPubkey
          );
          return {
            eventId: article.publishedEventId!,
            ...reactionCounts
          };
        } catch (error) {
          console.error(`Failed to fetch metrics for article ${article.id}:`, error);
          return {
            eventId: article.publishedEventId!,
            likes: 0,
            reposts: 0,
            replies: 0,
            zaps: 0,
            zapAmount: 0
          };
        }
      });

      const results = await Promise.all(metricsPromises);
      const metricsMap = results.reduce((acc, metrics) => {
        acc[metrics.eventId] = metrics;
        return acc;
      }, {} as Record<string, ArticleMetrics>);

      dispatch(setArticleMetrics(metricsMap));

    } catch (error) {
      console.error('Failed to fetch article metrics:', error);
    }
  }, [dispatch, allArticles]);

  // UI actions
  const selectArticleById = useCallback((localId: string | null) => {
    dispatch(setSelectedArticle(localId));
  }, [dispatch]);

  const setActiveTabAction = useCallback((tab: 'published' | 'drafts') => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  const setViewAction = useCallback((newView: 'grid' | 'list') => {
    dispatch(setView(newView));
  }, [dispatch]);

  // ✅ ENHANCED: Force refresh function for debugging
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing articles state...');
    dispatch(refreshArticlesState());
    // This will trigger a re-render by accessing the state
    const currentState = {
      totalArticles: allArticles.length,
      drafts: drafts.length,
      published: published.length
    };
    console.log('Current state:', currentState);
  }, [dispatch, allArticles.length, drafts.length, published.length]);

  // Load articles on mount
  useEffect(() => {
    if (coreNostrService.getPublicKey()) {
      fetchPublishedArticles();
    }
  }, [fetchPublishedArticles]);

  // Load metrics when published articles change
  useEffect(() => {
    if (published.length > 0) {
      fetchArticleMetrics();
    }
  }, [published.length, fetchArticleMetrics]);

  return {
    // Data
    allArticles,
    drafts,
    published,
    selectedArticle,
    metrics,
    
    // State
    isLoading,
    isPublishing,
    view,
    activeTab,
    searchParams,
    error,
    
    // Actions
    createArticle,
    saveDraft,
    updateExistingArticle,
    deleteArticleById,
    publishArticle,
    fetchPublishedArticles,
    fetchArticleMetrics,
    
    // UI actions
    selectArticleById,
    setActiveTab: setActiveTabAction,
    setView: setViewAction,
    
    // Utils
    clearError: () => dispatch(clearError()),
    forceRefresh // ✅ For debugging
  };
}; 