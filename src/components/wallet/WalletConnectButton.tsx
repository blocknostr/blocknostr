
import React from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WalletConnectButtonProps {
  className?: string;
}

const WalletConnectButton = ({ className }: WalletConnectButtonProps) => {
  const handleConnect = () => {
    // This is a placeholder for the actual wallet connection logic
    console.log("Wallet connect clicked");
    // In the future, this would integrate with Alephium wallet SDK
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="p-6 mb-4 rounded-full bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
        <Wallet className="h-12 w-12 text-white" />
      </div>
      <Button
        onClick={handleConnect}
        size="lg"
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-6 px-8 rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all duration-300 w-full max-w-xs"
      >
        <Wallet className="mr-2 h-5 w-5" />
        Connect Wallet
      </Button>
      <p className="mt-4 text-sm text-muted-foreground text-center max-w-xs">
        Connect your Alephium wallet to access the BlockNoster decentralized ecosystem
      </p>
    </div>
  );
};

export default WalletConnectButton;
