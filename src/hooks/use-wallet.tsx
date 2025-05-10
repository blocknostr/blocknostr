
import { useState, useEffect } from 'react';
import { alephiumService } from '@/lib/alephium';
import { AlephiumWalletState } from '@/lib/alephium/types';

export function useWallet() {
  const [walletState, setWalletState] = useState<AlephiumWalletState>(alephiumService.state);
  
  useEffect(() => {
    // Update state when wallet connects
    const handleConnect = () => {
      setWalletState(alephiumService.state);
    };
    
    // Update state when wallet disconnects
    const handleDisconnect = () => {
      setWalletState(alephiumService.state);
    };
    
    // Update state when balance changes
    const handleBalanceChange = () => {
      setWalletState(alephiumService.state);
    };
    
    // Update state when network changes
    const handleNetworkChange = () => {
      setWalletState(alephiumService.state);
    };
    
    // Listen for events
    alephiumService.on('connect', handleConnect);
    alephiumService.on('disconnect', handleDisconnect);
    alephiumService.on('balanceChanged', handleBalanceChange);
    alephiumService.on('networkChanged', handleNetworkChange);
    
    return () => {
      // Clean up event listeners
      alephiumService.off('connect', handleConnect);
      alephiumService.off('disconnect', handleDisconnect);
      alephiumService.off('balanceChanged', handleBalanceChange);
      alephiumService.off('networkChanged', handleNetworkChange);
    };
  }, []);
  
  return {
    ...walletState,
    connect: alephiumService.connect.bind(alephiumService),
    disconnect: alephiumService.disconnect.bind(alephiumService),
    sendTransaction: alephiumService.sendTransaction.bind(alephiumService),
    signMessage: alephiumService.signMessage.bind(alephiumService),
    formatAddress: alephiumService.formatAddress.bind(alephiumService),
  };
}
