
import React, { useEffect, useState } from "react";
import { Shield, ExternalLink, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlephiumLogo } from "@/components/icons/wallets";
import { useWallet } from "@alephium/web3-react";
import { toast } from "sonner";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({
  className
}: WalletConnectButtonProps) => {
  const wallet = useWallet();
  const [hasWalletExtension, setHasWalletExtension] = useState<boolean>(false);

  useEffect(() => {
    // Check if Alephium wallet extension is available
    const checkForWallet = () => {
      const hasWallet = !!(window as any).alephiumProviders;
      setHasWalletExtension(hasWallet);
    };
    checkForWallet();

    // Re-check for extension periodically
    const intervalId = setInterval(() => {
      checkForWallet();
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleConnect = async () => {
    try {
      // Request wallet connection using wallet.signer object
      if (wallet.signer) {
        await (wallet.signer as any).requestAuth();
        toast.success("Wallet connection requested", {
          description: "Please approve the connection in your wallet"
        });
      } else {
        toast.error("Wallet connection failed", {
          description: "No compatible wallet provider found"
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Connection failed", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const isConnected = wallet.connectionStatus === 'connected';
  const isConnecting = wallet.connectionStatus === 'connecting';

  if (isConnected && wallet.account) {
    return (
      <Button className={cn("w-full", className)} variant="outline" disabled>
        <Wallet className="mr-2 h-4 w-4" />
        Connected
      </Button>
    );
  }

  // This component was previously returning nothing if not connected
  // Let's fix that and return the connect button
  return (
    <Button
      className={cn("w-full", className)}
      variant="default"
      onClick={handleConnect}
      disabled={isConnecting || !hasWalletExtension}
    >
      {isConnecting ? (
        <>
          <span className="animate-spin mr-2">⟳</span>
          Connecting...
        </>
      ) : (
        <>
          <AlephiumLogo className="mr-2 h-4 w-4" />
          {hasWalletExtension ? "Connect Wallet" : "Install Wallet Extension"}
        </>
      )}
    </Button>
  );
};

export default WalletConnectButton;
