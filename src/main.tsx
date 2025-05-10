
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'
import { nostrService } from '@/lib/nostr';

// Add dark mode class to html element by default
document.documentElement.classList.add('dark')

// Create a client with properly configured defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
})

// Initialize nostr connection
const initNostr = async () => {
  try {
    // Connect to default relays during initialization
    await nostrService.connectToDefaultRelays();
    console.log("Connected to default Nostr relays");
    
    // Attempt to also connect to user relays if available
    try {
      await nostrService.connectToUserRelays();
      console.log("Connected to user Nostr relays");
    } catch (userRelaysError) {
      console.info("No user relays available or connection failed:", userRelaysError);
    }
  } catch (error) {
    console.error("Failed to connect to Nostr relays:", error);
  }
};

// Run initialization
initNostr();

// Create root and render app
const root = createRoot(document.getElementById("root")!)
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
