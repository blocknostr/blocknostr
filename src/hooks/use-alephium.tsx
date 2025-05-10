
import { useState, useEffect, useCallback } from "react";
import { alephiumService, WalletBalance } from "@/lib/alephium";

export function useAlephium() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize and check connection status
  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      const connected = alephiumService.isWalletConnected();
      setIsConnected(connected);
      
      if (connected) {
        setAddress(alephiumService.getCurrentAddress());
        const fetchedBalances = await alephiumService.fetchBalances();
        setBalances(fetchedBalances);
      }
      
      setIsLoading(false);
    };
    
    checkConnection();
    alephiumService.setupEventListeners();
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    const success = await alephiumService.connectWallet();
    
    if (success) {
      setIsConnected(true);
      setAddress(alephiumService.getCurrentAddress());
      const fetchedBalances = await alephiumService.fetchBalances();
      setBalances(fetchedBalances);
    }
    
    setIsLoading(false);
    return success;
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    await alephiumService.disconnect();
    setIsConnected(false);
    setAddress(null);
    setBalances([]);
  }, []);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (isConnected) {
      setIsLoading(true);
      const fetchedBalances = await alephiumService.fetchBalances();
      setBalances(fetchedBalances);
      setIsLoading(false);
    }
  }, [isConnected]);

  // Format address for display
  const formatAddress = useCallback((addr: string): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }, []);

  return {
    isConnected,
    address,
    formatAddress,
    balances,
    isLoading,
    connectWallet,
    disconnectWallet,
    refreshBalances
  };
}
