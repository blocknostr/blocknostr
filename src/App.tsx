import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AlephiumWalletProvider } from '@alephium/web3-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import NewHomePage from '@/pages/NewHomePage';
import SettingsPage from '@/pages/SettingsPage';
import NotebinPage from '@/pages/NotebinPage';
import WalletsPage from '@/pages/WalletsPage';
import CommunityPage from '@/pages/CommunityPage';
import { MyCommunitiesPage } from '@/components/my-communities';
import ArticlesPage from '@/pages/articles/ArticlesPage';
import ArticleEditorPage from '@/pages/articles/ArticleEditorPage';
import ArticleViewPage from '@/pages/articles/ArticleViewPage';
import MyArticlesPage from '@/pages/articles/MyArticlesPage';
import ArticleDraftsPage from '@/pages/articles/ArticleDraftsPage';
import UnifiedContentViewer from '@/pages/UnifiedContentViewer';
import ProfilePageRedux from '@/pages/ProfilePageRedux';
import GamesPage from '@/pages/GamesPage';
import PremiumPage from '@/pages/PremiumPage';

import MainLayout from '@/layouts/MainLayout';
import { Toaster } from '@/lib/toast';
import { setupImageErrorFiltering } from '@/lib/utils/image-utils';

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App: React.FC = () => {
  useEffect(() => {
    console.log('🚀 BlockNostr App initialized');
    
    // Setup image error filtering to reduce console noise
    setupImageErrorFiltering();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AlephiumWalletProvider theme="retro" network="mainnet" addressGroup={0}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<NewHomePage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="notebin" element={<NotebinPage />} />
                <Route path="wallets" element={<WalletsPage />} />
                <Route path="communities" element={<MyCommunitiesPage />} />
                <Route path="communities/:id" element={<CommunityPage />} />
                <Route path="my-communities" element={<MyCommunitiesPage />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="premium" element={<PremiumPage />} />
                
                {/* Profile routes */}
                <Route path="profile" element={<ProfilePageRedux />} />
                <Route path="profile/:pubkey" element={<ProfilePageRedux />} />
                
                {/* Articles routes */}
                <Route path="articles" element={<ArticlesPage />} />
                <Route path="articles/editor" element={<ArticleEditorPage />} />
                <Route path="articles/edit/:id" element={<ArticleEditorPage />} />
                <Route path="articles/view/:id" element={<ArticleViewPage />} />
                <Route path="articles/my" element={<MyArticlesPage />} />
                <Route path="articles/drafts" element={<ArticleDraftsPage />} />
                
                {/* Content viewer route - should be near the end */}
                <Route path="content/:contentId" element={<UnifiedContentViewer />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            
            {/* Global Toast Container with custom styling */}
            <Toaster
              position="bottom-right"
              gutter={8}
              containerStyle={{
                bottom: 20, // Space from bottom of screen
                right: 20,  // Space from right side
              }}
              toastOptions={{
                style: {
                  background: 'transparent',
                  boxShadow: 'none',
                  padding: 0,
                  margin: 0,
                },
                className: 'custom-toast',
                duration: 4000,
              }}
            />
          </div>
        </Router>
      </AlephiumWalletProvider>
    </QueryClientProvider>
  );
};

export default App;

