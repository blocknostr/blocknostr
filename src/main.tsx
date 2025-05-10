
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './App.tsx'
import './index.css'

// Add dark mode class to html element by default
document.documentElement.classList.add('dark')

// Create a client
const queryClient = new QueryClient()

// Create root and render app
const root = createRoot(document.getElementById("root")!)
root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
