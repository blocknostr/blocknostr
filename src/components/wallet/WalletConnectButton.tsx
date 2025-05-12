
import React from "react";
import { Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const [hasNostrExtension, setHasNostrExtension] = React.useState<boolean>(false);

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
      <div className="relative group mb-4">
        {/* Animated outer glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/60 to-primary/40 rounded-full opacity-70 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
        
        {/* Circular container with premium gradient */}
        <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/80 via-primary/70 to-primary/60 shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
          {/* Inner shine effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-full opacity-50"></div>
          <Shield className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <div className="mt-4 text-center max-w-xs">
        <h3 className="text-lg font-light tracking-tight mb-3">Connect to BlockNoster</h3>
        <p className="text-sm text-muted-foreground">
          {hasNostrExtension ? 
           "Your Nostr extension is ready to connect" : 
           "Install a Nostr-compatible extension to continue"}
        </p>
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-xs">
        <a 
          href="https://getalby.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 text-xs text-primary/70 hover:text-primary border border-transparent hover:border-primary/10 rounded-lg hover:bg-primary/5 transition-all group"
        >
          <span className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-500 mb-1.5 flex items-center justify-center font-medium">A</span>
          <span>Alby</span>
          <ExternalLink className="mt-1 h-3 w-3 opacity-60 group-hover:opacity-100" />
        </a>
        
        <a 
          href="https://github.com/fiatjaf/nos2x" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 text-xs text-primary/70 hover:text-primary border border-transparent hover:border-primary/10 rounded-lg hover:bg-primary/5 transition-all group"
        >
          <span className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500 mb-1.5 flex items-center justify-center font-medium">N</span>
          <span>Nos2x</span>
          <ExternalLink className="mt-1 h-3 w-3 opacity-60 group-hover:opacity-100" />
        </a>
        
        <a
          href="https://alephium.org/#wallets"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-3 text-xs text-primary/70 hover:text-primary border border-transparent hover:border-primary/10 rounded-lg hover:bg-primary/5 transition-all group"
        >
          <span className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 text-green-500 mb-1.5 flex items-center justify-center font-medium">A</span>
          <span>Alephium</span>
          <ExternalLink className="mt-1 h-3 w-3 opacity-60 group-hover:opacity-100" />
        </a>
      </div>
    </div>
  );
};

export default WalletConnectButton;
