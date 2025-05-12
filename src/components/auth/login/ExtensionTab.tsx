
import React from "react";
import { CheckCircle, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

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
      description: "Bitcoin & Nostr browser extension",
      color: "bg-gradient-to-br from-amber-400 to-amber-500",
      letter: "A",
      url: "https://getalby.com/"
    },
    {
      id: "alephium",
      name: "Alephium",
      description: "BlockNoster-compatible wallet",
      color: "bg-gradient-to-br from-green-500 to-green-600", 
      letter: "A",
      url: "https://alephium.org/#wallets"
    },
    {
      id: "nos2x",
      name: "nos2x",
      description: "Lightweight Nostr signer",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      letter: "N",
      url: "https://github.com/fiatjaf/nos2x"
    },
    {
      id: "snort",
      name: "Snort",
      description: "Web client with extension",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      letter: "S",
      url: "https://snort.social/"
    }
  ];
  
  return (
    <div className="space-y-4">
      {hasExtension ? (
        <div className="flex items-center p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800/30">
          <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>Nostr extension detected</span>
        </div>
      ) : (
        <div className="flex items-center p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/30">
          <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
          <span>No Nostr extension detected</span>
        </div>
      )}

      <p className="text-sm text-center text-muted-foreground mb-3">
        {hasExtension ? "Select Connect to authorize access" : "Install one of these extensions to connect"}
      </p>

      <div className="px-1">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-1">
            {clientOptions.map(client => (
              <CarouselItem key={client.id} className="pl-1 basis-1/2 md:basis-1/2">
                <a 
                  href={client.url}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center p-3 border border-border/50 rounded-lg hover:bg-accent/20 transition-colors group h-full"
                >
                  <div className={`mb-2 h-10 w-10 rounded-full ${client.color} flex items-center justify-center text-white font-medium text-lg shadow-sm`}>
                    {client.letter}
                  </div>
                  <div className="flex-1 text-center">
                    <p className="font-medium text-sm mb-1">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.description}</p>
                  </div>
                  <ExternalLink className="mt-2 h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                </a>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      
      <div className="bg-blue-50/40 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <span className="font-medium">Alephium users:</span> If you have the Alephium wallet extension, you can use it with Nostr by creating a Schnorr signature child wallet.
        </p>
      </div>
    </div>
  );
};

export default ExtensionTab;
