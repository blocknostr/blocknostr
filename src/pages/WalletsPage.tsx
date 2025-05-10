
import { useEffect, useState } from "react";
import { alephiumService } from "@/lib/alephium";
import WalletBalance from "@/components/wallet/WalletBalance";
import SendTransactionForm from "@/components/wallet/SendTransactionForm";
import { Button } from "@/components/ui/button";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

const WalletsPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  useEffect(() => {
    // Check initial state
    const walletState = alephiumService.state;
    setIsConnected(walletState.connected);
    
    // Listen for wallet events
    const handleConnect = () => {
      setIsConnected(true);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
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
  
  if (!isConnected) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Alephium Wallet</h1>
        
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card">
          <div className="text-center mb-6">
            <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Connect your wallet</h2>
            <p className="text-muted-foreground mb-4">
              Connect your Alephium wallet to view your balance and send transactions
            </p>
          </div>
          
          <Button 
            size="lg"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Alephium Wallet</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <WalletBalance />
        </div>
        <div>
          <SendTransactionForm />
        </div>
      </div>
    </div>
  );
};

export default WalletsPage;
