
import React from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@alephium/web3-react";
import { Wallet } from "lucide-react";

const WalletConnectButton: React.FC = () => {
  const wallet = useWallet();

  const handleConnect = async () => {
    if (wallet.connectionStatus === 'disconnected') {
      try {
        // Using a more generic approach since we don't know which methods are available
        // @ts-ignore - We're checking at runtime if these methods exist
        if (wallet.connect) {
          // @ts-ignore
          await wallet.connect();
        // @ts-ignore
        } else if (wallet.walletConnect) {
          // @ts-ignore
          await wallet.walletConnect();
        // @ts-ignore
        } else if (wallet.enable) {
          // @ts-ignore
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
