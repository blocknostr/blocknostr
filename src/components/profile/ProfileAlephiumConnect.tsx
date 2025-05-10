
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, LinkIcon, Copy, Check, ExternalLink } from "lucide-react";
import { alephiumService } from "@/lib/alephium";
import { toast } from "sonner";

interface ProfileAlephiumConnectProps {
  isCurrentUser: boolean;
  nostrPubkey: string;
}

const ProfileAlephiumConnect = ({ isCurrentUser, nostrPubkey }: ProfileAlephiumConnectProps) => {
  const [alephiumAddress, setAlephiumAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  useEffect(() => {
    // Get initial wallet state
    const walletState = alephiumService.state;
    setIsConnected(walletState.connected);
    setAlephiumAddress(walletState.address);
    
    // Listen for wallet events
    const handleConnect = (data: { address: string }) => {
      setIsConnected(true);
      setAlephiumAddress(data.address);
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      setAlephiumAddress(null);
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
  
  const handleCopyAddress = () => {
    if (alephiumAddress) {
      navigator.clipboard.writeText(alephiumAddress);
      setIsCopied(true);
      toast.success("Address copied to clipboard");
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  // Only show this component for the current user
  if (!isCurrentUser) return null;
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Alephium Wallet
          </h3>
          
          {isConnected && alephiumAddress && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = "/wallets"; }}
            >
              Manage Wallet
            </Button>
          )}
        </div>
        
        {isConnected && alephiumAddress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
              <span className="font-mono truncate flex-1">{alephiumAddress}</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleCopyAddress}
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
              >
                <a 
                  href={`https://explorer.alephium.org/addresses/${alephiumAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Your Alephium wallet is connected. You can now receive tips and interact with Alephium-powered features.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Alephium wallet to receive tips and interact with Alephium-powered features.
            </p>
            
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect Alephium Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileAlephiumConnect;
