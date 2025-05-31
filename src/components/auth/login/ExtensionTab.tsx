import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, AlertCircle, Fingerprint, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlbyLogo, NWCLogo, Nos2xLogo, AlephiumLogo, SnortLogo } from "@/components/icons/wallets";

interface ExtensionTabProps {
  hasExtension: boolean;
  connectStatus: 'idle' | 'connecting' | 'success' | 'error';
  onConnect: () => void;
  isLoggingIn: boolean;
}

const ExtensionTab: React.FC<ExtensionTabProps> = ({ 
  hasExtension, 
  connectStatus,
  onConnect,
  isLoggingIn
}) => {
  const clientOptions = [
    {
      id: "alby",
      name: "Alby",
      description: "Bitcoin & Lightning wallet",
      logo: AlbyLogo,
      url: "https://chromewebstore.google.com/detail/alby-bitcoin-wallet-for-l/iokeahhehimjnekafflcihljlcjccdbe"
    },
    {
      id: "nwc",
      name: "Nostr Wallet ID",
      description: "NIP-07 Nostr signer",
      logo: NWCLogo,
      url: "https://chromewebstore.google.com/detail/nostr-wallet-id/ajgmkkifilepekpieppfhfkladjjgihn"
    },
    {
      id: "alephium",
      name: "Alephium",
      description: "Alephium wallet extension",
      logo: AlephiumLogo,
      url: "https://chromewebstore.google.com/detail/alephium-extension-wallet/gdokollfhmnbfckbobkdbakhilldkhcj"
    },
    {
      id: "nos2x",
      name: "nos2x",
      description: "Lightweight Nostr signer",
      logo: Nos2xLogo,
      url: "https://chromewebstore.google.com/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
    }
  ];
  
  return (
    <div className="space-y-4 h-full flex flex-col">
      {!hasExtension && (
        <p className="text-sm text-center text-muted-foreground">
          Install a wallet extension to continue
        </p>
      )}

      {/* Optimized grid layout for better space usage */}
      <div className="grid grid-cols-2 gap-3 flex-shrink-0">
        {clientOptions.map(client => (
          <a 
            key={client.id}
            href={client.url}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col items-center p-3 border border-border/50 rounded-lg hover:bg-accent/20 transition-colors group h-[90px] justify-between"
          >
            <div className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm mb-1">
              <client.logo className="w-7 h-7" />
            </div>
            <div className="text-center flex-1 flex flex-col justify-center">
              <p className="font-medium text-xs mb-0.5 leading-tight">{client.name}</p>
              <p className="text-xs text-muted-foreground leading-tight">{client.description}</p>
            </div>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
          </a>
        ))}
      </div>
      
      {/* Compact info section */}
      <div className="bg-blue-50/40 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/30 text-xs flex-shrink-0">
        <p className="text-blue-700 dark:text-blue-300">
          <span className="font-medium">Tip:</span> Alephium users can use their wallet with Nostr through Schnorr signatures.
        </p>
      </div>

      {/* Connection status - compact design */}
      <div className="flex-shrink-0">
        {hasExtension ? (
          <div className="flex items-center justify-between p-2.5 bg-green-50/50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800/30">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">Nostr extension detected</span>
            </div>
            
            <Button
              onClick={onConnect}
              size="sm"
              disabled={isLoggingIn || connectStatus === 'success'}
              className={cn(
                "relative overflow-hidden ml-2 px-3",
                "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white",
                "transition-all duration-300 h-7"
              )}
            >
              {isLoggingIn ? (
                <div className="flex items-center">
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  <span className="text-xs">Connecting...</span>
                </div>
              ) : connectStatus === 'success' ? (
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1.5" />
                  <span className="text-xs">Connected</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Fingerprint className="h-3 w-3 mr-1.5" />
                  <span className="text-xs">Connect</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center p-2.5 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/30">
            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="text-sm">Install an extension above to continue</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtensionTab;

