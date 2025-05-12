
import { Routes, Route } from 'react-router-dom';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import CommunityPage from './pages/CommunityPage';
import PremiumPage from './pages/PremiumPage';
import WalletsPage from './pages/WalletsPage';
import NotificationsPage from './pages/NotificationsPage';

// Import Index page instead of HomePage, and the NoteBin page isn't found
import Index from './pages/Index';
import NotebinPage from './pages/NotebinPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Add the new profile settings route */}
      <Route path="/settings/profile" element={<ProfileSettingsPage />} />
      
      {/* Update the home route to use Index instead of HomePage */}
      <Route path="/" element={<Index />} />
      <Route path="/profile/:npub" element={<ProfilePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/messages/:pubkey" element={<MessagesPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/communities" element={<CommunityPage />} />
      <Route path="/premium" element={<PremiumPage />} />
      <Route path="/wallets" element={<WalletsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/notebin" element={<NotebinPage />} />
    </Routes>
  );
};

export default AppRoutes;
