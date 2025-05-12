
import { useState, useCallback, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';

export function useProfileRefresh() {
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Set up listeners for refresh events
  useEffect(() => {
    const handleRefetchEvents = (e: Event) => {
      console.log("Received refetch event");
      setRefreshCounter(prev => prev + 1);
    };
    
    window.addEventListener('refetchProfile', handleRefetchEvents);
    window.addEventListener('refetchPosts', handleRefetchEvents);
    window.addEventListener('refetchRelations', handleRefetchEvents);
    
    return () => {
      window.removeEventListener('refetchProfile', handleRefetchEvents);
      window.removeEventListener('refetchPosts', handleRefetchEvents);
      window.removeEventListener('refetchRelations', handleRefetchEvents);
    };
  }, []);
  
  // Function to refresh all profile data
  const refreshProfile = useCallback(async () => {
    console.log("Refreshing all profile data");
    
    // Ensure we're connected to relays
    await nostrService.connectToUserRelays();
    
    // Add more popular relays to increase chances of success
    await nostrService.addMultipleRelays([
      "wss://relay.damus.io", 
      "wss://nos.lol", 
      "wss://relay.nostr.band",
      "wss://relay.snort.social",
      "wss://nostr.mutinywallet.com"
    ]).catch(err => console.warn("Error adding additional relays:", err));
    
    // Update the refresh counter to trigger rerender
    setRefreshCounter(prev => prev + 1);
    
    // Wait a bit to allow data to load
    return new Promise<void>(resolve => setTimeout(resolve, 2000));
  }, []);
  
  return {
    refreshCounter,
    refreshProfile
  };
}
