
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "sonner";

// Main Layout
import Layout from "./Layout";

// Pages
import Home from "./pages/home";

// Initialize Nostr connections
import initializeNostrConnections from "./lib/nostr/init";

function App() {
  // Initialize Nostr connections when app loads
  useEffect(() => {
    initializeNostrConnections();
  }, []);
  
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          {/* Add other routes here */}
        </Routes>
      </Router>
      <Toaster position="top-right" closeButton richColors />
    </>
  );
}

export default App;
