
import React, { useState, useEffect } from "react";
import { Shield, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { nostrService } from "@/lib/nostr";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const { toast } = useToast();
  const [hasNostrExtension, setHasNostrExtension] = useState<boolean>(false);

  React.useEffect(() => {
    // Check for NIP-07 extension
    setHasNostrExtension(!!window.nostr);
    
    // Re-check for extension periodically
    const intervalId = setInterval(() => {
      setHasNostrExtension(!!window.nostr);
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/60 to-primary/40 rounded-full opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
        <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/80 via-primary/70 to-primary/60 shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
          <Shield className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <div className="mt-6 text-center max-w-xs">
        <p className="text-lg font-light mb-3">Connect your Nostr wallet using the button in the top right corner</p>
        <p className="text-sm text-muted-foreground">
          {hasNostrExtension ? 
           "Your Nostr extension is ready to connect" : 
           "Install a Nostr-compatible extension to continue"}
        </p>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        <p>Use the {hasNostrExtension ? "Connect Wallet button" : "button"} in the top right corner to access the BlockNoster ecosystem</p>
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
          <a
            href="https://alephium.org/#wallets"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-primary/70 hover:text-primary transition-colors"
          >
            Get Alephium <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectButton;
