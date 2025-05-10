
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import MessagesPage from "./pages/MessagesPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import CommunityPage from "./pages/CommunityPage";
import NotebinPage from "./pages/NotebinPage";
import NotificationsPage from "./pages/NotificationsPage";
import PostPage from "./pages/PostPage";
import { useState } from "react";

const App = () => {
  // Create a new QueryClient instance inside the component
  // This ensures React context works correctly
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:npub" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/communities/:id" element={<CommunityPage />} />
            <Route path="/notebin" element={<NotebinPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/post/:id" element={<PostPage />} />
            {/* Placeholder routes for the new sidebar items */}
            <Route path="/wallets" element={<NotFound />} />
            <Route path="/bookmarks" element={<NotFound />} />
            <Route path="/premium" element={<NotFound />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
