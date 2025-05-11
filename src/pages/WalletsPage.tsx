
import React, { useState, useEffect } from "react";
import PageHeader from "@/components/navigation/PageHeader";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import WalletInfo from "@/components/wallet/WalletInfo";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";
import { Card } from "@/components/ui/card";
import { nostrService } from "@/lib/nostr";
import { CheckCircle2, Loader, Lock, Zap, Layers } from "lucide-react";
import { toast } from "sonner";

const WalletsPage = () => {
  const { triggerHaptic } = useHapticFeedback();
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const pubkey = nostrService.publicKey;
        setIsConnected(!!pubkey);
      } catch (error) {
        console.error("Error checking connection:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkConnection();
  }, []);
  
  // Random delay effect for demo purposes
  useEffect(() => {
    if (!isChecking) return;
    
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [isChecking]);

  const handleCardPress = (title: string) => {
    triggerHaptic('medium');
    toast.info(`${title} feature coming soon!`);
  };

  return (
    <>
      <PageHeader title="Wallet" showBackButton={true} />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="relative">
            <div className="absolute -inset-1 bg-purple-500/20 blur-lg rounded-full"></div>
            <h2 className="relative text-3xl font-bold tracking-tight bg-gradient-to-br from-purple-500 to-indigo-600 bg-clip-text text-transparent px-4 py-2">
              Connect Your Wallet
            </h2>
          </div>
          
          <p className="text-muted-foreground max-w-md">
            Connect your Alephium wallet to access exclusive features, post content, and interact with the BlockNoster community.
          </p>
          
          <div className="w-full max-w-md my-8 relative">
            {isChecking && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="h-8 w-8 animate-spin text-purple-500" />
                  <p className="text-sm text-muted-foreground">Checking wallet status...</p>
                </div>
              </div>
            )}
            
            <WalletConnectButton />
            <WalletInfo />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
            <Card 
              onClick={() => handleCardPress("Secure Transactions")}
              className="p-4 border rounded-lg bg-card cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-card/80 hover:border-purple-500/20 active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/5 text-blue-500">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium mb-1">Secure Transactions</h3>
                  <p className="text-sm text-muted-foreground">All transactions are secured by Alephium's PoLW consensus mechanism</p>
                </div>
              </div>
            </Card>
            
            <Card 
              onClick={() => handleCardPress("Decentralized Identity")}
              className="p-4 border rounded-lg bg-card cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-card/80 hover:border-purple-500/20 active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-gradient-to-br from-purple-500/10 to-purple-600/5 text-purple-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium mb-1">Decentralized Identity</h3>
                  <p className="text-sm text-muted-foreground">Control your data with cryptographic identity verification</p>
                </div>
              </div>
            </Card>
            
            <Card 
              onClick={() => handleCardPress("Low Fees")}
              className="p-4 border rounded-lg bg-card cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-card/80 hover:border-purple-500/20 active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-gradient-to-br from-green-500/10 to-green-600/5 text-green-500">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium mb-1">Low Fees</h3>
                  <p className="text-sm text-muted-foreground">Benefit from Alephium's high throughput and low transaction costs</p>
                </div>
              </div>
            </Card>
            
            <Card 
              onClick={() => handleCardPress("Cross-Platform")}
              className="p-4 border rounded-lg bg-card cursor-pointer transition-all duration-300 hover:shadow-md hover:bg-card/80 hover:border-purple-500/20 active:scale-[0.98]"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2 bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-amber-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium mb-1">Cross-Platform</h3>
                  <p className="text-sm text-muted-foreground">Works seamlessly with mobile and browser wallets</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default WalletsPage;
