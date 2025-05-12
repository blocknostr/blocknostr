import { Routes, Route } from 'react-router-dom';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagesPage from './pages/MessagesPage';
import CommunityPage from './pages/CommunityPage';
import PremiumPage from './pages/PremiumPage';
import WalletsPage from './pages/WalletsPage';
import NotificationsPage from './pages/NotificationsPage';
import NoteBinPage from './pages/NoteBinPage';

// Import additional pages here as needed

const AppRoutes = () => {
  return (
    <Routes>
      {/* Add the new profile settings route */}
      <Route path="/settings/profile" element={<ProfileSettingsPage />} />
      
      {/* Keep existing routes from App.tsx */}
      <Route path="/" element={<HomePage />} />
      <Route path="/profile/:npub" element={<ProfilePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/messages/:pubkey" element={<MessagesPage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/communities" element={<CommunityPage />} />
      <Route path="/premium" element={<PremiumPage />} />
      <Route path="/wallets" element={<WalletsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/notebin" element={<NoteBinPage />} />
    </Routes>
  );
};

export default AppRoutes;
