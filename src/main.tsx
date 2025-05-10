
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
    await nostrService.connectToDefaultRelays();
    console.log("Connected to default Nostr relays");
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
