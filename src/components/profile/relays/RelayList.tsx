
import { Button } from "@/components/ui/button";
import { Wifi, X } from "lucide-react";
import { Relay } from "@/lib/nostr";

interface RelayListProps {
  relays: Relay[];
  isCurrentUser: boolean;
  onRemoveRelay?: (relayUrl: string) => void;
}

export const RelayList = ({ relays, isCurrentUser, onRemoveRelay }: RelayListProps) => {
  if (relays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Wifi className="h-8 w-8 mb-2 text-muted-foreground/50" />
        <p>No relays connected</p>
        <p className="text-xs mt-1">
          {isCurrentUser 
            ? "Add a relay above to start connecting" 
            : "This user hasn't shared their relay list"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm font-medium text-center mb-2">
        Connected to {relays.filter(r => r.status === 'connected').length} of {relays.length} relays
      </div>
      {relays.map((relay) => (
        <div 
          key={relay.url} 
          className="flex items-center justify-between bg-muted/50 p-3 rounded hover:bg-muted/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${
              relay.status === 'connected' ? 'bg-green-500' : 
              relay.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            <span className="text-sm font-mono truncate max-w-[300px]">{relay.url}</span>
          </div>
          {isCurrentUser && onRemoveRelay && (
            <Button 
              variant="ghost" 
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
              onClick={() => onRemoveRelay(relay.url)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </div>
      ))}
    </>
  );
};
