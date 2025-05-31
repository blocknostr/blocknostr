import React, { useEffect, useState } from "react";
import { Shield, ExternalLink, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlephiumLogo } from "@/components/icons/wallets";
import { useWallet } from "@alephium/web3-react";
import { toast } from "@/lib/toast";

interface WalletConnectButtonProps {
  className?: string;
}

// Debug helper function
const debugAlephiumWallet = () => {
  console.group("🔍 Alephium Wallet Debug");
  console.log("window.alephiumProviders:", (window as any).alephiumProviders);
  console.log("window.alephiumProviders?.alephium:", (window as any).alephiumProviders?.alephium);
  console.log("All window properties containing 'aleph':", Object.keys(window).filter(key => key.toLowerCase().includes('aleph')));
  console.groupEnd();
};

// Make debug function available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugAlephiumWallet = debugAlephiumWallet;
}

const WalletConnectButton = ({
  className
}: WalletConnectButtonProps) => {
  const wallet = useWallet();
  const [hasWalletExtension, setHasWalletExtension] = useState<boolean>(false);

  useEffect(() => {
    // Check if Alephium wallet extension is available
    const checkForWallet = () => {
      const hasWallet = !!(window as any).alephiumProviders?.alephium;
      setHasWalletExtension(hasWallet);
      
      if (hasWallet) {
        console.log('✅ Alephium extension wallet detected');
      } else {
        console.log('❌ Alephium extension wallet not detected');
        // Run debug in development
        if (process.env.NODE_ENV === 'development') {
          debugAlephiumWallet();
        }
      }
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
      // Check if extension is available first
      if (!(window as any).alephiumProviders?.alephium) {
        toast.error("Extension wallet not found", {
          description: "Please install the Alephium Extension Wallet from Chrome or Firefox store"
        });
        
        // Show debug info in development
        if (process.env.NODE_ENV === 'development') {
          debugAlephiumWallet();
        }
        return;
      }

      // Request wallet connection using wallet.signer object
      if (wallet.signer) {
        await (wallet.signer as any).requestAuth();
        toast.success("Wallet connection requested", {
          description: "Please approve the connection in your wallet"
        });
      } else {
        // Try direct connection to extension
        const alephiumWallet = (window as any).alephiumProviders.alephium;
        if (alephiumWallet) {
          const account = await alephiumWallet.enable();
          if (account) {
            toast.success("Wallet connected successfully", {
              description: `Connected to ${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 4)}`
            });
          }
        } else {
          toast.error("Wallet connection failed", {
            description: "No compatible wallet provider found"
          });
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Connection failed", {
        description: error instanceof Error ? error.message : "Please check that your Alephium Extension Wallet is unlocked"
      });
    }
  };

  const isConnected = wallet.connectionStatus === 'connected';
  const isConnecting = wallet.connectionStatus === 'connecting';

  if (isConnected && wallet.account) {
    return (
      <Button className={cn("w-full", className)} variant="outline">
        <Wallet className="mr-2 h-4 w-4" />
        Connected
      </Button>
    );
  }

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

