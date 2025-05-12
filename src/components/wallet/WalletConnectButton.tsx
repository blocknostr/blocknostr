
import React, { useState } from "react";
import { Wallet, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { nostrService } from "@/lib/nostr";
import LoginDialog from "@/components/auth/LoginDialog";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const { toast } = useToast();
  const [hasNostrExtension, setHasNostrExtension] = useState<boolean>(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  React.useEffect(() => {
    // Check for NIP-07 extension
    setHasNostrExtension(!!window.nostr);
    
    // Re-check for extension periodically
    const intervalId = setInterval(() => {
      setHasNostrExtension(!!window.nostr);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleConnect = async () => {
    // Open login dialog
    setLoginDialogOpen(true);
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/80 to-primary/60 rounded-full opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
        <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/90 via-primary/80 to-primary/70 shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
          <Wallet className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <Button
        onClick={handleConnect}
        size="lg"
        className="bg-gradient-to-r from-primary/90 to-primary/80 hover:from-primary/80 hover:to-primary/70 text-white font-medium py-6 px-8 mt-6 rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300 w-full max-w-xs relative overflow-hidden"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
        {hasNostrExtension ? (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </>
        ) : (
          <>
            <AlertCircle className="mr-2 h-5 w-5 text-amber-300" />
            Install Nostr Extension
          </>
        )}
      </Button>
      
      <div className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        <p>Connect your {hasNostrExtension ? "Nostr wallet" : "Alephium wallet"} to access the BlockNoster decentralized ecosystem</p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <a 
            href="https://getalby.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-primary/70 hover:text-primary transition-colors"
          >
            Get Alby <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <a 
            href="https://github.com/fiatjaf/nos2x" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-primary/70 hover:text-primary transition-colors"
          >
            Get nos2x <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
      
      {/* Login Dialog */}
      <LoginDialog 
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
      />
    </div>
  );
};

export default WalletConnectButton;
