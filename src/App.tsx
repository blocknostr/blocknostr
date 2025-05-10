
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import MessagesPage from "./pages/MessagesPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import CommunityPage from "./pages/CommunityPage";
import SettingsPage from "./pages/SettingsPage";
import NotificationsPage from "./pages/NotificationsPage";
import PostPage from "./pages/PostPage";
import NotebinPage from "./pages/NotebinPage";
import WalletPage from "./pages/WalletPage";
import { AlephiumWalletContext } from "./lib/alephium";

import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <AlephiumWalletContext>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:npub" element={<ProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/community/:id" element={<CommunityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/notebin" element={<NotebinPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AlephiumWalletContext>
    </ThemeProvider>
  );
}

export default App;
