
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';

type RelayStatus = {
  url: string;
  status: number | string;
  read?: boolean;
  write?: boolean;
};

interface RelayContextType {
  relays: RelayStatus[];
  connectToDefaultRelays: () => Promise<void>;
  addRelay: (url: string) => Promise<boolean>;
  removeRelay: (url: string) => void;
}

const RelayContext = createContext<RelayContextType>({
  relays: [],
  connectToDefaultRelays: async () => {},
  addRelay: async () => false,
  removeRelay: () => {},
});

export const useRelayContext = () => useContext(RelayContext);

export const RelayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [relays, setRelays] = useState<RelayStatus[]>([]);

  // Update relay status on mount and every 5 seconds
  useEffect(() => {
    const updateRelayStatus = () => {
      const currentRelays = nostrService.getRelayStatus();
      setRelays(currentRelays);
    };

    updateRelayStatus();
    const interval = setInterval(updateRelayStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const connectToDefaultRelays = useCallback(async () => {
    await nostrService.connectToDefaultRelays();
    const currentRelays = nostrService.getRelayStatus();
    setRelays(currentRelays);
  }, []);

  const addRelay = useCallback(async (url: string) => {
    const result = await nostrService.addRelay(url);
    const currentRelays = nostrService.getRelayStatus();
    setRelays(currentRelays);
    return result;
  }, []);

  const removeRelay = useCallback((url: string) => {
    nostrService.removeRelay(url);
    const currentRelays = nostrService.getRelayStatus();
    setRelays(currentRelays);
  }, []);

  return (
    <RelayContext.Provider value={{ relays, connectToDefaultRelays, addRelay, removeRelay }}>
      {children}
    </RelayContext.Provider>
  );
};

export default RelayProvider;
