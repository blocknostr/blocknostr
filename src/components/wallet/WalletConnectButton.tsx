
import React from "react";
import { Wallet, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { nostrService } from "@/lib/nostr";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const { toast } = useToast();
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

  const handleConnect = async () => {
    if (hasNostrExtension) {
      try {
        // Try to use NIP-07 login
        const success = await nostrService.login();
        if (success) {
          toast({
            title: "Successfully connected",
            description: "Your Nostr extension is now connected to BlockNoster",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Connect error:", error);
        toast({
          title: "Connection failed",
          description: "Could not connect to your Nostr extension",
          variant: "destructive",
          duration: 3000,
        });
      }
    } else {
      toast({
        title: "No extension found",
        description: "Please install a Nostr browser extension like Alby or nos2x",
        duration: 5000,
      });
      // Open extension info
      window.open("https://getalby.com/", "_blank");
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
        <div className="relative p-6 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 shadow-lg group-hover:shadow-purple-500/40 transition-all duration-300">
          <Wallet className="h-12 w-12 text-white" />
        </div>
      </div>
      
      <Button
        onClick={handleConnect}
        size="lg"
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-6 px-8 mt-6 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 w-full max-w-xs relative overflow-hidden"
      >
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400/10 to-indigo-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
        {hasNostrExtension ? (
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
          >
            Get Alby <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <a 
            href="https://github.com/fiatjaf/nos2x" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Get nos2x <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectButton;
