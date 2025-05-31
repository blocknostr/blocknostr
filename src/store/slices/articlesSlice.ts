import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import { Article, ArticleMetrics, ArticleSearchParams, generateArticleId } from '@/lib/nostr/types/article';
import { RootState } from '../index';

interface ArticlesState {
  // Core data
  articles: Article[];
  metrics: Record<string, ArticleMetrics>;
  
  // UI state
  selectedArticleId: string | null;
  isLoading: boolean;
  isPublishing: boolean;
  
  // Search and filtering
  searchParams: ArticleSearchParams;
  filteredArticleIds: string[];
  
  // View preferences
  view: 'grid' | 'list';
  activeTab: 'published' | 'drafts';
  
  // Error handling
  error: string | null;
  lastSyncTimestamp: number | null;
}

const initialState: ArticlesState = {
  articles: [],
  metrics: {},
  selectedArticleId: null,
  isLoading: false,
  isPublishing: false,
  searchParams: {
    status: 'all',
    sortBy: 'newest'
  },
  filteredArticleIds: [],
  view: 'grid',
  activeTab: 'published',
  error: null,
  lastSyncTimestamp: null
};

export const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    // ✅ FIXED: Proper article management
    addArticle: (state, action: PayloadAction<Article>) => {
      const article = action.payload;
      
      // ✅ CRITICAL: Ensure unique local ID
      if (!article.id || !article.localId) {
        article.id = generateArticleId();
        article.localId = article.id;
      }
      
      const existingIndex = state.articles.findIndex(a => a.localId === article.localId);
      if (existingIndex >= 0) {
        // Update existing article
        state.articles[existingIndex] = article;
      } else {
        // Add new article
        state.articles.push(article);
      }
      state.error = null;
    },
    
    updateArticle: (state, action: PayloadAction<{localId: string, updates: Partial<Article>}>) => {
      const { localId, updates } = action.payload;
      const articleIndex = state.articles.findIndex(a => a.localId === localId);
      
      if (articleIndex >= 0) {
        state.articles[articleIndex] = {
          ...state.articles[articleIndex],
          ...updates,
          updatedAt: Date.now()
        };
      }
      state.error = null;
    },
    
    // ✅ ENHANCED: Delete with better logging and immutability
    deleteArticle: (state, action: PayloadAction<string>) => {
      const localId = action.payload;
      const articleToDelete = state.articles.find(a => a.localId === localId);
      
      if (!articleToDelete) {
        console.warn(`❌ [Redux] Article with localId ${localId} not found for deletion`);
        return;
      }
      
      console.log(`🗑️ [Redux] Deleting article: "${articleToDelete.title}" [${localId}]`);
      
      // ✅ CRITICAL: Create new array (immutable update)
      const newArticles = state.articles.filter(a => a.localId !== localId);
      state.articles = newArticles;
      
      // ✅ Clear selections if deleting selected article
      if (state.selectedArticleId === localId) {
        state.selectedArticleId = null;
      }
      
      console.log(`✅ [Redux] Article deleted. Remaining: ${newArticles.length}`);
      state.error = null;
    },
    
    setArticles: (state, action: PayloadAction<Article[]>) => {
      state.articles = action.payload;
      state.lastSyncTimestamp = Date.now();
      state.error = null;
    },
    
    // ✅ FIXED: Publishing operations
    markAsPublished: (state, action: PayloadAction<{
      localId: string, 
      eventId: string, 
      nostrEvent: any
    }>) => {
      const { localId, eventId, nostrEvent } = action.payload;
      const articleIndex = state.articles.findIndex(a => a.localId === localId);
      
      if (articleIndex >= 0) {
        state.articles[articleIndex] = {
          ...state.articles[articleIndex],
          status: 'published',
          publishedEventId: eventId,
          publishedAt: Date.now(),
          nostrEvent,
          updatedAt: Date.now()
        };
      }
    },
    
    setPublishing: (state, action: PayloadAction<boolean>) => {
      state.isPublishing = action.payload;
    },
    
    // ✅ FIXED: Merge published articles without conflicts
    mergePublishedArticles: (state, action: PayloadAction<Article[]>) => {
      const publishedArticles = action.payload;
      
      publishedArticles.forEach(publishedArticle => {
        // ✅ CRITICAL: Check if we already have this article locally
        const existingArticle = state.articles.find(a => 
          a.publishedEventId === publishedArticle.publishedEventId
        );
        
        if (existingArticle) {
          // ✅ Update existing article with published data
          const articleIndex = state.articles.findIndex(a => a.localId === existingArticle.localId);
          if (articleIndex >= 0) {
            state.articles[articleIndex] = {
              ...existingArticle,
              ...publishedArticle,
              localId: existingArticle.localId, // ✅ Keep original local ID
              id: existingArticle.id,           // ✅ Keep original ID
              status: 'published',
              updatedAt: Date.now()
            };
          }
        } else {
          // ✅ New published article we haven't seen before
          const articleWithLocalId = {
            ...publishedArticle,
            localId: generateArticleId(),
            id: generateArticleId()
          };
          state.articles.push(articleWithLocalId);
        }
      });
      
      state.lastSyncTimestamp = Date.now();
      state.error = null;
    },
    
    // Metrics management
    setArticleMetrics: (state, action: PayloadAction<Record<string, ArticleMetrics>>) => {
      state.metrics = action.payload;
    },
    
    updateArticleMetrics: (state, action: PayloadAction<{eventId: string, metrics: ArticleMetrics}>) => {
      const { eventId, metrics } = action.payload;
      state.metrics[eventId] = metrics;
    },
    
    // UI state management
    setSelectedArticle: (state, action: PayloadAction<string | null>) => {
      state.selectedArticleId = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setActiveTab: (state, action: PayloadAction<'published' | 'drafts'>) => {
      state.activeTab = action.payload;
    },
    
    setView: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.view = action.payload;
    },
    
    // Search and filtering
    setSearchParams: (state, action: PayloadAction<Partial<ArticleSearchParams>>) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    
    setFilteredArticles: (state, action: PayloadAction<string[]>) => {
      state.filteredArticleIds = action.payload;
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // ✅ ENHANCED: Add refresh action for debugging
    refreshArticlesState: (state) => {
      console.log('🔄 [Redux] Force refresh articles state');
      // This action does nothing but triggers subscribers
      state.lastSyncTimestamp = Date.now();
    },
    
    // Reset state
    resetArticlesState: () => initialState
  }
});

