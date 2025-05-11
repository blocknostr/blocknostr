
import React, { useEffect } from "react";
import { Wallet, ExternalLink, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const [hasNostrExtension, setHasNostrExtension] = React.useState<boolean>(false);
  const [isConnecting, setIsConnecting] = React.useState<boolean>(false);
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const { triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    // Check for NIP-07 extension
    setHasNostrExtension(!!window.nostr);
    
    // Check if already connected
    const checkConnection = async () => {
      const pubkey = nostrService.publicKey;
      setIsConnected(!!pubkey);
    };
    
    checkConnection();
    
    // Re-check for extension periodically
    const intervalId = setInterval(() => {
      setHasNostrExtension(!!window.nostr);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleConnect = async () => {
    triggerHaptic('medium');
    
    if (!hasNostrExtension) {
      toast("No extension found", {
        description: "Please install a Nostr browser extension like Alby or nos2x",
        duration: 5000,
      });
      
      // Open extension info
      window.open("https://getalby.com/", "_blank");
      return;
    }
    
    setIsConnecting(true);
    
    try {
      // Try to use NIP-07 login
      const success = await nostrService.login();
      if (success) {
        setIsConnected(true);
        triggerHaptic('success');
        toast("Successfully connected", {
          description: "Your Nostr extension is now connected to BlockNoster",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Connect error:", error);
      triggerHaptic('error');
      toast("Connection failed", {
        description: "Could not connect to your Nostr extension",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
        <div className={cn(
          "relative p-6 rounded-full shadow-lg group-hover:shadow-purple-500/40 transition-all duration-300",
          isConnected 
            ? "bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600" 
            : "bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600"
        )}>
          {isConnected ? (
            <CheckCircle2 className="h-12 w-12 text-white" />
          ) : (
            <Wallet className="h-12 w-12 text-white" />
          )}
        </div>
      </div>
      
      <Button
        onClick={handleConnect}
        size="lg"
        disabled={isConnecting || isConnected}
        className={cn(
          "py-6 px-8 mt-6 rounded-xl shadow-lg transition-all duration-300 w-full max-w-xs relative overflow-hidden",
          isConnected 
            ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium hover:shadow-green-500/30"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium hover:shadow-purple-500/30"
        )}
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
        {isConnecting ? (
          <>
            <Loader className="mr-2 h-5 w-5 animate-spin" />
            Connecting...
          </>
        ) : isConnected ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Connected
          </>
        ) : hasNostrExtension ? (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Connect Nostr Extension
          </>
        ) : (
          <>
            <AlertCircle className="mr-2 h-5 w-5 text-amber-300" />
            Install Nostr Extension
          </>
        )}
      </Button>
      
      <div className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        <p>Connect your {hasNostrExtension ? "Nostr extension" : "Alephium wallet"} to access the BlockNoster decentralized ecosystem</p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <a 
            href="https://getalby.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
            onClick={() => triggerHaptic('light')}
          >
            Get Alby <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <a 
            href="https://github.com/fiatjaf/nos2x" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
            onClick={() => triggerHaptic('light')}
          >
            Get nos2x <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectButton;
