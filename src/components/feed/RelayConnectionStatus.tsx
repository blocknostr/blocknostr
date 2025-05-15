
import React from 'react';
import { useRelayContext } from '@/components/providers/relay-provider';
import { Badge } from '@/components/ui/badge';

/**
 * Component that shows the current relay connection status
 */
export default function RelayConnectionStatus() {
  const { relays } = useRelayContext();
  const [connected, setConnected] = React.useState(0);
  const [total, setTotal] = React.useState(0);
  
  React.useEffect(() => {
    if (relays && relays.length > 0) {
      const connectedRelays = relays.filter(relay => {
        // Convert status to string for comparison
        const status = String(relay.status);
        return status === '1' || status === 'connected';
      });
      setConnected(connectedRelays.length);
      setTotal(relays.length);
    } else {
      setConnected(0);
      setTotal(0);
    }
  }, [relays]);
  
  // Different colors based on connection status
  let statusColor = "bg-red-500";
  if (connected > 0) {
    statusColor = connected === total ? "bg-green-500" : "bg-yellow-500";
  }
  
  return (
    <Badge variant="outline" className="text-xs font-normal">
      <span className={`w-2 h-2 rounded-full mr-1.5 ${statusColor}`} />
      {connected}/{total} relays
    </Badge>
  );
}
