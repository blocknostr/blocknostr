
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
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar';
import { Toaster } from "@/components/ui/toaster"
import BookmarksPage from './pages/BookmarksPage';
import WalletsPage from "./pages/WalletsPage";
import PremiumPage from "./pages/PremiumPage";
import { NavigationProvider } from './contexts/NavigationContext';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <BrowserRouter>
      <NavigationProvider>
        <div className="flex flex-col min-h-screen">
          <Header toggleSidebar={toggleSidebar} />
          <div className="flex flex-1">
            <Sidebar />
            <main className="flex-1 p-4">
              <Routes>
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
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/wallets" element={<WalletsPage />} />
                <Route path="/premium" element={<PremiumPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </div>
      </NavigationProvider>
    </BrowserRouter>
  );
}

export default App;
