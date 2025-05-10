
import { useState, useEffect, useCallback } from "react";
import { useAlephiumWallet } from "@/lib/alephium";

export function useAlephium() {
  const { 
    isConnected, 
    address, 
    balances, 
    isLoading, 
    connect, 
    disconnect, 
    refreshBalances 
  } = useAlephiumWallet();
  
  // Format address for display
  const formatAddress = useCallback((addr: string): string => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }, []);

  // Get explorer URL for an address
  const getExplorerAddressUrl = useCallback((addr: string): string => {
    return `https://explorer.alephium.org/addresses/${addr}`;
  }, []);

  const isWalletAvailable = true; // With our direct implementation, this is always true

  const connectWallet = useCallback(async () => {
    const result = await connect();
    return result;
  }, [connect]);

  const disconnectWallet = useCallback(async () => {
    await disconnect();
  }, [disconnect]);

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
