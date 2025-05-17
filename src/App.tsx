import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import MainLayout from '@/layouts/MainLayout';
import { ThemeProvider } from '@/hooks/use-theme';
import { AuthProvider } from '@/contexts/AuthContext';

const Home = lazy(() => import('@/pages/Index'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const Communities = lazy(() => import('@/pages/Communities'));
const CommunityDetails = lazy(() => import('@/pages/CommunityDetails'));
const Messages = lazy(() => import('@/pages/Messages'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const PostDetails = lazy(() => import('@/pages/PostDetails'));
const Notebin = lazy(() => import('@/pages/Notebin'));
const Wallets = lazy(() => import('@/pages/Wallets'));
const Premium = lazy(() => import('@/pages/Premium'));
const Articles = lazy(() => import('@/pages/Articles'));
const Dao = lazy(() => import('@/pages/Dao'));

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
              <Route path="/profile/:npub" element={<MainLayout><Profile /></MainLayout>} />
              <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
              <Route path="/communities" element={<MainLayout><Communities /></MainLayout>} />
              <Route path="/communities/:communityId" element={<MainLayout><CommunityDetails /></MainLayout>} />
              <Route path="/messages" element={<MainLayout><Messages /></MainLayout>} />
              <Route path="/notifications" element={<MainLayout><Notifications /></MainLayout>} />
              <Route path="/post/:noteId" element={<MainLayout><PostDetails /></MainLayout>} />
              <Route path="/notebin" element={<MainLayout><Notebin /></MainLayout>} />
              <Route path="/wallets" element={<MainLayout><Wallets /></MainLayout>} />
              <Route path="/premium" element={<MainLayout><Premium /></MainLayout>} />
              <Route path="/articles" element={<MainLayout><Articles /></MainLayout>} />
              <Route path="/dao" element={<MainLayout><Dao /></MainLayout>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Toaster position="top-right" closeButton richColors />
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
