import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { nostrService, Relay } from "@/lib/nostr";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Check, AlertCircle, Loader2, Network, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { relayPerformanceTracker } from "@/lib/nostr/relay/performance/relay-performance-tracker";

// Extended interface for relays with performance data
interface EnhancedRelay extends Relay {
  score?: number;
  avgResponse?: number;
}

const RelaysTab = () => {
  const [relays, setRelays] = useState<EnhancedRelay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prioritizedRelays, setPrioritizedRelays] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState<{[url: string]: boolean}>({});
  
  // Load relays on component mount and set up refresh interval
  useEffect(() => {
    const loadRelays = () => {
      // Get relay status with enhanced data
      const relayStatus = nostrService.getRelayStatus();
      
      // Map and sort relays by performance score
      const enhancedRelays = relayStatus.map(relay => {
        const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
        return {
          ...relay,
          score: perfData?.score || 50,
          avgResponse: perfData?.avgResponseTime
        };
      });
      
      // Sort relays by score (higher is better)
      enhancedRelays.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      // Get top 5 relay URLs (these are prioritized for connections)
      const topRelays = enhancedRelays.slice(0, 5).map(relay => relay.url);
      setPrioritizedRelays(topRelays);
      
      setRelays(enhancedRelays);
    };
    
    loadRelays();
    
    // Refresh relay status every 5 seconds
    const interval = setInterval(loadRelays, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    if (!newRelayUrl.startsWith("wss://")) {
      toast.error("Invalid relay URL", {
        description: "Relay URL must start with wss://"
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const success = await nostrService.addRelay(newRelayUrl);
      
      if (success) {
        toast.success("Relay connected", {
          description: `Successfully connected to ${newRelayUrl}`
        });
        setNewRelayUrl("");
        setRelays(nostrService.getRelayStatus());
      } else {
        toast.error("Connection failed", {
          description: `Could not connect to ${newRelayUrl}`
        });
      }
    } catch (error) {
      toast.error("Error connecting", {
        description: "An unexpected error occurred"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    setRelays(nostrService.getRelayStatus());
    toast.success("Relay removed", {
      description: `Removed relay: ${relayUrl}`
    });
  };

  const handleRefreshConnections = async () => {
    setIsRefreshing(true);
    toast.loading("Refreshing relay connections...");
    
    try {
      // Use the prioritized connection method
      await nostrService.connectToUserRelays();
      
      // Refresh the relay list with updated status
      const relayStatus = nostrService.getRelayStatus();
      const enhancedRelays = relayStatus.map(relay => {
        const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
        return {
          ...relay,
          score: perfData?.score || 50,
          avgResponse: perfData?.avgResponseTime
        };
      });
      
      // Update top 5 relays
      const topRelays = enhancedRelays
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5)
        .map(relay => relay.url);
        
      setPrioritizedRelays(topRelays);
      setRelays(enhancedRelays);
      
      toast.success("Relay connections refreshed", {
        description: `Connected to ${enhancedRelays.filter(r => r.status === 'connected').length} relays`
      });
    } catch (error) {
      toast.error("Failed to refresh connections");
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Test the performance of a specific relay
   */
  const testRelayPerformance = async (relayUrl: string) => {
    // Set testing state for this specific relay
    setIsTesting(prev => ({ ...prev, [relayUrl]: true }));
    
    try {
      // Disconnect from the relay first
      nostrService.removeRelay(relayUrl);
      
      // Small delay to ensure disconnect happened
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Start measuring connection time
      const startTime = performance.now();
      
      // Try to connect to the relay
      const connected = await nostrService.addRelay(relayUrl);
      
      // Calculate connection time
      const connectionTime = performance.now() - startTime;
      
      if (connected) {
        toast.success("Relay test complete", {
          description: `Connection time: ${Math.round(connectionTime)}ms`
        });
      } else {
        toast.error("Relay test failed", {
          description: "Could not connect to relay"
        });
      }
      
      // Refresh the relay list
      const relayStatus = nostrService.getRelayStatus();
      const enhancedRelays = relayStatus.map(relay => {
        const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
        return {
          ...relay,
          score: perfData?.score || 50,
          avgResponse: perfData?.avgResponseTime
        };
      });
      
      setRelays(enhancedRelays);
    } catch (error) {
      toast.error("Failed to test relay");
    } finally {
      setIsTesting(prev => ({ ...prev, [relayUrl]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'connected':
        return "bg-green-500/5 border-green-500/20";
      case 'connecting':
        return "bg-yellow-500/5 border-yellow-500/20";
      default:
        return "bg-red-500/5 border-red-500/20";
    }
  };
  
  const renderRelayScore = (relay: EnhancedRelay) => {
    if (relay.score === undefined) return null;
    
    // Determine badge variant based on score
    let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "default";
    
    if (relay.score >= 80) badgeVariant = "default";
    else if (relay.score >= 60) badgeVariant = "secondary";
    else if (relay.score >= 40) badgeVariant = "outline";
    else badgeVariant = "destructive";
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={badgeVariant} className="ml-2">
              {relay.score}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Relay performance score</p>
            {relay.avgResponse !== undefined && (
              <p className="text-xs">Avg. response: {Math.round(relay.avgResponse)}ms</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  return (
    <Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">          <Network className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-xl font-semibold">Relay Settings</CardTitle>            
            <CardDescription className="text-muted-foreground">
              Manage the Nostr relays you connect to. Top 5 performing relays (<Star className="inline h-3 w-3 text-yellow-500 fill-yellow-500" />) are prioritized for faster connections, followed by up to 15 additional relays for better network coverage.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newRelay" className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Relay
            </Label>
            <div className="flex items-center mt-1.5 gap-2">
              <Input 
                id="newRelay" 
                placeholder="wss://relay.example.com"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                className="focus:ring-1 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRelayUrl.trim()) {
                    handleAddRelay();
                  }
                }}
              />
              <Button 
                onClick={handleAddRelay}
                size="icon"
                disabled={isConnecting}
                className="transition-all duration-200"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">            <div className="flex items-center justify-between">
              <Label className="font-medium flex items-center gap-2">
                <Network className="h-4 w-4" />
                Connected Relays
                <Badge variant="outline" className="ml-1">
                  {relays.filter(r => r.status === 'connected').length}/{relays.length}
                </Badge>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const sorted = [...relays].sort((a, b) => ((b as any).score || 0) - ((a as any).score || 0));
                            setRelays(sorted);
                          }}
                        >
                          By Score
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sort relays by performance score</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const sorted = [...relays].sort((a, b) => {
                              if (a.status === 'connected' && b.status !== 'connected') return -1;
                              if (a.status !== 'connected' && b.status === 'connected') return 1;
                              return 0;
                            });
                            setRelays(sorted);
                          }}
                        >
                          By Status
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Sort relays by connection status</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshConnections}
                  disabled={isRefreshing}
                  className="h-8"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <Network className="h-4 w-4 mr-1" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {relays.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center justify-center p-6 border border-dashed rounded-md">
                <p>No relays connected yet. Add a relay above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar rounded-md border p-2">
                {relays.map((relay) => (
                  <div 
                    key={relay.url} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md transition-all",
                      getStatusClass(relay.status),
                      "hover:shadow-sm animate-fade-in"
                    )}
                  >                    <div className="flex items-center gap-3 overflow-hidden">
                      {getStatusIcon(relay.status)}
                      <span className="text-sm truncate">{relay.url}</span>
                      <Badge 
                        variant={relay.status === 'connected' ? 'default' : 'outline'} 
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4",
                          relay.status === 'connected' ? "bg-green-600/90" : "text-muted-foreground"
                        )}
                      >
                        {relay.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </Badge>                      {prioritizedRelays.includes(relay.url) && (
                        <TooltipProvider>
                          <Tooltip>                            <TooltipTrigger>
                              <div className="relative">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="absolute inset-0 animate-ping-slow rounded-full bg-yellow-400 opacity-30"></span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-semibold">Priority Relay</p>
                              <p className="text-xs max-w-[250px] mt-1">This is one of your top 5 highest-performing relays. These are connected to first for better initial performance, followed by up to 15 additional relays for complete network coverage.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {renderRelayScore(relay as EnhancedRelay)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => handleRemoveRelay(relay.url)}
                        title="Remove relay"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                        onClick={() => testRelayPerformance(relay.url)}
                        title="Test relay performance"
                        disabled={isTesting[relay.url]}
                      >
                        {isTesting[relay.url] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Network className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>                ))}
              </div>
            )}
            
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                <h4 className="text-sm font-medium mb-1 flex items-center gap-1.5">
                  <Network className="h-3.5 w-3.5" /> Smart Connection Strategy
                </h4>
                <p className="text-xs leading-relaxed">
                  BlockNostr connects to your relays using a smart prioritization system:
                </p>
                <ol className="text-xs list-decimal list-inside mt-1 space-y-0.5 ml-1">
                  <li>First connects to your top 5 highest-performing relays (<Star className="inline h-3 w-3 text-yellow-500 fill-yellow-500" />)</li>
                  <li>After a short delay, connects to up to 15 additional trusted relays</li>
                  <li>Relays are scored based on response time, success rate, and recency</li>
                </ol>
                <p className="text-xs mt-1.5 text-muted-foreground italic">This ensures fast initial connection while maintaining good network coverage.</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RelaysTab;
