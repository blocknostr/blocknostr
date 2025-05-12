
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Inter } from "next/font/google";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { RightSidebarProvider } from "@/contexts/RightSidebarContext";
import AppLayout from "@/components/layout/AppLayout";
import { Toaster } from "sonner";

// Import pages
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import MessagesPage from "@/pages/MessagesPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ProfilePage from "@/pages/ProfilePage";
import CommunitiesPage from "@/pages/CommunitiesPage";
import NotebinPage from "@/pages/NotebinPage";
import PremiumPage from "@/pages/PremiumPage";
import SettingsPage from "@/pages/SettingsPage";
import WalletsPage from "@/pages/WalletsPage";

// Define the font
const inter = Inter({ subsets: ["latin"] });

function App() {
  return (
    <div className={`${inter.className} dark`}>
      <Router>
        <NavigationProvider>
          <RightSidebarProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/communities" element={<CommunitiesPage />} />
                    <Route path="/notebin" element={<NotebinPage />} />
                    <Route path="/premium" element={<PremiumPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/wallets" element={<WalletsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </main>
              <Toaster position="bottom-right" closeButton />
            </div>
          </RightSidebarProvider>
        </NavigationProvider>
      </Router>
    </div>
  );
}

export default App;