// Export actions
export const {
  addArticle,
  updateArticle,
  deleteArticle,
  setArticles,
  markAsPublished,
  setPublishing,
  mergePublishedArticles,
  setArticleMetrics,
  updateArticleMetrics,
  setSelectedArticle,
  setLoading,
  setActiveTab,
  setView,
  setSearchParams,
  setFilteredArticles,
  setError,
  clearError,
  refreshArticlesState,
  resetArticlesState
} = articlesSlice.actions;

// ✅ FIXED: Memoized selectors to prevent unnecessary rerenders
export const selectAllArticles = (state: RootState) => state.articles.articles;

export const selectDraftArticles = createSelector(
  [selectAllArticles],
  (articles) => articles.filter(a => a.status === 'draft')
);

export const selectPublishedArticles = createSelector(
  [selectAllArticles],
  (articles) => articles.filter(a => a.status === 'published')
);

export const selectSelectedArticle = createSelector(
  [(state: RootState) => state.articles.selectedArticleId, selectAllArticles],
  (selectedId, articles) => {
    return selectedId ? articles.find(a => a.localId === selectedId) || null : null;
  }
);

export const selectArticleMetrics = (state: RootState) => state.articles.metrics;
export const selectArticlesLoading = (state: RootState) => state.articles.isLoading;
export const selectArticlesPublishing = (state: RootState) => state.articles.isPublishing;
export const selectArticlesView = (state: RootState) => state.articles.view;
export const selectActiveTab = (state: RootState) => state.articles.activeTab;
export const selectSearchParams = (state: RootState) => state.articles.searchParams;
export const selectArticlesError = (state: RootState) => state.articles.error;

export default articlesSlice.reducer; 