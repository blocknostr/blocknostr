
import { Relay } from "@/lib/nostr";
import { ArrowUpDown, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { circuitBreaker, CircuitState } from "@/lib/nostr/relay/circuit/circuit-breaker";

interface RelayListProps {
  relays: Relay[];
  isCurrentUser: boolean;
  onRemoveRelay?: (url: string) => void;
  renderRelayScore?: (relay: Relay) => React.ReactNode;
}

export function RelayList({ relays, isCurrentUser, onRemoveRelay, renderRelayScore }: RelayListProps) {
  const [sortField, setSortField] = useState<'url' | 'status' | 'score'>('status');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sort relays based on the selected field and direction
  const sortedRelays = [...relays].sort((a, b) => {
    if (sortField === 'url') {
      return sortDirection === 'asc' 
        ? a.url.localeCompare(b.url) 
        : b.url.localeCompare(a.url);
    } else if (sortField === 'status') {
      // For status: connected > disconnected > failed
      const statusOrder: Record<string, number> = {
        connected: 3,
        disconnected: 2,
        failed: 1
      };
      
      const aValue = statusOrder[a.status as string] || 0;
      const bValue = statusOrder[b.status as string] || 0;
      
      return sortDirection === 'asc' 
        ? aValue - bValue 
        : bValue - aValue;
    } else if (sortField === 'score' && a.score !== undefined && b.score !== undefined) {
      return sortDirection === 'asc' 
        ? a.score - b.score 
        : b.score - a.score;
    }
    return 0;
  });

  // Handle sort toggle
  const handleSortChange = (field: 'url' | 'status' | 'score') => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending for status and score, ascending for URL
      setSortField(field);
      setSortDirection(field === 'url' ? 'asc' : 'desc');
    }
  };

  // Render status indicator with tooltips
  const renderStatus = (relay: Relay) => {
    const circuitState = circuitBreaker.getState(relay.url);
    
    if (relay.status === 'connected') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="ml-1.5 text-green-600">Connected</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connected and working</p>
              {relay.avgResponse !== undefined && (
                <p className="text-xs">Response time: {Math.round(relay.avgResponse)}ms</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (relay.status === 'failed' || circuitState === CircuitState.OPEN) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="ml-1.5 text-red-600">Failed</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connection failed</p>
              <p className="text-xs">This relay will be temporarily skipped</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="ml-1.5 text-amber-600">Disconnected</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Not currently connected</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm font-medium mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => handleSortChange('url')}
        >
          URL <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === 'url' ? 'opacity-100' : 'opacity-30'}`} />
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleSortChange('score')}
          >
            Score <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === 'score' ? 'opacity-100' : 'opacity-30'}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleSortChange('status')}
          >
            Status <ArrowUpDown className={`ml-1 h-3 w-3 ${sortField === 'status' ? 'opacity-100' : 'opacity-30'}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {sortedRelays.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No relays found.</div>
        ) : (
          sortedRelays.map((relay) => (
            <div
              key={relay.url}
              className={`
                flex items-center justify-between p-3 rounded-md border
                ${relay.status === 'connected' 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50' 
                  : relay.status === 'failed' || circuitBreaker.getState(relay.url) === CircuitState.OPEN
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50'
                    : 'bg-background border-muted'}
              `}
            >
              <div className="flex flex-col flex-1 mr-4 truncate">
                <div className="flex items-center">
                  <span className="truncate text-sm font-medium">{relay.url}</span>
                  {relay.read && !relay.write && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 ml-1 text-blue-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Read-only relay</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {renderRelayScore && renderRelayScore(relay)}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {renderStatus(relay)}

                {isCurrentUser && onRemoveRelay && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                    onClick={() => onRemoveRelay(relay.url)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
