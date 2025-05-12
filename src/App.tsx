
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import CommunitiesPage from './pages/CommunitiesPage';
import CommunityPage from './pages/CommunityPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import PostPage from './pages/PostPage';
import NotebinPage from './pages/NotebinPage';
import NotFound from './pages/NotFound';
import { Toaster } from "sonner";
import WalletsPage from "./pages/WalletsPage";
import PremiumPage from "./pages/PremiumPage";
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:pubkey" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/communities/:id" element={<CommunityPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/notebin" element={<NotebinPage />} />
              <Route path="/wallets" element={<WalletsPage />} />
              <Route path="/premium" element={<PremiumPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </main>
        <Toaster 
          position="bottom-right" 
          closeButton={false}
          theme="custom"
          richColors
          toastOptions={{
            duration: 2500, // Reduced from 4000ms to 2500ms
            className: "nostr-toast",
            style: { 
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
              cursor: "pointer", // Indicating it's clickable
            },
            // Make toast dismissible on click
            onAutoClose: (t) => {
              t.dismiss();
            },
            onClick: (t) => {
              t.dismiss();
            }
          }}
          // Configure the stacking behavior - newer toasts on top, oldest removed first
          offset="16px"
          gap={8}
          // Ensure smooth animations when toasts move up as older ones disappear
          visibleToasts={5}
          expand={false}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
