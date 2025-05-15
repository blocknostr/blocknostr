
import React from 'react';
import { useRelayContext } from '@/components/providers/relay-provider';
import { CircleX, CircleCheck, CircleAlert } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function ConnectionStatusBanner() {
  const { relays, connectToDefaultRelays } = useRelayContext();
  const [hasConnectedRelays, setHasConnectedRelays] = React.useState(false);

  React.useEffect(() => {
    // Check if we have any connected relays
    if (relays && relays.length > 0) {
      const connected = relays.filter(relay => {
        // Convert status to string for comparison
        const status = String(relay.status);
        return status === '1' || status === 'connected';
      });
      setHasConnectedRelays(connected.length > 0);
    }
  }, [relays]);

  if (hasConnectedRelays) {
    return null;
  }

  return (
    <Alert variant="default" className="mb-4 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start">
        <CircleAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2" />
        <div className="flex-1">
          <AlertTitle className="font-medium text-sm text-yellow-800 dark:text-yellow-300">
            Not connected to any relays
          </AlertTitle>
          <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-400">
            Your feed may not be up-to-date or you might not be able to post.
          </AlertDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs ml-2 border-yellow-300 dark:border-yellow-700"
          onClick={connectToDefaultRelays}
        >
          Connect
        </Button>
      </div>
    </Alert>
  );
}

export default ConnectionStatusBanner;
