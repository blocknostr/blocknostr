
import React from "react";
import { CircuitBreaker, CircuitState } from "@/lib/nostr";
import { EnhancedRelay } from "../ProfileRelaysDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ExternalLink, AlertTriangle, Check, Clock, X, Wifi, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RelayListProps {
  relays: EnhancedRelay[];
  onRemoveRelay: (url: string) => void;
  isCurrentUser: boolean;
}

export const RelayList: React.FC<RelayListProps> = ({
  relays,
  onRemoveRelay,
  isCurrentUser
}) => {
  // Function to get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "connected":
        return "success";
      case "connecting":
        return "warning";
      case "disconnected":
      case "error":
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Function to get status badge text
  const getStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting";
      case "disconnected":
        return "Disconnected";
      case "error":
        return "Error";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <Check className="h-3.5 w-3.5" />;
      case "connecting":
        return <Clock className="h-3.5 w-3.5" />;
      case "disconnected":
      case "error":
      case "failed":
        return <X className="h-3.5 w-3.5" />;
      default:
        return <WifiOff className="h-3.5 w-3.5" />;
    }
  };

  // Function to get circuit status description
  const getCircuitStatusDescription = (status?: CircuitState) => {
    switch (status) {
      case "closed":
        return "Normal operation";
      case "half-open":
        return "Trying to recover";
      case "open":
        return "Circuit open (too many failures)";
      default:
        return "Unknown circuit state";
    }
  };

  // Function to get circuit status icon
  const getCircuitStatusIcon = (status?: CircuitState) => {
    switch (status) {
      case "closed":
        return <Wifi className="h-3.5 w-3.5 text-green-500" />;
      case "half-open":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case "open":
        return <WifiOff className="h-3.5 w-3.5 text-red-500" />;
      default:
        return <Wifi className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {relays.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No relays configured. Add some relays to connect to the Nostr network.
        </div>
      ) : (
        relays.map((relay, index) => (
          <div 
            key={relay.url} 
            className={`
              p-3 rounded-lg border 
              ${relay.status === "connected" ? "bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-900" : 
               relay.status === "connecting" ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900" :
               relay.status === "disconnected" || relay.status === "error" || relay.status === "failed" ? 
               "bg-red-50/30 dark:bg-red-950/20 border-red-200 dark:border-red-900" : 
               "bg-gray-50/30 dark:bg-gray-900/20"}
            `}
          >
            <div className="flex justify-between items-center">
              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium break-all">{relay.url}</h3>
                  
                  <Badge variant={getStatusVariant(relay.status) as any} className="ml-2 h-5 px-1.5">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(relay.status)}
                      <span className="text-[10px]">{getStatusText(relay.status)}</span>
                    </span>
                  </Badge>
                  
                  {relay.isRequired && (
                    <Badge variant="outline" className="h-5 px-1.5">
                      <span className="text-[10px]">Required</span>
                    </Badge>
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          {getCircuitStatusIcon(relay.circuitStatus)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">
                          Circuit status: {getCircuitStatusDescription(relay.circuitStatus)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex items-center gap-4 mt-1">
                  <div className="text-xs text-muted-foreground">
                    {relay.read !== false && "Read"}
                    {relay.read !== false && relay.write !== false && " / "}
                    {relay.write !== false && "Write"}
                  </div>
                  
                  {relay.score !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Score: {relay.score}/100
                    </div>
                  )}
                  
                  {relay.avgResponse !== undefined && (
                    <div className="text-xs text-muted-foreground">
                      Avg response: {Math.round(relay.avgResponse)}ms
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <a
                  href={relay.url.startsWith("wss://") ? `https://${relay.url.substring(6)}` : relay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-muted rounded"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
                
                {isCurrentUser && !relay.isRequired && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRemoveRelay(relay.url)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
