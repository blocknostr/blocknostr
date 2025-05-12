
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { EnhancedRelay } from "@/components/profile/ProfileRelaysDialog";
import { WifiOff, Wifi, Clock, AlertTriangle } from "lucide-react";
import { CircuitBreaker, CircuitStateValues } from "@/lib/nostr/relay/circuit/circuit-breaker";
import { Relay } from "@/lib/nostr/types";

interface RelayListProps {
  relays: Relay[];
  onRemoveRelay?: (relayUrl: string) => void;
  isCurrentUser: boolean;
  renderRelayScore?: (relay: Relay) => React.ReactNode;
}

// Helper function to get color based on status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'connecting':
      return 'bg-yellow-500';
    case 'error':
    case 'failed':
      return 'bg-red-500';
    case 'disconnected':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper to get score badge variant
const getScoreBadgeVariant = (score?: number): "default" | "secondary" | "outline" | "destructive" => {
  if (!score) return "secondary";
  if (score > 75) return "default";
  if (score > 50) return "secondary";
  if (score > 25) return "outline";
  return "destructive";
};

// Helper for circuit state badge variant
const getCircuitBadgeVariant = (state?: string): "default" | "secondary" | "outline" | "destructive" => {
  if (!state) return "secondary";
  switch (state) {
    case CircuitStateValues.CLOSED:
      return "default";
    case CircuitStateValues.HALF_OPEN:
      return "outline";
    case CircuitStateValues.OPEN:
      return "destructive";
    default:
      return "secondary";
  }
};

export const RelayList: React.FC<RelayListProps> = ({ relays, onRemoveRelay, isCurrentUser, renderRelayScore }) => {
  if (!relays || relays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground">No relays connected</p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Add relays to connect to the Nostr network
        </p>
      </div>
    );
  }
  
  // Group relays by status for better organization
  const connectedRelays = relays.filter(r => r.status === 'connected');
  const connectingRelays = relays.filter(r => r.status === 'connecting');
  const errorRelays = relays.filter(r => ['error', 'failed', 'disconnected'].includes(r.status as string));
  const unknownRelays = relays.filter(r => !['connected', 'connecting', 'error', 'failed', 'disconnected'].includes(r.status as string));
  
  // Combine in order of importance
  const orderedRelays = [
    ...connectedRelays,
    ...connectingRelays,
    ...unknownRelays,
    ...errorRelays
  ];
  
  return (
    <ScrollArea className="h-[50vh]">
      <div className="space-y-2 pr-4">
        {orderedRelays.map((relay) => (
          <div
            key={relay.url}
            className="flex items-center justify-between bg-muted/50 p-2 rounded-md hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span
                    className={`h-2 w-2 rounded-full ${getStatusColor(relay.status)} mr-2`}
                  />
                  <span className="font-mono text-xs md:text-sm truncate max-w-[200px] md:max-w-[300px]">
                    {relay.url}
                  </span>
                </div>
                
                <div className="flex items-center mt-1 space-x-2">
                  {relay.circuitStatus && (
                    <Badge 
                      variant={getCircuitBadgeVariant(relay.circuitStatus)}
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      {relay.circuitStatus}
                    </Badge>
                  )}
                  
                  {relay.score !== undefined && (
                    <Badge 
                      variant={getScoreBadgeVariant(relay.score)}
                      className="text-[10px] px-1 py-0 h-4"
                    >
                      {relay.score}/100
                    </Badge>
                  )}
                  
                  {relay.avgResponse !== undefined && (
                    <Badge 
                      variant="outline" 
                      className="text-[10px] px-1 py-0 h-4 flex items-center"
                    >
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {Math.round(relay.avgResponse)}ms
                    </Badge>
                  )}
                  
                  {relay.isRequired && (
                    <Badge className="text-[10px] px-1 py-0 h-4">
                      Required
                    </Badge>
                  )}

                  {/* Add custom score rendering if provided */}
                  {renderRelayScore && renderRelayScore(relay)}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {relay.read && <span>R</span>}
                {relay.write && <span>W</span>}
              </div>
              
              {isCurrentUser && onRemoveRelay && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-100/10 h-7 px-2"
                  onClick={() => onRemoveRelay(relay.url)}
                  disabled={relay.isRequired}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
