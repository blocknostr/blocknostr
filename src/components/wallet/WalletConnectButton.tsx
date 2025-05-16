
import React from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@alephium/web3-react";
import { Wallet } from "lucide-react";

const WalletConnectButton: React.FC = () => {
  const wallet = useWallet();

  const handleConnect = async () => {
    if (wallet.connectionStatus === 'disconnected') {
      try {
        // Using the wallet.walletConnect method if available, falling back to any other methods
        if (typeof wallet.walletConnect === 'function') {
          await wallet.walletConnect();
        } else if (typeof wallet.enable === 'function') {
          await wallet.enable();
        } else {
          console.error("No compatible connect method found on wallet object");
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    }
  };

  // Already connected
  if (wallet.connectionStatus === 'connected' && wallet.account) {
    return (
      <Button disabled className="w-full">
        <Wallet className="mr-2 h-4 w-4" />
        Wallet Connected
      </Button>
    );
  }

  // Connecting
  if (wallet.connectionStatus === 'connecting') {
    return (
      <Button disabled className="w-full">
        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Connecting...
      </Button>
    );
  }

  // Not connected
  return (
    <Button onClick={handleConnect} className="w-full">
      <Wallet className="mr-2 h-4 w-4" />
      Connect Wallet
    </Button>
  );
};

export default WalletConnectButton;
