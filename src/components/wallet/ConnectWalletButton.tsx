
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2, LogOut } from "lucide-react";
import { alephiumService } from "@/lib/alephium";
import { useEffect } from "react";
import { toast } from "sonner";

const ConnectWalletButton = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  
  useEffect(() => {
    // Initialize wallet state
    const walletState = alephiumService.state;
    setIsConnected(walletState.connected);
    setAddress(walletState.address);
    
    // Listen for wallet events
    const handleConnect = (data: { address: string }) => {
      setIsConnected(true);
      setAddress(data.address);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      setAddress(null);
    };
    
    alephiumService.on('connect', handleConnect);
    alephiumService.on('disconnect', handleDisconnect);
    
    return () => {
      alephiumService.off('connect', handleConnect);
      alephiumService.off('disconnect', handleDisconnect);
    };
  }, []);
  
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await alephiumService.connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await alephiumService.disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };
  
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => { window.location.href = "/wallets"; }}
        >
          <Wallet className="h-4 w-4" />
          {alephiumService.formatAddress(address)}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-red-500" 
          onClick={handleDisconnect}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  
  return (
    <Button 
      onClick={handleConnect} 
      disabled={isConnecting}
      className="flex items-center gap-2"
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      <span>Connect Wallet</span>
    </Button>
  );
};

export default ConnectWalletButton;
