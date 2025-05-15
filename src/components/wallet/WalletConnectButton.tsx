
import React, { useEffect, useState } from "react";
import { Shield, ExternalLink, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlephiumLogo } from "@/components/icons/wallets";
import { useWallet } from "@alephium/web3-react";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
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

  const handleConnect = () => {
    // Using signer.connect() instead of wallet.connect()
    if (wallet.signer) {
      wallet.signer.connect();
    }
  };

  const isConnected = wallet.connectionStatus === 'connected';
  const isConnecting = wallet.connectionStatus === 'connecting';

  if (isConnected && wallet.account) {
    return (
      <Button
        className={cn("w-full", className)}
        disabled
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connected
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative group mb-3">
        {/* Animated outer glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/60 to-primary/40 rounded-full opacity-70 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
        
        {/* Circular container with premium gradient */}
        <div className="relative p-5 rounded-full bg-gradient-to-br from-primary/80 via-primary/70 to-primary/60 shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
          {/* Inner shine effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-full opacity-50"></div>
          <Shield className="h-10 w-10 text-white" />
        </div>
      </div>
      
      <div className="mt-3 text-center max-w-xs">
        <h3 className="text-lg font-light tracking-tight mb-2">Connect to Alephium</h3>
        <p className="text-sm text-muted-foreground">
          {hasWalletExtension ? 
           "Your Alephium wallet extension is ready to connect" : 
           "Install the Alephium wallet extension to continue"}
        </p>
      </div>
      
      <Button 
        className="mt-6 w-full"
        onClick={handleConnect}
        disabled={isConnecting || !hasWalletExtension || !wallet.signer}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
      
      {!hasWalletExtension && (
        <div className="mt-4 grid grid-cols-1 gap-2 w-full max-w-xs">
          <a
            href="https://alephium.org/#wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-2.5 text-xs text-primary/70 hover:text-primary border border-transparent hover:border-primary/10 rounded-lg hover:bg-primary/5 transition-all group"
          >
            <span className="h-8 w-8 mb-1.5 flex items-center justify-center">
              <AlephiumLogo className="w-8 h-8" />
            </span>
            <span>Get Alephium Wallet</span>
            <ExternalLink className="mt-1 h-3 w-3 opacity-60 group-hover:opacity-100" />
          </a>
        </div>
      )}
    </div>
  );
};

export default WalletConnectButton;
