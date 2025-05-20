import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AlephiumWalletProvider } from '@alephium/web3-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NostrProvider } from '@/contexts/NostrContext';

// import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
// import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import PostPage from './pages/PostPage';
import NotebinPage from './pages/NotebinPage';
import NotFound from './pages/NotFound';
import WalletsPage from './pages/WalletsPage';
import PremiumPage from './pages/PremiumPage';
import DAOPage from './pages/DAOPage'; // Main DAO listing page
import SingleDAOPage from './pages/SingleDAOPage'; // Single DAO page
import GameManagerPage from './pages/GameManagerPage'; // Game manager page
import ArticlesPage from './pages/articles/ArticlesPage';
import ArticleEditorPage from './pages/articles/ArticleEditorPage';
import ArticleViewPage from './pages/articles/ArticleViewPage';
import MyArticlesPage from './pages/articles/MyArticlesPage';
import ArticleDraftsPage from './pages/articles/ArticleDraftsPage';
// import UnifiedProfilePage from './pages/UnifiedProfilePage';

import MainLayout from './layouts/MainLayout';
import { Toaster } from '@/components/ui/sonner';

// Create a new QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlephiumWalletProvider network="mainnet">
        <NostrProvider>
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                <Routes>                  <Route element={<MainLayout />}>
                    {/* Home route */}
                    {/* <Route path="/" element={<HomePage />} /> */}
                    {/* Redirect /feed to home for backward compatibility */}
                    {/* <Route path="/feed" element={<HomePage />} /> */}
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/dao" element={<DAOPage />} /> {/* Main DAO listing page */}
                    <Route path="/dao/:id" element={<SingleDAOPage />} /> {/* Add individual DAO route */}
                    {/* <Route path="/messages" element={<MessagesPage />} /> */}
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/post/:id" element={<PostPage />} />
                    <Route path="/notebin" element={<NotebinPage />} />
                    <Route path="/wallets" element={<WalletsPage />} />
                    <Route path="/premium" element={<PremiumPage />} />
                    {/* <Route path="/profile" element={<UnifiedProfilePage />} /> */}
                    {/* <Route path="/profile/:pubkey" element={<UnifiedProfilePage />} /> */}

                    {/* Games Routes */}
                    <Route path="/games" element={<GameManagerPage />} />
                    <Route path="/games/:gameId" element={<GameManagerPage />} />

                    {/* Articles Routes */}
                    <Route path="/articles" element={<ArticlesPage />} />
                    <Route path="/articles/create" element={<ArticleEditorPage />} />
                    <Route path="/articles/edit/:id" element={<ArticleEditorPage />} />
                    <Route path="/articles/view/:id" element={<ArticleViewPage />} />
                    <Route path="/articles/me" element={<MyArticlesPage />} />
                    <Route path="/articles/drafts" element={<ArticleDraftsPage />} />

                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </main>
              <Toaster position="bottom-right" />
            </div>
          </BrowserRouter>
        </NostrProvider>
      </AlephiumWalletProvider>
    </QueryClientProvider>
  );
}

export default App;
