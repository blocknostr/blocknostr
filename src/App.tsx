import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AlephiumWalletProvider } from '@alephium/web3-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Index from './pages/Index';
import NewHomePage from './pages/NewHomePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import PostPage from './pages/PostPage';
import NotebinPage from './pages/NotebinPage';
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import WalletsPage from './pages/WalletsPage';
import PremiumPage from './pages/PremiumPage';
import DAOPage from './pages/DAOPage'; // Main DAO listing page
import SingleDAOPage from './pages/SingleDAOPage'; // Single DAO page
import ArticlesPage from './pages/articles/ArticlesPage';
import ArticleEditorPage from './pages/articles/ArticleEditorPage';
import ArticleViewPage from './pages/articles/ArticleViewPage';
import MyArticlesPage from './pages/articles/MyArticlesPage';
import ArticleDraftsPage from './pages/articles/ArticleDraftsPage';
import GamesPage from './pages/GamesPage';
import NostrPetGamePage from './pages/NostrPetGamePage';

import MainLayout from './layouts/MainLayout';
import { Toaster } from '@/components/ui/sonner';

// Create a new QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AlephiumWalletProvider network="mainnet">
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
              <Routes>
                <Route element={<MainLayout />}>
                  {/* Set NewHomePage as default route */}
                  <Route path="/" element={<NewHomePage />} />
                  {/* Keep old Index page accessible via /feed */}
                  <Route path="/feed" element={<Index />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/dao" element={<DAOPage />} /> {/* Main DAO listing page */}
                  <Route path="/dao/:id" element={<SingleDAOPage />} /> {/* Add individual DAO route */}
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/post/:id" element={<PostPage />} />
                  <Route path="/notebin" element={<NotebinPage />} />
                  <Route path="/wallets" element={<WalletsPage />} />
                  <Route path="/premium" element={<PremiumPage />} />
                  <Route path="/profile/:npub" element={<ProfilePage />} />

                  {/* Articles Routes */}
                  <Route path="/articles" element={<ArticlesPage />} />
                  <Route path="/articles/create" element={<ArticleEditorPage />} />
                  <Route path="/articles/edit/:id" element={<ArticleEditorPage />} />
                  <Route path="/articles/view/:id" element={<ArticleViewPage />} />
                  <Route path="/articles/me" element={<MyArticlesPage />} />
                  <Route path="/articles/drafts" element={<ArticleDraftsPage />} />

                  <Route path="/games" element={<GamesPage />} />
                  <Route path="/games/nosterpet" element={<NostrPetGamePage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </main>
            <Toaster position="bottom-right" />
          </div>
        </BrowserRouter>
      </AlephiumWalletProvider>
    </QueryClientProvider>
  );
}

export default App;
