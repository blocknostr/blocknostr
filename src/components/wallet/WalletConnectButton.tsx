
import React from "react";
import { Wallet, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const { toast } = useToast();

  const handleConnect = () => {
    // Placeholder for future wallet connection integration
    console.log("Wallet connect clicked");
    
    toast({
      title: "Connecting wallet",
      description: "This is a placeholder. Alephium wallet integration coming soon.",
      duration: 3000,
    });
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
        <Wallet className="mr-2 h-5 w-5" />
        Connect Wallet
      </Button>
      
      <div className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        <p>Connect your Alephium wallet to access the BlockNoster decentralized ecosystem</p>
        <a 
          href="https://alephium.org/docs/wallet/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          Learn more <ExternalLink className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
};

export default WalletConnectButton;
