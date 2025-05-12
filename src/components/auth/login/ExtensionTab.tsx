
import React, { useState, useEffect } from "react";
import { CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExtensionTabProps {
  hasExtension: boolean;
  connectStatus: 'idle' | 'connecting' | 'success' | 'error';
}

const ExtensionTab: React.FC<ExtensionTabProps> = ({ 
  hasExtension, 
  connectStatus
}) => {
  const clientOptions = [
    {
      id: "alby",
      name: "Alby",
      description: "Browser extension",
      color: "bg-amber-400",
      letter: "A",
      url: "https://getalby.com/"
    },
    {
      id: "alephium",
      name: "Alephium",
      description: "Wallet extension",
      color: "bg-green-500", 
      letter: "A",
      url: "https://alephium.org/#wallets"
    },
    {
      id: "nos2x",
      name: "nos2x",
      description: "Browser extension",
      color: "bg-blue-500",
      letter: "N",
      url: "https://github.com/fiatjaf/nos2x"
    },
    {
      id: "snort",
      name: "Snort",
      description: "Web client",
      color: "bg-purple-500",
      letter: "S",
      url: "https://snort.social/"
    }
  ];
  
  return (
    <div className="space-y-4">
      {hasExtension ? (
        <div className="flex items-center p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300">
          <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>Nostr extension detected</span>
        </div>
      ) : (
        <div className="flex items-center p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>No Nostr extension detected</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {clientOptions.map(client => (
          <a 
            key={client.id}
            href={client.url}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors group"
          >
            <div className={`mr-2 h-8 w-8 rounded-full ${client.color} flex items-center justify-center text-white font-medium text-sm`}>
              {client.letter}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{client.name}</p>
              <p className="text-xs text-muted-foreground">{client.description}</p>
            </div>
            <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
          </a>
        ))}
      </div>
      
      <div className="bg-blue-50/40 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <span className="font-medium">Alephium users:</span> If you have the Alephium wallet extension, you can use it with Nostr. When connecting, it will prompt you to create a Schnorr signature child wallet from your seed phrase.
        </p>
      </div>
    </div>
  );
};

export default ExtensionTab;
