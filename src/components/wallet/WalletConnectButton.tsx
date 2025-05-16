
import React from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@alephium/web3-react";
import { toast } from "sonner";

interface WalletConnectButtonProps {
  className?: string;
}

// Note: This component is deprecated as wallet connection is now handled during login
// Kept for backward compatibility only
const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const wallet = useWallet();
  
  const handleConnect = () => {
    toast.info("Your wallet is already connected through login", {
      description: "No additional connection needed"
    });
  };

  if (wallet.connectionStatus === 'connected' && wallet.account) {
    return (
      <Button
        className={className}
        variant="outline"
        size="sm"
        disabled
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connected
      </Button>
    );
  }

  return (
    <Button 
      className={className}
      variant="outline" 
      size="sm"
      onClick={handleConnect}
    >
      <Wallet className="mr-2 h-4 w-4" />
      Wallet Info
    </Button>
  );
};

export default WalletConnectButton;
