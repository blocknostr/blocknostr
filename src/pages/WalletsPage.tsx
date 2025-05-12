
import React from "react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";

const WalletsPage = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Connect Your Wallet</h2>
        <p className="text-muted-foreground max-w-md">
          Connect your Alephium wallet to access exclusive features, post content, and interact with the BlockNoster community.
        </p>
        
        <div className="w-full max-w-md my-8">
          <WalletConnectButton />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-medium mb-2">Secure Transactions</h3>
            <p className="text-sm text-muted-foreground">All transactions are secured by Alephium's PoLW consensus mechanism</p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-medium mb-2">Decentralized Identity</h3>
            <p className="text-sm text-muted-foreground">Control your data with cryptographic identity verification</p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-medium mb-2">Low Fees</h3>
            <p className="text-sm text-muted-foreground">Benefit from Alephium's high throughput and low transaction costs</p>
          </div>
          <div className="p-4 border rounded-lg bg-card">
            <h3 className="font-medium mb-2">Cross-Platform</h3>
            <p className="text-sm text-muted-foreground">Works seamlessly with mobile and browser wallets</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletsPage;
