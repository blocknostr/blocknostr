
import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">BlockNoster</h1>
      <p className="mb-4">
        Welcome to BlockNoster - a decentralized platform combining Alephium blockchain and Nostr protocol.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-3">Alephium Integration</h2>
          <p>Leverage Alephium's high-throughput blockchain for secure on-chain operations.</p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-3">Nostr Communication</h2>
          <p>Use Nostr's decentralized protocol for censorship-resistant messaging and social interactions.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
