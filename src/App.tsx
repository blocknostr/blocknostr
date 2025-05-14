import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AlephiumWalletProvider } from '@alephium/web3-react';

import Index from './pages/Index';
import SettingsPage from './pages/SettingsPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityPage from './pages/CommunityPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import PostPage from './pages/PostPage';
import NotebinPage from './pages/NotebinPage';
import NotFound from './pages/NotFound';
import ProfilePage from './pages/ProfilePage';
import WalletsPage from './pages/WalletsPage';
import PremiumPage from './pages/PremiumPage';

import MainLayout from './layouts/MainLayout';
import { Toaster } from 'sonner';

function App() {
  return (
    <AlephiumWalletProvider network="mainnet">
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/communities/:id" element={<CommunityPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/post/:id" element={<PostPage />} />
                <Route path="/notebin" element={<NotebinPage />} />
                <Route path="/wallets" element={<WalletsPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="/profile/:npub" element={<ProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </main>
          <Toaster position="bottom-right" closeButton />
        </div>
      </BrowserRouter>
    </AlephiumWalletProvider>
  );
}

export default App;