
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from "@/components/theme-provider";
import Home from '@/pages/Home';
import { nostrService } from '@/lib/nostr';
import NotFound from '@/pages/NotFound';
import ProfilePage from '@/pages/ProfilePage';
import CommunitiesPage from '@/pages/CommunitiesPage';
import NotesList from '@/pages/Notes';

function App() {
  // Initialize nostr connection when app starts
  useEffect(() => {
    // Try to connect to relays on app initialization
    const initializeNostr = async () => {
      try {
        // Check if user was previously logged in (has public key in storage)
        if (localStorage.getItem('nostr_pubkey')) {
          await nostrService.login();
        }
        
        // Connect to default relays
        await nostrService.connectToDefaultRelays();
      } catch (error) {
        console.error("Error initializing Nostr:", error);
      }
    };
    
    initializeNostr();
  }, []);
  
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:npub?" element={<ProfilePage />} />
          <Route path="/communities/" element={<CommunitiesPage />} />
          <Route path="/notes" element={<NotesList />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
