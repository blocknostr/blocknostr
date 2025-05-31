import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wifi, WifiOff, RefreshCw, Trash2, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

interface RelayDebugPanelProps {
  className?: string;
  compact?: boolean;
}

export const RelayDebugPanel: React.FC<RelayDebugPanelProps> = ({ 
  className = "", 
  compact = false 
}) => {
  const [relayStatus, setRelayStatus] = useState<any[]>([]);
  const [connectionAttempting, setConnectionAttempting] = useState(false);

  const refreshRelayStatus = async () => {
    try {
      const status = nostrService.getRelayStatus();
      setRelayStatus(status);
      console.log('[RelayDebugPanel] Current relay status:', status);
    } catch (error) {
      console.error('Error fetching relay status:', error);
    }
  };

  const connectToDefaultRelays = async () => {
    setConnectionAttempting(true);
    try {
      console.log('[RelayDebugPanel] Attempting to connect to default relays...');
      const connectedRelays = await nostrService.connectToDefaultRelays();
      console.log('[RelayDebugPanel] Connected relays:', connectedRelays);
      await refreshRelayStatus();
    } catch (error) {
      console.error('[RelayDebugPanel] Error connecting to default relays:', error);
    } finally {
      setConnectionAttempting(false);
    }
  };

  const addRelay = async (relayUrl: string) => {
    try {
      console.log(`[RelayDebugPanel] Adding relay: ${relayUrl}`);
      const success = await nostrService.addRelay(relayUrl);
      console.log(`[RelayDebugPanel] Add relay result: ${success}`);
      
      // Don't manually refresh here - let the event handler do it
      if (!success) {
        // Only refresh manually if the add failed (no event will be triggered)
        await refreshRelayStatus();
      }
    } catch (error) {
      console.error(`[RelayDebugPanel] Error adding relay ${relayUrl}:`, error);
      // Refresh on error to show current state
      await refreshRelayStatus();
    }
  };

  const removeRelay = (relayUrl: string) => {
    try {
      console.log(`[RelayDebugPanel] Removing relay: ${relayUrl}`);
      nostrService.removeRelay(relayUrl);
      
      // Don't manually refresh here - let the event handler do it
    } catch (error) {
      console.error(`[RelayDebugPanel] Error removing relay ${relayUrl}:`, error);
      // Refresh on error to show current state
      refreshRelayStatus();
    }
  };

  useEffect(() => {
    // Initial relay status
    refreshRelayStatus();
    
    // Set up event listeners for relay changes
    const handleRelayConnected = (relayUrl: string) => {
      console.log(`[RelayDebugPanel] Relay connected event: ${relayUrl}`);
      refreshRelayStatus();
    };
    
    const handleRelayDisconnected = (relayUrl: string) => {
      console.log(`[RelayDebugPanel] Relay disconnected event: ${relayUrl}`);
      refreshRelayStatus();
    };
    
    // Listen for relay events
    eventBus.on(EVENTS.RELAY_CONNECTED, handleRelayConnected);
    eventBus.on(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
    
    // Auto-refresh every 30 seconds (reduced frequency since we have events)
    const interval = setInterval(refreshRelayStatus, 30000);
    
    return () => {
      // Cleanup event listeners
      eventBus.off(EVENTS.RELAY_CONNECTED, handleRelayConnected);
      eventBus.off(EVENTS.RELAY_DISCONNECTED, handleRelayDisconnected);
      clearInterval(interval);
    };
  }, []);

  const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
  const connectingCount = relayStatus.filter(r => r.status === 'connecting').length;
  const disconnectedCount = relayStatus.filter(r => r.status === 'disconnected' || r.status === 'error').length;

  if (compact) {
    return (
      <Card className={`p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Relays</span>
            <Badge variant={connectedCount > 0 ? "default" : "destructive"}>
              {connectedCount}/{relayStatus.length}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={refreshRelayStatus}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            {connectedCount === 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={connectToDefaultRelays}
                disabled={connectionAttempting}
              >
                <Activity className={`w-3 h-3 ${connectionAttempting ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Relay Debug Panel</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshRelayStatus}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={connectToDefaultRelays}
              disabled={connectionAttempting}
            >
              <Activity className={`w-4 h-4 mr-2 ${connectionAttempting ? 'animate-spin' : ''}`} />
              Connect
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {connectedCount}
            </div>
            <div className="text-sm text-muted-foreground">Connected</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {connectingCount}
            </div>
            <div className="text-sm text-muted-foreground">Connecting</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {disconnectedCount}
            </div>
            <div className="text-sm text-muted-foreground">Disconnected</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {relayStatus.length}
            </div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Connection Status */}
        {connectedCount === 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">No Relays Connected</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Profile fetching will fail without connected relays. Click "Connect" to connect to default relays.
            </p>
          </div>
        )}

        {/* Relay List */}
        {relayStatus.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Relay Status</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {relayStatus.map((relay, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {relay.status === 'connected' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : relay.status === 'connecting' ? (
                          <Activity className="w-4 h-4 text-yellow-600 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-mono text-sm">{relay.url}</span>
                      </div>
                      <Badge 
                        variant={
                          relay.status === 'connected' ? 'default' : 
                          relay.status === 'connecting' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {relay.status}
                      </Badge>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRelay(relay.url)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => addRelay('wss://relay.damus.io')}
            >
              Add Damus
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addRelay('wss://relay.nostr.band')}
            >
              Add Nostr Band
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addRelay('wss://nos.lol')}
            >
              Add Nos.lol
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addRelay('wss://relay.snort.social')}
            >
              Add Snort
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addRelay('wss://relay.blocknostr.com')}
            >
              Add BlockNostr
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Relays are needed to fetch profile data from the NOSTR network</div>
          <div>• At least 1 connected relay is required for profile fetching</div>
          <div>• More relays generally means better data availability</div>
        </div>
      </div>
    </Card>
  );
};

export default RelayDebugPanel; 

