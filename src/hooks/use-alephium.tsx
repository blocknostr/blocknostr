
import { useState, useEffect, useCallback } from "react";
import { alephiumService, WalletBalance } from "@/lib/alephium";
import { useWallet, useAccount, useBalance, useNetwork } from "@alephium/web3-react";

export function useAlephium() {
  const { connectionStatus, connect, disconnect, address } = useWallet();
  const { explorer } = useNetwork();
  const { balance: alphBalance, tokenBalances, loading, refetch } = useBalance();
  
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isWalletAvailable = true; // With WalletConnect this is always true as it's web-based
  
  // Check if connected
  const isConnected = connectionStatus === "connected" && !!address;

  // Update service and local state when wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      alephiumService.setCurrentAddress(address);
    } else {
      alephiumService.setCurrentAddress(null);
    }
  }, [isConnected, address]);
  
  // Update balances when they change
  useEffect(() => {
    if (isConnected && address && alphBalance) {
      const formattedBalances = alephiumService.formatBalances({
        balance: alphBalance,
        tokenBalances: tokenBalances
      });
      
      setBalances(formattedBalances);
      alephiumService.setBalances(formattedBalances);
    } else {
      setBalances([]);
      alephiumService.setBalances([]);
    }
  }, [isConnected, address, alphBalance, tokenBalances]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    try {
      await connect();
      return true;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error(`Failed to connect wallet: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [connect]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast.error(`Failed to disconnect: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }, [disconnect]);

  // Refresh balances
  const refreshBalances = useCallback(async () => {
    if (isConnected) {
      setIsLoading(true);
      try {
        await refetch();
        toast.success("Balances refreshed");
      } catch (error) {
        console.error("Failed to refresh balances:", error);
        toast.error("Failed to refresh balances");
      } finally {
        setIsLoading(false);
      }
    }
  }, [isConnected, refetch]);

  // Format address for display
  const formatAddress = useCallback((addr: string): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }, []);

  // Get explorer URL for an address
  const getExplorerAddressUrl = useCallback((addr: string): string => {
    return `${explorer}/addresses/${addr}`;
  }, [explorer]);

  return {
    isConnected,
    address,
    formatAddress,
    balances,
    isLoading,
    connectWallet,
    disconnectWallet,
    refreshBalances,
    isWalletAvailable,
    getExplorerAddressUrl
  };
}
