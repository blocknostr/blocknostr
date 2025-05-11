
import React from "react";
import { Wallet, ExternalLink, AlertCircle, CheckCircle2, Loader, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import WalletInfo from "./WalletInfo";

interface FullWalletConnectProps {
  isConnected: boolean;
  isConnecting: boolean;
  hasNostrExtension: boolean;
  onConnect: () => void;
  onLogout: () => void;
  className?: string;
}

const FullWalletConnect: React.FC<FullWalletConnectProps> = ({
  isConnected,
  isConnecting,
  hasNostrExtension,
  onConnect,
  onLogout,
  className
}) => {
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
      
      {isConnected ? (
        <div className="space-y-3 mt-6 w-full max-w-xs">
          <Button
            className={cn(
              "py-6 px-8 rounded-xl shadow-lg transition-all duration-300 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium",
            )}
            disabled={true}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Wallet Connected
          </Button>
          
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full py-6 border-red-300/20 text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Disconnect Wallet
          </Button>
        </div>
      ) : (
        <Button
          onClick={onConnect}
          size="lg"
          disabled={isConnecting}
          className={cn(
            "py-6 px-8 mt-6 rounded-xl shadow-lg transition-all duration-300 w-full max-w-xs relative overflow-hidden",
            "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium hover:shadow-purple-500/30"
          )}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/5 to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
          {isConnecting ? (
            <>
              <Loader className="mr-2 h-5 w-5 animate-spin" />
              Connecting...
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
      )}
      
      <WalletInfo />
    </div>
  );
};

export default FullWalletConnect;
