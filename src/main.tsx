import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.tsx'
import './index.css'

// Import Redux store and persistor
import { store, persistor } from './store'

// Import browser compatibility fixes
import { applyBrowserFixes } from "@/lib/utils/browser-compat";

// Apply browser compatibility fixes early
applyBrowserFixes();

// Essential debug functions for development only
if (process.env.NODE_ENV === 'development') {
  import("@/lib/nostr").then(({ nostrService }) => {
    declare global {
      interface Window {
        debugSubscriptions: () => void;
        debugProfile: () => void;
      }
    }

    window.debugSubscriptions = () => {
      const stats = nostrService.getSubscriptionStats();
      if (stats.active > 100) {
        console.warn('⚠️ High subscription count detected!');
      }
      return stats;
    };

    window.debugProfile = () => {
      const currentUser = nostrService.publicKey;
      if (currentUser) {
        nostrService.clearProfileFailureCache();
        window.location.reload();
      }
    };
  });
}

// Add dark mode class to html element by default
document.documentElement.classList.add('dark')

// Loading component for PersistGate
const LoadingComponent = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-300">Loading BlockNostr...</p>
    </div>
  </div>
)

// Initialize React app
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <Provider store={store}>
    <PersistGate loading={<LoadingComponent />} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
); 
